import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App'
import './index.css'

Sentry.init({
  dsn: 'https://c340090a17a70ca383258ba5bfac124c@o4511328057229312.ingest.us.sentry.io/4511328084426752',
  environment: import.meta.env.MODE,           // 'development' | 'production'
  release: '1.3.2',                            // build.gradle versionName과 맞춤
  integrations: [
    Sentry.browserTracingIntegration(),        // 페이지 이동 성능 추적
    Sentry.replayIntegration({                 // 오류 직전 사용자 행동 재현
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: 0.2,   // 성능 추적 20% 샘플링
  replaysOnErrorSampleRate: 1.0,  // 오류 시 100% 리플레이 저장
  sendDefaultPii: false,   // 개인정보(IP 등) 전송 비활성화
})

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