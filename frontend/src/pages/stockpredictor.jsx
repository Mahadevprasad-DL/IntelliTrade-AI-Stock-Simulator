import { useState } from 'react';
import { Upload, TrendingUp, TrendingDown, Minus, ArrowRight, RefreshCw } from 'lucide-react';
import { StockPredictor, StockData, PredictionResult } from '../utils/stockPredictor';

export default function StockPredictorComponent() {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<PredictionResult | null>(null);
  const [hasData, setHasData] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      const data: StockData[] = JSON.parse(text);

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid JSON format. Expected an array of stock data.');
      }

      const predictor = new StockPredictor();
      const results = predictor.getAllPredictions(data);

      if (results.length === 0) {
        throw new Error('No predictions could be generated. Check your data format.');
      }

      setPredictions(results);
      setSelectedStock(results[0]);
      setHasData(true);
      setError('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process file';
      setError(errorMsg);
      console.error('Error:', errorMsg);
      setPredictions([]);
      setSelectedStock(null);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPredictions([]);
    setSelectedStock(null);
    setHasData(false);
    setError('');
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY':
        return 'bg-emerald-500';
      case 'SELL':
        return 'bg-red-500';
      case 'HOLD':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY':
        return <TrendingUp className="w-8 h-8" />;
      case 'SELL':
        return <TrendingDown className="w-8 h-8" />;
      case 'HOLD':
        return <Minus className="w-8 h-8" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3">
            Stock Market Predictor
          </h1>
          <p className="text-slate-300 text-lg">
            AI-Powered Decision Tree Analysis for Indian Stocks
          </p>
        </div>

        {!hasData ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Upload Stock Data
                </h2>
                <p className="text-slate-400">
                  Upload your JSON file containing Indian stock market data
                </p>
              </div>

              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="block w-full text-sm text-slate-300
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-500 file:text-white
                    hover:file:bg-blue-600
                    file:cursor-pointer cursor-pointer
                    file:transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>

              {loading && (
                <div className="mt-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                  <p className="text-slate-300 mt-3">Analyzing stock data...</p>
                </div>
              )}

              {error && (
                <div className="mt-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <div className="mt-8 bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <h3 className="text-white font-semibold mb-3">Expected JSON Format:</h3>
                <pre className="text-xs text-slate-300 overflow-x-auto">
{`[
  {
    "symbol": "RELIANCE",
    "date": "2024-01-01",
    "open": 2500.50,
    "high": 2550.75,
    "low": 2490.25,
    "close": 2530.00,
    "volume": 1500000
  },
  {
    "symbol": "RELIANCE",
    "date": "2024-01-02",
    "open": 2530.00,
    "high": 2560.75,
    "low": 2520.25,
    "close": 2550.00,
    "volume": 1400000
  }
]`}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Stocks ({predictions.length})</h2>
                  <button
                    onClick={handleReset}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    title="Load new data"
                  >
                    <RefreshCw className="w-5 h-5 text-red-400" />
                  </button>
                </div>

                <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                  {predictions.map((pred) => (
                    <button
                      key={pred.symbol}
                      onClick={() => setSelectedStock(pred)}
                      className={`w-full text-left p-4 rounded-xl transition-all ${
                        selectedStock?.symbol === pred.symbol
                          ? 'bg-blue-500/30 border-2 border-blue-400'
                          : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-white">{pred.symbol}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getRecommendationColor(
                            pred.recommendation
                          )}`}
                        >
                          {pred.recommendation}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400">
                        ₹{pred.currentPrice.toFixed(2)}
                        <span
                          className={`ml-2 ${
                            pred.priceChangePercent > 0
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {pred.priceChangePercent > 0 ? '+' : ''}
                          {pred.priceChangePercent.toFixed(2)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedStock && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {selectedStock.symbol}
                    </h2>
                    <p className="text-slate-400">AI Prediction Analysis</p>
                  </div>

                  <div
                    className={`${getRecommendationColor(
                      selectedStock.recommendation
                    )} rounded-2xl p-8 mb-8 shadow-lg`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white/80 text-sm font-medium mb-2">
                          RECOMMENDATION
                        </div>
                        <div className="text-5xl font-bold text-white mb-1">
                          {selectedStock.recommendation}
                        </div>
                        <div className="text-white/90 text-lg">
                          Confidence: {selectedStock.confidence}%
                        </div>
                      </div>
                      <div className="text-white opacity-90">
                        {getRecommendationIcon(selectedStock.recommendation)}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <div className="text-slate-400 text-sm mb-2">Current Price</div>
                      <div className="text-3xl font-bold text-white">
                        ₹{selectedStock.currentPrice.toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <div className="text-slate-400 text-sm mb-2">Predicted Price</div>
                      <div className="text-3xl font-bold text-white">
                        ₹{selectedStock.predictedPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-slate-400 text-sm">Expected Change</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div
                          className={`text-4xl font-bold ${
                            selectedStock.priceChange > 0
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {selectedStock.priceChange > 0 ? '+' : ''}₹
                          {Math.abs(selectedStock.priceChange).toFixed(2)}
                        </div>
                        <div
                          className={`text-2xl font-semibold mt-1 ${
                            selectedStock.priceChangePercent > 0
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {selectedStock.priceChangePercent > 0 ? '+' : ''}
                          {selectedStock.priceChangePercent.toFixed(2)}%
                        </div>
                      </div>
                      <ArrowRight
                        className={`w-12 h-12 ${
                          selectedStock.priceChange > 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-3">Analysis Method</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      This prediction uses a Decision Tree Regressor trained on historical
                      stock data with technical indicators including moving averages (SMA5,
                      SMA10), volatility, volume changes, and price momentum. The model
                      analyzes patterns to forecast future price movements.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
