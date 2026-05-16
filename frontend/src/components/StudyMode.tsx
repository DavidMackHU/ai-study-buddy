import { FlashCard } from './FlashCard'

interface Card {
  id: string
  front: string
  back: string
}

interface Props {
  cards: Card[]
  index: number
  onPrev: () => void
  onNext: () => void
  onRestart: () => void
}

export function StudyMode({ cards, index, onPrev, onNext, onRestart }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Card {index + 1} of {cards.length}</span>
        <div className="flex gap-2">
          <button
            onClick={onPrev}
            disabled={index === 0}
            className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
          >
            ← Prev
          </button>
          <button
            onClick={onNext}
            disabled={index === cards.length - 1}
            className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      </div>
      <FlashCard key={cards[index].id} front={cards[index].front} back={cards[index].back} />
      {index === cards.length - 1 && (
        <div className="bg-indigo-50 rounded-xl p-4 text-center">
          <p className="text-sm text-indigo-600 font-medium">
            You've reviewed all {cards.length} cards!
          </p>
          <button
            onClick={onRestart}
            className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 underline"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  )
}
