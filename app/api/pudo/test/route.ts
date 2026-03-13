import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { waybill } = await req.json()

  const bearerToken = process.env.PUDO_API_TOKEN
  if (!bearerToken) {
    return NextResponse.json({ error: 'PUDO_API_TOKEN not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api-pudo.co.za/api/v1/shipments?custom_tracking_reference=${waybill}`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    )

    const data = await res.json()
    console.log('PUDO API Response:', JSON.stringify(data, null, 2))

    return NextResponse.json({
      status: res.status,
      data: data,
      waybill: waybill
    })
  } catch (error) {
    console.error('PUDO API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}