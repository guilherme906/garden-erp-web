import mysql from 'mysql2/promise';
import { ENV } from './server/_core/env.ts';

const conn = await mysql.createConnection(ENV.databaseUrl);

try {
  const [columns] = await conn.execute("DESCRIBE catalogos_venda_itens");
  
  console.log("=== Estrutura de catalogos_venda_itens ===");
  columns.forEach(col => {
    console.log(`${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'})`);
  });

  // Contar quantos itens tem
  const [count] = await conn.execute("SELECT COUNT(*) as total FROM catalogos_venda_itens");
  console.log(`\nTotal de itens: ${count[0].total}`);

  // Listar os primeiros 3 itens
  const [items] = await conn.execute("SELECT * FROM catalogos_venda_itens LIMIT 3");
  console.log("\nPrimeiros 3 itens:");
  console.log(items);

  await conn.end();
  process.exit(0);
} catch (err) {
  console.error("❌ Erro:", err.message);
  await conn.end();
  process.exit(1);
}
