'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface Order {
  id: number
  order_number: string
  waybill_no: string
  customer_name: string
  customer_phone: string
  order_status: string
}

interface Shipment {
  id: number
  custom_tracking_reference: string
  status: string
  delivery_contact: {
    name: string
    mobile_number: string
  }
  time_created: string
}

export default function TestTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [ordersRes, shipmentsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/pudo')
      ])

      if (!ordersRes.ok || !shipmentsRes.ok) throw new Error('Failed to fetch')

      const ordersData = await ordersRes.json()
      const shipmentsData = await shipmentsRes.json()

      setOrders(ordersData.orders || [])
      setShipments(shipmentsData.data || [])
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const associatedData = orders.map(order => {
    const shipment = shipments.find(s => 
      s.custom_tracking_reference === order.waybill_no
    )
    return { order, shipment }
  }).filter(item => item.shipment)

  console.log('Orders waybills:', orders.map(o => o.waybill_no))
  console.log('Shipments tracking:', shipments.map(s => s.custom_tracking_reference))
  console.log('Matches found:', associatedData.length)

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
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Test - Associated Orders & Shipments
        </h2>
        
        {associatedData.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">No associated data found</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Sample Order Waybills:</h3>
                <div className="text-xs space-y-1">
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id}>{o.waybill_no || 'NULL'}</div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Sample Shipment Tracking:</h3>
                <div className="text-xs space-y-1">
                  {shipments.slice(0, 5).map(s => (
                    <div key={s.id}>{s.custom_tracking_reference || 'NULL'}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waybill/Tracking</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PUDO Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PUDO Contact</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {associatedData.map(({ order, shipment }) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{order.order_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{order.waybill_no}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>{order.customer_name}</div>
                      <div className="text-xs text-gray-500">{order.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        {order.order_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded ${
                        shipment?.status === 'deposit-pending' ? 'bg-yellow-100 text-yellow-800' :
                        shipment?.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {shipment?.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>{shipment?.delivery_contact?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{shipment?.delivery_contact?.mobile_number || 'N/A'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
