import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChatWindow } from '../components/ChatWindow'
import { useSubjects } from '../hooks/useSubjects'

type Mode = 'normal' | 'beginner' | 'challenge'

const MODES: { value: Mode; label: string; short: string }[] = [
  { value: 'normal', label: 'Normal', short: 'N' },
  { value: 'beginner', label: 'Beginner', short: 'B' },
  { value: 'challenge', label: 'Challenge', short: 'C' },
]

export function ChatPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const { subjects, loading } = useSubjects()
  const [mode, setMode] = useState<Mode>('normal')

  const subject = subjects.find(s => s.id === subjectId)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Loading…
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Subject not found.</p>
        <Link to="/dashboard" className="text-indigo-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0 flex-wrap">
        <Link
          to="/dashboard"
          className="text-gray-400 hover:text-gray-600 text-sm shrink-0 min-h-[44px] flex items-center"
        >
          ← Dashboard
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{subject.icon}</span>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: subject.color }}
          />
          <span className="font-semibold text-gray-800 text-sm truncate">{subject.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`px-2 sm:px-3 py-2 rounded-md text-xs font-medium transition-colors min-h-[36px] ${
                mode === m.value
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="sm:hidden">{m.short}</span>
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <ChatWindow subjectId={subjectId!} mode={mode} />
    </div>
  )
}
