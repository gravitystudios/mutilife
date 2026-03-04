'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface InventoryItem {
  id: number
  name: string
  stock: number
  low_stock_threshold: number
  created_at: string
}

export default function InventoryTab() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [stock, setStock] = useState('')
  const [threshold, setThreshold] = useState('10')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editStock, setEditStock] = useState('')
  const [editThreshold, setEditThreshold] = useState('')

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory')
      if (!res.ok) throw new Error('Failed to fetch')
      const { data } = await res.json()
      setItems(data || [])
    } catch (error) {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!name.trim() || !stock) {
      toast.error('Name and stock are required')
      return
    }

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, stock: parseInt(stock), low_stock_threshold: parseInt(threshold) })
      })

      if (!res.ok) throw new Error('Failed to add')

      toast.success('Item added')
      setName('')
      setStock('')
      setThreshold('10')
      fetchInventory()
    } catch (error) {
      toast.error('Failed to add item')
    }
  }

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stock: parseInt(editStock), low_stock_threshold: parseInt(editThreshold) })
      })

      if (!res.ok) throw new Error('Failed to update')

      toast.success('Stock updated')
      setEditingId(null)
      fetchInventory()
    } catch (error) {
      toast.error('Failed to update stock')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return

    try {
      const res = await fetch('/api/inventory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (!res.ok) throw new Error('Failed to delete')

      toast.success('Item deleted')
      fetchInventory()
    } catch (error) {
      toast.error('Failed to delete item')
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
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Add Inventory Item</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Stock"
            className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            placeholder="Threshold"
            className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Inventory</h2>
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No items in inventory</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={item.stock <= item.low_stock_threshold ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                            {item.stock}
                          </span>
                          {item.stock <= item.low_stock_threshold && (
                            <div className="flex items-center gap-1">
                              <span className="text-red-600">⚠️</span>
                              <span className="text-xs text-red-600 font-medium">
                                {item.low_stock_threshold - item.stock >= 0 ? 'LOW' : `${item.stock} left`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <span className="text-gray-600">{item.low_stock_threshold}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === item.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(item.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingId(item.id)
                              setEditStock(item.stock.toString())
                              setEditThreshold(item.low_stock_threshold.toString())
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      )}
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
