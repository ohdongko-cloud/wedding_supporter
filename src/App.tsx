import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { useAuthStore, seedAdminUser } from './stores/authStore'
import AuthPage from './pages/AuthPage'
import Layout from './components/layout/Layout'
import SplashScreen, { shouldShowSplash } from './components/SplashScreen'
import DashboardPage from './pages/DashboardPage'
import ChecklistPage from './pages/ChecklistPage'
import CalculatorPage from './pages/CalculatorPage'
import CalculatorTabPage from './pages/CalculatorTabPage'
import HouseCalculatorPage from './pages/HouseCalculatorPage'
import HoneymoonPlanPage from './pages/HoneymoonPlanPage'
import BoardPage from './pages/BoardPage'
import MemoPage from './pages/MemoPage'
import SettingsPage from './pages/SettingsPage'
import AdminPage from './pages/AdminPage'
import SharedViewPage from './pages/SharedViewPage'
import PrivacyPage from './pages/PrivacyPage'
import DeleteAccountPage from './pages/DeleteAccountPage'

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user || user.nick !== 'admin') return <Navigate to='/' replace />
  return <>{children}</>
}

function AppFallback({ error }: { error: Error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center', background: '#fff5f7' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😵</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#3d1a24', marginBottom: 8 }}>앗, 오류가 발생했어요</div>
      <div style={{ fontSize: 13, color: '#7a4a57', marginBottom: 24, lineHeight: 1.6 }}>
        개발자에게 자동으로 오류가 전송됐습니다.<br />
        앱을 다시 시작해주세요.
      </div>
      <div style={{ background: '#fef0f3', borderRadius: 10, padding: '10px 16px', fontSize: 11, color: '#c9a0ac', maxWidth: 320, wordBreak: 'break-all', marginBottom: 24 }}>
        {error.message}
      </div>
      <button
        onClick={() => window.location.replace('/')}
        style={{ background: '#ff6b9d', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
      >
        홈으로 돌아가기
      </button>
    </div>
  )
}

export default function App() {
  const user = useAuthStore(s => s.user)
  const [showSplash, setShowSplash] = useState(shouldShowSplash)

  useEffect(() => { seedAdminUser() }, [])

  return (
    <Sentry.ErrorBoundary fallback={({ error }) => <AppFallback error={error as Error} />} showDialog={false}>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
    <Routes>
      <Route path='/auth' element={(user && user.nick !== '게스트') ? <Navigate to='/' replace /> : <AuthPage />} />
      <Route path='/view/:shareToken' element={<SharedViewPage />} />
      <Route path='/privacy' element={<PrivacyPage />} />
      <Route path='/delete-account' element={<DeleteAccountPage />} />
      <Route path='/*' element={
          <Layout>
            <Routes>
              <Route path='/' element={<DashboardPage />} />
              <Route path='/checklist' element={<ChecklistPage />} />

              {/* ── 네이티브 통합 계산기 탭 ── */}
              <Route path='/calc' element={<CalculatorTabPage />} />

              {/* ── 기존 개별 계산기 라우트 (웹 사이드바 + 딥링크 호환) ── */}
              <Route path='/honeymoon' element={<HoneymoonPlanPage />} />
              <Route path='/calc/house' element={<HouseCalculatorPage />} />
              <Route path='/calc/:type' element={<CalculatorPage />} />

              <Route path='/board' element={<BoardPage />} />
              <Route path='/memo' element={<MemoPage />} />

              {/* ── 네이티브 설정 탭 ── */}
              <Route path='/settings' element={<SettingsPage />} />

              <Route path='/admin' element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </Layout>
      } />
    </Routes>
    </Sentry.ErrorBoundary>
  )
}
