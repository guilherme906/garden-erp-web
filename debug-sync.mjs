import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Verificar pedidos vinculados ao orçamento 840004
const [pedidos] = await conn.execute('SELECT DISTINCT pedidoCompraId FROM pedido_compra_itens WHERE vendaOrigemId = 840004');
console.log('Pedidos de compra vinculados:', pedidos.length, pedidos.map(p => p.pedidoCompraId));

for (const pedidoRow of pedidos) {
  const pedidoId = pedidoRow.pedidoCompraId;
  const [itens] = await conn.execute(
    'SELECT id, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda, vendaOrigemId FROM pedido_compra_itens WHERE pedidoCompraId = ?',
    [pedidoId]
  );
  console.log(`\nPedido ${pedidoId}: ${itens.length} itens`);
  
  // Verificar itens problemáticos
  const semNome = itens.filter(i => !i.produtoNome);
  const semPreco = itens.filter(i => i.precoVenda === null || i.precoVenda === undefined);
  const semSubtotal = itens.filter(i => i.subtotalVenda === null || i.subtotalVenda === undefined);
  
  if (semNome.length > 0) console.log('  - Itens sem nome:', semNome.length);
  if (semPreco.length > 0) console.log('  - Itens sem preço:', semPreco.length, semPreco.slice(0,2).map(i => i.produtoNome));
  if (semSubtotal.length > 0) console.log('  - Itens sem subtotal:', semSubtotal.length);
  
  // Tentar simular a lógica de consolidação
  const mapaConsolidado = new Map();
  for (const item of itens) {
    if (item.vendaOrigemId !== 840004) {
      const chave = `${item.produtoNome}||${item.precoVenda}`;
      mapaConsolidado.set(chave, item);
    }
  }
  console.log(`  - Itens de outros orçamentos: ${mapaConsolidado.size}`);
  
  // Simular inserção com novos itens (sem ASTER COMUM)
  const novosItens = itens
    .filter(i => i.vendaOrigemId === 840004 && i.produtoNome !== 'ASTER COMUM')
    .map(i => ({
      produtoNome: i.produtoNome,
      quantidade: String(i.quantidade),
      valorUnitario: String(i.precoVenda),
      subtotal: String(i.subtotalVenda),
    }));
  
  console.log(`  - Novos itens (sem ASTER COMUM): ${novosItens.length}`);
}

// Verificar se há alguma constraint ou trigger que pode estar bloqueando
const [triggers] = await conn.execute("SHOW TRIGGERS LIKE 'pedido_compra_itens'");
console.log('\nTriggers:', triggers.length);

// Verificar se há FK constraints
const [fks] = await conn.execute(`
  SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedido_compra_itens' AND REFERENCED_TABLE_NAME IS NOT NULL
`);
console.log('FK constraints:', fks.map(f => `${f.COLUMN_NAME} -> ${f.REFERENCED_TABLE_NAME}.${f.REFERENCED_COLUMN_NAME}`));

await conn.end();
