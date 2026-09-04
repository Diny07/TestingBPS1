# desain.md — Spesifikasi Desain PRIT KOTAS

Dokumen ini merangkum sistem desain (design system) berdasarkan rancangan tampilan yang diberikan, sebagai acuan saat membangun/menyesuaikan UI. Menggantikan alur berbasis Kode Tiket dengan **cek status berbasis email** dan menegaskan **masyarakat tidak perlu membuat akun**.

---

## 1. Prinsip Desain

1. **Tanpa akun untuk publik** — satu-satunya identitas pelapor adalah email yang mereka isi sendiri di form; tidak ada proses daftar/login untuk warga.
2. **Resmi tapi tidak menakutkan** — nuansa instansi pemerintah (rapi, tenang, biru dominan) namun tetap approachable, karena topiknya sensitif (pengaduan pelanggaran).
3. **Transparansi tahapan** — status pengaduan (Menunggu/Diproses/Selesai) selalu divisualisasikan sebagai stepper, bukan hanya teks/label.
4. **Kerahasiaan ditekankan berulang** — bukan cuma di beranda, tapi diulang di titik-titik krusial (form, hasil pencarian status).

## 2. Palet Warna

| Token | Hex (perkiraan) | Penggunaan |
|---|---|---|
| `--biru-utama` | `#14509E` | Navbar aktif, tombol utama, angka statistik netral |
| `--biru-gelap` | `#0D3B79` | Tombol "Login Admin", header dashboard, teks judul |
| `--biru-lembut` | `#E8F0FB` | Background hero, background status "Diproses" |
| `--hijau-sukses` | `#2E7D32` | Ikon WhatsApp, status "Selesai", tanggapan staf, grafik "selesai" |
| `--hijau-lembut` | `#E5F3E6` | Background box tanggapan |
| `--jingga-proses` | `#F57C00` | Status "Menunggu", ikon cek status, badge "Input Manual", box catatan/kriteria |
| `--jingga-lembut` | `#FDECDA` | Background box catatan, background ikon menunggu |
| `--abu-latar` | `#F6F8FB` | Background halaman |
| `--putih` | `#FFFFFF` | Card, form |
| `--teks-gelap` | `#1B2733` | Teks utama |
| `--teks-muted` | `#64748B` | Teks sekunder/keterangan |
| `--garis` | `#E1E7EF` | Border card, input |

> Prinsip pemakaian warna tetap sama seperti brief awal: **biru = identitas & netral/diproses, hijau = selesai/positif, jingga = menunggu/perhatian**.

## 3. Tipografi

- **Judul (heading):** Plus Jakarta Sans — weight 600–800, tegas & modern untuk instansi
- **Isi (body):** Inter — weight 400–600, mudah dibaca di form panjang
- Ukuran judul H1 landing: ~2.2–2.6rem · H2 section: ~1.5–1.7rem · Body: ~0.9–1rem

## 4. Komponen Utama (Design System)

### 4.1 Kartu Aksi Beranda
3 kartu sejajar (1 kolom di mobile), masing-masing dengan aksen garis atas berwarna beda:
- 🔵 **Ajukan Pengaduan** (border biru) — ikon dokumen
- 🟢 **Chat WhatsApp** (border hijau) — ikon chat, buka tab baru ke `wa.me`
- 🟠 **Cek Status** (border jingga) — ikon kaca pembesar

### 4.2 Sidebar Stepper Form ("Proses Pengaduan")
Form pengaduan yang panjang dipecah jadi 4 section bernomor, ditemani sidebar sticky di layar besar:
1. Data Diri
2. Kategori & Materi
3. Isi Laporan
4. Bukti & Kirim

Sidebar bersifat **penunjuk posisi baca** (bukan wizard per-langkah) — seluruh section tetap tampil dalam satu halaman scroll, sidebar hanya membantu orientasi.

### 4.3 Kategori Pengaduan — Kartu Pilihan (bukan radio polos)
Setiap opsi kategori/materi ditampilkan sebagai **kartu berbingkai** dengan judul singkat + deskripsi 1 baris, disusun grid 2 kolom (1 kolom di mobile). Saat dipilih, border & background berubah ke warna biru lembut.

> Catatan: dokumen ini mengikuti pola visual dari rancangan yang diberikan (kartu kategori bergaya "Korupsi / Gratifikasi / dll"). Untuk PRIT KOTAS, **isi kategori & materi tetap mengikuti daftar resmi formulir BPS** (Masyarakat/Instansi Pemerintah/Pegawai BPS/dst, dan Pelanggaran Sumpah Jabatan/dst) — hanya gaya kartunya yang diadopsi, bukan isi kontennya.

### 4.4 Box Catatan/Kriteria
Box dengan aksen kiri warna jingga + ikon info, dipakai untuk menampilkan kriteria pengaduan atau petunjuk pengisian (5W+1H). Latar jingga lembut agar menonjol tapi tidak seperti pesan error.

### 4.5 Status Pill & Alur Status (Stepper)
- **Status Pill:** badge kecil bulat, 1 dari 3 warna sesuai status
- **Alur Status:** 3 titik bernomor terhubung garis horizontal — titik yang sudah terlewati + aktif berwarna sesuai tahap, titik yang belum tercapai abu-abu

### 4.6 Kartu Hasil Cek Status
Setelah pencarian by-email berhasil, tampilkan satu **card per laporan** (bisa lebih dari satu jika pelapor pernah mengirim beberapa laporan dengan email sama), masing-masing berisi:
- Tanggal dikirim + status pill
- Alur status visual
- Kategori & materi (2 kolom)
- Isi pengaduan
- Tanggapan staf (box hijau lembut) — muncul hanya jika staf sudah membalas

### 4.7 Dashboard Staf — Stat Card & Ringkasan Visual
3 stat card di atas (Menunggu/Diproses/Selesai) dengan warna sesuai status, dilengkapi opsional:
- Grafik batang tren laporan masuk vs selesai per bulan (opsional, tahap lanjutan)
- Progress bar distribusi kategori pengaduan (opsional, tahap lanjutan)
- Rasio sumber laporan: Publik vs Input Manual (opsional, tahap lanjutan)

> Elemen grafik & progress bar bersifat **pengayaan visual tahap lanjut** — inti fungsional dashboard (daftar pengaduan + ubah status) tetap prioritas utama dan sudah berjalan di source code saat ini.

### 4.8 Badge Sumber Input
Badge kecil untuk membedakan asal laporan:
- 🌐 **Formulir Publik** (biru lembut)
- 🏢 **Input Manual** (jingga lembut) + nama staf yang menginput

## 5. Peta Halaman (Diperbarui — Tanpa Kode Tiket)

```
PUBLIK (tanpa akun)                      ADMIN/STAF (login wajib)
├── index.html         (beranda)          ├── login.html
├── pengaduan.html      (form, →email)    ├── dashboard-staf.html
└── cek-status.html     (cari by email)   └── input-manual.html
```

**Perubahan kunci dari rancangan sebelumnya:**
- ❌ Kode Tiket dihapus total — tidak ada lagi kode acak yang harus disimpan pelapor
- ✅ `cek-status.html` kini hanya minta **email** (field tunggal), sesuai rancangan
- ✅ ID dokumen pengaduan dibuat otomatis oleh Firestore (bukan lagi kode buatan sendiri)
- ⚠️ **Trade-off keamanan yang perlu disadari:** karena tanpa akun/kode, siapa pun yang tahu sebuah alamat email bisa mengecek status pengaduan terkait email tersebut. Ini dijelaskan lengkap di `PANDUAN-SETUP.md` beserta opsi penguatannya (Cloud Function proxy, magic link, rate-limiting) untuk versi produksi yang menangani laporan sensitif.

## 6. Halaman yang Terlihat di Rancangan tapi Belum Ada di Source Code

Rancangan yang diberikan menampilkan beberapa layar tambahan yang **belum diimplementasikan** di source code saat ini. Dicatat di sini sebagai referensi jika ingin dikembangkan lebih lanjut:

| Halaman/Fitur pada rancangan | Status saat ini |
|---|---|
| Halaman **Panduan** & **FAQ** terpisah | Belum ada — saat ini info panduan hanya melekat di form (box kriteria) |
| Halaman **Hak-hak Pelapor** terpisah | Belum ada — saat ini digabung sebagai section di beranda |
| **Lupa Kata Sandi** (admin) | Belum ada — bisa ditambahkan di `login.html` |
| **Saran & Masukan** (feedback publik ke BPS) | Belum ada — fitur baru di luar alur pengaduan |
| Grafik tren & statistik kategori di dashboard | Belum ada — dashboard saat ini fokus ke daftar + filter |
| Peta lokasi kantor (embed map) | Belum ada — kontak saat ini teks alamat saja |

Beri tahu saya halaman mana yang ingin diprioritaskan dulu untuk diimplementasikan ke source code.

## 7. Aksesibilitas & Responsif

- Kontras teks di atas warna lembut (jingga-lembut, hijau-lembut, biru-lembut) sudah diuji cukup untuk keterbacaan
- Semua form 1 kolom di layar < 720px; grid kartu (aksi, kategori, hak-hak) menjadi 1 kolom di mobile
- Sidebar stepper form disembunyikan/collapse di mobile agar tidak memakan ruang vertikal
