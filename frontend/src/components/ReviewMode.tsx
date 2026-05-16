import { useState } from 'react'
import { FlashCard } from './FlashCard'
import { api } from '../lib/api'

interface Card {
  id: string
  front: string
  back: string
}

interface Props {
  deckId: string
  cards: Card[]
  onComplete: (reviewed: number) => void
  onBack: () => void
}

const RATINGS = [
  { label: 'Again', value: 0, color: 'bg-red-100 text-red-700 hover:bg-red-200' },
  { label: 'Hard', value: 2, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { label: 'Good', value: 3, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { label: 'Easy', value: 5, color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
]

export function ReviewMode({ deckId, cards, onComplete, onBack }: Props) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  if (cards.length === 0 || index >= cards.length) {
    return (
      <div className="bg-indigo-50 rounded-xl p-8 text-center space-y-3">
        <p className="text-2xl">🎉</p>
        <p className="text-indigo-700 font-medium">
          {cards.length === 0
            ? 'No cards due for review — check back later!'
            : `Review complete! ${reviewed} card${reviewed !== 1 ? 's' : ''} reviewed.`}
        </p>
        <button
          onClick={() => onComplete(reviewed)}
          className="text-sm text-indigo-600 underline hover:text-indigo-800"
        >
          Back to deck
        </button>
      </div>
    )
  }

  const card = cards[index]

  async function rate(rating: number) {
    if (submitting) return
    setSubmitting(true)
    try {
      await api.post(`/decks/${deckId}/review`, { cardId: card.id, rating })
      setReviewed(r => r + 1)
    } catch {
      // advance even on error
    } finally {
      setSubmitting(false)
      setIndex(i => i + 1)
      setRevealed(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Card {index + 1} of {cards.length}</span>
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600">
          Exit review
        </button>
      </div>

      <FlashCard key={card.id} front={card.front} back={card.back} />

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
        >
          Show Answer
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-center text-gray-400">How well did you remember?</p>
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map(r => (
              <button
                key={r.value}
                onClick={() => rate(r.value)}
                disabled={submitting}
                className={`py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${r.color}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
