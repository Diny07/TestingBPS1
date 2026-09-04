# Panduan Setup — PRIT KOTAS (Whistle Blowing System BPS Kota Tasikmalaya)

## Struktur Project
```
bps-pengaduan/
├── index.html              (landing page publik — tombol pengaduan, WA, cek status)
├── pengaduan.html           (form pengaduan PUBLIK, tanpa login)
├── cek-status.html          (cek status pakai EMAIL, tanpa login)
├── login.html                (login KHUSUS admin/staf BPS)
├── dashboard-staf.html       (dashboard staf: kelola semua pengaduan)
├── input-manual.html         (staf input pengaduan yang lapor langsung ke kantor)
├── style.css                 (global untuk halaman utama)
├── global.css                (global untuk halaman form/landing)
├── landing.css               (khusus halaman landing)
├── auth.css                  (khusus halaman login)
├── pengaduan.css             (khusus form pengaduan)
├── dashboard.css             (khusus dashboard staf)
├── firebase-config.js        (WAJIB diisi config Anda)
├── auth.js                   (login/logout admin, proteksi halaman staf)
├── pengaduan.js              (ajukan publik, cari by email, input manual, kelola)
└── main.js                   (helper UI: alert, format tanggal, alur status)
```

## Perbedaan Alur dengan Versi Sebelumnya
- **Masyarakat TIDAK perlu bikin akun, dan TIDAK ada Kode Tiket.** Langsung isi form di `pengaduan.html`.
- Untuk cek status nanti, pelapor cukup buka `cek-status.html` dan masukkan **email yang sama** dengan yang dipakai saat mengajukan — tidak perlu kode/login apa pun.
- **Admin/staf BPS tetap wajib login** di `login.html`, akun dibuat manual oleh Anda (lihat Tahap 4).
- Staf bisa **input pengaduan manual** di `input-manual.html` untuk kasus yang dilaporkan langsung/tatap muka ke kantor.

## Tahap 1 — Buat Project Firebase
1. Buka https://console.firebase.google.com, login dengan akun Google.
2. Klik **"Add project"** → beri nama (mis. `sidu-bps`) → lanjutkan (Google Analytics boleh dimatikan).
3. Setelah project jadi, klik ikon **Web `</>`** untuk mendaftarkan aplikasi web.
4. Beri nama app (mis. `sidu-bps-web`) → **Register app**.
5. Salin objek `firebaseConfig` yang muncul, lalu tempel ke file `firebase-config.js` (ganti semua nilai `"GANTI_DENGAN_..."`).

## Tahap 2 — Aktifkan Authentication
1. Di sidebar Firebase Console, buka **Build > Authentication** → **Get started**.
2. Tab **Sign-in method** → aktifkan provider **Email/Password** → Save.
> Ini hanya dipakai untuk login admin/staf — masyarakat tidak memakai fitur ini.

## Tahap 3 — Aktifkan Firestore Database
1. Sidebar **Build > Firestore Database** → **Create database**.
2. Pilih lokasi server (mis. `asia-southeast2` / Jakarta) → mode **Start in test mode** (development dulu, nanti diperketat di Tahap 6).
3. Akan otomatis terisi koleksi saat aplikasi dipakai:
   - `users` — profil akun staf (nama, email, role)
   - `pengaduan` — seluruh data pengaduan (ID dokumen dibuat otomatis oleh Firestore)

## Tahap 4 — Aktifkan Storage & Buat Akun Staf

### 4a. Aktifkan Firebase Storage (untuk file bukti pengaduan)
1. Sidebar **Build > Storage** → **Get started** → ikuti wizard (pilih lokasi sama seperti Firestore) → Done.

### 4b. Buat Akun Staf (manual, tidak lewat formulir publik)
1. **Authentication > Users tab > Add user** → isi email & password staf → Add user.
2. Salin **User UID** yang muncul di daftar user.
3. Buka **Firestore Database > Start collection** (jika `users` belum ada) → Collection ID: `users`.
4. Buat dokumen dengan **Document ID = UID** yang disalin tadi, isi field:
   - `nama` (string) → misal `"Anira Rahmawati"`
   - `email` (string) → sama dengan email login
   - `role` (string) → **harus** `"staf"`
5. Ulangi untuk setiap staf yang perlu akses.

## Tahap 5 — Isi Kontak & Nomor WhatsApp
File `index.html` sudah diisi kontak resmi BPS Kota Tasikmalaya (alamat, email, telepon, WA). Jika ada perubahan nomor/alamat, cari dan sunting langsung di `index.html` (bagian kontak) dan variabel `nomorWA` di bagian `<script>` paling bawah file tersebut.

> **Catatan teknis:** Fitur "Cek Status" mencari dokumen berdasarkan `email` sekaligus mengurutkan berdasarkan `dibuatPada`. Firestore biasanya meminta Anda membuat **composite index** untuk kombinasi ini. Saat pertama kali mencoba fitur ini, jika muncul error di console browser berisi link "Create index" dari Firebase — klik link tersebut, tunggu index selesai dibuat (1-2 menit), lalu coba lagi.

## Tahap 6 — Atur Security Rules (WAJIB sebelum go-live publik)

### Firestore Rules
Karena masyarakat mengirim pengaduan **tanpa login dan tanpa Kode Tiket**, cek status dilakukan dengan mencari dokumen yang field `email`-nya cocok. Ini butuh izin `list` (query) yang bisa diakses publik — konsekuensinya, rules di bawah **tidak bisa membedakan "pencarian sah oleh pemilik email" vs "orang lain menebak email tersebut"**. Ini kompromi wajar untuk sistem sederhana tanpa akun; untuk data yang sangat sensitif, lihat catatan keamanan di bawah.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if false; // hanya diubah manual via console
    }

    match /pengaduan/{id} {
      allow create: if true;                  // publik boleh kirim pengaduan baru
      allow get, list: if true;               // publik boleh cek status via query email & lihat nomor antrian
      allow update: if request.auth != null;  // hanya staf yang boleh ubah status/tanggapan
      allow delete: if false;
    }

    match /masukan/{id} {
      allow create: if true;                  // publik boleh kirim saran & masukan
      allow read: if request.auth != null;    // hanya staf yang boleh membaca daftar masukan
      allow update, delete: if false;
    }

    match /gratifikasi/{id} {
      allow create, read: if request.auth != null;  // hanya staf/admin yang boleh input & lihat
      allow update, delete: if false;
    }
  }
}
```

### Storage Rules
Buka **Storage > Rules**, gunakan:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /bukti-pengaduan/{tanggal}/{fileName} {
      allow write: if request.resource.size < 10 * 1024 * 1024; // maks 10MB
      allow read: if request.auth != null; // hanya staf yang bisa lihat file bukti
    }
    match /bukti-pengaduan/gratifikasi/{fileName} {
      allow write, read: if request.auth != null; // khusus staf
    }
  }
}
```

> **Catatan keamanan penting:** Karena `allow list: if true`, siapa pun yang tahu (atau menebak) sebuah alamat email teknisnya bisa melihat status pengaduan yang terhubung ke email tersebut — ini melemahkan jaminan kerahasiaan penuh untuk kasus berisiko tinggi. Untuk sistem produksi yang menangani laporan sensitif, pertimbangkan salah satu penguatan berikut sebelum go-live:
> - Tambahkan **Cloud Function** sebagai perantara pencarian (bukan query langsung dari klien), sehingga bisa menerapkan rate-limiting dan pencatatan akses.
> - Kirim **tautan verifikasi sekali-pakai** ke email pelapor (mirip "magic link") sebelum menampilkan detail laporan.
> - Batasi jumlah percobaan pencarian per IP (misal via Firebase App Check + reCAPTCHA).

## Tahap 7 — Jalankan Secara Lokal
Karena project memakai `type="module"` pada `<script>`, file **tidak bisa dibuka langsung** dengan double-click (`file://`). Harus lewat local server:

**Opsi A — VS Code Live Server:** Install ekstensi "Live Server" → klik kanan `index.html` → "Open with Live Server".

**Opsi B — Python:**
```
python -m http.server 5500
```
Buka `http://localhost:5500` di browser.

## Tahap 8 — Hosting agar Bisa Diakses Publik
- **Firebase Hosting** — `npm install -g firebase-tools` → `firebase login` → `firebase init hosting` → `firebase deploy`
- **Netlify** — drag & drop folder project ke https://app.netlify.com/drop
- **Vercel** — hubungkan repo GitHub, deploy otomatis

## Alur Uji Coba
1. Buka `index.html` → klik **"Ajukan Pengaduan"** → isi form (tanpa login) → kirim → pastikan muncul pesan konfirmasi terkirim.
2. Buka **"Cek Status"** → masukkan email yang sama tadi → pastikan laporan & alur status muncul.
3. Buka `login.html` → login pakai akun staf (dari Tahap 4b) → masuk ke `dashboard-staf.html` → pastikan pengaduan tadi muncul di daftar.
4. Ubah status jadi **"Diproses"**, isi tanggapan → Simpan.
5. Kembali ke `cek-status.html` (tab/browser lain) → cari ulang dengan email yang sama → pastikan status & tanggapan sudah ter-update.
6. Coba **"+ Input Manual"** di dashboard staf untuk simulasi pengaduan yang datang langsung ke kantor.
7. Coba tombol **"Chat WhatsApp BPS"** di landing page → pastikan terbuka ke `wa.me` dengan nomor yang benar.
