import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const { phone, duration } = await request.json()

    if (!phone || !duration) {
      return NextResponse.json({ error: 'Phone and duration required' }, { status: 400 })
    }

    const { data: orders } = await supabaseServer
      .from('orders_tracking')
      .select('customer_name, customer_phone, created_at')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 })
    }

    const lastOrder = orders[0]
    const lastPurchaseDate = new Date(lastOrder.created_at)
    const daysSinceLastPurchase = Math.floor((Date.now() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceLastPurchase >= duration) {
      return NextResponse.json({
        name: lastOrder.customer_name,
        number: lastOrder.customer_phone,
        duration: duration
      })
    }

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Check customer error:', error)
    return NextResponse.json({ error: 'Failed to check customer' }, { status: 500 })
  }
}
