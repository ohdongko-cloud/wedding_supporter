import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { DevRequestService } from '../../services/devRequests'
import { AnalyticsService } from '../../services/analytics'
import { useAutoSave } from '../../hooks/useAutoSave'
import DevRequestModal from '../DevRequestModal'

function DeleteConfirmPopup({ nick, onConfirm, onClose }: { nick: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 300, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>초기화 및 삭제</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 6 }}>
          <b style={{ color: 'var(--pk)' }}>{nick}</b> 계정을 삭제하면<br />로그인이 불가능해집니다.
        </div>
        <div style={{ fontSize: 12, color: '#e03060', marginBottom: 18 }}>이 작업은 되돌릴 수 없습니다.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--gray1)', color: 'var(--text)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, background: '#e03060', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>삭제</button>
        </div>
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { path: '/', label: '대시보드', icon: '🏠' },
  { path: '/checklist', label: '결혼 체크리스트', icon: '✅' },
  { path: '/board', label: '꿀팁 정보', icon: '📋' },
  { path: '/memo', label: '나만의 메모장', icon: '📝' },
  { path: '/calc/wedding', label: '결혼식 비용 계산기', icon: '💒' },
  { path: '/honeymoon', label: '신혼여행 계획', icon: '✈️' },
  { path: '/calc/house', label: '신혼집 비용 계산기', icon: '🏡' },
]

const PAGE_TITLES: Record<string, string> = {
  '/': '대시보드',
  '/checklist': '결혼 체크리스트',
  '/board': '꿀팁 정보',
  '/memo': '나만의 메모장',
  '/calc/wedding': '결혼식 비용 계산기',
  '/honeymoon': '신혼여행 계획',
  '/calc/honeymoon': '신혼여행 비용 계산기',
  '/calc/house': '신혼집 비용 계산기',
  '/admin': '관리자 페이지',
}

interface LayoutProps { children: React.ReactNode }

export default function Layout({ children }: LayoutProps) {
  const [sideOpen, setSideOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [devRequestOpen, setDevRequestOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const isDirty = useAuthStore(s => s.isDirty)
  const lastSavedAt = useAuthStore(s => s.lastSavedAt)
  const logout = useAuthStore(s => s.logout)
  const deleteAccount = useAuthStore(s => s.deleteAccount)
  const isAdmin = user?.nick === 'admin'
  const isGuest = user?.nick === '게스트'
  const title = PAGE_TITLES[location.pathname] ?? '딸깍, 결혼비용 계산기'

  useAutoSave()

  useEffect(() => {
    if (isAdmin) setUnreadCount(DevRequestService.getUnreadCount())
  }, [isAdmin, devRequestOpen, sideOpen])

  function go(path: string) {
    AnalyticsService.track(`nav:${path}`)
    navigate(path)
    setSideOpen(false)
  }

  function handleDelete() {
    deleteAccount()
    setDeleteConfirm(false)
    setSideOpen(false)
    navigate('/auth')
  }

  function fmtSavedAt(iso: string) {
    const d = new Date(iso)
    const h = d.getHours(), m = d.getMinutes()
    const ampm = h < 12 ? '오전' : '오후'
    return `${ampm} ${h % 12 || 12}:${String(m).padStart(2, '0')}에 저장됨`
  }

  const saveStatus = isGuest ? null
    : isDirty ? { text: '변경사항 있음', color: 'rgba(255,255,255,.65)' }
    : lastSavedAt ? { text: '저장됨 ✓', color: 'rgba(255,255,255,.9)' }
    : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {deleteConfirm && <DeleteConfirmPopup nick={user?.nick ?? ''} onConfirm={handleDelete} onClose={() => setDeleteConfirm(false)} />}
      {devRequestOpen && <DevRequestModal onClose={() => setDevRequestOpen(false)} />}

      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: 'linear-gradient(135deg,var(--pk),var(--mn))', display: 'flex', alignItems: 'center', padding: '0 16px', height: 56, boxShadow: '0 2px 12px rgba(255,107,157,.3)' }}>
        <button data-tour="menu-button" onClick={() => setSideOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: '6px 8px 6px 0' }}>☰</button>
        <span style={{ flex: 1, textAlign: 'center', color: '#fff', fontSize: 16, fontWeight: 800 }}>{title}</span>
        <div style={{ textAlign: 'right', minWidth: 60 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontWeight: 600 }}>
            {user?.nick}{isAdmin && ' 🔑'}
          </div>
          {saveStatus && (
            <div style={{ fontSize: 10, color: saveStatus.color, lineHeight: 1.3 }}>
              {saveStatus.text}
              {!isDirty && lastSavedAt && (
                <div style={{ fontSize: 9, opacity: .8 }}>{fmtSavedAt(lastSavedAt)}</div>
              )}
            </div>
          )}
        </div>
      </header>

      {sideOpen && <div onClick={() => setSideOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.35)' }} />}

      <nav style={{ position: 'fixed', left: sideOpen ? 0 : -280, top: 0, bottom: 0, width: 280, zIndex: 301, background: '#fff', boxShadow: '4px 0 24px rgba(0,0,0,.12)', transition: 'left .28s cubic-bezier(.4,0,.2,1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', padding: '24px 20px 20px', color: '#fff' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{user?.nick}{isAdmin && ' 🔑'}</div>
          <div style={{ fontSize: 12, opacity: .8, marginTop: 4 }}>딸깍, 결혼비용 계산기</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.path} onClick={() => go(item.path)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%', border: 'none', background: location.pathname === item.path ? 'var(--pk5)' : 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: location.pathname === item.path ? 'var(--pk)' : 'var(--text)' }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>{item.label}
            </button>
          ))}
          {isAdmin && (
            <button onClick={() => go('/admin')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%', border: 'none', background: location.pathname === '/admin' ? 'var(--pk5)' : 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: location.pathname === '/admin' ? 'var(--pk)' : 'var(--text)' }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🔧</span>
              관리자 페이지
              {unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#e03060', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{unreadCount}</span>
              )}
            </button>
          )}
          <hr style={{ margin: '6px 16px', border: 'none', borderTop: '1px solid var(--gray2)' }} />
          <button onClick={() => { setSideOpen(false); setDevRequestOpen(true) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--pk)' }}>
            <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>💬</span>개발 요청
          </button>
          <button onClick={() => { logout(); navigate('/auth') }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>
            <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🚪</span>로그아웃
          </button>
          {!isGuest && !isAdmin && (
            <button onClick={() => setDeleteConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#e03060' }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🗑️</span>초기화 및 삭제
            </button>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 60px' }}>{children}</main>
    </div>
  )
}
