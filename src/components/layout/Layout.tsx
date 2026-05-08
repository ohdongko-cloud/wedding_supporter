import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useAuthStore } from '../../stores/authStore'
import LeaveConfirmModal from '../LeaveConfirmModal'
import ConflictModal from '../ConflictModal'
import {
  HomeIcon, ChecklistIcon, CalculatorIcon, BoardIcon, SettingsIcon, RingIcon,
} from '../icons/AppIcons'

// ── ?native=1 / ?native=0 파라미터 처리 (하위호환 유지) ─────────
;(() => {
  const p = new URLSearchParams(window.location.search).get('native')
  if (p === '1') localStorage.setItem('_native_preview', '1')
  else if (p === '0') localStorage.removeItem('_native_preview')
})()

const IS_ACTUAL_NATIVE = Capacitor.isNativePlatform()
// 실제 네이티브에만 AdMob 배너 높이 60px 적용
const BANNER_H = IS_ACTUAL_NATIVE ? 60 : 0

// ── 앱 종료 확인 팝업 ─────────────────────────────────────────────
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

// ── 하단 탭바 항목 ────────────────────────────────────────────────
type TabItem = { path: string; label: string; Icon: React.ComponentType<{ size?: number; active?: boolean }> }
const TABS: TabItem[] = [
  { path: '/',          label: '홈',       Icon: HomeIcon },
  { path: '/checklist', label: '일정관리', Icon: ChecklistIcon },
  { path: '/calc',      label: '계산기',    Icon: CalculatorIcon },
  { path: '/board',     label: '게시판',    Icon: BoardIcon },
  { path: '/settings',  label: '설정',      Icon: SettingsIcon },
]

// ── 페이지 제목 ──────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/':              '홈',
  '/checklist':     '전체 일정관리',
  '/board':         '공개 게시판',
  '/memo':          '내 메모장',
  '/calc/wedding':  '결혼식 비용 계산기',
  '/honeymoon':     '신혼여행 관리',
  '/calc/house':    '신혼집 마련',
  '/calc':          '계산기',
  '/settings':      '설정',
  '/admin':         '관리자 페이지',
}

/** 하단 탭바 활성 탭 경로 판별 */
function getActiveTab(pathname: string): string {
  if (pathname.startsWith('/calc') || pathname === '/honeymoon') return '/calc'
  if (pathname === '/settings' || pathname === '/memo')           return '/settings'
  return pathname
}

interface LayoutProps { children: React.ReactNode }

export default function Layout({ children }: LayoutProps) {
  const [kbOpen, setKbOpen]           = useState(false)   // 키보드 열림 여부
  const [exitModal, setExitModal]     = useState(false)
  const [leaveModal, setLeaveModal]   = useState(false)
  const [conflictModal, setConflictModal] = useState(false)
  const pendingPath  = useRef<string | null>(null)
  const locationRef  = useRef<string>('/')

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => { locationRef.current = location.pathname }, [location.pathname])

  const user           = useAuthStore(s => s.user)
  const userData       = useAuthStore(s => s.userData)
  const isDirty        = useAuthStore(s => s.isDirty)
  const isSaving       = useAuthStore(s => s.isSaving)
  const localUpdatedAt = useAuthStore(s => s.localUpdatedAt)
  const saveUserData   = useAuthStore(s => s.saveUserData)
  const forceSave      = useAuthStore(s => s.forceSave)
  const forceLoadFromCloud = useAuthStore(s => s.forceLoadFromCloud)

  const isGuest = user?.nick === '게스트'
  const isAdmin = user?.nick === 'admin'
  const title   = PAGE_TITLES[location.pathname] ?? '결혼딸깍'

  // ── 키보드 감지: visualViewport 75% 미만이면 키보드 열린 것으로 판단 ──
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const initialH = vv.height
    const onResize = () => {
      const isKb = vv.height / initialH < 0.75
      setKbOpen(isKb)
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  // ── 웹: 탭 닫기 / 새로고침 경고 ──────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !isGuest) { e.preventDefault(); e.returnValue = '' }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, isGuest])

  // ── Android 하드웨어 백버튼 ──────────────────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let listener: any
    const setup = async () => {
      listener = await CapApp.addListener('backButton', () => {
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
  }, [isDirty, isGuest, navigate])

  function go(path: string) {
    if (isDirty && !isGuest) {
      pendingPath.current = path
      setLeaveModal(true)
      return
    }
    navigate(path)
  }

  async function handleSave() {
    if (isGuest || !userData) return
    const result = await saveUserData()
    if (result === 'conflict') setConflictModal(true)
  }

  async function handleLeaveSave() {
    setLeaveModal(false)
    await forceSave()
    if (pendingPath.current) { navigate(pendingPath.current); pendingPath.current = null }
  }
  function handleLeaveDiscard() {
    setLeaveModal(false)
    if (pendingPath.current) { navigate(pendingPath.current); pendingPath.current = null }
  }
  function handleLeaveCancel() {
    setLeaveModal(false)
    pendingPath.current = null
  }
  async function handleConflictOverwrite()  { setConflictModal(false); await forceSave() }
  async function handleConflictLoadServer() { setConflictModal(false); await forceLoadFromCloud() }

  function fmtSavedAt(iso: string) {
    const d = new Date(iso)
    const h = d.getHours(), m = d.getMinutes()
    const ampm = h < 12 ? '오전' : '오후'
    return `${ampm} ${h % 12 || 12}:${String(m).padStart(2, '0')}에 저장됨`
  }

  // ── 헤더 저장 버튼 ────────────────────────────────────────────
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

  const activeTab = getActiveTab(location.pathname)

  // ── 탭바 높이 (safe-area 포함) ─────────────────────────────────
  // bottom: 0 고정 후 paddingBottom으로 BANNER + safe-area 확보
  // → 일부 기종에서 safe-area-inset-bottom > 0 일 때 nav가 떠있는 오류 방지
  const CONTENT_PB = `calc(${BANNER_H + 56 + 16}px + env(safe-area-inset-bottom, 0px))`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── 전역 모달 ── */}
      {exitModal     && <ExitConfirmPopup onConfirm={() => CapApp.exitApp()} onClose={() => setExitModal(false)} />}
      {leaveModal    && <LeaveConfirmModal onSave={handleLeaveSave} onDiscard={handleLeaveDiscard} onCancel={handleLeaveCancel} />}
      {conflictModal && <ConflictModal onOverwrite={handleConflictOverwrite} onLoadServer={handleConflictLoadServer} />}

      {/* ── 상단 헤더 ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'linear-gradient(135deg,var(--pk),var(--mn))',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(10px,3vw,16px)',
        height: 'clamp(48px,12vw,56px)',
        boxShadow: '0 2px 12px rgba(255,107,157,.3)',
      }}>
        {/* 홈(/)에서는 앱 아이콘 + 서비스명, 나머지는 링 아이콘 + 페이지 제목 */}
        <div
          onClick={() => navigate('/')}
          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
        >
          {location.pathname === '/' ? (
            /* 홈 전용: 앱 런처 아이콘 + "결혼딸깍" */
            <>
              <img
                src="/app-icon.webp"
                alt="결혼딸깍"
                style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, objectFit: 'cover' }}
              />
              <span style={{
                color: '#fff',
                fontSize: 'var(--fs-md)', fontWeight: 900,
                whiteSpace: 'nowrap', letterSpacing: '-0.3px',
              }}>
                결혼딸깍
              </span>
            </>
          ) : (
            /* 다른 페이지: 링 SVG 아이콘 + 페이지 제목 */
            <>
              <div style={{ flexShrink: 0, opacity: .9 }}>
                <RingIcon size={18} color="#fff" />
              </div>
              <span style={{
                color: '#fff',
                fontSize: 'var(--fs-md)', fontWeight: 800,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {title}
              </span>
            </>
          )}
        </div>
        {/* 저장 버튼 + 닉네임 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px,1.5vw,8px)', flexShrink: 0 }}>
          {saveBtn}
          <div style={{
            fontSize: 'var(--fs-sm)', color: 'rgba(255,255,255,.85)', fontWeight: 600,
            maxWidth: 'clamp(50px,15vw,80px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isGuest ? '게스트' : `${user?.nick}${isAdmin ? ' 🔑' : ''}`}
          </div>
        </div>
      </header>

      {/* ── 메인 콘텐츠 ── */}
      {/* paddingBottom: AdMob배너 + 탭바 + 여유 + safe-area */}
      <main style={{
        maxWidth: 960, margin: '0 auto',
        padding: `clamp(12px,3.5vw,20px) clamp(10px,3vw,16px) ${CONTENT_PB}`,
      }}>
        {children}
      </main>

      {/* ── 하단 탭바: 키보드 올라오면 숨김 ── */}
      {!kbOpen && (
        <nav style={{
          position: 'fixed',
          bottom: 0,                  // 항상 화면 맨 아래에 고정
          left: 0, right: 0,
          // paddingBottom = AdMob 높이 + safe-area → 제스처 네비/AdMob 기종 모두 대응
          paddingBottom: `calc(${BANNER_H}px + env(safe-area-inset-bottom, 0px))`,
          height: `calc(${BANNER_H + 56}px + env(safe-area-inset-bottom, 0px))`,
          background: '#fff',
          borderTop: '1px solid var(--pk4)',
          boxShadow: '0 -4px 20px rgba(255,107,157,.12)',
          display: 'flex',
          alignItems: 'flex-start',   // 버튼은 패딩 위 56px 영역에 배치
          zIndex: 500,
        }}>
          {TABS.map(({ path, label, Icon }) => {
            const isActive = activeTab === path
            return (
              <button
                key={path}
                onClick={() => go(path)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'none',
                  height: 56,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  paddingBottom: 4,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'opacity .15s',
                }}
              >
                {/* 활성 탭 상단 인디케이터 */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 0, left: '22%', right: '22%',
                    height: 3, borderRadius: '0 0 4px 4px',
                    background: 'linear-gradient(90deg,var(--pk),var(--mn))',
                  }} />
                )}
                <Icon size={23} active={isActive} />
                <span style={{
                  fontSize: 10,
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? 'var(--pk)' : 'var(--gray3)',
                  letterSpacing: '-0.2px',
                }}>
                  {label}
                </span>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}
