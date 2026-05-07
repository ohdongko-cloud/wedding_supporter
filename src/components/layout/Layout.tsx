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

// ── 네이티브 / 프리뷰 모드 감지 ────────────────────────────────
// ?native=1  → 프리뷰 모드 ON (localStorage에 저장)
// ?native=0  → 프리뷰 모드 OFF
;(() => {
  const p = new URLSearchParams(window.location.search).get('native')
  if (p === '1') localStorage.setItem('_native_preview', '1')
  else if (p === '0') localStorage.removeItem('_native_preview')
})()

const IS_ACTUAL_NATIVE  = Capacitor.isNativePlatform()
const IS_PREVIEW_NATIVE = !IS_ACTUAL_NATIVE && localStorage.getItem('_native_preview') === '1'
const IS_NATIVE         = IS_ACTUAL_NATIVE || IS_PREVIEW_NATIVE

// 실제 네이티브에만 AdMob 배너 높이 적용 (프리뷰에는 배너 없음)
const BANNER_H = IS_ACTUAL_NATIVE ? 60 : 0

// ── 앱 종료 확인 팝업 ───────────────────────────────────────────
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

// ── 웹 전용 사이드바 네비게이션 항목 ─────────────────────────────
const NAV_ITEMS: ({ path: string; label: string; icon: string; dividerAfter?: boolean })[] = [
  { path: '/', label: '홈', icon: '🏠' },
  { path: '/checklist', label: '전체 일정관리', icon: '✅' },
  { path: '/calc/wedding', label: '결혼식 비용 계산기', icon: '💒' },
  { path: '/honeymoon', label: '신혼여행 관리', icon: '✈️' },
  { path: '/calc/house', label: '신혼집 마련', icon: '🏡', dividerAfter: true },
  { path: '/board', label: '공개 게시판', icon: '📋' },
  { path: '/memo', label: '내 메모장', icon: '📝' },
]

// ── 네이티브 전용 하단 탭바 항목 ─────────────────────────────────
const NATIVE_TABS = [
  { path: '/',          label: '홈',      icon: '🏠' },
  { path: '/checklist', label: '체크리스트', icon: '✅' },
  { path: '/calc',      label: '계산기',   icon: '🧮' },
  { path: '/board',     label: '게시판',   icon: '📋' },
  { path: '/settings',  label: '설정',     icon: '···' },
]

// ── 페이지 제목 ───────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/': '홈',
  '/checklist': '전체 일정관리',
  '/board': '공개 게시판',
  '/memo': '내 메모장',
  '/calc/wedding': '결혼식 비용 계산기',
  '/honeymoon': '신혼여행 관리',
  '/calc/honeymoon': '신혼여행 비용 계산기',
  '/calc/house': '신혼집 마련',
  '/calc': '계산기',
  '/settings': '설정',
  '/admin': '관리자 페이지',
}

/** 네이티브 탭바에서 활성 탭 경로 판별 */
function getActiveNativeTab(pathname: string): string {
  if (pathname.startsWith('/calc'))     return '/calc'
  if (pathname === '/settings' || pathname === '/memo') return '/settings'
  return pathname
}

interface LayoutProps { children: React.ReactNode }

export default function Layout({ children }: LayoutProps) {
  const [sideOpen, setSideOpen]         = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [devRequestOpen, setDevRequestOpen] = useState(false)
  const [unreadCount, setUnreadCount]   = useState(0)
  const [leaveModal, setLeaveModal]     = useState(false)
  const [conflictModal, setConflictModal] = useState(false)
  const [shareModal, setShareModal]     = useState(false)
  const [shareUrl, setShareUrl]         = useState('')
  const [shareLoading, setShareLoading] = useState(false)
  const [partnerModal, setPartnerModal] = useState(false)
  const [exitModal, setExitModal]       = useState(false)
  const pendingPath   = useRef<string | null>(null)
  const locationRef   = useRef<string>('/')

  const location  = useLocation()
  const navigate  = useNavigate()

  useEffect(() => { locationRef.current = location.pathname }, [location.pathname])

  const user          = useAuthStore(s => s.user)
  const userData      = useAuthStore(s => s.userData)
  const isDirty       = useAuthStore(s => s.isDirty)
  const isSaving      = useAuthStore(s => s.isSaving)
  const localUpdatedAt = useAuthStore(s => s.localUpdatedAt)
  const logout        = useAuthStore(s => s.logout)
  const deleteAccount = useAuthStore(s => s.deleteAccount)
  const saveUserData  = useAuthStore(s => s.saveUserData)
  const forceSave     = useAuthStore(s => s.forceSave)
  const forceLoadFromCloud = useAuthStore(s => s.forceLoadFromCloud)

  const isAdmin = user?.nick === 'admin'
  const isGuest = user?.nick === '게스트'
  const title   = PAGE_TITLES[location.pathname] ?? '결혼딸깍'

  // 웹 브라우저 뒤로가기 / 탭 닫기 경고
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !isGuest) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, isGuest])

  // Android 뒤로가기 버튼 처리
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let listener: any
    const setup = async () => {
      listener = await CapApp.addListener('backButton', () => {
        // 웹에서만 사이드바 닫기 (네이티브는 사이드바 없음)
        if (!IS_NATIVE && sideOpen) { setSideOpen(false); return }

        if (isDirty && !isGuest) {
          pendingPath.current = '/'
          setLeaveModal(true)
          return
        }

        if (locationRef.current === '/') {
          setExitModal(true)
        } else {
          navigate('/')
        }
      })
    }
    setup()
    return () => { listener?.remove() }
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

  // ── 네이티브 활성 탭 ────────────────────────────────────────
  const activeNativeTab = getActiveNativeTab(location.pathname)

  // ── 헤더 저장 버튼 공통 ────────────────────────────────────
  const saveBtn = isGuest ? (
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
        color: '#fff', borderRadius: 8,
        padding: 'clamp(4px,1.5vw,5px) clamp(6px,2vw,10px)',
        fontSize: 'var(--fs-sm)', fontWeight: 700,
        cursor: isDirty && !isSaving ? 'pointer' : 'default',
        transition: 'all .2s', whiteSpace: 'nowrap',
      }}
    >
      {isSaving ? '저장 중...' : isDirty ? '💾 저장' : localUpdatedAt ? `✓ ${fmtSavedAt(localUpdatedAt)}` : '저장됨'}
    </button>
  )

  // ══════════════════════════════════════════════════════════════
  // 네이티브: 하단 탭바 레이아웃
  // ══════════════════════════════════════════════════════════════
  if (IS_NATIVE) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* ── 프리뷰 모드 안내 바 (실제 기기에서는 표시 안 됨) ── */}
        {IS_PREVIEW_NATIVE && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
            background: 'rgba(61,26,36,.92)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '6px 12px', fontSize: 11, fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}>
            <span>📱 네이티브 UI 프리뷰 모드</span>
            <button
              onClick={() => {
                localStorage.removeItem('_native_preview')
                window.location.replace('/')
              }}
              style={{
                background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.4)',
                color: '#fff', borderRadius: 5, padding: '2px 8px',
                fontSize: 10, cursor: 'pointer', fontWeight: 700,
              }}
            >
              프리뷰 종료
            </button>
          </div>
        )}
        {/* 공통 모달 */}
        {exitModal      && <ExitConfirmPopup onConfirm={() => CapApp.exitApp()} onClose={() => setExitModal(false)} />}
        {leaveModal     && <LeaveConfirmModal onSave={handleLeaveSave} onDiscard={handleLeaveDiscard} onCancel={handleLeaveCancel} />}
        {conflictModal  && <ConflictModal onOverwrite={handleConflictOverwrite} onLoadServer={handleConflictLoadServer} />}
        {/* 웹 전용 사이드바에서 쓰던 모달 — 네이티브에선 SettingsPage가 직접 관리하므로 없어도 되나,
            헤더 저장/공유 버튼은 남아있으므로 shareModal/partnerModal은 유지 */}
        {shareModal     && <ShareModal shareUrl={shareUrl} onClose={() => setShareModal(false)} />}
        {partnerModal   && user && <PartnerInviteModal nick={user.nick} onClose={() => setPartnerModal(false)} />}
        {devRequestOpen && <DevRequestModal onClose={() => setDevRequestOpen(false)} />}

        {/* 프리뷰 바 높이 보상 스페이서 */}
        {IS_PREVIEW_NATIVE && <div style={{ height: 32 }} />}

        {/* ── 상단 헤더 ── */}
        <header style={{
          position: 'sticky', top: IS_PREVIEW_NATIVE ? 32 : 0, zIndex: 200,
          background: 'linear-gradient(135deg,var(--pk),var(--mn))',
          display: 'flex', alignItems: 'center',
          padding: '0 clamp(10px,3vw,16px)',
          height: 'clamp(48px,12vw,56px)',
          boxShadow: '0 2px 12px rgba(255,107,157,.3)',
        }}>
          {/* 현재 탭 제목 */}
          <span style={{
            flex: 1, color: '#fff',
            fontSize: 'var(--fs-md)', fontWeight: 800,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
          {/* 저장 버튼 + 닉네임 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px,1.5vw,8px)', flexShrink: 0 }}>
            {saveBtn}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'rgba(255,255,255,.85)', fontWeight: 600, maxWidth: 'clamp(50px,15vw,80px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isGuest ? '게스트' : `${user?.nick}${isAdmin ? ' 🔑' : ''}`}
              </div>
            </div>
          </div>
        </header>

        {/* ── 메인 콘텐츠 ── */}
        {/* padding-bottom: AdMob 배너(60px) + 탭바(56px) + 여유(16px) */}
        <main style={{
          maxWidth: 960, margin: '0 auto',
          padding: `clamp(12px,3.5vw,20px) clamp(10px,3vw,16px) ${BANNER_H + 56 + 16}px`,
        }}>
          {children}
        </main>

        {/* ── 하단 탭바 (AdMob 배너 위에 위치) ── */}
        <nav style={{
          position: 'fixed',
          bottom: BANNER_H,           // AdMob 배너 높이만큼 위로
          left: 0, right: 0,
          height: 56,
          background: '#fff',
          borderTop: '1px solid var(--pk4)',
          boxShadow: '0 -4px 20px rgba(255,107,157,.12)',
          display: 'flex',
          zIndex: 500,
        }}>
          {NATIVE_TABS.map(tab => {
            const isActive = activeNativeTab === tab.path
            return (
              <button
                key={tab.path}
                onClick={() => go(tab.path)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  paddingBottom: 4,
                  color: isActive ? 'var(--pk)' : 'var(--gray3)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'color .15s',
                }}
              >
                {/* 활성 탭 상단 인디케이터 */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 0, left: '25%', right: '25%',
                    height: 3, borderRadius: '0 0 3px 3px',
                    background: 'linear-gradient(90deg,var(--pk),var(--mn))',
                  }} />
                )}
                <span style={{
                  fontSize: tab.icon === '···' ? 22 : 'clamp(20px,5.5vw,24px)',
                  letterSpacing: tab.icon === '···' ? '-2px' : 'normal',
                  lineHeight: 1,
                  fontWeight: tab.icon === '···' ? 900 : 'normal',
                }}>
                  {tab.icon}
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: isActive ? 800 : 500,
                  letterSpacing: '-0.2px',
                }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // 웹: 기존 사이드바 레이아웃 (변경 없음)
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {exitModal      && <ExitConfirmPopup onConfirm={() => CapApp.exitApp()} onClose={() => setExitModal(false)} />}
      {deleteConfirm  && <DeleteConfirmPopup nick={user?.nick ?? ''} onConfirm={handleDelete} onClose={() => setDeleteConfirm(false)} />}
      {devRequestOpen && <DevRequestModal onClose={() => setDevRequestOpen(false)} />}
      {leaveModal     && <LeaveConfirmModal onSave={handleLeaveSave} onDiscard={handleLeaveDiscard} onCancel={handleLeaveCancel} />}
      {conflictModal  && <ConflictModal onOverwrite={handleConflictOverwrite} onLoadServer={handleConflictLoadServer} />}
      {shareModal     && <ShareModal shareUrl={shareUrl} onClose={() => setShareModal(false)} />}
      {partnerModal   && user && <PartnerInviteModal nick={user.nick} onClose={() => setPartnerModal(false)} />}

      <header style={{ position: 'sticky', top: 0, zIndex: 200, background: 'linear-gradient(135deg,var(--pk),var(--mn))', display: 'flex', alignItems: 'center', padding: '0 clamp(10px,3vw,16px)', height: 'clamp(48px,12vw,56px)', boxShadow: '0 2px 12px rgba(255,107,157,.3)' }}>
        <button data-tour="menu-button" onClick={() => setSideOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 'clamp(18px,5vw,22px)', cursor: 'pointer', padding: '6px 8px 6px 0', flexShrink: 0 }}>☰</button>
        <span style={{ flex: 1, textAlign: 'center', color: '#fff', fontSize: 'var(--fs-md)', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px,1.5vw,8px)', flexShrink: 0 }}>
          {saveBtn}
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
