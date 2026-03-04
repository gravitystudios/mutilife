import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('inventory')
      .select('*')
      .order('stock', { ascending: true })

    if (error) throw error

    const lowStockItems = data?.filter(item => item.stock <= item.low_stock_threshold) || []

    return NextResponse.json({ 
      low_stock_items: lowStockItems,
      count: lowStockItems.length
    })
  } catch (error) {
    console.error('Low stock fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch low stock items' },
      { status: 500 }
    )
  }
}
