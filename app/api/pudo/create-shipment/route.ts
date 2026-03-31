import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Log raw request details
    const contentType = request.headers.get('content-type')
    console.log('Content-Type:', contentType)
    
    // Try to get the body as text first
    const bodyText = await request.text()
    console.log('Raw body:', bodyText)
    
    // Parse JSON
    let shipments
    try {
      shipments = JSON.parse(bodyText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({ 
        error: 'Invalid JSON', 
        received: bodyText.substring(0, 200) 
      }, { status: 400 })
    }

    console.log('Parsed shipment data:', JSON.stringify(shipments, null, 2))

    // Validate input
    if (!Array.isArray(shipments)) {
      // If it's a single object, wrap it in an array
      if (typeof shipments === 'object' && shipments !== null) {
        shipments = [shipments]
      } else {
        return NextResponse.json({ 
          error: 'Invalid payload: expected array or object', 
          received: typeof shipments 
        }, { status: 400 })
      }
    }

    if (shipments.length === 0) {
      return NextResponse.json({ error: 'Empty shipments array' }, { status: 400 })
    }

    // Send to PUDO API
    const bearerToken = process.env.PUDO_API_TOKEN
    if (!bearerToken) {
      return NextResponse.json({ error: 'PUDO_API_TOKEN not configured' }, { status: 500 })
    }

    console.log('Sending to PUDO API:', JSON.stringify(shipments, null, 2))

    const pudoRes = await fetch('https://api-pudo.co.za/api/v1/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipments)
    })

    const pudoData = await pudoRes.json()
    console.log('PUDO API response status:', pudoRes.status)
    console.log('PUDO API response:', JSON.stringify(pudoData, null, 2))

    if (!pudoRes.ok) {
      console.error('PUDO API error:', pudoData)
      return NextResponse.json({ 
        error: 'PUDO API failed', 
        status: pudoRes.status,
        pudoResponse: pudoData 
      }, { status: pudoRes.status })
    }

    // Return PUDO response (no webhook yet)
    return NextResponse.json({
      success: true,
      pudoResponse: pudoData
    })
  } catch (error) {
    console.error('Error processing shipment:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process shipment data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
