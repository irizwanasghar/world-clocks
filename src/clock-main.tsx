import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClockApp } from './ClockApp'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ClockApp />
  </React.StrictMode>
)
