import { useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import { friendlyError } from '../lib/errors'

interface Deck {
  id: string
  name: string
}

interface DocSubject {
  name: string
  color: string
  icon: string
}

interface Document {
  id: string
  filename: string
  extractedText: string | null
  createdAt: string
  subject?: DocSubject | null
}

interface Props {
  doc: Document
  onDelete: (id: string) => void
}

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

export function DocumentCard({ doc, onDelete }: Props) {
  const addToast = useToast()
  const [summary, setSummary] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showFlashForm, setShowFlashForm] = useState(false)
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState('')
  const [newDeckName, setNewDeckName] = useState('')
  const [flashCount, setFlashCount] = useState('10')
  const [generating, setGenerating] = useState(false)
  const [genResult, setGenResult] = useState<{ deckId: string; count: number } | null>(null)

  async function openFlashForm() {
    setShowFlashForm(true)
    setGenResult(null)
    if (decks.length === 0) {
      const loaded = await api.get<Deck[]>('/decks')
      setDecks(loaded)
      if (loaded.length > 0) setSelectedDeckId(loaded[0].id)
    }
  }

  async function generateFlashcards(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    try {
      const body = selectedDeckId
        ? { deckId: selectedDeckId, count: Number(flashCount) }
        : { deckName: newDeckName.trim() || `${doc.filename} cards`, count: Number(flashCount) }
      const result = await api.post<{ deckId: string; cards: unknown[] }>(`/documents/${doc.id}/flashcards`, body)
      setGenResult({ deckId: result.deckId, count: result.cards.length })
      setShowFlashForm(false)
    } catch (err) {
      addToast(friendlyError(err, 'flashcards'))
    } finally {
      setGenerating(false)
    }
  }

  async function summarize() {
    setSummarizing(true)
    setSummary('')
    setExpanded(true)

    const token = localStorage.getItem('token')
    const res = await fetch(`${BASE}/documents/${doc.id}/summarize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok || !res.body) {
      addToast("Couldn't reach the AI tutor. Please try again.")
      setSummarizing(false)
      setExpanded(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6)
        if (payload === '[DONE]') { setSummarizing(false); return }
        try {
          const { text, error } = JSON.parse(payload)
          if (error) { addToast("Couldn't reach the AI tutor. Please try again."); setSummarizing(false); setExpanded(false); return }
          if (text) setSummary(prev => prev + text)
        } catch { /* partial chunk */ }
      }
    }
    setSummarizing(false)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${doc.filename}"?`)) return
    setDeleting(true)
    const token = localStorage.getItem('token')
    await fetch(`${BASE}/documents/${doc.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    onDelete(doc.id)
  }

  const ext = doc.filename.split('.').pop()?.toUpperCase() ?? 'FILE'
  const date = new Date(doc.createdAt).toLocaleDateString()

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600">
            {ext}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">{doc.filename}</p>
            <p className="text-xs text-gray-400">
              {date}
              {doc.subject && (
                <span className="ml-2">
                  <span style={{ color: doc.subject.color }}>{doc.subject.icon}</span>{' '}
                  {doc.subject.name}
                </span>
              )}
              {!doc.extractedText && (
                <span className="ml-2 text-orange-400">no text extracted</span>
              )}
            </p>
          </div>
        </div>

        {/* Action buttons - stacked on mobile, inline on desktop */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2 shrink-0">
          {doc.extractedText && (
            <>
              <button onClick={openFlashForm}
                className="text-xs bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-100 min-h-[36px] whitespace-nowrap">
                🃏 Flashcards
              </button>
              <button onClick={summarize} disabled={summarizing}
                className="text-xs bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-100 disabled:opacity-50 min-h-[36px] whitespace-nowrap">
                {summarizing ? 'Summarizing…' : '✨ Summarize'}
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-600 px-2 py-2 min-h-[36px]"
          >
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>

      {genResult && (
        <div className="mt-3 border-t border-gray-100 pt-3 flex items-center justify-between">
          <p className="text-xs text-green-600">✅ {genResult.count} cards generated!</p>
          <Link to={`/flashcards/${genResult.deckId}`}
            className="text-xs text-indigo-600 hover:underline">Open deck →</Link>
        </div>
      )}

      {showFlashForm && (
        <form onSubmit={generateFlashcards} className="mt-3 border-t border-gray-100 pt-3 space-y-3">
          <p className="text-xs font-semibold text-gray-700">🃏 Generate Flashcards</p>
          <div className="flex gap-2 flex-wrap">
            {decks.length > 0 ? (
              <select value={selectedDeckId} onChange={e => setSelectedDeckId(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-2 flex-1 min-w-0 min-h-[36px]">
                {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                <option value="">+ New deck…</option>
              </select>
            ) : null}
            {(!selectedDeckId || decks.length === 0) && (
              <input value={newDeckName} onChange={e => setNewDeckName(e.target.value)}
                placeholder="New deck name (optional)"
                className="text-xs border border-gray-200 rounded-lg px-2 py-2 flex-1 min-w-0 min-h-[36px]" />
            )}
            <select value={flashCount} onChange={e => setFlashCount(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-2 min-h-[36px]">
              {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={generating}
              className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 min-h-[36px]">
              {generating ? 'Generating…' : 'Generate'}
            </button>
            <button type="button" onClick={() => setShowFlashForm(false)}
              className="text-xs text-gray-500 px-3 py-2 rounded-lg hover:bg-gray-100 min-h-[36px]">Cancel</button>
          </div>
        </form>
      )}

      {expanded && (summary || summarizing) && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {summarizing && !summary && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="animate-pulse">●</span> Generating summary…
            </div>
          )}
          {summary && (
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
              {summarizing && <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse" />}
            </div>
          )}
          <button
            onClick={() => setExpanded(false)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 min-h-[36px]"
          >
            Hide summary
          </button>
        </div>
      )}
    </div>
  )
}
