import React, { useMemo, useState } from 'react'

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'
const CHAT_API_ENDPOINTS = [
  `${BACKEND_BASE_URL}/ai/stock-chat`,
  `${BACKEND_BASE_URL}/api/ai/stock-chat`,
  '/api/ai/stock-chat',
  '/ai/stock-chat'
]

const STOCK_RELATED_KEYWORDS = [
  'stock',
  'share',
  'market',
  'trading',
  'invest',
  'portfolio',
  'nifty',
  'sensex',
  'nasdaq',
  'dow',
  's&p',
  'etf',
  'dividend',
  'broker',
  'ipo',
  'candlestick',
  'support',
  'resistance',
  'rsi',
  'macd',
  'pe ratio',
  'earnings',
  'valuation',
  'aapl',
  'tsla',
  'msft'
]

const FAQ_CARDS = [
  {
    id: 1,
    question: 'What is the safest way to start stock investing as a beginner?',
    answer:
      'Start with large-cap companies or index ETFs, invest a fixed amount monthly (SIP style), and avoid using leverage. Keep a long-term horizon and diversify across sectors instead of putting all money into one stock.'
  },
  {
    id: 2,
    question: 'How do I decide if a stock is overvalued or undervalued?',
    answer:
      'Compare valuation ratios like P/E, P/B, and EV/EBITDA with the company\'s historical average and sector peers. Also check earnings growth, debt, cash flow, and management quality before deciding.'
  },
  {
    id: 3,
    question: 'What is a good stop-loss strategy for swing trading?',
    answer:
      'A practical method is to place stop-loss below a recent support zone or below your setup invalidation level. Risk only 1% to 2% of total capital per trade and maintain a minimum 1:2 risk-reward ratio.'
  },
  {
    id: 4,
    question: 'Which indicators are most useful for trend confirmation?',
    answer:
      'Use a combination of moving averages (20/50/200), RSI for momentum, and MACD for crossover confirmation. Avoid relying on a single indicator; combine trend, volume, and price action.'
  },
  {
    id: 5,
    question: 'How can I build a balanced stock portfolio?',
    answer:
      'Split allocation across sectors (IT, banking, pharma, FMCG, etc.), include both growth and defensive names, and rebalance every quarter or half-year. Keep a small cash reserve for opportunities.'
  },
  {
    id: 6,
    question: 'Should I buy based on news headlines alone?',
    answer:
      'No. News creates volatility, but decision quality improves when you verify fundamentals, trend structure, and risk-reward. Use news as context, not as the only entry trigger.'
  }
]

function isStockRelated(text) {
  const msg = text.toLowerCase().trim()
  if (!msg) return false

  const keywordMatch = STOCK_RELATED_KEYWORDS.some((k) => msg.includes(k))
  const tickerLikeMatch = /\b[A-Z]{2,5}\b/.test(text)
  return keywordMatch || tickerLikeMatch
}

async function askGeminiStockAssistant(userMessage) {
  let lastError = 'AI service error (404)'

  for (const endpoint of CHAT_API_ENDPOINTS) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage })
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      lastError = data?.message || `AI service error (${response.status})`
      continue
    }

    return data?.reply || 'Sorry, I could not generate an answer right now.'
  }

  throw new Error(lastError)
}

export default function AIGuide() {
  const [openCards, setOpenCards] = useState({})
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hi! I can answer only stock-related questions such as stocks, trading, risk management, indicators, and portfolio planning.'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const quickPrompts = [
    'Top stock names for long-term investment?',
    'How to set stop-loss for swing trade?',
    'Best indicators for trend confirmation?',
    'How to build a diversified portfolio?'
  ]

  const totalExpanded = useMemo(
    () => Object.values(openCards).filter(Boolean).length,
    [openCards]
  )

  const toggleCard = (id) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    const question = input.trim()
    if (!question || isLoading) return

    const userMsg = { id: Date.now(), role: 'user', text: question }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    if (!isStockRelated(question)) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: 'Sorry, I am available only for stock-related questions.'
        }
      ])
      return
    }

    try {
      setIsLoading(true)
      const aiText = await askGeminiStockAssistant(question)
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, role: 'assistant', text: aiText }
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 3,
          role: 'assistant',
          text:
            err.message ||
            'Sorry, something went wrong. Please try again in a moment.'
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>AI Stock Guide</h1>
          <p style={subtitleStyle}>
            Explore common stock questions and chat with a stock-only AI assistant.
          </p>
        </div>

        <div style={cardsHeaderRowStyle}>
          <h2 style={sectionTitleStyle}>Popular Stock Questions</h2>
          <span style={expandedBadgeStyle}>Expanded: {totalExpanded}</span>
        </div>

        <div style={cardsStackStyle}>
          {FAQ_CARDS.map((item) => {
            const expanded = !!openCards[item.id]
            return (
              <div key={item.id} style={cardStyle}>
                <button
                  type='button'
                  onClick={() => toggleCard(item.id)}
                  style={cardQuestionButtonStyle}
                >
                  <div style={cardLeftStyle}>
                    <span style={cardNumberStyle}>{String(item.id).padStart(2, '0')}</span>
                    <span style={cardQuestionTextStyle}>{item.question}</span>
                  </div>
                  <span style={cardActionStyle}>{expanded ? 'Hide' : 'Show'}</span>
                </button>

                {expanded && <div style={cardAnswerStyle}>{item.answer}</div>}
              </div>
            )
          })}
        </div>

        <div style={chatSectionStyle}>
          <div style={chatHeaderStyle}>
            <div style={chatHeaderLeftStyle}>
              <div style={aiAvatarStyle}>AI</div>
              <div>
                <h2 style={{ ...sectionTitleStyle, marginBottom: 6 }}>Stock Chatbot</h2>
                <p style={chatNoteStyle}>
                  This chatbot responds only to stock-related topics. Other questions get
                  a polite rejection.
                </p>
              </div>
            </div>

            <div style={tickerRailStyle}>
              <span style={tickerChipStyle}>NIFTY 50</span>
              <span style={tickerChipStyle}>SENSEX</span>
              <span style={tickerChipStyle}>NASDAQ</span>
            </div>
          </div>

          <div style={quickPromptWrapStyle}>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type='button'
                style={quickPromptButtonStyle}
                onClick={() => setInput(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div style={chatBoxStyle}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  ...messageRowStyle,
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    ...bubbleStyle,
                    ...(m.role === 'user' ? userBubbleStyle : botBubbleStyle)
                  }}
                >
                  <div style={bubbleMetaStyle}>
                    {m.role === 'user' ? 'YOU' : 'AI STOCK ASSISTANT'}
                  </div>
                  {m.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={messageRowStyle}>
                <div style={{ ...bubbleStyle, ...botBubbleStyle }}>
                  <div style={bubbleMetaStyle}>AI STOCK ASSISTANT</div>
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} style={chatFormStyle}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask about stocks, trading, indicators, risk, portfolio...'
              style={chatInputStyle}
            />
            <button type='submit' disabled={isLoading} style={sendButtonStyle}>
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const pageStyle = {
  width: '100%',
  minHeight: '100%',
  padding: '30px 24px 44px',
  boxSizing: 'border-box',
  background:
    'radial-gradient(circle at 20% 10%, rgba(34,211,238,0.12), transparent 32%), radial-gradient(circle at 85% 80%, rgba(56,189,248,0.1), transparent 35%)'
}

const containerStyle = {
  maxWidth: 1200,
  margin: '0 auto'
}

const headerStyle = {
  textAlign: 'center',
  marginBottom: 26
}

const titleStyle = {
  margin: 0,
  color: '#22d3ee',
  fontSize: 42,
  fontWeight: 800
}

const subtitleStyle = {
  marginTop: 10,
  marginBottom: 0,
  color: '#cde7ff',
  fontSize: 16
}

const cardsHeaderRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 12
}

const sectionTitleStyle = {
  margin: 0,
  fontSize: 26,
  color: '#e6f6ff'
}

const expandedBadgeStyle = {
  padding: '7px 12px',
  borderRadius: 999,
  border: '1px solid rgba(34,211,238,0.45)',
  background: 'rgba(34,211,238,0.15)',
  color: '#8be9ff',
  fontSize: 13,
  fontWeight: 700
}

const cardsStackStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  marginBottom: 30
}

const cardStyle = {
  borderRadius: 14,
  border: '1px solid rgba(120, 160, 255, 0.22)',
  background: 'rgba(10, 25, 48, 0.76)',
  overflow: 'hidden',
  boxShadow: '0 8px 24px rgba(0,0,0,0.22)'
}

const cardQuestionButtonStyle = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
  padding: '16px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10
}

const cardLeftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0
}

const cardNumberStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 34,
  height: 34,
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  color: '#7ad8f2',
  background: 'rgba(27, 155, 191, 0.18)',
  border: '1px solid rgba(74, 198, 230, 0.35)'
}

const cardQuestionTextStyle = {
  color: '#eaf4ff',
  fontSize: 15,
  lineHeight: 1.5,
  fontWeight: 600
}

const cardActionStyle = {
  fontSize: 12,
  fontWeight: 700,
  padding: '6px 10px',
  borderRadius: 999,
  background: 'rgba(34,211,238,0.2)',
  color: '#8be9ff',
  whiteSpace: 'nowrap'
}

const cardAnswerStyle = {
  borderTop: '1px solid rgba(255,255,255,0.12)',
  padding: '14px 16px 16px',
  color: '#c8dbef',
  fontSize: 14,
  lineHeight: 1.65,
  background: 'rgba(5, 17, 36, 0.55)'
}

const chatSectionStyle = {
  borderRadius: 16,
  border: '1px solid rgba(120, 160, 255, 0.22)',
  background: 'rgba(11, 30, 55, 0.8)',
  padding: 16
}

const chatHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 14
}

const chatHeaderLeftStyle = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start'
}

const aiAvatarStyle = {
  width: 44,
  height: 44,
  borderRadius: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  color: '#c9f8ff',
  background: 'linear-gradient(140deg, #1fa6d5, #115ad0)',
  boxShadow: '0 10px 20px rgba(20,116,220,0.35)'
}

const tickerRailStyle = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap'
}

const tickerChipStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#8ce7ff',
  border: '1px solid rgba(53, 201, 237, 0.4)',
  background: 'rgba(7, 34, 61, 0.6)',
  borderRadius: 999,
  padding: '6px 10px'
}

const chatNoteStyle = {
  marginTop: 0,
  marginBottom: 0,
  color: '#9dc1e8',
  fontSize: 14
}

const quickPromptWrapStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 12
}

const quickPromptButtonStyle = {
  border: '1px solid rgba(120, 190, 230, 0.35)',
  background: 'rgba(8, 33, 58, 0.66)',
  color: '#c2e9ff',
  borderRadius: 999,
  fontSize: 12,
  padding: '7px 11px',
  cursor: 'pointer'
}

const chatBoxStyle = {
  maxHeight: 360,
  overflowY: 'auto',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)',
  padding: 12,
  background: 'rgba(0, 8, 22, 0.62)',
  marginBottom: 12
}

const messageRowStyle = {
  display: 'flex',
  marginBottom: 10
}

const bubbleStyle = {
  maxWidth: '80%',
  padding: '10px 12px',
  borderRadius: 10,
  lineHeight: 1.5,
  fontSize: 14,
  whiteSpace: 'pre-wrap'
}

const bubbleMetaStyle = {
  fontSize: 10,
  letterSpacing: 0.8,
  fontWeight: 700,
  opacity: 0.8,
  marginBottom: 5
}

const userBubbleStyle = {
  background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
  color: '#fff'
}

const botBubbleStyle = {
  background: 'rgba(234,244,255,0.1)',
  color: '#d4e7ff',
  border: '1px solid rgba(148, 185, 255, 0.25)'
}

const chatFormStyle = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap'
}

const chatInputStyle = {
  flex: 1,
  minWidth: 230,
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(2, 13, 30, 0.8)',
  color: 'white',
  fontSize: 14,
  padding: '11px 12px',
  outline: 'none'
}

const sendButtonStyle = {
  border: 'none',
  borderRadius: 10,
  padding: '11px 16px',
  fontWeight: 700,
  cursor: 'pointer',
  color: 'white',
  background: 'linear-gradient(135deg, #0891b2, #2563eb)'
}
