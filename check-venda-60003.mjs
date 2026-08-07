import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

async function run() {
  const conn = await mysql.createConnection(url);
  
  // 1. Verificar se a venda 60003 existe
  const [venda] = await conn.query("SELECT * FROM vendas WHERE id = 60003");
  console.log("=== VENDA 60003 ===");
  if (venda.length > 0) {
    console.log("ENCONTRADA:", JSON.stringify(venda[0], null, 2));
  } else {
    console.log("NÃO ENCONTRADA no banco de dados");
  }
  
  // 2. Verificar se há itens da venda 60003
  const [itens] = await conn.query("SELECT * FROM venda_itens WHERE vendaId = 60003");
  console.log("\n=== ITENS DA VENDA 60003 ===");
  if (itens.length > 0) {
    console.log(`Encontrados ${itens.length} itens:`);
    itens.forEach(i => {
      console.log(`  Produto: ${i.produtoNome} | Qtd: ${i.quantidade} | Valor: ${i.valorUnitario} | Subtotal: ${i.subtotal}`);
    });
  } else {
    console.log("Nenhum item encontrado");
  }
  
  // 3. Verificar links da venda 60003
  const [links] = await conn.query("SELECT * FROM venda_links WHERE vendaId = 60003");
  console.log("\n=== LINKS DA VENDA 60003 ===");
  if (links.length > 0) {
    links.forEach(l => console.log(`  Token: ${l.token} | Criado: ${l.createdAt}`));
  } else {
    console.log("Nenhum link encontrado");
  }
  
  // 4. Verificar títulos da venda 60003
  const [titulos] = await conn.query("SELECT * FROM titulos WHERE vendaId = 60003");
  console.log("\n=== TÍTULOS DA VENDA 60003 ===");
  if (titulos.length > 0) {
    titulos.forEach(t => console.log(`  Cliente: ${t.clienteNome} | Valor: ${t.valor} | Status: ${t.status}`));
  } else {
    console.log("Nenhum título encontrado");
  }
  
  // 5. Verificar TODAS as vendas existentes e faltantes entre 60001-60011
  const [allVendas] = await conn.query("SELECT id, clienteNome, status, total, deletedAt FROM vendas WHERE id BETWEEN 60001 AND 60011 ORDER BY id");
  console.log("\n=== VENDAS ENTRE 60001-60011 ===");
  for (let i = 60001; i <= 60011; i++) {
    const v = allVendas.find(x => x.id === i);
    if (v) {
      console.log(`  ID ${i}: ${v.clienteNome} | ${v.status} | R$ ${v.total} | ${v.deletedAt ? 'DELETADA' : 'ATIVA'}`);
    } else {
      console.log(`  ID ${i}: *** AUSENTE DO BANCO ***`);
    }
  }
  
  await conn.end();
}

run().catch(e => { console.error(e); process.exit(1); });
