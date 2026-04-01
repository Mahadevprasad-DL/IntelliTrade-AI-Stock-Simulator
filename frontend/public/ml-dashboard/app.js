const API_BASE = "http://127.0.0.1:8000";

const stockInput = document.getElementById("stockInput");
const predictBtn = document.getElementById("predictBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const signalIconEl = document.getElementById("signalIcon");
const stockNameEl = document.getElementById("stockName");
const signalTextEl = document.getElementById("signalText");
const confidenceTextEl = document.getElementById("confidenceText");
const priceInfoEl = document.getElementById("priceInfo");

const openVal = document.getElementById("openVal");
const highVal = document.getElementById("highVal");
const lowVal = document.getElementById("lowVal");
const closeVal = document.getElementById("closeVal");
const volumeVal = document.getElementById("volumeVal");

function formatNum(v) {
  return Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

async function predict() {
  const stockName = stockInput.value.trim();
  if (!stockName) {
    statusEl.textContent = "Enter a stock name.";
    return;
  }

  statusEl.textContent = "Predicting...";
  predictBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock_name: stockName }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Prediction failed");
    }

    statusEl.textContent = "Prediction ready.";

    const isBuy = data.prediction === "BUY";
    signalIconEl.textContent = isBuy ? "↑" : "↓";
    signalIconEl.style.color = isBuy ? "#22c55e" : "#ef4444";

    stockNameEl.textContent = data.stock_name;
    signalTextEl.textContent = `${data.prediction} signal`;
    signalTextEl.style.color = isBuy ? "#22c55e" : "#ef4444";
    confidenceTextEl.textContent = `Confidence: ${(data.confidence * 100).toFixed(2)}%`;

    openVal.textContent = formatNum(data.features.open);
    highVal.textContent = formatNum(data.features.high);
    lowVal.textContent = formatNum(data.features.low);
    closeVal.textContent = formatNum(data.features.close);
    volumeVal.textContent = formatNum(data.features.volume);

    resultEl.classList.remove("hidden");
    priceInfoEl.classList.remove("hidden");
  } catch (err) {
    statusEl.textContent = err.message;
    resultEl.classList.add("hidden");
    priceInfoEl.classList.add("hidden");
  } finally {
    predictBtn.disabled = false;
  }
}

predictBtn.addEventListener("click", predict);
stockInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    predict();
  }
});
