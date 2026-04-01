import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://127.0.0.1:8000';

const REC_CONFIG = {
  BUY: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', icon: '↑', label: 'Buy Signal' },
  SELL: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', icon: '↓', label: 'Sell Signal' },
};

const INFO_CARDS = [
  {
    icon: '📡',
    title: 'Live Upstox Feed',
    desc: 'Classification now fetches live OHLCV values from Upstox using your API token and selected symbol.',
  },
  {
    icon: '🌲',
    title: 'RandomForestClassifier',
    desc: 'RandomForest predicts BUY/SELL using live open, high, low, close, and volume inputs.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Prediction API',
    desc: 'Classification page calls FastAPI /predict-live and instantly renders signal, confidence, and live feature values.',
  },
];

function formatCurrency(value) {
  const numeric = Number(value || 0);
  return `₹${numeric.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function Classification() {
  const [symbolInput, setSymbolInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!symbolInput.trim()) {
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const accessToken = localStorage.getItem('UPSTOX_ACCESS_TOKEN') || '';
      const response = await fetch(`${API_BASE_URL}/predict-live`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: symbolInput.trim().toUpperCase(),
          access_token: accessToken,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Prediction failed.');
      }
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const rec = result ? REC_CONFIG[result.prediction] : null;
  const confidencePct = result ? Number(result.confidence || 0) * 100 : 0;

  return (
    <div style={pageWrap}>
      <div style={headerWrap}>
        <div>
          <h2 style={pageTitle}>Stock Classification &amp; Prediction</h2>
          <p style={pageSubtitle}>Enter a stock symbol and get live BUY/SELL prediction using Upstox data + RandomForest model</p>
        </div>
        <span style={mlBadge}>FastAPI · RandomForest</span>
      </div>

      <form onSubmit={handlePredict} style={formCard}>
        <div style={formTopRow}>
          <div>
            <p style={formLabel}>Enter Stock Symbol</p>
            <p style={formHint}>Example: ITC, TCS, INFY, RELIANCE, JSWSTEEL, HDFCBANK</p>
          </div>
          <span style={apiBadge}>POST /predict-live</span>
        </div>

        <div style={inputRow}>
          <input
            type='text'
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            placeholder='Type symbol (e.g., ITC or ITC.BSE)...'
            disabled={loading}
            style={inputStyle}
          />
          <button
            type='submit'
            disabled={loading || !symbolInput.trim()}
            style={{
              ...submitBtn,
              opacity: loading || !symbolInput.trim() ? 0.6 : 1,
              cursor: loading || !symbolInput.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Predicting...' : 'Run Prediction'}
          </button>
        </div>
      </form>

      {error && <div style={errorBox}>⚠ {error}</div>}

      {result && rec && (
        <div style={resultWrap}>
          <div style={{ ...mainCard, borderColor: rec.border }}>
            <div style={mainCardTop}>
              <div>
                <p style={symbolLabel}>{result.stock_name}</p>
                <p style={{ ...recLabel, color: rec.color }}>{rec.label}</p>
                <p style={dataPointsLabel}>Confidence: {confidencePct.toFixed(2)}%</p>
              </div>
              <div style={{ ...recBadge, background: rec.bg, border: `1.5px solid ${rec.border}`, color: rec.color }}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>{rec.icon}</span>
                <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>{result.prediction}</span>
              </div>
            </div>

            <div style={priceRow}>
              <div style={priceBox}>
                <p style={priceMeta}>Open</p>
                <p style={priceVal}>{formatCurrency(result.features.open)}</p>
              </div>
              <div style={priceBox}>
                <p style={priceMeta}>High</p>
                <p style={priceVal}>{formatCurrency(result.features.high)}</p>
              </div>
              <div style={priceBox}>
                <p style={priceMeta}>Low</p>
                <p style={priceVal}>{formatCurrency(result.features.low)}</p>
              </div>
            </div>
          </div>

          <div style={statsGrid}>
            {[
              { label: 'Close', value: formatCurrency(result.features.close) },
              { label: 'Volume', value: Number(result.features.volume || 0).toLocaleString('en-IN') },
              { label: 'Signal', value: result.prediction, color: rec.color },
              { label: 'Confidence', value: `${confidencePct.toFixed(2)}%` },
            ].map((stat) => (
              <div key={stat.label} style={statCard}>
                <p style={statLabel}>{stat.label}</p>
                <p style={{ ...statValue, color: stat.color || '#d9f0ff' }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div style={infoGrid}>
          {INFO_CARDS.map((card) => (
            <div key={card.title} style={infoCard}>
              <div style={infoIcon}>{card.icon}</div>
              <p style={infoTitle}>{card.title}</p>
              <p style={infoDesc}>{card.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pageWrap = {
  width: '100%',
  maxWidth: 900,
  margin: '0 auto',
  minHeight: '100%',
  padding: '36px 32px 56px',
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
  color: 'white',
};

const headerWrap = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 12,
};

const pageTitle = {
  margin: 0,
  fontSize: 30,
  fontWeight: 800,
  color: '#d9f6ff',
  letterSpacing: 0.3,
};

const pageSubtitle = {
  margin: '6px 0 0',
  fontSize: 14,
  color: '#7ab8d4',
};

const mlBadge = {
  fontSize: 12,
  fontWeight: 700,
  color: '#00e0ff',
  background: 'rgba(0,224,255,0.1)',
  border: '1px solid rgba(0,224,255,0.35)',
  borderRadius: 999,
  padding: '6px 14px',
  whiteSpace: 'nowrap',
};

const formCard = {
  background: 'linear-gradient(145deg, rgba(15,38,52,0.92), rgba(18,48,66,0.88))',
  border: '1px solid rgba(98,176,220,0.28)',
  borderRadius: 18,
  padding: '22px 24px 20px',
  boxShadow: '0 10px 32px rgba(0,0,0,0.28)',
};

const formTopRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 14,
  flexWrap: 'wrap',
  gap: 8,
};

const formLabel = { margin: 0, fontSize: 15, fontWeight: 700, color: '#d9f6ff' };
const formHint = { margin: '3px 0 0', fontSize: 12, color: '#6b9cb5' };

const apiBadge = {
  fontSize: 11,
  fontWeight: 600,
  color: '#62b4dc',
  background: 'rgba(98,180,220,0.1)',
  border: '1px solid rgba(98,180,220,0.3)',
  borderRadius: 999,
  padding: '5px 11px',
};

const inputRow = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 12,
};

const inputStyle = {
  width: '100%',
  minHeight: 52,
  borderRadius: 12,
  border: '1px solid rgba(98,176,220,0.35)',
  background: 'rgba(5,22,32,0.75)',
  color: '#ecfbff',
  fontSize: 16,
  padding: '0 18px',
  outline: 'none',
  letterSpacing: 0.3,
};

const submitBtn = {
  minWidth: 150,
  minHeight: 52,
  borderRadius: 12,
  border: '1px solid rgba(0,214,255,0.45)',
  background: 'linear-gradient(135deg, #08c8f0, #0e7cf3)',
  color: '#fff',
  fontSize: 15,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 8px 20px rgba(14,124,243,0.3)',
  letterSpacing: 0.3,
};

const errorBox = {
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(239,68,68,0.4)',
  borderRadius: 12,
  padding: '14px 18px',
  color: '#fca5a5',
  fontSize: 14,
};

const resultWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const mainCard = {
  background: 'linear-gradient(145deg, rgba(12,32,44,0.96), rgba(16,40,56,0.92))',
  borderStyle: 'solid',
  borderWidth: '1.5px',
  borderColor: 'rgba(98,176,220,0.3)',
  borderRadius: 20,
  padding: '28px 30px',
  boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
};

const mainCardTop = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 28,
  flexWrap: 'wrap',
  gap: 16,
};

const symbolLabel = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  color: '#00e0ff',
  letterSpacing: 1,
};

const recLabel = {
  margin: '5px 0 0',
  fontSize: 15,
  fontWeight: 600,
};

const dataPointsLabel = {
  margin: '4px 0 0',
  fontSize: 12,
  color: '#5e8fa8',
};

const recBadge = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  borderRadius: 14,
  padding: '14px 22px',
};

const priceRow = {
  display: 'flex',
  alignItems: 'center',
  gap: 24,
  flexWrap: 'wrap',
};

const priceBox = { flex: 1, minWidth: 120 };

const priceMeta = {
  margin: 0,
  fontSize: 12,
  color: '#6b9cb5',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
};

const priceVal = {
  margin: '6px 0 0',
  fontSize: 24,
  fontWeight: 800,
  color: '#e8f6ff',
};

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: 14,
};

const statCard = {
  background: 'rgba(10,28,40,0.85)',
  border: '1px solid rgba(98,176,220,0.2)',
  borderRadius: 14,
  padding: '16px 18px',
};

const statLabel = {
  margin: 0,
  fontSize: 11,
  color: '#5e8fa8',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
};

const statValue = {
  margin: '6px 0 0',
  fontSize: 18,
  fontWeight: 700,
};

const infoGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: 18,
};

const infoCard = {
  background: 'rgba(10,28,40,0.8)',
  border: '1px solid rgba(98,176,220,0.2)',
  borderRadius: 16,
  padding: '24px 22px',
};

const infoIcon = {
  fontSize: 34,
  marginBottom: 12,
};

const infoTitle = {
  margin: 0,
  fontSize: 15,
  fontWeight: 700,
  color: '#d9f0ff',
  marginBottom: 8,
};

const infoDesc = {
  margin: 0,
  fontSize: 13,
  color: '#6b9cb5',
  lineHeight: 1.6,
};

