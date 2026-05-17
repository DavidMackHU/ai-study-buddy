import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PageSpinner } from '../components/Spinner'
import { StudyMode } from '../components/StudyMode'
import { ReviewMode } from '../components/ReviewMode'
import { QuizMode } from '../components/QuizMode'
import { api } from '../lib/api'

interface Card {
  id: string
  front: string
  back: string
  deckId: string
  dueDate: string
}

interface Deck {
  id: string
  name: string
  subjectId: string | null
}

type Mode = 'list' | 'study' | 'review' | 'quiz'

export function DeckPage() {
  const { deckId } = useParams<{ deckId: string }>()
  const { user, logout } = useAuth()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [dueCards, setDueCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('list')
  const [studyIndex, setStudyIndex] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [adding, setAdding] = useState(false)
  const [showGenForm, setShowGenForm] = useState(false)
  const [genTopic, setGenTopic] = useState('')
  const [genCount, setGenCount] = useState('10')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  useEffect(() => {
    if (!deckId) return
    Promise.all([
      api.get<{ deck: Deck; cards: Card[] }>(`/decks/${deckId}/cards`),
      api.get<Card[]>(`/decks/${deckId}/due`),
    ])
      .then(([{ deck, cards }, due]) => {
        setDeck(deck)
        setCards(cards)
        setDueCards(due)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [deckId])

  async function addCard(e: React.FormEvent) {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return
    setAdding(true)
    try {
      const card = await api.post<Card>(`/decks/${deckId}/cards`, {
        front: front.trim(),
        back: back.trim(),
      })
      setCards(prev => [...prev, card])
      setFront('')
      setBack('')
      setShowAddForm(false)
    } finally {
      setAdding(false)
    }
  }

  async function generateCards(e: React.FormEvent) {
    e.preventDefault()
    if (!genTopic.trim()) return
    setGenerating(true)
    try {
      setGenError('')
      const newCards = await api.post<Card[]>(`/decks/${deckId}/generate`, {
        topic: genTopic.trim(),
        count: Number(genCount),
      })
      setCards(prev => [...prev, ...newCards])
      setGenTopic('')
      setShowGenForm(false)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function deleteCard(cardId: string) {
    await api.delete(`/decks/${deckId}/cards/${cardId}`)
    setCards(prev => prev.filter(c => c.id !== cardId))
  }

  if (loading) return <PageSpinner />

  if (!deck) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Deck not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link to="/flashcards" className="text-sm text-gray-500 hover:text-gray-700 shrink-0 min-h-[44px] flex items-center">← Decks</Link>
          <h1 className="text-lg font-semibold text-indigo-600 truncate">{deck.name}</h1>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <span className="hidden sm:inline text-sm text-gray-600">{user?.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 min-h-[44px] flex items-center">Sign out</button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6">
        {/* Mode toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setMode('list')}
            className={`text-sm px-4 py-2.5 rounded-lg font-medium min-h-[44px] ${mode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            📋 Cards ({cards.length})
          </button>
          {cards.length > 0 && (
            <button
              onClick={() => { setStudyIndex(0); setMode('study') }}
              className={`text-sm px-4 py-2.5 rounded-lg font-medium min-h-[44px] ${mode === 'study' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              🎴 Study
            </button>
          )}
          <button
            onClick={() => setMode('review')}
            className={`text-sm px-4 py-2.5 rounded-lg font-medium min-h-[44px] ${mode === 'review' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            🔁 Review{dueCards.length > 0 ? ` (${dueCards.length})` : ''}
          </button>
          {cards.length > 0 && (
            <button
              onClick={() => setMode('quiz')}
              className={`text-sm px-4 py-2.5 rounded-lg font-medium min-h-[44px] ${mode === 'quiz' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              🧠 Quiz
            </button>
          )}
        </div>

        {mode === 'study' && cards.length > 0 && (
          <StudyMode
            cards={cards}
            index={studyIndex}
            onPrev={() => setStudyIndex(i => Math.max(0, i - 1))}
            onNext={() => setStudyIndex(i => Math.min(cards.length - 1, i + 1))}
            onRestart={() => setStudyIndex(0)}
          />
        )}

        {mode === 'review' && (
          <ReviewMode
            deckId={deckId!}
            cards={dueCards}
            onComplete={() => { setDueCards([]); setMode('list') }}
            onBack={() => setMode('list')}
          />
        )}

        {mode === 'quiz' && (
          <QuizMode
            deckId={deckId!}
            cards={cards}
            onComplete={() => setMode('list')}
            onBack={() => setMode('list')}
          />
        )}

        {/* List mode */}
        {mode === 'list' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-gray-500">{cards.length} card{cards.length !== 1 ? 's' : ''}</p>
              <div className="flex gap-2">
                <button onClick={() => { setShowGenForm(f => !f); setShowAddForm(false) }}
                  className="text-sm bg-indigo-50 text-indigo-600 px-3 py-2.5 rounded-lg hover:bg-indigo-100 font-medium min-h-[44px]">
                  ✨ AI Generate
                </button>
                <button onClick={() => { setShowAddForm(f => !f); setShowGenForm(false) }}
                  className="text-sm bg-indigo-600 text-white px-3 py-2.5 rounded-lg hover:bg-indigo-700 min-h-[44px]">
                  + Add Card
                </button>
              </div>
            </div>

            {showGenForm && (
              <form onSubmit={generateCards} className="bg-white border border-indigo-200 rounded-xl p-5 space-y-3">
                <h3 className="font-medium text-gray-900 text-sm">✨ Generate with AI</h3>
                <textarea autoFocus rows={2} value={genTopic} onChange={e => setGenTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, the French Revolution, Newton's laws…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                <div className="flex items-center gap-3 flex-wrap">
                  <select value={genCount} onChange={e => setGenCount(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 min-h-[44px]">
                    {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} cards</option>)}
                  </select>
                  <button type="submit" disabled={generating || !genTopic.trim()}
                    className="text-sm bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 min-h-[44px]">
                    {generating ? 'Generating…' : 'Generate'}
                  </button>
                  <button type="button" onClick={() => { setShowGenForm(false); setGenTopic('') }}
                    className="text-sm text-gray-500 px-3 py-2.5 rounded-lg hover:bg-gray-100 min-h-[44px]">Cancel</button>
                </div>
                {generating && <p className="text-xs text-indigo-400 animate-pulse">Gemini is writing your flashcards…</p>}
                {genError && <p className="text-xs text-red-600">{genError}</p>}
              </form>
            )}

            {showAddForm && (
              <form onSubmit={addCard} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
                <h3 className="font-medium text-gray-900 text-sm">New Card</h3>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Front (question / term)</label>
                  <textarea autoFocus rows={2} value={front} onChange={e => setFront(e.target.value)}
                    placeholder="What is the mitochondria?"
                    className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Back (answer / definition)</label>
                  <textarea rows={2} value={back} onChange={e => setBack(e.target.value)}
                    placeholder="The powerhouse of the cell."
                    className="w-full border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={adding || !front.trim() || !back.trim()}
                    className="text-sm bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 min-h-[44px]">
                    {adding ? 'Adding…' : 'Add Card'}
                  </button>
                  <button type="button" onClick={() => { setShowAddForm(false); setFront(''); setBack('') }}
                    className="text-sm text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-100 min-h-[44px]">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {cards.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <p className="text-2xl mb-2">🃏</p>
                <p className="text-gray-400 text-sm">No cards yet. Add your first card above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cards.map((card, i) => (
                  <div key={card.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-start">
                    <span className="text-xs text-gray-300 font-mono pt-1 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Front</p>
                        <p className="text-sm text-gray-900">{card.front}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Back</p>
                        <p className="text-sm text-gray-700">{card.back}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteCard(card.id)}
                      className="text-xs text-red-400 hover:text-red-600 shrink-0 px-2 py-1 min-h-[36px]">
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
