import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST() {
  const bearerToken = process.env.PUDO_API_TOKEN
  if (!bearerToken) {
    return NextResponse.json({ error: 'PUDO_API_TOKEN not configured' }, { status: 500 })
  }

  const { data: orders, error } = await supabaseServer
    .from('orders_tracking')
    .select('id, waybill_no, fulfillment_status')
    .not('waybill_no', 'is', null)
    .not('fulfillment_status', 'in', '("delivered","customer-collected","collected")')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let updated = 0, failed = 0

  for (const order of orders || []) {
    try {
      await new Promise(resolve => setTimeout(resolve, 200))

      const res = await fetch(
        `https://api-pudo.co.za/api/v1/tracking/shipments/public?waybill=${order.waybill_no}`,
        { headers: { 'Authorization': `Bearer ${bearerToken}` } }
      )

      if (!res.ok) { failed++; continue }

      const data = await res.json()
      if (!data?.status) { failed++; continue }

      const { error: updateError } = await supabaseServer
        .from('orders_tracking')
        .update({
          fulfillment_status: data.status,
          fulfillment_status_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      updateError ? failed++ : updated++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ success: true, total: orders?.length || 0, updated, failed })
}
