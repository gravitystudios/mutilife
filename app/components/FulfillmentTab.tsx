'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Order } from '@/lib/supabaseServer'

export default function FulfillmentTab() {
  const [inTransit, setInTransit] = useState<Order[]>([])
  const [inLocker, setInLocker] = useState<Order[]>([])
  const [outForDelivery, setOutForDelivery] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [notifyingIds, setNotifyingIds] = useState<Set<number>>(new Set())
  const [notifiedIds, setNotifiedIds] = useState<Set<number>>(new Set())
  const [syncing, setSyncing] = useState(false)
  const [trackingDetails, setTrackingDetails] = useState<Record<number, any>>({})
  const [syncProgress, setSyncProgress] = useState({ updated: 0, total: 0 })
  const [syncingAll, setSyncingAll] = useState(false)
  const [syncAllProgress, setSyncAllProgress] = useState({ processed: 0, updated: 0, failed: 0, total: 0 })

  useEffect(() => {
    fetch('/api/orders/fulfillment')
      .then(r => r.json())
      .then(data => {
        setInTransit(data.inTransit)
        setInLocker(data.inLocker)
        setOutForDelivery(data.outForDelivery)
      })
      .catch(() => toast.error('Failed to load fulfillment orders'))
      .finally(() => setLoading(false))
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setSyncProgress({ updated: 0, total: 0 })
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)
      
      const res = await fetch('/api/orders/sync-fulfillment', { 
        method: 'POST',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const data = await res.json()
      if (res.ok) {
        setSyncProgress({ updated: data.updated, total: data.total })
        toast.success(`Synced ${data.updated}/${data.total} orders (${data.failed} failed)`)
        const refresh = await fetch('/api/orders/fulfillment')
        const refreshData = await refresh.json()
        setInTransit(refreshData.inTransit)
        setInLocker(refreshData.inLocker)
        setOutForDelivery(refreshData.outForDelivery)
      } else {
        toast.error(data.error || 'Sync failed')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        toast.error('Sync timeout - try again')
      } else {
        toast.error('Sync failed')
      }
    } finally {
      setSyncing(false)
    }
  }

  const fetchTracking = async (waybill: string, orderId: number) => {
    try {
      const res = await fetch(`/api/pudo?waybill=${waybill}`)
      const data = await res.json()
      if (res.ok && data.data) {
        setTrackingDetails(prev => ({ ...prev, [orderId]: data.data }))
      }
    } catch {
      toast.error('Failed to fetch tracking')
    }
  }

  const handleSyncAll = async () => {
    setSyncingAll(true)
    setSyncAllProgress({ processed: 0, updated: 0, failed: 0, total: 0 })
    
    try {
      const res = await fetch('/api/orders/sync-all-fulfillment', { method: 'POST' })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) throw new Error('No reader')
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (data.error) {
              toast.error(data.error)
              break
            }
            if (data.total) setSyncAllProgress(prev => ({ ...prev, total: data.total }))
            if (data.processed) setSyncAllProgress(data)
            if (data.done) {
              toast.success(`Sync complete: ${data.updated} updated, ${data.failed} failed`)
              const refresh = await fetch('/api/orders/fulfillment')
              const refreshData = await refresh.json()
              setInTransit(refreshData.inTransit)
              setInLocker(refreshData.inLocker)
              setOutForDelivery(refreshData.outForDelivery)
            }
          }
        }
      }
    } catch (err) {
      toast.error('Sync all failed')
    } finally {
      setSyncingAll(false)
    }
  }

  const handleNotify = async (order: Order) => {
    setNotifyingIds(prev => new Set(prev).add(order.id))
    
    const payload = {
      name: order.customer_name?.trim(),
      number: order.customer_phone?.trim(),
      orderNumber: order.order_number?.trim(),
      waybill: order.waybill_no?.trim()
    }
    
    console.log('Sending notification payload:', payload)
    
    try {
      const res = await fetch('/api/orders/notify-transit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const result = await res.json()
      console.log('API response:', result)
      
      if (!res.ok) {
        console.error('API error:', result)
        throw new Error(result.error || `HTTP ${res.status}`)
      }
      
      if (result.skipped) {
        toast('Order already fulfilled in Shopify', { icon: '⚠️' })
        setNotifiedIds(prev => new Set(prev).add(order.id))
      } else {
        toast.success(`Notified for order #${order.order_number}`)
        setNotifiedIds(prev => new Set(prev).add(order.id))
      }
    } catch (error) {
      console.error('Notification failed:', error)
      toast.error(`Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setNotifyingIds(prev => { const s = new Set(prev); s.delete(order.id); return s })
    }
  }

  const OrderCard = ({ order, showNotify }: { order: Order; showNotify?: boolean }) => {
    const isNotified = notifiedIds.has(order.id)
    const tracking = trackingDetails[order.id]
    return (
    <div className={`bg-white border rounded-lg p-3 sm:p-4 hover:shadow-md transition ${
      isNotified ? 'border-gray-200 opacity-50' : 'border-gray-200'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Order #{order.order_number}</h3>
          <p className="text-xs text-gray-500">{format(new Date(order.updated_at), 'MMM d, yyyy HH:mm')}</p>
        </div>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {order.fulfillment_status}
        </span>
      </div>
      <div className="space-y-1 mb-3">
        <p className="text-sm font-medium text-gray-700">{order.customer_name}</p>
        <p className="text-sm text-gray-500">{order.customer_phone}</p>
        {order.waybill_no && (
          <div>
            <p className="text-sm text-gray-600"><span className="font-medium">Waybill:</span> {order.waybill_no}</p>
            <button
              onClick={() => fetchTracking(order.waybill_no!, order.id)}
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              {tracking ? 'Refresh Tracking' : 'View Tracking'}
            </button>
          </div>
        )}
        {tracking && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
            <p><span className="font-medium">Status:</span> {tracking.status}</p>
            {tracking.tracking_events?.slice(0, 3).map((event: any, i: number) => (
              <p key={i} className="text-gray-600">{event.date}: {event.status}</p>
            ))}
          </div>
        )}
      </div>
      {showNotify && (
        <button
          onClick={() => handleNotify(order)}
          disabled={notifyingIds.has(order.id) || isNotified}
          className={`w-full py-2 px-4 rounded-md text-sm font-medium transition ${
            isNotified ? 'bg-gray-300 text-gray-500 cursor-not-allowed' :
            notifyingIds.has(order.id) ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isNotified ? 'Notified ✓' : notifyingIds.has(order.id) ? 'Notifying...' : 'Notify Customer'}
        </button>
      )}
    </div>
    )
  }

  const Section = ({ title, orders, showNotify }: { title: string; orders: Order[]; showNotify?: boolean }) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{orders.length} orders</span>
      </div>
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-sm text-gray-500">No orders</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {orders.map(order => <OrderCard key={order.id} order={order} showNotify={showNotify} />)}
        </div>
      )}
    </div>
  )

  if (loading) return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex justify-end items-center gap-4">
        {syncProgress.total > 0 && (
          <span className="text-sm text-gray-600">
            {syncProgress.updated}/{syncProgress.total} synced
          </span>
        )}
        {syncingAll && syncAllProgress.total > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-48 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${(syncAllProgress.processed / syncAllProgress.total) * 100}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {Math.round((syncAllProgress.processed / syncAllProgress.total) * 100)}% ({syncAllProgress.processed}/{syncAllProgress.total})
            </span>
          </div>
        )}
        <button
          onClick={handleSync}
          disabled={syncing || syncingAll}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium flex items-center gap-2"
        >
          {syncing && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {syncing ? 'Syncing...' : 'Sync 100 Orders'}
        </button>
        <button
          onClick={handleSyncAll}
          disabled={syncing || syncingAll}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium flex items-center gap-2"
        >
          {syncingAll && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {syncingAll ? 'Syncing All...' : 'Sync All Orders'}
        </button>
      </div>
      <Section title="In Transit" orders={inTransit} showNotify />
      <Section title="In Locker" orders={inLocker} />
      <Section title="Out for Delivery" orders={outForDelivery} />
    </div>
  )
}
