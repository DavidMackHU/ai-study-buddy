import { useState } from 'react'
import type { Subject } from '../hooks/useSubjects'

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6']
const ICONS = ['📚', '🔬', '🧮', '🌍', '💻', '🎨', '🏛️', '⚗️']

interface Props {
  subjects: Subject[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onCreate: (name: string, color: string, icon: string) => Promise<void>
  onUpdate: (id: string, data: Partial<Pick<Subject, 'name' | 'color' | 'icon'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  loading: boolean
}

interface FormState {
  name: string
  color: string
  icon: string
}

const defaultForm = (): FormState => ({ name: '', color: COLORS[0], icon: ICONS[0] })

export function SubjectSidebar({ subjects, selectedId, onSelect, onCreate, onUpdate, onDelete, loading }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit(subject: Subject) {
    setEditingId(subject.id)
    setForm({ name: subject.name, color: subject.color, icon: subject.icon })
    setShowAdd(false)
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setShowAdd(false)
    setForm(defaultForm())
    setError(null)
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        await onUpdate(editingId, form)
        setEditingId(null)
      } else {
        await onCreate(form.name, form.color, form.icon)
        setShowAdd(false)
      }
      setForm(defaultForm())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this subject? All related data will be removed.')) return
    try {
      await onDelete(id)
      if (selectedId === id) onSelect(null)
    } catch {
      setError('Failed to delete subject')
    }
  }

  const inlineForm = (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
      <input
        autoFocus
        type="text"
        placeholder="Subject name"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') cancelEdit() }}
        className="w-full text-sm border border-gray-300 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
      />
      <div className="flex gap-1 flex-wrap">
        {ICONS.map(icon => (
          <button
            key={icon}
            onClick={() => setForm(f => ({ ...f, icon }))}
            className={`text-lg p-1.5 rounded min-w-[36px] min-h-[36px] ${form.icon === icon ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-200'}`}
          >
            {icon}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {COLORS.map(color => (
          <button
            key={color}
            onClick={() => setForm(f => ({ ...f, color }))}
            style={{ backgroundColor: color }}
            className={`w-6 h-6 rounded-full ${form.color === color ? 'ring-2 ring-offset-1 ring-gray-700' : ''}`}
          />
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 text-xs bg-indigo-600 text-white rounded py-2.5 hover:bg-indigo-700 disabled:opacity-50 min-h-[44px]"
        >
          {saving ? 'Saving…' : editingId ? 'Save' : 'Add'}
        </button>
        <button onClick={cancelEdit} className="flex-1 text-xs border border-gray-300 rounded py-2.5 hover:bg-gray-100 min-h-[44px]">
          Cancel
        </button>
      </div>
    </div>
  )

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Subjects</h3>
          {!showAdd && !editingId && (
            <button
              onClick={() => { setShowAdd(true); setForm(defaultForm()); setError(null) }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 min-h-[36px]"
            >
              + Add
            </button>
          )}
        </div>

        {loading && <p className="text-xs text-gray-400">Loading…</p>}

        {showAdd && inlineForm}

        <ul className="space-y-1">
          {subjects.map(subject => (
            <li key={subject.id}>
              {editingId === subject.id ? (
                inlineForm
              ) : (
                <div
                  className={`group flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    selectedId === subject.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  onClick={() => onSelect(subject.id === selectedId ? null : subject.id)}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="text-sm">{subject.icon}</span>
                  <span className="text-sm flex-1 truncate">{subject.name}</span>
                  {/* Always visible on touch devices, hover-only on desktop */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 touch-device-visible">
                    <button
                      onClick={e => { e.stopPropagation(); startEdit(subject) }}
                      className="text-gray-400 hover:text-gray-600 text-xs p-1 min-w-[28px] min-h-[28px] flex items-center justify-center"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(subject.id) }}
                      className="text-gray-400 hover:text-red-500 text-xs p-1 min-w-[28px] min-h-[28px] flex items-center justify-center"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {!loading && subjects.length === 0 && !showAdd && (
          <p className="text-xs text-gray-400 text-center py-4">No subjects yet. Add one!</p>
        )}
      </div>
    </aside>
  )
}
