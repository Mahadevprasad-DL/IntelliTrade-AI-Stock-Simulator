import React, { useEffect, useState } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, ShoppingCart, Trash2 } from 'lucide-react'
import { getUpstoxQuote, normalizeUpstoxSymbol } from '../utils/upstoxApi.jsx'

const DEFAULT_PORTFOLIO_BALANCE = 100000

function TradingSystem({ onOpenSettings }) {
  const [symbolInput, setSymbolInput] = useState('')
  const [selectedSymbol, setSelectedSymbol] = useState('')
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  
  // Portfolio states
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('trading_portfolio')
    return saved ? JSON.parse(saved) : {
      balance: DEFAULT_PORTFOLIO_BALANCE,
      positions: {},
      orderHistory: []
    }
  })

  const [priceHistory, setPriceHistory] = useState([])
  const [buyQuantity, setBuyQuantity] = useState(1)
  const [sellQuantity, setSellQuantity] = useState(1)
  const [tradeTab, setTradeTab] = useState('buy')

  // Save portfolio to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('trading_portfolio', JSON.stringify(portfolio))
  }, [portfolio])

  const normalizeSymbol = (value) => {
    return normalizeUpstoxSymbol(value)
  }

  const fetchQuote = async (symbol) => {
    setLoading(true)
    setError('')
    try {
      const quoteData = await getUpstoxQuote(symbol)
      const parsedPrice = Number(quoteData.price)

      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        throw new Error(`No live quote found for ${symbol}. Make sure the stock symbol is real and valid (e.g., TCS.BSE, INFY.BSE, RELIANCE.BSE).`)
      }

      const currentPrice = parsedPrice
      
      setQuote({
        symbol: quoteData.apiSymbol || symbol,
        open: Number(quoteData.open || 0).toFixed(2),
        high: Number(quoteData.high || 0).toFixed(2),
        low: Number(quoteData.low || 0).toFixed(2),
        price: currentPrice,
        volume: String(quoteData.volume || 0),
        latestTradingDay: quoteData.latestTradingDay || '--',
        previousClose: Number(quoteData.previousClose || 0).toFixed(2),
        change: Number(quoteData.change || 0).toFixed(2),
        changePercent: `${Number(quoteData.changePercent || 0).toFixed(2)}%`
      })

      // Add to price history for chart
      const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      setPriceHistory(prev => [...prev.slice(-19), { time: timestamp, price: currentPrice }])
      setLastUpdated(new Date().toLocaleString())
    } catch (err) {
      setQuote(null)
      setError(err.message || 'Failed to fetch API quote.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedSymbol) {
      fetchQuote(selectedSymbol)
      const interval = setInterval(() => fetchQuote(selectedSymbol), 30000)
      return () => clearInterval(interval)
    }
  }, [selectedSymbol])

  const searchStock = () => {
    const normalized = normalizeSymbol(symbolInput)
    if (!normalized) {
      setError('Please enter a valid stock symbol')
      return
    }
    setSelectedSymbol(normalized)
    setPriceHistory([])
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchStock()
    }
  }

  const handleBuy = () => {
    if (!quote || !buyQuantity || buyQuantity <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    const totalCost = quote.price * buyQuantity
    if (totalCost > portfolio.balance) {
      setError(`Insufficient balance. You have ₹${portfolio.balance.toFixed(2)} but need ₹${totalCost.toFixed(2)}`)
      return
    }

    const newPosition = {
      symbol: selectedSymbol,
      quantity: buyQuantity,
      buyPrice: quote.price,
      timestamp: new Date().toLocaleString()
    }

    setPortfolio(prev => ({
      ...prev,
      balance: prev.balance - totalCost,
      positions: {
        ...prev.positions,
        [selectedSymbol]: (prev.positions[selectedSymbol] || 0) + buyQuantity
      },
      orderHistory: [...prev.orderHistory, { ...newPosition, type: 'BUY' }]
    }))

    setError('')
    setBuyQuantity(1)
  }

  const handleSell = () => {
    if (!quote || !sellQuantity || sellQuantity <= 0) {
      setError('Please enter a valid quantity')
      return
    }

    const holdings = portfolio.positions[selectedSymbol] || 0
    if (sellQuantity > holdings) {
      setError(`You only have ${holdings} shares of ${selectedSymbol}`)
      return
    }

    const totalRevenue = quote.price * sellQuantity
    const newPosition = {
      symbol: selectedSymbol,
      quantity: sellQuantity,
      sellPrice: quote.price,
      timestamp: new Date().toLocaleString()
    }

    setPortfolio(prev => ({
      ...prev,
      balance: prev.balance + totalRevenue,
      positions: {
        ...prev.positions,
        [selectedSymbol]: (prev.positions[selectedSymbol] || 0) - sellQuantity
      },
      orderHistory: [...prev.orderHistory, { ...newPosition, type: 'SELL' }]
    }))

    setError('')
    setSellQuantity(1)
  }

  const handleResetPortfolio = () => {
    if (confirm('Are you sure you want to reset your portfolio to default state?')) {
      setPortfolio({
        balance: DEFAULT_PORTFOLIO_BALANCE,
        positions: {},
        orderHistory: []
      })
      setError('')
    }
  }

  const getCurrentHoldings = () => {
    const holdings = []
    Object.entries(portfolio.positions).forEach(([symbol, qty]) => {
      if (qty > 0) {
        holdings.push({ symbol, quantity: qty })
      }
    })
    return holdings
  }

  const calculatePortfolioValue = () => {
    let value = 0
    Object.entries(portfolio.positions).forEach(([symbol, qty]) => {
      if (qty > 0) {
        // Use current price for selected symbol, estimate for others
        const price = selectedSymbol === symbol && quote ? quote.price : 100
        value += price * qty
      }
    })
    return value
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Trading System</h1>
            <p style={subtitleStyle}>Virtual stock trading with real-time data</p>
          </div>
          <button onClick={onOpenSettings} style={settingsButtonStyle}>Settings</button>
        </div>

        {/* Portfolio Summary */}
        <div style={portfolioSummaryStyle}>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Cash Balance</div>
            <div style={summaryValueStyle}>₹{portfolio.balance.toFixed(2)}</div>
          </div>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Portfolio Value</div>
            <div style={summaryValueStyle}>₹{calculatePortfolioValue().toFixed(2)}</div>
          </div>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Total Value</div>
            <div style={summaryValueStyle}>₹{(portfolio.balance + calculatePortfolioValue()).toFixed(2)}</div>
          </div>
          <button onClick={handleResetPortfolio} style={resetButtonStyle}>
            Reset Portfolio
          </button>
        </div>

        {/* Stock Selection & Trading */}
        <div style={mainTradingStyle}>
          {/* Left: Stock Selection & Chart */}
          <div style={leftPanelStyle}>
            {/* Symbol Selection */}
            <div style={panelStyle}>
              <h3 style={sectionTitleStyle}>Search Stock</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px', marginTop: '-8px' }}>
                Enter a real stock symbol (e.g., TCS, INFY, RELIANCE, SBIN, LT, ITC, etc.)
              </p>
              
              <div style={rowStyle}>
                <input
                  value={symbolInput}
                  onChange={(e) => setSymbolInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter stock symbol (e.g., TCS or TCS.BSE)"
                  style={{...inputStyle, flex: 1}}
                />
                <button onClick={searchStock} style={buttonStyle}>Search</button>
              </div>

              {selectedSymbol && (
                <div style={chipRowStyle}>
                  <div style={chipStyle}>📊 {selectedSymbol}</div>
                  <button onClick={() => fetchQuote(selectedSymbol)} style={refreshButtonStyle}>
                    {loading ? '⏳ Updating...' : '🔄 Refresh'}
                  </button>
                </div>
              )}

              {error && <div style={errorStyle}>{error}</div>}
            </div>

            {/* Price Chart */}
            {quote && priceHistory.length > 0 && (
              <div style={panelStyle}>
                <h3 style={sectionTitleStyle}>Price Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={priceHistory}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #38bdf8' }}
                      formatter={(value) => `₹${value.toFixed(2)}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPrice)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Quote Details */}
            {quote && (
              <div style={panelStyle}>
                <h3 style={sectionTitleStyle}>Stock Details</h3>
                <div style={detailGridStyle}>
                  <div style={detailCardStyle}>
                    <div style={detailLabelStyle}>Current Price</div>
                    <div style={detailValueStyle}>₹{quote.price.toFixed(2)}</div>
                  </div>
                  <div style={detailCardStyle}>
                    <div style={detailLabelStyle}>Open</div>
                    <div style={detailValueStyle}>{quote.open}</div>
                  </div>
                  <div style={detailCardStyle}>
                    <div style={detailLabelStyle}>High</div>
                    <div style={detailValueStyle}>{quote.high}</div>
                  </div>
                  <div style={detailCardStyle}>
                    <div style={detailLabelStyle}>Low</div>
                    <div style={detailValueStyle}>{quote.low}</div>
                  </div>
                  <div style={detailCardStyle}>
                    <div style={detailLabelStyle}>Change</div>
                    <div style={{ ...detailValueStyle, color: quote.change.includes('-') ? '#ff6b6b' : '#51cf66' }}>
                      {quote.change} ({quote.changePercent})
                    </div>
                  </div>
                  <div style={detailCardStyle}>
                    <div style={detailLabelStyle}>Volume</div>
                    <div style={detailValueStyle}>{quote.volume}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Trading Panel */}
          <div style={rightPanelStyle}>
            {/* Buy/Sell Tabs */}
            <div style={panelStyle}>
              <div style={tabHeaderStyle}>
                <button 
                  onClick={() => setTradeTab('buy')}
                  style={{...tabButtonStyle, ...(tradeTab === 'buy' ? tabActiveStyle : {})}}
                >
                  🛒 Buy Stock
                </button>
                <button 
                  onClick={() => setTradeTab('sell')}
                  style={{...tabButtonStyle, ...(tradeTab === 'sell' ? tabActiveStyle : {})}}
                >
                  💰 Sell Stock
                </button>
              </div>

              {tradeTab === 'buy' && (
                <div style={tradeFormStyle}>
                  <h4 style={tradeHeaderStyle}>Buy {selectedSymbol}</h4>
                  {quote && (
                    <>
                      <div style={formRowStyle}>
                        <label style={labelStyle}>Current Price: <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>₹{quote.price.toFixed(2)}</span></label>
                      </div>
                      <div style={formRowStyle}>
                        <label style={labelStyle}>Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          value={buyQuantity}
                          onChange={(e) => setBuyQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          style={numberInputStyle}
                        />
                      </div>
                      <div style={formRowStyle}>
                        <label style={labelStyle}>Total Cost:</label>
                        <div style={{ ...detailValueStyle, color: '#fbbf24' }}>₹{(quote.price * buyQuantity).toFixed(2)}</div>
                      </div>
                      <div style={formRowStyle}>
                        <label style={labelStyle}>Available Balance:</label>
                        <div style={{ ...detailValueStyle, color: portfolio.balance >= (quote.price * buyQuantity) ? '#51cf66' : '#ff6b6b' }}>
                          ₹{portfolio.balance.toFixed(2)}
                        </div>
                      </div>
                      <button onClick={handleBuy} style={buyButtonStyle}>
                        <ShoppingCart size={20} /> Buy Now
                      </button>
                    </>
                  )}
                </div>
              )}

              {tradeTab === 'sell' && (
                <div style={tradeFormStyle}>
                  <h4 style={tradeHeaderStyle}>Sell {selectedSymbol}</h4>
                  {quote && (
                    <>
                      <div style={formRowStyle}>
                        <label style={labelStyle}>Current Price: <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>₹{quote.price.toFixed(2)}</span></label>
                      </div>
                      <div style={formRowStyle}>
                        <label style={labelStyle}>Holdings:</label>
                        <div style={{ ...detailValueStyle, color: '#06b6d4' }}>
                          {portfolio.positions[selectedSymbol] || 0} shares
                        </div>
                      </div>
                      <div style={formRowStyle}>
                        <label style={labelStyle}>Quantity:</label>
                        <input
                          type="number"
                          min="1"
                          max={portfolio.positions[selectedSymbol] || 0}
                          value={sellQuantity}
                          onChange={(e) => setSellQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          style={numberInputStyle}
                        />
                      </div>
                      <div style={formRowStyle}>
                        <label style={labelStyle}>Total Revenue:</label>
                        <div style={{ ...detailValueStyle, color: '#51cf66' }}>₹{(quote.price * sellQuantity).toFixed(2)}</div>
                      </div>
                      <button 
                        onClick={handleSell} 
                        disabled={(portfolio.positions[selectedSymbol] || 0) === 0}
                        style={{...sellButtonStyle, ...(( portfolio.positions[selectedSymbol] || 0) === 0 ? disabledButtonStyle : {})}}
                      >
                        <Wallet size={20} /> Sell Now
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Holdings */}
            <div style={panelStyle}>
              <h3 style={sectionTitleStyle}>Your Holdings</h3>
              {getCurrentHoldings().length === 0 ? (
                <div style={emptyStateStyle}>
                  <p>No holdings yet</p>
                  <p style={{ fontSize: '14px', color: '#94a3b8' }}>Buy stocks to see them here</p>
                </div>
              ) : (
                <div style={holdingsListStyle}>
                  {getCurrentHoldings().map((holding, idx) => (
                    <div key={idx} style={holdingCardStyle}>
                      <div style={holdingSymbolStyle}>{holding.symbol}</div>
                      <div style={holdingQtyStyle}>{holding.quantity} shares</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order History */}
        <div style={panelStyle}>
          <h3 style={sectionTitleStyle}>Recent Orders</h3>
          {portfolio.orderHistory.length === 0 ? (
            <div style={emptyStateStyle}>
              <p>No orders yet</p>
              <p style={{ fontSize: '14px', color: '#94a3b8' }}>Your trading history will appear here</p>
            </div>
          ) : (
            <div style={orderTableStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderStyle}>
                    <th style={tableHeadCellStyle}>Type</th>
                    <th style={tableHeadCellStyle}>Stock</th>
                    <th style={tableHeadCellStyle}>Qty</th>
                    <th style={tableHeadCellStyle}>Price</th>
                    <th style={tableHeadCellStyle}>Amount</th>
                    <th style={tableHeadCellStyle}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.orderHistory.slice().reverse().slice(0, 10).map((order, idx) => (
                    <tr key={idx} style={tableRowStyle}>
                      <td style={{...tableCellStyle, color: order.type === 'BUY' ? '#fbbf24' : '#51cf66', fontWeight: 'bold'}}>
                        {order.type === 'BUY' ? '🛒 BUY' : '💰 SELL'}
                      </td>
                      <td style={tableCellStyle}>{order.symbol}</td>
                      <td style={tableCellStyle}>{order.quantity}</td>
                      <td style={tableCellStyle}>₹{(order.buyPrice || order.sellPrice).toFixed(2)}</td>
                      <td style={{...tableCellStyle, fontWeight: 'bold', color: order.type === 'BUY' ? '#ff6b6b' : '#51cf66'}}>
                        ₹{((order.buyPrice || order.sellPrice) * order.quantity).toFixed(2)}
                      </td>
                      <td style={tableCellStyle}>{order.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  padding: '28px 20px 40px',
  background: 'linear-gradient(180deg, #0b132b 0%, #12263f 100%)',
  color: '#e2e8f0'
}

const containerStyle = {
  maxWidth: 1400,
  margin: '0 auto'
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
  gap: 10
}

const titleStyle = {
  margin: 0,
  color: '#22d3ee',
  fontSize: 44,
  fontWeight: 800
}

const subtitleStyle = {
  marginTop: 6,
  marginBottom: 0,
  color: '#bfdbfe',
  fontSize: 18
}

const settingsButtonStyle = {
  padding: '12px 18px',
  borderRadius: 10,
  border: '1px solid #64748b',
  background: 'rgba(100,116,139,0.2)',
  color: '#cbd5e1',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 16
}

const portfolioSummaryStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
  marginBottom: 24
}

const summaryCardStyle = {
  padding: 16,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(15, 23, 42, 0.72)',
  textAlign: 'center'
}

const summaryLabelStyle = {
  fontSize: 14,
  color: '#94a3b8',
  marginBottom: 8
}

const summaryValueStyle = {
  fontSize: 28,
  fontWeight: 'bold',
  color: '#06b6d4'
}

const resetButtonStyle = {
  padding: '12px 18px',
  borderRadius: 8,
  border: '1px solid #ef4444',
  background: 'rgba(239,68,68,0.15)',
  color: '#fca5a5',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 14,
  transition: 'all 0.3s ease'
}

const mainTradingStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: 16,
  marginBottom: 24
}

const leftPanelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16
}

const rightPanelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16
}

const panelStyle = {
  padding: 18,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(15, 23, 42, 0.72)'
}

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: 12,
  color: '#67e8f9',
  fontSize: 24,
  fontWeight: 700
}

const rowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
  marginBottom: 10
}

const chipRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  alignItems: 'center',
  marginBottom: 0
}

const selectStyle = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(2,6,23,0.5)',
  color: '#fff',
  flex: 1,
  minWidth: 150,
  outline: 'none',
  fontSize: 14
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(2,6,23,0.5)',
  color: '#fff',
  flex: 1,
  minWidth: 150,
  outline: 'none',
  fontSize: 14
}

const numberInputStyle = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(2,6,23,0.5)',
  color: '#fff',
  width: '100%',
  outline: 'none',
  fontSize: 16,
  fontWeight: 'bold'
}

const buttonStyle = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #38bdf8',
  background: 'rgba(56,189,248,0.12)',
  color: '#e0f2fe',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 14,
  whiteSpace: 'nowrap'
}

const refreshButtonStyle = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #38bdf8',
  background: 'rgba(56,189,248,0.12)',
  color: '#e0f2fe',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 14,
  whiteSpace: 'nowrap'
}

const chipStyle = {
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(2,6,23,0.5)',
  color: '#e2e8f0',
  fontSize: 14,
  fontWeight: 600
}

const errorStyle = {
  marginTop: 8,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(248,113,113,0.5)',
  background: 'rgba(127,29,29,0.3)',
  color: '#fecaca',
  fontSize: 14
}

const detailGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 12
}

const detailCardStyle = {
  padding: 12,
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(2, 6, 23, 0.5)'
}

const detailLabelStyle = {
  fontSize: 12,
  color: '#93c5fd',
  marginBottom: 6,
  fontWeight: 600
}

const detailValueStyle = {
  fontSize: 18,
  color: '#f8fafc',
  fontWeight: 700
}

const tabHeaderStyle = {
  display: 'flex',
  gap: 0,
  marginBottom: 16,
  borderBottom: '1px solid rgba(255,255,255,0.1)'
}

const tabButtonStyle = {
  flex: 1,
  padding: '12px 16px',
  border: 'none',
  background: 'transparent',
  color: '#94a3b8',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 14,
  borderBottom: '2px solid transparent',
  transition: 'all 0.3s ease'
}

const tabActiveStyle = {
  color: '#06b6d4',
  borderBottomColor: '#06b6d4'
}

const tradeFormStyle = {
  padding: '12px 0'
}

const tradeHeaderStyle = {
  marginTop: 0,
  marginBottom: 16,
  color: '#22d3ee',
  fontSize: 18,
  fontWeight: 700
}

const formRowStyle = {
  marginBottom: 12,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const labelStyle = {
  fontSize: 14,
  color: '#cbd5e1',
  fontWeight: 600
}

const buyButtonStyle = {
  width: '100%',
  padding: '12px 16px',
  marginTop: 16,
  borderRadius: 8,
  border: '1px solid #fbbf24',
  background: 'rgba(251, 191, 36, 0.15)',
  color: '#fbbf24',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'all 0.3s ease'
}

const sellButtonStyle = {
  width: '100%',
  padding: '12px 16px',
  marginTop: 16,
  borderRadius: 8,
  border: '1px solid #51cf66',
  background: 'rgba(81, 207, 102, 0.15)',
  color: '#51cf66',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'all 0.3s ease'
}

const disabledButtonStyle = {
  opacity: 0.5,
  cursor: 'not-allowed'
}

const emptyStateStyle = {
  textAlign: 'center',
  padding: '20px',
  color: '#94a3b8'
}

const holdingsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8
}

const holdingCardStyle = {
  padding: 12,
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(2, 6, 23, 0.5)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const holdingSymbolStyle = {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#06b6d4'
}

const holdingQtyStyle = {
  fontSize: 14,
  color: '#93c5fd'
}

const orderTableStyle = {
  overflowX: 'auto'
}

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14
}

const tableHeaderStyle = {
  borderBottom: '2px solid rgba(255,255,255,0.2)'
}

const tableHeadCellStyle = {
  padding: '12px 8px',
  textAlign: 'left',
  color: '#67e8f9',
  fontWeight: 700,
  fontSize: 12
}

const tableRowStyle = {
  borderBottom: '1px solid rgba(255,255,255,0.1)',
  transition: 'background 0.2s ease'
}

const tableCellStyle = {
  padding: '10px 8px',
  color: '#cbd5e1'
}

export default TradingSystem
