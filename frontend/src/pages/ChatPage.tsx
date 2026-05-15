import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChatWindow } from '../components/ChatWindow'
import { useSubjects } from '../hooks/useSubjects'

type Mode = 'normal' | 'beginner' | 'challenge'

const MODES: { value: Mode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'challenge', label: 'Challenge' },
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
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shrink-0">
        <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl">{subject.icon}</span>
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: subject.color }}
          />
          <span className="font-semibold text-gray-800">{subject.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === m.value
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </nav>

      <ChatWindow subjectId={subjectId!} mode={mode} />
    </div>
  )
}
