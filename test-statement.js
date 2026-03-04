const PUDO_API_TOKEN = '50588538|VFiOv2TdKTfuYDn94kCMxwldrC45JvB2RKKT67gq0ed15305';

async function testStatement() {
  console.log('Testing PUDO statement endpoint...\n');
  
  // Try different possible endpoints
  const endpoints = [
    'https://api-pudo.co.za/api/v1/billing/statement',
    'https://api-pudo.co.za/api/v1/billing/statements',
    'https://api-pudo.co.za/api/v1/statement',
    'https://api-pudo.co.za/api/v1/billing/statement?from=2026-02-01&to=2026-02-28',
  ];
  
  for (const url of endpoints) {
    console.log(`Trying: ${url}`);
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${PUDO_API_TOKEN}` }
      });
      
      console.log(`Status: ${res.status} ${res.statusText}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('\n✅ Found working endpoint!\n');
        break;
      } else {
        const text = await res.text();
        console.log('Error:', text);
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
    console.log('---\n');
  }
}

testStatement().catch(console.error);
