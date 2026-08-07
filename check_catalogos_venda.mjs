import mysql from 'mysql2/promise';
import { ENV } from './server/_core/env.ts';

const conn = await mysql.createConnection(ENV.databaseUrl);

try {
  const [columns] = await conn.execute("DESCRIBE catalogos_venda");
  console.log("=== Colunas de catalogos_venda ===");
  columns.forEach(col => {
    console.log(`${col.Field}: ${col.Type}`);
  });

  const [catalogos] = await conn.execute("SELECT * FROM catalogos_venda LIMIT 3");
  console.log("\n=== Primeiros 3 catálogos ===");
  console.log(catalogos);

  await conn.end();
  process.exit(0);
} catch (err) {
  console.error("❌ Erro:", err.message);
  await conn.end();
  process.exit(1);
}
