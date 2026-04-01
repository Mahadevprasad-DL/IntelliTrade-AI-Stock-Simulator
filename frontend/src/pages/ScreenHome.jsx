import React, { useEffect, useRef, useState } from 'react'
import { getUpstoxDailyCandles, getUpstoxQuote, normalizeUpstoxSymbol } from '../utils/upstoxApi.jsx'

const companyBySymbol = {
  RELIANCE: 'Reliance Industries',
  TCS: 'Tata Consultancy Services',
  INFY: 'Infosys',
  HDFCBANK: 'HDFC Bank',
  ICICIBANK: 'ICICI Bank',
  SBIN: 'State Bank of India',
  LT: 'Larsen & Toubro',
  ITC: 'ITC',
  WIPRO: 'Wipro Limited',
  BAJFINANCE: 'Bajaj Finance',
  MARUTI: 'Maruti Suzuki',
  AXISBANK: 'Axis Bank',
  TATAMOTORS: 'Tata Motors',
  BHARTIARTL: 'Bharti Airtel'
}

const defaultTrackedSymbols = [
  'RELIANCE.BSE',
  'TCS.BSE',
  'INFY.BSE'
]

function toSvgPath(series, width = 180, height = 52) {
  if (!series.length) return ''
  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1
  return series
    .map((value, index) => {
      const x = (index / (series.length - 1 || 1)) * width
      const y = height - ((value - min) / range) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

export default function ScreenHome(){
  const [symbolInput, setSymbolInput] = useState('')
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [trackedSymbols, setTrackedSymbols] = useState(defaultTrackedSymbols)
  const isRefreshingRef = useRef(false)

  const normalizeSymbol = (value) => {
    return normalizeUpstoxSymbol(value)
  }

  const toDisplaySymbol = (apiSymbol) => apiSymbol.replace('.BSE', '').replace('.NSE', '')

  const fetchSingleStock = async (apiSymbol) => {
    const quoteData = await getUpstoxQuote(apiSymbol)
    const historical = await getUpstoxDailyCandles(apiSymbol, 60)
    const rows = historical.candles || []

    if (!rows.length) {
      throw new Error(`No historical data available for ${apiSymbol}`)
    }

    const latestData = rows[rows.length - 1]
    const prevData = rows[rows.length - 2] || latestData
    const last30Days = rows.slice(-30)
    const high30Day = Math.max(...last30Days.map((item) => Number(item.high || 0)))
    const low30Day = Math.min(...last30Days.map((item) => Number(item.low || 0)))
    const lineSeries = rows.slice(-20).map((item) => Number(item.close || 0))
    const candles = rows.slice(-12).map((item) => ({
      open: Number(item.open || 0),
      high: Number(item.high || 0),
      low: Number(item.low || 0),
      close: Number(item.close || 0),
      datetime: String(item.timestamp || '').split('T')[0]
    }))
    const historicalData = last30Days.map((item) => ({
      date: String(item.timestamp || '').split('T')[0],
      open: Number(item.open || 0),
      high: Number(item.high || 0),
      low: Number(item.low || 0),
      close: Number(item.close || 0)
    }))

    const displaySymbol = quoteData.symbol || toDisplaySymbol(apiSymbol)

    return {
      apiSymbol: quoteData.apiSymbol || apiSymbol,
      symbol: displaySymbol,
      name: companyBySymbol[displaySymbol] || displaySymbol,
      exchange: quoteData.exchange || (apiSymbol.endsWith('.NSE') ? 'NSE' : 'BSE'),
      price: Number(quoteData.price || latestData.close || 0),
      prevPrice: Number(prevData.close || latestData.close || 0),
      high: high30Day,
      low: low30Day,
      series: lineSeries,
      candles,
      historicalData
    }
  }

  const upsertStock = (stockData) => {
    setStocks((prev) => {
      const existingIndex = prev.findIndex((item) => item.apiSymbol === stockData.apiSymbol)
      if (existingIndex === -1) {
        return [...prev, stockData]
      }

      const updated = [...prev]
      updated[existingIndex] = stockData
      return updated
    })
  }

  const refreshTrackedStocks = async (symbols, isBackground = false) => {
    const targets = symbols.slice(0, 5)
    if (!targets.length) return

    if (isRefreshingRef.current) return
    isRefreshingRef.current = true

    if (!isBackground) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    setError('')

    try {
      for (let index = 0; index < targets.length; index += 1) {
        const stockData = await fetchSingleStock(targets[index])
        upsertStock(stockData)
      }
    } catch (err) {
      const message = err.message || 'Unable to fetch stock data from Upstox.'
      setError(message)
    } finally {
      if (!isBackground) {
        setLoading(false)
      } else {
        setRefreshing(false)
      }
      isRefreshingRef.current = false
    }
  }

  const handleSearchClick = async () => {
    const normalized = normalizeSymbol(symbolInput)
    if (!normalized) return

    let nextTrackedSymbols = trackedSymbols
    if (!trackedSymbols.includes(normalized)) {
      nextTrackedSymbols = [...trackedSymbols, normalized].slice(-12)
      setTrackedSymbols((prev) => {
        const next = [...prev, normalized]
        return next.slice(-12)
      })
    }

    setLoading(true)
    setError('')
    try {
      const stockData = await fetchSingleStock(normalized)
      upsertStock(stockData)
      if (nextTrackedSymbols.length > 0) {
        setStocks((prev) => prev.filter((item) => nextTrackedSymbols.includes(item.apiSymbol)))
      }
      setSymbolInput('')
    } catch (err) {
      const message = err.message || 'Unable to fetch stock data from Upstox.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshTrackedStocks(defaultTrackedSymbols)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      refreshTrackedStocks(trackedSymbols, true)
    }, 300000)

    return () => clearInterval(interval)
  }, [trackedSymbols])

  const orderedStocks = trackedSymbols
    .map((apiSymbol) => stocks.find((item) => item.apiSymbol === apiSymbol))
    .filter(Boolean)

  return (
    <div style={{ padding: 40 }}>
      <div style={sectionWrap}>
        <h2 style={sectionTitle}>Live Indian Stock Market Tracker</h2>
        <p style={sectionSubtitle}>Real-time NSE & BSE Stock Prices - Powered by Upstox API</p>

        <div style={searchWrap}>
          <label htmlFor="stock-search" style={labelStyle}>Search stock</label>
          <div style={searchControlWrap}>
            <input
              id="stock-search"
              type="text"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              placeholder="Search Indian stocks (e.g., RELIANCE, TCS, INFY, HDFCBANK)"
              style={searchInput}
            />
            <button onClick={handleSearchClick} style={searchButton}>Search</button>
          </div>
          <small style={hintStyle}>API calls happen on Search click and periodic 5-minute refresh. Watchlist supports up to 12 symbols.</small>
          
          <div style={noticeBoxStyle}>
            <div style={noticeTitle}>📊 Supported Exchanges:</div>
            <ul style={noticeListStyle}>
              <li style={allowedItemStyle}>✅ <strong>BSE (Bombay Stock Exchange)</strong> - RELIANCE, TCS, INFY, HDFCBANK, SBIN, and more</li>
              <li style={allowedItemStyle}>✅ <strong>NSE (National Stock Exchange)</strong> - All major Indian stocks supported</li>
            </ul>
          </div>
        </div>

        {loading && <div style={statusStyle}>Loading stock prices...</div>}
        {refreshing && !loading && <div style={statusStyle}>Refreshing prices...</div>}
        {error && <div style={errorStyle}><strong>⚠️ Error:</strong> {error}</div>}

        {!loading && !error && (
          <div style={gridStyle}>
          {orderedStocks.map((stock) => {
            const change = Number((stock.price - stock.prevPrice).toFixed(2))
            const changePct = stock.prevPrice ? Number(((change / stock.prevPrice) * 100).toFixed(2)) : 0
            const isUp = change >= 0
            return (
              <div key={stock.symbol} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ margin: 0, fontSize: 18, color: '#00e0ff' }}>{stock.symbol}</h3>
                  <span style={{ color: '#b9d9f0', fontSize: 12 }}>{stock.exchange}</span>
                </div>
                <div style={{ marginTop: 6, color: '#d0eaff', fontSize: 13 }}>{stock.name}</div>
                
                <div style={{ marginTop: 14, fontSize: 28, fontWeight: 700, color: 'white' }}>
                  ₹ {stock.price.toFixed(2)}
                </div>
                
                <div style={{ marginTop: 6, color: isUp ? '#34d399' : '#f87171', fontSize: 14, fontWeight: 600 }}>
                  {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({Math.abs(changePct).toFixed(2)}%)
                </div>

                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#9fbfdc', marginBottom: 4 }}>HIGH (30D)</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#34d399' }}>
                        ₹ {stock.high.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#9fbfdc', marginBottom: 4 }}>LOW (30D)</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#f87171' }}>
                        ₹ {stock.low.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          </div>
        )}

        {!loading && !error && orderedStocks.length === 0 && (
          <div style={{ marginTop: 18, color: '#d0eaff', textAlign: 'center' }}>
            No matching stock found.
          </div>
        )}
      </div>

      {/* Historical Chart Data Section */}
      {!loading && !error && orderedStocks.length > 0 && (
        <div style={chartSectionWrap}>
          <h2 style={chartSectionTitle}>Historical Chart Data - Line & Candlestick Charts</h2>
          <p style={chartSectionSubtitle}>30-day detailed analysis with proper axes and price levels</p>

          <div style={chartsGridStyle}>
            {orderedStocks.map((stock) => {
              if (!stock.historicalData || stock.historicalData.length === 0) return null

              const prices = stock.historicalData.map((item) => item.close)
              const minPrice = Math.min(...prices)
              const maxPrice = Math.max(...prices)
              const priceRange = maxPrice - minPrice || 1

              // LINE CHART DIMENSIONS
              const lineChartWidth = 700
              const lineChartHeight = 380
              const paddingLeft = 70
              const paddingRight = 30
              const paddingTop = 30
              const paddingBottom = 60
              const plotWidth = lineChartWidth - paddingLeft - paddingRight
              const plotHeight = lineChartHeight - paddingTop - paddingBottom

              const pathData = stock.historicalData.map((item, index) => {
                const x = paddingLeft + (index / (stock.historicalData.length - 1)) * plotWidth
                const y = paddingTop + plotHeight - ((item.close - minPrice) / priceRange) * plotHeight
                return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
              }).join(' ')

              const yTicks = 6
              const yAxisLabels = []
              for (let i = 0; i <= yTicks; i++) {
                const value = minPrice + (priceRange * i / yTicks)
                const y = paddingTop + plotHeight - ((value - minPrice) / priceRange) * plotHeight
                yAxisLabels.push({ value: value.toFixed(2), y })
              }

              const xTicks = Math.min(8, stock.historicalData.length)
              const xAxisLabels = []
              for (let i = 0; i < xTicks; i++) {
                const index = Math.floor((i / (xTicks - 1)) * (stock.historicalData.length - 1))
                const item = stock.historicalData[index]
                const x = paddingLeft + (index / (stock.historicalData.length - 1)) * plotWidth
                xAxisLabels.push({ 
                  date: item.date.substring(5), 
                  x 
                })
              }

              // CANDLESTICK CHART DIMENSIONS
              const candleChartWidth = 700
              const candleChartHeight = 300
              const candlePaddingLeft = 70
              const candlePaddingRight = 30
              const candlePaddingTop = 20
              const candlePaddingBottom = 50
              const candlePlotWidth = candleChartWidth - candlePaddingLeft - candlePaddingRight
              const candlePlotHeight = candleChartHeight - candlePaddingTop - candlePaddingBottom

              const candlePrices = stock.historicalData.map((item) => [item.open, item.high, item.low, item.close]).flat()
              const candleMin = Math.min(...candlePrices)
              const candleMax = Math.max(...candlePrices)
              const candleRange = candleMax - candleMin || 1

              return (
                <div key={stock.symbol} style={chartCardStyle}>
                  <h3 style={chartTitle}>{stock.symbol} - {stock.name}</h3>
                  <p style={chartSubtitle}>Current: ₹{stock.price.toFixed(2)} | 30D High: ₹{stock.high.toFixed(2)} | 30D Low: ₹{stock.low.toFixed(2)}</p>

                  {/* LINE CHART */}
                  <div style={{ marginBottom: 30 }}>
                    <h4 style={chartSubHeading}>Line Chart - Closing Prices</h4>
                    <svg width={lineChartWidth} height={lineChartHeight} style={{ background: 'rgba(15,32,39,0.8)', borderRadius: 8, border: '1px solid rgba(0,224,255,0.2)' }}>
                      {/* Grid lines */}
                      {yAxisLabels.map((tick, i) => (
                        <line
                          key={`grid-${i}`}
                          x1={paddingLeft}
                          y1={tick.y}
                          x2={lineChartWidth - paddingRight}
                          y2={tick.y}
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Y-axis */}
                      <line
                        x1={paddingLeft}
                        y1={paddingTop}
                        x2={paddingLeft}
                        y2={lineChartHeight - paddingBottom}
                        stroke="rgba(0,224,255,0.5)"
                        strokeWidth="2"
                      />

                      {/* X-axis */}
                      <line
                        x1={paddingLeft}
                        y1={lineChartHeight - paddingBottom}
                        x2={lineChartWidth - paddingRight}
                        y2={lineChartHeight - paddingBottom}
                        stroke="rgba(0,224,255,0.5)"
                        strokeWidth="2"
                      />

                      {/* Y-axis label */}
                      <text
                        x={15}
                        y={30}
                        fill="#00e0ff"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        Price (₹)
                      </text>

                      {/* X-axis label */}
                      <text
                        x={lineChartWidth - 40}
                        y={lineChartHeight - 10}
                        fill="#00e0ff"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        Date
                      </text>

                      {/* Y-axis labels */}
                      {yAxisLabels.map((tick, i) => (
                        <text
                          key={`ylabel-${i}`}
                          x={paddingLeft - 15}
                          y={tick.y + 4}
                          fill="#d0eaff"
                          fontSize="11"
                          textAnchor="end"
                        >
                          ₹{tick.value}
                        </text>
                      ))}

                      {/* X-axis labels */}
                      {xAxisLabels.map((tick, i) => (
                        <text
                          key={`xlabel-${i}`}
                          x={tick.x}
                          y={lineChartHeight - paddingBottom + 25}
                          fill="#d0eaff"
                          fontSize="10"
                          textAnchor="middle"
                        >
                          {tick.date}
                        </text>
                      ))}

                      {/* Line chart */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke="#00e0ff"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data points */}
                      {stock.historicalData.map((item, index) => {
                        const x = paddingLeft + (index / (stock.historicalData.length - 1)) * plotWidth
                        const y = paddingTop + plotHeight - ((item.close - minPrice) / priceRange) * plotHeight
                        return (
                          <circle
                            key={`point-${index}`}
                            cx={x}
                            cy={y}
                            r="3.5"
                            fill="#00e0ff"
                          />
                        )
                      })}
                    </svg>
                  </div>

                  {/* CANDLESTICK CHART */}
                  <div>
                    <h4 style={chartSubHeading}>Candlestick Chart - OHLC Data</h4>
                    <svg width={candleChartWidth} height={candleChartHeight} style={{ background: 'rgba(15,32,39,0.8)', borderRadius: 8, border: '1px solid rgba(0,224,255,0.2)' }}>
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4, 5].map((i) => {
                        const value = candleMin + (candleRange * i / 5)
                        const y = candlePaddingTop + candlePlotHeight - ((value - candleMin) / candleRange) * candlePlotHeight
                        return (
                          <line
                            key={`cgrid-${i}`}
                            x1={candlePaddingLeft}
                            y1={y}
                            x2={candleChartWidth - candlePaddingRight}
                            y2={y}
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="1"
                          />
                        )
                      })}

                      {/* Y-axis */}
                      <line
                        x1={candlePaddingLeft}
                        y1={candlePaddingTop}
                        x2={candlePaddingLeft}
                        y2={candleChartHeight - candlePaddingBottom}
                        stroke="rgba(0,224,255,0.5)"
                        strokeWidth="2"
                      />

                      {/* X-axis */}
                      <line
                        x1={candlePaddingLeft}
                        y1={candleChartHeight - candlePaddingBottom}
                        x2={candleChartWidth - candlePaddingRight}
                        y2={candleChartHeight - candlePaddingBottom}
                        stroke="rgba(0,224,255,0.5)"
                        strokeWidth="2"
                      />

                      {/* Y-axis labels */}
                      {[0, 1, 2, 3, 4, 5].map((i) => {
                        const value = candleMin + (candleRange * i / 5)
                        const y = candlePaddingTop + candlePlotHeight - ((value - candleMin) / candleRange) * candlePlotHeight
                        return (
                          <text
                            key={`cyaxis-${i}`}
                            x={candlePaddingLeft - 15}
                            y={y + 4}
                            fill="#d0eaff"
                            fontSize="11"
                            textAnchor="end"
                          >
                            ₹{value.toFixed(0)}
                          </text>
                        )
                      })}

                      {/* Candlesticks */}
                      {stock.historicalData.map((item, index) => {
                        const x = candlePaddingLeft + (index / (stock.historicalData.length - 1)) * candlePlotWidth
                        const wickX = x + 4
                        const bodyWidth = Math.max(candlePlotWidth / (stock.historicalData.length * 2), 4)

                        const wickTop = candlePaddingTop + candlePlotHeight - ((item.high - candleMin) / candleRange) * candlePlotHeight
                        const wickBottom = candlePaddingTop + candlePlotHeight - ((item.low - candleMin) / candleRange) * candlePlotHeight
                        const openY = candlePaddingTop + candlePlotHeight - ((item.open - candleMin) / candleRange) * candlePlotHeight
                        const closeY = candlePaddingTop + candlePlotHeight - ((item.close - candleMin) / candleRange) * candlePlotHeight
                        const bodyTop = Math.min(openY, closeY)
                        const bodyHeight = Math.max(Math.abs(openY - closeY), 1.5)
                        const bullish = item.close >= item.open

                        return (
                          <g key={`candle-${index}`}>
                            <line
                              x1={wickX}
                              y1={wickTop}
                              x2={wickX}
                              y2={wickBottom}
                              stroke={bullish ? '#34d399' : '#f87171'}
                              strokeWidth="1"
                            />
                            <rect
                              x={x - bodyWidth / 2}
                              y={bodyTop}
                              width={bodyWidth}
                              height={bodyHeight}
                              fill={bullish ? '#34d399' : '#f87171'}
                              opacity="0.85"
                            />
                          </g>
                        )
                      })}
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const sectionWrap = {
  marginTop: 4,
  padding: '28px 24px',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)'
}

const sectionTitle = {
  margin: 0,
  color: '#00e0ff',
  fontSize: 24,
  textAlign: 'center'
}

const sectionSubtitle = {
  marginTop: 8,
  marginBottom: 20,
  textAlign: 'center',
  color: '#cde6fa',
  fontSize: 14
}

const searchWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  maxWidth: 520,
  margin: '0 auto 22px'
}

const searchControlWrap = {
  display: 'flex',
  gap: 10,
  alignItems: 'center'
}

const labelStyle = {
  fontSize: 13,
  color: '#d0eaff',
  fontWeight: 600
}

const searchInput = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.08)',
  color: 'white',
  outline: 'none'
}

const searchButton = {
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid rgba(0,224,255,0.55)',
  background: 'rgba(0,224,255,0.18)',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 600,
  whiteSpace: 'nowrap'
}

const hintStyle = {
  color: '#9fbfdc',
  fontSize: 12
}

const noticeBoxStyle = {
  marginTop: 18,
  padding: '14px 16px',
  borderRadius: 10,
  background: 'linear-gradient(135deg, rgba(0,30,60,0.7), rgba(0,20,50,0.8))',
  border: '1px solid rgba(0,224,255,0.2)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
}

const noticeTitle = {
  fontSize: 13,
  fontWeight: 'bold',
  color: '#00e0ff',
  marginBottom: 10,
  letterSpacing: '0.5px'
}

const noticeListStyle = {
  margin: 0,
  paddingLeft: 20,
  listStyle: 'none'
}

const restrictedItemStyle = {
  fontSize: 12,
  color: '#f87171',
  fontWeight: 600,
  marginBottom: 6,
  letterSpacing: '0.3px'
}

const allowedItemStyle = {
  fontSize: 12,
  color: '#34d399',
  fontWeight: 600,
  letterSpacing: '0.3px'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16,
  marginTop: 20
}

const statusStyle = {
  marginTop: 14,
  color: '#cde6fa',
  textAlign: 'center',
  fontSize: 14
}

const errorStyle = {
  marginTop: 14,
  color: '#fecaca',
  textAlign: 'center',
  fontSize: 14,
  background: 'rgba(153,27,27,0.25)',
  border: '1px solid rgba(248,113,113,0.4)',
  borderRadius: 10,
  padding: '10px 12px'
}

const cardStyle = {
  padding: '16px 14px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(8,17,34,0.55)'
}

const chartSectionWrap = {
  marginTop: 60,
  padding: '35px 30px',
  borderRadius: 16,
  background: 'linear-gradient(135deg, rgba(0,20,40,0.7), rgba(0,10,20,0.8))',
  border: '2px solid rgba(0,224,255,0.15)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.4)'
}

const chartSectionTitle = {
  margin: 0,
  color: '#00e0ff',
  fontSize: 28,
  textAlign: 'left',
  fontWeight: 'bold',
  letterSpacing: '1px',
  marginBottom: '8px'
}

const chartSectionSubtitle = {
  marginTop: 0,
  marginBottom: 35,
  textAlign: 'left',
  color: '#a0d0e8',
  fontSize: 14,
  fontWeight: '500'
}

const chartsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(770px, 1fr))',
  gap: 35
}

const chartCardStyle = {
  padding: '28px',
  borderRadius: 14,
  border: '1px solid rgba(0,224,255,0.25)',
  background: 'linear-gradient(135deg, rgba(20,40,50,0.9), rgba(15,32,39,0.9))',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
}

const chartTitle = {
  margin: '0 0 10px 0',
  color: '#00e0ff',
  fontSize: 18,
  fontWeight: 'bold',
  letterSpacing: '0.5px'
}

const chartSubHeading = {
  margin: '20px 0 12px 0',
  color: '#34d399',
  fontSize: 14,
  fontWeight: 'bold',
  letterSpacing: '0.3px'
}

const chartSubtitle = {
  margin: '0 0 20px 0',
  color: '#a0d0e8',
  fontSize: 13,
  fontWeight: '500'
}
