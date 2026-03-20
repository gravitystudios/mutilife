import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const bearerToken = process.env.PUDO_API_TOKEN
        if (!bearerToken) {
          controller.enqueue(encoder.encode('data: {"error":"PUDO_API_TOKEN not configured"}\n\n'))
          controller.close()
          return
        }

        const { data: orders, error } = await supabaseServer
          .from('orders_tracking')
          .select('id, waybill_no')
          .not('waybill_no', 'is', null)

        if (error) throw error

        const total = orders?.length || 0
        let updated = 0
        let failed = 0
        let processed = 0

        controller.enqueue(encoder.encode(`data: {"total":${total},"started":true}\n\n`))

        for (const order of orders || []) {
          try {
            await new Promise(resolve => setTimeout(resolve, 200))

            const abortController = new AbortController()
            const timeoutId = setTimeout(() => abortController.abort(), 10000)

            const res = await fetch(
              `https://api-pudo.co.za/api/v1/tracking/shipments/public?waybill=${order.waybill_no}`,
              {
                headers: { 'Authorization': `Bearer ${bearerToken}` },
                signal: abortController.signal
              }
            )

            clearTimeout(timeoutId)

            if (res.ok) {
              const data = await res.json()
              if (data && data.status) {
                console.log(`Order ${order.id} - PUDO status: ${data.status}`)
                
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
                  console.error(`DB update failed for order ${order.id}:`, updateError)
                  failed++
                } else {
                  console.log(`✓ Updated order ${order.id} to ${data.status}`)
                  updated++
                  
                  // Auto-notify if status changed to in-transit
                  if (data.status === 'in-transit' && updatedOrder) {
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
                        console.log(`✓ Sent notification for order ${order.id}`)
                      } catch (err) {
                        console.error(`Notification failed for order ${order.id}:`, err)
                      }
                    }
                  }
                }
              } else {
                console.log(`Order ${order.id} - No status in PUDO response`)
                failed++
              }
            } else {
              console.log(`Order ${order.id} - PUDO API returned ${res.status}`)
              failed++
            }

            processed++
            
            if (processed % 10 === 0 || processed === total) {
              controller.enqueue(encoder.encode(`data: {"processed":${processed},"updated":${updated},"failed":${failed},"total":${total}}\n\n`))
            }
          } catch (err) {
            failed++
            processed++
          }
        }

        controller.enqueue(encoder.encode(`data: {"done":true,"processed":${processed},"updated":${updated},"failed":${failed},"total":${total}}\n\n`))
        controller.close()
      } catch (error) {
        controller.enqueue(encoder.encode(`data: {"error":"${error}"}\n\n`))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
