import { useEffect, useState } from 'react'

const SPLASH_KEY = '_splash_shown'
const SHOW_MS = 2400   // 2.4s 표시
const FADE_MS = 400    // 0.4s 페이드아웃

/** 앱 최초 실행 시 1회 표시되는 스플래시 스크린 */
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), SHOW_MS)
    const t2 = setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, '1')
      onDone()
    }, SHOW_MS + FADE_MS)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #ff6b9d 0%, #d44da8 50%, #c77dff 100%)',
        transition: `opacity ${FADE_MS}ms ease`,
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      {/* ── 로고 SVG ── */}
      <div style={{ marginBottom: 28, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.25))' }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 배경 원 */}
          <circle cx="60" cy="60" r="56" fill="rgba(255,255,255,.15)" />
          <circle cx="60" cy="60" r="46" fill="rgba(255,255,255,.12)" />

          {/* 다이아몬드 반지 상단부 (밴드) */}
          <path
            d="M38 68 Q60 80 82 68"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
          <ellipse cx="60" cy="68" rx="22" ry="5" fill="rgba(255,255,255,.2)" />

          {/* 반지 밴드 세로선 */}
          <path d="M38 68 Q35 80 42 90" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M82 68 Q85 80 78 90" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.85" />
          <path d="M42 90 Q60 98 78 90" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.85" />

          {/* 다이아몬드 보석 */}
          {/* 외곽 */}
          <polygon
            points="60,26 80,44 72,64 48,64 40,44"
            fill="rgba(255,255,255,.95)"
            stroke="rgba(255,255,255,1)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* 상단 facet */}
          <polygon
            points="60,26 80,44 60,40 40,44"
            fill="rgba(255,255,255,.6)"
          />
          {/* 중앙 facet */}
          <polygon
            points="60,40 80,44 72,64 48,64 40,44"
            fill="rgba(255,255,255,.25)"
          />
          {/* 반짝임 */}
          <polygon
            points="60,30 65,40 60,43 55,40"
            fill="rgba(255,255,255,.8)"
          />

          {/* 별 반짝이 */}
          <g opacity="0.9">
            <line x1="90" y1="30" x2="90" y2="38" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <line x1="86" y1="34" x2="94" y2="34" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </g>
          <g opacity="0.7">
            <line x1="28" y1="48" x2="28" y2="54" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="25" y1="51" x2="31" y2="51" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          <circle cx="87" cy="74" r="2" fill="white" opacity="0.7" />
        </svg>
      </div>

      {/* ── 앱 이름 ── */}
      <div style={{
        fontSize: 32,
        fontWeight: 900,
        color: '#fff',
        letterSpacing: '-0.5px',
        textShadow: '0 2px 12px rgba(0,0,0,.2)',
        marginBottom: 10,
      }}>
        결혼딸깍
      </div>

      {/* ── 슬로건 ── */}
      <div style={{
        fontSize: 14,
        fontWeight: 500,
        color: 'rgba(255,255,255,.88)',
        textAlign: 'center',
        lineHeight: 1.7,
        letterSpacing: '0.2px',
        textShadow: '0 1px 6px rgba(0,0,0,.15)',
      }}>
        결혼준비 딸깍,<br />
        예산부터 계획까지 쉽고 편하게
      </div>

      {/* ── 하단 로딩 점 ── */}
      <div style={{ display: 'flex', gap: 6, marginTop: 40 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.7)',
              animation: `splash-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splash-dot {
          0%, 80%, 100% { opacity: 0.35; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}

/** 세션 내 최초 1회만 표시 여부 판단 */
export function shouldShowSplash(): boolean {
  return !sessionStorage.getItem(SPLASH_KEY)
}
