const SUPABASE_URL = 'https://jlhajxzfbubohauvxluk.supabase.co';
const SUPABASE_KEY = 'sb_secret_rL209RYLQkjSiWf0cW3_Wg_9W8sm8-9';

async function checkSchema() {
  console.log('Checking orders_tracking schema...\n');
  
  const res = await fetch(`${SUPABASE_URL}/rest/v1/orders_tracking?select=*&limit=1`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  
  const data = await res.json();
  console.log('Sample row:', JSON.stringify(data[0], null, 2));
  console.log('\nline_items type:', typeof data[0]?.line_items);
  console.log('line_items value:', data[0]?.line_items);
}

checkSchema().catch(console.error);
