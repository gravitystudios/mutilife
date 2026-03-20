// Test PUDO tracking endpoint
async function testTracking() {
  const waybill = 'LL-4VGT5Y'
  
  try {
    console.log(`Testing: http://localhost:3000/api/pudo?waybill=${waybill}`)
    
    const res = await fetch(`http://localhost:3000/api/pudo?waybill=${waybill}`)
    const data = await res.json()
    
    console.log('Status:', res.status)
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testTracking()
