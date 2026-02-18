'use client'

import { useState } from 'react'
import EditCorePrompt from './EditCorePrompt'
import AddCorrection from './AddCorrection'

export default function ChatbotTab() {
  const [activeView, setActiveView] = useState<'menu' | 'editCore' | 'addCorrection'>('menu')

  if (activeView === 'editCore') {
    return <EditCorePrompt onBack={() => setActiveView('menu')} />
  }

  if (activeView === 'addCorrection') {
    return <AddCorrection onBack={() => setActiveView('menu')} />
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Chatbot Settings</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveView('editCore')}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Edit Core Knowledge</h3>
            <p className="text-sm text-gray-600">Modify the core knowledge base content</p>
          </button>

          <button
            onClick={() => setActiveView('addCorrection')}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Correction</h3>
            <p className="text-sm text-gray-600">Add corrections to the knowledge base</p>
          </button>
        </div>
      </div>
    </div>
  )
}
