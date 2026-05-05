import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useAuthStore } from '../../stores/authStore'
import { DevRequestService } from '../../services/devRequests'
import { AnalyticsService } from '../../services/analytics'
import { ShareService } from '../../services/shareService'
import DevRequestModal from '../DevRequestModal'
import LeaveConfirmModal from '../LeaveConfirmModal'
import ConflictModal from '../ConflictModal'
import ShareModal from '../ShareModal'
import PartnerInviteModal from '../PartnerInviteModal'

function ExitConfirmPopup({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 280, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📱</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10, color: 'var(--text)' }}>앱을 종료하시겠습니까?</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--gray1)', color: 'var(--text)', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>취소</button>
          <button onClick={onConfirm} style={{ flex: 1, background: 'linear-gradient(135deg,var(--pk),var(--mn))', color: '#fff', border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>종료</button>
        </div>
      </div>
    </div>
  )
}

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

const NAV_ITEMS: ({ path: string; label: string; icon: string; dividerAfter?: boolean })[] = [
  { path: '/', label: '홈', icon: '🏠' },
  { path: '/checklist', label: '전체 일정관리', icon: '✅' },
  { path: '/calc/wedding', label: '결혼식 비용 계산기', icon: '💒' },
  { path: '/honeymoon', label: '신혼여행 관리', icon: '✈️' },
  { path: '/calc/house', label: '신혼집 마련', icon: '🏡', dividerAfter: true },
  { path: '/board', label: '공개 게시판', icon: '📋' },
  { path: '/memo', label: '내 메모장', icon: '📝' },
]

const PAGE_TITLES: Record<string, string> = {
  '/': '홈',
  '/checklist': '전체 일정관리',
  '/board': '공개 게시판',
  '/memo': '내 메모장',
  '/calc/wedding': '결혼식 비용 계산기',
  '/honeymoon': '신혼여행 관리',
  '/calc/honeymoon': '신혼여행 비용 계산기',
  '/calc/house': '신혼집 마련',
  '/admin': '관리자 페이지',
}

interface LayoutProps { children: React.ReactNode }

export default function Layout({ children }: LayoutProps) {
  const [sideOpen, setSideOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [devRequestOpen, setDevRequestOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [leaveModal, setLeaveModal] = useState(false)
  const [conflictModal, setConflictModal] = useState(false)
  const [shareModal, setShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [shareLoading, setShareLoading] = useState(false)
  const [partnerModal, setPartnerModal] = useState(false)
  const [exitModal, setExitModal] = useState(false)
  const pendingPath = useRef<string | null>(null)
  const locationRef = useRef<string>('/')   // 항상 최신 경로를 추적

  const location = useLocation()
  const navigate = useNavigate()

  // location 변경 시 ref 동기화
  useEffect(() => { locationRef.current = location.pathname }, [location.pathname])
  const user = useAuthStore(s => s.user)
  const userData = useAuthStore(s => s.userData)
  const isDirty = useAuthStore(s => s.isDirty)
  const isSaving = useAuthStore(s => s.isSaving)
  const localUpdatedAt = useAuthStore(s => s.localUpdatedAt)
  const logout = useAuthStore(s => s.logout)
  const deleteAccount = useAuthStore(s => s.deleteAccount)
  const saveUserData = useAuthStore(s => s.saveUserData)
  const forceSave = useAuthStore(s => s.forceSave)
  const forceLoadFromCloud = useAuthStore(s => s.forceLoadFromCloud)

  const isAdmin = user?.nick === 'admin'
  const isGuest = user?.nick === '게스트'
  const title = PAGE_TITLES[location.pathname] ?? '결혼딸깍'

  // 웹 브라우저 뒤로가기/탭닫기 경고
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !isGuest) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, isGuest])

  // Android 뒤로가기 버튼 처리
  // - canGoBack(WebView 히스토리)은 SPA에서 신뢰할 수 없으므로 사용 안 함
  // - locationRef로 현재 React Router 경로를 추적해 판단
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let listener: any
    const setup = async () => {
      listener = await CapApp.addListener('backButton', () => {
        // 사이드 메뉴 열려있으면 닫기
        if (sideOpen) { setSideOpen(false); return }

        // 변경사항 있으면 저장 다이얼로그
        if (isDirty && !isGuest) {
          pendingPath.current = '/'
          setLeaveModal(true)
          return
        }

        // 홈이면 종료 확인 팝업, 그 외 탭은 홈으로 이동
        if (locationRef.current === '/') {
          setExitModal(true)
        } else {
          navigate('/')
        }
      })
    }
    setup()
    return () => { listener?.remove() }
  // sideOpen도 의존성에 포함 — 메뉴 열림 상태를 핸들러가 즉시 참조
  }, [isDirty, isGuest, sideOpen, navigate])

  useEffect(() => {
    if (isAdmin) setUnreadCount(DevRequestService.getUnreadCount())
  }, [isAdmin, devRequestOpen, sideOpen])

  function go(path: string) {
    if (isDirty && !isGuest) {
      pendingPath.current = path
      setSideOpen(false)
      setLeaveModal(true)
      return
    }
    AnalyticsService.track(`nav:${path}`)
    navigate(path)
    setSideOpen(false)
  }

  async function handleSave() {
    if (isGuest || !userData) return
    const result = await saveUserData()
    if (result === 'conflict') setConflictModal(true)
  }

  async function handleLeaveSave() {
    setLeaveModal(false)
    await forceSave()
    if (pendingPath.current) {
      AnalyticsService.track(`nav:${pendingPath.current}`)
      navigate(pendingPath.current)
      pendingPath.current = null
    }
  }

  function handleLeaveDiscard() {
    setLeaveModal(false)
    if (pendingPath.current) {
      AnalyticsService.track(`nav:${pendingPath.current}`)
      navigate(pendingPath.current)
      pendingPath.current = null
    }
  }

  function handleLeaveCancel() {
    setLeaveModal(false)
    pendingPath.current = null
  }

  async function handleConflictOverwrite() {
    setConflictModal(false)
    await forceSave()
  }

  async function handleConflictLoadServer() {
    setConflictModal(false)
    await forceLoadFromCloud()
  }

  async function handleShare() {
    if (!user || !userData || isGuest) return
    setShareLoading(true)
    setSideOpen(false)
    const token = await ShareService.createShareLink(user.nick, userData)
    setShareLoading(false)
    if (token) {
      setShareUrl(`${window.location.origin}/view/${token}`)
      setShareModal(true)
    }
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {exitModal && <ExitConfirmPopup onConfirm={() => CapApp.exitApp()} onClose={() => setExitModal(false)} />}
      {deleteConfirm && <DeleteConfirmPopup nick={user?.nick ?? ''} onConfirm={handleDelete} onClose={() => setDeleteConfirm(false)} />}
      {devRequestOpen && <DevRequestModal onClose={() => setDevRequestOpen(false)} />}
      {leaveModal && <LeaveConfirmModal onSave={handleLeaveSave} onDiscard={handleLeaveDiscard} onCancel={handleLeaveCancel} />}
      {conflictModal && <ConflictModal onOverwrite={handleConflictOverwrite} onLoadServer={handleConflictLoadServer} />}
      {shareModal && <ShareModal shareUrl={shareUrl} onClose={() => setShareModal(false)} />}
      {partnerModal && user && <PartnerInviteModal nick={user.nick} onClose={() => setPartnerModal(false)} />}

      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: 'linear-gradient(135deg,var(--pk),var(--mn))', display: 'flex', alignItems: 'center', padding: '0 clamp(10px,3vw,16px)', height: 'clamp(48px,12vw,56px)', boxShadow: '0 2px 12px rgba(255,107,157,.3)' }}>
        <button data-tour="menu-button" onClick={() => setSideOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 'clamp(18px,5vw,22px)', cursor: 'pointer', padding: '6px 8px 6px 0', flexShrink: 0 }}>☰</button>
        <span style={{ flex: 1, textAlign: 'center', color: '#fff', fontSize: 'var(--fs-md)', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px,1.5vw,8px)', flexShrink: 0 }}>
          {isGuest ? (
            <button
              onClick={() => navigate('/auth')}
              style={{ background: 'rgba(255,255,255,.25)', border: '1px solid rgba(255,255,255,.5)', color: '#fff', borderRadius: 8, padding: 'clamp(4px,1.5vw,6px) clamp(8px,2.5vw,12px)', fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              🔐 로그인
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              style={{
                background: isDirty ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.1)',
                border: `1px solid ${isDirty ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.25)'}`,
                color: '#fff', borderRadius: 8, padding: 'clamp(4px,1.5vw,5px) clamp(6px,2vw,10px)', fontSize: 'var(--fs-sm)', fontWeight: 700,
                cursor: isDirty && !isSaving ? 'pointer' : 'default', transition: 'all .2s', whiteSpace: 'nowrap',
              }}
            >
              {isSaving ? '저장 중...' : isDirty ? '💾 저장' : localUpdatedAt ? `✓ ${fmtSavedAt(localUpdatedAt)}` : '저장됨'}
            </button>
          )}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'rgba(255,255,255,.85)', fontWeight: 600, maxWidth: 'clamp(50px,15vw,80px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isGuest ? '게스트' : `${user?.nick}${isAdmin ? ' 🔑' : ''}`}
            </div>
          </div>
        </div>
      </header>

      {sideOpen && <div onClick={() => setSideOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.35)' }} />}

      <nav style={{ position: 'fixed', left: sideOpen ? 0 : -280, top: 0, bottom: 0, width: 'min(280px, 80vw)', zIndex: 301, background: '#fff', boxShadow: '4px 0 24px rgba(0,0,0,.12)', transition: 'left .28s cubic-bezier(.4,0,.2,1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'linear-gradient(135deg,var(--pk),var(--mn))', padding: 'clamp(18px,5vw,24px) clamp(14px,4vw,20px)', color: '#fff' }}>
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 800 }}>{user?.nick}{isAdmin && ' 🔑'}</div>
          <div style={{ fontSize: 'var(--fs-sm)', opacity: .8, marginTop: 4 }}>결혼딸깍</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          {NAV_ITEMS.map(item => (
            <div key={item.path}>
              <button onClick={() => go(item.path)} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,2.5vw,12px)', padding: 'clamp(11px,3vw,13px) clamp(14px,4vw,20px)', width: '100%', border: 'none', background: location.pathname === item.path ? 'var(--pk5)' : 'none', textAlign: 'left', cursor: 'pointer', fontSize: 'var(--fs-base)', fontWeight: 600, color: location.pathname === item.path ? 'var(--pk)' : 'var(--text)' }}>
                <span style={{ fontSize: 'var(--fs-lg)', width: 24, textAlign: 'center' }}>{item.icon}</span>{item.label}
              </button>
              {item.dividerAfter && <hr style={{ margin: '6px 16px', border: 'none', borderTop: '1px solid var(--gray2)' }} />}
            </div>
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
          {!isGuest && (
            <>
              <button
                onClick={() => { setSideOpen(false); setPartnerModal(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--pk)' }}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>👫</span>
                파트너와 함께 사용하기
              </button>
              <button
                onClick={handleShare}
                disabled={shareLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--pk)' }}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🔗</span>
                {shareLoading ? '링크 생성 중...' : '결과 공유하기'}
              </button>
            </>
          )}
          <button onClick={() => { setSideOpen(false); setDevRequestOpen(true) }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--pk)' }}>
            <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>💬</span>개선 요청
          </button>
          {isGuest ? (
            <button onClick={() => { setSideOpen(false); navigate('/auth') }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'var(--pk)' }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🔐</span>로그인 / 회원가입
            </button>
          ) : (
            <button onClick={() => { logout(); navigate('/auth') }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🚪</span>로그아웃
            </button>
          )}
          {!isGuest && !isAdmin && (
            <button onClick={() => setDeleteConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#e03060' }}>
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>🗑️</span>초기화 및 삭제
            </button>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: 'clamp(12px,3.5vw,20px) clamp(10px,3vw,16px) clamp(70px,18vw,80px)' }}>{children}</main>
    </div>
  )
}
