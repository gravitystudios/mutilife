const PUDO_API_TOKEN = '50588538|VFiOv2TdKTfuYDn94kCMxwldrC45JvB2RKKT67gq0ed15305';

async function getHeaders() {
  console.log('Fetching headers from PUDO transactions endpoint...\n');
  
  const res = await fetch('https://api-pudo.co.za/api/v1/billing/transactions', {
    headers: { 'Authorization': `Bearer ${PUDO_API_TOKEN}` }
  });
  
  console.log('Status:', res.status, res.statusText);
  console.log('\nResponse Headers:');
  console.log('---');
  
  res.headers.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });
  
  console.log('\n---');
  
  const data = await res.json();
  console.log(`\nReturned ${data.length} transactions`);
}

getHeaders().catch(console.error);
