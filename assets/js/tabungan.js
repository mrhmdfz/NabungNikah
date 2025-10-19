// assets/js/tabungan.js
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { db } from "../js/firebase.js";

export function initTabungan() {
  // Elemen DOM
  const targetInput = document.getElementById("targetInput");
  const addSaveBtn = document.getElementById("addSaveBtn");
  const resetBtn = document.getElementById("resetBtn");
  const txnList = document.getElementById("txnList");
  const savedTotalEl = document.getElementById("savedTotal");
  const remainingEl = document.getElementById("remaining");
  const progressArc = document.getElementById("progressArc");
  const progressText = document.getElementById("progressText");

  // Modal
  const addModal = document.getElementById("addModal");
  const modalName = document.getElementById("modalName");
  const modalAmount = document.getElementById("modalAmount");
  const modalNote = document.getElementById("modalNote");
  const cancelModal = document.getElementById("cancelModal");
  const saveModalBtn = document.getElementById("saveModalBtn");

  const tabunganRef = collection(db, "tabungan");
  const targetDocRef = doc(db, "tabungan", "target");
  let targetValue = 0;

  // 🔁 Real-time listener target
  onSnapshot(targetDocRef, (docSnap) => {
    if (docSnap.exists()) {
      targetValue = docSnap.data().value || 0;
      targetInput.value = targetValue;
      updateUI();
    }
  });

  // 🔁 Load data transaksi real-time
  onSnapshot(query(tabunganRef), (snapshot) => {
    const transactions = [];
    snapshot.forEach((doc) => {
      // skip document target
      if (doc.id === "target") return;
      transactions.push({ id: doc.id, ...doc.data() });
    });
    renderTransactions(transactions);
  });

  // Buka modal tambah
  addSaveBtn.addEventListener("click", () => {
    modalName.value = "";
    modalAmount.value = "";
    modalNote.value = "";
    addModal.classList.remove("hidden");
  });

  cancelModal.addEventListener("click", () => addModal.classList.add("hidden"));

  // Simpan transaksi dari modal
  saveModalBtn.addEventListener("click", async () => {
    const name = modalName.value.trim();
    const amount = Number(modalAmount.value);
    const note = modalNote.value.trim();

    if (!name || !amount || amount <= 0) return alert("Data tidak valid!");

    await addDoc(tabunganRef, {
      name,
      amount,
      note,
      date: new Date().toISOString(),
    });

    addModal.classList.add("hidden");
  });

  // Reset semua transaksi (kecuali target)
  resetBtn.addEventListener("click", async () => {
    if (!confirm("Yakin mau reset semua data tabungan?")) return;
    const snapshot = await getDocs(tabunganRef);
    for (const d of snapshot.docs) {
      if (d.id === "target") continue;
      await deleteDoc(doc(db, "tabungan", d.id));
    }
  });

  // Update target ke Firebase
  targetInput.addEventListener("input", async () => {
    targetValue = Number(targetInput.value) || 0;
    await setDoc(targetDocRef, { value: targetValue });
    updateUI();
  });

  // Render transaksi
  function renderTransactions(transactions) {
    txnList.innerHTML = "";
    let total = 0;

    transactions.forEach((t) => {
      total += t.amount;
      const li = document.createElement("li");
      li.className =
        "flex justify-between items-center bg-white p-2 rounded shadow-sm";
      li.innerHTML = `
        <div>
          <span class="font-medium">${t.name}</span> - 
          <span>Rp ${t.amount.toLocaleString("id-ID")}</span>
          ${
            t.note
              ? `<span class="text-xs text-slate-400">(${t.note})</span>`
              : ""
          }
          <div class="text-xs text-slate-400">${new Date(
            t.date
          ).toLocaleDateString("id-ID")}</div>
        </div>
        <button data-id="${t.id}" class="text-red-500 text-sm hover:text-red-700">
          Hapus
        </button>
      `;
      li.querySelector("button").addEventListener("click", async () => {
        if (!confirm("Hapus transaksi ini?")) return;
        await deleteDoc(doc(db, "tabungan", t.id));
      });

      txnList.appendChild(li);
    });

    updateUI(total);
  }

  // Update progress dan sisa target
  function updateUI(total = 0) {
    savedTotalEl.textContent = `Rp ${total.toLocaleString("id-ID")}`;
    const remaining = Math.max(targetValue - total, 0);
    remainingEl.textContent = `Rp ${remaining.toLocaleString("id-ID")}`;

    const percent = targetValue > 0 ? (total / targetValue) * 100 : 0;
    progressArc.setAttribute("stroke-dasharray", `${percent.toFixed(1)}, 100`);
    progressText.textContent = `${percent.toFixed(0)}%`;
  }
}
