'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface AddCorrectionProps {
  onBack: () => void
}

interface Correction {
  id: number
  question: string
  correct_answer: string
  mode: string
  tags: string[]
  updated_by: string
  created_at: string
}

export default function AddCorrection({ onBack }: AddCorrectionProps) {
  const [question, setQuestion] = useState('')
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [mode, setMode] = useState('override')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [corrections, setCorrections] = useState<Correction[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editAnswer, setEditAnswer] = useState('')
  const [editTags, setEditTags] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchCorrections()
  }, [])

  const fetchCorrections = async () => {
    try {
      const res = await fetch('/api/kb/corrections')
      if (!res.ok) throw new Error('Failed to fetch')
      const { data } = await res.json()
      setCorrections(data || [])
    } catch (error) {
      toast.error('Failed to load corrections')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!question.trim() || !correctAnswer.trim()) {
      toast.error('Question and answer are required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/kb/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          question,
          correct_answer: correctAnswer,
          mode,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          updated_by: 'admin@mutilife.co.za'
        }])
      })

      if (!res.ok) throw new Error('Failed to save')
      
      toast.success('Correction added successfully')
      setQuestion('')
      setCorrectAnswer('')
      setTags('')
      fetchCorrections()
    } catch (error) {
      toast.error('Failed to add correction')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this correction?')) return
    setDeletingId(id)
    const correction = corrections.find(c => c.id === id)
    if (!correction) return
    try {
      await fetch('https://baemedi.app.n8n.cloud/webhook/corrections/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: [{
            reason: 'delete',
            id: correction.id,
            updated_by: 'admin@mutilife.co.za'
          }]
        })
      })
      setCorrections(prev => prev.filter(c => c.id !== id))
      toast.success('Correction deleted')
    } catch (error) {
      toast.error('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (correction: Correction) => {
    setEditingId(correction.id)
    setEditAnswer(correction.correct_answer)
    setEditTags(correction.tags.join(', '))
  }

  const handleSaveEdit = async (id: number) => {
    setSavingId(id)
    const correction = corrections.find(c => c.id === id)
    if (!correction) return
    try {
      await fetch('https://baemedi.app.n8n.cloud/webhook/corrections/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: [{
            reason: 'edit',
            id: correction.id,
            updated_by: 'admin@mutilife.co.za'
          }]
        })
      })
      setCorrections(prev => prev.map(c => 
        c.id === id ? { ...c, correct_answer: editAnswer, tags: editTags.split(',').map(t => t.trim()).filter(Boolean) } : c
      ))
      setEditingId(null)
      toast.success('Correction updated')
    } catch (error) {
      toast.error('Failed to update')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <button
          onClick={onBack}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back
        </button>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Add Correction</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Do you deliver on Sundays?"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer</label>
            <textarea
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="e.g., No, we deliver Monday to Saturday only."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="override">Override</option>
              <option value="append">Append</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., delivery, shipping"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {saving ? 'Saving...' : 'Add Correction'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Correction History</h3>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : corrections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No corrections yet</div>
        ) : (
          <div className="space-y-3">
            {corrections.map((correction) => (
              <div 
                key={correction.id} 
                className={`border border-gray-200 rounded-lg p-4 transition-all duration-300 ${
                  deletingId === correction.id ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                } ${
                  savingId === correction.id ? 'ring-2 ring-blue-400' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{correction.question}</p>
                    {editingId === correction.id ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          value={editAnswer}
                          onChange={(e) => setEditAnswer(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                        <input
                          type="text"
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          placeholder="Tags (comma-separated)"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mt-1">{correction.correct_answer}</p>
                        <div className="flex gap-2 mt-2">
                          {correction.tags?.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{tag}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {editingId === correction.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(correction.id)}
                          disabled={savingId === correction.id}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {savingId === correction.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(correction)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(correction.id)}
                          disabled={deletingId === correction.id}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                        >
                          {deletingId === correction.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
