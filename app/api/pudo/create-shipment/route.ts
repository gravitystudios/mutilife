import { NextRequest, NextResponse } from 'next/server'

function cleanShipment(raw: any) {
  const cleaned: any = {}
  
  if (raw.collection_address) {
    cleaned.collection_address = {}
    if (raw.collection_address.terminal_id) cleaned.collection_address.terminal_id = raw.collection_address.terminal_id
  }
  
  if (raw.special_instructions_collection) cleaned.special_instructions_collection = raw.special_instructions_collection
  
  if (raw.collection_contact) {
    cleaned.collection_contact = {}
    if (raw.collection_contact.name) cleaned.collection_contact.name = raw.collection_contact.name
    if (raw.collection_contact.email) cleaned.collection_contact.email = raw.collection_contact.email
    if (raw.collection_contact.mobile_number) cleaned.collection_contact.mobile_number = raw.collection_contact.mobile_number
  }
  
  if (raw.delivery_address) {
    cleaned.delivery_address = {}
    if (raw.delivery_address.lat !== undefined) cleaned.delivery_address.lat = raw.delivery_address.lat
    if (raw.delivery_address.lng !== undefined) cleaned.delivery_address.lng = raw.delivery_address.lng
    if (raw.delivery_address.street_address) cleaned.delivery_address.street_address = raw.delivery_address.street_address
    if (raw.delivery_address.local_area) cleaned.delivery_address.local_area = raw.delivery_address.local_area
    if (raw.delivery_address.suburb) cleaned.delivery_address.suburb = raw.delivery_address.suburb
    if (raw.delivery_address.city) cleaned.delivery_address.city = raw.delivery_address.city
    if (raw.delivery_address.code) cleaned.delivery_address.code = raw.delivery_address.code
    if (raw.delivery_address.zone) cleaned.delivery_address.zone = raw.delivery_address.zone
    if (raw.delivery_address.country) cleaned.delivery_address.country = raw.delivery_address.country
    if (raw.delivery_address.type) cleaned.delivery_address.type = raw.delivery_address.type
  }
  
  if (raw.delivery_contact) {
    cleaned.delivery_contact = {}
    if (raw.delivery_contact.name) cleaned.delivery_contact.name = raw.delivery_contact.name
    if (raw.delivery_contact.email) cleaned.delivery_contact.email = raw.delivery_contact.email
    if (raw.delivery_contact.mobile_number) cleaned.delivery_contact.mobile_number = raw.delivery_contact.mobile_number
  }
  
  if (raw.opt_in_rates) cleaned.opt_in_rates = raw.opt_in_rates
  if (raw.opt_in_time_based_rates) cleaned.opt_in_time_based_rates = raw.opt_in_time_based_rates
  if (raw.service_level_code) cleaned.service_level_code = raw.service_level_code
  
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text()
    
    let rawShipments
    try {
      rawShipments = JSON.parse(bodyText)
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Invalid JSON', 
        received: bodyText.substring(0, 200) 
      }, { status: 400 })
    }

    if (!Array.isArray(rawShipments)) {
      return NextResponse.json({ 
        error: 'Expected array of shipments', 
        received: typeof rawShipments 
      }, { status: 400 })
    }

    if (rawShipments.length === 0) {
      return NextResponse.json({ error: 'Empty shipments array' }, { status: 400 })
    }
    
    // Clean each shipment to only include PUDO fields
    const shipments = rawShipments.map(cleanShipment)

    const bearerToken = process.env.PUDO_API_TOKEN
    if (!bearerToken) {
      return NextResponse.json({ error: 'PUDO_API_TOKEN not configured' }, { status: 500 })
    }

    // Send cleaned data to PUDO API
    const pudoRes = await fetch('https://api-pudo.co.za/api/v1/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(shipments)
    })

    const pudoData = await pudoRes.json()

    if (!pudoRes.ok) {
      return NextResponse.json({ 
        error: 'PUDO API failed', 
        status: pudoRes.status,
        pudoResponse: pudoData 
      }, { status: pudoRes.status })
    }

    return NextResponse.json({
      success: true,
      pudoResponse: pudoData
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to process shipment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
