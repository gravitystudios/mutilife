const PUDO_API_TOKEN = '50588538|VFiOv2TdKTfuYDn94kCMxwldrC45JvB2RKKT67gq0ed15305';

async function testWithParams() {
  const tests = [
    'https://api-pudo.co.za/api/v1/billing/statements?from=2026-02-01&to=2026-02-28',
    'https://api-pudo.co.za/api/v1/billing/statements?start_date=2026-02-01&end_date=2026-02-28',
    'https://api-pudo.co.za/api/v1/billing/statements?date_from=2026-02-01&date_to=2026-02-28',
  ];
  
  for (const url of tests) {
    console.log(`Testing: ${url}`);
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${PUDO_API_TOKEN}` }
    });
    
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log('Response:', text.substring(0, 500));
    console.log('---\n');
  }
}

testWithParams().catch(console.error);
