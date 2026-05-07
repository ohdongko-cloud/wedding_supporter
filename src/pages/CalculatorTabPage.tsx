import { useState } from 'react'
import CalculatorPage from './CalculatorPage'
import HouseCalculatorPage from './HouseCalculatorPage'
import HoneymoonPlanPage from './HoneymoonPlanPage'

type CalcTab = 'wedding' | 'house' | 'honeymoon'

const TABS: { key: CalcTab; label: string; emoji: string }[] = [
  { key: 'wedding', label: '결혼비용', emoji: '💒' },
  { key: 'house',   label: '신혼집',   emoji: '🏡' },
  { key: 'honeymoon', label: '신혼여행', emoji: '✈️' },
]

export default function CalculatorTabPage() {
  const [active, setActive] = useState<CalcTab>('wedding')

  return (
    <div>
      {/* ── 상단 계산기 선택 탭 ── */}
      <div style={{
        display: 'flex', gap: 6,
        marginBottom: 'var(--gap-md)',
        background: '#fff',
        borderRadius: 'var(--r-lg)',
        padding: 6,
        border: '1.5px solid var(--pk4)',
        boxShadow: '0 2px 12px rgba(255,107,157,.08)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {TABS.map(tab => {
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              style={{
                flex: 1,
                padding: 'clamp(8px,2.5vw,11px) 4px',
                border: 'none',
                borderRadius: 'clamp(8px,2vw,11px)',
                background: isActive
                  ? 'linear-gradient(135deg, var(--pk), var(--mn))'
                  : 'transparent',
                color: isActive ? '#fff' : 'var(--text2)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all .2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <span style={{ fontSize: 'clamp(18px,5vw,22px)' }}>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── 선택된 계산기 렌더링 (조건부 마운트 — Zustand에 상태 저장됨) ── */}
      {active === 'wedding'   && <CalculatorPage typeOverride="wedding" />}
      {active === 'house'     && <HouseCalculatorPage />}
      {active === 'honeymoon' && <HoneymoonPlanPage />}
    </div>
  )
}
