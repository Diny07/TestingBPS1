# Panduan Alur Sistem PRIT KOTAS (untuk Desain UI/UX)

Dokumen ini merinci alur, elemen, dan kondisi setiap halaman pada sistem **Whistle Blowing System BPS Kota Tasikmalaya**, sebagai acuan saat mendesain tampilan (wireframe/mockup/hi-fi UI).

---

## 1. Peta Situs (Sitemap)

```
PUBLIK (tanpa login)                    ADMIN/STAF (wajib login)
├── index.html          (beranda)        ├── login.html
├── pengaduan.html       (form)           ├── dashboard-staf.html
└── cek-status.html      (lacak)          └── input-manual.html
```

## 2. Peran Pengguna

| Peran | Akses | Titik Masuk |
|---|---|---|
| Masyarakat / Pelapor | Tanpa akun | Beranda → tombol aksi |
| Staf/Admin BPS | Login wajib | `login.html` |

## 3. Palet Warna & Makna Status (acuan desain)

| Warna | Kode | Makna |
|---|---|---|
| 🔵 Biru (`--biru-utama`) | `#14509E` | Identitas utama, status "Diproses" |
| 🟢 Hijau (`--hijau-sukses`) | `#2E7D32` | Status "Selesai", keberhasilan |
| 🟠 Jingga (`--jingga-proses`) | `#F57C00` | Status "Menunggu", perhatian, aksi staf |

Elemen signature yang konsisten di semua halaman: **status-pill** (badge bulat) dan **alur-status** (titik + garis 3 tahap: Menunggu → Diproses → Selesai).

---

## 4. Detail Per Halaman

### 4.1 `index.html` — Beranda

**Tujuan:** Titik masuk utama, mengarahkan pengunjung ke 3 aksi tanpa hambatan (tanpa login).

**Elemen UI:**
- Navbar: logo + "Cek Status Pengaduan" + tombol "Login Admin"
- Hero: judul, teks disclaimer kerahasiaan identitas
- 3 kartu aksi besar (grid horizontal, tumpuk vertikal di mobile): Ajukan Pengaduan (biru), Chat WhatsApp (hijau), Cek Status (jingga)
- Section Hak-Hak: 3 kartu (Pelapor/Terlapor/Pemeriksa)
- Section Kontak: alamat, email, telepon, WA (card biru gelap)
- Footer

**Alur pengguna:**
1. Pengunjung tiba di beranda
2. Membaca disclaimer kerahasiaan → membangun kepercayaan
3. Memilih salah satu dari 3 aksi:
   - Klik **Ajukan Pengaduan** → ke `pengaduan.html`
   - Klik **Chat WhatsApp** → buka tab baru `wa.me` dengan pesan pra-isi
   - Klik **Cek Status** → ke `cek-status.html`
4. (Opsional) Staf klik **Login Admin** di navbar → ke `login.html`

**Kondisi/State:** Statis, tidak ada loading/error (murni informatif).

**Catatan UI/UX:** Ini "wajah" WBS — perlu terasa **resmi & terpercaya** (instansi pemerintah), bukan playful. Disclaimer kerahasiaan harus menonjol di atas fold agar pelapor tidak ragu.

---

### 4.2 `pengaduan.html` — Form Pengaduan Publik

**Tujuan:** Mengumpulkan laporan lengkap dari pelapor tanpa akun.

**Elemen UI:**
- Form 1 kolom: Email, Nama Lengkap, No. Telepon, radio Kategori Pengaduan (5 opsi), radio Materi Pengaduan (5 opsi), box kriteria pengaduan, textarea isi pengaduan, input file (multi, maks 10 file/10MB), tombol submit
- Alert error (muncul di atas form jika validasi gagal)
- Preview daftar file yang dipilih

**Alur pengguna:**
1. Isi seluruh field wajib
2. Pilih kategori & materi pengaduan (radio card, bukan dropdown — agar semua opsi terlihat)
3. Baca kriteria pengaduan (box jingga) sebagai panduan menulis
4. Tulis isi pengaduan
5. Upload bukti (foto/dokumen/rekaman) → nama file muncul di bawah input
6. Klik **Kirim Pengaduan**
7. Sistem validasi client-side (field kosong, jumlah/ukuran file)
8. **Jika valid:** file diunggah ke Storage → data disimpan → tampil pesan konfirmasi terkirim
9. **Jika gagal kirim:** alert error, tombol submit aktif kembali

**Kondisi/State:**
- Idle (form kosong)
- Error validasi (highlight field bermasalah + pesan alert merah)
- Loading (tombol "Mengirim..." nonaktif)
- Sukses (form disembunyikan, ganti dengan card konfirmasi terkirim)

**Catatan UI/UX:** Ini form terpanjang di sistem — pecah jadi beberapa section bernomor (Data Diri → Kategori & Materi → Isi Laporan → Bukti) dengan sidebar "Proses Pengaduan" seperti pada rancangan terbaru, agar tidak terasa berat.

---

### 4.3 `cek-status.html` — Lacak Status Pengaduan

**Tujuan:** Memberi transparansi tahapan laporan tanpa mewajibkan akun (memenuhi hak pelapor: "mendapatkan informasi tahapan laporan").

**Elemen UI:**
- View 1 — Form pencarian: input Email saja, tombol "Cari Laporan"
- View 2 — Detail hasil: kode tiket, status-pill, alur-status (3 tahap visual), kategori, materi, isi pengaduan, box tanggapan (jika staf sudah membalas), tombol "Cek Kode Lain"

**Alur pengguna:**
1. Masukkan email yang sama seperti saat mengajukan pengaduan
2. Klik **Cari Laporan**
3. **Jika ditemukan:** tampil satu atau beberapa kartu laporan (jika pernah mengajukan lebih dari sekali) lengkap dengan alur status visual
4. **Jika tidak ditemukan:** alert error, tetap di form pencarian

**Kondisi/State:** Idle → Loading ("Mencari...") → Ditemukan (tampil detail) / Tidak ditemukan (alert error)

**Catatan UI/UX:** Alur-status (Menunggu→Diproses→Selesai) adalah elemen paling penting di halaman ini — pastikan besar & jelas secara visual, karena inilah jawaban utama yang dicari pelapor. Tanggapan staf sebaiknya ditonjolkan dengan warna hijau lembut agar terasa positif/responsif.

---

### 4.4 `login.html` — Login Admin

**Tujuan:** Gerbang akses khusus staf BPS, memisahkan area publik dan internal.

**Elemen UI:**
- Panel kiri (visual): judul "Portal Admin", deskripsi singkat, mini-legend 3 status
- Panel kanan (form): input email, password, tombol Masuk, link kembali ke form pengaduan (bagi yang salah masuk)

**Alur pengguna:**
1. Staf isi email + password
2. Klik Masuk
3. **Jika berhasil & role = staf:** redirect ke `dashboard-staf.html`
4. **Jika gagal (password salah/bukan staf):** alert error, tetap di halaman

**Kondisi/State:** Idle → Loading ("Memproses...") → Error (alert merah) → Sukses (redirect)

**Catatan UI/UX:** Halaman ini sengaja terpisah gaya dari halaman publik (lebih "serius"/internal-tool) agar staf merasa berada di area kerja, bukan area layanan publik.

---

### 4.5 `dashboard-staf.html` — Dashboard Kelola Pengaduan

**Tujuan:** Pusat kerja staf — meninjau, memfilter, dan menindaklanjuti seluruh pengaduan.

**Elemen UI:**
- Navbar: nama staf yang login, tombol "+ Input Manual", tombol Keluar
- 3 stat card (jumlah Menunggu/Diproses/Selesai)
- Toolbar: filter chip (Semua/Menunggu/Diproses/Selesai) + kotak pencarian (kode tiket/nama)
- List card pengaduan, tiap card berisi: badge sumber (Publik/Manual), kategori, kode tiket, status-pill, data pelapor, materi, isi pengaduan, lampiran bukti (link unduh), dropdown ubah status, input tanggapan, tombol Simpan

**Alur pengguna:**
1. Staf login → data pengaduan dimuat real-time
2. Lihat ringkasan angka di stat card
3. Filter berdasarkan status, atau cari kode tiket/nama tertentu
4. Buka salah satu card pengaduan → baca detail & bukti
5. Ubah status via dropdown, tulis tanggapan
6. Klik **Simpan** → data ter-update (tombol jadi "Tersimpan ✓" sesaat)
7. (Opsional) Klik **+ Input Manual** untuk mencatat laporan yang datang langsung

**Kondisi/State:**
- Loading awal ("Memuat data pengaduan...")
- Kosong (empty state jika filter tidak menghasilkan apa pun)
- Menyimpan (tombol per-card nonaktif sesaat)
- Real-time update (data berubah otomatis tanpa refresh saat ada pengaduan baru masuk)

**Catatan UI/UX:** Ini halaman terpadat — prioritaskan **scan-ability**: status-pill dan badge sumber harus bisa dibaca sekilas tanpa membuka detail. Pertimbangkan card bisa di-collapse/expand agar staf tidak perlu scroll panjang saat pengaduan sudah banyak.

---

### 4.6 `input-manual.html` — Input Pengaduan Manual (Staf)

**Tujuan:** Mencatat pengaduan yang disampaikan langsung/tatap muka ke kantor BPS, agar tetap tercatat dalam satu sistem.

**Elemen UI:** Sama seperti `pengaduan.html`, ditambah:
- Badge "Input Manual oleh Staf" di atas form
- Field tambahan: dropdown Status Awal (Menunggu/Diproses)
- Bukti bersifat opsional (staf mungkin belum punya file digital saat itu juga)

**Alur pengguna:**
1. Staf login (proteksi halaman otomatis cek role)
2. Isi data sesuai keterangan pelapor tatap muka
3. Klik **Simpan Pengaduan**
4. Sistem menyimpan data → tampil konfirmasi tersimpan
5. Staf bisa klik "Input Pengaduan Lain" untuk mencatat laporan berikutnya secara berurutan

**Kondisi/State:** Idle → Loading ("Menyimpan...") → Sukses (tampil konfirmasi) → Error (alert, tetap di form)

**Catatan UI/UX:** Karena dipakai berulang kali dalam sesi kerja (banyak pelapor datang berurutan), tombol "Input Pengaduan Lain" penting untuk mempercepat alur — hindari staf harus navigasi ulang dari dashboard tiap kali.

---

## 5. Komponen Reusable (untuk Design System)

| Komponen | Dipakai di | Varian |
|---|---|---|
| Status Pill | cek-status, dashboard-staf | menunggu (jingga) / diproses (biru) / selesai (hijau) |
| Alur Status (stepper) | cek-status | 3 titik + garis, terisi sesuai progres |
| Kartu Aksi Besar | index | biru / hijau / jingga (border-top aksen) |
| Badge Sumber | dashboard-staf | publik (biru) / manual (jingga) |
| Radio Card (kategori/materi) | pengaduan, input-manual | vertikal, full-width, highlight biru saat terpilih |

## 6. Rekomendasi Tambahan untuk Desain

- **Responsif:** Semua form 1 kolom di mobile; kartu aksi & hak-hak grid berubah dari 3 kolom → 1 kolom di layar sempit
- **Aksesibilitas:** Kontras warna sudah diuji AA untuk teks di atas jingga/biru/hijau lembut; pastikan label form tetap ada `<label>` eksplisit
- **Kepercayaan (trust signals):** Ulangi teks kerahasiaan identitas di form pengaduan (bukan cuma di beranda) — pelapor sering ragu tepat saat akan submit
- **Empty state:** Dashboard staf perlu ilustrasi/pesan ramah saat filter tidak menghasilkan data, bukan layar kosong begitu saja
