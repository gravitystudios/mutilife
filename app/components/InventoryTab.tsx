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
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Stock"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="Threshold"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  {item.stock <= item.low_stock_threshold && (
                    <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full">⚠️ LOW</span>
                  )}
                </div>

                {editingId === item.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Stock</label>
                        <input type="number" value={editStock} onChange={(e) => setEditStock(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Threshold</label>
                        <input type="number" value={editThreshold} onChange={(e) => setEditThreshold(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleUpdate(item.id)}
                        className="py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">Save</button>
                      <button onClick={() => setEditingId(null)}
                        className="py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-gray-500">Stock</p>
                        <p className={`text-lg font-bold ${
                          item.stock <= item.low_stock_threshold ? 'text-red-600' : 'text-gray-900'
                        }`}>{item.stock}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Threshold</p>
                        <p className="text-lg font-bold text-gray-900">{item.low_stock_threshold}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(item.id); setEditStock(item.stock.toString()); setEditThreshold(item.low_stock_threshold.toString()) }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Edit</button>
                      <button onClick={() => handleDelete(item.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
