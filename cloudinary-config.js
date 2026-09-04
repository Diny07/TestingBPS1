/* ===========================================================
   PRIT KOTAS — cloudinary-config.js
   File ini menghubungkan project ke akun Cloudinary Anda untuk
   menyimpan foto/dokumen bukti pengaduan & gratifikasi.
   (Firestore & Authentication tetap di Firebase — hanya
   penyimpanan file yang dialihkan ke sini, karena Firebase
   Storage kini mewajibkan paket berbayar Blaze.)

   CARA MENGISI:
   1. Buka https://cloudinary.com/users/register/free, daftar akun gratis.
   2. Di Dashboard, salin nilai "Cloud name" (contoh: dxynxxxx).
   3. Buka Settings (ikon gerigi) > Upload > "Upload presets" >
      klik "Add upload preset".
   4. Set "Signing Mode" ke "Unsigned" (WAJIB, agar bisa diunggah
      langsung dari browser tanpa server tambahan).
   5. Beri nama preset, misalnya "pritkotas-unsigned", lalu Save.
   6. Tempel "Cloud name" dan nama preset tadi di bawah ini.
   =========================================================== */

export const CLOUDINARY_CLOUD_NAME = "pk1pz839";
export const CLOUDINARY_UPLOAD_PRESET = "pritkotas-unsigned";

/* -------------------------------------------------------
   Unggah satu file ke Cloudinary, kembalikan URL publiknya.
   `folder` mengelompokkan file di dashboard Cloudinary
   (mis. "bukti-pengaduan/2026-09-01").
------------------------------------------------------- */
export async function unggahKeCloudinary(file, folder) {
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  if (folder) formData.append("folder", folder);

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gagal mengunggah file ke Cloudinary (${response.status}): ${detail}`);
  }

  const data = await response.json();
  // secure_url = URL https publik file yang baru diunggah
  return data.secure_url;
}
