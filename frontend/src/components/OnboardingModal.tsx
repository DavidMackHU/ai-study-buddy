import { useState } from 'react'
import { api } from '../lib/api'

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6']
const ICONS = ['📚', '🔬', '🧮', '🌍', '💻', '🎨', '🏛️', '⚗️']
const GOALS = [
  { label: '2 hrs', value: 2 },
  { label: '5 hrs', value: 5 },
  { label: '10 hrs', value: 10 },
  { label: '15 hrs', value: 15 },
  { label: '20+ hrs', value: 20 },
]

interface Props {
  onComplete: (weeklyStudyGoal?: number) => Promise<void>
}

export function OnboardingModal({ onComplete }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 2 state
  const [subjectName, setSubjectName] = useState('')
  const [subjectColor, setSubjectColor] = useState(COLORS[0])
  const [subjectIcon, setSubjectIcon] = useState(ICONS[0])
  const [saving, setSaving] = useState(false)
  const [subjectError, setSubjectError] = useState<string | null>(null)
  const [subjectAdded, setSubjectAdded] = useState(false)

  // Step 3 state
  const [selectedGoal, setSelectedGoal] = useState<number | undefined>()
  const [completing, setCompleting] = useState(false)

  async function handleAddSubject(e: React.FormEvent) {
    e.preventDefault()
    if (!subjectName.trim()) { setSubjectError('Name is required'); return }
    setSaving(true)
    setSubjectError(null)
    try {
      await api.post('/subjects', { name: subjectName.trim(), color: subjectColor, icon: subjectIcon })
      setSubjectAdded(true)
    } catch {
      setSubjectError("Couldn't create subject. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete() {
    setCompleting(true)
    try {
      await onComplete(selectedGoal)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6">
          {([1, 2, 3] as const).map(s => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step ? 'bg-indigo-600 w-6' : s < step ? 'bg-indigo-300 w-2' : 'bg-gray-200 w-2'
              }`}
            />
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {step === 1 && (
            <div className="text-center space-y-4">
              <div className="text-5xl select-none">👋</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome to AI Study Buddy!</h2>
                <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                  Your personal AI-powered learning companion. Chat with an AI tutor, upload your notes,
                  generate flashcards, and schedule your study sessions — all in one place.
                </p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors min-h-[44px]"
              >
                Get Started
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add your first subject</h2>
                <p className="text-gray-500 text-sm mt-1">Subjects help organise your study materials and chat history.</p>
              </div>

              {subjectAdded ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-1">
                  <p className="text-green-700 font-medium text-sm">✅ Subject added!</p>
                  <p className="text-green-600 text-xs">You can add more subjects from the dashboard.</p>
                </div>
              ) : (
                <form onSubmit={handleAddSubject} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Subject name (e.g. Biology)"
                    value={subjectName}
                    onChange={e => setSubjectName(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {ICONS.map(ic => (
                      <button type="button" key={ic} onClick={() => setSubjectIcon(ic)}
                        className={`text-lg p-1.5 rounded min-w-[36px] min-h-[36px] transition-colors ${
                          subjectIcon === ic ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-100'
                        }`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLORS.map(c => (
                      <button type="button" key={c} onClick={() => setSubjectColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-all ${
                          subjectColor === c ? 'ring-2 ring-offset-1 ring-gray-700' : ''
                        }`}
                      />
                    ))}
                  </div>
                  {subjectError && <p className="text-xs text-red-600">{subjectError}</p>}
                  <button type="submit" disabled={saving}
                    className="w-full py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[44px]">
                    {saving ? 'Adding…' : 'Add Subject'}
                  </button>
                </form>
              )}

              <div className="flex items-center gap-3">
                {subjectAdded && (
                  <button onClick={() => setStep(3)}
                    className="flex-1 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors min-h-[44px]">
                    Continue
                  </button>
                )}
                <button onClick={() => setStep(3)}
                  className={`text-sm text-gray-400 hover:text-gray-600 min-h-[44px] transition-colors ${
                    subjectAdded ? 'px-3' : 'w-full'
                  }`}>
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Set a weekly study goal</h2>
                <p className="text-gray-500 text-sm mt-1">How many hours per week do you want to study?</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {GOALS.map(g => (
                  <button key={g.value}
                    onClick={() => setSelectedGoal(prev => prev === g.value ? undefined : g.value)}
                    className={`flex-1 min-w-[70px] py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                      selectedGoal === g.value
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300'
                    }`}>
                    {g.label}
                  </button>
                ))}
              </div>

              <button onClick={handleComplete} disabled={completing}
                className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors min-h-[44px]">
                {completing ? 'Saving…' : "Let's go!"}
              </button>
              <button onClick={handleComplete} disabled={completing}
                className="w-full text-sm text-gray-400 hover:text-gray-600 min-h-[44px] transition-colors disabled:opacity-50">
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
