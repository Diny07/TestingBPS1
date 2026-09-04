/* ===========================================================
   PRIT KOTAS — main.js
   Fungsi bantu UI yang dipakai di berbagai halaman
   =========================================================== */

// Tampilkan pesan alert (sukses/error/info) di dalam elemen tertentu
export function tampilkanAlert(elId, pesan, tipe = "info") {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = pesan;
  el.className = `alert alert--${tipe} tampil`;
}

export function sembunyikanAlert(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.classList.remove("tampil");
}

// Format tanggal ISO -> "20 Agustus 2026, 14:30"
export function formatTanggal(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Bangun elemen alur status (titik + garis) sesuai status saat ini
export function buatAlurStatusHTML(status) {
  const urutan = ["menunggu", "diproses", "selesai"];
  const posisi = urutan.indexOf(status);
  return `
    <div class="alur-status">
      ${urutan
        .map((tahap, i) => {
          const aktif = i <= posisi ? `aktif ${tahap}` : "";
          const titik = `<div class="titik ${aktif}">${i + 1}</div>`;
          const garis =
            i < urutan.length - 1
              ? `<div class="garis ${i < posisi ? "aktif" : ""}"></div>`
              : "";
          return titik + garis;
        })
        .join("")}
    </div>`;
}

// Tombol logout: dipasang otomatis ke elemen berid "btnLogout" jika ada
export function pasangTombolLogout(fnLogout) {
  const btn = document.getElementById("btnLogout");
  if (!btn) return;
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    await fnLogout();
    window.location.href = "login.html";
  });
}
