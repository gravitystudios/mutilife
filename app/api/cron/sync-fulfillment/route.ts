import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  // Verify request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const bearerToken = process.env.PUDO_API_TOKEN
    if (!bearerToken) {
      return NextResponse.json({ error: 'PUDO_API_TOKEN not configured' }, { status: 500 })
    }

    const { data: orders, error } = await supabaseServer
      .from('orders_tracking')
      .select('id, order_number, waybill_no, customer_name, customer_phone, fulfillment_status')
      .not('waybill_no', 'is', null)
      .not('fulfillment_status', 'in', '("delivered","customer-collected","collected")')

    if (error) throw error

    const total = orders?.length || 0
    let updated = 0
    let failed = 0
    let notified = 0

    console.log(`[CRON] Starting sync for ${total} orders`)

    for (const order of orders || []) {
      try {
        await new Promise(resolve => setTimeout(resolve, 200))

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const res = await fetch(
          `https://api-pudo.co.za/api/v1/tracking/shipments/public?waybill=${order.waybill_no}`,
          {
            headers: { 'Authorization': `Bearer ${bearerToken}` },
            signal: controller.signal
          }
        )

        clearTimeout(timeoutId)

        if (res.ok) {
          const data = await res.json()
          if (data && data.status) {
            const oldStatus = order.fulfillment_status
            
            const { error: updateError, data: updatedOrder } = await supabaseServer
              .from('orders_tracking')
              .update({
                fulfillment_status: data.status,
                fulfillment_status_updated_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id)
              .select()
              .single()

            if (updateError) {
              console.error(`[CRON] DB update failed for order ${order.id}:`, updateError)
              failed++
            } else {
              console.log(`[CRON] Updated order ${order.order_number}: ${oldStatus} → ${data.status}`)
              updated++

              // Auto-notify if status changed to in-transit
              if (data.status === 'in-transit' && oldStatus !== 'in-transit' && updatedOrder) {
                const webhookUrl = process.env.N8N_WEBHOOK_URL
                if (webhookUrl) {
                  try {
                    await fetch(webhookUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: updatedOrder.customer_name,
                        number: updatedOrder.customer_phone,
                        orderNumber: updatedOrder.order_number,
                        waybill: updatedOrder.waybill_no
                      })
                    })
                    console.log(`[CRON] Sent notification for order ${order.order_number}`)
                    notified++
                  } catch (err) {
                    console.error(`[CRON] Notification failed for order ${order.order_number}:`, err)
                  }
                }
              }
            }
          } else {
            failed++
          }
        } else {
          failed++
        }
      } catch (err) {
        console.error(`[CRON] Sync failed for order ${order.id}:`, err)
        failed++
      }
    }

    const result = { 
      success: true, 
      total, 
      updated, 
      failed, 
      notified,
      timestamp: new Date().toISOString() 
    }
    
    console.log(`[CRON] Sync complete:`, result)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('[CRON] Sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync fulfillment status' },
      { status: 500 }
    )
  }
}
