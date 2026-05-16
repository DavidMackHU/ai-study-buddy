import { useState } from 'react'

interface Props {
  front: string
  back: string
}

export function FlashCard({ front, back }: Props) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      onClick={() => setFlipped(f => !f)}
      className="cursor-pointer w-full"
      style={{ perspective: '1000px' }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '200px',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s ease',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          className="absolute inset-0 bg-white border-2 border-indigo-200 rounded-xl flex flex-col items-center justify-center p-6 select-none"
        >
          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-3">Question</p>
          <p className="text-gray-900 text-center font-medium leading-relaxed">{front}</p>
          <p className="text-xs text-gray-300 mt-4">Click to reveal answer</p>
        </div>

        {/* Back */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          className="absolute inset-0 bg-indigo-600 border-2 border-indigo-600 rounded-xl flex flex-col items-center justify-center p-6 select-none"
        >
          <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-3">Answer</p>
          <p className="text-white text-center font-medium leading-relaxed">{back}</p>
          <p className="text-xs text-indigo-300 mt-4">Click to flip back</p>
        </div>
      </div>
    </div>
  )
}
