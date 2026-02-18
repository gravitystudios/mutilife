import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseServer
      .from('core_kb_versions')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Core KB fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch core KB' },
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

    const webhookUrl = 'https://baemedi.app.n8n.cloud/webhook/kb/core/replace'
    
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!res.ok) throw new Error('Webhook failed')

    const webhookResponse = await res.json()
    const metadata = webhookResponse[1]?.pageContent ? JSON.parse(webhookResponse[1].pageContent) : {}

    return NextResponse.json({ 
      success: true,
      kb_version: metadata.kb_version,
      kb_namespace: metadata.kb_namespace
    })
  } catch (error) {
    console.error('Core KB update error:', error)
    return NextResponse.json(
      { error: 'Failed to update core KB' },
      { status: 500 }
    )
  }
}
