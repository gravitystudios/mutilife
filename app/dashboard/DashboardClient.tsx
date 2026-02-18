'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import AllOrdersTab from '../components/AllOrdersTab'
import InProgressTab from '../components/InProgressTab'
import ChatbotTab from '../components/ChatbotTab'

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'chatbot'>('all')
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch (error) {
      toast.error('Logout failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <img src="/images/logo.avif" alt="Logo" className="h-8 sm:h-10 w-auto" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Orders Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="self-start sm:self-auto px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('all')}
              className={`${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              All Orders
            </button>
            <button
              onClick={() => setActiveTab('in-progress')}
              className={`${
                activeTab === 'in-progress'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              Orders in Progress
            </button>
            <button
              onClick={() => setActiveTab('chatbot')}
              className={`${
                activeTab === 'chatbot'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              Chatbot
            </button>
          </nav>
        </div>

        {activeTab === 'all' ? <AllOrdersTab /> : activeTab === 'in-progress' ? <InProgressTab /> : <ChatbotTab />}
      </div>
    </div>
  )
}
