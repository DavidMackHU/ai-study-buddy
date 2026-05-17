import { useState, useEffect } from 'react'

export function WakeUpScreen() {
  const [dotCount, setDotCount] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(n => (n >= 3 ? 1 : n + 1))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const dots = '.'.repeat(dotCount)

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 px-4">
      <div className="text-center space-y-6 max-w-sm w-full">
        <div className="text-5xl select-none">📚</div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Study Buddy</h1>
          <p className="text-gray-400 text-sm mt-1">Your AI-powered learning companion</p>
        </div>

        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto" />

        <div className="space-y-2">
          <p className="text-gray-700 text-sm font-medium">
            Waking up the server{dots}
          </p>
          <p className="text-gray-400 text-xs leading-relaxed">
            This may take up to 60 seconds on first load.
            <br />
            The server sleeps when not in use.
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
