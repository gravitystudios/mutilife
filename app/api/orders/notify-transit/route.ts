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

  // Check Shopify fulfillment status before firing
  const shop = process.env.SHOPIFY_SHOP
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-10'

  if (shop && accessToken && body.orderNumber) {
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
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 502 })
  }

  const result = await res.json()
  const userErrors = result?.data?.fulfillmentCreateV2?.userErrors
  const fulfilled = Array.isArray(userErrors) && userErrors.length === 0

  if (fulfilled) {
    await supabaseServer
      .from('orders_tracking')
      .update({ shopify_fulfilled: true })
      .eq('order_number', body.orderNumber.trim())
  }

  return NextResponse.json({ success: true, fulfilled })
}
