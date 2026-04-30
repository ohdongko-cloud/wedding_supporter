import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

document.addEventListener('contextmenu', e => e.preventDefault())

// Kakao SDK 초기화 (VITE_KAKAO_APP_KEY 환경변수 필요)
declare global { interface Window { Kakao: any } }
const kakaoKey = import.meta.env.VITE_KAKAO_APP_KEY as string | undefined
if (kakaoKey && window.Kakao) {
  try {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(kakaoKey)
      console.log('[Kakao] SDK initialized ✓')
    }
  } catch (e) {
    console.error('[Kakao] init failed:', e)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)