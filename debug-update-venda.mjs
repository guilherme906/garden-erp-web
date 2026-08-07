import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Simular o que updateVenda faz: delete all itens + reinsert
// Depois simular sincronizarPedidosCompraAoAlterarOrcamento

const vendaId = 840004;

// Buscar itens atuais
const [itensAtuais] = await conn.execute('SELECT * FROM venda_itens WHERE vendaId = ?', [vendaId]);
console.log('Itens atuais:', itensAtuais.length);

// Simular itens sem ASTER COMUM
const novoItens = itensAtuais.filter(i => i.produtoNome !== 'ASTER COMUM');
console.log('Novos itens (sem ASTER COMUM):', novoItens.length);

// Simular a sincronização
const [pedidos] = await conn.execute('SELECT DISTINCT pedidoCompraId FROM pedido_compra_itens WHERE vendaOrigemId = ?', [vendaId]);
console.log('\nPedidos de compra vinculados:', pedidos.map(p => p.pedidoCompraId));

for (const pedidoRow of pedidos) {
  const pedidoId = pedidoRow.pedidoCompraId;
  
  const [todosItens] = await conn.execute(
    'SELECT id, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda, vendaOrigemId FROM pedido_compra_itens WHERE pedidoCompraId = ?',
    [pedidoId]
  );
  
  // Criar mapa consolidado
  const mapaConsolidado = new Map();
  
  // Itens de OUTROS orçamentos
  for (const item of todosItens) {
    if (item.vendaOrigemId !== vendaId) {
      const chave = `${item.produtoNome}||${item.precoVenda}`;
      mapaConsolidado.set(chave, {
        id: item.id,
        produtoId: item.produtoId || null,
        produtoNome: item.produtoNome,
        quantidade: parseFloat(item.quantidade),
        precoVenda: parseFloat(item.precoVenda),
        subtotalVenda: parseFloat(item.subtotalVenda),
        vendaOrigemId: item.vendaOrigemId,
      });
    }
  }
  
  // Adicionar novos itens do orçamento alterado
  for (const novoItem of novoItens) {
    const valorUnitario = parseFloat(novoItem.valorUnitario || novoItem.precoVenda);
    const quantidade = parseFloat(novoItem.quantidade);
    const subtotal = parseFloat(novoItem.subtotal || novoItem.subtotalVenda);
    
    const chave = `${novoItem.produtoNome}||${valorUnitario}`;
    if (mapaConsolidado.has(chave)) {
      const existing = mapaConsolidado.get(chave);
      existing.quantidade += quantidade;
      existing.subtotalVenda += subtotal;
    } else {
      mapaConsolidado.set(chave, {
        id: 0,
        produtoId: novoItem.produtoId || null,
        produtoNome: novoItem.produtoNome || '',
        quantidade: quantidade,
        precoVenda: valorUnitario,
        subtotalVenda: subtotal,
        vendaOrigemId: vendaId,
      });
    }
  }
  
  const itensConsolidados = Array.from(mapaConsolidado.values()).sort((a, b) =>
    a.produtoNome.localeCompare(b.produtoNome, 'pt-BR')
  );
  
  console.log(`\nPedido ${pedidoId}: ${todosItens.length} itens → ${itensConsolidados.length} após consolidação`);
  
  // Tentar o DELETE + INSERT em transação
  try {
    await conn.beginTransaction();
    await conn.execute('DELETE FROM pedido_compra_itens WHERE pedidoCompraId = ?', [pedidoId]);
    
    let totalPedido = 0;
    for (const item of itensConsolidados) {
      await conn.execute(
        'INSERT INTO pedido_compra_itens (pedidoCompraId, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda, vendaOrigemId) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [pedidoId, item.produtoId, item.produtoNome, item.quantidade, item.precoVenda, item.subtotalVenda, item.vendaOrigemId]
      );
      totalPedido += item.subtotalVenda;
    }
    
    await conn.execute('UPDATE pedidos_compra SET total = ?, updatedAt = NOW() WHERE id = ?', [totalPedido, pedidoId]);
    await conn.rollback(); // ROLLBACK - só testando
    console.log(`  ✅ Pedido ${pedidoId}: simulação OK (rollback aplicado)`);
  } catch (e) {
    await conn.rollback();
    console.error(`  ❌ Pedido ${pedidoId}: ERRO:`, e.message);
    console.error('  Detalhe:', e.sqlMessage || e.code);
  }
}

await conn.end();
console.log('\nDiagnóstico concluído.');
