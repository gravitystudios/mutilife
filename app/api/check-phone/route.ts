import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    const { data } = await supabaseServer
      .from('orders_tracking')
      .select('id')
      .eq('customer_phone', phone)
      .limit(1)

    return NextResponse.json({ exists: !!(data && data.length > 0) })
  } catch (error) {
    console.error('Check phone error:', error)
    return NextResponse.json({ error: 'Failed to check phone' }, { status: 500 })
  }
}