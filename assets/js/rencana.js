// assets/js/rencana.js
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { db } from "../js/firebase.js";

export function initRencana() {
  const itemName = document.getElementById("itemName");
  const itemCost = document.getElementById("itemCost");
  const addItemBtn = document.getElementById("addItemBtn");
  const itemsList = document.getElementById("itemsList");
  const allocateSelect = document.getElementById("allocateSelect");
  const allocateAmount = document.getElementById("allocateAmount");
  const allocateBtn = document.getElementById("allocateBtn");
  const autoAllocateBtn = document.getElementById("autoAllocateBtn");
  const summary = document.getElementById("summary");
  const resetItemsBtn = document.getElementById("resetItemsBtn");

  // Modal Edit
  const editModal = document.createElement("div");
  editModal.className =
    "fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 hidden z-50";
  editModal.innerHTML = `
    <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
      <h3 class="text-lg font-semibold text-blue-700 mb-4">Edit Item</h3>
      <div class="space-y-3">
        <div>
          <label class="block text-sm text-slate-600 mb-1">Nama Item</label>
          <input id="editItemName" type="text" class="w-full p-2 rounded-md border focus:ring focus:ring-blue-200"/>
        </div>
        <div>
          <label class="block text-sm text-slate-600 mb-1">Estimasi Biaya</label>
          <input id="editItemCost" type="number" class="w-full p-2 rounded-md border focus:ring focus:ring-blue-200"/>
        </div>
      </div>
      <div class="flex justify-end mt-4 gap-2">
        <button id="cancelEditBtn" class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>
        <button id="saveEditBtn" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Simpan</button>
      </div>
    </div>
  `;
  document.body.appendChild(editModal);

  const editItemName = document.getElementById("editItemName");
  const editItemCost = document.getElementById("editItemCost");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const saveEditBtn = document.getElementById("saveEditBtn");

  let currentEditId = null;

  const rencanaRef = collection(db, "rencana");

  // 🔁 Real-time listener
  const q = query(rencanaRef);
  onSnapshot(q, (snapshot) => {
    const items = [];
    snapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    renderItems(items);
  });

  // ➕ Tambah item baru
  addItemBtn.addEventListener("click", async () => {
    const name = itemName.value.trim();
    const cost = Number(itemCost.value);
    if (!name || !cost) return alert("Isi nama dan biaya estimasi!");

    await addDoc(rencanaRef, {
      name,
      cost,
      allocated: 0,
      date: new Date().toISOString(),
    });

    itemName.value = "";
    itemCost.value = "";
  });

  // 💸 Alokasi manual
  allocateBtn.addEventListener("click", async () => {
    const itemId = allocateSelect.value;
    const amount = Number(allocateAmount.value);
    if (!itemId || !amount) return alert("Pilih item dan isi nominal alokasi!");

    const itemDoc = doc(db, "rencana", itemId);
    const snapshot = await getDocs(rencanaRef);
    let targetDoc = null;
    snapshot.forEach((d) => {
      if (d.id === itemId) targetDoc = d;
    });
    if (!targetDoc) return;

    const data = targetDoc.data();
    const newAllocated = data.allocated + amount;
    if (newAllocated > data.cost)
      return alert("Nominal melebihi estimasi biaya!");

    await updateDoc(itemDoc, { allocated: newAllocated });
    allocateAmount.value = "";
  });

  // 🤖 Alokasi otomatis
  autoAllocateBtn.addEventListener("click", async () => {
    const snapshot = await getDocs(rencanaRef);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (items.length === 0) return alert("Belum ada item rencana!");
    const totalCost = items.reduce((sum, i) => sum + i.cost, 0);
    const totalTarget =
      Number(localStorage.getItem("targetValue")) || totalCost;

    for (const item of items) {
      const portion = item.cost / totalCost;
      const allocated = Math.round(totalTarget * portion);
      await updateDoc(doc(db, "rencana", item.id), { allocated });
    }
    alert("Alokasi otomatis selesai!");
  });

  // 🧹 Reset semua item
  resetItemsBtn.addEventListener("click", async () => {
    if (!confirm("Yakin ingin hapus semua item rencana?")) return;
    const snapshot = await getDocs(rencanaRef);
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, "rencana", d.id));
    }
  });

  // Modal edit
  cancelEditBtn.addEventListener("click", () => {
    editModal.classList.add("hidden");
    currentEditId = null;
  });

  saveEditBtn.addEventListener("click", async () => {
    if (!currentEditId) return;
    const newName = editItemName.value.trim();
    const newCost = Number(editItemCost.value);
    if (!newName || !newCost) return alert("Nama dan biaya harus diisi!");
    await updateDoc(doc(db, "rencana", currentEditId), {
      name: newName,
      cost: newCost,
    });
    editModal.classList.add("hidden");
    currentEditId = null;
  });

  // 🧮 Render item list dan summary
  function renderItems(items) {
    itemsList.innerHTML = "";
    allocateSelect.innerHTML = `<option value="">Pilih item</option>`;

    let totalCost = 0;
    let totalAlloc = 0;

    items.forEach((i) => {
      totalCost += i.cost;
      totalAlloc += i.allocated;

      const li = document.createElement("li");
      li.className =
        "p-2 bg-white rounded-md flex justify-between items-center shadow-sm";
      const percent = ((i.allocated / i.cost) * 100).toFixed(0);

      li.innerHTML = `
      <div>
        <p class="font-medium">${i.name}</p>
        <p class="text-xs text-slate-500">
          Rp ${i.allocated.toLocaleString(
            "id-ID"
          )} / Rp ${i.cost.toLocaleString("id-ID")} (${percent}%)
        </p>
      </div>
      <div class="flex gap-2 items-center">
        <button class="editBtn text-blue-500 text-sm" data-id="${
          i.id
        }">Edit</button>
        <button class="deleteBtn text-red-500 text-sm" data-id="${
          i.id
        }">Hapus</button>
        <div class="text-blue-600 text-sm">${percent}%</div>
      </div>
    `;

      itemsList.appendChild(li);

      // isi dropdown alokasi
      const opt = document.createElement("option");
      opt.value = i.id;
      opt.textContent = i.name;
      allocateSelect.appendChild(opt);
    });

    const sisa = Math.max(totalCost - totalAlloc, 0);
    summary.innerHTML = `
    Total Estimasi: <b>Rp ${totalCost.toLocaleString("id-ID")}</b><br>
    Total Dialokasikan: <b>Rp ${totalAlloc.toLocaleString("id-ID")}</b><br>
    Sisa Kebutuhan: <b class="text-red-500">Rp ${sisa.toLocaleString(
      "id-ID"
    )}</b>
  `;

    // Event Edit & Hapus
    document.querySelectorAll(".editBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const item = items.find((it) => it.id === id);
        if (!item) return;

        // buka modal
        document.getElementById("editModal").classList.remove("hidden");
        document.getElementById("editItemName").value = item.name;
        document.getElementById("editItemCost").value = item.cost;

        // Simpan
        const saveBtn = document.getElementById("saveEditBtn");
        const cancelBtn = document.getElementById("cancelEditBtn");

        const closeModal = () =>
          document.getElementById("editModal").classList.add("hidden");

        cancelBtn.onclick = () => closeModal();
        saveBtn.onclick = async () => {
          const newName = document.getElementById("editItemName").value.trim();
          const newCost = Number(document.getElementById("editItemCost").value);
          if (!newName || !newCost) return alert("Isi nama & biaya estimasi!");
          await updateDoc(doc(db, "rencana", id), {
            name: newName,
            cost: newCost,
          });
          closeModal();
        };
      });
    });

    document.querySelectorAll(".deleteBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Hapus item ini?")) return;
        await deleteDoc(doc(db, "rencana", id));
      });
    });
  }
}
