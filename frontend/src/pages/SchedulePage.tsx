import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

interface Subject {
  id: string
  name: string
  color: string
  icon: string
}

interface BlockSubject {
  name: string
  color: string
  icon: string
}

interface StudyBlock {
  id: string
  date: string
  startTime: string
  endTime: string
  completed: boolean
  subject: BlockSubject | null
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getWeekStart(ref: Date): Date {
  const d = new Date(ref)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function dayLabel(d: Date): string {
  const dow = d.getDay()
  return `${DAY_LABELS[dow === 0 ? 6 : dow - 1]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function SchedulePage() {
  const { user, logout } = useAuth()
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [blocks, setBlocks] = useState<StudyBlock[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState(toYMD(new Date()))
  const [formSubject, setFormSubject] = useState('')
  const [formStart, setFormStart] = useState('09:00')
  const [formEnd, setFormEnd] = useState('10:00')
  const [adding, setAdding] = useState(false)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = days[6]
  const todayYMD = toYMD(new Date())
  const weekLabel = `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getDate()}`

  useEffect(() => {
    setLoading(true)
    const end = addDays(weekStart, 6)
    Promise.all([
      api.get<StudyBlock[]>(`/schedule?from=${toYMD(weekStart)}&to=${toYMD(end)}`),
      api.get<Subject[]>('/subjects'),
    ])
      .then(([b, s]) => { setBlocks(b); setSubjects(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [weekStart])

  async function addBlock(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    try {
      const block = await api.post<StudyBlock>('/schedule', {
        subjectId: formSubject || null,
        date: formDate,
        startTime: formStart,
        endTime: formEnd,
      })
      setBlocks(prev =>
        [...prev, block].sort(
          (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
        )
      )
      setShowForm(false)
    } finally {
      setAdding(false)
    }
  }

  async function toggleComplete(id: string) {
    const updated = await api.patch<StudyBlock>(`/schedule/${id}`, {})
    setBlocks(prev => prev.map(b => (b.id === id ? updated : b)))
  }

  async function deleteBlock(id: string) {
    await api.delete(`/schedule/${id}`)
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
          <h1 className="text-lg font-semibold text-indigo-600">📅 Schedule</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setWeekStart(d => addDays(d, -7))}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
            ← Prev
          </button>
          <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
          <button onClick={() => setWeekStart(d => addDays(d, 7))}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
            Next →
          </button>
        </div>

        <button
          onClick={() => { setShowForm(f => !f); setFormDate(todayYMD) }}
          className="w-full py-2 text-sm text-indigo-600 border border-dashed border-indigo-300 rounded-xl hover:bg-indigo-50"
        >
          + Add Study Block
        </button>

        {showForm && (
          <form onSubmit={addBlock} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="font-medium text-gray-900 text-sm">New Study Block</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Subject (optional)</label>
                <select value={formSubject} onChange={e => setFormSubject(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="">No subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Start time</label>
                <input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">End time</label>
                <input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={adding}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {adding ? 'Adding…' : 'Add Block'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-8">Loading…</p>
        ) : (
          <div className="space-y-3">
            {days.map(day => {
              const ymd = toYMD(day)
              const dayBlocks = blocks.filter(b => b.date.slice(0, 10) === ymd)
              const isToday = ymd === todayYMD
              return (
                <div key={ymd} className={`bg-white border rounded-xl overflow-hidden ${isToday ? 'border-indigo-300' : 'border-gray-200'}`}>
                  <div className={`px-4 py-2.5 flex items-center justify-between ${isToday ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                    <span className={`text-sm font-medium ${isToday ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {dayLabel(day)}{isToday ? ' · Today' : ''}
                    </span>
                    <span className="text-xs text-gray-400">
                      {dayBlocks.filter(b => b.completed).length}/{dayBlocks.length} done
                    </span>
                  </div>
                  {dayBlocks.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-300">No sessions planned</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {dayBlocks.map(block => (
                        <li key={block.id} className="px-4 py-3 flex items-center gap-3">
                          <button
                            onClick={() => toggleComplete(block.id)}
                            className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${block.completed ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 hover:border-indigo-400'}`}
                          >
                            {block.completed && <span className="text-white text-xs leading-none">✓</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${block.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {block.subject
                                ? <><span style={{ color: block.subject.color }}>{block.subject.icon}</span> {block.subject.name}</>
                                : 'Study session'}
                            </p>
                            <p className="text-xs text-gray-400">{block.startTime} – {block.endTime}</p>
                          </div>
                          <button onClick={() => deleteBlock(block.id)}
                            className="text-xs text-red-400 hover:text-red-600 shrink-0 px-1">
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
