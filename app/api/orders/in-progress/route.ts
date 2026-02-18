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
      .or('order_status.eq.NOT_DROPPED_OFF,order_status.eq.NOT_COLLECTED,order_status.eq.NOT_UPLOADED')
      .order('created_at', { ascending: false })

    if (error) throw error

    const delivery = data?.filter(order => 
      order.collection_method === 'DELIVERY' && 
      order.order_status === 'NOT_DROPPED_OFF'
    ) || []
    const collection = data?.filter(order => 
      order.collection_method === 'COLLECTION' && 
      order.order_status === 'NOT_COLLECTED'
    ) || []
    const manualUpload = data?.filter(order => 
      order.order_status === 'NOT_UPLOADED'
    ) || []

    return NextResponse.json({ delivery, collection, manualUpload })
  } catch (error) {
    console.error('In-progress orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch in-progress orders' },
      { status: 500 }
    )
  }
}
