import { useState } from 'react';
import StockSearch from './StockSearch.jsx';
import StockResults from './StockResults.jsx';
import { getStockNews, getStockQuote } from '../utils/stockApi.jsx';
import { analyzeSentiment } from '../utils/sentimentAnalysis.jsx';
import { getUpstoxDailyCandles } from '../utils/upstoxApi.jsx';

const INDICATOR_USAGE = {
  RSI: {
    label: 'Relative Strength Index (RSI 14)',
    usage: 'RSI helps detect overbought and oversold zones. Many traders consider RSI above 70 as overbought and below 30 as oversold.',
  },
  MACD: {
    label: 'MACD (12,26,9)',
    usage: 'MACD compares short and long momentum. A bullish sign appears when MACD crosses above the signal line; bearish when it crosses below.',
  },
  SMA: {
    label: 'Simple Moving Average (20/50)',
    usage: 'SMA smooths price direction. When SMA 20 is above SMA 50, trend is often considered bullish; when below, bearish.',
  },
  EMA: {
    label: 'Exponential Moving Average (20)',
    usage: 'EMA reacts faster than SMA to recent prices and is useful for quick trend confirmation and pullback entries.',
  },
  BOLLINGER: {
    label: 'Bollinger Bands (20,2)',
    usage: 'Bollinger Bands show volatility range. Price near upper band can indicate strength/overextension; near lower band can indicate weakness/possible rebound zone.',
  },
};

const LEARN_ITEMS = [
  {
    key: 'RSI',
    short: 'RSI (14)',
    fullForm: 'Relative Strength Index',
    definition:
      'RSI is a momentum oscillator that measures speed and strength of price moves on a 0 to 100 scale.',
    example:
      'Example: If RSI is 78, the stock may be overbought. If RSI is 24, it may be oversold.',
    resultGuide: 'Result reading: Above 70 can be caution zone, below 30 can be opportunity zone after confirmation.',
  },
  {
    key: 'MACD',
    short: 'MACD (12,26,9)',
    fullForm: 'Moving Average Convergence Divergence',
    definition:
      'MACD compares short-term and long-term exponential moving averages to identify momentum shifts.',
    example:
      'Example: MACD line crossing above Signal line can indicate bullish momentum (possible BUY setup).',
    resultGuide: 'Result reading: MACD above Signal is usually bullish bias, below Signal is bearish bias.',
  },
  {
    key: 'SMA',
    short: 'SMA (20/50)',
    fullForm: 'Simple Moving Average',
    definition:
      'SMA is the average closing price over a fixed period. It smooths price noise and shows trend direction.',
    example:
      'Example: SMA20 above SMA50 often means short-term trend is stronger than long-term trend.',
    resultGuide: 'Result reading: SMA20 > SMA50 supports bullish trend context; SMA20 < SMA50 supports bearish context.',
  },
  {
    key: 'EMA',
    short: 'EMA (20)',
    fullForm: 'Exponential Moving Average',
    definition:
      'EMA is a weighted moving average that gives more importance to recent prices than older prices.',
    example:
      'Example: Price holding above EMA20 can indicate trend support during pullbacks.',
    resultGuide: 'Result reading: Price above EMA20 is often stronger trend behavior than price below EMA20.',
  },
  {
    key: 'BOLLINGER',
    short: 'Bollinger Bands (20,2)',
    fullForm: 'Bollinger Bands',
    definition:
      'Bollinger Bands plot upper and lower volatility bands around a moving average.',
    example:
      'Example: Price touching upper band may indicate overextension; near lower band may indicate potential rebound area.',
    resultGuide: 'Result reading: Use with trend and volume; do not trade band-touch signals alone.',
  },
];

function calculateSMA(values, period) {
  if (!Array.isArray(values) || values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
}

function calculateEMA(values, period) {
  if (!Array.isArray(values) || values.length < period) return null;
  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;

  for (let i = period; i < values.length; i += 1) {
    ema = values[i] * k + ema * (1 - k);
  }

  return ema;
}

function calculateRSI(values, period = 14) {
  if (!Array.isArray(values) || values.length < period + 1) return null;

  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateMACD(values) {
  if (!Array.isArray(values) || values.length < 35) {
    return { macd: null, signal: null, histogram: null };
  }

  const ema12 = calculateEMA(values, 12);
  const ema26 = calculateEMA(values, 26);
  if (ema12 == null || ema26 == null) {
    return { macd: null, signal: null, histogram: null };
  }

  const macd = ema12 - ema26;

  const macdSeries = [];
  for (let i = 0; i < values.length; i += 1) {
    const shortWindow = values.slice(0, i + 1);
    const e12 = calculateEMA(shortWindow, 12);
    const e26 = calculateEMA(shortWindow, 26);
    if (e12 != null && e26 != null) {
      macdSeries.push(e12 - e26);
    }
  }

  const signal = calculateEMA(macdSeries, 9);
  if (signal == null) {
    return { macd, signal: null, histogram: null };
  }

  return {
    macd,
    signal,
    histogram: macd - signal,
  };
}

function buildTechnicalIndicators(candles, currentPrice) {
  const closes = (candles || []).map((item) => Number(item.close || 0)).filter((value) => Number.isFinite(value) && value > 0);
  if (closes.length < 30) {
    return null;
  }

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const ema20 = calculateEMA(closes, 20);
  const rsi14 = calculateRSI(closes, 14);
  const macdData = calculateMACD(closes);
  const stdWindow = closes.slice(-20);
  const mean = sma20;
  const variance = mean == null
    ? null
    : stdWindow.reduce((acc, value) => acc + (value - mean) ** 2, 0) / stdWindow.length;
  const stdDev = variance == null ? null : Math.sqrt(variance);
  const upperBand = mean == null || stdDev == null ? null : mean + 2 * stdDev;
  const lowerBand = mean == null || stdDev == null ? null : mean - 2 * stdDev;

  const trend = sma20 != null && sma50 != null
    ? sma20 >= sma50
      ? 'Bullish trend bias (SMA20 above SMA50)'
      : 'Bearish trend bias (SMA20 below SMA50)'
    : 'Not enough data for SMA trend bias';

  return {
    currentPrice,
    rsi14,
    sma20,
    sma50,
    ema20,
    macd: macdData.macd,
    macdSignal: macdData.signal,
    macdHistogram: macdData.histogram,
    bollingerUpper: upperBand,
    bollingerLower: lowerBand,
    trend,
  };
}

function formatIndicatorValue(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return 'N/A';
  return Number(value).toFixed(digits);
}

function getIndicatorSummary(key, data) {
  if (!data) {
    return {
      title: 'Indicator Result',
      lines: ['Run a search to load technical indicator results.'],
    };
  }

  if (key === 'MACD') {
    if (data.macd == null || data.macdSignal == null) {
      return {
        title: 'MACD Result',
        lines: ['MACD Signal: N/A', 'Reason: MACD data is unavailable.'],
      };
    }

    const bullish = data.macd >= data.macdSignal;
    return {
      title: 'MACD Result',
      lines: [
        `MACD: ${formatIndicatorValue(data.macd, 3)}`,
        `Signal Line: ${formatIndicatorValue(data.macdSignal, 3)}`,
        `Histogram: ${formatIndicatorValue(data.macdHistogram, 3)}`,
        `Signal: ${bullish ? 'BUY' : 'SELL'} ${bullish ? '✅' : '⚠️'}`,
        `Reason: ${bullish ? 'MACD crossed above signal line' : 'MACD moved below signal line'}`,
        `Trend: ${data.trend}`,
        `Suggestion: ${bullish ? 'Wait for one more candle confirmation before entry' : 'Avoid fresh long positions until momentum improves'}`,
      ],
    };
  }

  if (key === 'RSI') {
    const rsi = data.rsi14;
    let signal = 'HOLD';
    let reason = 'RSI is in neutral zone';
    let suggestion = 'Wait for breakout or reversal confirmation';

    if (rsi != null && rsi >= 70) {
      signal = 'SELL';
      reason = 'RSI is above 70 (overbought)';
      suggestion = 'Book partial profit or wait for pullback';
    } else if (rsi != null && rsi <= 30) {
      signal = 'BUY';
      reason = 'RSI is below 30 (oversold)';
      suggestion = 'Look for reversal candle before entry';
    }

    return {
      title: 'RSI Result',
      lines: [
        `RSI (14): ${formatIndicatorValue(rsi, 2)}`,
        `Signal: ${signal} ${signal === 'BUY' ? '✅' : signal === 'SELL' ? '⚠️' : '⏳'}`,
        `Reason: ${reason}`,
        `Trend: ${data.trend}`,
        `Suggestion: ${suggestion}`,
      ],
    };
  }

  if (key === 'SMA') {
    const bullish = data.sma20 != null && data.sma50 != null && data.sma20 >= data.sma50;
    return {
      title: 'SMA Result',
      lines: [
        `SMA20: ${formatIndicatorValue(data.sma20, 2)}`,
        `SMA50: ${formatIndicatorValue(data.sma50, 2)}`,
        `Signal: ${bullish ? 'BUY ✅' : 'SELL ⚠️'}`,
        `Reason: ${bullish ? 'SMA20 is above SMA50' : 'SMA20 is below SMA50'}`,
        `Trend: ${data.trend}`,
        `Suggestion: ${bullish ? 'Prefer buy on dips near SMA20' : 'Avoid aggressive buying until crossover'}`,
      ],
    };
  }

  if (key === 'EMA') {
    const bullish = data.currentPrice != null && data.ema20 != null && data.currentPrice >= data.ema20;
    return {
      title: 'EMA Result',
      lines: [
        `Current Price: ${formatIndicatorValue(data.currentPrice, 2)}`,
        `EMA20: ${formatIndicatorValue(data.ema20, 2)}`,
        `Signal: ${bullish ? 'BUY ✅' : 'SELL ⚠️'}`,
        `Reason: ${bullish ? 'Price is trading above EMA20' : 'Price is trading below EMA20'}`,
        `Trend: ${data.trend}`,
        `Suggestion: ${bullish ? 'Consider long entries on pullbacks to EMA20' : 'Wait for price to reclaim EMA20'}`,
      ],
    };
  }

  if (key === 'BOLLINGER') {
    let signal = 'HOLD';
    let reason = 'Price is in middle Bollinger range';
    let suggestion = 'Wait for breakout from the band range';

    if (data.currentPrice != null && data.bollingerUpper != null && data.currentPrice >= data.bollingerUpper) {
      signal = 'SELL';
      reason = 'Price touched/near upper Bollinger band';
      suggestion = 'Be cautious with fresh buying at overextended levels';
    } else if (data.currentPrice != null && data.bollingerLower != null && data.currentPrice <= data.bollingerLower) {
      signal = 'BUY';
      reason = 'Price touched/near lower Bollinger band';
      suggestion = 'Watch reversal confirmation for potential bounce trade';
    }

    return {
      title: 'Bollinger Result',
      lines: [
        `Upper Band: ${formatIndicatorValue(data.bollingerUpper, 2)}`,
        `Lower Band: ${formatIndicatorValue(data.bollingerLower, 2)}`,
        `Signal: ${signal} ${signal === 'BUY' ? '✅' : signal === 'SELL' ? '⚠️' : '⏳'}`,
        `Reason: ${reason}`,
        `Trend: ${data.trend}`,
        `Suggestion: ${suggestion}`,
      ],
    };
  }

  return {
    title: 'Indicator Result',
    lines: ['Indicator interpretation unavailable.'],
  };
}

export default function Analysis() {
  const [mode, setMode] = useState('beginner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState(null);
  const [news, setNews] = useState([]);
  const [sentiment, setSentiment] = useState(null);
  const [lastSymbol, setLastSymbol] = useState('');
  const [techLoading, setTechLoading] = useState(false);
  const [techError, setTechError] = useState('');
  const [technicalData, setTechnicalData] = useState(null);
  const [selectedIndicator, setSelectedIndicator] = useState('RSI');
  const [showLearnPanel, setShowLearnPanel] = useState(false);

  const handleModeChange = async (nextMode) => {
    setMode(nextMode);

    if (nextMode === 'beginner') {
      setTechError('');
      setTechnicalData(null);
      return;
    }

    if (lastSymbol && quote) {
      setTechLoading(true);
      setTechError('');
      try {
        const candleData = await getUpstoxDailyCandles(lastSymbol, 120);
        const computed = buildTechnicalIndicators(candleData?.candles || [], quote.price);
        if (!computed) {
          setTechError('Not enough historical data to compute advanced indicators for this symbol.');
          setTechnicalData(null);
        } else {
          setTechnicalData(computed);
        }
      } catch (indicatorErr) {
        setTechError(indicatorErr.message || 'Failed to load technical indicators.');
        setTechnicalData(null);
      } finally {
        setTechLoading(false);
      }
    }
  };

  const handleSearch = async (symbol) => {
    setLoading(true);
    setError('');
    setLastSymbol(symbol);
    setTechError('');

    if (mode === 'advanced') {
      setTechLoading(true);
    } else {
      setTechnicalData(null);
      setTechLoading(false);
    }

    try {
      const quoteData = await getStockQuote(symbol);
      setQuote(quoteData);

      const newsData = await getStockNews(symbol);

      setNews(newsData);
      setSentiment(analyzeSentiment(newsData));

      if (newsData.length === 0) {
        setError('Live quote loaded. News feed is currently unavailable, so sentiment is shown as neutral.');
      }

      if (mode === 'advanced') {
        try {
          const candleData = await getUpstoxDailyCandles(symbol, 120);
          const computed = buildTechnicalIndicators(candleData?.candles || [], quoteData.price);
          if (!computed) {
            setTechError('Not enough historical data to compute advanced indicators for this symbol.');
            setTechnicalData(null);
          } else {
            setTechnicalData(computed);
          }
        } catch (indicatorErr) {
          setTechError(indicatorErr.message || 'Failed to load technical indicators.');
          setTechnicalData(null);
        }
      }
    } catch (err) {
      setQuote(null);
      setNews([]);
      setSentiment(null);
      setTechnicalData(null);
      setTechError('');
      setError(err.message || 'Failed to fetch stock data');
    } finally {
      setLoading(false);
      if (mode === 'advanced') {
        setTechLoading(false);
      }
    }
  };

  const indicatorSummary = getIndicatorSummary(selectedIndicator, technicalData);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        padding: '32px 24px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 34, fontWeight: 700 }}>
        Live Indian Stock Market Tracker
      </h2>

      <div style={styles.topControlRow}>
        <div style={styles.modeRow}>
          <button
            type="button"
            onClick={() => handleModeChange('beginner')}
            style={{
              ...styles.modeButton,
              ...(mode === 'beginner' ? styles.modeButtonActive : styles.modeButtonInactive),
            }}
          >
            Beginner
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('advanced')}
            style={{
              ...styles.modeButton,
              ...(mode === 'advanced' ? styles.modeButtonActive : styles.modeButtonInactive),
            }}
          >
            Advanced
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowLearnPanel((prev) => !prev)}
          style={styles.learnButton}
        >
          {showLearnPanel ? 'Close Learn' : 'Learn'}
        </button>
      </div>

      {showLearnPanel && (
        <div style={styles.learnCard}>
          <div style={styles.learnHeadRow}>
            <h3 style={styles.learnTitle}>What Are Technical Indicators?</h3>
            <button
              type="button"
              onClick={() => setShowLearnPanel(false)}
              style={styles.learnCloseButton}
            >
              Close
            </button>
          </div>
          <p style={styles.learnIntro}>
            Technical indicators are math-based tools built from price and volume data. They help traders read momentum, trend, and volatility.
          </p>

          <div style={styles.learnGrid}>
            {LEARN_ITEMS.map((item, index) => (
              <article key={item.key} style={styles.learnItemCard}>
                <p style={styles.learnItemHeading}>{index + 1}. {item.short}</p>
                <p style={styles.learnItemLine}><strong>Full Form:</strong> {item.fullForm}</p>
                <p style={styles.learnItemLine}><strong>Definition:</strong> {item.definition}</p>
                <p style={styles.learnItemLine}><strong>Example:</strong> {item.example}</p>
                <p style={styles.learnResultGuide}><strong>Result Guide:</strong> {item.resultGuide}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      <StockSearch onSearch={handleSearch} loading={loading} />

      {loading && <p style={{ margin: 0 }}>Loading stock analysis...</p>}

      {error && (
        <p
          style={{
            margin: 0,
            color: '#ff9f9f',
            background: 'rgba(255, 0, 0, 0.15)',
            border: '1px solid rgba(255, 105, 105, 0.35)',
            borderRadius: 10,
            padding: '10px 14px',
          }}
        >
          {error}
        </p>
      )}

      {quote && sentiment && (
        <StockResults quote={quote} sentiment={sentiment} news={news} />
      )}

      {mode === 'advanced' && (
        <div style={styles.advancedCard}>
          <h3 style={styles.advancedTitle}>Technical Indicators</h3>

          <div style={styles.selectorWrap}>
            <label htmlFor="indicator-select" style={styles.selectorLabel}>Indicator</label>
            <select
              id="indicator-select"
              value={selectedIndicator}
              onChange={(event) => setSelectedIndicator(event.target.value)}
              style={styles.selector}
            >
              {Object.entries(INDICATOR_USAGE).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {techLoading && <p style={styles.advancedInfo}>Loading technical indicators...</p>}
          {techError && <p style={styles.advancedError}>{techError}</p>}

          {!techLoading && !techError && technicalData && (
            <>
              <div style={styles.technicalResultCard}>
                <p style={styles.resultCardTitle}>{indicatorSummary.title}</p>
                <div style={styles.resultListWrap}>
                  {indicatorSummary.lines.map((line) => (
                    <p key={line} style={styles.resultLine}>{line}</p>
                  ))}
                </div>
              </div>
              <p style={styles.advancedUsageTitle}>Usage</p>
              <p style={styles.advancedUsageText}>{INDICATOR_USAGE[selectedIndicator].usage}</p>
            </>
          )}

          {!techLoading && !techError && !technicalData && quote && (
            <p style={styles.advancedInfo}>Search a stock to load advanced technical indicators.</p>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  topControlRow: {
    width: '100%',
    maxWidth: 1040,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  modeRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: 10,
  },
  learnButton: {
    borderRadius: 10,
    padding: '10px 16px',
    border: '1px solid rgba(130, 201, 230, 0.45)',
    background: 'linear-gradient(135deg, rgba(105, 230, 255, 0.85), rgba(121, 255, 208, 0.85))',
    color: '#06232f',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(94, 221, 243, 0.2)',
  },
  modeButton: {
    borderRadius: 10,
    padding: '10px 16px',
    border: '1px solid transparent',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  modeButtonActive: {
    color: '#072a36',
    background: 'linear-gradient(135deg, #6ce6ff, #79ffd0)',
    borderColor: 'rgba(121, 255, 208, 0.7)',
    boxShadow: '0 8px 18px rgba(108, 230, 255, 0.25)',
  },
  modeButtonInactive: {
    color: '#d3e7f3',
    background: 'rgba(7, 28, 41, 0.65)',
    borderColor: 'rgba(122, 196, 228, 0.35)',
  },
  learnCard: {
    width: '100%',
    maxWidth: 1040,
    borderRadius: 18,
    border: '1px solid rgba(122, 196, 228, 0.32)',
    background: 'linear-gradient(160deg, rgba(16, 45, 59, 0.9), rgba(8, 28, 40, 0.94))',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.28)',
    padding: '18px 20px',
    color: '#e9f6ff',
  },
  learnHeadRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  learnTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
  },
  learnCloseButton: {
    borderRadius: 10,
    padding: '8px 14px',
    border: '1px solid rgba(140, 200, 228, 0.4)',
    background: 'rgba(6, 23, 33, 0.7)',
    color: '#e7f5ff',
    cursor: 'pointer',
    fontWeight: 700,
  },
  learnIntro: {
    margin: '10px 0 0',
    color: '#cde3ef',
    fontSize: 14,
    lineHeight: 1.5,
  },
  learnGrid: {
    marginTop: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  learnItemCard: {
    borderRadius: 14,
    border: '1px solid rgba(130, 201, 230, 0.35)',
    background: 'rgba(6, 23, 33, 0.7)',
    padding: '12px 12px 10px',
    width: '100%',
  },
  learnItemHeading: {
    margin: 0,
    color: '#f1fbff',
    fontSize: 16,
    fontWeight: 800,
  },
  learnItemLine: {
    margin: '8px 0 0',
    color: '#d2e8f4',
    fontSize: 13,
    lineHeight: 1.45,
  },
  learnResultGuide: {
    margin: '8px 0 0',
    color: '#98ffd5',
    fontSize: 13,
    lineHeight: 1.45,
  },
  advancedCard: {
    width: '100%',
    maxWidth: 1040,
    borderRadius: 18,
    border: '1px solid rgba(122, 196, 228, 0.32)',
    background: 'linear-gradient(160deg, rgba(16, 45, 59, 0.9), rgba(8, 28, 40, 0.94))',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.28)',
    padding: '18px 20px',
    color: '#e9f6ff',
  },
  advancedTitle: {
    margin: '0 0 12px',
    fontSize: 24,
    fontWeight: 800,
  },
  selectorWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxWidth: 420,
  },
  selectorLabel: {
    fontSize: 12,
    color: '#9ec8dc',
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  selector: {
    borderRadius: 10,
    border: '1px solid rgba(130, 201, 230, 0.35)',
    background: 'rgba(6, 23, 33, 0.7)',
    color: '#eff8ff',
    fontSize: 14,
    padding: '10px 12px',
    outline: 'none',
  },
  advancedInfo: {
    margin: '14px 0 0',
    color: '#b6d4e4',
    fontSize: 14,
  },
  advancedError: {
    margin: '14px 0 0',
    color: '#ffaaaa',
    background: 'rgba(255, 75, 75, 0.12)',
    border: '1px solid rgba(255, 110, 110, 0.32)',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
  },
  technicalResultCard: {
    marginTop: 14,
    borderRadius: 20,
    padding: '14px 16px',
    background: '#e8eaed',
    border: '1px solid #d8dbe1',
  },
  resultCardTitle: {
    margin: '0 0 10px',
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 800,
  },
  resultListWrap: {
    display: 'grid',
    gap: 4,
  },
  resultLine: {
    margin: 0,
    color: '#0f172a',
    fontSize: 16,
    lineHeight: 1.4,
    fontFamily: 'Consolas, Monaco, monospace',
  },
  advancedUsageTitle: {
    margin: '14px 0 4px',
    fontSize: 12,
    color: '#9ec8dc',
    letterSpacing: 0.3,
    fontWeight: 700,
  },
  advancedUsageText: {
    margin: 0,
    color: '#cde2ef',
    fontSize: 14,
    lineHeight: 1.5,
  },
};
