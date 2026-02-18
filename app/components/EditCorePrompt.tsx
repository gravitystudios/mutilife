'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface EditCorePromptProps {
  onBack: () => void
}

export default function EditCorePrompt({ onBack }: EditCorePromptProps) {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [version, setVersion] = useState<string>('')
  const [updatedBy, setUpdatedBy] = useState<string>('')
  const [changeNote, setChangeNote] = useState<string>('')
  const [note, setNote] = useState<string>('')

  useEffect(() => {
    fetchCoreKB()
  }, [])

  const fetchCoreKB = async () => {
    try {
      const res = await fetch('/api/kb/core')
      if (!res.ok) throw new Error('Failed to fetch')
      const { data } = await res.json()
      setContent(data.content || '')
      setVersion(data.kb_version || '')
      setUpdatedBy(data.updated_by || '')
      setChangeNote(data.change_note || '')
    } catch (error) {
      toast.error('Failed to load core KB')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!note.trim()) {
      toast.error('Please add a note')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/kb/core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          content,
          updated_by: 'admin@mutilife.co.za',
          note
        }])
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      toast.success(`Core KB updated successfully (v${data.kb_version || 'unknown'})`)
      setNote('')
      fetchCoreKB()
    } catch (error) {
      toast.error('Failed to update core KB')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={onBack}
              className="mb-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Core Knowledge</h2>
            {version && <p className="text-sm text-gray-500 mt-1">Version: {version}</p>}
            {updatedBy && <p className="text-sm text-gray-500">Last updated by: {updatedBy}</p>}
            {changeNote && <p className="text-sm text-gray-600 mt-1 italic">"{changeNote}"</p>}
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[400px] p-4 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        <div className="space-y-3">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this change..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSave}
            disabled={saving || !note.trim()}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
