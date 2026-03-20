import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const waybill = request.nextUrl.searchParams.get('waybill')

  try {
    if (waybill) {
      const res = await fetch(
        `https://api-pudo.co.za/api/v1/tracking/shipments/public?waybill=${waybill}`,
        { headers: { 'Authorization': `Bearer ${process.env.PUDO_API_TOKEN}` } }
      )
      if (!res.ok) throw new Error('Failed to fetch tracking')
      const data = await res.json()
      return NextResponse.json({ status: data?.status || null, data })
    }

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
    console.error('PUDO error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
