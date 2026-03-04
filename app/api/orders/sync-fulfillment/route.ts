import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: orders, error } = await supabaseServer
      .from('orders_tracking')
      .select('id, waybill_no')
      .not('waybill_no', 'is', null)
      .is('fulfillment_status', null)
      .limit(20)

    if (error) throw error

    const bearerToken = process.env.PUDO_API_TOKEN
    if (!bearerToken) {
      return NextResponse.json({ error: 'PUDO_API_TOKEN not configured' }, { status: 500 })
    }

    let updated = 0
    let failed = 0

    for (const order of orders || []) {
      try {
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const res = await fetch(
          `https://api-pudo.co.za/api/v1/tracking/shipments/public?waybill=${order.waybill_no}`,
          {
            headers: {
              'Authorization': `Bearer ${bearerToken}`
            }
          }
        )

        if (!res.ok) {
          failed++
          continue
        }

        const data = await res.json()
        if (data && data.status) {
          const status = data.status

          await supabaseServer
            .from('orders_tracking')
            .update({
              fulfillment_status: status,
              fulfillment_status_updated_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)

          updated++
        }
      } catch {
        failed++
      }
    }

    return NextResponse.json({ updated, failed, total: orders?.length || 0 })
  } catch (error) {
    console.error('Fulfillment sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync fulfillment status' },
      { status: 500 }
    )
  }
}
