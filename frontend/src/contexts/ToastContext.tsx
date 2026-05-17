import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
}

interface ToastContextValue {
  addToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message: string) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => dismiss(id), 5000)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="assertive"
        className="fixed top-4 inset-x-0 flex flex-col items-center gap-2 z-[100] px-4 pointer-events-none"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-start gap-3 w-full max-w-sm bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 shadow-lg text-sm font-medium pointer-events-auto"
          >
            <span className="shrink-0 mt-px">⚠️</span>
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-red-500 leading-none mt-px"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.addToast
}
