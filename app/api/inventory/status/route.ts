import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  try {
    const { data: items, error } = await supabaseServer
      .from('inventory')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    const inventory = items?.map(item => ({
      name: item.name,
      stock: item.stock,
      low_stock_threshold: item.low_stock_threshold,
      status: item.stock <= item.low_stock_threshold ? 'low' : 'ok',
      updated_at: item.updated_at
    }))

    return NextResponse.json({ inventory })
  } catch (error) {
    console.error('Inventory status error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
