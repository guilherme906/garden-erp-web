import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT usuario, senha FROM veiling_config LIMIT 1');
await conn.end();

if (!rows[0]?.usuario) { console.log('Sem credenciais'); process.exit(0); }

// Login
const loginResp = await fetch('https://www.veilingholambra.com.br/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ login: rows[0].usuario, password: rows[0].senha })
});
const loginData = await loginResp.json();
const token = loginData.token;
console.log('Token obtido:', token ? 'sim' : 'não');

// Buscar ofertas
const offersResp = await fetch('https://www.veilingholambra.com.br/api/offers?page=1&pageSize=5', {
  headers: { 'Authorization': 'Bearer ' + token }
});
const offersData = await offersResp.json();
const offer = offersData.items?.[0];
if (offer) {
  console.log('\nTodas as chaves do produto:', Object.keys(offer).join(', '));
  console.log('\nsiteDeliveryPatterns:', JSON.stringify(offer.siteDeliveryPatterns, null, 2));
  console.log('\ntrolleyPrice:', offer.trolleyPrice);
  console.log('\npackings:', JSON.stringify(offer.packings?.[0], null, 2));
  
  // Buscar produto com frete (ABUTILON C21 da imagem)
  console.log('\n--- Buscando ABUTILON C21 ---');
  const abutResp = await fetch('https://www.veilingholambra.com.br/api/offers?page=1&pageSize=3&searchText=ABUTILON+C21', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const abutData = await abutResp.json();
  for (const o of (abutData.items || [])) {
    console.log(`\n  ${o.productName} | trolley=${o.trolleyPrice} | siteDelivery=${JSON.stringify(o.siteDeliveryPatterns)}`);
    // Mostrar todos os campos relacionados a frete
    const freteKeys = Object.keys(o).filter(k => k.toLowerCase().includes('fret') || k.toLowerCase().includes('freight') || k.toLowerCase().includes('delivery'));
    for (const k of freteKeys) {
      console.log(`    ${k}:`, JSON.stringify(o[k]));
    }
  }
}
