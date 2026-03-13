import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'N8N_WEBHOOK_URL not configured' }, { status: 500 })
  }

  const body = await req.json()
  console.log('Received payload:', body)

  // Validate required fields
  if (!body.orderNumber || !body.name || !body.number) {
    console.error('Missing required fields:', { orderNumber: body.orderNumber, name: body.name, number: body.number })
    return NextResponse.json({ error: 'Missing required fields: orderNumber, name, number' }, { status: 400 })
  }

  // Check Shopify fulfillment status before firing
  const shop = process.env.SHOPIFY_SHOP
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-10'

  if (shop && accessToken && body.orderNumber) {
    try {
      const shopifyRes = await fetch(
        `https://${shop}/admin/api/${apiVersion}/orders.json?name=%23${body.orderNumber.trim()}&status=any`,
        { headers: { 'X-Shopify-Access-Token': accessToken } }
      )
      if (shopifyRes.ok) {
        const { orders } = await shopifyRes.json()
        if (orders?.[0]?.fulfillment_status === 'fulfilled') {
          await supabaseServer
            .from('orders_tracking')
            .update({ shopify_fulfilled: true })
            .eq('order_number', body.orderNumber.trim())
          return NextResponse.json({ skipped: true, reason: 'Order already fulfilled in Shopify' })
        }
      }
    } catch (error) {
      console.error('Shopify check failed:', error)
    }
  }

  console.log('Sending to webhook:', webhookUrl)
  console.log('Payload being sent:', JSON.stringify(body, null, 2))

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    console.log('Webhook response status:', res.status)
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('Webhook failed with response:', errorText)
      return NextResponse.json({ error: `Webhook failed: ${res.status} ${errorText}` }, { status: 502 })
    }

    const result = await res.json()
    console.log('Webhook response:', result)
    
    const userErrors = result?.data?.fulfillmentCreateV2?.userErrors
    const fulfilled = Array.isArray(userErrors) && userErrors.length === 0

    if (fulfilled) {
      await supabaseServer
        .from('orders_tracking')
        .update({ shopify_fulfilled: true })
        .eq('order_number', body.orderNumber.trim())
    }

    return NextResponse.json({ success: true, fulfilled, webhookResponse: result })
  } catch (error) {
    console.error('Webhook request failed:', error)
    return NextResponse.json({ error: `Webhook request failed: ${error}` }, { status: 502 })
  }
}
