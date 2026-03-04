import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: transactions, error } = await supabaseServer
      .from('pudo_transactions')
      .select('*')
      .order('transaction_date', { ascending: false })

    if (error) throw error

    let balance = 0
    transactions?.forEach((t: any) => {
      if (t.has_been_reversed === 0) {
        balance += parseFloat(t.amount)
      }
    })

    const { data: settings } = await supabaseServer
      .from('account_settings')
      .select('setting_value')
      .eq('setting_key', 'balance_threshold')
      .single()

    return NextResponse.json({ 
      balance, 
      transactions: transactions?.slice(0, 50) || [],
      threshold: settings?.setting_value || '1000'
    })
  } catch (error) {
    console.error('Balance fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { threshold } = await request.json()

    const { error } = await supabaseServer
      .from('account_settings')
      .upsert({ 
        setting_key: 'balance_threshold', 
        setting_value: threshold,
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Threshold update error:', error)
    return NextResponse.json({ error: 'Failed to update threshold' }, { status: 500 })
  }
}
