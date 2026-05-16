import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSubjects } from '../hooks/useSubjects'
import { DocumentCard } from '../components/DocumentCard'
import { Spinner } from '../components/Spinner'
import { api } from '../lib/api'

interface DocSubject {
  name: string
  color: string
  icon: string
}

interface Document {
  id: string
  filename: string
  filepath: string
  extractedText: string | null
  createdAt: string
  subjectId: string | null
  subject?: DocSubject | null
}

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

export function UploadPage() {
  const { user, logout } = useAuth()
  const { subjects } = useSubjects()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get<Document[]>('/documents')
      .then(docs => setDocuments(docs))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function uploadFile(file: File) {
    setUploadError('')
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only PDF, DOCX, and TXT files are supported.')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    if (selectedSubjectId) formData.append('subjectId', selectedSubjectId)

    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${BASE}/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        setUploadError(data.error || 'Upload failed')
        return
      }
      const refreshed = await api.get<Document[]>('/documents')
      setDocuments(refreshed)
    } catch {
      setUploadError('Upload failed. Check your connection.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function handleDocumentDeleted(id: string) {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-indigo-600">Documents</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-gray-600">{user?.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Upload Document</h2>
            <p className="text-sm text-gray-500 mt-1">
              PDF, DOCX, or TXT — up to 10 MB. Text is extracted so Gemini can summarize it.
            </p>
          </div>

          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">No subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>

          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {uploadError}
            </div>
          )}

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            } ${uploading ? 'cursor-default' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploading ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-indigo-600 font-medium">Uploading and extracting text…</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-3xl">📄</p>
                <p className="text-sm font-medium text-gray-700">Drop a file here or click to browse</p>
                <p className="text-xs text-gray-400">PDF, DOCX, TXT · max 10 MB</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Your Documents</h2>
          {loading ? (
            <Spinner className="mx-auto mt-4" />
          ) : documents.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-gray-400 text-sm">No documents yet. Upload your first file above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(doc => (
                <DocumentCard key={doc.id} doc={doc} onDelete={handleDocumentDeleted} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
