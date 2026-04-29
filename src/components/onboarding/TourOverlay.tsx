import { useState, useEffect, useCallback } from 'react'
import { TOUR_STEPS } from '../../data/tourSteps'

interface Props {
  onComplete: () => void
  onSkipWeek?: () => void
}

interface SpotRect { top: number; left: number; width: number; height: number }

const PAD = 12

export default function TourOverlay({ onComplete, onSkipWeek }: Props) {
  const [step, setStep] = useState(0)
  const [spot, setSpot] = useState<SpotRect | null>(null)

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1
  const isFirst = step === 0

  const measure = useCallback(() => {
    if (!current.selector) { setSpot(null); return }
    const el = document.querySelector(current.selector) as HTMLElement | null
    if (!el) { setSpot(null); return }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      const r = el.getBoundingClientRect()
      setSpot({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
    }, 350)
  }, [current.selector])

  useEffect(() => { measure() }, [measure])
  useEffect(() => {
    function onResize() { measure() }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure])

  function next() {
    if (isLast) { onComplete(); return }
    setStep(s => s + 1)
  }
  function prev() { if (!isFirst) setStep(s => s - 1) }

  // Tooltip position: prefer below the spotlight, fall back to above
  function tooltipTop(): number {
    if (!spot) return window.innerHeight / 2 - 100
    const below = spot.top + spot.height + 16
    const tooltipH = 240
    const vph = window.innerHeight
    if (below + tooltipH < vph - 10) return below
    const above = spot.top - tooltipH - 16
    if (above > 10) return above
    // Clamp to bottom of viewport (overlaps element if needed)
    return vph - tooltipH - 10
  }

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    top: tooltipTop(),
    width: 300,
    background: '#fff',
    borderRadius: 18,
    padding: '20px 20px 16px',
    boxShadow: '0 8px 40px rgba(0,0,0,.22)',
    zIndex: 10001,
    textAlign: 'center',
  }

  const spotStyle: React.CSSProperties | undefined = spot ? {
    position: 'fixed',
    top: spot.top,
    left: spot.left,
    width: spot.width,
    height: spot.height,
    borderRadius: 14,
    zIndex: 10000,
    animation: 'tourPulse 1.8s ease-in-out infinite',
    pointerEvents: 'none',
  } : undefined

  return (
    <>
      {/* Dark backdrop — covers everything except spotlight cutout via pointer-events */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', pointerEvents: 'all' }}
        onClick={e => { if (e.target === e.currentTarget) next() }}
      />

      {/* Spotlight hole */}
      {spot && spotStyle && (
        <div style={spotStyle} />
      )}

      {/* White spotlight fill so content is visible */}
      {spot && (
        <div style={{
          position: 'fixed',
          top: spot.top,
          left: spot.left,
          width: spot.width,
          height: spot.height,
          borderRadius: 14,
          zIndex: 10000,
          background: 'transparent',
          boxShadow: 'none',
          pointerEvents: 'none',
          outline: '3px solid rgba(255,107,157,0.8)',
        }} />
      )}

      {/* Tooltip card */}
      <div style={tooltipStyle}>
        <div style={{ fontSize: 13, color: 'var(--pk)', fontWeight: 700, marginBottom: 8 }}>
          {step + 1} / {TOUR_STEPS.length}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, color: 'var(--text)' }}>
          {current.title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 18, whiteSpace: 'pre-line' }}>
          {current.desc}
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 18 : 7,
              height: 7,
              borderRadius: 4,
              background: i === step ? 'var(--pk)' : 'var(--gray2)',
              transition: 'all .25s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {!isFirst && (
            <button onClick={prev} style={{ flex: 1, background: 'var(--gray1)', color: 'var(--text)', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              이전
            </button>
          )}
          <button onClick={next} style={{ flex: 1, background: 'var(--pk)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {isLast ? '시작하기 🎉' : '다음'}
          </button>
        </div>

        {onSkipWeek ? (
          <div style={{ display: 'flex', gap: 12, marginTop: 10, justifyContent: 'center' }}>
            <button onClick={onSkipWeek} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', opacity: .7 }}>
              일주일간 보지 않기
            </button>
            <span style={{ color: 'var(--gray2)', fontSize: 12 }}>|</span>
            <button onClick={onComplete} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', opacity: .7 }}>
              건너뛰기
            </button>
          </div>
        ) : (
          <button onClick={onComplete} style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', opacity: .7 }}>
            투어 건너뛰기
          </button>
        )}
      </div>
    </>
  )
}
