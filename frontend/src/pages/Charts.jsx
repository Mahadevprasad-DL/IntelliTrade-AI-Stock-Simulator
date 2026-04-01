import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Charts(){
  const nav = useNavigate();
  useEffect(()=>{ const t = setTimeout(()=>nav('/'), 120); return ()=>clearTimeout(t); },[]);
  return (
    <div style={{padding:40}}>
      <h2>Charts</h2>
      <p>Placeholder for stock charts and indicators. Redirecting...</p>
    </div>
  )
}
