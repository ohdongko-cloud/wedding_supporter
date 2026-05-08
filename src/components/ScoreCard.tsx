// src/components/ScoreCard.tsx
import { getScoreLabel } from '../utils/scoreCalc'

interface Props {
  score: number
  yesterdayScore: number | null
  weddingAreaPct: number
  houseAreaPct: number
  honeymoonAreaPct: number
  onShareClick: () => void
}

interface AreaBarProps {
  emoji: string
  label: string
  pct: number
  color: string
}

function AreaBar({ emoji, label, pct, color }: AreaBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 14, flexShrink: 0, width: 20 }}>{emoji}</span>
      <span style={{ fontSize: 12, color: 'var(--text2)', width: 54, flexShrink: 0, fontWeight: 600 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: 'var(--gray1)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 4,
          transition: 'width .6s ease',
        }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', width: 30, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
    </div>
  )
}

export default function ScoreCard({
  score,
  yesterdayScore,
  weddingAreaPct,
  houseAreaPct,
  honeymoonAreaPct,
  onShareClick,
}: Props) {
  const { text: labelText, emoji: labelEmoji } = getScoreLabel(score)

  const delta = yesterdayScore !== null ? score - yesterdayScore : null
  const showDelta = delta !== null && delta !== 0

  return (
    <div style={{
      background: '#fff',
      borderRadius: 'var(--r-lg)',
      border: '1.5px solid var(--pk4)',
      padding: 'clamp(14px,4vw,18px)',
      marginBottom: 'var(--gap-md)',
      boxShadow: '0 4px 20px rgba(255,107,157,.08)',
    }}>
      {/* ── 헤더 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>📊 딸깍 스코어</span>
        {showDelta && (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 20,
            padding: '3px 10px',
            background: delta! > 0 ? '#dcfce7' : '#fee2e2',
            color: delta! > 0 ? '#16a34a' : '#dc2626',
          }}>
            {delta! > 0 ? `↑ ${delta}점 올랐어요` : `↓ ${Math.abs(delta!)}점`}
          </span>
        )}
      </div>

      {/* ── 점수 원형 + 레이블 ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
        {/* 원형 점수 */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--pk), var(--mn))',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(255,107,157,.35)',
        }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,.8)', fontWeight: 600, marginTop: 2 }}>점수</span>
        </div>

        {/* 레이블 + 설명 */}
        <div>
          <div style={{ fontSize: 22, marginBottom: 4 }}>{labelEmoji}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{labelText}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
            체크리스트 40% · 예산 35% · 일정 25%
          </div>
        </div>
      </div>

      {/* ── 구분선 ── */}
      <div style={{ height: 1, background: 'var(--gray1)', marginBottom: 14 }} />

      {/* ── 3개 영역 프로그레스 바 ── */}
      <AreaBar emoji="💍" label="결혼식"   pct={weddingAreaPct}   color="var(--pk)" />
      <AreaBar emoji="🏡" label="신혼집"   pct={houseAreaPct}     color="var(--bl)" />
      <AreaBar emoji="✈️" label="신혼여행" pct={honeymoonAreaPct} color="var(--mn)" />

      {/* ── 공유 버튼 ── */}
      <button
        onClick={onShareClick}
        style={{
          width: '100%', border: 'none', borderRadius: 12,
          padding: '13px 0', marginTop: 6,
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          background: 'linear-gradient(135deg, var(--pk), var(--mn))',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 3px 12px rgba(255,107,157,.3)',
        }}
      >
        📤 이 카드 공유하기
      </button>
    </div>
  )
}
