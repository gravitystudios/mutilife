'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface Transaction {
  id: number
  amount: string
  type: string
  transaction_date: string
  time_created: string
  description: string
  custom_tracking_reference?: string
  has_been_reversed: number
}

export default function AccountBalanceTab() {
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [fullSyncing, setFullSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState<string>('')
  const [threshold, setThreshold] = useState<string>('1000')
  const [savedThreshold, setSavedThreshold] = useState<number>(1000)

  useEffect(() => {
    fetchBalance()
    const balanceInterval = setInterval(fetchBalance, 60000)
    return () => {
      clearInterval(balanceInterval)
    }
  }, [])

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/balance')
      if (!res.ok) throw new Error('Failed to fetch')
      const { balance } = await res.json()
      setBalance(parseFloat(balance))
      setTransactions([])
    } catch (error) {
      toast.error('Failed to load balance')
    } finally {
      setLoading(false)
    }
  }

  const handleFullSync = async () => {
    setFullSyncing(true)
    setSyncProgress('Starting full sync...')
    try {
      const res = await fetch('/api/pudo/sync-all-transactions?full=true', { method: 'POST' })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value)
          const lines = text.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              if (data.error) {
                toast.error('Sync failed')
                break
              }
              if (data.done) {
                toast.success(data.message || `Synced ${data.total} transactions`)
                setSyncProgress('')
                await fetchBalance()
              } else if (data.synced) {
                setSyncProgress(`${data.synced}/${data.total || '?'} (page ${data.page})`)
              }
            }
          }
        }
      }
    } catch (error) {
      toast.error('Sync failed')
      setSyncProgress('')
    } finally {
      setFullSyncing(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncProgress('Starting...')
    try {
      const res = await fetch('/api/pudo/sync-all-transactions', { method: 'POST' })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value)
          const lines = text.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              if (data.error) {
                toast.error('Sync failed')
                break
              }
              if (data.done) {
                toast.success(data.message || `Synced ${data.total} transactions`)
                setSyncProgress('')
                await fetchBalance()
              } else if (data.synced) {
                setSyncProgress(`${data.synced}/${data.total || '?'} (page ${data.page})`)
              }
            }
          }
        }
      }
    } catch (error) {
      toast.error('Sync failed')
      setSyncProgress('')
    } finally {
      setSyncing(false)
    }
  }

  const handleSaveThreshold = async () => {
    const value = parseFloat(threshold)
    if (isNaN(value)) {
      toast.error('Invalid threshold')
      return
    }
    try {
      const res = await fetch('/api/pudo/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold })
      })
      if (!res.ok) throw new Error('Failed to save')
      setSavedThreshold(value)
      toast.success('Threshold saved')
    } catch (error) {
      toast.error('Failed to save threshold')
    }
  }

  const isLowBalance = balance < savedThreshold

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Account Balance</h2>
          <button
            onClick={fetchBalance}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Refresh
          </button>
        </div>

        <div className={`p-6 rounded-lg ${isLowBalance ? 'bg-red-50 border-2 border-red-500' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className={`text-3xl font-bold ${isLowBalance ? 'text-red-600' : 'text-green-600'}`}>
                R {balance.toFixed(2)}
              </p>
            </div>
            {isLowBalance && (
              <div className="text-red-600">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          {isLowBalance && (
            <p className="mt-2 text-sm text-red-600 font-medium">
              ⚠️ Balance is below threshold of R {savedThreshold.toFixed(2)}
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="Low balance threshold"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSaveThreshold}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Set Threshold
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No transactions</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.slice(0, 20).map((t) => {
                  const amount = parseFloat(t.amount)
                  const isReversed = t.has_been_reversed === 1
                  const dateTime = new Date(t.time_created).toLocaleString('en-ZA', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  return (
                    <tr key={t.id} className={isReversed ? 'bg-gray-100 opacity-60' : ''}>
                      <td className="px-4 py-3 text-sm text-gray-900">{dateTime}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {t.type} {isReversed && <span className="text-xs text-red-600">(REVERSED)</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {t.custom_tracking_reference || '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${isReversed ? 'line-through text-gray-400' : amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R {amount.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
