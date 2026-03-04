const SUPABASE_URL = 'https://jlhajxzfbubohauvxluk.supabase.co';
const SUPABASE_KEY = 'sb_secret_rL209RYLQkjSiWf0cW3_Wg_9W8sm8-9';

async function testManualInsert() {
  console.log('Testing manual order insert...\n');
  
  // Get current stock
  const before = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const beforeData = await before.json();
  console.log('Before:', beforeData);
  
  // Insert order
  const testOrder = {
    order_number: 'TEST-' + Date.now(),
    order_status: 'PACKAGING',
    customer_name: 'Test Customer',
    line_items: JSON.stringify([
      { name: 'Chia Seeds - 100g', quantity: 2 },
      { name: 'Muti-Life Superjuice', quantity: 1 }
    ])
  };
  
  const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders_tracking`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(testOrder)
  });
  
  if (!orderRes.ok) {
    console.log('Error:', await orderRes.text());
    return;
  }
  
  console.log('\n✅ Order created');
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Check after
  const after = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const afterData = await after.json();
  console.log('\nAfter:', afterData);
  
  console.log('\n📊 Changes:');
  afterData.forEach(item => {
    const orig = beforeData.find(i => i.name === item.name);
    if (orig) {
      console.log(`${item.name}: ${orig.stock} → ${item.stock} (${orig.stock - item.stock})`);
    }
  });
}

testManualInsert().catch(console.error);
