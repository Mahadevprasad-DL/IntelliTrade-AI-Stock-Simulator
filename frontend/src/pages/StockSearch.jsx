import { Search } from 'lucide-react';
import { useState } from 'react';

export default function StockSearch({ onSearch, loading }) {
  const [symbol, setSymbol] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (symbol.trim()) {
      onSearch(symbol.trim().toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={titleRowStyle}>
        <p style={titleStyle}>Search A Stock</p>
        <span style={badgeStyle}>Live Quote + Sentiment</span>
      </div>

      <div style={searchRowStyle}>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Enter symbol (e.g., TCS, INFY, RELIANCE)"
          disabled={loading}
          style={inputStyle}
        />
        <button
          type="submit"
          disabled={loading || !symbol.trim()}
          style={buttonStyle}
        >
          <Search size={20} />
        </button>
      </div>

      <p style={helperStyle}>Tip: If exchange is not added, .BSE is used automatically.</p>
    </form>
  );
}

const formStyle = {
  width: '100%',
  maxWidth: 880,
  borderRadius: 18,
  padding: '16px 16px 14px',
  background: 'linear-gradient(145deg, rgba(18,40,52,0.92), rgba(21,51,70,0.86))',
  border: '1px solid rgba(98, 176, 220, 0.32)',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
};

const titleRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
};

const titleStyle = {
  margin: 0,
  fontSize: 15,
  fontWeight: 700,
  color: '#d9f6ff',
  letterSpacing: 0.3,
};

const badgeStyle = {
  fontSize: 11,
  color: '#8ce7ff',
  background: 'rgba(6, 196, 255, 0.14)',
  border: '1px solid rgba(0, 217, 255, 0.35)',
  borderRadius: 999,
  padding: '5px 10px',
  fontWeight: 600,
};

const searchRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 12,
};

const inputStyle = {
  width: '100%',
  minHeight: 52,
  borderRadius: 12,
  border: '1px solid rgba(126, 207, 255, 0.35)',
  background: 'rgba(5, 25, 35, 0.72)',
  color: '#ecfbff',
  fontSize: 16,
  padding: '0 16px',
  outline: 'none',
};

const buttonStyle = {
  minWidth: 56,
  minHeight: 52,
  borderRadius: 12,
  border: '1px solid rgba(0, 214, 255, 0.5)',
  background: 'linear-gradient(135deg, #08c8f0, #0e8cf3)',
  color: '#fff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 8px 18px rgba(14, 140, 243, 0.32)',
};

const helperStyle = {
  margin: '10px 2px 0',
  fontSize: 12,
  color: '#9cc6d9',
};
