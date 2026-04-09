import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    const bearerToken = process.env.PUDO_API_TOKEN
    if (!bearerToken) {
      return NextResponse.json({ error: 'PUDO_API_TOKEN not configured' }, { status: 500 })
    }

    const pudoRes = await fetch('https://api-pudo.co.za/api/v1/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body,
    })

    const pudoData = await pudoRes.json()

    if (!pudoRes.ok) {
      return NextResponse.json({
        error: 'PUDO API failed',
        status: pudoRes.status,
        pudoResponse: pudoData,
      }, { status: pudoRes.status })
    }

    return NextResponse.json({ success: true, pudoResponse: pudoData })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to process shipment',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
