import { useNavigate } from 'react-router-dom'

interface Props {
  ownerNick: string
  createdAt: string
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const h = d.getHours(), m = d.getMinutes()
  const ampm = h < 12 ? '오전' : '오후'
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${ampm} ${h % 12 || 12}:${String(m).padStart(2, '0')}`
}

export default function ViewModeBanner({ ownerNick, createdAt }: Props) {
  const navigate = useNavigate()
  return (
    <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', padding: '12px 16px', marginBottom: 14, borderRadius: 14, boxShadow: '0 4px 16px rgba(102,126,234,.3)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
        👀 <b>{ownerNick}</b>님의 결혼 준비 현황을 조회 중이에요.
      </div>
      <div style={{ fontSize: 11, opacity: .85, marginBottom: 10 }}>공유된 시점: {fmtDate(createdAt)}</div>
      <button
        onClick={() => navigate('/auth')}
        style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: '1px solid rgba(255,255,255,.4)', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
      >
        수정하려면 로그인하기 →
      </button>
    </div>
  )
}
