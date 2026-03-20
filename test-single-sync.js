const { createClient } = require('@supabase/supabase-js')

const PUDO_API_TOKEN = '50588538|VFiOv2TdKTfuYDn94kCMxwldrC45JvB2RKKT67gq0ed15305'
const SUPABASE_URL = 'https://jlhajxzfbubohauvxluk.supabase.co'
const SUPABASE_KEY = 'sb_secret_rL209RYLQkjSiWf0cW3_Wg_9W8sm8-9'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testSingleSync() {
  const waybill = 'LL-AQOWQ2'
  
  console.log(`\n=== Testing sync for waybill: ${waybill} ===\n`)
  
  // Step 1: Find order in database
  console.log('Step 1: Finding order in database...')
  const { data: orders, error: findError } = await supabase
    .from('orders_tracking')
    .select('id, order_number, waybill_no, fulfillment_status')
    .eq('waybill_no', waybill)
  
  if (findError) {
    console.error('❌ Database query failed:', findError)
    return
  }
  
  if (!orders || orders.length === 0) {
    console.log('❌ No order found with that waybill')
    return
  }
  
  const order = orders[0]
  console.log(`✓ Found order:`)
  console.log(`  ID: ${order.id}`)
  console.log(`  Order #: ${order.order_number}`)
  console.log(`  Current fulfillment_status: ${order.fulfillment_status || 'NULL'}`)
  
  // Step 2: Query PUDO API
  console.log('\nStep 2: Querying PUDO API...')
  const res = await fetch(
    `https://api-pudo.co.za/api/v1/shipments?custom_tracking_reference=${waybill}`,
    { headers: { 'Authorization': `Bearer ${PUDO_API_TOKEN}` } }
  )
  
  console.log(`  HTTP Status: ${res.status}`)
  
  if (!res.ok) {
    console.error('❌ PUDO API failed')
    return
  }
  
  const pudoData = await res.json()
  
  if (!pudoData || pudoData.length === 0) {
    console.log('❌ No shipment found in PUDO')
    return
  }
  
  console.log(`✓ PUDO returned status: ${pudoData[0].status}`)
  
  // Step 3: Update database
  console.log('\nStep 3: Updating database...')
  const { error: updateError } = await supabase
    .from('orders_tracking')
    .update({
      fulfillment_status: pudoData[0].status,
      fulfillment_status_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', order.id)
  
  if (updateError) {
    console.error('❌ Database update failed:', updateError)
    return
  }
  
  console.log('✓ Database updated')
  
  // Step 4: Verify update
  console.log('\nStep 4: Verifying update...')
  const { data: updated } = await supabase
    .from('orders_tracking')
    .select('fulfillment_status, fulfillment_status_updated_at')
    .eq('id', order.id)
    .single()
  
  console.log(`✓ New fulfillment_status: ${updated.fulfillment_status}`)
  console.log(`✓ Updated at: ${updated.fulfillment_status_updated_at}`)
  
  console.log('\n=== SUCCESS ===\n')
}

testSingleSync()
