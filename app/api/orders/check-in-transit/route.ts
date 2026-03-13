import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: orders } = await supabaseServer
      .from('orders_tracking')
      .select('*')
      .eq('fulfillment_status', 'in-transit')

    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: 'N8N_WEBHOOK_URL not configured' }, { status: 500 })
    }

    let sent = 0
    for (const order of orders || []) {
      try {
        const payload = {
          name: order.customer_name?.trim(),
          number: order.customer_phone?.trim(),
          orderNumber: order.order_number?.trim(),
          waybill: order.waybill_no?.trim()
        }

        console.log(`Sending webhook for order ${order.order_number}`)
        
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (res.ok) {
          sent++
        }
      } catch (error) {
        console.error(`Failed to send webhook for ${order.order_number}:`, error)
      }
    }

    return NextResponse.json({ sent, total: orders?.length || 0 })
  } catch (error) {
    console.error('Check in-transit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}