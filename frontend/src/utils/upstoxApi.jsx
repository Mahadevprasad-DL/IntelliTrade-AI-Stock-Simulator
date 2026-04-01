const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const REQUEST_TIMEOUT_MS = 15000;

const STORAGE_KEYS = {
  apiKey: 'UPSTOX_API_KEY',
  apiSecret: 'UPSTOX_API_SECRET',
  accessToken: 'UPSTOX_ACCESS_TOKEN',
};

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeExchangeSymbol(rawSymbol) {
  const input = String(rawSymbol || '').trim().toUpperCase();
  if (!input) return '';
  if (input.includes('|')) return input;
  if (input.includes('.')) return input;
  return `${input}.BSE`;
}

function parseSymbol(rawSymbol) {
  const normalized = normalizeExchangeSymbol(rawSymbol);

  if (normalized.includes('|')) {
    const [segment, symbolPart] = normalized.split('|');
    const exchange = String(segment || '').startsWith('NSE') ? 'NSE' : 'BSE';
    return {
      exchange,
      exchangeSymbol: normalized,
      displaySymbol: String(symbolPart || '').toUpperCase(),
      instrumentKey: normalized,
    };
  }

  const exchange = normalized.endsWith('.NSE') ? 'NSE' : 'BSE';
  const displaySymbol = normalized.replace('.NSE', '').replace('.BSE', '');

  return {
    exchange,
    exchangeSymbol: normalized,
    displaySymbol,
    instrumentKey: '',
  };
}

async function resolveInstrument(rawSymbol) {
  const parsed = parseSymbol(rawSymbol);

  if (parsed.instrumentKey) {
    return parsed;
  }

  const response = await fetchWithTimeout(
    `${BACKEND_BASE_URL}/upstox/resolve-instrument?symbol=${encodeURIComponent(parsed.exchangeSymbol)}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || `Stock symbol ${parsed.displaySymbol} was not found on Upstox ${parsed.exchange}.`);
  }

  return {
    ...parsed,
    instrumentKey: String(data?.instrumentKey || ''),
    displaySymbol: String(data?.displaySymbol || parsed.displaySymbol),
    exchange: String(data?.exchange || parsed.exchange),
  };
}

function getAccessToken() {
  if (typeof window !== 'undefined') {
    const savedToken = localStorage.getItem(STORAGE_KEYS.accessToken);
    if (savedToken) return savedToken;
  }

  return String(import.meta.env.VITE_UPSTOX_ACCESS_TOKEN || '').trim();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchUpstoxJson(path, params, accessToken) {
  const query = new URLSearchParams(params).toString();
  const response = await fetchWithTimeout(`${BACKEND_BASE_URL}${path}?${query}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-upstox-token': accessToken,
    },
  });

  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { message: rawText || 'Unexpected non-JSON response from backend.' };
  }

  if (!response.ok) {
    const fallback = data?.errors?.[0]?.message || data?.message || `Upstox API request failed (${response.status}).`;
    throw new Error(fallback);
  }

  return data;
}

export async function getUpstoxQuote(rawSymbol) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('Upstox access token is missing. Open Settings and save your token.');
  }

  const instrument = await resolveInstrument(rawSymbol);
  const payload = await fetchUpstoxJson('/upstox/quotes', {
    instrument_key: instrument.instrumentKey,
  }, accessToken);
  const quote = Object.values(payload?.data || {})[0];

  if (!quote) {
    throw new Error(`No quote was returned for ${instrument.displaySymbol}.`);
  }

  const lastPrice = Number(quote.last_price || quote.ohlc?.close || 0);
  const netChange = Number(quote.net_change || 0);
  const previousClose = Number.isFinite(lastPrice - netChange) ? (lastPrice - netChange) : Number(quote.ohlc?.close || 0);
  const changePercent = previousClose ? (netChange / previousClose) * 100 : 0;

  return {
    instrumentKey: instrument.instrumentKey,
    apiSymbol: `${instrument.displaySymbol}.${instrument.exchange}`,
    symbol: instrument.displaySymbol,
    exchange: instrument.exchange,
    price: lastPrice,
    open: Number(quote.ohlc?.open || 0),
    high: Number(quote.ohlc?.high || 0),
    low: Number(quote.ohlc?.low || 0),
    previousClose: Number(previousClose || 0),
    change: Number(netChange || 0),
    changePercent: Number(changePercent || 0),
    volume: Number(quote.volume || 0),
    latestTradingDay: String(quote.timestamp || ''),
  };
}

export async function getUpstoxDailyCandles(rawSymbol, days = 45) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('Upstox access token is missing. Open Settings and save your token.');
  }

  const instrument = await resolveInstrument(rawSymbol);
  const toDate = toDateString(new Date());
  const fromDate = toDateString(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

  const payload = await fetchUpstoxJson('/upstox/historical-candle', {
    instrument_key: instrument.instrumentKey,
    to_date: toDate,
    from_date: fromDate,
  }, accessToken);
  const candlesRaw = Array.isArray(payload?.data?.candles) ? payload.data.candles : [];

  if (!candlesRaw.length) {
    throw new Error(`No historical candle data was returned for ${instrument.displaySymbol}.`);
  }

  const candles = candlesRaw
    .map((row) => ({
      timestamp: String(row[0] || ''),
      open: Number(row[1] || 0),
      high: Number(row[2] || 0),
      low: Number(row[3] || 0),
      close: Number(row[4] || 0),
      volume: Number(row[5] || 0),
    }))
    .reverse();

  return {
    instrumentKey: instrument.instrumentKey,
    apiSymbol: `${instrument.displaySymbol}.${instrument.exchange}`,
    symbol: instrument.displaySymbol,
    exchange: instrument.exchange,
    candles,
  };
}

export function getUpstoxSettings() {
  const apiKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.apiKey) || '' : '';
  const apiSecret = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.apiSecret) || '' : '';
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.accessToken) || '' : '';

  return {
    apiKey,
    apiSecret,
    accessToken,
  };
}

export function saveUpstoxSettings({ apiKey, apiSecret, accessToken }) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEYS.apiKey, String(apiKey || '').trim());
  localStorage.setItem(STORAGE_KEYS.apiSecret, String(apiSecret || '').trim());
  localStorage.setItem(STORAGE_KEYS.accessToken, String(accessToken || '').trim());
}

export function clearUpstoxSettings() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.apiKey);
  localStorage.removeItem(STORAGE_KEYS.apiSecret);
  localStorage.removeItem(STORAGE_KEYS.accessToken);
}

export function normalizeUpstoxSymbol(rawSymbol) {
  return normalizeExchangeSymbol(rawSymbol);
}
