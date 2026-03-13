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
        {order.waybill_no && <p className="text-sm text-gray-600"><span className="font-medium">Waybill:</span> {order.waybill_no}</p>}
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
      <Section title="In Transit" orders={inTransit} showNotify />
      <Section title="In Locker" orders={inLocker} />
      <Section title="Out for Delivery" orders={outForDelivery} />
    </div>
  )
}
