const https = require('https');

const SUPABASE_URL = 'https://jlhajxzfbubohauvxluk.supabase.co';
const SUPABASE_KEY = 'sb_secret_rL209RYLQkjSiWf0cW3_Wg_9W8sm8-9';

async function testInventory() {
  console.log('🧪 Testing Inventory System\n');

  // Test 1: Check if inventory table exists and has data
  console.log('1️⃣ Fetching current inventory...');
  const inventoryRes = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const inventory = await inventoryRes.json();
  console.log('✅ Current inventory:', inventory);
  console.log('');

  // Test 2: Add test items if none exist
  if (inventory.length === 0) {
    console.log('2️⃣ Adding test items...');
    const testItems = [
      { name: 'Chia Seeds - 100g', stock: 50, low_stock_threshold: 10 },
      { name: 'Muti-Life Superjuice', stock: 30, low_stock_threshold: 5 }
    ];

    for (const item of testItems) {
      const addRes = await fetch(`${SUPABASE_URL}/rest/v1/inventory`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(item)
      });
      const added = await addRes.json();
      console.log(`✅ Added: ${item.name} - Stock: ${item.stock}`);
    }
    console.log('');
  }

  // Test 3: Check if trigger exists
  console.log('3️⃣ Checking if auto-deduction trigger exists...');
  const triggerRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_trigger`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  }).catch(() => null);

  if (!triggerRes || !triggerRes.ok) {
    console.log('⚠️  Cannot verify trigger - you need to run this SQL:');
    console.log(`
CREATE OR REPLACE FUNCTION deduct_inventory()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  product_name TEXT;
  product_qty INTEGER;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.line_items)
  LOOP
    product_name := item->>'name';
    product_qty := (item->>'quantity')::INTEGER;
    UPDATE inventory SET stock = stock - product_qty, updated_at = NOW() WHERE name = product_name;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deduct_inventory
AFTER INSERT ON orders_tracking
FOR EACH ROW
WHEN (NEW.line_items IS NOT NULL)
EXECUTE FUNCTION deduct_inventory();
    `);
  } else {
    console.log('✅ Trigger check passed');
  }
  console.log('');

  // Test 4: Simulate order insertion
  console.log('4️⃣ Simulating order with line_items...');
  const testOrder = {
    order_number: 'TEST-' + Date.now(),
    order_status: 'PACKAGING',
    customer_name: 'Test Customer',
    line_items: [
      { name: 'Chia Seeds - 100g', quantity: 2 },
      { name: 'Muti-Life Superjuice', quantity: 1 }
    ]
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

  if (orderRes.ok) {
    console.log('✅ Test order created:', testOrder.order_number);
    console.log('');

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 5: Verify stock was deducted
    console.log('5️⃣ Verifying stock deduction...');
    const updatedRes = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const updatedInventory = await updatedRes.json();
    console.log('✅ Updated inventory:', updatedInventory);
    console.log('');

    // Compare
    console.log('📊 Stock Changes:');
    updatedInventory.forEach(item => {
      const original = inventory.find(i => i.name === item.name);
      if (original) {
        const change = original.stock - item.stock;
        console.log(`   ${item.name}: ${original.stock} → ${item.stock} (${change > 0 ? '-' : ''}${change})`);
        if (item.stock <= item.low_stock_threshold) {
          console.log(`   ⚠️  LOW STOCK WARNING: ${item.stock} ≤ ${item.low_stock_threshold}`);
        }
      }
    });
  } else {
    console.log('❌ Failed to create test order:', await orderRes.text());
  }

  console.log('\n✅ Test complete!');
}

testInventory().catch(console.error);
