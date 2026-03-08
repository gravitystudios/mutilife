'use client'

import { useState, useEffect } from 'react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import toast from 'react-hot-toast'
import { Order } from '@/lib/supabaseServer'

type TimeFilter = 'today' | '7days' | '30days' | 'custom'

export default function AllOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7days')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [pudoStatus, setPudoStatus] = useState<string | null>(null)
  const [shopifyStatus, setShopifyStatus] = useState<string | null>(null)
  const [checkingPudo, setCheckingPudo] = useState(false)
  const [checkingShopify, setCheckingShopify] = useState(false)
  const limit = 50

  const getDateRange = () => {
    const now = new Date()
    let from: Date
    let to: Date = endOfDay(now)

    switch (timeFilter) {
      case 'today':
        from = startOfDay(now)
        break
      case '7days':
        from = startOfDay(subDays(now, 7))
        break
      case '30days':
        from = startOfDay(subDays(now, 30))
        break
      case 'custom':
        if (!customFrom || !customTo) return null
        from = new Date(customFrom)
        to = endOfDay(new Date(customTo))
        break
      default:
        from = startOfDay(subDays(now, 7))
    }

    return {
      from: from.toISOString(),
      to: to.toISOString()
    }
  }

  const fetchOrders = async (reset = false) => {
    setLoading(true)
    try {
      const dateRange = getDateRange()
      if (!dateRange) {
        toast.error('Please select valid date range')
        setLoading(false)
        return
      }

      const currentOffset = reset ? 0 : offset
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
        search,
        limit: limit.toString(),
        offset: currentOffset.toString()
      })

      const res = await fetch(`/api/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')

      const data = await res.json()
      
      if (reset) {
        setOrders(data.orders)
        setOffset(0)
      } else {
        setOrders(prev => [...prev, ...data.orders])
      }
      
      setTotal(data.total)
    } catch (error) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(true)
  }, [timeFilter, customFrom, customTo])

  const checkPudo = async (waybill: string) => {
    setCheckingPudo(true)
    setPudoStatus(null)
    try {
      const res = await fetch(`/api/pudo?waybill=${waybill}`)
      const data = await res.json()
      setPudoStatus(data?.status || data?.data?.[0]?.status || 'No status found')
    } catch {
      setPudoStatus('Failed to fetch')
    } finally {
      setCheckingPudo(false)
    }
  }

  const checkShopify = async (orderNumber: string) => {
    setCheckingShopify(true)
    setShopifyStatus(null)
    try {
      const res = await fetch(`/api/shopify?order_number=%23${orderNumber.trim()}`)
      const data = await res.json()
      setShopifyStatus(data?.order?.fulfillment_status || 'unfulfilled')
    } catch {
      setShopifyStatus('Failed to fetch')
    } finally {
      setCheckingShopify(false)
    }
  }

  const handleSearch = () => {
    fetchOrders(true)
  }

  const loadMore = () => {
    setOffset(prev => prev + limit)
    fetchOrders(false)
  }

  useEffect(() => {
    if (offset > 0) {
      fetchOrders(false)
    }
  }, [offset])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition ${
                timeFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('7days')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition ${
                timeFilter === '7days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setTimeFilter('30days')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition ${
                timeFilter === '30days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setTimeFilter('custom')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition ${
                timeFilter === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Range
            </button>
          </div>

          {timeFilter === 'custom' && (
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search by order number, customer name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {loading && offset === 0 ? (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <p className="text-xs sm:text-sm text-gray-600">
                Showing {orders.length} of {total} orders
              </p>
            </div>
            <div className="overflow-x-auto">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PUDO Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shopify
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedOrder(order); setPudoStatus(null); setShopifyStatus(null) }}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.order_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {order.delivery_type || 'Unavailable'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {order.order_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {order.fulfillment_status ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                              {order.fulfillment_status}
                            </span>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.shopify_fulfilled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {order.shopify_fulfilled ? 'Fulfilled' : 'Unfulfilled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">#{order.order_number}</h3>
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {order.order_status}
                        </span>
                        {order.fulfillment_status && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            {order.fulfillment_status}
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.shopify_fulfilled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {order.shopify_fulfilled ? 'Fulfilled' : 'Unfulfilled'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>{format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}</p>
                      <p className="capitalize">{order.delivery_type || 'Unavailable'}</p>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="w-full mt-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {orders.length < total && (
            <div className="flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-4 sm:px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order #{selectedOrder.order_number}</h2>
                  <p className="text-sm text-gray-500">{format(new Date(selectedOrder.created_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
                <button onClick={() => { setSelectedOrder(null); setPudoStatus(null); setShopifyStatus(null) }} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                    {selectedOrder.order_status}
                  </span>
                  {selectedOrder.fulfillment_status && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                      {selectedOrder.fulfillment_status}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {selectedOrder.waybill_no && (
                    <button
                      onClick={() => checkPudo(selectedOrder.waybill_no!)}
                      disabled={checkingPudo}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition"
                    >
                      {checkingPudo ? 'Checking...' : 'Check PUDO Status'}
                    </button>
                  )}
                  <button
                    onClick={() => checkShopify(selectedOrder.order_number)}
                    disabled={checkingShopify}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition"
                  >
                    {checkingShopify ? 'Checking...' : 'Check Shopify Status'}
                  </button>
                </div>

                {pudoStatus && (
                  <p className="text-sm text-purple-700"><span className="font-medium">PUDO:</span> {pudoStatus}</p>
                )}
                {shopifyStatus && (
                  <p className="text-sm text-green-700"><span className="font-medium">Shopify:</span> {shopifyStatus}</p>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer Information</h3>
                  <p className="text-sm text-gray-900">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Address</h3>
                  <p className="text-sm text-gray-600">{selectedOrder.entered_address}</p>
                  {selectedOrder.delivery_type === 'Pudo Locker to Locker' && selectedOrder.locker_name && (
                    <p className="text-sm text-gray-600 mt-1">Locker: {selectedOrder.locker_name}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Items</h3>
                  {selectedOrder.line_items && Array.isArray(selectedOrder.line_items) ? (
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {selectedOrder.line_items.map((item: any, idx: number) => (
                        <li key={idx}>{item.name} x {item.quantity}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">No items</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Delivery Method</h3>
                  <p className="text-sm text-gray-600 capitalize">{selectedOrder.delivery_type || 'Unavailable'}</p>
                </div>

                {selectedOrder.collection_method === 'DELIVERY' && (
                  <>
                    {selectedOrder.waybill_no && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Waybill</h3>
                        <p className="text-sm text-gray-600">{selectedOrder.waybill_no}</p>
                      </div>
                    )}
                    {selectedOrder.pin && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">PIN</h3>
                        <p className="text-sm text-gray-600">{selectedOrder.pin}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
