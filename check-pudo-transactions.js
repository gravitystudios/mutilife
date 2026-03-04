const PUDO_API_TOKEN = '50588538|VFiOv2TdKTfuYDn94kCMxwldrC45JvB2RKKT67gq0ed15305';

async function checkTransactions() {
  console.log('Fetching transactions from PUDO API...\n');
  
  const res = await fetch('https://api-pudo.co.za/api/v1/billing/transactions', {
    headers: { 'Authorization': `Bearer ${PUDO_API_TOKEN}` }
  });
  
  if (!res.ok) {
    console.log('Error:', res.status, res.statusText);
    return;
  }
  
  const transactions = await res.json();
  console.log(`Total transactions returned: ${transactions.length}\n`);
  
  // Show last 5 transactions
  console.log('Last 5 transactions:');
  transactions.slice(0, 5).forEach(t => {
    console.log(`- ID: ${t.id}, Date: ${t.transaction_date}, Time: ${t.time_created}, Type: ${t.type}, Amount: R${t.amount}, Ref: ${t.shipment?.custom_tracking_reference || 'N/A'}`);
  });
  
  // Check for today's transactions
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.transaction_date === today);
  console.log(`\nTransactions from today (${today}): ${todayTransactions.length}`);
  
  if (todayTransactions.length > 0) {
    todayTransactions.forEach(t => {
      console.log(`- ${t.time_created}: ${t.type} - R${t.amount} - ${t.shipment?.custom_tracking_reference || 'N/A'}`);
    });
  }
}

checkTransactions().catch(console.error);
