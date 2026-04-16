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
      .select('id, waybill_no, custom_tracking_reference')
      .or('waybill_no.not.is.null,custom_tracking_reference.not.is.null')
      .not('fulfillment_status', 'in', '("delivered","customer-collected","collected")')

    if (error) throw error

    const bearerToken = process.env.PUDO_API_TOKEN
    if (!bearerToken) {
      return NextResponse.json({ error: 'PUDO_API_TOKEN not configured' }, { status: 500 })
    }

    let updated = 0
    let failed = 0

    for (const order of orders || []) {
      try {
        const trackingRef = order.waybill_no || order.custom_tracking_reference
        if (!trackingRef) {
          failed++
          continue
        }
        
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const res = await fetch(
          `https://api-pudo.co.za/api/v1/tracking/shipments/public?waybill=${trackingRef}`,
          {
            headers: {
              'Authorization': `Bearer ${bearerToken}`
            },
            signal: controller.signal
          }
        )
        
        clearTimeout(timeoutId)

        if (!res.ok) {
          console.error(`PUDO API error for ${trackingRef}: ${res.status}`)
          failed++
          continue
        }

        const data = await res.json()
        if (data && data.status) {
          await supabaseServer
            .from('orders_tracking')
            .update({
              fulfillment_status: data.status,
              fulfillment_status_updated_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id)

          updated++
        } else {
          failed++
        }
      } catch (err) {
        console.error(`Sync failed for order ${order.id}:`, err)
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
