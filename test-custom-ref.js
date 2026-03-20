const PUDO_API_TOKEN = '50588538|VFiOv2TdKTfuYDn94kCMxwldrC45JvB2RKKT67gq0ed15305'

async function testCustomRef() {
  const refs = ['TCGD000404', 'TCGD000405']
  
  for (const ref of refs) {
    console.log(`\nTesting custom_tracking_reference: ${ref}`)
    
    try {
      const res = await fetch(
        `https://api-pudo.co.za/api/v1/shipments?custom_tracking_reference=${ref}`,
        { headers: { 'Authorization': `Bearer ${PUDO_API_TOKEN}` } }
      )
      
      console.log(`Status: ${res.status}`)
      const data = await res.json()
      
      if (res.ok && data.length > 0) {
        console.log(`✓ Found shipment!`)
        console.log(`  Status: ${data[0].status}`)
        console.log(`  Waybill: ${data[0].waybill}`)
        console.log(`  Custom ref: ${data[0].custom_tracking_reference}`)
      } else {
        console.log(`✗ Not found or error:`, data)
      }
    } catch (error) {
      console.error(`✗ Exception: ${error.message}`)
    }
  }
}

testCustomRef()
