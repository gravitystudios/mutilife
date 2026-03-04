const SUPABASE_URL = 'https://jlhajxzfbubohauvxluk.supabase.co';
const SUPABASE_KEY = 'sb_secret_rL209RYLQkjSiWf0cW3_Wg_9W8sm8-9';

async function checkBalance() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pudo_transactions?select=*&order=id.asc`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  
  const transactions = await res.json();
  console.log(`Total transactions in DB: ${transactions.length}\n`);
  
  let balance = 0;
  let activeBalance = 0;
  
  console.log('All transactions:');
  transactions.forEach(t => {
    const amount = parseFloat(t.amount);
    balance += amount;
    
    if (t.has_been_reversed === 0) {
      activeBalance += amount;
    }
    
    const reversed = t.has_been_reversed === 1 ? ' [REVERSED]' : '';
    console.log(`${t.id}: ${t.transaction_date} ${t.time_created} - ${t.type} - R${amount}${reversed}`);
  });
  
  console.log(`\nTotal balance (all): R${balance.toFixed(2)}`);
  console.log(`Active balance (non-reversed): R${activeBalance.toFixed(2)}`);
  
  // Manual calculation
  console.log('\nManual check:');
  console.log('Payment: +10000.00');
  console.log('Charges: -69 -49 -49 -49 -69 -49 -49 -69 -69 -49 = -570');
  console.log('Expected: 10000 - 570 = 9430');
  console.log('But 2 reversed (+49 +49 = +98)');
  console.log('So: 9430 + 98 = 9528');
}

checkBalance().catch(console.error);
