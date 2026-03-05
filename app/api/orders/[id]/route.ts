import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabaseServer'

async function sendWebhook(order: any) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: order.customer_name,
        number: order.customer_phone,
        orderNumber: order.order_number,
        waybill: order.waybill_no
      })
    })
  } catch (error) {
    console.error('Webhook error:', error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const id = params.id

    // Handle both order_status and fulfillment_status updates
    const updateData: any = { updated_at: new Date().toISOString() }
    
    if (body.order_status) {
      if (!['DROPPED_OFF', 'COLLECTED', 'UPLOADED'].includes(body.order_status)) {
        return NextResponse.json({ error: 'Invalid order_status' }, { status: 400 })
      }
      
      // If marking as UPLOADED, move to delivery in progress based on collection method
      if (body.order_status === 'UPLOADED') {
        // Get current order to check collection method
        const { data: currentOrder } = await supabaseServer
          .from('orders_tracking')
          .select('collection_method')
          .eq('id', id)
          .single()
        
        // Mark as manual upload processed
        updateData.was_manual_upload = true
        
        // Update waybill if provided
        if (body.waybill_no) {
          updateData.waybill_no = body.waybill_no
        }
        
        if (currentOrder?.collection_method === 'DELIVERY') {
          updateData.order_status = 'NOT_DROPPED_OFF'
        } else if (currentOrder?.collection_method === 'COLLECTION') {
          updateData.order_status = 'NOT_COLLECTED'
        } else {
          updateData.order_status = body.order_status
        }
      } else {
        updateData.order_status = body.order_status
      }
    }
    
    if (body.fulfillment_status) {
      updateData.fulfillment_status = body.fulfillment_status
    }

    const { data, error } = await supabaseServer
      .from('orders_tracking')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Send webhook if fulfillment_status changed to 'in-transit'
    if (body.fulfillment_status === 'in-transit') {
      await sendWebhook(data)
    }

    return NextResponse.json({ order: data })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
