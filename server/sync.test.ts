import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as db from './db';

describe('Sincronização Bidirecional - Produtos Loja <> Produtos Lista', () => {
  let produtoLojaId: number;
  let produtoListaId: number;

  beforeAll(async () => {
    // Criar um produto de loja
    const lojaResult = await db.createProdutoLoja({
      codigo: 'TEST-001',
      nome: 'Rosa Vermelha Premium',
      descricao: 'Rosa de alta qualidade',
      unidade: 'UN',
      departamento: 'FLORES',
      preco: '15.50',
      precoCusto: '8.00',
      estoque: '100',
      ativo: 1,
    });
    produtoLojaId = lojaResult.id;

    // Criar um produto de lista vinculado ao produto de loja
    const listaResult = await db.createProdutoLista({
      produtoLojaId,
      categoriaNome: 'FLORES',
      variedade: 'Rosa Vermelha Premium',
      valorUnitario: 15.50,
    });
    produtoListaId = listaResult.id;
  });

  it('deve sincronizar alterações de produtos_loja para produtos_lista', async () => {
    // Atualizar produto de loja
    await db.updateProdutoLoja(produtoLojaId, {
      nome: 'Rosa Vermelha Super Premium',
      preco: '18.00',
      departamento: 'FLORES PREMIUM',
    });

    // Verificar se produto de lista foi atualizado
    const produtoLista = await db.getProdutoListaById(produtoListaId);
    expect(produtoLista?.variedade).toBe('Rosa Vermelha Super Premium');
    expect(produtoLista?.valorUnitario).toBe('18.00');
    expect(produtoLista?.categoriaNome).toBe('FLORES PREMIUM');
  });

  it('deve sincronizar alterações de produtos_lista para produtos_loja', async () => {
    // Atualizar produto de lista
    await db.updateProdutoLista(produtoListaId, {
      variedade: 'Rosa Vermelha Deluxe',
      valorUnitario: 20.00,
      categoriaNome: 'FLORES DELUXE',
    });

    // Verificar se produto de loja foi atualizado
    const produtoLoja = await db.getProdutoLoja(produtoLojaId);
    expect(produtoLoja?.nome).toBe('ROSA VERMELHA DELUXE');
    expect(produtoLoja?.preco).toBe('20.00');
    expect(produtoLoja?.departamento).toBe('FLORES DELUXE');
  });

  it('deve sincronizar status ativo/inativo bidireccionalmente', async () => {
    // Desativar produto de loja
    await db.updateProdutoLoja(produtoLojaId, { ativo: 0 });

    // Verificar se produto de lista foi desativado
    let produtoLista = await db.getProdutoListaById(produtoListaId);
    expect(produtoLista?.ativo).toBe(0);

    // Ativar produto de lista
    await db.toggleProdutoListaAtivo(produtoListaId, true);

    // Verificar se produto de loja foi ativado
    const produtoLoja = await db.getProdutoLoja(produtoLojaId);
    expect(produtoLoja?.ativo).toBe(1);
  });

  it('deve remover vinculação ao deletar produto de loja', async () => {
    // Deletar produto de loja
    await db.deleteProdutoLoja(produtoLojaId);

    // Verificar se vinculação foi removida em produto de lista
    const produtoLista = await db.getProdutoListaById(produtoListaId);
    expect(produtoLista?.produtoLojaId).toBeNull();
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (produtoListaId) await db.deleteProdutoLista(produtoListaId);
  });
});
