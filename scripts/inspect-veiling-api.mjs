/**
 * Script para inspecionar os campos retornados pela API do Veiling Online
 * Roda com: node scripts/inspect-veiling-api.mjs
 */
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const VEILING_BASE = "https://backend.veilingonline.com.br";
const CLIENT_ID = "veiling-online";
const CLIENT_SECRET = "9be425c1-cac1-46ba-a89b-2b564f9ad474";

async function getVeilingCredentials() {
  const conn = await createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute('SELECT usuario, senha, customerId FROM veiling_config LIMIT 1');
  await conn.end();
  return rows[0];
}

async function login(usuario, senha) {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    username: usuario,
    password: senha,
    scope: "offline_access",
  });
  const resp = await fetch(`${VEILING_BASE}/identity/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!resp.ok) throw new Error(`Login falhou: ${resp.status}`);
  const data = await resp.json();
  return data.access_token;
}

async function getFirstOffer(token, customerId) {
  const params = new URLSearchParams({
    page: "1",
    totalPage: "3",
    customerId: customerId || "",
    orderBy: "AZ",
    includeGfpImages: "false",
  });
  const resp = await fetch(`${VEILING_BASE}/ecommerce/api/Offer?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Erro ao buscar ofertas: ${resp.status}`);
  const data = await resp.json();
  return data.offers?.[0];
}

try {
  const creds = await getVeilingCredentials();
  if (!creds) {
    console.log("Credenciais do Veiling não encontradas no banco.");
    process.exit(1);
  }
  console.log("Fazendo login no Veiling...");
  const token = await login(creds.usuario, creds.senha);
  console.log("Login OK. Buscando primeira oferta...");
  const offer = await getFirstOffer(token, creds.customerId);
  if (!offer) {
    console.log("Nenhuma oferta encontrada.");
    process.exit(1);
  }
  console.log("\n=== TODOS OS CAMPOS DA OFERTA ===");
  console.log(JSON.stringify(offer, null, 2));
  console.log("\n=== CHAVES DISPONÍVEIS ===");
  console.log(Object.keys(offer).join(', '));
} catch (err) {
  console.error("Erro:", err.message);
}
