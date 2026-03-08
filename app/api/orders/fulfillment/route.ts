import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseServer
      .from('orders_tracking')
      .select('*')
      .in('fulfillment_status', ['in-transit', 'in-locker', 'out-for-delivery'])
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      inTransit: data?.filter(o => o.fulfillment_status === 'in-transit') || [],
      inLocker: data?.filter(o => o.fulfillment_status === 'in-locker') || [],
      outForDelivery: data?.filter(o => o.fulfillment_status === 'out-for-delivery') || []
    })
  } catch (error) {
    console.error('Fulfillment orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch fulfillment orders' }, { status: 500 })
  }
}
