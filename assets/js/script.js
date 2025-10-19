// assets/js/script.js
document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  const tabButtons = document.querySelectorAll(".tab-btn");

  // Fungsi untuk load halaman HTML ke <main>
  async function loadPage(page) {
    const res = await fetch(`${page}.html`);
    const html = await res.text();
    app.innerHTML = html;

    // Setelah halaman dimuat, jalankan script spesifik
    if (page === "tabungan") {
      import("./tabungan.js").then((m) => m.initTabungan());
    } else if (page === "rencana") {
      import("./rencana.js").then((m) => m.initRencana());
    }
  }

  // Klik tab
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) =>
        b.classList.remove("bg-blue-500", "text-white")
      );
      btn.classList.add("bg-blue-500", "text-white");
      loadPage(btn.dataset.route);
    });
  });

  // Default: buka tabungan
  loadPage("tabungan");
  tabButtons[0].classList.add("bg-blue-500", "text-white");
});
