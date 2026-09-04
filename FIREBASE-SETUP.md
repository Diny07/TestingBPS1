# Panduan Setup Backend Firebase — PRIT-KOTAS / SIDU-BPS

Dokumen ini menjelaskan langkah demi langkah menghubungkan frontend statis
(HTML/CSS/JS) yang sudah dibuat ke backend **Firebase** (Authentication +
Cloud Firestore), sesuai alur sistem yang dijelaskan pada dokumen brainstorming.

Frontend sudah lengkap dengan kode integrasi Firebase di `script.js` —
Anda hanya perlu membuat proyek Firebase sendiri dan menempelkan
konfigurasinya.

---

## 1. Buat Proyek Firebase

1. Buka [https://console.firebase.google.com](https://console.firebase.google.com).
2. Klik **Add project / Tambah proyek**.
3. Beri nama, misalnya `pritkotas-bps` (nama boleh berbeda).
4. Google Analytics bersifat opsional — boleh dimatikan untuk proyek internal seperti ini.
5. Tunggu proyek selesai dibuat.

## 2. Daftarkan Aplikasi Web

1. Di halaman utama proyek, klik ikon **`</>`** (Web) untuk menambahkan aplikasi web.
2. Beri nama app, misalnya `PRIT-KOTAS Web`.
3. **Tidak perlu** mencentang Firebase Hosting di langkah ini (opsional, lihat bagian 6).
4. Setelah selesai, Firebase akan menampilkan objek `firebaseConfig` seperti berikut:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "pritkotas-bps.firebaseapp.com",
     projectId: "pritkotas-bps",
     storageBucket: "pritkotas-bps.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcabc123"
   };
   ```

5. **Salin seluruh objek ini**, lalu buka file `script.js`, cari bagian:

   ```js
   const firebaseConfig = {
     apiKey: "GANTI_DENGAN_API_KEY_ANDA",
     ...
   };
   ```

   dan ganti dengan konfigurasi milik Anda. Catatan: `apiKey` untuk aplikasi
   web Firebase memang bersifat publik (bukan rahasia) — keamanan data
   sesungguhnya diatur lewat **Security Rules** pada langkah 4, bukan dengan
   menyembunyikan `apiKey` ini.

## 3. Aktifkan Authentication (Login Admin)

1. Di sidebar kiri, buka **Build → Authentication**.
2. Klik **Get started**.
3. Pilih provider **Email/Password**, aktifkan (toggle **Enable**), lalu **Save**.
4. Buka tab **Users**, klik **Add user**, lalu buat maksimal **3 akun admin**
   secara manual sesuai keputusan sistem, contoh:
   - `admin1@bps.go.id` / (buat password kuat)
   - `admin2@bps.go.id` / (buat password kuat)
   - `admin3@bps.go.id` / (buat password kuat)

   > Sesuai dokumen alur sistem: **tidak ada tombol registrasi publik**.
   > Seluruh akun staf dibuat manual oleh pengelola sistem lewat langkah ini.

5. Setelah akun dibuat, staf dapat login melalui `login.html` menggunakan email & password tersebut.

## 4. Aktifkan Cloud Firestore & Terapkan Security Rules

1. Di sidebar kiri, buka **Build → Firestore Database**.
2. Klik **Create database**.
3. Pilih lokasi server terdekat (misalnya `asia-southeast2 (Jakarta)`).
4. Pilih mode **Start in production mode** (rules akan kita ganti manual di langkah berikut).
5. Setelah database aktif, buka tab **Rules**.
6. Hapus isi default, lalu salin-tempel seluruh isi file **`firestore.rules`**
   yang sudah disediakan dalam paket ini.
7. Klik **Publish**.

Ringkasan logika rules yang diterapkan:

| Koleksi     | Baca (read)                         | Buat (create)                     | Ubah / Hapus (update/delete) |
|-------------|--------------------------------------|-------------------------------------|-------------------------------|
| `pengaduan` | Publik (diperlukan untuk Cek Status) | Publik (form pengaduan tanpa login) | Hanya admin yang login        |
| `saran`     | Hanya admin yang login                | Publik (form saran tanpa login)     | Hanya admin yang login        |

> **Catatan keamanan:** Karena sistem sengaja dirancang tanpa login untuk
> masyarakat, koleksi `pengaduan` harus bisa dibaca publik agar fitur Cek
> Status berjalan (dicari berdasarkan email). Untuk keamanan tambahan di
> masa depan, pertimbangkan memindahkan pencarian status ke **Cloud
> Function** (lihat bagian 7 - Peningkatan Lanjutan) agar data pengaduan
> lain tidak bisa "diintip" massal oleh pihak luar.

## 5. Struktur Data (Koleksi Firestore)

Sistem menggunakan **2 koleksi utama**, keduanya dibuat otomatis saat data
pertama kali dikirim dari form (tidak perlu dibuat manual):

### Koleksi `pengaduan`

| Field       | Tipe    | Keterangan                                                        |
|-------------|---------|---------------------------------------------------------------------|
| `kodeUnik`  | string  | Kode referensi unik, contoh `BPS-X7K2AQ` atau `BPS-MNL-9Q2A1`       |
| `nama`      | string  | Nama pelapor                                                       |
| `email`     | string  | Email pelapor (dipakai untuk Cek Status)                           |
| `telepon`   | string  | Nomor telepon/WA pelapor                                            |
| `kategori`  | string  | Kategori pelapor / klasifikasi laporan                             |
| `materi`    | string  | Materi / sub-kategori pengaduan                                     |
| `laporan`   | string  | Isi kronologi pengaduan                                             |
| `status`    | string  | `Menunggu` \| `Diproses` \| `Selesai`                               |
| `sumber`    | string  | `Publik` (dari website) atau `Manual` (input admin)                 |
| `tanggal`   | string  | ISO datetime saat data dikirim (dipakai untuk urutan FIFO & grafik) |
| `tanggapan` | string  | Catatan/tanggapan resmi dari admin, tampil di fitur Cek Status      |

### Koleksi `saran`

| Field      | Tipe   | Keterangan                             |
|------------|--------|------------------------------------------|
| `nama`     | string | Nama pengirim saran                      |
| `email`    | string | Email pengirim (opsional untuk kotak mini di form pengaduan) |
| `telepon`  | string | Nomor telepon (opsional)                 |
| `kategori` | string | Kategori saran                           |
| `judul`    | string | Judul singkat saran                      |
| `isi`      | string | Isi lengkap saran / aspirasi             |
| `tanggal`  | string | ISO datetime saat saran dikirim          |

Dashboard staf (`dashboard-staf.html`) membaca kedua koleksi ini secara
langsung menggunakan Firestore SDK — statistik, grafik tren, persentase
kategori, dan persentase sumber laporan **dihitung otomatis di sisi
browser** dari data yang diambil, jadi Anda tidak perlu membuat query
tambahan yang rumit.

## 6. (Opsional) Deploy dengan Firebase Hosting

Jika ingin situs ini online dengan domain `*.web.app` gratis dari Firebase:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Pilih proyek yang sudah dibuat di langkah 1
# Public directory: isi dengan folder tempat file index.html berada
# Configure as single-page app: No
firebase deploy
```

Alternatif lain: unggah seluruh isi folder ini ke layanan hosting statis
apa pun (Netlify, Vercel, cPanel, dll) — karena tidak ada proses server-side,
semua platform hosting statis akan berfungsi selama Firebase config di
`script.js` sudah benar.

## 7. Peningkatan Lanjutan (Opsional, untuk pengembangan berikutnya)

- **Cloud Functions untuk Cek Status**: pindahkan query pencarian status
  ke Cloud Function agar Firestore Rules koleksi `pengaduan` bisa dibuat
  lebih ketat (`allow read: if false` langsung dari client), dan hanya
  Cloud Function (server-side) yang boleh membaca lalu mengembalikan data
  terbatas (tanpa field sensitif) ke pengguna.
- **Notifikasi email/WhatsApp otomatis** saat status pengaduan berubah,
  menggunakan Cloud Functions + Firebase Extensions (Trigger Email) atau
  API WhatsApp Business.
- **Composite index** akan diminta otomatis oleh Firebase Console
  (muncul link di Developer Console browser) jika Anda menambahkan
  `orderBy()` pada query yang sudah memakai `where()`, misalnya bila
  ingin query Cek Status diurutkan tanggal terbaru di sisi server.

## 6b. Aktifkan Firebase Storage (WAJIB — dipakai fitur Dokumentasi Offline)

Formulir **Pengaduan Secara Offline** (`input-manual.html`) mewajibkan
unggah 1 foto Dokumentasi, dan formulir **Anti-Gratifikasi** mengunggah
foto barang — keduanya disimpan ke Firebase Storage.

1. Firebase Console > **Build > Storage** > **Get started** > pilih lokasi
   yang sama dengan Firestore Database Anda > Done.
2. Buka tab **Rules** di Storage, ganti dengan:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /dokumentasi-offline/{fileName} {
      allow write: if request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow read: if request.auth != null;
    }
    match /gratifikasi/{fileName} {
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024;
      allow read: if request.auth != null;
    }
  }
}
```

3. Klik **Publish**.

> Catatan: rule `dokumentasi-offline` sengaja mengizinkan `write` tanpa
> login karena form Offline saat ini masih dalam **mode pratinjau tanpa
> proteksi login** (lihat bagian 5). Setelah Anda mengaktifkan kembali
> proteksi login di `script.js`, ubah rule ini menjadi
> `allow write: if request.auth != null` agar hanya staf yang bisa upload.

## 8. Checklist Pengujian

- [ ] Buka `index.html` — halaman beranda tampil dengan tema merah dan peta lokasi.
- [ ] Buka `pengaduan.html`, centang persetujuan, isi form, kirim — cek dokumen baru muncul di Firestore Console koleksi `pengaduan`.
- [ ] Buka `saran.html`, kirim saran — cek dokumen baru muncul di koleksi `saran`.
- [ ] Buka `cek-status.html`, masukkan email yang tadi dipakai — status & tanggapan tampil.
- [ ] Buka `login.html`, login dengan salah satu akun admin dari langkah 3.
- [ ] Di `dashboard-staf.html`, cek statistik, grafik, dan daftar laporan (termasuk panel Saran & Masukan) tampil dan sesuai data.
- [ ] Klik **Lihat Detail & Tanggapi** pada salah satu laporan, ubah status & tulis tanggapan, klik **Simpan Tanggapan** — cek perubahan tersimpan di Firestore dan langsung terlihat lagi di `cek-status.html`.
- [ ] Buka `input-manual.html`, kirim laporan manual — cek `sumber: "Manual"` tersimpan dan badge **MANUAL** muncul di dashboard.

---

Selesai — setelah langkah 1–4 dilakukan, seluruh fitur (pengaduan, saran,
cek status, login admin, dashboard, input manual) akan langsung terhubung
ke Firebase tanpa perlu mengubah kode lain.
