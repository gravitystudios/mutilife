import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const bearerToken = process.env.PUDO_API_TOKEN
    if (!bearerToken) {
      return NextResponse.json({ error: 'PUDO_API_TOKEN not configured' }, { status: 500 })
    }

    const res = await fetch('https://api-pudo.co.za/api/v1/billing/transactions?page=1', {
      headers: { 'Authorization': `Bearer ${bearerToken}` }
    })

    if (!res.ok) throw new Error('Failed to fetch transactions')

    const transactions = await res.json()
    let synced = 0

    for (const t of transactions) {
      const { error } = await supabaseServer
        .from('pudo_transactions')
        .upsert({
          id: t.id,
          account_id: t.account_id,
          amount: t.amount,
          type: t.type,
          transaction_date: t.transaction_date,
          effective_date: t.effective_date,
          description: t.description,
          shipment_id: t.shipment_id,
          custom_tracking_reference: t.shipment?.custom_tracking_reference,
          doc_display_id: t.doc_display_id,
          has_been_reversed: t.has_been_reversed,
          time_created: t.time_created,
          time_modified: t.time_modified,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      if (!error) synced++
    }

    return NextResponse.json({ synced, total: transactions.length })
  } catch (error) {
    console.error('Transaction sync error:', error)
    return NextResponse.json({ error: 'Failed to sync transactions' }, { status: 500 })
  }
}
