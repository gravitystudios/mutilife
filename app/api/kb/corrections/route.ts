import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseServer
      .from('kb_corrections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Fetch corrections error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch corrections' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    const webhookUrl = 'https://baemedi.app.n8n.cloud/webhook/kb/core/corrections'
    
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!res.ok) throw new Error('Webhook failed')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Correction error:', error)
    return NextResponse.json(
      { error: 'Failed to add correction' },
      { status: 500 }
    )
  }
}
