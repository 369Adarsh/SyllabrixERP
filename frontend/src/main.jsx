import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/index.js'
import App from './App.jsx'

// Wake up the backend immediately on app load so it's ready by the time the
// user fills in credentials (Render free tier spins down after inactivity).
fetch(`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}/health`)
  .catch(() => {});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
