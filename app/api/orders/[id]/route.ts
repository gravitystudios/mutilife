import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { order_status } = await request.json()
    const id = params.id

    if (!order_status || !['DROPPED_OFF', 'COLLECTED', 'UPLOADED'].includes(order_status)) {
      return NextResponse.json(
        { error: 'Invalid order_status' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('orders_tracking')
      .update({
        order_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ order: data })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
