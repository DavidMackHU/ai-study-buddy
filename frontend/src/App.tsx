import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ChatPage } from './pages/ChatPage'
import { UploadPage } from './pages/UploadPage'
import { FlashcardsPage } from './pages/FlashcardsPage'
import { DeckPage } from './pages/DeckPage'
import { SchedulePage } from './pages/SchedulePage'
import { WakeUpScreen } from './components/WakeUpScreen'
import { useServerReady } from './hooks/useServerReady'
import { ToastProvider } from './contexts/ToastContext'
import { ErrorBoundary } from './components/ErrorBoundary'

function AppInner() {
  const serverPhase = useServerReady()

  return (
    <>
      {serverPhase === 'waking' && <WakeUpScreen />}
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:subjectId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flashcards"
            element={
              <ProtectedRoute>
                <FlashcardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flashcards/:deckId"
            element={
              <ProtectedRoute>
                <DeckPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <SchedulePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    <p className="fixed bottom-3 right-4 text-xs text-gray-500 opacity-40 hover:opacity-80 transition-opacity pointer-events-none select-none z-40">
      Built by David Mack
    </p>
    </>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
