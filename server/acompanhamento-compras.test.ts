import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import {
  criarOuAtualizarAcompanhamento,
  listarAcompanhamentosPorCompra,
  obterResumoCompra,
  deletarAcompanhamento,
} from './db';

describe('Acompanhamento de Compras', () => {
  let db: any;
  let compraId = 1;
  let compraItemId = 1;

  beforeAll(async () => {
    db = await getDb();
  });

  it('deve criar um acompanhamento de compra', async () => {
    await criarOuAtualizarAcompanhamento(
      compraItemId,
      compraId,
      1,
      'Alstroemeria Akemi',
      14,
      0,
      'Aguardando chegada'
    );

    const acompanhamentos = await listarAcompanhamentosPorCompra(compraId);
    expect(acompanhamentos.length).toBeGreaterThan(0);
    expect(acompanhamentos[0].produtoNome).toBe('Alstroemeria Akemi');
    expect(acompanhamentos[0].status).toBe('PENDENTE');
  });

  it('deve atualizar quantidade comprada e calcular restante', async () => {
    // Primeira compra: 10 unidades de 14
    await criarOuAtualizarAcompanhamento(
      compraItemId,
      compraId,
      1,
      'Alstroemeria Akemi',
      14,
      10,
      'Primeira entrega'
    );

    const acompanhamentos = await listarAcompanhamentosPorCompra(compraId);
    const item = acompanhamentos[0];

    expect(item.quantidadeComprada).toBe('10.00');
    expect(item.quantidadeRestante).toBe('4.00');
    expect(item.status).toBe('PARCIAL');
  });

  it('deve marcar como completo quando quantidade comprada = pedida', async () => {
    // Segunda compra: 4 unidades restantes
    await criarOuAtualizarAcompanhamento(
      compraItemId,
      compraId,
      1,
      'Alstroemeria Akemi',
      14,
      14,
      'Compra completa'
    );

    const acompanhamentos = await listarAcompanhamentosPorCompra(compraId);
    const item = acompanhamentos[0];

    expect(item.quantidadeComprada).toBe('14.00');
    expect(item.quantidadeRestante).toBe('0.00');
    expect(item.status).toBe('COMPLETO');
  });

  it('deve marcar como excedente quando quantidade comprada > pedida', async () => {
    // Compra com excedente: 16 unidades (2 a mais)
    await criarOuAtualizarAcompanhamento(
      compraItemId,
      compraId,
      1,
      'Alstroemeria Akemi',
      14,
      16,
      'Compra com excedente'
    );

    const acompanhamentos = await listarAcompanhamentosPorCompra(compraId);
    const item = acompanhamentos[0];

    expect(item.quantidadeComprada).toBe('16.00');
    expect(item.quantidadeExcedente).toBe('2.00');
    expect(item.status).toBe('EXCEDENTE');
  });

  it('deve calcular resumo correto da compra', async () => {
    const resumo = await obterResumoCompra(compraId);

    expect(resumo).toHaveProperty('quantidadeTotalPedida');
    expect(resumo).toHaveProperty('quantidadeTotalComprada');
    expect(resumo).toHaveProperty('quantidadeTotalRestante');
    expect(resumo).toHaveProperty('quantidadeTotalExcedente');
  });

  it('deve deletar acompanhamento', async () => {
    const acompanhamentos = await listarAcompanhamentosPorCompra(compraId);
    if (acompanhamentos.length > 0) {
      const id = acompanhamentos[0].id;
      await deletarAcompanhamento(id);

      const acompanhamentosApos = await listarAcompanhamentosPorCompra(compraId);
      expect(acompanhamentosApos.length).toBeLessThan(acompanhamentos.length);
    }
  });
});
