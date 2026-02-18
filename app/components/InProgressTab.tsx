'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Order } from '@/lib/supabaseServer'

export default function InProgressTab() {
  const [deliveryOrders, setDeliveryOrders] = useState<Order[]>([])
  const [collectionOrders, setCollectionOrders] = useState<Order[]>([])
  const [manualUploadOrders, setManualUploadOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set())

  const fetchInProgressOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders/in-progress')
      if (!res.ok) throw new Error('Failed to fetch orders')

      const data = await res.json()
      setDeliveryOrders(data.delivery)
      setCollectionOrders(data.collection)
      setManualUploadOrders(data.manualUpload)
    } catch (error) {
      toast.error('Failed to load in-progress orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInProgressOrders()
  }, [])

  const handleUpdateStatus = async (orderId: number, newStatus: 'DROPPED_OFF' | 'COLLECTED' | 'UPLOADED', orderType: 'delivery' | 'collection' | 'upload') => {
    setUpdatingIds(prev => new Set(prev).add(orderId))

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: newStatus })
      })

      if (!res.ok) throw new Error('Failed to update order')

      // Optimistic UI update
      if (orderType === 'delivery') {
        setDeliveryOrders(prev => prev.filter(order => order.id !== orderId))
      } else if (orderType === 'collection') {
        setCollectionOrders(prev => prev.filter(order => order.id !== orderId))
      } else {
        setManualUploadOrders(prev => prev.filter(order => order.id !== orderId))
      }

      toast.success('Order updated successfully')
    } catch (error) {
      toast.error('Failed to update order')
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const OrderCard = ({ order, orderType }: { order: Order; orderType: 'delivery' | 'collection' | 'upload' }) => {
    const isUpdating = updatingIds.has(order.id)
    const buttonText = orderType === 'delivery' ? 'Dropped-off' : orderType === 'collection' ? 'Collected' : 'Uploaded'
    const newStatus = orderType === 'delivery' ? 'DROPPED_OFF' : orderType === 'collection' ? 'COLLECTED' : 'UPLOADED'

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition">
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Order #{order.order_number}</h3>
            <p className="text-xs sm:text-sm text-gray-500">{format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}</p>
          </div>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            {order.order_status}
          </span>
        </div>

        <div className="space-y-2 mb-3 sm:mb-4">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-700">{order.customer_name}</p>
            <p className="text-xs sm:text-sm text-gray-500">{order.customer_phone}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{order.entered_address}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-700 font-medium">Items:</p>
            {order.line_items && Array.isArray(order.line_items) ? (
              <ul className="text-xs sm:text-sm text-gray-600 list-disc list-inside">
                {order.line_items.map((item: any, idx: number) => (
                  <li key={idx}>{item.name} x {item.quantity}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs sm:text-sm text-gray-600">No items</p>
            )}
          </div>
          {orderType === 'delivery' && (
            <>
              {order.waybill_no && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-700">
                    <span className="font-medium">Waybill:</span> {order.waybill_no}
                  </p>
                </div>
              )}
              {order.pin && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-700">
                    <span className="font-medium">PIN:</span> {order.pin}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <button
          onClick={() => handleUpdateStatus(order.id, newStatus, orderType)}
          disabled={isUpdating}
          className={`w-full py-2 px-4 rounded-md text-xs sm:text-sm font-medium transition ${
            isUpdating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isUpdating ? 'Updating...' : buttonText}
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Delivery (In Progress)</h2>
          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
            {deliveryOrders.length} orders
          </span>
        </div>
        {deliveryOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center text-sm sm:text-base text-gray-500">
            No delivery orders in progress
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {deliveryOrders.map(order => (
              <OrderCard key={order.id} order={order} orderType="delivery" />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Collection (In Progress)</h2>
          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
            {collectionOrders.length} orders
          </span>
        </div>
        {collectionOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center text-sm sm:text-base text-gray-500">
            No collection orders in progress
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {collectionOrders.map(order => (
              <OrderCard key={order.id} order={order} orderType="collection" />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Manual Upload (In Progress)</h2>
          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
            {manualUploadOrders.length} orders
          </span>
        </div>
        {manualUploadOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center text-sm sm:text-base text-gray-500">
            No manual upload orders in progress
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {manualUploadOrders.map(order => (
              <OrderCard key={order.id} order={order} orderType="upload" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
