import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock do módulo db ────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    criarMovimentacaoEstoque: vi.fn(async (data: any) => {
      if (data.produtoId === 999) throw new Error("Produto não encontrado");
      const estoqueAntes = 10;
      const estoqueDepois =
        data.tipo === "ENTRADA" ? estoqueAntes + data.quantidade :
        data.tipo === "SAIDA" ? estoqueAntes - data.quantidade :
        data.quantidade;
      return { estoqueAntes, estoqueDepois };
    }),
    listarMovimentacoesEstoque: vi.fn(async (params: any) => {
      const items = [
        {
          id: 1,
          produtoId: 1,
          produtoNome: "Rosa Vermelha",
          produtoCodigo: "RV001",
          tipo: "ENTRADA",
          quantidade: "10.000",
          estoqueAntes: "0.000",
          estoqueDepois: "10.000",
          justificativa: "Recebimento inicial",
          usuarioNome: "admin",
          usuarioId: "1",
          createdAt: new Date("2026-01-01T10:00:00Z"),
        },
        {
          id: 2,
          produtoId: 1,
          produtoNome: "Rosa Vermelha",
          produtoCodigo: "RV001",
          tipo: "SAIDA",
          quantidade: "3.000",
          estoqueAntes: "10.000",
          estoqueDepois: "7.000",
          justificativa: "Produto danificado",
          usuarioNome: "vendedor1",
          usuarioId: "2",
          createdAt: new Date("2026-01-02T10:00:00Z"),
        },
      ];
      const filtered = items.filter(i => {
        if (params.produtoId && i.produtoId !== params.produtoId) return false;
        if (params.tipo && i.tipo !== params.tipo) return false;
        return true;
      });
      return { items: filtered, total: filtered.length };
    }),
    relatorioEstoqueProdutos: vi.fn(async () => [
      {
        id: 1,
        codigo: "RV001",
        nome: "Rosa Vermelha",
        departamento: "Flores",
        unidade: "UN",
        estoque: "7.000",
        ativo: 1,
        totalEntradas: 10,
        totalSaidas: 3,
        totalAjustes: 0,
        totalMovimentacoes: 2,
      },
      {
        id: 2,
        codigo: "LI001",
        nome: "Lírio Branco",
        departamento: "Flores",
        unidade: "UN",
        estoque: "0.000",
        ativo: 1,
        totalEntradas: 0,
        totalSaidas: 0,
        totalAjustes: 0,
        totalMovimentacoes: 0,
      },
    ]),
  };
});

// ─── Helper: criar contexto autenticado ───────────────────────────────────────
function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "admin@test.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Testes ───────────────────────────────────────────────────────────────────
describe("loja.ajustarEstoque", () => {
  const caller = appRouter.createCaller(createAdminCtx());

  it("deve registrar uma ENTRADA de estoque", async () => {
    const result = await caller.loja.ajustarEstoque({
      produtoId: 1,
      tipo: "ENTRADA",
      quantidade: 5,
      justificativa: "Recebimento de mercadoria",
    });
    expect(result).toHaveProperty("estoqueAntes");
    expect(result).toHaveProperty("estoqueDepois");
    expect(result.estoqueDepois).toBe(15); // 10 + 5
  });

  it("deve registrar uma SAIDA de estoque", async () => {
    const result = await caller.loja.ajustarEstoque({
      produtoId: 1,
      tipo: "SAIDA",
      quantidade: 3,
      justificativa: "Produto danificado durante transporte",
    });
    expect(result.estoqueDepois).toBe(7); // 10 - 3
  });

  it("deve registrar um AJUSTE direto de estoque", async () => {
    const result = await caller.loja.ajustarEstoque({
      produtoId: 1,
      tipo: "AJUSTE",
      quantidade: 20,
      justificativa: "Contagem de inventário corrigida",
    });
    expect(result.estoqueDepois).toBe(20); // ajuste direto
  });

  it("deve rejeitar justificativa muito curta", async () => {
    await expect(
      caller.loja.ajustarEstoque({
        produtoId: 1,
        tipo: "ENTRADA",
        quantidade: 5,
        justificativa: "ab", // menos de 3 chars
      })
    ).rejects.toThrow();
  });

  it("deve rejeitar quantidade zero ou negativa", async () => {
    await expect(
      caller.loja.ajustarEstoque({
        produtoId: 1,
        tipo: "ENTRADA",
        quantidade: 0,
        justificativa: "Justificativa válida",
      })
    ).rejects.toThrow();
  });

  it("deve lançar erro para produto inexistente", async () => {
    await expect(
      caller.loja.ajustarEstoque({
        produtoId: 999,
        tipo: "ENTRADA",
        quantidade: 5,
        justificativa: "Produto inexistente",
      })
    ).rejects.toThrow("Produto não encontrado");
  });
});

describe("loja.listarMovimentacoes", () => {
  const caller = appRouter.createCaller(createAdminCtx());

  it("deve retornar todas as movimentações sem filtro", async () => {
    const result = await caller.loja.listarMovimentacoes({});
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("deve filtrar por tipo ENTRADA", async () => {
    const result = await caller.loja.listarMovimentacoes({ tipo: "ENTRADA" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].tipo).toBe("ENTRADA");
  });

  it("deve filtrar por tipo SAIDA", async () => {
    const result = await caller.loja.listarMovimentacoes({ tipo: "SAIDA" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].tipo).toBe("SAIDA");
  });

  it("deve filtrar por produtoId", async () => {
    const result = await caller.loja.listarMovimentacoes({ produtoId: 1 });
    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach((m: any) => expect(m.produtoId).toBe(1));
  });

  it("deve retornar campos obrigatórios em cada movimentação", async () => {
    const result = await caller.loja.listarMovimentacoes({});
    const m = result.items[0];
    expect(m).toHaveProperty("id");
    expect(m).toHaveProperty("produtoId");
    expect(m).toHaveProperty("tipo");
    expect(m).toHaveProperty("quantidade");
    expect(m).toHaveProperty("estoqueAntes");
    expect(m).toHaveProperty("estoqueDepois");
    expect(m).toHaveProperty("justificativa");
    expect(m).toHaveProperty("usuarioNome");
    expect(m).toHaveProperty("createdAt");
  });
});

describe("loja.relatorioEstoque", () => {
  const caller = appRouter.createCaller(createAdminCtx());

  it("deve retornar lista de produtos com estatísticas", async () => {
    const result = await caller.loja.relatorioEstoque();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("deve incluir campos de estoque e movimentações", async () => {
    const result = await caller.loja.relatorioEstoque();
    const p = result[0];
    expect(p).toHaveProperty("id");
    expect(p).toHaveProperty("nome");
    expect(p).toHaveProperty("estoque");
    expect(p).toHaveProperty("totalEntradas");
    expect(p).toHaveProperty("totalSaidas");
    expect(p).toHaveProperty("totalAjustes");
    expect(p).toHaveProperty("totalMovimentacoes");
  });

  it("deve mostrar produto com estoque zerado", async () => {
    const result = await caller.loja.relatorioEstoque();
    const semEstoque = result.find((p: any) => Number(p.estoque) <= 0);
    expect(semEstoque).toBeDefined();
  });

  it("deve mostrar produto com movimentações", async () => {
    const result = await caller.loja.relatorioEstoque();
    const comMov = result.find((p: any) => Number(p.totalMovimentacoes) > 0);
    expect(comMov).toBeDefined();
    expect(Number(comMov!.totalEntradas)).toBeGreaterThan(0);
  });
});
