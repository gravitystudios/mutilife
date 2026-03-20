const PUDO_API_TOKEN = '50588538|VFiOv2TdKTfuYDn94kCMxwldrC45JvB2RKKT67gq0ed15305'

async function testWaybillQuery() {
  const waybill = 'LL-AQOWQ2'
  
  console.log('Test 1: Query by custom_tracking_reference')
  const res1 = await fetch(
    `https://api-pudo.co.za/api/v1/shipments?custom_tracking_reference=${waybill}`,
    { headers: { 'Authorization': `Bearer ${PUDO_API_TOKEN}` } }
  )
  const data1 = await res1.json()
  console.log(`Results: ${data1.length}`)
  if (data1.length > 0) {
    console.log(`First result custom_tracking_reference: ${data1[0].custom_tracking_reference}`)
  }
  
  console.log('\nTest 2: Query by waybill (public tracking)')
  const res2 = await fetch(
    `https://api-pudo.co.za/api/v1/tracking/shipments/public?waybill=${waybill}`,
    { headers: { 'Authorization': `Bearer ${PUDO_API_TOKEN}` } }
  )
  const data2 = await res2.json()
  console.log('Response:', JSON.stringify(data2, null, 2))
}

testWaybillQuery()
