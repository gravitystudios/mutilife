import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderNumber } = await req.json()

  try {
    const { data: order } = await supabaseServer
      .from('orders_tracking')
      .select('*')
      .eq('order_number', orderNumber)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: 'N8N_WEBHOOK_URL not configured' }, { status: 500 })
    }

    const payload = {
      name: order.customer_name?.trim(),
      number: order.customer_phone?.trim(),
      orderNumber: order.order_number?.trim(),
      waybill: order.waybill_no?.trim()
    }

    console.log('Testing webhook with payload:', payload)

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const result = await res.json()
    console.log('Webhook response:', result)

    return NextResponse.json({ 
      success: res.ok, 
      status: res.status,
      payload,
      response: result 
    })
  } catch (error) {
    console.error('Test webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}