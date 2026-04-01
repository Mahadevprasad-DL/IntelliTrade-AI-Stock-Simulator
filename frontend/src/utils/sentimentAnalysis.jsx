export function analyzeSentiment(articles) {
  if (articles.length === 0) {
    return {
      overall_score: 0,
      overall_label: 'Neutral',
      positive_count: 0,
      negative_count: 0,
      neutral_count: 0,
      recommendation: 'HOLD',
      confidence: 20,
    };
  }

  let positive_count = 0;
  let negative_count = 0;
  let neutral_count = 0;
  let total_score = 0;

  articles.forEach((article) => {
    const score = parseFloat(String(article.sentiment_score)) || 0;
    total_score += score;

    const label = String(article.sentiment_label).toLowerCase();
    if (label.includes('bullish') || label.includes('positive')) {
      positive_count++;
    } else if (label.includes('bearish') || label.includes('negative')) {
      negative_count++;
    } else {
      neutral_count++;
    }
  });

  const overall_score = total_score / articles.length;

  let overall_label = 'Neutral';
  let recommendation = 'HOLD';

  if (overall_score > 0.1) {
    overall_label = 'Bullish';
    recommendation = 'BUY';
  } else if (overall_score < -0.1) {
    overall_label = 'Bearish';
    recommendation = 'SELL';
  }

  const confidence = Math.min(
    100,
    Math.max(
      20,
      Math.round(
        (Math.abs(overall_score) * 100 +
          (Math.max(positive_count, negative_count) / articles.length) * 50) *
          0.8
      )
    )
  );

  return {
    overall_score,
    overall_label,
    positive_count,
    negative_count,
    neutral_count,
    recommendation,
    confidence,
  };
}
