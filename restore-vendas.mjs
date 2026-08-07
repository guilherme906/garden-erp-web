import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

async function run() {
  const conn = await mysql.createConnection(url);
  
  // Restaurar todas as vendas que foram soft-deleted
  console.log("Restaurando vendas deletadas...");
  const [result] = await conn.query("UPDATE vendas SET deletedAt = NULL WHERE deletedAt IS NOT NULL");
  console.log(`Vendas restauradas: ${result.affectedRows}`);
  
  // Verificar resultado
  const [active] = await conn.query("SELECT id, clienteNome, data, status, total, deletedAt FROM vendas WHERE deletedAt IS NULL ORDER BY id");
  console.log("\n=== VENDAS ATIVAS APÓS RESTAURAÇÃO ===");
  active.forEach(v => {
    console.log(`  ID: ${v.id} | ${v.clienteNome} | ${v.data} | ${v.status} | R$ ${v.total}`);
  });
  console.log(`Total ativas: ${active.length}`);
  
  await conn.end();
}

run().catch(e => { console.error(e); process.exit(1); });
