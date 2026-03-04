'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function PudoShipmentsTab() {
  const [shipments, setShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShipments()
  }, [])

  const fetchShipments = async () => {
    try {
      const res = await fetch('/api/pudo')
      if (!res.ok) throw new Error('Failed to fetch')
      const { data } = await res.json()
      console.log('PUDO API Response:', data)
      setShipments(data || [])
    } catch (error) {
      toast.error('Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }

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
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">PUDO Shipments</h2>
        
        {shipments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No shipments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Collection</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shipments.map((shipment: any) => (
                  <tr key={shipment.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{shipment.custom_tracking_reference || shipment.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded ${
                        shipment.status === 'deposit-pending' ? 'bg-yellow-100 text-yellow-800' :
                        shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {shipment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{shipment.service_level_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{shipment.collection_address?.local_area || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div>{shipment.delivery_contact?.name}</div>
                      <div className="text-xs text-gray-500">{shipment.delivery_contact?.mobile_number}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{shipment.delivery_address?.local_area || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{shipment.time_created}</td>
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
