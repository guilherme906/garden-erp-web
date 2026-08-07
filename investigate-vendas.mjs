import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

async function run() {
  const conn = await mysql.createConnection(url);
  
  // 1. Total de vendas no banco
  const [totalRows] = await conn.query("SELECT COUNT(*) as total FROM vendas");
  console.log("=== TOTAL DE VENDAS NO BANCO ===");
  console.log("Total:", totalRows[0].total);
  
  // 2. Vendas com deletedAt preenchido (soft deleted)
  const [deletedRows] = await conn.query("SELECT COUNT(*) as total FROM vendas WHERE deletedAt IS NOT NULL");
  console.log("\n=== VENDAS SOFT-DELETED (deletedAt IS NOT NULL) ===");
  console.log("Total deletadas:", deletedRows[0].total);
  
  // 3. Listar vendas deletadas
  if (deletedRows[0].total > 0) {
    const [deleted] = await conn.query("SELECT id, clienteNome, data, status, total, deletedAt FROM vendas WHERE deletedAt IS NOT NULL ORDER BY id");
    console.log("\nVendas deletadas:");
    deleted.forEach(v => {
      console.log(`  ID: ${v.id} | Cliente: ${v.clienteNome} | Data: ${v.data} | Status: ${v.status} | Total: ${v.total} | DeletadoEm: ${v.deletedAt}`);
    });
  }
  
  // 4. Vendas ativas (sem deletedAt)
  const [activeRows] = await conn.query("SELECT COUNT(*) as total FROM vendas WHERE deletedAt IS NULL");
  console.log("\n=== VENDAS ATIVAS (deletedAt IS NULL) ===");
  console.log("Total ativas:", activeRows[0].total);
  
  // 5. Listar todas as vendas com status
  const [allVendas] = await conn.query("SELECT id, clienteNome, data, status, total, deletedAt, faturado FROM vendas ORDER BY id");
  console.log("\n=== TODAS AS VENDAS ===");
  allVendas.forEach(v => {
    const deleted = v.deletedAt ? `DELETADA em ${v.deletedAt}` : 'ATIVA';
    console.log(`  ID: ${v.id} | ${v.clienteNome} | ${v.data} | ${v.status} | R$ ${v.total} | ${deleted} | Faturado: ${v.faturado}`);
  });
  
  // 6. Verificar se há IDs faltando na sequência
  const [ids] = await conn.query("SELECT id FROM vendas ORDER BY id");
  const idList = ids.map(r => r.id);
  if (idList.length > 0) {
    const min = idList[0];
    const max = idList[idList.length - 1];
    const missing = [];
    for (let i = min; i <= max; i++) {
      if (!idList.includes(i)) missing.push(i);
    }
    if (missing.length > 0) {
      console.log("\n=== IDs FALTANDO NA SEQUÊNCIA ===");
      console.log("IDs ausentes:", missing.join(", "));
    } else {
      console.log("\n=== Nenhum ID faltando na sequência ===");
    }
  }
  
  await conn.end();
}

run().catch(e => { console.error(e); process.exit(1); });
