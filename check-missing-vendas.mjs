import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

async function run() {
  const conn = await mysql.createConnection(url);
  
  // Verificar auto_increment para saber o último ID usado
  const [tableStatus] = await conn.query("SHOW TABLE STATUS LIKE 'vendas'");
  console.log("=== STATUS DA TABELA VENDAS ===");
  console.log("Auto Increment:", tableStatus[0].Auto_increment);
  console.log("Rows:", tableStatus[0].Rows);
  
  // Verificar se existem venda_itens órfãos (itens sem venda correspondente)
  const [orphanItems] = await conn.query(`
    SELECT vi.vendaId, COUNT(*) as totalItens 
    FROM venda_itens vi 
    LEFT JOIN vendas v ON vi.vendaId = v.id 
    WHERE v.id IS NULL 
    GROUP BY vi.vendaId
  `);
  
  if (orphanItems.length > 0) {
    console.log("\n=== ITENS ÓRFÃOS (vendas permanentemente excluídas) ===");
    orphanItems.forEach(o => {
      console.log(`  VendaId: ${o.vendaId} | Itens: ${o.totalItens}`);
    });
  } else {
    console.log("\n=== Nenhum item órfão encontrado ===");
  }
  
  // Verificar venda_links órfãos
  const [orphanLinks] = await conn.query(`
    SELECT vl.vendaId, vl.token, vl.createdAt 
    FROM venda_links vl 
    LEFT JOIN vendas v ON vl.vendaId = v.id 
    WHERE v.id IS NULL
  `);
  
  if (orphanLinks.length > 0) {
    console.log("\n=== LINKS ÓRFÃOS (vendas permanentemente excluídas) ===");
    orphanLinks.forEach(l => {
      console.log(`  VendaId: ${l.vendaId} | Token: ${l.token} | Criado: ${l.createdAt}`);
    });
  } else {
    console.log("\n=== Nenhum link órfão encontrado ===");
  }
  
  // Verificar títulos órfãos
  const [orphanTitulos] = await conn.query(`
    SELECT t.vendaId, t.clienteNome, t.valor, t.status 
    FROM titulos t 
    LEFT JOIN vendas v ON t.vendaId = v.id 
    WHERE v.id IS NULL
  `);
  
  if (orphanTitulos.length > 0) {
    console.log("\n=== TÍTULOS ÓRFÃOS (vendas permanentemente excluídas) ===");
    orphanTitulos.forEach(t => {
      console.log(`  VendaId: ${t.vendaId} | Cliente: ${t.clienteNome} | Valor: ${t.valor} | Status: ${t.status}`);
    });
  } else {
    console.log("\n=== Nenhum título órfão encontrado ===");
  }
  
  // Listar todas as vendas atuais
  const [allVendas] = await conn.query("SELECT id, clienteNome, data, status, total, deletedAt FROM vendas ORDER BY id");
  console.log("\n=== VENDAS ATUAIS ===");
  allVendas.forEach(v => {
    const status = v.deletedAt ? 'DELETADA' : 'ATIVA';
    console.log(`  ID: ${v.id} | ${v.clienteNome} | ${v.data} | ${v.status} | R$ ${v.total} | ${status}`);
  });
  
  await conn.end();
}

run().catch(e => { console.error(e); process.exit(1); });
