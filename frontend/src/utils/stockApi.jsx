import { getUpstoxQuote } from './upstoxApi.jsx';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const NEWS_TIMEOUT_MS = 12000;

async function fetchTextWithTimeout(url, timeoutMs = NEWS_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeSymbol(symbol) {
  const clean = String(symbol || '').trim().toUpperCase();
  if (!clean) return '';
  if (clean.includes('.')) return clean;
  return `${clean}.BSE`;
}

function toRawSymbol(symbol) {
  return normalizeSymbol(symbol).replace('.BSE', '').replace('.NSE', '');
}

function sentimentFromText(text) {
  const value = String(text || '').toLowerCase();
  const positive = [
    'surge',
    'rally',
    'beats',
    'growth',
    'record high',
    'upgrades',
    'buy',
    'profit rises',
    'strong',
    'gain',
    'bullish',
  ];
  const negative = [
    'falls',
    'drop',
    'misses',
    'weak',
    'downgrade',
    'sell',
    'loss',
    'bearish',
    'decline',
    'plunge',
    'slumps',
  ];

  let score = 0;
  positive.forEach((term) => {
    if (value.includes(term)) score += 1;
  });
  negative.forEach((term) => {
    if (value.includes(term)) score -= 1;
  });

  const normalized = Math.max(-1, Math.min(1, score / 4));

  if (normalized > 0.15) {
    return { sentiment_score: normalized, sentiment_label: 'Bullish' };
  }
  if (normalized < -0.15) {
    return { sentiment_score: normalized, sentiment_label: 'Bearish' };
  }

  return { sentiment_score: normalized, sentiment_label: 'Neutral' };
}

export async function getStockQuote(symbol) {
  const quote = await getUpstoxQuote(symbol);
  return {
    symbol: quote.symbol,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    high: quote.high,
    low: quote.low,
    open: quote.open,
    previousClose: quote.previousClose,
  };
}

export async function getStockNews(symbol) {
  const rawSymbol = toRawSymbol(symbol);
  if (!rawSymbol) return [];

  const proxyUrl = `${BACKEND_BASE_URL}/news/google-rss?symbol=${encodeURIComponent(rawSymbol)}`;

  try {
    const response = await fetchTextWithTimeout(proxyUrl);
    if (!response.ok) {
      return [];
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const items = Array.from(doc.querySelectorAll('item')).slice(0, 20);

    return items.map((item) => {
      const title = item.querySelector('title')?.textContent?.trim() || 'Untitled article';
      const url = item.querySelector('link')?.textContent?.trim() || '#';
      const published = item.querySelector('pubDate')?.textContent?.trim() || '';
      const source = item.querySelector('source')?.textContent?.trim() || 'Google News';
      const summaryText = item.querySelector('description')?.textContent?.replace(/<[^>]+>/g, ' ')?.trim() || title;
      const sentiment = sentimentFromText(`${title} ${summaryText}`);

      return {
        title,
        url,
        time_published: published ? new Date(published).toISOString() : '',
        authors: [],
        summary: summaryText,
        source,
        sentiment_score: sentiment.sentiment_score,
        sentiment_label: sentiment.sentiment_label,
      };
    });
  } catch (error) {
    return [];
  }
}
