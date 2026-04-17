const CATEGORY_LABELS = ["Food", "Transport", "Fun"];

const form = document.getElementById("transactionForm");
const list = document.getElementById("transactionList");
const balanceEl = document.getElementById("totalBalance");
const transactionCountEl = document.getElementById("transactionCount");
const formMessageEl = document.getElementById("formMessage");
const chartCanvas = document.getElementById("chart");

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

function readStoredTransactions() {
  try {
    return JSON.parse(localStorage.getItem("transactions"));
  } catch (error) {
    return [];
  }
}

function normalizeTransactions(rawTransactions) {
  if (!Array.isArray(rawTransactions)) {
    return [];
  }

  return rawTransactions
    .map((item) => {
      const amount = Number(item?.amount);
      const category = CATEGORY_LABELS.includes(item?.category) ? item.category : null;
      const name = typeof item?.name === "string" ? item.name.trim() : "";

      if (!name || !category || !Number.isFinite(amount) || amount <= 0) {
        return null;
      }

      return { name, amount, category };
    })
    .filter(Boolean);
}

let transactions = normalizeTransactions(readStoredTransactions());
let chart;

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function buildCategoryTotals() {
  return transactions.reduce(
    (totals, transaction) => {
      totals[transaction.category] += transaction.amount;
      return totals;
    },
    { Food: 0, Transport: 0, Fun: 0 }
  );
}

function setFormMessage(message, type = "info") {
  formMessageEl.textContent = message;
  formMessageEl.style.color = type === "error" ? "#c64747" : "#586b5e";
}

function saveTransactions() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function renderTransactions() {
  list.innerHTML = "";

  if (!transactions.length) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = "Belum ada transaksi. Tambahkan transaksi pertama kamu di form atas.";
    list.appendChild(emptyState);
    return;
  }

  transactions.forEach((transaction, index) => {
    const item = document.createElement("li");
    item.className = "transaction-item";

    const info = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = transaction.name;
    const category = document.createElement("span");
    category.textContent = transaction.category;

    info.append(name, category);

    const meta = document.createElement("div");
    meta.className = "meta";

    const amount = document.createElement("strong");
    amount.textContent = formatCurrency(transaction.amount);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.dataset.index = String(index);
    deleteButton.textContent = "Delete";

    meta.append(amount, deleteButton);
    item.append(info, meta);
    list.appendChild(item);
  });
}

function updateSummary() {
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  balanceEl.textContent = formatCurrency(total);
  transactionCountEl.textContent = `${transactions.length} transaksi tercatat`;
}

function updateChart() {
  const categoryTotals = buildCategoryTotals();

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(chartCanvas, {
    type: "doughnut",
    data: {
      labels: CATEGORY_LABELS,
      datasets: [
        {
          data: CATEGORY_LABELS.map((label) => categoryTotals[label]),
          backgroundColor: ["#D96C3D", "#203E2C", "#E6B566"],
          borderWidth: 0,
          hoverOffset: 12
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            boxWidth: 10,
            padding: 18
          }
        }
      }
    }
  });
}

function updateUI() {
  renderTransactions();
  updateSummary();
  updateChart();
  saveTransactions();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("itemName").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value;

  if (!name || !category || !Number.isFinite(amount) || amount <= 0) {
    setFormMessage("Isi semua field dengan benar. Nominal harus lebih dari 0.", "error");
    return;
  }

  transactions.unshift({ name, amount, category });
  form.reset();
  setFormMessage("Transaksi berhasil ditambahkan.");
  updateUI();
});

list.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-btn");

  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);

  if (!Number.isInteger(index)) {
    return;
  }

  transactions.splice(index, 1);
  setFormMessage("Transaksi berhasil dihapus.");
  updateUI();
});

updateUI();
