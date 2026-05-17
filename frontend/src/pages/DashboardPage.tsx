import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubjects, type Subject } from '../hooks/useSubjects'
import { SubjectSidebar } from '../components/SubjectSidebar'
import { OnboardingModal } from '../components/OnboardingModal'
import { api } from '../lib/api'

interface Stats {
  streak: number
  xp: number
  studyHours: number
  cardsReviewed: number
  totalCards: number
  completedBlocks: number
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user, logout, completeOnboarding } = useAuth()
  const { subjects, loading, create, update, remove } = useSubjects()
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const loadStats = () => api.get<Stats>('/stats').then(setStats).catch(() => {})
    loadStats()
    const id = setInterval(loadStats, 30000)
    return () => clearInterval(id)
  }, [])

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)

  const createSubject = async (name: string, color: string, icon: string): Promise<void> => { await create(name, color, icon) }
  const updateSubject = async (id: string, data: Partial<Pick<Subject, 'name' | 'color' | 'icon'>>): Promise<void> => { await update(id, data) }

  function handleSelect(id: string | null) {
    setSelectedSubjectId(id)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && !user.isOnboarded && (
        <OnboardingModal onComplete={completeOnboarding} />
      )}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-indigo-600">AI Study Buddy</h1>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-gray-600">Hi, {user?.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 min-h-[44px] px-2">
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <StatCard icon="🔥" label="Day streak" value={stats.streak} />
            <StatCard icon="⭐" label="XP earned" value={stats.xp} />
            <StatCard icon="⏱️" label="Hours studied" value={stats.studyHours} />
            <StatCard icon="🃏" label="Cards reviewed" value={stats.cardsReviewed} />
          </div>
        )}

        {/* Mobile sidebar toggle */}
        <div className="lg:hidden flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-3 min-h-[44px] hover:bg-gray-50"
          >
            <span className="text-base">☰</span>
            Subjects
          </button>
          {selectedSubject && !sidebarOpen && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{selectedSubject.icon}</span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedSubject.color }}
              />
              <span className="truncate max-w-[150px]">{selectedSubject.name}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-5 sm:gap-6">
          {/* Sidebar: hidden on mobile unless toggled */}
          <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
            <SubjectSidebar
              subjects={subjects}
              selectedId={selectedSubjectId}
              onSelect={handleSelect}
              onCreate={createSubject}
              onUpdate={updateSubject}
              onDelete={remove}
              loading={loading}
            />
          </div>

          <main className="flex-1">
            {selectedSubject ? (
              <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{selectedSubject.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedSubject.name}</h2>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedSubject.color }} />
                      <span className="text-xs text-gray-400">Subject selected</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                  <Link
                    to={`/chat/${selectedSubject.id}`}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 min-h-[44px]"
                  >
                    🎓 Chat Tutor
                  </Link>
                  <Link
                    to="/upload"
                    className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 sm:py-2 rounded-lg text-sm font-medium hover:bg-gray-50 min-h-[44px]"
                  >
                    📄 Documents
                  </Link>
                  <Link
                    to="/flashcards"
                    className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 sm:py-2 rounded-lg text-sm font-medium hover:bg-gray-50 min-h-[44px]"
                  >
                    🃏 Flashcards
                  </Link>
                  <Link
                    to="/schedule"
                    className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-3 sm:py-2 rounded-lg text-sm font-medium hover:bg-gray-50 min-h-[44px]"
                  >
                    📅 Schedule
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
                <p className="md:hidden text-gray-500 text-sm">
                  Tap &ldquo;Subjects&rdquo; to pick a subject, or create your first one to get started.
                </p>
                <p className="hidden md:block text-gray-500 text-sm">
                  Select a subject from the sidebar, or create your first one to get started.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
