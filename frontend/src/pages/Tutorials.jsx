import React, { useState } from 'react'
import { Play, ExternalLink } from 'lucide-react'

function Tutorials({ user }) {
  const [activeTab, setActiveTab] = useState('basic')

  const getLevelLabel = (levelKey) => {
    if (levelKey === 'basic') return 'Beginner'
    if (levelKey === 'medium') return 'Modern/Medium'
    return 'Master'
  }

  const getVideoParagraphs = (tutorial, levelKey) => {
    const levelLabel = getLevelLabel(levelKey)

    return [
      `${tutorial.title} is a ${levelLabel} level lesson focused on practical stock market learning. This video explains the core concept step-by-step so users can understand the topic clearly before moving to advanced strategies.`,
      `In this session, the trainer breaks down the important parts of the topic with real market-style examples. You can use these ideas while analyzing stocks, planning entries and exits, and improving your confidence during trading decisions.`,
      `After finishing this video, users should review the key points and apply them in paper trading or virtual trading practice. Rewatching difficult parts and taking short notes will help convert this knowledge into consistent trading skills.`
    ]
  }

  const tutorials = {
    basic: [
      {
        id: 1,
        title: 'Stock Market Basics 101',
        description: 'Learn the fundamentals of stock market investing. This tutorial covers what stocks are, how they work, and why people invest in them.',
        image: 'https://img.youtube.com/vi/p7HKvqRI_Bo/hqdefault.jpg',
        youtubeLink: 'https://www.youtube.com/watch?v=p7HKvqRI_Bo',
        duration: '12:45'
      },
      {
        id: 2,
        title: 'How to Read Stock Charts',
        description: 'Master the art of reading stock charts. Understand candlestick patterns, support and resistance levels, and basic technical analysis.',
        image: 'https://img.youtube.com/vi/J-ntsk7Dsd0/hqdefault.jpg',
        youtubeLink: 'https://www.youtube.com/watch?v=J-ntsk7Dsd0',
        duration: '14:20'
      },
      {
        id: 3,
        title: 'Getting Started with Trading',
        description: 'Your first steps in the trading world. Learn how to open a trading account, deposit funds, and place your first trade safely.',
        image: 'https://img.youtube.com/vi/xHU5MHuUSKI/hqdefault.jpg',
        youtubeLink: 'https://www.youtube.com/watch?v=xHU5MHuUSKI',
        duration: '16:30'
      },
      {
        id: 4,
        title: 'Understanding Risk Management',
        description: 'Learn how to protect your capital and manage risk. Discover position sizing, stop-loss orders, and risk-reward ratios.',
        image: 'https://img.youtube.com/vi/s7KApswForA/hqdefault.jpg',
        youtubeLink: 'https://www.youtube.com/watch?v=s7KApswForA',
        duration: '11:15'
      }
    ],
    medium: [
      {
        id: 5,
        title: 'Intermediate Trading Strategies',
        description: 'Explore popular trading strategies like swing trading, day trading, and position trading. Learn when and how to use each strategy.',
        image: 'https://img.youtube.com/vi/bbjRGgA2_L8/hqdefault.jpg',
        youtubeLink: 'https://www.youtube.com/watch?v=bbjRGgA2_L8',
        duration: '18:45'
      },
      {
        id: 6,
        title: 'Technical Analysis Deep Dive',
        description: 'Master technical indicators like RSI, MACD, Bollinger Bands, and moving averages. Learn how to combine them for better trading decisions.',
        image: 'https://img.youtube.com/vi/vb8A19_o7kg/hqdefault.jpg',
        youtubeLink: 'https://www.youtube.com/watch?v=vb8A19_o7kg',
        duration: '22:10'
      },
      {
        id: 7,
        title: 'Fundamental Analysis Guide',
        description: 'Understand how to analyze company financial statements. Learn about P/E ratios, earnings growth, and how to pick fundamentally strong stocks.',
        image: 'https://img.youtube.com/vi/8rUc0MaMzik/hqdefault.jpg',
        youtubeLink: 'https://www.youtube.com/watch?v=8rUc0MaMzik',
        duration: '20:30'
      },
      {
        id: 8,
        title: 'Portfolio Management Strategies',
        description: 'Learn how to build and manage a diversified portfolio. Understand asset allocation, rebalancing, and portfolio optimization techniques.',
        image: 'https://img.youtube.com/vi/NM7DXtxqJS0/hqdefault.jpg',
        youtubeLink: 'https://www.youtube.com/shorts/NM7DXtxqJS0',
        duration: '17:25'
      }
    ],
    master: [
      {
        id: 9,
        title: 'Advanced Options Trading',
        description: 'Master options strategies including call spreads, put spreads, iron condors, and straddles. Learn Greeks and volatility trading.',
        image: 'https://img.youtube.com/vi/dIxRYvFUlOM/hqdefault.jpg',
        youtubeLink: 'https://www.youtube.com/watch?v=dIxRYvFUlOM',
        duration: '25:40'
      },
      {
        id: 10,
        title: 'Algorithmic & Quantitative Trading',
        description: 'Learn how to build algorithmic trading systems. Understand backtesting, optimization, and how to automate your trading strategy.',
        image: 'https://img.youtube.com/vi/EeSrQdab0s0/hqdefault.jpg',
        youtubeLink: 'https://www.youtube.com/watch?v=EeSrQdab0s0',
        duration: '27:15'
      },
      {
        id: 11,
        title: 'Market Microstructure & Execution',
        description: 'Understand high-frequency trading, order types, and advanced execution strategies. Learn how professionals execute large trades.',
        image: 'https://img.youtube.com/vi/gQ1YVZ9Mh5M/hqdefault.jpg',
        youtubeLink: 'https://www.youtube.com/watch?v=gQ1YVZ9Mh5M',
        duration: '23:55'
      },
      {
        id: 12,
        title: 'Trading Psychology & Risk Management',
        description: 'Master the psychological aspects of trading. Learn emotional control, managing losses, and developing a winning mindset.',
        image: 'https://img.youtube.com/vi/Be2GCdGSZg0/hqdefault.jpg',
        youtubeLink: 'https://www.youtube.com/watch?v=Be2GCdGSZg0',
        duration: '19:30'
      } 
    ]
  }

  const tabs = [
    { key: 'basic', label: 'Basic', icon: '📚' },
    { key: 'medium', label: 'Modern/Medium', icon: '📈' },
    { key: 'master', label: 'Master', icon: '🚀' }
  ]

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>📚 Trading Tutorials</h1>
          <p style={subtitleStyle}>Learn trading from beginner to advanced level</p>
        </div>

        {/* Tabs */}
        <div style={tabsContainerStyle}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...tabButtonStyle,
                ...(activeTab === tab.key ? tabActiveStyle : {})
              }}
            >
              <span style={{ fontSize: '20px', marginRight: '8px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tutorial Cards Grid */}
        <div style={gridStyle}>
          {tutorials[activeTab].map((tutorial) => (
            <div key={tutorial.id} style={cardStyle}>
              {/* Thumbnail */}
              <div style={thumbnailContainerStyle}>
                <img 
                  src={tutorial.image} 
                  alt={tutorial.title}
                  style={thumbnailImageStyle}
                />
                <div style={playButtonOverlayStyle}>
                  <Play size={36} color="white" fill="white" />
                </div>
                <div style={durationBadgeStyle}>{tutorial.duration}</div>
              </div>

              {/* Content */}
              <div style={cardContentStyle}>
                <h3 style={cardTitleStyle}>{tutorial.title}</h3>
                <p style={cardDescriptionStyle}>{tutorial.description}</p>

                {/* Learn More Button */}
                <a
                  href={tutorial.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={learnMoreButtonStyle}
                >
                  <ExternalLink size={16} />
                  Watch on YouTube
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Vertical Video Content Section */}
        <div style={verticalSectionStyle}>
          <h2 style={verticalSectionTitleStyle}>Video Content in Words</h2>
          <p style={verticalSectionSubtitleStyle}>
            Detailed 3-paragraph explanation for each video in {getLevelLabel(activeTab)} level.
          </p>

          <div style={verticalListStyle}>
            {tutorials[activeTab].map((tutorial) => {
              const paragraphs = getVideoParagraphs(tutorial, activeTab)

              return (
                <div key={`details-${tutorial.id}`} style={verticalCardStyle}>
                  <div style={verticalCardHeaderStyle}>
                    <h3 style={verticalCardTitleStyle}>{tutorial.title}</h3>
                    <span style={verticalLevelTagStyle}>{getLevelLabel(activeTab)}</span>
                  </div>

                  <p style={verticalParagraphStyle}>{paragraphs[0]}</p>
                  <p style={verticalParagraphStyle}>{paragraphs[1]}</p>
                  <p style={verticalParagraphStyle}>{paragraphs[2]}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Info Section */}
        <div style={infoSectionStyle}>
          <div style={infoCardStyle}>
            <div style={infoIconStyle}>✅</div>
            <h4 style={infoTitleStyle}>Progressive Learning</h4>
            <p>Start with basics and gradually advance to master-level strategies</p>
          </div>
          <div style={infoCardStyle}>
            <div style={infoIconStyle}>🎓</div>
            <h4 style={infoTitleStyle}>Expert Content</h4>
            <p>Learn from professional traders and market analysts</p>
          </div>
          <div style={infoCardStyle}>
            <div style={infoIconStyle}>⏰</div>
            <h4 style={infoTitleStyle}>Learn at Your Pace</h4>
            <p>Watch tutorials anytime, anyplace at your own convenience</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  padding: '36px 20px 60px',
  background: 'linear-gradient(180deg, #0b132b 0%, #12263f 100%)',
  color: '#e2e8f0',
  overflowX: 'hidden'
}

const containerStyle = {
  maxWidth: 1400,
  margin: '0 auto',
  width: '100%',
  padding: '0 10px',
  boxSizing: 'border-box'
}

const headerStyle = {
  textAlign: 'center',
  marginBottom: '50px'
}

const titleStyle = {
  margin: 0,
  fontSize: 48,
  fontWeight: 800,
  color: '#22d3ee',
  marginBottom: 12
}

const subtitleStyle = {
  fontSize: 18,
  color: '#bfdbfe',
  margin: 0
}

const tabsContainerStyle = {
  display: 'flex',
  gap: 12,
  justifyContent: 'center',
  marginBottom: 48,
  flexWrap: 'wrap'
}

const tabButtonStyle = {
  padding: '12px 24px',
  borderRadius: 8,
  border: '2px solid rgba(255,255,255,0.2)',
  background: 'rgba(15, 23, 42, 0.5)',
  color: '#cbd5e1',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  whiteSpace: 'nowrap'
}

const tabActiveStyle = {
  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  borderColor: '#06b6d4',
  color: 'white',
  boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 20,
  marginBottom: 60,
  width: '100%',
  padding: '0 4px',
  boxSizing: 'border-box',
  alignItems: 'stretch'
}

const cardStyle = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(15, 23, 42, 0.72)',
  overflow: 'hidden',
  transition: 'all 0.4s ease',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  height: '100%'
}

const thumbnailContainerStyle = {
  position: 'relative',
  width: '100%',
  paddingBottom: '56.25%',
  background: '#000',
  overflow: 'hidden'
}

const thumbnailImageStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover'
}

const playButtonOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.4)',
  opacity: 0,
  transition: 'opacity 0.3s ease'
}

const durationBadgeStyle = {
  position: 'absolute',
  bottom: 12,
  right: 12,
  padding: '6px 12px',
  background: 'rgba(0,0,0,0.7)',
  color: 'white',
  fontSize: 12,
  fontWeight: 700,
  borderRadius: 4
}

const cardContentStyle = {
  padding: 18,
  display: 'flex',
  flexDirection: 'column',
  flex: 1
}

const cardTitleStyle = {
  margin: '0 0 10px 0',
  fontSize: 16,
  fontWeight: 700,
  color: '#22d3ee',
  lineHeight: 1.3
}

const cardDescriptionStyle = {
  margin: '0 0 16px 0',
  fontSize: 13,
  color: '#cbd5e1',
  lineHeight: 1.5,
  flex: 1
}

const learnMoreButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #06b6d4',
  background: 'rgba(6, 182, 212, 0.15)',
  color: '#06b6d4',
  textDecoration: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 13,
  transition: 'all 0.3s ease',
  width: '100%',
  justifyContent: 'center',
  textAlign: 'center',
  boxSizing: 'border-box',
  marginTop: 'auto'
}

const infoSectionStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 24,
  marginTop: 60,
  paddingTop: 40,
  borderTop: '1px solid rgba(255,255,255,0.1)'
}

const verticalSectionStyle = {
  marginTop: 10,
  marginBottom: 48,
  paddingTop: 20,
  borderTop: '1px solid rgba(255,255,255,0.1)'
}

const verticalSectionTitleStyle = {
  margin: '0 0 8px 0',
  fontSize: 28,
  fontWeight: 800,
  color: '#67e8f9'
}

const verticalSectionSubtitleStyle = {
  margin: '0 0 18px 0',
  color: '#bfdbfe',
  fontSize: 14
}

const verticalListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14
}

const verticalCardStyle = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(15, 23, 42, 0.72)',
  padding: 18
}

const verticalCardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  marginBottom: 10,
  flexWrap: 'wrap'
}

const verticalCardTitleStyle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: '#22d3ee'
}

const verticalLevelTagStyle = {
  padding: '4px 10px',
  borderRadius: 999,
  border: '1px solid rgba(103, 232, 249, 0.6)',
  background: 'rgba(6, 182, 212, 0.12)',
  color: '#67e8f9',
  fontSize: 12,
  fontWeight: 700
}

const verticalParagraphStyle = {
  margin: '0 0 10px 0',
  color: '#cbd5e1',
  lineHeight: 1.65,
  fontSize: 14
}

const infoCardStyle = {
  textAlign: 'center',
  padding: 24,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(15, 23, 42, 0.5)'
}

const infoIconStyle = {
  fontSize: 40,
  marginBottom: 12
}

const infoTitleStyle = {
  margin: '0 0 8px 0',
  fontSize: 18,
  fontWeight: 700,
  color: '#22d3ee'
}

export default Tutorials
