import { useState } from 'react'

interface Card {
  id: string
  front: string
  back: string
}

interface Question {
  card: Card
  options: string[]
  correctIndex: number
}

interface Props {
  cards: Card[]
  onComplete: (correct: number, total: number) => void
  onBack: () => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestions(cards: Card[]): Question[] {
  return shuffle(cards).map(card => {
    const wrongPool = shuffle(cards.filter(c => c.id !== card.id).map(c => c.back))
    const options = shuffle([card.back, ...wrongPool.slice(0, 3)])
    return { card, options, correctIndex: options.indexOf(card.back) }
  })
}

export function QuizMode({ cards, onComplete, onBack }: Props) {
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(cards))
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)

  if (cards.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-400 text-sm">No cards in this deck to quiz.</p>
        <button onClick={onBack} className="mt-3 text-xs text-indigo-500 hover:underline">Back</button>
      </div>
    )
  }

  function choose(i: number) {
    if (selected !== null) return
    setSelected(i)
    if (i === questions[index].correctIndex) setCorrect(c => c + 1)
  }

  function next() {
    setIndex(i => i + 1)
    setSelected(null)
  }

  function retry() {
    setQuestions(buildQuestions(cards))
    setIndex(0)
    setSelected(null)
    setCorrect(0)
  }

  if (index >= questions.length) {
    const pct = Math.round((correct / questions.length) * 100)
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-4">
        <p className="text-3xl">{pct >= 80 ? '🏆' : pct >= 50 ? '📈' : '💪'}</p>
        <div>
          <p className="text-2xl font-bold text-gray-900">{pct}%</p>
          <p className="text-sm text-gray-500 mt-1">{correct} / {questions.length} correct</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={retry}
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Retry
          </button>
          <button onClick={() => onComplete(correct, questions.length)}
            className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100">
            Done
          </button>
        </div>
      </div>
    )
  }

  const q = questions[index]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Question {index + 1} of {questions.length}</span>
        <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-600">Exit quiz</button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-medium text-gray-400 mb-2">What is the answer?</p>
        <p className="text-lg font-semibold text-gray-900">{q.card.front}</p>
      </div>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let cls = 'w-full text-left px-4 py-3 text-sm rounded-xl border transition-colors '
          if (selected === null) {
            cls += 'bg-white border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
          } else if (i === q.correctIndex) {
            cls += 'bg-green-50 border-green-400 text-green-800 font-medium'
          } else if (i === selected) {
            cls += 'bg-red-50 border-red-400 text-red-800'
          } else {
            cls += 'bg-white border-gray-100 text-gray-300'
          }
          return (
            <button key={i} onClick={() => choose(i)} disabled={selected !== null} className={cls}>
              <span className="text-xs text-gray-400 mr-2">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <div className="flex items-center justify-between pt-1">
          <p className={`text-sm font-medium ${selected === q.correctIndex ? 'text-green-600' : 'text-red-500'}`}>
            {selected === q.correctIndex ? '✓ Correct!' : `✗ Correct: ${q.options[q.correctIndex]}`}
          </p>
          <button onClick={next}
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            {index === questions.length - 1 ? 'See Results' : 'Next →'}
          </button>
        </div>
      )}

      <div className="flex justify-between text-xs text-gray-300">
        <span>{correct} correct so far</span>
        <span>{questions.length - index - 1} remaining</span>
      </div>
    </div>
  )
}
