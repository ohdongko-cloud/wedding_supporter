import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import AuthPage from './pages/AuthPage'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import ChecklistPage from './pages/ChecklistPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to='/auth' replace />
  return <>{children}</>
}

export default function App() {
  const user = useAuthStore(s => s.user)
  return (
    <Routes>
      <Route path='/auth' element={user ? <Navigate to='/' replace /> : <AuthPage />} />
      <Route path='/*' element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path='/' element={<DashboardPage />} />
              <Route path='/checklist' element={<ChecklistPage />} />
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}