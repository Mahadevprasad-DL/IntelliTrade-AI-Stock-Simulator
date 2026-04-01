import { DecisionTreeRegressor } from './decisionTree.jsx';

export class StockPredictor {
  constructor() {
    this.model = new DecisionTreeRegressor(6, 3);
  }

  calculateTechnicalIndicators(data) {
    return data.map((item, index) => {
      const prevItems = data.slice(Math.max(0, index - 10), index);

      const sma5 =
        prevItems.length >= 5
          ? prevItems.slice(-5).reduce((sum, d) => sum + d.close, 0) / 5
          : item.close;

      const sma10 =
        prevItems.length >= 10
          ? prevItems.reduce((sum, d) => sum + d.close, 0) / 10
          : item.close;

      const priceChange =
        prevItems.length > 0
          ? ((item.close - prevItems[prevItems.length - 1].close) /
              prevItems[prevItems.length - 1].close) *
            100
          : 0;

      const volatility =
        prevItems.length >= 5
          ? Math.sqrt(
              prevItems
                .slice(-5)
                .reduce((sum, d) => sum + Math.pow(d.close - sma5, 2), 0) / 5
            )
          : 0;

      const volumeChange =
        prevItems.length > 0
          ? ((item.volume - prevItems[prevItems.length - 1].volume) /
              prevItems[prevItems.length - 1].volume) *
            100
          : 0;

      const highLowRange = ((item.high - item.low) / item.low) * 100;

      return {
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        sma5,
        sma10,
        priceChange,
        volatility,
        volumeChange,
        highLowRange,
      };
    });
  }

  trainModel(stockData) {
    if (stockData.length < 20) {
      throw new Error('Not enough data to train the model. Need at least 20 data points.');
    }

    const sortedData = [...stockData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const features = this.calculateTechnicalIndicators(sortedData);

    const X = features.slice(0, -1);
    const y = sortedData.slice(1).map(d => d.close);

    this.model.fit(X, y);
  }

  predict(stockData, symbol) {
    const symbolData = stockData
      .filter(d => d.symbol === symbol)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (symbolData.length < 10) {
      throw new Error(`Not enough data for ${symbol}. Need at least 10 data points.`);
    }

    const latestData = symbolData[symbolData.length - 1];
    const features = this.calculateTechnicalIndicators(symbolData);
    const latestFeatures = features[features.length - 1];

    const predictedPrice = this.model.predict([latestFeatures])[0];
    const currentPrice = latestData.close;

    const priceChange = predictedPrice - currentPrice;
    const priceChangePercent = (priceChange / currentPrice) * 100;

    let recommendation;
    if (priceChangePercent > 2) {
      recommendation = 'BUY';
    } else if (priceChangePercent < -2) {
      recommendation = 'SELL';
    } else {
      recommendation = 'HOLD';
    }

    const confidence = Math.min(
      100,
      Math.abs(priceChangePercent) * 10 + 50
    );

    return {
      symbol,
      currentPrice,
      predictedPrice,
      recommendation,
      confidence: Math.round(confidence),
      priceChange,
      priceChangePercent,
    };
  }

  getAllPredictions(stockData) {
    const symbols = [...new Set(stockData.map(d => d.symbol))];
    const predictions = [];

    for (const symbol of symbols) {
      try {
        const symbolData = stockData.filter(d => d.symbol === symbol);
        if (symbolData.length >= 10) {
          this.trainModel(symbolData);
          const prediction = this.predict(stockData, symbol);
          predictions.push(prediction);
        }
      } catch (error) {
        console.error(`Error predicting ${symbol}:`, error);
      }
    }

    return predictions;
  }
}
