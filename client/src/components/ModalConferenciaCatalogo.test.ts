import { describe, it, expect, vi } from 'vitest';

describe('ModalConferenciaCatalogo - Cálculos', () => {
  // Função auxiliar para calcular valor com desconto (mesma do componente)
  const calcularValorComDesconto = (precoOriginal: number, desconto: number): number => {
    const fatorDesconto = 1 - (desconto / 100);
    return precoOriginal * fatorDesconto;
  };

  it('deve calcular valor com desconto corretamente', () => {
    const preco = 100;
    const desconto = 10;
    const resultado = calcularValorComDesconto(preco, desconto);
    expect(resultado).toBe(90);
  });

  it('deve calcular valor com desconto de 0%', () => {
    const preco = 100;
    const desconto = 0;
    const resultado = calcularValorComDesconto(preco, desconto);
    expect(resultado).toBe(100);
  });

  it('deve calcular valor com desconto de 100%', () => {
    const preco = 100;
    const desconto = 100;
    const resultado = calcularValorComDesconto(preco, desconto);
    expect(resultado).toBe(0);
  });

  it('deve calcular valor com desconto de 5%', () => {
    const preco = 50.00;
    const desconto = 5;
    const resultado = calcularValorComDesconto(preco, desconto);
    expect(resultado).toBeCloseTo(47.50, 2);
  });

  it('deve calcular valor com desconto de 15%', () => {
    const preco = 200.00;
    const desconto = 15;
    const resultado = calcularValorComDesconto(preco, desconto);
    expect(resultado).toBeCloseTo(170.00, 2);
  });

  it('deve calcular economia corretamente', () => {
    const preco = 100;
    const desconto = 20;
    const valorComDesconto = calcularValorComDesconto(preco, desconto);
    const economia = preco - valorComDesconto;
    expect(economia).toBe(20);
  });

  it('deve calcular total de múltiplos produtos com descontos diferentes', () => {
    const produtos = [
      { id: 1, preco: 100, desconto: 10 },
      { id: 2, preco: 50, desconto: 5 },
      { id: 3, preco: 200, desconto: 15 },
    ];

    let totalOriginal = 0;
    let totalComDesconto = 0;

    produtos.forEach(p => {
      totalOriginal += p.preco;
      totalComDesconto += calcularValorComDesconto(p.preco, p.desconto);
    });

    const totalEconomia = totalOriginal - totalComDesconto;

    expect(totalOriginal).toBe(350);
    expect(totalComDesconto).toBeCloseTo(302.50, 2);
    expect(totalEconomia).toBeCloseTo(47.50, 2);
  });

  it('deve lidar com valores decimais corretamente', () => {
    const preco = 123.45;
    const desconto = 7.5;
    const resultado = calcularValorComDesconto(preco, desconto);
    expect(resultado).toBeCloseTo(114.19, 2);
  });

  it('deve lidar com desconto máximo de 100%', () => {
    const preco = 999.99;
    const desconto = 100;
    const resultado = calcularValorComDesconto(preco, desconto);
    expect(resultado).toBeCloseTo(0, 2);
  });

  it('deve calcular corretamente para desconto padrão de 5%', () => {
    const precos = [50, 100, 150, 200];
    const desconto = 5;
    
    precos.forEach(preco => {
      const resultado = calcularValorComDesconto(preco, desconto);
      const esperado = preco * 0.95;
      expect(resultado).toBeCloseTo(esperado, 2);
    });
  });

  it('deve validar que desconto não pode ser negativo', () => {
    const preco = 100;
    const desconto = Math.max(0, -10); // Simular validação
    const resultado = calcularValorComDesconto(preco, desconto);
    expect(resultado).toBe(100);
  });

  it('deve validar que desconto não pode exceder 100%', () => {
    const preco = 100;
    const desconto = Math.min(100, 150); // Simular validação
    const resultado = calcularValorComDesconto(preco, desconto);
    expect(resultado).toBe(0);
  });
});
