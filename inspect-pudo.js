const PUDO_API_TOKEN = '50588538|VFiOv2TdKTfuYDn94kCMxwldrC45JvB2RKKT67gq0ed15305'

async function inspectPudoResponse() {
  const waybill = 'LL-AQOWQ2'
  
  console.log(`Querying PUDO for: ${waybill}\n`)
  
  const res = await fetch(
    `https://api-pudo.co.za/api/v1/shipments?custom_tracking_reference=${waybill}`,
    { headers: { 'Authorization': `Bearer ${PUDO_API_TOKEN}` } }
  )
  
  const data = await res.json()
  
  console.log('Full PUDO Response:')
  console.log(JSON.stringify(data, null, 2))
  
  console.log('\n=== Data being used for update ===')
  console.log(`data[0].status = "${data[0]?.status}"`)
  console.log('\nThis is the value written to fulfillment_status column')
}

inspectPudoResponse()
