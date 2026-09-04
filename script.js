import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

import { auth, db } from "./firebase-config.js";
import { unggahKeCloudinary } from "./cloudinary-config.js";

/* ==========================================================================
   GLOBAL UI HELPERS
   ========================================================================== */
window.selectCard = function (element, groupName) {
  if (!element) return;
  const cards = document.querySelectorAll(`input[name="${groupName}"]`);
  cards.forEach((radio) => {
    const cardEl = radio.closest(".category-card, .select-card");
    if (cardEl) cardEl.classList.remove("selected");
  });
  element.classList.add("selected");
  const radio = element.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
};

function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === "success" ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-triangle-exclamation"></i>'}</span><span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
window.showToast = showToast;

function formatTanggal(iso) {
  if (!iso) return "Baru saja";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function generateKode(prefix) {
  return prefix + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/* Upload satu file ke Cloudinary, kembalikan URL publiknya */
async function unggahSatuFile(file, folder) {
  return unggahKeCloudinary(file, folder);
}

/* Scroll-reveal animation observer */
function initScrollReveal() {
  const revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   3. CONTROLLER: FORM PENGADUAN PUBLIK (pengaduan.html)
   ========================================================================== */
function initPengaduanPage() {
  const form = document.getElementById("pengaduanForm");
  const errorAlert = document.getElementById("errorAlert");
  const successCard = document.getElementById("successCard");
  const consentCheckbox = document.getElementById("consentCheck");
  const fieldsWrapper = document.getElementById("formFieldsWrapper");
  const btn = document.getElementById("btnKirim");
  if (!form) return;

  const gatedFields = fieldsWrapper
    ? fieldsWrapper.querySelectorAll("input, textarea, select")
    : [];

  function updateFormGate() {
    const isChecked = !!consentCheckbox?.checked;
    gatedFields.forEach((el) => { el.disabled = !isChecked; });
    if (fieldsWrapper) fieldsWrapper.classList.toggle("fields-locked", !isChecked);
    if (btn) btn.disabled = !isChecked;
  }

  if (consentCheckbox) {
    consentCheckbox.addEventListener("change", updateFormGate);
    updateFormGate();
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (errorAlert) errorAlert.style.display = "none";

    if (consentCheckbox && !consentCheckbox.checked) {
      if (errorAlert) {
        errorAlert.style.display = "block";
        errorAlert.textContent = "Mohon centang persetujuan bahwa Anda telah membaca hak-hak pelapor.";
      }
      consentCheckbox.closest(".consent-box")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (btn) {
      btn.innerHTML = '<span class="spinner"></span> Mengirim Pengaduan...';
      btn.disabled = true;
    }

    const namaPelapor = document.getElementById("nama")?.value.trim() || "";
    const emailPelapor = document.getElementById("email")?.value.trim().toLowerCase() || "";
    const teleponPelapor = document.getElementById("telepon")?.value.trim() || "";
    const kategoriEl = document.querySelector('input[name="kategori"]:checked');
    const materiEl = document.querySelector('input[name="materi"]:checked');
    const isiLaporan = document.getElementById("isi_laporan")?.value.trim() || "";

    if (!kategoriEl || !materiEl) {
      if (errorAlert) {
        errorAlert.style.display = "block";
        errorAlert.textContent = "Mohon pilih kategori pelapor dan materi pengaduan.";
      }
      if (btn) {
        btn.textContent = "Kirim Pengaduan";
        btn.disabled = false;
      }
      return;
    }

    try {
      // ===== PERUBAHAN: Validasi ukuran file sebelum upload =====
      const lampiranInput = document.getElementById("lampiran");
      const files = lampiranInput?.files ? Array.from(lampiranInput.files) : [];
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

      // Periksa apakah ada file yang melebihi 10MB
      const fileTooLarge = files.some((file) => file.size > MAX_FILE_SIZE);
      if (fileTooLarge) {
        if (errorAlert) {
          errorAlert.style.display = "block";
          errorAlert.textContent = "Ukuran file tidak boleh melebihi 10 MB. Silakan kompres atau pilih file yang lebih kecil.";
        }
        if (btn) {
          btn.textContent = "Kirim Pengaduan";
          btn.disabled = false;
        }
        return; // Hentikan proses submit
      }

      // Upload file ke Cloudinary
      const uploadedUrls = [];
      for (const file of files) {
        const url = await unggahKeCloudinary(file, "bukti-pengaduan");
        uploadedUrls.push({ nama: file.name, url: url });
      }
      // ===== AKHIR PERUBAHAN =====

      const uniqueCode = generateKode("BPS");
      await addDoc(collection(db, "pengaduan"), {
        kodeUnik: uniqueCode,
        nama: namaPelapor,
        email: emailPelapor,
        telepon: teleponPelapor,
        kategori: kategoriEl.value,
        materi: materiEl.value,
        laporan: isiLaporan,
        bukti: uploadedUrls,
        status: "Menunggu",
        sumber: "Publik",
        tanggal: new Date().toISOString(),
        tanggapan: "Laporan Anda telah kami terima dan berada dalam antrean verifikasi awal oleh tim pemeriksa."
      });

      form.style.display = "none";
      if (successCard) successCard.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Gagal menyimpan data ke Firebase: ", error);
      if (errorAlert) {
        errorAlert.style.display = "block";
        errorAlert.textContent = "Terjadi kendala sistem, pengaduan gagal dikirim. Silakan coba lagi.";
      }
      if (btn) {
        btn.textContent = "Kirim Pengaduan";
        btn.disabled = false;
      }
    }
  });

  /* Mini kotak Saran & Masukan */
  const miniSaranForm = document.getElementById("miniSaranForm");
  if (miniSaranForm) {
    miniSaranForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const btnMini = document.getElementById("btnKirimMiniSaran");
      const textEl = document.getElementById("miniSaranText");
      const text = textEl?.value.trim() || "";
      if (!text) return;

      if (btnMini) {
        btnMini.textContent = "Mengirim...";
        btnMini.disabled = true;
      }

      try {
        await addDoc(collection(db, "saran"), {
          nama: "Anonim (via form pengaduan)",
          email: "",
          telepon: "",
          kategori: "Umum",
          judul: "Masukan singkat dari halaman pengaduan",
          isi: text,
          tanggal: new Date().toISOString()
        });
        textEl.value = "";
        showToast("Terima kasih, masukan Anda telah terkirim.");
      } catch (error) {
        console.error("Gagal mengirim saran singkat:", error);
        showToast("Gagal mengirim masukan, coba lagi.", "error");
      } finally {
        if (btnMini) {
          btnMini.textContent = "Kirim Saran";
          btnMini.disabled = false;
        }
      }
    });
  }
}

/* ==========================================================================
   4. CONTROLLER: HALAMAN SARAN & ASPIRASI (saran.html)
   ========================================================================== */
function initSaranPage() {
  const form = document.getElementById("saranForm");
  const errorAlert = document.getElementById("saranErrorAlert");
  const successCard = document.getElementById("saranSuccessCard");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("btnKirimSaran");
    if (errorAlert) errorAlert.style.display = "none";

    const nama = document.getElementById("saranNama")?.value.trim() || "";
    const email = document.getElementById("saranEmail")?.value.trim().toLowerCase() || "";
    const telepon = document.getElementById("saranTelepon")?.value.trim() || "";
    const kategoriEl = document.querySelector('input[name="kategoriSaran"]:checked');
    const judul = document.getElementById("saranJudul")?.value.trim() || "";
    const isi = document.getElementById("saranIsi")?.value.trim() || "";

    if (!kategoriEl) {
      if (errorAlert) {
        errorAlert.style.display = "block";
        errorAlert.textContent = "Mohon pilih kategori saran terlebih dahulu.";
      }
      return;
    }

    if (btn) {
      btn.innerHTML = '<span class="spinner"></span> Mengirim Saran...';
      btn.disabled = true;
    }

    try {
      await addDoc(collection(db, "saran"), {
        nama,
        email,
        telepon,
        kategori: kategoriEl.value,
        judul,
        isi,
        tanggal: new Date().toISOString()
      });

      form.style.display = "none";
      if (successCard) successCard.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Gagal mengirim saran:", error);
      if (errorAlert) {
        errorAlert.style.display = "block";
        errorAlert.textContent = "Terjadi kendala sistem, saran gagal dikirim. Silakan coba lagi.";
      }
    } finally {
      if (btn) {
        btn.textContent = "Kirim Saran";
        btn.disabled = false;
      }
    }
  });
}

/* ==========================================================================
   5. CONTROLLER: CEK STATUS PELACAKAN MANDIRI (cek-status.html)
   ========================================================================== */
function initCekStatusPage() {
  const form = document.getElementById("cekStatusForm");
  const searchBoxWrapper = document.getElementById("searchBoxWrapper");
  const resultContainer = document.getElementById("resultContainer");
  const listHasilLaporan = document.getElementById("listHasilLaporan");
  const btnCari = document.getElementById("btnCari");
  if (!form) return;

  function buildStepper(status) {
    const steps = ["Menunggu", "Diproses", "Selesai"];
    const icons = { Menunggu: '<i class="fa-solid fa-hourglass-half"></i>', Diproses: '<i class="fa-solid fa-arrows-rotate"></i>', Selesai: '<i class="fa-solid fa-check"></i>' };
    const idx = Math.max(steps.indexOf(status), 0);
    const fillPercent = idx === 0 ? 0 : idx === 1 ? 42 : 84;

    let html = `<div class="status-stepper"><div class="step-fill" style="width:${fillPercent}%"></div>`;
    steps.forEach((s, i) => {
      let cls = "";
      if (i < idx) cls = "done";
      else if (i === idx) cls = "current";
      const icon = i < idx ? '<i class="fa-solid fa-check"></i>' : icons[s];
      html += `
        <div class="step ${cls}">
          <div class="step-icon">${icon}</div>
          <div class="step-label">${s}</div>
        </div>`;
    });
    html += `</div>`;
    return html;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const searchEmailInput = document.getElementById("searchEmail");
    const emailInput = searchEmailInput ? searchEmailInput.value.trim().toLowerCase() : "";

    if (btnCari) {
      btnCari.innerHTML = '<span class="spinner"></span> Mencari Data...';
      btnCari.disabled = true;
    }

    try {
      const q = query(collection(db, "pengaduan"), where("email", "==", emailInput));
      const querySnapshot = await getDocs(q);

      if (listHasilLaporan) {
        listHasilLaporan.innerHTML = "";

        if (querySnapshot.empty) {
          listHasilLaporan.innerHTML = `
            <div class="result-card" style="text-align: center; padding: 2.5rem;">
              <p style="color: var(--teks-muted); font-size: 0.95rem; margin: 0;">Tidak ditemukan riwayat pengaduan dengan email: <strong>${emailInput}</strong>.</p>
            </div>`;
        } else {
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let badgeClass = "badge-pending";
            if (data.status === "Selesai") badgeClass = "badge-sukses";
            else if (data.status === "Diproses") badgeClass = "badge-proses";

            const displayMateri = data.materi ? ` - ${data.materi}` : "";
            const tglFormatted = formatTanggal(data.tanggal);

            listHasilLaporan.innerHTML += `
              <div class="result-card">
                <div class="result-header">
                  <div>
                    <span style="font-size: 0.8rem; color: var(--teks-muted); display: block;">KODE TIKET: <strong>${data.kodeUnik || docSnap.id.substring(0, 8)}</strong> • Dikirim ${tglFormatted}</span>
                    <strong style="color: var(--merah-gelap); font-size: 1.05rem;">${data.kategori || "Pengaduan"}${displayMateri}</strong>
                  </div>
                  <span class="badge ${badgeClass}">${data.status || "Menunggu"}</span>
                </div>
                ${buildStepper(data.status || "Menunggu")}
                <div style="margin-bottom: 1.2rem;">
                  <span style="font-size: 0.8rem; color: var(--teks-muted); display: block;">URAIAN LAPORAN</span>
                  <p style="color: var(--teks-gelap); font-size: 0.95rem; margin: 0.3rem 0 0 0; line-height: 1.5;">${data.laporan || "-"}</p>
                </div>
                <div class="result-response-box">
                  <strong style="font-size: 0.85rem; color: var(--merah-gelap); display: block; margin-bottom: 0.2rem;">Tanggapan / Progres Terbaru:</strong>
                  <span style="font-size: 0.9rem; color: var(--teks-gelap);">${data.tanggapan || "Menunggu verifikasi lanjutan dari petugas."}</span>
                </div>
              </div>`;
          });
        }
      }

      if (searchBoxWrapper) searchBoxWrapper.style.display = "none";
      if (resultContainer) resultContainer.style.display = "block";
    } catch (error) {
      console.error("Gagal mengambil data: ", error);
      showToast("Terjadi kendala koneksi saat memuat data riwayat laporan.", "error");
    } finally {
      if (btnCari) {
        btnCari.textContent = "Cek Status Laporan";
        btnCari.disabled = false;
      }
    }
  });

  window.resetPencarian = function () {
    if (resultContainer) resultContainer.style.display = "none";
    if (searchBoxWrapper) searchBoxWrapper.style.display = "block";
    const emailEl = document.getElementById("searchEmail");
    if (emailEl) emailEl.value = "";
  };
}

/* ==========================================================================
   6. CONTROLLER: LOGIN ADMIN / STAF (login.html)
   ========================================================================== */
function initLoginPage() {
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const btnLogin = document.getElementById("btnLogin");
  if (!loginForm) return;

  const togglePassBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("adminPassword");
  if (togglePassBtn && passwordInput) {
    togglePassBtn.addEventListener("click", function () {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      togglePassBtn.classList.toggle("is-visible", isHidden);
      togglePassBtn.setAttribute("aria-label", isHidden ? "Sembunyikan kata sandi" : "Tampilkan kata sandi");
    });
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("adminEmail")?.value.trim() || "";
    const password = document.getElementById("adminPassword")?.value || "";

    if (btnLogin) {
      btnLogin.innerHTML = '<span class="spinner"></span> Memverifikasi...';
      btnLogin.disabled = true;
    }
    if (loginError) loginError.style.display = "none";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard-staf.html";
    } catch (error) {
      console.error("Gagal login: ", error);
      if (loginError) {
        loginError.style.display = "block";
        loginError.textContent = "Autentikasi gagal. Periksa kembali email dan sandi Anda.";
      }
      if (btnLogin) {
        btnLogin.textContent = "Masuk Sistem";
        btnLogin.disabled = false;
      }
    }
  });
}

/* ==========================================================================
   7. CONTROLLER: DASHBOARD STAF (dashboard-staf.html)
   ========================================================================== */
let ALL_REPORTS = [];
let ALL_SARAN = [];
let CURRENT_FILTER = "Semua";
let CURRENT_SEARCH = "";

function initDashboardPage() {
  const tbody = document.getElementById("reportListBody");
  const btnLogout = document.getElementById("btnLogout");
  if (!tbody && !btnLogout) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    loadReports();
    loadSaran();
  });

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      signOut(auth)
        .then(() => (window.location.href = "login.html"))
        .catch((error) => console.error("Gagal keluar: ", error));
    });
  }

  const filterTabs = document.querySelectorAll(".filter-tab");
  filterTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      CURRENT_FILTER = tab.dataset.filter;
      renderReportList();
    });
  });

  const searchInput = document.getElementById("searchReport");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      CURRENT_SEARCH = e.target.value.trim().toLowerCase();
      renderReportList();
    });
  }

  const saranHeader = document.getElementById("saranPanelHeader");
  if (saranHeader) {
    saranHeader.addEventListener("click", () => {
      const body = document.getElementById("saranPanelBody");
      const chev = saranHeader.querySelector(".chev");
      body?.classList.toggle("open");
      chev?.classList.toggle("open");
    });
  }

  async function loadReports() {
    if (!tbody) return;
    tbody.innerHTML = `
      <div class="skeleton" style="height: 130px; margin-bottom: 1rem;"></div>
      <div class="skeleton" style="height: 130px;"></div>`;
    try {
      const querySnapshot = await getDocs(collection(db, "pengaduan"));
      ALL_REPORTS = [];
      querySnapshot.forEach((docSnap) => {
        ALL_REPORTS.push({ id: docSnap.id, ...docSnap.data() });
      });
      ALL_REPORTS.sort((a, b) => new Date(a.tanggal || 0) - new Date(b.tanggal || 0));

      updateStatCards();
      updateCategoryStats();
      updateSourceStats();
      renderTrendChart();
      renderReportList();
    } catch (error) {
      console.error("Gagal memuat data: ", error);
      if (tbody) {
        tbody.innerHTML = `<div style="text-align:center;color:var(--merah-utama);padding:2rem;">Gagal memuat data dari database. Periksa koneksi & konfigurasi Firebase Anda.</div>`;
      }
    }
  }

  async function loadSaran() {
    const saranList = document.getElementById("saranList");
    const saranCount = document.getElementById("saranCount");
    if (!saranList) return;
    try {
      const querySnapshot = await getDocs(collection(db, "saran"));
      ALL_SARAN = [];
      querySnapshot.forEach((docSnap) => ALL_SARAN.push({ id: docSnap.id, ...docSnap.data() }));
      ALL_SARAN.sort((a, b) => new Date(b.tanggal || 0) - new Date(a.tanggal || 0));

      if (saranCount) saranCount.textContent = `${ALL_SARAN.length} baru`;

      if (!ALL_SARAN.length) {
        saranList.innerHTML = `<div class="saran-item"><span class="saran-text">Belum ada saran & masukan yang masuk.</span></div>`;
        return;
      }

      saranList.innerHTML = ALL_SARAN.map(
        (s) => `
        <div class="saran-item">
          <div>
            <span class="saran-date">${formatTanggal(s.tanggal)} • ${s.kategori || "Umum"}</span>
            <span class="saran-text">${s.isi || "-"}</span>
          </div>
          <span class="saran-title">${s.judul || "Tanpa judul"}</span>
        </div>`
      ).join("");
    } catch (error) {
      console.error("Gagal memuat saran:", error);
    }
  }

  function updateStatCards() {
    const pending = ALL_REPORTS.filter((r) => (r.status || "Menunggu") === "Menunggu").length;
    const process = ALL_REPORTS.filter((r) => r.status === "Diproses").length;
    const done = ALL_REPORTS.filter((r) => r.status === "Selesai").length;

    const elPending = document.getElementById("pendingCount");
    const elProcess = document.getElementById("processCount");
    const elDone = document.getElementById("doneCount");
    if (elPending) elPending.textContent = pending;
    if (elProcess) elProcess.textContent = process;
    if (elDone) elDone.textContent = done;
  }

  function updateCategoryStats() {
    const wrap = document.getElementById("categoryStats");
    if (!wrap) return;
    const total = ALL_REPORTS.length || 1;
    const counts = {};
    ALL_REPORTS.forEach((r) => {
      const key = r.kategori || "Lainnya";
      counts[key] = (counts[key] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (!entries.length) {
      wrap.innerHTML = `<p style="color:var(--teks-muted);font-size:0.85rem;">Belum ada data kategori.</p>`;
      return;
    }

    wrap.innerHTML = entries
      .map(([kategori, count]) => {
        const pct = Math.round((count / total) * 100);
        return `
          <div class="stat-progress-row">
            <div class="label-row"><span>${kategori}</span><span>${pct}%</span></div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          </div>`;
      })
      .join("");
  }

  function updateSourceStats() {
    const wrap = document.getElementById("sourceStats");
    if (!wrap) return;
    const total = ALL_REPORTS.length || 1;
    const publik = ALL_REPORTS.filter((r) => (r.sumber || "Publik") === "Publik").length;
    const manual = total - publik;
    const publikPct = Math.round((publik / total) * 100);
    const manualPct = 100 - publikPct;

    wrap.innerHTML = `
      <div class="source-split"><span><i class="fa-solid fa-globe"></i> Publik ${publikPct}%</span><span><i class="fa-solid fa-pen-to-square"></i> Manual/Offline ${manualPct}%</span></div>
      <div class="source-track">
        <div class="publik" style="width:${publikPct}%"></div>
        <div class="manual" style="width:${manualPct}%"></div>
      </div>`;
  }

  function renderTrendChart() {
    const chartWrap = document.getElementById("trendChart");
    const labelsWrap = document.getElementById("trendChartLabels");
    if (!chartWrap) return;

    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("id-ID", { month: "short" }) });
    }

    const masukPerBulan = months.map((m) => 0);
    const selesaiPerBulan = months.map((m) => 0);

    ALL_REPORTS.forEach((r) => {
      if (!r.tanggal) return;
      const d = new Date(r.tanggal);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const idx = months.findIndex((m) => m.key === key);
      if (idx !== -1) {
        masukPerBulan[idx]++;
        if (r.status === "Selesai") selesaiPerBulan[idx]++;
      }
    });

    const maxVal = Math.max(...masukPerBulan, ...selesaiPerBulan, 1);

    chartWrap.innerHTML = months
      .map((m, i) => {
        const hMasuk = Math.max(4, Math.round((masukPerBulan[i] / maxVal) * 150));
        const hSelesai = Math.max(4, Math.round((selesaiPerBulan[i] / maxVal) * 150));
        return `
          <div class="bar-group" title="${m.label}: ${masukPerBulan[i]} masuk, ${selesaiPerBulan[i]} selesai">
            <div class="bar masuk" style="height:${hMasuk}px"></div>
            <div class="bar selesai" style="height:${hSelesai}px"></div>
          </div>`;
      })
      .join("");

    if (labelsWrap) {
      labelsWrap.innerHTML = months.map((m) => `<span>${m.label}</span>`).join("");
    }
  }

  function renderReportList() {
    if (!tbody) return;

    let filtered = ALL_REPORTS.filter((r) => {
      const status = r.status || "Menunggu";
      const matchFilter = CURRENT_FILTER === "Semua" || status === CURRENT_FILTER;
      const haystack = `${r.nama || ""} ${r.email || ""}`.toLowerCase();
      const matchSearch = !CURRENT_SEARCH || haystack.includes(CURRENT_SEARCH);
      return matchFilter && matchSearch;
    });

    const elTotal = document.getElementById("totalCount");
    if (elTotal) elTotal.textContent = ALL_REPORTS.length;

    if (!filtered.length) {
      tbody.innerHTML = `<div style="text-align:center;color:var(--teks-muted);padding:2.5rem;background:var(--putih);border-radius:var(--radius-lg);border:1px solid var(--garis);">Tidak ada pengaduan pada kategori ini.</div>`;
      return;
    }

    tbody.innerHTML = filtered.map((r) => buildReportCard(r)).join("");

    tbody.querySelectorAll(".link-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = document.getElementById(`panel-${btn.dataset.id}`);
        panel?.classList.toggle("open");
        btn.classList.toggle("open");
        btn.querySelector(".btn-text").textContent = panel?.classList.contains("open")
          ? "Tutup"
          : "Lihat Detail & Tanggapi";
      });
    });

    tbody.querySelectorAll(".btn-simpan-tanggapan").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const statusSelect = document.getElementById(`status-${id}`);
        const tanggapanText = document.getElementById(`tanggapan-${id}`);
        const newStatus = statusSelect?.value || "Menunggu";
        const newTanggapan = tanggapanText?.value.trim() || "";

        btn.innerHTML = '<span class="spinner"></span> Menyimpan...';
        btn.disabled = true;

        try {
          await updateDoc(doc(db, "pengaduan", id), {
            status: newStatus,
            tanggapan: newTanggapan || "Laporan sedang ditangani oleh tim pemeriksa."
          });
          showToast("Tanggapan & status berhasil disimpan.");
          await loadReports();
        } catch (error) {
          console.error("Gagal menyimpan tanggapan:", error);
          showToast("Gagal menyimpan tanggapan, coba lagi.", "error");
          btn.textContent = "Simpan Tanggapan";
          btn.disabled = false;
        }
      });
    });
  }

  function buildReportCard(r) {
    const status = r.status || "Menunggu";
    let badgeClass = "badge-pending";
    if (status === "Selesai") badgeClass = "badge-sukses";
    else if (status === "Diproses") badgeClass = "badge-proses";

    const sumber = r.sumber || "Publik";
    const isManual = sumber !== "Publik";
    const refId = r.kodeUnik || r.id.substring(0, 8);
    const tgl = formatTanggal(r.tanggal);
    const isAnonim = !r.nama;

    return `
      <div class="report-card">
        <div class="report-card-body">
          <div class="report-card-top">
            <div class="badges-left">
              <span class="badge ${badgeClass}">${status}</span>
              <span class="date-text"><i class="fa-regular fa-calendar"></i> ${tgl}</span>
              <span class="badge badge-sumber">${sumber.toUpperCase()}</span>
              ${isManual ? '<span class="badge badge-manual">MANUAL</span>' : ""}
            </div>
            <span class="ref-id">ID: #${refId}</span>
          </div>
          <div class="report-fields">
            <div>
              <div class="field-label">Kategori</div>
              <div class="field-value">${r.kategori || "-"}</div>
            </div>
            <div>
              <div class="field-label">Materi / Sub-kategori</div>
              <div class="field-value">${r.materi || "-"}</div>
            </div>
            <div>
              <div class="field-label">Pelapor</div>
              <div class="field-value"><i class="fa-solid fa-user"></i> ${isAnonim ? "Anonim" : r.nama}<small>${r.email || "N/A"}</small></div>
            </div>
            <div>
              <div class="field-label">Telepon</div>
              <div class="field-value">${r.telepon || "N/A"}</div>
            </div>
          </div>
          <div class="report-materi">
            <span class="field-label">Materi Laporan</span>
            ${r.laporan || "-"}
          </div>
          <div class="report-card-footer">
            <button class="link-toggle" data-id="${r.id}">
              <span class="btn-text">Lihat Detail & Tanggapi</span> <span class="chev">▾</span>
            </button>
          </div>
        </div>
        <div class="response-panel" id="panel-${r.id}">
          <h4>Panel Tanggapan</h4>
          <div class="form-group">
            <label>Update Status</label>
            <select id="status-${r.id}">
              <option value="Menunggu" ${status === "Menunggu" ? "selected" : ""}>Menunggu</option>
              <option value="Diproses" ${status === "Diproses" ? "selected" : ""}>Diproses</option>
              <option value="Selesai" ${status === "Selesai" ? "selected" : ""}>Selesai</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label>Tanggapan Staf (Tampil untuk pelapor)</label>
            <textarea id="tanggapan-${r.id}" rows="3" placeholder="Tuliskan tanggapan resmi di sini...">${r.tanggapan || ""}</textarea>
          </div>
          <div class="response-panel-footer">
            <button class="btn-primary btn-simpan-tanggapan" data-id="${r.id}">Simpan Tanggapan</button>
          </div>
        </div>
      </div>`;
  }
}

/* ==========================================================================
   8. CONTROLLER: PENGADUAN SECARA OFFLINE (input-manual.html)
   ========================================================================== */
function initOfflinePage() {
  const form = document.getElementById("offlineForm");
  const formContainer = document.getElementById("formContainer");
  const successContainer = document.getElementById("successContainer");
  const btnSimpan = document.getElementById("btnSimpan");
  const errorAlert = document.getElementById("errorAlert");
  if (!form) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "login.html";
  });

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("dokumentasi");
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.style.borderColor = "var(--merah-utama)";
    });
    dropzone.addEventListener("dragleave", () => {
      dropzone.style.borderColor = "";
    });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.style.borderColor = "";
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        updateDropzoneLabel();
      }
    });
    fileInput.addEventListener("change", updateDropzoneLabel);
  }

  function updateDropzoneLabel() {
    const label = document.getElementById("dropzoneLabel");
    if (label && fileInput.files.length) {
      label.innerHTML = `<strong>${fileInput.files[0].name}</strong> dipilih`;
    }
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (errorAlert) errorAlert.style.display = "none";

    const tanggalPengaduan = document.getElementById("tanggalPengaduan")?.value || "";
    const nama = document.getElementById("nama")?.value.trim() || "";
    const alamat = document.getElementById("alamat")?.value.trim() || "";
    const noHp = document.getElementById("noHp")?.value.trim() || "";
    const materiPengaduan = document.getElementById("materiPengaduan")?.value.trim() || "";
    const jawabanPetugas = document.getElementById("jawabanPetugas")?.value.trim() || "";
    const file = fileInput?.files?.[0];

    if (!tanggalPengaduan || !nama || !alamat || !noHp || !materiPengaduan || !jawabanPetugas || !file) {
      if (errorAlert) {
        errorAlert.style.display = "block";
        errorAlert.textContent = "Mohon lengkapi semua kolom wajib, termasuk foto Dokumentasi.";
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      if (errorAlert) {
        errorAlert.style.display = "block";
        errorAlert.textContent = "Ukuran file Dokumentasi maksimal 10 MB.";
      }
      return;
    }

    if (btnSimpan) {
      btnSimpan.innerHTML = '<span class="spinner"></span> Menyimpan ke Sistem...';
      btnSimpan.disabled = true;
    }

    try {
      const uniqueCode = generateKode("BPS-OFL");
      const dokumentasiUrl = await unggahSatuFile(file, "dokumentasi-offline");

      await addDoc(collection(db, "pengaduan"), {
        kodeUnik: uniqueCode,
        tanggalPengaduan,
        nama,
        alamat,
        telepon: noHp,
        email: "",
        kategori: "Pengaduan Offline",
        materi: materiPengaduan,
        laporan: materiPengaduan,
        dokumentasiUrl,
        status: "Selesai",
        sumber: "Offline",
        tanggal: new Date().toISOString(),
        tanggapan: jawabanPetugas
      });

      if (formContainer) formContainer.style.display = "none";
      if (successContainer) successContainer.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Gagal menyimpan pengaduan offline:", error);
      showToast("Gagal menyimpan laporan ke server. Periksa koneksi internet.", "error");
      if (btnSimpan) {
        btnSimpan.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Pengaduan';
        btnSimpan.disabled = false;
      }
    }
  });
}

/* ==========================================================================
   9. CONTROLLER: FORMULIR ANTI GRATIFIKASI (antigratifikasi.html)
   ========================================================================== */
function initAntiGratifikasiPage() {
  const form = document.getElementById("gratifikasiForm");
  const formContainer = document.getElementById("formContainer");
  const successContainer = document.getElementById("successContainer");
  const btnSimpan = document.getElementById("btnSimpanGratifikasi");
  if (!form) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "login.html";
  });

  const MAX_FILES = 10;
  const MAX_SIZE_MB = 10;

  const bentukLainnyaCheck = document.getElementById("bentukLainnyaCheck");
  const bentukLainnyaWrapper = document.getElementById("bentukLainnyaWrapper");
  if (bentukLainnyaCheck && bentukLainnyaWrapper) {
    bentukLainnyaCheck.addEventListener("change", () => {
      bentukLainnyaWrapper.classList.toggle("show", bentukLainnyaCheck.checked);
    });
  }

  const dropzone = document.getElementById("dropzoneGratifikasi");
  const fileInput = document.getElementById("lampiranGratifikasi");
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.style.borderColor = "var(--merah-utama)";
    });
    dropzone.addEventListener("dragleave", () => {
      dropzone.style.borderColor = "";
    });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.style.borderColor = "";
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        updateDropzoneLabel();
      }
    });
    fileInput.addEventListener("change", updateDropzoneLabel);
  }

  function validateFiles(files) {
    if (!files || files.length === 0) {
      showToast("Mohon unggah minimal satu foto barang yang diberikan.", "error");
      return false;
    }
    if (files.length > MAX_FILES) {
      showToast(`Maksimal ${MAX_FILES} file yang dapat diunggah.`, "error");
      return false;
    }
    for (const f of files) {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        showToast(`File "${f.name}" melebihi ukuran maksimal ${MAX_SIZE_MB}MB.`, "error");
        return false;
      }
    }
    return true;
  }

  function updateDropzoneLabel() {
    const label = document.getElementById("dropzoneGratifikasiLabel");
    if (!label || !fileInput.files.length) return;
    if (!validateFiles(fileInput.files)) {
      fileInput.value = "";
      label.innerHTML = "<strong>Unggah foto barang</strong> atau seret ke sini";
      return;
    }
    label.textContent = `${fileInput.files.length} file dipilih`;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const namaPemberi = document.getElementById("namaPemberi")?.value.trim() || "";
    const instansiPemberi = document.getElementById("instansiPemberi")?.value.trim() || "";
    const alasanDiterima = document.getElementById("alasanDiterima")?.value.trim() || "";
    const bentukChecked = Array.from(document.querySelectorAll('input[name="bentuk"]:checked')).map((el) => el.value);
    const bentukError = document.getElementById("bentukError");

    if (bentukChecked.length === 0) {
      if (bentukError) bentukError.style.display = "block";
      document.getElementById("bentukPemberianList")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (bentukError) bentukError.style.display = "none";

    const bentukLainnyaText = document.getElementById("bentukLainnyaText")?.value.trim() || "";
    const bentukFinal = bentukChecked.map((v) =>
      v === "Lainnya" && bentukLainnyaText ? `Lainnya: ${bentukLainnyaText}` : v
    );

    if (!validateFiles(fileInput?.files)) return;

    if (btnSimpan) {
      btnSimpan.innerHTML = '<span class="spinner"></span> Menyimpan ke Sistem...';
      btnSimpan.disabled = true;
    }

    try {
      const uniqueCode = generateKode("BPS-GRAT");
      await addDoc(collection(db, "gratifikasi"), {
        kodeUnik: uniqueCode,
        namaPemberi,
        instansiPemberi,
        bentukPemberian: bentukFinal,
        jumlahFoto: fileInput?.files.length || 0,
        alasanDiterima,
        status: "Tercatat",
        sumber: "Manual",
        tanggal: new Date().toISOString()
      });

      if (formContainer) formContainer.style.display = "none";
      if (successContainer) successContainer.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Gagal menyimpan laporan gratifikasi:", error);
      showToast("Gagal menyimpan laporan ke server. Periksa koneksi internet.", "error");
      if (btnSimpan) {
        btnSimpan.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Laporan Gratifikasi';
        btnSimpan.disabled = false;
      }
    }
  });
}

/* ==========================================================================
   10. CONTROLLER: MONITORING PUBLIK (index.html)
   ========================================================================== */
function initIndexMonitorPage() {
  const totalEl = document.getElementById("monTotal");
  const menungguEl = document.getElementById("monMenunggu");
  const selesaiEl = document.getElementById("monSelesai");
  if (!totalEl) return;

  function animateNumber(el, target) {
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * progress).toLocaleString("id-ID");
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  getDocs(collection(db, "pengaduan"))
    .then((snapshot) => {
      let total = 0, menunggu = 0, diprosesSelesai = 0;
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        total++;
        if (d.status === "Menunggu") menunggu++;
        else diprosesSelesai++;
      });
      animateNumber(totalEl, total);
      animateNumber(menungguEl, menunggu);
      animateNumber(selesaiEl, diprosesSelesai);
    })
    .catch((error) => {
      console.error("Gagal memuat data monitoring:", error);
      totalEl.textContent = "-";
      menungguEl.textContent = "-";
      selesaiEl.textContent = "-";
    });
}

/* ==========================================================================
   DOM READY DISPATCHER
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initScrollReveal();
  initIndexMonitorPage();
  initPengaduanPage();
  initSaranPage();
  initCekStatusPage();
  initLoginPage();
  initDashboardPage();
  initOfflinePage();
  initAntiGratifikasiPage();
});