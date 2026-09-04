/* ===========================================================
   PRIT KOTAS — pengaduan.js
   Fungsi: ajukan pengaduan publik (tanpa login & tanpa akun),
   input manual oleh staf, kelola status oleh staf.
   Tidak ada fitur pelacakan Kode Tiket — pelapor akan
   dihubungi langsung oleh BPS via email/telepon/WA yang diisi.
   =========================================================== */

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getCountFromServer,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { unggahKeCloudinary } from "./cloudinary-config.js";

const KOLEKSI = "pengaduan";

/* -------------------------------------------------------
   Label kategori & materi pengaduan (sesuai formulir resmi)
------------------------------------------------------- */
export const DAFTAR_KATEGORI_PENGADUAN = [
  "Masyarakat",
  "Instansi Pemerintah/Lembaga Negara",
  "Pegawai BPS",
  "Laporan Kedinasan (Pusat dan Daerah)",
  "Pelajar/Mahasiswa"
];

export const DAFTAR_MATERI_PENGADUAN = [
  "Pelanggaran Sumpah Jabatan",
  "Pelanggaran terhadap peraturan disiplin PNS",
  "Pelanggaran Hukum Pidana",
  "Mal Administrasi",
  "Pelayanan publik yang tidak memuaskan (dapat merugikan pihak-pihak yang berkepentingan)"
];

/* Detail dengan ikon & deskripsi singkat, untuk tampilan kartu pilihan */
export const DETAIL_KATEGORI_PENGADUAN = [
  { value: "Masyarakat", ikon: "👥", desc: "Pelapor adalah warga masyarakat umum." },
  { value: "Instansi Pemerintah/Lembaga Negara", ikon: "🏛️", desc: "Pelapor berasal dari instansi pemerintah/lembaga negara." },
  { value: "Pegawai BPS", ikon: "👔", desc: "Pelapor adalah pegawai internal BPS." },
  { value: "Laporan Kedinasan (Pusat dan Daerah)", ikon: "📑", desc: "Laporan resmi dari unit kedinasan pusat/daerah." },
  { value: "Pelajar/Mahasiswa", ikon: "🎓", desc: "Pelapor berstatus pelajar atau mahasiswa." }
];

export const DETAIL_MATERI_PENGADUAN = [
  { value: "Pelanggaran Sumpah Jabatan", ikon: "⚖️", desc: "Pelanggaran terhadap sumpah/janji jabatan pegawai." },
  { value: "Pelanggaran terhadap peraturan disiplin PNS", ikon: "📏", desc: "Ketidakpatuhan terhadap aturan disiplin PNS." },
  { value: "Pelanggaran Hukum Pidana", ikon: "🚨", desc: "Dugaan tindak pidana yang melibatkan pegawai BPS." },
  { value: "Mal Administrasi", ikon: "📋", desc: "Penyimpangan prosedur administrasi." },
  { value: "Pelayanan publik yang tidak memuaskan (dapat merugikan pihak-pihak yang berkepentingan)", ikon: "😞", desc: "Layanan yang merugikan pihak berkepentingan." }
];

export const LABEL_STATUS = {
  menunggu: "Menunggu",
  diproses: "Diproses",
  selesai: "Selesai"
};

/* -------------------------------------------------------
   Upload berkas bukti ke Cloudinary, kembalikan
   daftar {nama, url}. Folder dikelompokkan per-tanggal saja
   (bukan per-kode-tiket lagi, karena fitur itu dihapus).
------------------------------------------------------- */
async function unggahBuktiPengaduan(fileList) {
  const hasil = [];
  const files = Array.from(fileList || []);
  const folder = `bukti-pengaduan/${new Date().toISOString().slice(0, 10)}`;
  for (const file of files) {
    const url = await unggahKeCloudinary(file, folder);
    hasil.push({ nama: file.name, url });
  }
  return hasil;
}

/* -------------------------------------------------------
   NOMOR ANTRIAN (AKUNTABILITAS)
   Memberi pelapor kepastian posisi laporan mereka dalam antrian.
------------------------------------------------------- */
export async function ambilNomorAntrianBerikutnya() {
  const snap = await getCountFromServer(collection(db, KOLEKSI));
  return snap.data().count + 1;
}

/* -------------------------------------------------------
   AJUKAN PENGADUAN PUBLIK (tanpa login, tanpa akun)
   data: { email, namaLengkap, noTelepon, kategoriPengaduan,
           materiPengaduan, isiPengaduan }
   fileList: FileList dari <input type="file" multiple>
   Mengembalikan nomor antrian pelapor (mis. laporan ke-15)
------------------------------------------------------- */
export async function ajukanPengaduanPublik(data, fileList) {
  const bukti = await unggahBuktiPengaduan(fileList);
  const nomorAntrian = await ambilNomorAntrianBerikutnya();

  await addDoc(collection(db, KOLEKSI), {
    ...data,
    email: data.email.trim().toLowerCase(),
    bukti,
    nomorAntrian,
    status: "menunggu",
    tanggapan: "",
    sumberInput: "publik",
    diinputOleh: null,
    dibuatPada: new Date().toISOString(),
    diperbaruiPada: new Date().toISOString()
  });

  return nomorAntrian;
}

/* -------------------------------------------------------
   INPUT PENGADUAN MANUAL OLEH STAF
   (untuk pelapor yang datang/lapor langsung ke kantor BPS)
------------------------------------------------------- */
export async function inputPengaduanManual(data, fileList, namaStaf) {
  const bukti = await unggahBuktiPengaduan(fileList);
  const { status, ...dataLain } = data;
  const nomorAntrian = await ambilNomorAntrianBerikutnya();

  await addDoc(collection(db, KOLEKSI), {
    ...dataLain,
    email: dataLain.email.trim().toLowerCase(),
    bukti,
    nomorAntrian,
    status: status || "menunggu",
    tanggapan: "",
    sumberInput: "manual-admin",
    diinputOleh: namaStaf,
    dibuatPada: new Date().toISOString(),
    diperbaruiPada: new Date().toISOString()
  });

  return nomorAntrian;
}

/* -------------------------------------------------------
   LAPORAN ANTI-GRATIFIKASI (khusus diinput staf/admin)
   Berbeda dari pengaduan pelanggaran biasa — ini laporan
   penerimaan gratifikasi oleh pegawai BPS.
------------------------------------------------------- */
const KOLEKSI_GRATIFIKASI = "gratifikasi";

export async function ajukanLaporanGratifikasi(data, fileList, namaStaf) {
  const foto = await unggahBuktiPengaduan(fileList);

  await addDoc(collection(db, KOLEKSI_GRATIFIKASI), {
    namaPemberi: data.namaPemberi,
    instansiPemberi: data.instansiPemberi,
    bentukPemberian: data.bentukPemberian, // array of strings
    alasanPenerimaan: data.alasanPenerimaan,
    foto,
    diinputOleh: namaStaf,
    timestamp: new Date().toISOString()
  });
}

export function pantauSemuaGratifikasi(callback) {
  const q = query(collection(db, KOLEKSI_GRATIFIKASI), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
}

/* -------------------------------------------------------
   SARAN & MASUKAN (fitur terpisah dari pengaduan pelanggaran)
   Untuk masukan umum terhadap layanan/sistem PRIT KOTAS.
------------------------------------------------------- */
const KOLEKSI_MASUKAN = "masukan";

export async function kirimSaran(pesan) {
  await addDoc(collection(db, KOLEKSI_MASUKAN), {
    pesan,
    dibuatPada: new Date().toISOString()
  });
}

export function pantauSemuaSaran(callback) {
  const q = query(collection(db, KOLEKSI_MASUKAN), orderBy("dibuatPada", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
}

/* -------------------------------------------------------
   CEK STATUS PENGADUAN PUBLIK — berdasarkan EMAIL saja
   (tanpa akun, tanpa kode tiket). Mengembalikan semua
   pengaduan yang pernah dikirim dengan email tersebut,
   terbaru lebih dulu.

   CATATAN KEAMANAN: karena tanpa akun/kode, siapa pun yang
   tahu sebuah email bisa melihat status pengaduan terkait
   email itu. Untuk produksi dengan data sensitif, pertimbangkan
   menambah verifikasi (mis. link sekali-pakai lewat email)
   lewat Cloud Functions — lihat catatan di PANDUAN-SETUP.md.
------------------------------------------------------- */
export async function cariPengaduanByEmail(email) {
  const q = query(
    collection(db, KOLEKSI),
    where("email", "==", email.trim().toLowerCase()),
    orderBy("dibuatPada", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* -------------------------------------------------------
   PANTAU SEMUA PENGADUAN (khusus staf BPS, real-time)
------------------------------------------------------- */
export function pantauSemuaPengaduan(callback) {
  const q = query(collection(db, KOLEKSI), orderBy("dibuatPada", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
}

/* -------------------------------------------------------
   UPDATE STATUS + TANGGAPAN (oleh staf BPS)
------------------------------------------------------- */
export async function updateStatusPengaduan(id, status, tanggapan) {
  return updateDoc(doc(db, KOLEKSI, id), {
    status,
    tanggapan: tanggapan || "",
    diperbaruiPada: new Date().toISOString()
  });
}
