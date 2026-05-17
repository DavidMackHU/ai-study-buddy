import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/api'

interface User {
  id: string
  name: string
  email: string
  streak: number
  xp: number
  createdAt: string
  isOnboarded: boolean
  weeklyStudyGoal: number | null
}

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  completeOnboarding: (weeklyStudyGoal?: number) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }
    api.get<{ user: User }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem('token')
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  async function login(email: string, password: string) {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
    localStorage.setItem('token', token)
    setToken(token)
    setUser(user)
  }

  async function register(name: string, email: string, password: string) {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/register', { name, email, password })
    localStorage.setItem('token', token)
    setToken(token)
    setUser(user)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  async function completeOnboarding(weeklyStudyGoal?: number) {
    const { user: updated } = await api.patch<{ user: User }>('/auth/onboard', { weeklyStudyGoal })
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
