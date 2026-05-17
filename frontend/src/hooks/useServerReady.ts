import { useState, useEffect } from 'react'

const HEALTH_URL = (import.meta.env.VITE_API_URL ?? '') + '/api/health'
const SLOW_THRESHOLD_MS = 3000
const RETRY_MS = 5000

export type ServerPhase = 'checking' | 'waking' | 'ready'

export function useServerReady(): ServerPhase {
  const [phase, setPhase] = useState<ServerPhase>('checking')

  useEffect(() => {
    let cancelled = false

    const slowTimer = setTimeout(() => {
      if (!cancelled) setPhase(p => (p === 'checking' ? 'waking' : p))
    }, SLOW_THRESHOLD_MS)

    async function poll() {
      while (!cancelled) {
        try {
          const res = await fetch(HEALTH_URL)
          if (!cancelled && res.ok) {
            clearTimeout(slowTimer)
            setPhase('ready')
            return
          }
        } catch {
          // network error — retry
        }
        if (!cancelled) await new Promise(r => setTimeout(r, RETRY_MS))
      }
    }

    poll()
    return () => {
      cancelled = true
      clearTimeout(slowTimer)
    }
  }, [])

  return phase
}
