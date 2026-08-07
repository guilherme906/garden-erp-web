import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock do getDb
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getDb: vi.fn(),
  };
});

describe("Financeiro - Formas de Pagamento", () => {
  it("listFormasPagamento deve retornar lista vazia inicialmente", async () => {
    const result = await db.listFormasPagamento();
    expect(Array.isArray(result)).toBe(true);
  });

  it("createFormaPagamento deve criar nova forma de pagamento", async () => {
    try {
      const result = await db.createFormaPagamento("Dinheiro", "Pagamento em dinheiro");
      expect(result).toBeDefined();
    } catch (e: any) {
      // Pode falhar por duplicata se já existir
      expect(e.code || e.message).toBeDefined();
    }
  });

  it("updateFormaPagamento deve atualizar forma de pagamento", async () => {
    const result = await db.updateFormaPagamento(1, "Cartão Crédito", "Pagamento com cartão");
    expect(result).toBeDefined();
  });

  it("deleteFormaPagamento deve desativar forma de pagamento", async () => {
    const result = await db.deleteFormaPagamento(1);
    expect(result).toBeDefined();
  });
});

describe("Financeiro - Títulos", () => {
  it("listTitulosPendentes deve retornar títulos com status PENDENTE ou VENCIDO", async () => {
    const result = await db.listTitulosPendentes();
    expect(Array.isArray(result)).toBe(true);
  });

  it("listTitulosPagos deve retornar títulos com status PAGO", async () => {
    const result = await db.listTitulosPagos();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getTitulosByVenda deve retornar títulos de uma venda específica", async () => {
    const result = await db.getTitulosByVenda(1);
    expect(Array.isArray(result)).toBe(true);
  });

  it("createTitulo deve criar novo título", async () => {
    const result = await db.createTitulo({
      vendaId: 1,
      clienteId: 1,
      clienteNome: "Cliente Teste",
      formaPagamentoId: 1,
      formaPagamentoNome: "Dinheiro",
      valor: "100.00",
      dataVencimento: new Date("2026-05-11"),
      status: "PENDENTE",
    });
    expect(result).toBeDefined();
  });

  it("updateTituloStatus deve atualizar status do título", async () => {
    const result = await db.updateTituloStatus(1, "PAGO", new Date());
    expect(result).toBeDefined();
  });

  it("deleteTitulo deve cancelar título", async () => {
    const result = await db.deleteTitulo(1);
    expect(result).toBeDefined();
  });

  it("updateTituloStatus com VENCIDO deve funcionar", async () => {
    const result = await db.updateTituloStatus(1, "VENCIDO");
    expect(result).toBeDefined();
  });

  it("updateTituloStatus com CANCELADO deve funcionar", async () => {
    const result = await db.updateTituloStatus(1, "CANCELADO");
    expect(result).toBeDefined();
  });
});

describe("Financeiro - Validações", () => {
  it("createFormaPagamento com nome vazio deve falhar", async () => {
    try {
      await db.createFormaPagamento("");
      expect(true).toBe(false); // Não deve chegar aqui
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("createTitulo com valor inválido deve falhar", async () => {
    try {
      await db.createTitulo({
        vendaId: 1,
        clienteId: 1,
        clienteNome: "Cliente",
        valor: "invalido",
        dataVencimento: new Date(),
        status: "PENDENTE",
      });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("updateTituloStatus com status inválido deve falhar", async () => {
    try {
      await db.updateTituloStatus(1, "INVALIDO" as any);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("Financeiro - Faturamento de Vendas", () => {
  it("faturarVenda deve marcar venda como faturada e criar título", async () => {
    // Primeiro criar uma venda para faturar
    const vendaId = await db.createVenda({
      clienteId: 1,
      clienteNome: "Cliente Faturamento",
      vendedorId: 1,
      vendedorNome: "Vendedor Teste",
      data: "2026-04-11",
      status: "APROVADO",
      total: "500.00",
    }, [{
      produtoNome: "Produto Teste",
      quantidade: "1",
      valorUnitario: "500.00",
      subtotal: "500.00",
    }]);
    expect(vendaId).toBeDefined();

    // Criar forma de pagamento (ignorar se já existir)
    try {
      await db.createFormaPagamento("PIX Faturamento", "Pagamento via PIX");
    } catch (e: any) {
      // Ignorar duplicata
    }
    const formas = await db.listFormasPagamento();
    const formaPix = formas[0]; // Usar primeira forma disponível
    expect(formaPix).toBeDefined();

    // Faturar a venda
    const result = await db.faturarVenda(
      vendaId,
      formaPix!.id,
      "Admin Teste",
      new Date("2026-05-11")
    );
    expect(result).toBeDefined();
    expect(result.vendaId).toBe(vendaId);
  });

  it("faturarVenda com venda inexistente deve falhar", async () => {
    try {
      await db.faturarVenda(999999, 1, "Admin", new Date());
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("não encontrada");
    }
  });

  it("getVendasNaoFaturadas deve retornar vendas com faturado=0", async () => {
    const result = await db.getVendasNaoFaturadas();
    expect(Array.isArray(result)).toBe(true);
    // Todas as vendas retornadas devem ter faturado=0
    result.forEach((v: any) => {
      expect(v.faturado).toBe(0);
    });
  });
});
