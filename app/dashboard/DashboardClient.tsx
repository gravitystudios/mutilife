'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import AllOrdersTab from '../components/AllOrdersTab'
import InProgressTab from '../components/InProgressTab'
import ChatbotTab from '../components/ChatbotTab'
import PudoShipmentsTab from '../components/PudoShipmentsTab'
import TestTab from '../components/TestTab'
import InventoryTab from '../components/InventoryTab'

import AccountBalanceTab from '../components/AccountBalanceTab'
import FulfillmentTab from '../components/FulfillmentTab'

export default function DashboardClient() {
  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'chatbot' | 'inventory' | 'fulfillment'>('all')
  const [inProgressCount, setInProgressCount] = useState<number | null>(null)
  const [fulfillmentCount, setFulfillmentCount] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/orders/in-progress')
      .then(r => r.json())
      .then(d => setInProgressCount((d.delivery?.length || 0) + (d.collection?.length || 0) + (d.manualUpload?.length || 0)))
      .catch(() => {})
    fetch('/api/orders/fulfillment')
      .then(r => r.json())
      .then(d => setFulfillmentCount((d.inTransit?.length || 0) + (d.inLocker?.length || 0) + (d.outForDelivery?.length || 0)))
      .catch(() => {})
  }, [])

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
            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-red-600">{inProgressCount ?? '—'}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">In Transit</p>
            <p className="text-2xl font-bold text-orange-500">{fulfillmentCount ?? '—'}</p>
          </div>
        </div>

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
              Orders in Progress {inProgressCount !== null && inProgressCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">{inProgressCount}</span>
              )}
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
            <button
              onClick={() => setActiveTab('inventory')}
              className={`${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('fulfillment')}
              className={`${
                activeTab === 'fulfillment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition`}
            >
              Fulfillment {fulfillmentCount !== null && fulfillmentCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-orange-500 text-white">{fulfillmentCount}</span>
              )}
            </button>
          </nav>
        </div>

        {activeTab === 'all' ? <AllOrdersTab /> : activeTab === 'in-progress' ? <InProgressTab /> : activeTab === 'inventory' ? <InventoryTab /> : activeTab === 'fulfillment' ? <FulfillmentTab /> : <ChatbotTab />}
      </div>
    </div>
  )
}
