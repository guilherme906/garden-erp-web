import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import * as db from './db';

describe('criarPedidoPublico - Stock Decrement', () => {
  let connection: any;

  beforeAll(async () => {
    connection = await getDb();
  });

  it('should accept produtoId in items', async () => {
    // Test data
    const pedidoData = {
      linkToken: 'test-token-' + Date.now(),
      clienteNome: 'Test Client',
      clienteEmail: 'test@example.com',
      clienteTelefone: '11999999999',
      total: '100.00',
      status: 'PENDENTE',
    };

    const itens = [
      {
        produtoNome: 'Test Product',
        quantidade: '1',
        valorUnitario: '100.00',
        subtotal: '100.00',
        observacao: 'Test observation',
      },
    ];

    const itemsWithIds = [
      {
        produtoId: 999999, // Non-existent ID for testing
        quantidade: 1,
      },
    ];

    // This should not throw an error
    const result = await db.createPedidoPublico(pedidoData as any, itens as any, itemsWithIds);
    
    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.linkToken).toBe(pedidoData.linkToken);
  });

  it('should handle empty itemsWithIds', async () => {
    const pedidoData = {
      linkToken: 'test-token-empty-' + Date.now(),
      clienteNome: 'Test Client 2',
      clienteEmail: 'test2@example.com',
      clienteTelefone: '11999999999',
      total: '50.00',
      status: 'PENDENTE',
    };

    const itens = [
      {
        produtoNome: 'Test Product 2',
        quantidade: '1',
        valorUnitario: '50.00',
        subtotal: '50.00',
        observacao: undefined,
      },
    ];

    const result = await db.createPedidoPublico(pedidoData as any, itens as any, []);
    
    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
  });
});
