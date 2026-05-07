import { useState } from 'react'
import CalculatorPage from './CalculatorPage'
import HouseCalculatorPage from './HouseCalculatorPage'
import HoneymoonPlanPage from './HoneymoonPlanPage'
import { RingIcon, HouseHeartIcon, PlaneIcon } from '../components/icons/AppIcons'

type CalcTab = 'wedding' | 'house' | 'honeymoon'

const TABS: { key: CalcTab; label: string; Icon: React.ComponentType<{ size?: number; active?: boolean; color?: string }> }[] = [
  { key: 'wedding',   label: '결혼비용',  Icon: RingIcon },
  { key: 'house',     label: '신혼집',    Icon: HouseHeartIcon },
  { key: 'honeymoon', label: '신혼여행',  Icon: PlaneIcon },
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
        {TABS.map(({ key, label, Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              style={{
                flex: 1,
                padding: 'clamp(8px,2.5vw,11px) 4px',
                border: 'none',
                borderRadius: 'clamp(8px,2vw,11px)',
                background: isActive
                  ? 'linear-gradient(135deg, var(--pk), var(--mn))'
                  : 'transparent',
                cursor: 'pointer',
                transition: 'all .2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {/* 활성 탭: 흰색 아이콘 (SVG color prop), 비활성: 그라데이션 아이콘 */}
              {isActive
                ? <Icon size={22} color="white" />
                : <Icon size={22} active={false} />
              }
              <span style={{
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                color: isActive ? '#fff' : 'var(--text2)',
              }}>
                {label}
              </span>
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
