import { NextResponse } from 'next/server'

export async function POST() {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  
  if (!webhookUrl) {
    return NextResponse.json({ error: 'N8N_WEBHOOK_URL not configured' }, { status: 400 })
  }

  try {
    const testPayload = {
      name: "John Doe",
      number: "+1234567890",
      orderNumber: "TEST-12345",
      waybill: "WB-TEST-001"
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    })

    const responseText = await response.text()

    return NextResponse.json({ 
      success: true, 
      status: response.status,
      responseText,
      webhookUrl,
      payload: testPayload 
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Webhook test failed', 
      details: error 
    }, { status: 500 })
  }
}