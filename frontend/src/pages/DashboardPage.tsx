import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubjects, type Subject } from '../hooks/useSubjects'
import { SubjectSidebar } from '../components/SubjectSidebar'
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
  const { user, logout } = useAuth()
  const { subjects, loading, create, update, remove } = useSubjects()
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.get<Stats>('/stats').then(setStats).catch(() => {})
  }, [])

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)

  const createSubject = async (name: string, color: string, icon: string): Promise<void> => { await create(name, color, icon) }
  const updateSubject = async (id: string, data: Partial<Pick<Subject, 'name' | 'color' | 'icon'>>): Promise<void> => { await update(id, data) }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-indigo-600">AI Study Buddy</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hi, {user?.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon="🔥" label="Day streak" value={stats.streak} />
            <StatCard icon="⭐" label="XP earned" value={stats.xp} />
            <StatCard icon="⏱️" label="Hours studied" value={stats.studyHours} />
            <StatCard icon="🃏" label="Cards reviewed" value={stats.cardsReviewed} />
          </div>
        )}

        <div className="flex gap-6">
          <SubjectSidebar
            subjects={subjects}
            selectedId={selectedSubjectId}
            onSelect={setSelectedSubjectId}
            onCreate={createSubject}
            onUpdate={updateSubject}
            onDelete={remove}
            loading={loading}
          />

          <main className="flex-1">
            {selectedSubject ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
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
                <div className="flex gap-3 flex-wrap">
                  <Link
                    to={`/chat/${selectedSubject.id}`}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    🎓 Chat Tutor
                  </Link>
                  <Link
                    to="/upload"
                    className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    📄 Documents
                  </Link>
                  <Link
                    to="/flashcards"
                    className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    🃏 Flashcards
                  </Link>
                  <Link
                    to="/schedule"
                    className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    📅 Schedule
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
                <p className="text-gray-500 text-sm">Select a subject from the sidebar, or create your first one to get started.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
