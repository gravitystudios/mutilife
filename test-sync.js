const PUDO_API_TOKEN = '50588538|VFiOv2TdKTfuYDn94kCMxwldrC45JvB2RKKT67gq0ed15305'

// Test with a real waybill from the database
const testWaybills = ['TCGD000404', 'TCGD000405', 'TCGD000406']

async function testSync() {
  console.log('Testing PUDO sync with real waybills...\n')
  
  for (const waybill of testWaybills) {
    console.log(`Testing waybill: ${waybill}`)
    
    try {
      const res = await fetch(
        `https://api-pudo.co.za/api/v1/tracking/shipments/public?waybill=${waybill}`,
        {
          headers: {
            'Authorization': `Bearer ${PUDO_API_TOKEN}`
          }
        }
      )
      
      console.log(`  Status: ${res.status}`)
      
      if (res.ok) {
        const data = await res.json()
        console.log(`  Response status field: ${data.status}`)
        console.log(`  Full response:`, JSON.stringify(data, null, 2))
      } else {
        const text = await res.text()
        console.log(`  Error: ${text}`)
      }
    } catch (error) {
      console.error(`  Exception:`, error.message)
    }
    
    console.log('')
  }
}

testSync()
