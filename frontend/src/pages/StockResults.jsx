import {
  TrendingUp,
  TrendingDown,
  Minus,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from 'lucide-react';

export default function StockResults({
  quote,
  sentiment,
  news,
}) {
  const isPositive = quote.change >= 0;

  const getRecommendationIcon = (rec) => {
    if (rec === 'BUY') return <ThumbsUp size={24} />;
    if (rec === 'SELL') return <ThumbsDown size={24} />;
    return <AlertCircle size={24} />;
  };

  const getSentimentColor = (label) => {
    if (label === 'Bullish') return '#26d07c';
    if (label === 'Bearish') return '#ff7e7e';
    return '#d7e6ee';
  };

  const formatPublishDate = (rawDate) => {
    if (!rawDate) return 'Unknown date';

    const parsed = new Date(
      String(rawDate).replace(
        /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
        '$1-$2-$3T$4:$5:$6'
      )
    );

    return Number.isNaN(parsed.getTime())
      ? 'Unknown date'
      : parsed.toLocaleDateString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.mainCard}>
        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.symbol}>
              {quote.symbol}
            </h2>
            <p style={styles.price}>Rs {quote.price.toFixed(2)}</p>
          </div>
          <div
            style={{
              ...styles.deltaBadge,
              ...(isPositive ? styles.deltaPositive : styles.deltaNegative),
            }}
          >
            {isPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            <span style={styles.deltaText}>
              {isPositive ? '+' : ''}
              {quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <p style={styles.metricLabel}>Open</p>
            <p style={styles.metricValue}>Rs {quote.open.toFixed(2)}</p>
          </div>
          <div style={styles.metricCard}>
            <p style={styles.metricLabel}>High</p>
            <p style={styles.metricValue}>Rs {quote.high.toFixed(2)}</p>
          </div>
          <div style={styles.metricCard}>
            <p style={styles.metricLabel}>Low</p>
            <p style={styles.metricValue}>Rs {quote.low.toFixed(2)}</p>
          </div>
          <div style={styles.metricCard}>
            <p style={styles.metricLabel}>Prev Close</p>
            <p style={styles.metricValue}>
              Rs {quote.previousClose.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div style={styles.mainCard}>
        <h3 style={styles.sectionTitle}>
          Sentiment Analysis & Recommendation
        </h3>

        <div style={styles.sentimentRow}>
          <div style={styles.sentimentSummary}>
            <p style={styles.labelMuted}>Overall Sentiment</p>
            <p
              style={{
                ...styles.sentimentLabel,
                color: getSentimentColor(sentiment.overall_label),
              }}
            >
              {sentiment.overall_label}
            </p>
            <p style={styles.scoreText}>
              Score: {sentiment.overall_score.toFixed(3)}
            </p>
          </div>

          <div style={styles.sentimentCountsRow}>
            <div style={styles.countCard}>
              <div style={styles.countIconCircleGreen}>
                <TrendingUp color="#1fcf76" size={24} />
              </div>
              <p style={styles.countNumber}>{sentiment.positive_count}</p>
              <p style={styles.countLabel}>Positive</p>
            </div>
            <div style={styles.countCard}>
              <div style={styles.countIconCircleNeutral}>
                <Minus color="#85a5b8" size={24} />
              </div>
              <p style={styles.countNumber}>{sentiment.neutral_count}</p>
              <p style={styles.countLabel}>Neutral</p>
            </div>
            <div style={styles.countCard}>
              <div style={styles.countIconCircleRed}>
                <TrendingDown color="#ff7e7e" size={24} />
              </div>
              <p style={styles.countNumber}>{sentiment.negative_count}</p>
              <p style={styles.countLabel}>Negative</p>
            </div>
          </div>

          <div style={styles.recommendationWrap}>
            <div
              style={{
                ...styles.recommendationCard,
                ...(sentiment.recommendation === 'BUY'
                  ? styles.recommendationBuy
                  : sentiment.recommendation === 'SELL'
                  ? styles.recommendationSell
                  : styles.recommendationHold),
              }}
            >
              <div style={styles.recommendationIcon}>
                {getRecommendationIcon(sentiment.recommendation)}
              </div>
              <p style={styles.recommendationText}>{sentiment.recommendation}</p>
              <p style={styles.recommendationConfidence}>
                Confidence: {sentiment.confidence}%
              </p>
            </div>
          </div>
        </div>

        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressBar,
              width: `${Math.abs(sentiment.overall_score) * 100}%`,
              marginLeft:
                sentiment.overall_score < 0
                  ? `${100 - Math.abs(sentiment.overall_score) * 100}%`
                  : '0',
              background:
                sentiment.overall_score > 0
                  ? 'linear-gradient(90deg, #14b86a, #4be39b)'
                  : 'linear-gradient(90deg, #ff8585, #ff4f4f)',
            }}
          />
        </div>
      </div>

      <div style={styles.mainCard}>
        <h3 style={styles.sectionTitle}>
          Recent News ({news.length} articles analyzed)
        </h3>
        <div style={styles.newsList}>
          {news.map((article, index) => {
            const lowerLabel = String(article.sentiment_label || '').toLowerCase();
            const isBullish =
              lowerLabel.includes('bullish') || lowerLabel.includes('positive');
            const isBearish =
              lowerLabel.includes('bearish') || lowerLabel.includes('negative');

            return (
              <article key={index} style={styles.newsCard}>
                <div style={styles.newsHead}>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.newsTitle}
                  >
                    {article.title}
                  </a>
                  <span
                    style={{
                      ...styles.newsTag,
                      ...(isBullish
                        ? styles.newsTagBullish
                        : isBearish
                        ? styles.newsTagBearish
                        : styles.newsTagNeutral),
                    }}
                  >
                    {article.sentiment_label}
                  </span>
                </div>

                <p style={styles.newsSummary}>{article.summary}</p>

                <div style={styles.newsMeta}>
                  <span>{article.source || 'Unknown source'}</span>
                  <span>{formatPublishDate(article.time_published)}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: 1040,
    display: 'grid',
    gap: 18,
  },
  mainCard: {
    borderRadius: 20,
    border: '1px solid rgba(122, 196, 228, 0.32)',
    background: 'linear-gradient(155deg, rgba(16, 45, 59, 0.88), rgba(8, 28, 40, 0.92))',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.28)',
    padding: '22px 22px 20px',
    color: '#eef9ff',
  },
  headerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 18,
  },
  symbol: {
    margin: 0,
    fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
    color: '#eaf7ff',
    fontWeight: 800,
  },
  price: {
    margin: '4px 0 0',
    fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
    color: '#ffffff',
    fontWeight: 800,
  },
  deltaBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 14,
    border: '1px solid transparent',
  },
  deltaPositive: {
    background: 'rgba(27, 189, 106, 0.15)',
    color: '#4be39b',
    borderColor: 'rgba(56, 208, 127, 0.3)',
  },
  deltaNegative: {
    background: 'rgba(255, 99, 99, 0.15)',
    color: '#ff9090',
    borderColor: 'rgba(255, 117, 117, 0.35)',
  },
  deltaText: {
    fontSize: 18,
    fontWeight: 700,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
    gap: 12,
  },
  metricCard: {
    borderRadius: 14,
    padding: '12px 14px',
    background: 'rgba(5, 21, 31, 0.6)',
    border: '1px solid rgba(120, 186, 216, 0.3)',
  },
  metricLabel: {
    margin: 0,
    fontSize: 12,
    letterSpacing: 0.2,
    color: '#9fc6d9',
  },
  metricValue: {
    margin: '6px 0 0',
    fontSize: 21,
    fontWeight: 700,
    color: '#f5fbff',
  },
  sectionTitle: {
    margin: '0 0 18px',
    fontSize: 'clamp(1.2rem, 2.6vw, 1.7rem)',
    color: '#edf7ff',
    fontWeight: 800,
  },
  sentimentRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    alignItems: 'stretch',
    marginBottom: 16,
  },
  sentimentSummary: {
    borderRadius: 14,
    border: '1px solid rgba(127, 196, 226, 0.3)',
    background: 'rgba(7, 24, 35, 0.6)',
    padding: '14px 16px',
  },
  labelMuted: {
    margin: 0,
    color: '#a5c8da',
    fontSize: 12,
  },
  sentimentLabel: {
    margin: '8px 0 4px',
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1.05,
  },
  scoreText: {
    margin: 0,
    fontSize: 13,
    color: '#b8d2df',
  },
  sentimentCountsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(74px, 1fr))',
    gap: 10,
    alignItems: 'center',
  },
  countCard: {
    borderRadius: 14,
    border: '1px solid rgba(128, 191, 221, 0.25)',
    background: 'rgba(8, 29, 42, 0.66)',
    padding: '12px 8px',
    textAlign: 'center',
  },
  countIconCircleGreen: {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: 'rgba(31, 207, 118, 0.12)',
    border: '1px solid rgba(75, 227, 155, 0.4)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countIconCircleNeutral: {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: 'rgba(133, 165, 184, 0.14)',
    border: '1px solid rgba(133, 165, 184, 0.42)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countIconCircleRed: {
    width: 44,
    height: 44,
    borderRadius: 999,
    background: 'rgba(255, 126, 126, 0.13)',
    border: '1px solid rgba(255, 126, 126, 0.42)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countNumber: {
    margin: '6px 0 2px',
    fontSize: 24,
    fontWeight: 800,
    color: '#f2f9ff',
  },
  countLabel: {
    margin: 0,
    fontSize: 11,
    color: '#9fc4d6',
    letterSpacing: 0.25,
  },
  recommendationWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  recommendationCard: {
    borderRadius: 16,
    padding: '14px 18px',
    minWidth: 180,
    textAlign: 'center',
    border: '1px solid transparent',
  },
  recommendationBuy: {
    background: 'linear-gradient(145deg, rgba(29, 191, 109, 0.22), rgba(18, 120, 71, 0.28))',
    borderColor: 'rgba(67, 224, 149, 0.38)',
    color: '#e4fff2',
  },
  recommendationSell: {
    background: 'linear-gradient(145deg, rgba(255, 111, 111, 0.22), rgba(151, 31, 31, 0.28))',
    borderColor: 'rgba(255, 130, 130, 0.45)',
    color: '#ffeaea',
  },
  recommendationHold: {
    background: 'linear-gradient(145deg, rgba(140, 156, 166, 0.25), rgba(91, 111, 126, 0.33))',
    borderColor: 'rgba(177, 199, 212, 0.45)',
    color: '#e8f4fb',
  },
  recommendationIcon: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 6,
  },
  recommendationText: {
    margin: 0,
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 1,
  },
  recommendationConfidence: {
    margin: '6px 0 0',
    fontSize: 13,
    opacity: 0.95,
  },
  progressTrack: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    background: 'rgba(93, 128, 147, 0.35)',
    border: '1px solid rgba(129, 177, 201, 0.35)',
  },
  progressBar: {
    height: '100%',
    transition: 'all 0.5s ease',
  },
  newsList: {
    display: 'grid',
    gap: 12,
    maxHeight: 380,
    overflowY: 'auto',
    paddingRight: 4,
  },
  newsCard: {
    borderRadius: 14,
    border: '1px solid rgba(122, 189, 220, 0.28)',
    background: 'rgba(6, 24, 35, 0.66)',
    padding: '12px 14px',
  },
  newsHead: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  newsTitle: {
    color: '#a6e8ff',
    textDecoration: 'none',
    fontSize: 16,
    fontWeight: 700,
    flex: 1,
    minWidth: 220,
    lineHeight: 1.35,
  },
  newsTag: {
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  newsTagBullish: {
    background: 'rgba(31, 207, 118, 0.18)',
    color: '#68e8ab',
    border: '1px solid rgba(76, 228, 154, 0.4)',
  },
  newsTagBearish: {
    background: 'rgba(255, 126, 126, 0.18)',
    color: '#ff9e9e',
    border: '1px solid rgba(255, 126, 126, 0.4)',
  },
  newsTagNeutral: {
    background: 'rgba(134, 159, 173, 0.22)',
    color: '#d2e2eb',
    border: '1px solid rgba(157, 188, 205, 0.35)',
  },
  newsSummary: {
    margin: '0 0 9px',
    color: '#bfd8e6',
    fontSize: 13,
    lineHeight: 1.5,
  },
  newsMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    color: '#94b8ca',
    fontSize: 12,
  },
};
