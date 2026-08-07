import mysql from 'mysql2/promise';
import { ENV } from './server/_core/env.ts';

const conn = await mysql.createConnection(ENV.databaseUrl);

try {
  const [count] = await conn.execute("SELECT COUNT(*) as total FROM catalogos_venda_itens");
  console.log(`✅ Total de itens no catálogo: ${count[0].total}`);

  const [catalogo] = await conn.execute("SELECT id, titulo FROM catalogos_venda WHERE titulo = 'Veiling'");
  if (catalogo.length > 0) {
    console.log(`✅ Catálogo Veiling ID: ${catalogo[0].id}`);
  }

  await conn.end();
  process.exit(0);
} catch (err) {
  console.error("❌ Erro:", err.message);
  await conn.end();
  process.exit(1);
}
