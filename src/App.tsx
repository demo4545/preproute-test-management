import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import ToastProvider from './components/ToastProvider'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TestFormPage from './pages/TestFormPage'
import QuestionsPage from './pages/QuestionsPage'
import PreviewPage from './pages/PreviewPage'
import { useAuthStore } from './store/authStore'

function LoginRoute() {
  const token = useAuthStore((s) => s.token)
  if (token) return <Navigate to="/dashboard" replace />
  return <LoginPage />
}

function FallbackRoute() {
  const token = useAuthStore((s) => s.token)
  return <Navigate to={token ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider />
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tests/new" element={<TestFormPage />} />
            <Route path="/tests/:id/edit" element={<TestFormPage />} />
            <Route path="/tests/:id/questions" element={<QuestionsPage />} />
            <Route path="/tests/:id/preview" element={<PreviewPage />} />
          </Route>
        </Route>
        <Route path="*" element={<FallbackRoute />} />
      </Routes>
    </BrowserRouter>
  )
}
