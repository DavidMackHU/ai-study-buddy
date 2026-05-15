import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export interface Subject {
  id: string
  name: string
  color: string
  icon: string
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await api.get<Subject[]>('/subjects')
      setSubjects(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async (name: string, color: string, icon: string) => {
    const subject = await api.post<Subject>('/subjects', { name, color, icon })
    setSubjects(prev => [...prev, subject].sort((a, b) => a.name.localeCompare(b.name)))
    return subject
  }

  const update = async (id: string, data: Partial<Pick<Subject, 'name' | 'color' | 'icon'>>) => {
    const subject = await api.patch<Subject>(`/subjects/${id}`, data)
    setSubjects(prev => prev.map(s => s.id === id ? subject : s))
    return subject
  }

  const remove = async (id: string) => {
    await api.delete(`/subjects/${id}`)
    setSubjects(prev => prev.filter(s => s.id !== id))
  }

  return { subjects, loading, error, create, update, remove, reload: load }
}
