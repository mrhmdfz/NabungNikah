// assets/js/tabungan.js
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  doc as docRef,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { db } from "../js/firebase.js";

export function initTabungan() {
  // Elemen DOM
  const targetInput = document.getElementById("targetInput");
  const saveTargetBtn = document.getElementById("saveTargetBtn");
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
  const targetDocRef = doc(db, "tabungan_meta", "target");

  let targetValue = 0;

  // 🔁 Load target real-time
  onSnapshot(targetDocRef, (snap) => {
    if (snap.exists()) {
      targetValue = snap.data().value;
      targetInput.value = targetValue;
      updateUI();
    }
  });

  // 🔁 Load transaksi real-time
  onSnapshot(query(tabunganRef), (snapshot) => {
    const transactions = [];
    snapshot.forEach((doc) => transactions.push({ id: doc.id, ...doc.data() }));
    renderTransactions(transactions);
  });

  // ➕ Buka modal tambah transaksi
  addSaveBtn.addEventListener("click", () => {
    modalName.value = "";
    modalAmount.value = "";
    modalNote.value = "";
    addModal.classList.remove("hidden");
  });

  cancelModal.addEventListener("click", () => addModal.classList.add("hidden"));

  // 💾 Simpan transaksi dari modal
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

  // 🔄 Simpan target ke Firebase
  saveTargetBtn.addEventListener("click", async () => {
    const newTarget = Number(targetInput.value);
    if (!newTarget || newTarget <= 0) return alert("Isi target yang valid!");
    await setDoc(targetDocRef, { value: newTarget });
    alert("Target berhasil disimpan!");
  });

  // 🧹 Reset semua transaksi
  resetBtn.addEventListener("click", async () => {
    if (!confirm("Yakin mau reset semua data tabungan?")) return;
    const snapshot = await getDocs(tabunganRef);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, "tabungan", d.id));
    }
  });

  // 🧮 Render transaksi
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
        <button data-id="${t.id}" class="text-red-500 text-sm hover:text-red-700">Hapus</button>
      `;

      // Event hapus
      li.querySelector("button").addEventListener("click", async () => {
        if (!confirm("Hapus transaksi ini?")) return;
        await deleteDoc(doc(db, "tabungan", t.id));
      });

      txnList.appendChild(li);
    });

    updateUI(total);
  }

  // 🔢 Update progress dan sisa target
  function updateUI(total = 0) {
    savedTotalEl.textContent = `Rp ${total.toLocaleString("id-ID")}`;
    const remaining = Math.max(targetValue - total, 0);
    remainingEl.textContent = `Rp ${remaining.toLocaleString("id-ID")}`;

    const percent = targetValue > 0 ? (total / targetValue) * 100 : 0;
    progressArc.setAttribute("stroke-dasharray", `${percent.toFixed(1)}, 100`);
    progressText.textContent = `${percent.toFixed(0)}%`;
  }
}
