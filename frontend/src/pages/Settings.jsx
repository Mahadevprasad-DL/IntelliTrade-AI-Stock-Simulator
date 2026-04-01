import React, { useEffect, useState } from 'react'
import { clearUpstoxSettings, getUpstoxQuote, getUpstoxSettings, saveUpstoxSettings } from '../utils/upstoxApi.jsx'

function Settings({ onBack }) {
  const [upstoxApiKey, setUpstoxApiKey] = useState('')
  const [upstoxApiSecret, setUpstoxApiSecret] = useState('')
  const [upstoxAccessToken, setUpstoxAccessToken] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const settings = getUpstoxSettings()
    setUpstoxApiKey(settings.apiKey)
    setUpstoxApiSecret(settings.apiSecret)
    setUpstoxAccessToken(settings.accessToken || import.meta.env.VITE_UPSTOX_ACCESS_TOKEN || '')
  }, [])

  const validate = () => {
    setMessage('')
    if (!upstoxAccessToken.trim()) {
      setMessage('Upstox access token is required')
      return false
    }
    if (upstoxAccessToken.trim().length < 24) {
      setMessage('Token looks too short. Please paste a valid Upstox token.')
      return false
    }
    return true
  }

  const testConnection = async () => {
    if (!validate()) return

    setLoading(true)
    setMessage('')
    try {
      saveUpstoxSettings({
        apiKey: upstoxApiKey,
        apiSecret: upstoxApiSecret,
        accessToken: upstoxAccessToken,
      })

      const quote = await getUpstoxQuote('RELIANCE.BSE')
      if (quote.price > 0) {
        setMessage('Connection successful. Upstox token is valid.')
      } else {
        setMessage('Connected to Upstox, but quote payload was empty.')
      }
    } catch (err) {
      setMessage(err?.message || 'Network error while testing Upstox API.')
    } finally {
      setLoading(false)
    }
  }

  const saveAndClose = () => {
    if (!validate()) return

    saveUpstoxSettings({
      apiKey: upstoxApiKey,
      apiSecret: upstoxApiSecret,
      accessToken: upstoxAccessToken,
    })
    setMessage('Saved successfully.')
    setTimeout(() => onBack(), 900)
  }

  const clearKey = () => {
    clearUpstoxSettings()
    setUpstoxApiKey('')
    setUpstoxApiSecret('')
    setUpstoxAccessToken('')
    setMessage('Cleared saved Upstox credentials.')
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Upstox API Settings</h1>
          <button onClick={onBack} style={backButtonStyle}>Back</button>
        </div>

        <div style={bigCardStyle}>
          <h2 style={cardTitleStyle}>API Configuration</h2>
          <p style={cardSubtitleStyle}>Save your Upstox API credentials and token for live market data.</p>

          <div style={groupStyle}>
            <label style={labelStyle}>Upstox API Key</label>
            <input
              type="text"
              value={upstoxApiKey}
              onChange={(e) => setUpstoxApiKey(e.target.value)}
              style={inputStyle}
              placeholder="Enter Upstox API Key"
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Upstox API Secret</label>
            <input
              type="text"
              value={upstoxApiSecret}
              onChange={(e) => setUpstoxApiSecret(e.target.value)}
              style={inputStyle}
              placeholder="Enter Upstox API Secret"
            />
          </div>

          <div style={groupStyle}>
            <label style={labelStyle}>Upstox Access Token</label>
            <input
              type="text"
              value={upstoxAccessToken}
              onChange={(e) => setUpstoxAccessToken(e.target.value)}
              style={inputStyle}
              placeholder="Enter your Upstox access token"
            />
          </div>

          {message && <div style={messageStyle}>{message}</div>}

          <div style={buttonRowStyle}>
            <button disabled={loading} onClick={testConnection} style={testButtonStyle}>
              {loading ? 'Testing...' : 'Test Connection'}
            </button>
            <button disabled={loading} onClick={saveAndClose} style={saveButtonStyle}>Save and Close</button>
            <button disabled={loading} onClick={clearKey} style={clearButtonStyle}>Clear</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  padding: '34px 20px 60px',
  background: 'linear-gradient(180deg, #0b132b 0%, #12263f 100%)',
  color: '#e2e8f0'
}

const containerStyle = {
  maxWidth: 980,
  margin: '0 auto'
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20
}

const titleStyle = {
  margin: 0,
  color: '#22d3ee',
  fontSize: 34,
  fontWeight: 800
}

const backButtonStyle = {
  padding: '12px 18px',
  borderRadius: 10,
  border: '1px solid #38bdf8',
  background: 'rgba(56,189,248,0.12)',
  color: '#e0f2fe',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 15
}

const bigCardStyle = {
  padding: 34,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(15, 23, 42, 0.78)',
  minHeight: 440
}

const cardTitleStyle = {
  margin: 0,
  marginBottom: 8,
  color: '#7dd3fc',
  fontSize: 28,
  fontWeight: 800
}

const cardSubtitleStyle = {
  margin: 0,
  marginBottom: 26,
  color: '#bfdbfe',
  fontSize: 15
}

const groupStyle = {
  marginBottom: 20
}

const labelStyle = {
  display: 'block',
  marginBottom: 10,
  color: '#93c5fd',
  fontSize: 16,
  fontWeight: 600
}

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(2,6,23,0.55)',
  color: '#fff',
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box'
}

const messageStyle = {
  marginBottom: 20,
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.5)',
  background: 'rgba(30,41,59,0.6)',
  color: '#e2e8f0',
  fontSize: 14
}

const buttonRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 12
}

const testButtonStyle = {
  padding: '13px 14px',
  borderRadius: 10,
  border: '1px solid #38bdf8',
  background: 'rgba(56,189,248,0.15)',
  color: '#e0f2fe',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 14
}

const saveButtonStyle = {
  padding: '13px 14px',
  borderRadius: 10,
  border: '1px solid #22c55e',
  background: 'rgba(34,197,94,0.15)',
  color: '#bbf7d0',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 14
}

const clearButtonStyle = {
  padding: '13px 14px',
  borderRadius: 10,
  border: '1px solid #ef4444',
  background: 'rgba(239,68,68,0.15)',
  color: '#fecaca',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 14
}

export default Settings
