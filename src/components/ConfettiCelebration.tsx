import { useEffect, useState } from 'react'

const COLORS = ['#ff6b9d', '#c77dff', '#667eea', '#ffd700', '#ff9f43', '#00d2ff', '#ff4757', '#2ed573']

interface Piece {
  id: number; left: number; delay: number; duration: number
  size: number; color: string; shape: 'circle' | 'rect'; rotate: number
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.8,
    duration: 2.2 + Math.random() * 2,
    size: 6 + Math.random() * 9,
    color: COLORS[i % COLORS.length],
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
    rotate: Math.random() * 360,
  }))
}

interface Props {
  onClose: () => void
}

export default function ConfettiCelebration({ onClose }: Props) {
  const [pieces] = useState(() => makePieces(70))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'confetti-keyframes'
    style.textContent = `
      @keyframes confetti-fall {
        0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
        80%  { opacity: 1; }
        100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
      }
    `
    if (!document.getElementById('confetti-keyframes')) document.head.appendChild(style)
    const t = setTimeout(() => setVisible(false), 3500)
    return () => { clearTimeout(t) }
  }, [])

  if (!visible) return null

  return (
    <>
      {/* Confetti pieces */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 3500, pointerEvents: 'none', overflow: 'hidden' }}>
        {pieces.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              top: -20,
              width: p.size,
              height: p.shape === 'rect' ? p.size * 2 : p.size,
              background: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : 3,
              transform: `rotate(${p.rotate}deg)`,
              animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Celebration modal */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 3600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        onClick={onClose}
      >
        <div
          style={{ background: '#fff', borderRadius: 24, padding: '36px 28px', maxWidth: 320, width: '100%', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,.25)' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: 56, marginBottom: 12, lineHeight: 1 }}>🎊</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>모든 항목 완료!</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 24 }}>
            결혼 준비 체크리스트를<br />모두 완료했어요. 정말 수고하셨어요! 💍<br />
            <span style={{ fontSize: 11, opacity: .75 }}>이제 행복한 결혼식만 남았어요 🥰</span>
          </div>
          <button
            onClick={onClose}
            style={{ width: '100%', background: 'linear-gradient(135deg,var(--pk),var(--mn))', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            닫기 🎉
          </button>
        </div>
      </div>
    </>
  )
}
