const SUPABASE_URL = 'https://jlhajxzfbubohauvxluk.supabase.co';
const SUPABASE_KEY = 'sb_secret_rL209RYLQkjSiWf0cW3_Wg_9W8sm8-9';
const PUDO_API_TOKEN = '50588538|VFiOv2TdKTfuYDn94kCMxwldrC45JvB2RKKT67gq0ed15305';

async function testSync() {
  console.log('Fetching page 2 from PUDO...\n');
  
  const res = await fetch('https://api-pudo.co.za/api/v1/billing/transactions?page=2', {
    headers: { 'Authorization': `Bearer ${PUDO_API_TOKEN}` }
  });
  
  const transactions = await res.json();
  console.log(`Page 2 has ${transactions.length} transactions`);
  console.log('First transaction ID:', transactions[0]?.id);
  console.log('Last transaction ID:', transactions[transactions.length - 1]?.id);
  
  console.log('\nChecking database...');
  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/pudo_transactions?select=count`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'count=exact'
    }
  });
  
  const count = dbRes.headers.get('content-range');
  console.log('Database count:', count);
  
  console.log('\nTrying to insert one transaction from page 2...');
  const testTx = transactions[0];
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/pudo_transactions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      id: testTx.id,
      account_id: testTx.account_id,
      amount: testTx.amount,
      type: testTx.type,
      transaction_date: testTx.transaction_date,
      effective_date: testTx.effective_date,
      description: testTx.description,
      shipment_id: testTx.shipment_id,
      custom_tracking_reference: testTx.shipment?.custom_tracking_reference,
      doc_display_id: testTx.doc_display_id,
      has_been_reversed: testTx.has_been_reversed,
      time_created: testTx.time_created,
      time_modified: testTx.time_modified
    })
  });
  
  if (insertRes.ok) {
    console.log('✅ Insert successful');
  } else {
    console.log('❌ Insert failed:', await insertRes.text());
  }
}

testSync().catch(console.error);
