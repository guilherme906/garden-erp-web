import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';

describe('Consolidação de Orçamentos em Pedido de Compra', () => {
  let dbConn: any;

  beforeAll(async () => {
    dbConn = await getDb();
  });

  it('deve consolidar 2 orçamentos com itens diferentes em um único pedido', async () => {
    if (!dbConn) {
      console.log('DB não disponível');
      return;
    }

    const { sql: sqlFn } = await import('drizzle-orm');

    // Criar cliente
    const clienteRes = await dbConn.execute(sqlFn`
      INSERT INTO clientes (nome, telefone, email, endereco, createdAt, updatedAt)
      VALUES ('Cliente Teste Consolidação', '11999999999', 'teste@consolidacao.com', 'Rua Teste', NOW(), NOW())
    `);
    const clienteId = (clienteRes[0] as any).insertId;

    // Criar 2 orçamentos
    const venda1Res = await dbConn.execute(sqlFn`
      INSERT INTO vendas (clienteId, data, status, total, createdAt, updatedAt)
      VALUES (${clienteId}, CURDATE(), 'APROVADO', 100, NOW(), NOW())
    `);
    const venda1Id = (venda1Res[0] as any).insertId;

    const venda2Res = await dbConn.execute(sqlFn`
      INSERT INTO vendas (clienteId, data, status, total, createdAt, updatedAt)
      VALUES (${clienteId}, CURDATE(), 'APROVADO', 150, NOW(), NOW())
    `);
    const venda2Id = (venda2Res[0] as any).insertId;

    // Adicionar itens ao orçamento 1
    await dbConn.execute(sqlFn`
      INSERT INTO venda_itens (vendaId, produtoNome, quantidade, valorUnitario, subtotal)
      VALUES (${venda1Id}, 'Produto A', 10, 10, 100)
    `);

    // Adicionar itens ao orçamento 2
    await dbConn.execute(sqlFn`
      INSERT INTO venda_itens (vendaId, produtoNome, quantidade, valorUnitario, subtotal)
      VALUES (${venda2Id}, 'Produto B', 15, 10, 150)
    `);

    // Simular lógica de consolidação
    const vendaIds = [venda1Id, venda2Id];
    console.log('DEBUG: vendaIds =', vendaIds);
    
    // Buscar itens
    const { sql } = await import('drizzle-orm');
    const itensRes = await dbConn.execute(sqlFn`
      SELECT vi.produtoId, vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.subtotal, vi.vendaId
      FROM venda_itens vi 
      WHERE vi.vendaId IN (${sql.raw(vendaIds.join(','))})
      ORDER BY vi.produtoNome ASC
    `);
    const itens = itensRes[0] as unknown as any[];

    console.log('✅ Itens recuperados:', itens);
    expect(itens.length).toBe(2);
    expect(itens[0].produtoNome).toBe('Produto A');
    expect(itens[1].produtoNome).toBe('Produto B');

    // Mesclar itens
    const mapa = new Map<string, { produtoId: number | null; produtoNome: string; quantidade: number; precoVenda: number; subtotalVenda: number; vendaIds: number[] }>();
    for (const item of itens) {
      const chave = `${item.produtoNome}||${parseFloat(item.valorUnitario)}`;
      if (mapa.has(chave)) {
        const existing = mapa.get(chave)!;
        existing.quantidade += parseFloat(item.quantidade);
        existing.subtotalVenda += parseFloat(item.subtotal);
        if (!existing.vendaIds.includes(item.vendaId)) {
          existing.vendaIds.push(item.vendaId);
        }
      } else {
        mapa.set(chave, {
          produtoId: item.produtoId || null,
          produtoNome: item.produtoNome,
          quantidade: parseFloat(item.quantidade),
          precoVenda: parseFloat(item.valorUnitario),
          subtotalVenda: parseFloat(item.subtotal),
          vendaIds: [item.vendaId],
        });
      }
    }

    const itensMesclados = Array.from(mapa.values()).sort((a, b) =>
      a.produtoNome.localeCompare(b.produtoNome, 'pt-BR')
    );

    console.log('✅ Itens mesclados:', itensMesclados);
    expect(itensMesclados.length).toBe(2);
    expect(itensMesclados[0].produtoNome).toBe('Produto A');
    expect(itensMesclados[0].quantidade).toBe(10);
    expect(itensMesclados[1].produtoNome).toBe('Produto B');
    expect(itensMesclados[1].quantidade).toBe(15);

    // Criar pedido de compra
    const maxNumRes = await dbConn.execute(sqlFn`SELECT COALESCE(MAX(numero), 0) as maxNum FROM pedidos_compra`);
    const maxNum = (((maxNumRes as unknown as any[])[0] as any[])[0]?.maxNum || 0) + 1;
    
    const totalVenda = itensMesclados.reduce((s, i) => s + i.subtotalVenda, 0);
    const dataStr = new Date().toISOString().slice(0, 10);

    const insertRes = await dbConn.execute(sqlFn`
      INSERT INTO pedidos_compra (numero, data, solicitante, observacoes, status, total, orcamentosOrigemIds, createdAt, updatedAt)
      VALUES (${maxNum}, ${dataStr}, 'teste', ${'Consolidação de 2 orçamentos'}, 'ABERTO', ${totalVenda}, ${JSON.stringify(vendaIds)}, NOW(), NOW())
    `);
    const pedidoId = (insertRes[0] as any).insertId;

    console.log('✅ Pedido criado:', { pedidoId, numero: maxNum, total: totalVenda });
    expect(pedidoId).toBeGreaterThan(0);
    expect(totalVenda).toBe(250);

    // Inserir itens no pedido
    for (const item of itensMesclados) {
      await dbConn.execute(sqlFn`
        INSERT INTO pedido_compra_itens (pedidoCompraId, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda, vendaOrigemId)
        VALUES (${pedidoId}, ${item.produtoId}, ${item.produtoNome}, ${item.quantidade}, ${item.precoVenda}, ${item.subtotalVenda}, ${item.vendaIds[0]})
      `);
    }

    // Verificar se os itens foram inseridos
    const itensInsRes = await dbConn.execute(sqlFn`
      SELECT * FROM pedido_compra_itens WHERE pedidoCompraId = ${pedidoId}
    `);
    const itensInseridos = itensInsRes[0] as unknown as any[];

    console.log('✅ Itens inseridos no pedido:', itensInseridos);
    expect(itensInseridos.length).toBe(2);
    expect(itensInseridos[0].produtoNome).toBe('Produto A');
    expect(parseFloat(itensInseridos[0].quantidade)).toBe(10);
    expect(itensInseridos[1].produtoNome).toBe('Produto B');
    expect(parseFloat(itensInseridos[1].quantidade)).toBe(15);

    // Verificar se o pedido foi criado corretamente
    const pedidoRes = await dbConn.execute(sqlFn`
      SELECT * FROM pedidos_compra WHERE id = ${pedidoId}
    `);
    const pedido = ((pedidoRes[0] as unknown as any[])[0]);

    console.log('✅ Pedido recuperado:', pedido);
    expect(parseFloat(pedido.total)).toBe(250);
    expect(pedido.orcamentosOrigemIds).toBe(JSON.stringify(vendaIds));

    // Limpeza
    await dbConn.execute(sqlFn`DELETE FROM pedido_compra_itens WHERE pedidoCompraId = ${pedidoId}`);
    await dbConn.execute(sqlFn`DELETE FROM pedidos_compra WHERE id = ${pedidoId}`);
    await dbConn.execute(sqlFn`DELETE FROM venda_itens WHERE vendaId IN (${venda1Id}, ${venda2Id})`);
    await dbConn.execute(sqlFn`DELETE FROM vendas WHERE id IN (${venda1Id}, ${venda2Id})`);
    await dbConn.execute(sqlFn`DELETE FROM clientes WHERE id = ${clienteId}`);
  });

  it('deve consolidar 2 orçamentos com itens iguais (mesmo nome e preço) somando quantidade', async () => {
    if (!dbConn) {
      console.log('DB não disponível');
      return;
    }

    const { sql: sqlFn } = await import('drizzle-orm');

    // Criar cliente
    const clienteRes = await dbConn.execute(sqlFn`
      INSERT INTO clientes (nome, telefone, email, endereco, createdAt, updatedAt)
      VALUES ('Cliente Teste Consolidação 2', '11999999998', 'teste2@consolidacao.com', 'Rua Teste', NOW(), NOW())
    `);
    const clienteId = (clienteRes[0] as any).insertId;

    // Criar 2 orçamentos
    const venda1Res = await dbConn.execute(sqlFn`
      INSERT INTO vendas (clienteId, data, status, total, createdAt, updatedAt)
      VALUES (${clienteId}, CURDATE(), 'APROVADO', 100, NOW(), NOW())
    `);
    const venda1Id = (venda1Res[0] as any).insertId;

    const venda2Res = await dbConn.execute(sqlFn`
      INSERT INTO vendas (clienteId, data, status, total, createdAt, updatedAt)
      VALUES (${clienteId}, CURDATE(), 'APROVADO', 100, NOW(), NOW())
    `);
    const venda2Id = (venda2Res[0] as any).insertId;

    // Adicionar MESMO item aos 2 orçamentos
    await dbConn.execute(sqlFn`
      INSERT INTO venda_itens (vendaId, produtoNome, quantidade, valorUnitario, subtotal)
      VALUES (${venda1Id}, 'Produto A', 10, 10, 100)
    `);

    await dbConn.execute(sqlFn`
      INSERT INTO venda_itens (vendaId, produtoNome, quantidade, valorUnitario, subtotal)
      VALUES (${venda2Id}, 'Produto A', 5, 10, 50)
    `);

    // Simular lógica de consolidação
    const vendaIds = [venda1Id, venda2Id];
    console.log('DEBUG: vendaIds =', vendaIds);
    
    // Buscar itens
    const { sql } = await import('drizzle-orm');
    const itensRes = await dbConn.execute(sqlFn`
      SELECT vi.produtoId, vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.subtotal, vi.vendaId
      FROM venda_itens vi 
      WHERE vi.vendaId IN (${sql.raw(vendaIds.join(','))})
      ORDER BY vi.produtoNome ASC
    `);
    const itens = itensRes[0] as unknown as any[];

    console.log('✅ Itens recuperados (mesmo produto):', itens);
    expect(itens.length).toBe(2);

    // Mesclar itens
    const mapa = new Map<string, { produtoId: number | null; produtoNome: string; quantidade: number; precoVenda: number; subtotalVenda: number; vendaIds: number[] }>();
    for (const item of itens) {
      const chave = `${item.produtoNome}||${parseFloat(item.valorUnitario)}`;
      if (mapa.has(chave)) {
        const existing = mapa.get(chave)!;
        existing.quantidade += parseFloat(item.quantidade);
        existing.subtotalVenda += parseFloat(item.subtotal);
        if (!existing.vendaIds.includes(item.vendaId)) {
          existing.vendaIds.push(item.vendaId);
        }
      } else {
        mapa.set(chave, {
          produtoId: item.produtoId || null,
          produtoNome: item.produtoNome,
          quantidade: parseFloat(item.quantidade),
          precoVenda: parseFloat(item.valorUnitario),
          subtotalVenda: parseFloat(item.subtotal),
          vendaIds: [item.vendaId],
        });
      }
    }

    const itensMesclados = Array.from(mapa.values());

    console.log('✅ Itens mesclados (deve ter 1 item com quantidade 15):', itensMesclados);
    expect(itensMesclados.length).toBe(1);
    expect(itensMesclados[0].produtoNome).toBe('Produto A');
    expect(itensMesclados[0].quantidade).toBe(15); // 10 + 5
    expect(itensMesclados[0].subtotalVenda).toBe(150); // 100 + 50

    // Limpeza
    await dbConn.execute(sqlFn`DELETE FROM venda_itens WHERE vendaId IN (${venda1Id}, ${venda2Id})`);
    await dbConn.execute(sqlFn`DELETE FROM vendas WHERE id IN (${venda1Id}, ${venda2Id})`);
    await dbConn.execute(sqlFn`DELETE FROM clientes WHERE id = ${clienteId}`);
  });
});
