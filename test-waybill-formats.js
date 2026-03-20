const PUDO_API_TOKEN = '50588538|VFiOv2TdKTfuYDn94kCMxwldrC45JvB2RKKT67gq0ed15305'

async function testFormats() {
  const tests = [
    { label: 'Known working', waybill: 'LL-4VGT5Y' },
    { label: 'From DB', waybill: 'TCGD000404' },
    { label: 'From DB alt', waybill: 'TCGD000405' }
  ]
  
  for (const test of tests) {
    console.log(`\nTesting: ${test.label} (${test.waybill})`)
    
    try {
      const res = await fetch(
        `https://api-pudo.co.za/api/v1/tracking/shipments/public?waybill=${test.waybill}`,
        { headers: { 'Authorization': `Bearer ${PUDO_API_TOKEN}` } }
      )
      
      console.log(`Status: ${res.status}`)
      const data = await res.json()
      
      if (res.ok) {
        console.log(`✓ Success - Status: ${data.status}`)
      } else {
        console.log(`✗ Failed - ${data.message}`)
      }
    } catch (error) {
      console.error(`✗ Exception: ${error.message}`)
    }
  }
}

testFormats()
