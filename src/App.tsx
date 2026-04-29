import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, seedAdminUser } from './stores/authStore'
import { BoardService } from './services/boardService'
import AuthPage from './pages/AuthPage'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import ChecklistPage from './pages/ChecklistPage'
import CalculatorPage from './pages/CalculatorPage'
import HouseCalculatorPage from './pages/HouseCalculatorPage'
import HoneymoonPlanPage from './pages/HoneymoonPlanPage'
import BoardPage from './pages/BoardPage'
import MemoPage from './pages/MemoPage'
import AdminPage from './pages/AdminPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to='/auth' replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to='/auth' replace />
  if (user.nick !== 'admin') return <Navigate to='/' replace />
  return <>{children}</>
}

export default function App() {
  const user = useAuthStore(s => s.user)

  useEffect(() => { seedAdminUser(); BoardService.seedNotice() }, [])

  return (
    <Routes>
      <Route path='/auth' element={user ? <Navigate to='/' replace /> : <AuthPage />} />
      <Route path='/*' element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path='/' element={<DashboardPage />} />
              <Route path='/checklist' element={<ChecklistPage />} />
              <Route path='/honeymoon' element={<HoneymoonPlanPage />} />
              <Route path='/calc/house' element={<HouseCalculatorPage />} />
              <Route path='/calc/:type' element={<CalculatorPage />} />
              <Route path='/board' element={<BoardPage />} />
              <Route path='/memo' element={<MemoPage />} />
              <Route path='/admin' element={<AdminRoute><AdminPage /></AdminRoute>} />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
