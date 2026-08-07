import mysql from 'mysql2/promise';
import { ENV } from './server/_core/env.ts';

const conn = await mysql.createConnection(ENV.databaseUrl);

try {
  const [tables] = await conn.execute("SHOW TABLES");
  console.log("=== Tabelas do banco ===");
  tables.forEach(t => {
    const tableName = Object.values(t)[0];
    if (tableName.includes('catalogo') || tableName.includes('vend')) {
      console.log(`✅ ${tableName}`);
    }
  });
  
  await conn.end();
  process.exit(0);
} catch (err) {
  console.error("❌ Erro:", err.message);
  await conn.end();
  process.exit(1);
}
