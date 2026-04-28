import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const NAV_ITEMS = [
  { path: '/', label: '메인 페이지', icon: '🏠' },
  { path: '/checklist', label: '결혼 체크리스트', icon: '✅' },
  { path: '/board', label: '꿀팁 정보', icon: '📋' },
  { path: '/memo', label: '나만의 메모장', icon: '📝' },
  { path: '/calc/wedding', label: '결혼식 비용 계산기', icon: '💒' },
  { path: '/calc/honeymoon', label: '신혼여행 비용 계산기', icon: '✈️' },
  { path: '/calc/house', label: '신혼집 비용 계산기', icon: '🏡' },
]
const PAGE_TITLES: Record<string, string> = {
  '/': '메인 페이지', '/checklist': '결혼 체크리스트', '/board': '꿀팁 정보',
  '/memo': '나만의 메모장', '/calc/wedding': '결혼식 비용 계산기',
  '/calc/honeymoon': '신혼여행 비용 계산기', '/calc/house': '신혼집 비용 계산기',
}
interface LayoutProps { children: React.ReactNode }
export default function Layout({ children }: LayoutProps) {
  const [sideOpen, setSideOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const title = PAGE_TITLES[location.pathname] ?? '나만의 결혼 서포터'
  function go(path: string) { navigate(path); setSideOpen(false) }
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{ position:'sticky', top:0, zIndex:200, background:'linear-gradient(135deg,var(--pk),var(--mn))', display:'flex', alignItems:'center', padding:'0 16px', height:56, boxShadow:'0 2px 12px rgba(255,107,157,.3)' }}>
        <button onClick={() => setSideOpen(true)} style={{ background:'none', border:'none', color:'#fff', fontSize:22, cursor:'pointer', padding:'6px 8px 6px 0' }}>☰</button>
        <span style={{ flex:1, textAlign:'center', color:'#fff', fontSize:16, fontWeight:800 }}>{title}</span>
        <span style={{ fontSize:12, color:'rgba(255,255,255,.85)', fontWeight:600 }}>{user?.nick}</span>
      </header>
      {sideOpen && <div onClick={() => setSideOpen(false)} style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,.35)' }} />}
      <nav style={{ position:'fixed', left:sideOpen?0:-280, top:0, bottom:0, width:280, zIndex:301, background:'#fff', boxShadow:'4px 0 24px rgba(0,0,0,.12)', transition:'left .28s cubic-bezier(.4,0,.2,1)', display:'flex', flexDirection:'column' }}>
        <div style={{ background:'linear-gradient(135deg,var(--pk),var(--mn))', padding:'24px 20px 20px', color:'#fff' }}>
          <div style={{ fontSize:20, fontWeight:800 }}>{user?.nick}</div>
          <div style={{ fontSize:12, opacity:.8, marginTop:4 }}>나만의 결혼 서포터</div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'10px 0' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.path} onClick={() => go(item.path)} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 20px', width:'100%', border:'none', background: location.pathname===item.path?'var(--pk5)':'none', textAlign:'left', cursor:'pointer', fontSize:14, fontWeight:600, color:location.pathname===item.path?'var(--pk)':'var(--text)' }}>
              <span style={{ fontSize:18, width:24, textAlign:'center' }}>{item.icon}</span>{item.label}
            </button>
          ))}
          <hr style={{ margin:'6px 16px', border:'none', borderTop:'1px solid var(--gray2)' }} />
          <button onClick={() => { logout(); navigate('/auth') }} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 20px', width:'100%', border:'none', background:'none', textAlign:'left', cursor:'pointer', fontSize:14, fontWeight:600, color:'var(--text2)' }}>
            <span style={{ fontSize:18, width:24, textAlign:'center' }}>🚪</span>로그아웃
          </button>
        </div>
      </nav>
      <main style={{ maxWidth:960, margin:'0 auto', padding:'20px 16px 60px' }}>{children}</main>
    </div>
  )
}