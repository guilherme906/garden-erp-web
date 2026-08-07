import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute('SELECT usuario, senha, customerId FROM veiling_config LIMIT 1');
await conn.end();

if (!rows[0]?.usuario) { console.log('Sem credenciais'); process.exit(0); }

// Login via OAuth
const VEILING_BASE = "https://backend.veilingonline.com.br";
const CLIENT_ID = "veiling-online";
const CLIENT_SECRET = "9be425c1-cac1-46ba-a89b-2b564f9ad474";

const body = new URLSearchParams({
  grant_type: "password",
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  username: rows[0].usuario,
  password: rows[0].senha,
  scope: "openid profile offline_access",
});
const loginResp = await fetch(`${VEILING_BASE}/identity/connect/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: body.toString()
});
const loginText = await loginResp.text();
console.log('Login status:', loginResp.status, 'body preview:', loginText.substring(0, 200));
const loginData = JSON.parse(loginText);
const token = loginData.access_token;
console.log('Token obtido:', token ? 'sim' : 'não');
if (!token) { console.log('Erro login:', loginData); process.exit(1); }

const customerId = rows[0].customerId || '';
const params = new URLSearchParams({
  page: '1',
  totalPage: '2',
  customerId,
  orderBy: 'AZ',
  includeGfpImages: 'false',
});

const offersResp = await fetch(`${VEILING_BASE}/ecommerce/api/Offer?${params.toString()}`, {
  headers: { Authorization: `Bearer ${token}` }
});
const offersData = await offersResp.json();
const offers = offersData.offers || offersData.items || offersData;
const offer = Array.isArray(offers) ? offers[0] : null;

if (offer) {
  console.log('\n=== TODOS OS CAMPOS DA OFERTA ===');
  for (const [k, v] of Object.entries(offer)) {
    if (typeof v === 'object' && v !== null) {
      console.log(`  ${k}: ${JSON.stringify(v)}`);
    } else {
      console.log(`  ${k}: ${v}`);
    }
  }
  
  // Verificar campos de frete especificamente
  console.log('\n=== CAMPOS RELACIONADOS A FRETE ===');
  const freteKeys = Object.keys(offer).filter(k => 
    k.toLowerCase().includes('fret') || 
    k.toLowerCase().includes('freight') || 
    k.toLowerCase().includes('delivery') ||
    k.toLowerCase().includes('shipping')
  );
  if (freteKeys.length === 0) {
    console.log('  Nenhum campo de frete encontrado na listagem!');
  } else {
    for (const k of freteKeys) {
      console.log(`  ${k}:`, JSON.stringify(offer[k]));
    }
  }
  
  // Tentar endpoint de detalhes da oferta
  const offerId = offer.offerId || offer.id;
  if (offerId) {
    console.log(`\n=== DETALHES DA OFERTA ${offerId} ===`);
    const detResp = await fetch(`${VEILING_BASE}/ecommerce/api/Offer/${offerId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (detResp.ok) {
      const det = await detResp.json();
      const detFreteKeys = Object.keys(det).filter(k => 
        k.toLowerCase().includes('fret') || 
        k.toLowerCase().includes('freight') || 
        k.toLowerCase().includes('delivery') ||
        k.toLowerCase().includes('shipping')
      );
      console.log('  Campos de frete nos detalhes:', detFreteKeys);
      for (const k of detFreteKeys) {
        console.log(`  ${k}:`, JSON.stringify(det[k]));
      }
    } else {
      console.log('  Endpoint de detalhes retornou:', detResp.status);
    }
  }
} else {
  console.log('Nenhuma oferta encontrada. Resposta:', JSON.stringify(offersData).substring(0, 500));
}
