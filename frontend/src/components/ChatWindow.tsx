import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageBubble } from './MessageBubble'

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface Props {
  subjectId: string
  mode: 'normal' | 'beginner' | 'challenge'
}

export function ChatWindow({ subjectId, mode }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${BASE}/chat/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load history')
      const data = await res.json()
      setMessages(data)
    } catch {
      setError('Failed to load chat history')
    } finally {
      setLoading(false)
    }
  }, [subjectId])

  useEffect(() => {
    setMessages([])
    loadHistory()
  }, [subjectId, loadHistory])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setError(null)
    setSending(true)

    const userMsg: Message = { role: 'user', content: text }
    const assistantMsg: Message = { role: 'assistant', content: '', streaming: true }
    setMessages(prev => [...prev, userMsg, assistantMsg])

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subjectId, content: text, mode }),
      })

      if (!res.ok || !res.body) throw new Error('Request failed')

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
          if (payload === '[DONE]') break
          const parsed = JSON.parse(payload)
          if (parsed.error) throw new Error(parsed.error)
          if (parsed.text) {
            setMessages(prev => {
              const last = prev[prev.length - 1]
              return [...prev.slice(0, -1), { ...last, content: last.content + parsed.text }]
            })
          }
        }
      }

      setMessages(prev => {
        const last = prev[prev.length - 1]
        return [...prev.slice(0, -1), { ...last, streaming: false }]
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setSending(false)
    }
  }

  async function clearHistory() {
    if (!confirm('Clear all chat history for this subject?')) return
    const token = localStorage.getItem('token')
    await fetch(`${BASE}/chat/${subjectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setMessages([])
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-12">
            <p className="text-4xl mb-3">🎓</p>
            <p>Ask me anything about this subject!</p>
            <p className="text-xs mt-1 hidden sm:block">Press Enter to send, Shift+Enter for a new line.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} streaming={msg.streaming} />
        ))}
        {error && (
          <div className="text-center text-red-500 text-sm py-2">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input fixed to bottom on mobile via the flex column layout */}
      <div className="border-t border-gray-200 bg-white px-3 sm:px-4 py-3 safe-area-bottom">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question…"
            disabled={sending}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="bg-indigo-600 text-white rounded-xl px-4 text-sm hover:bg-indigo-700 disabled:opacity-40 shrink-0 min-h-[44px]"
          >
            {sending ? '…' : 'Send'}
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-gray-400 hover:text-gray-600 text-xs px-2 min-h-[44px] flex items-center"
              title="Clear history"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
