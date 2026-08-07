import { describe, it, expect } from "vitest";
import { calcularValoresCompraImportada } from "./db";

describe("Cálculos de Compra Importada - Tabela Excel", () => {
  it("deve calcular valores corretamente com dados da tabela Excel", () => {
    // Dados de exemplo da tabela Excel
    const dados = {
      quantidade: 10,
      valorCusto: 2.90,
      pacote: 1,
      freteUm: 0.10,
      icms: 1.0,
      embalagem: 0.05,
    };

    const resultado = calcularValoresCompraImportada(dados);

    // Validar cálculos conforme fórmulas Excel:
    // F: VALOR TOTAL = E*D = 1 * 2.90 = 2.90
    expect(resultado.valorTotal).toBe(2.90);

    // H: FRETE TOTAL = E*G = 1 * 0.10 = 0.10
    expect(resultado.freteTotal).toBe(0.10);

    // K: CUSTO TOTAL = (F+H+J)/I = (2.90+0.10+0.05)/1.0 = 3.05
    expect(resultado.custoTotal).toBe(3.05);

    // L: TOTAL COMPRA = K*C = 3.05 * 10 = 30.50
    expect(resultado.totalCompra).toBe(30.50);

    // M: V/VAREJO = K/0.4 = 3.05/0.4 = 7.625
    expect(resultado.valorVarejo).toBeCloseTo(7.63, 1);

    // N: V/CD UM = L/0.4 = 30.50/0.4 = 76.25
    expect(resultado.valorCdUm).toBeCloseTo(76.25, 1);

    // O: V/CD ATA = K/0.55 = 3.05/0.55 = 5.545...
    expect(resultado.valorCdAta).toBeCloseTo(5.55, 1);
  });

  it("deve calcular com ICMS diferente de 1.0", () => {
    const dados = {
      quantidade: 5,
      valorCusto: 10.00,
      pacote: 2,
      freteUm: 1.00,
      icms: 1.15, // ICMS de 15%
      embalagem: 0.50,
    };

    const resultado = calcularValoresCompraImportada(dados);

    // F: VALOR TOTAL = 2 * 10 = 20
    expect(resultado.valorTotal).toBe(20);

    // H: FRETE TOTAL = 2 * 1 = 2
    expect(resultado.freteTotal).toBe(2);

    // K: CUSTO TOTAL = (20 + 2 + 0.50) / 1.15 = 22.50 / 1.15 ≈ 19.57
    expect(resultado.custoTotal).toBeCloseTo(19.57, 1);

    // L: TOTAL COMPRA = 19.57 * 5 ≈ 97.83
    expect(resultado.totalCompra).toBeCloseTo(97.83, 1);
  });

  it("deve calcular com embalagem diferente de zero", () => {
    const dados = {
      quantidade: 20,
      valorCusto: 5.00,
      pacote: 1,
      freteUm: 0.50,
      icms: 1.0,
      embalagem: 2.00,
    };

    const resultado = calcularValoresCompraImportada(dados);

    // F: VALOR TOTAL = 1 * 5 = 5
    expect(resultado.valorTotal).toBe(5);

    // H: FRETE TOTAL = 1 * 0.50 = 0.50
    expect(resultado.freteTotal).toBe(0.50);

    // K: CUSTO TOTAL = (5 + 0.50 + 2) / 1.0 = 7.50
    expect(resultado.custoTotal).toBe(7.50);

    // L: TOTAL COMPRA = 7.50 * 20 = 150
    expect(resultado.totalCompra).toBe(150);

    // M: V/VAREJO = 7.50 / 0.4 = 18.75
    expect(resultado.valorVarejo).toBe(18.75);

    // N: V/CD UM = 150 / 0.4 = 375
    expect(resultado.valorCdUm).toBe(375);

    // O: V/CD ATA = 7.50 / 0.55 ≈ 13.64
    expect(resultado.valorCdAta).toBeCloseTo(13.64, 1);
  });

  it("deve manter precisão com valores pequenos", () => {
    const dados = {
      quantidade: 1,
      valorCusto: 0.50,
      pacote: 1,
      freteUm: 0.05,
      icms: 1.0,
      embalagem: 0.01,
    };

    const resultado = calcularValoresCompraImportada(dados);

    // F: VALOR TOTAL = 1 * 0.50 = 0.50
    expect(resultado.valorTotal).toBe(0.50);

    // H: FRETE TOTAL = 1 * 0.05 = 0.05
    expect(resultado.freteTotal).toBe(0.05);

    // K: CUSTO TOTAL = (0.50 + 0.05 + 0.01) / 1.0 = 0.56
    expect(resultado.custoTotal).toBe(0.56);

    // L: TOTAL COMPRA = 0.56 * 1 = 0.56
    expect(resultado.totalCompra).toBe(0.56);
  });

  it("deve aplicar margens corretas para varejo e atacado", () => {
    const dados = {
      quantidade: 100,
      valorCusto: 1.00,
      pacote: 1,
      freteUm: 0.10,
      icms: 1.0,
      embalagem: 0.00,
    };

    const resultado = calcularValoresCompraImportada(dados);

    // Custo Total = (1 + 0.10 + 0) / 1.0 = 1.10
    expect(resultado.custoTotal).toBe(1.10);

    // V/VAREJO = 1.10 / 0.4 = 2.75 (margem 40%)
    expect(resultado.valorVarejo).toBe(2.75);

    // V/CD ATA = 1.10 / 0.55 = 2.00 (margem 55%)
    expect(resultado.valorCdAta).toBeCloseTo(2.00, 1);

    // Validar que V/CD ATA < V/VAREJO (atacado é mais barato)
    expect(resultado.valorCdAta).toBeLessThan(resultado.valorVarejo);
  });
});
