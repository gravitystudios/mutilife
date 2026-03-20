const PUDO_API_TOKEN = '50588538|VFiOv2TdKTfuYDn94kCMxwldrC45JvB2RKKT67gq0ed15305'

async function testPudoDirect() {
  const waybill = 'LL-4VGT5Y'
  const url = `https://api-pudo.co.za/api/v1/tracking/shipments/public?waybill=${waybill}`
  
  console.log('Testing PUDO API directly...')
  console.log('URL:', url)
  console.log('Token:', PUDO_API_TOKEN ? 'Found' : 'Missing')
  
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${PUDO_API_TOKEN}` }
    })
    
    console.log('\nStatus:', res.status)
    const data = await res.json()
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testPudoDirect()
