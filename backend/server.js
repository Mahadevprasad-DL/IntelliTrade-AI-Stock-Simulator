const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const zlib = require("zlib");

const app = express();

const GROQ_API_KEY = (process.env.GROQ_API_KEY || "").trim(); // add groq api key here
const GROQ_CHAT_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];

const STOCK_RELATED_KEYWORDS = [
  "stock",
  "share",
  "market",
  "trading",
  "invest",
  "portfolio",
  "nifty",
  "sensex",
  "nasdaq",
  "dow",
  "s&p",
  "etf",
  "dividend",
  "broker",
  "ipo",
  "candlestick",
  "support",
  "resistance",
  "rsi",
  "macd",
  "pe ratio",
  "earnings",
  "valuation",
  "aapl",
  "tsla",
  "msft",
];

function isStockRelatedQuestion(text) {
  const msg = String(text || "").toLowerCase().trim();
  if (!msg) {
    return false;
  }

  const keywordMatch = STOCK_RELATED_KEYWORDS.some((k) => msg.includes(k));
  const tickerLikeMatch = /\b[A-Z]{2,5}\b/.test(String(text || ""));
  return keywordMatch || tickerLikeMatch;
}

/* ===============================
   Middleware
================================= */
app.use(cors());
app.use(express.json());

/* ===============================
   Upstox Instrument Resolver Cache
================================= */
const INSTRUMENT_MASTER_URLS = {
  NSE: "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz",
  BSE: "https://assets.upstox.com/market-quote/instruments/exchange/BSE.json.gz",
};

const instrumentCache = {
  NSE: { loadedAt: 0, byTradingSymbol: new Map() },
  BSE: { loadedAt: 0, byTradingSymbol: new Map() },
};

const INSTRUMENT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function parseClientSymbol(raw) {
  const normalized = String(raw || "").trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  if (normalized.includes("|")) {
    const [segment, token] = normalized.split("|");
    const exchange = String(segment || "").startsWith("NSE") ? "NSE" : "BSE";
    const displaySymbol = String(token || "").toUpperCase();

    return {
      exchange,
      displaySymbol,
      apiSymbol: `${displaySymbol}.${exchange}`,
      instrumentKey: normalized,
    };
  }

  const exchange = normalized.endsWith(".NSE") ? "NSE" : "BSE";
  const displaySymbol = normalized.replace(".NSE", "").replace(".BSE", "");

  return {
    exchange,
    displaySymbol,
    apiSymbol: `${displaySymbol}.${exchange}`,
    instrumentKey: "",
  };
}

function sanitizeDisplaySymbol(raw) {
  return String(raw || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

async function loadInstrumentMaster(exchange) {
  const cache = instrumentCache[exchange];
  const now = Date.now();

  if (cache.byTradingSymbol.size > 0 && (now - cache.loadedAt) < INSTRUMENT_CACHE_TTL_MS) {
    return cache.byTradingSymbol;
  }

  const response = await fetch(INSTRUMENT_MASTER_URLS[exchange]);
  if (!response.ok) {
    throw new Error(`Unable to load Upstox ${exchange} instrument list`);
  }

  const compressed = Buffer.from(await response.arrayBuffer());
  const inflated = zlib.gunzipSync(compressed).toString("utf8");
  const parsed = JSON.parse(inflated);

  const map = new Map();
  const expectedSegment = `${exchange}_EQ`;

  parsed.forEach((item) => {
    const segment = String(item?.segment || "").toUpperCase();
    const tradingSymbol = String(item?.trading_symbol || "").toUpperCase();
    const instrumentKey = String(item?.instrument_key || "");

    if (segment === expectedSegment && tradingSymbol && instrumentKey) {
      map.set(tradingSymbol, instrumentKey);
    }
  });

  cache.byTradingSymbol = map;
  cache.loadedAt = now;

  return map;
}

/* ===============================
   MongoDB Connection
================================= */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

/* ===============================
   User Schema & Model
================================= */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

/* ===============================
   REGISTER API
================================= */
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      country: req.body.country || "",
      phone: req.body.phone || ""
    });

    await newUser.save();

    res.status(201).json({
      message: "Account created successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});

/* ===============================
   LOGIN API
================================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }
    
    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }
    
    // Login successful
    res.status(200).json({
      message: "Login successful",
      username: user.username
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});

/* ===============================
   Test Route
================================= */
app.get("/", (req, res) => {
  res.send("API Running...");
});

/* ===============================
   Google News RSS Proxy API
================================= */
app.get("/news/google-rss", async (req, res) => {
  try {
    const symbol = String(req.query?.symbol || "").trim().toUpperCase();

    if (!symbol) {
      return res.status(400).json({ message: "symbol query parameter is required" });
    }

    const query = encodeURIComponent(`${symbol} stock`);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;
    const response = await fetch(rssUrl);

    if (!response.ok) {
      return res.status(response.status).json({
        message: `Google News RSS request failed (${response.status})`,
      });
    }

    const xmlText = await response.text();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    return res.status(200).send(xmlText);
  } catch (error) {
    console.error("Google News RSS proxy error:", error.message);
    return res.status(500).json({ message: "Failed to fetch Google News feed" });
  }
});

/* ===============================
  AI Stock Chat API
================================= */
async function handleStockChat(req, res) {
  try {
    const question = String(req.body?.message || "").trim();

    if (!question) {
      return res.status(400).json({ message: "message is required" });
    }

    if (!isStockRelatedQuestion(question)) {
      return res.status(200).json({
        reply: "Sorry, I am available only for stock-related questions.",
      });
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ message: "Groq API key is missing" });
    }

    let lastStatus = 500;
    let lastMessage = "Failed to get response from AI service";

    for (const model of GROQ_MODELS) {
      const payload = {
        model,
        temperature: 0.5,
        max_tokens: 350,
        top_p: 0.9,
        messages: [
          {
            role: "system",
            content:
              "You are a stock-market-only assistant. Answer only stock, trading, portfolio, market and investment questions. If the query is unrelated, respond exactly with: \"Sorry, I am available only for stock-related questions.\"",
          },
          {
            role: "user",
            content: question,
          },
        ],
      };

      const response = await fetch(GROQ_CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        lastStatus = response.status;
        lastMessage = `AI service error (${response.status})`;
        continue;
      }

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content;

      if (reply) {
        return res.status(200).json({ reply });
      }
    }

    return res.status(502).json({
      message: lastMessage,
      status: lastStatus,
    });
  } catch (error) {
    console.error("AI stock chat error:", error.message);
    return res.status(500).json({ message: "Failed to process stock chat request" });
  }
}

app.post("/ai/stock-chat", handleStockChat);
app.post("/api/ai/stock-chat", handleStockChat);

/* ===============================
   Upstox Instrument Resolve API
================================= */
app.get("/upstox/resolve-instrument", async (req, res) => {
  try {
    const { symbol } = req.query;
    const parsed = parseClientSymbol(symbol);

    if (!parsed) {
      return res.status(400).json({ message: "symbol query parameter is required" });
    }

    if (parsed.instrumentKey) {
      return res.status(200).json(parsed);
    }

    const preferredExchange = parsed.exchange;
    const alternateExchange = preferredExchange === "BSE" ? "NSE" : "BSE";
    const candidates = [
      parsed.displaySymbol,
      sanitizeDisplaySymbol(parsed.displaySymbol),
    ].filter(Boolean);

    let instrumentKey = "";
    let resolvedExchange = preferredExchange;
    let resolvedSymbol = parsed.displaySymbol;

    const preferredLookup = await loadInstrumentMaster(preferredExchange);
    for (const candidate of candidates) {
      const found = preferredLookup.get(candidate);
      if (found) {
        instrumentKey = found;
        resolvedSymbol = candidate;
        break;
      }
    }

    if (!instrumentKey) {
      const fallbackLookup = await loadInstrumentMaster(alternateExchange);
      for (const candidate of candidates) {
        const found = fallbackLookup.get(candidate);
        if (found) {
          instrumentKey = found;
          resolvedExchange = alternateExchange;
          resolvedSymbol = candidate;
          break;
        }
      }
    }

    if (!instrumentKey) {
      return res.status(404).json({
        message: `Symbol ${parsed.displaySymbol} was not found on Upstox ${preferredExchange} or ${alternateExchange}`,
      });
    }

    return res.status(200).json({
      ...parsed,
      exchange: resolvedExchange,
      displaySymbol: resolvedSymbol,
      apiSymbol: `${resolvedSymbol}.${resolvedExchange}`,
      instrumentKey,
    });
  } catch (error) {
    console.error("Upstox resolve error:", error.message);
    return res.status(500).json({ message: "Failed to resolve Upstox instrument key" });
  }
});

/* ===============================
   Upstox Quote Proxy API
================================= */
app.get("/upstox/quotes", async (req, res) => {
  try {
    const instrumentKey = String(req.query?.instrument_key || "").trim();
    const accessToken = String(req.headers["x-upstox-token"] || process.env.UPSTOX_ACCESS_TOKEN || "").trim();

    if (!instrumentKey) {
      return res.status(400).json({ message: "instrument_key query parameter is required" });
    }

    if (!accessToken) {
      return res.status(400).json({ message: "Upstox access token is missing" });
    }

    const url = `https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(instrumentKey)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.errors?.[0]?.message || data?.message || `Upstox quote API error (${response.status})`;
      return res.status(response.status).json({ message, errors: data?.errors || [] });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Upstox quote proxy error:", error.message);
    return res.status(500).json({ message: "Failed to fetch Upstox quote" });
  }
});

/* ===============================
   Upstox Historical Candle Proxy API
================================= */
app.get("/upstox/historical-candle", async (req, res) => {
  try {
    const instrumentKey = String(req.query?.instrument_key || "").trim();
    const toDate = String(req.query?.to_date || "").trim();
    const fromDate = String(req.query?.from_date || "").trim();
    const accessToken = String(req.headers["x-upstox-token"] || process.env.UPSTOX_ACCESS_TOKEN || "").trim();

    if (!instrumentKey || !toDate || !fromDate) {
      return res.status(400).json({ message: "instrument_key, to_date, and from_date are required" });
    }

    if (!accessToken) {
      return res.status(400).json({ message: "Upstox access token is missing" });
    }

    const url = `https://api.upstox.com/v2/historical-candle/${encodeURIComponent(instrumentKey)}/day/${toDate}/${fromDate}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.errors?.[0]?.message || data?.message || `Upstox historical API error (${response.status})`;
      return res.status(response.status).json({ message, errors: data?.errors || [] });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Upstox historical proxy error:", error.message);
    return res.status(500).json({ message: "Failed to fetch Upstox historical candles" });
  }
});

/* ===============================
   Serve Data Files (Videos, etc)
================================= */
app.use('/data', express.static(path.join(__dirname, '../data')));

/* ===============================
   Server Start
================================= */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});