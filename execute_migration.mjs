import mysql from 'mysql2/promise';
import { ENV } from './server/_core/env.ts';
import fs from 'fs';

const conn = await mysql.createConnection(ENV.databaseUrl);

try {
  const sql = fs.readFileSync('drizzle/0058_small_cargill.sql', 'utf-8');
  const statements = sql.split('--> statement-breakpoint').filter(s => s.trim());
  
  for (const stmt of statements) {
    if (stmt.trim()) {
      await conn.execute(stmt.trim());
      console.log('✅ Executado:', stmt.trim().substring(0, 50) + '...');
    }
  }
  
  console.log('\n✨ Migration executada com sucesso!');
  await conn.end();
  process.exit(0);
} catch (err) {
  console.error('❌ Erro:', err.message);
  await conn.end();
  process.exit(1);
}
