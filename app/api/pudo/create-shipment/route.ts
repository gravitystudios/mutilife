import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const shipments = await request.json()

    console.log('Received shipment data:', JSON.stringify(shipments, null, 2))

    // Validate input
    if (!Array.isArray(shipments) || shipments.length === 0) {
      return NextResponse.json({ error: 'Invalid payload: expected array of shipments' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      received: shipments.length,
      data: shipments
    })
  } catch (error) {
    console.error('Error receiving shipment data:', error)
    return NextResponse.json(
      { error: 'Failed to process shipment data' },
      { status: 500 }
    )
  }
}
