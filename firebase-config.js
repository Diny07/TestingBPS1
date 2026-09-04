/* ===========================================================
   PRIT KOTAS — firebase-config.js
   File ini menghubungkan project ke Firebase Anda.

   CARA MENGISI:
   1. Buka https://console.firebase.google.com
   2. Buat project baru (mis. "sidu-bps")
   3. Di menu "Project settings" > "Your apps" > pilih ikon Web (</>)
   4. Daftarkan app, lalu salin objek firebaseConfig yang muncul
   5. Tempel/replace nilai di bawah ini dengan milik Anda
   6. Aktifkan juga:
      - Authentication > Sign-in method > Email/Password (Enable)
      - Firestore Database > Create database (mode production/test)

   CATATAN: Penyimpanan foto/dokumen TIDAK memakai Firebase Storage (sejak
   Feb 2026 Firebase mewajibkan paket berbayar Blaze untuk Storage).
   Sebagai gantinya dipakai Cloudinary (gratis, tanpa kartu) — lihat
   cloudinary-config.js untuk pengisian kredensialnya.
   =========================================================== */

// Import Firebase SDK (versi modular, via CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// GANTI dengan config project Firebase Anda sendiri
const firebaseConfig = {
  apiKey: "AIzaSyBar2jHfSwmmSEeltNHxpE00Pl5Wuuafbs",
  authDomain: "pritkotas-bps-68072.firebaseapp.com",
  projectId: "pritkotas-bps-68072",
  messagingSenderId: "620067582543",
  appId: "1:620067582543:web:ab32a5f2836c65959cf03a"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor layanan yang dipakai di file JS lain
export const auth = getAuth(app);
export const db = getFirestore(app);
