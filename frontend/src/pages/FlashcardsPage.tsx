import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubjects } from '../hooks/useSubjects'
import { api } from '../lib/api'

interface DeckSubject {
  name: string
  color: string
  icon: string
}

interface Deck {
  id: string
  name: string
  subjectId: string | null
  createdAt: string
  subject?: DeckSubject | null
  _count: { cards: number }
}

export function FlashcardsPage() {
  const { user, logout } = useAuth()
  const { subjects } = useSubjects()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSubjectId, setNewSubjectId] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    api.get<Deck[]>('/decks')
      .then(setDecks)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function createDeck(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const deck = await api.post<Deck>('/decks', {
        name: newName.trim(),
        subjectId: newSubjectId || null,
      })
      setDecks(prev => [deck, ...prev])
      setNewName('')
      setNewSubjectId('')
      setShowForm(false)
    } finally {
      setCreating(false)
    }
  }

  async function deleteDeck(id: string, name: string) {
    if (!confirm(`Delete deck "${name}" and all its cards?`)) return
    await api.delete(`/decks/${id}`)
    setDecks(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">← Dashboard</Link>
          <h1 className="text-lg font-semibold text-indigo-600">Flashcards</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Your Decks</h2>
          <button
            onClick={() => setShowForm(f => !f)}
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            + New Deck
          </button>
        </div>

        {showForm && (
          <form onSubmit={createDeck} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <h3 className="font-medium text-gray-900 text-sm">Create New Deck</h3>
            <input
              autoFocus
              type="text"
              placeholder="Deck name (e.g. Chapter 3 Vocab)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <select
              value={newSubjectId}
              onChange={e => setNewSubjectId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">No subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : decks.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-2xl mb-2">🃏</p>
            <p className="text-gray-500 text-sm">No decks yet. Create your first deck above.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {decks.map(deck => (
              <div key={deck.id} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{deck.name}</p>
                    {deck.subject && (
                      <p className="text-xs mt-0.5" style={{ color: deck.subject.color }}>
                        {deck.subject.icon} {deck.subject.name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteDeck(deck.id, deck.name)}
                    className="text-xs text-red-400 hover:text-red-600 shrink-0"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-xs text-gray-400">{deck._count.cards} card{deck._count.cards !== 1 ? 's' : ''}</p>
                <Link
                  to={`/flashcards/${deck.id}`}
                  className="text-sm text-center bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-100 font-medium"
                >
                  Open Deck →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
