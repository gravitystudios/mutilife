import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch('https://api-pudo.co.za/api/v1/shipments', {
      headers: {
        'Authorization': `Bearer ${process.env.PUDO_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) throw new Error('Failed to fetch shipments')

    const data = await res.json()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('PUDO shipments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    )
  }
}
