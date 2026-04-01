import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function VTB(){
  const nav = useNavigate();
  useEffect(()=>{ const t = setTimeout(()=>nav('/'), 120); return ()=>clearTimeout(t); },[]);
  return (
    <div style={{padding:40}}>
      <h2>VTB</h2>
      <p>Placeholder for Voice Trading Bot (VTB). Redirecting...</p>
    </div>
  )
}
