/**
 * Script para investigar a origem do item ALSTROEMERIA LARANJA no orçamento 1290002
 */
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

let dbUrl;
try {
  const envContent = readFileSync('/home/ubuntu/garden-erp-web/.env', 'utf8');
  const match = envContent.match(/DATABASE_URL=(.+)/);
  if (match) dbUrl = match[1].trim();
} catch {}
if (!dbUrl) dbUrl = process.env.DATABASE_URL;

const conn = await createConnection(dbUrl);

try {
  console.log('=== Investigando orçamento 1290002 ===\n');

  // 1. Verificar os itens atuais do orçamento
  const [itens] = await conn.query(`
    SELECT vi.id, vi.vendaId, vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.createdAt, vi.updatedAt
    FROM venda_itens vi
    WHERE vi.vendaId = (SELECT id FROM vendas WHERE numero = 1290002)
    ORDER BY vi.id
  `);
  console.log('Itens atuais do orçamento 1290002:');
  itens.forEach(i => console.log(`  id=${i.id} | ${i.produtoNome} | qtd=${i.quantidade} | valor=${i.valorUnitario} | criado=${i.createdAt} | atualizado=${i.updatedAt}`));

  // 2. Verificar o histórico de alterações do orçamento
  const [historico] = await conn.query(`
    SELECT ha.id, ha.tabela, ha.registroId, ha.campo, ha.valorAnterior, ha.valorNovo, ha.alteradoPor, ha.alteradoEm
    FROM historico_alteracoes ha
    WHERE ha.tabela = 'vendas' AND ha.registroId = (SELECT id FROM vendas WHERE numero = 1290002)
    ORDER BY ha.alteradoEm DESC
    LIMIT 20
  `);
  console.log('\nHistórico de alterações do orçamento 1290002:');
  if (historico.length === 0) {
    console.log('  (nenhum histórico encontrado)');
  } else {
    historico.forEach(h => console.log(`  ${h.alteradoEm} | ${h.campo}: ${h.valorAnterior} → ${h.valorNovo} | por: ${h.alteradoPor}`));
  }

  // 3. Verificar se há outros orçamentos com ALSTROEMERIA LARANJA
  const [outros] = await conn.query(`
    SELECT vi.vendaId, v.numero, v.clienteNome, vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.createdAt
    FROM venda_itens vi
    JOIN vendas v ON v.id = vi.vendaId
    WHERE vi.produtoNome LIKE '%ALSTROEMERIA LARANJA%'
    ORDER BY vi.createdAt DESC
    LIMIT 10
  `);
  console.log('\nTodos os orçamentos com ALSTROEMERIA LARANJA:');
  outros.forEach(o => console.log(`  vendaId=${o.vendaId} | nº=${o.numero} | cliente=${o.clienteNome} | qtd=${o.quantidade} | valor=${o.valorUnitario} | criado=${o.createdAt}`));

  // 4. Verificar quando o item foi inserido no orçamento 1290002
  const [vendaInfo] = await conn.query(`
    SELECT v.id, v.numero, v.clienteNome, v.createdAt, v.updatedAt, v.total
    FROM vendas v
    WHERE v.numero = 1290002
  `);
  console.log('\nDados do orçamento 1290002:');
  vendaInfo.forEach(v => console.log(`  id=${v.id} | nº=${v.numero} | cliente=${v.clienteNome} | total=${v.total} | criado=${v.createdAt} | atualizado=${v.updatedAt}`));

  // 5. Verificar se o item ALSTROEMERIA LARANJA tem o mesmo vendaId que outros itens do 1290002
  if (vendaInfo.length > 0) {
    const vendaId = vendaInfo[0].id;
    const [itemAlst] = await conn.query(`
      SELECT vi.id, vi.vendaId, vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.createdAt, vi.updatedAt, vi.ordem
      FROM venda_itens vi
      WHERE vi.vendaId = ? AND vi.produtoNome LIKE '%ALSTROEMERIA%'
    `, [vendaId]);
    console.log('\nItem ALSTROEMERIA no vendaId correto:');
    itemAlst.forEach(i => console.log(`  id=${i.id} | vendaId=${i.vendaId} | ${i.produtoNome} | qtd=${i.quantidade} | valor=${i.valorUnitario} | ordem=${i.ordem} | criado=${i.createdAt}`));

    // 6. Verificar se o item foi inserido por sincronização de pedido de compra
    const [pedidosCompra] = await conn.query(`
      SELECT pc.id, pc.numero, pc.status, pc.createdAt
      FROM pedidos_compra pc
      JOIN pedido_compra_orcamentos pco ON pco.pedidoCompraId = pc.id
      WHERE pco.vendaId = ?
    `, [vendaId]);
    console.log('\nPedidos de compra que incluem o orçamento 1290002:');
    if (pedidosCompra.length === 0) {
      console.log('  (nenhum pedido de compra encontrado)');
    } else {
      pedidosCompra.forEach(p => console.log(`  id=${p.id} | nº=${p.numero} | status=${p.status} | criado=${p.createdAt}`));
    }
  }

} finally {
  await conn.end();
}
