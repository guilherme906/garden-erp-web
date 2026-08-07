import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock do módulo db ────────────────────────────────────────────────────────
const mockProdutos: Record<number, { id: number; preco: string; descricao: string }> = {
  1: { id: 1, preco: "10.00", descricao: "ALSTROEMERIA BRANCA" },
  2: { id: 2, preco: "10.00", descricao: "ALSTROEMERIA LARANJA" },
};

vi.mock("./db", async (importOriginal) => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    saveTabelaPrecosBatch: vi.fn(async () => {}),
    applyTabela3ToProducts: vi.fn(async (
      items: Array<{ produtoId?: number | null; produtoNome: string; preco3: string }>,
      _usuarioNome: string
    ) => {
      let atualizados = 0;
      for (const item of items) {
        const preco3 = parseFloat(item.preco3);
        if (!preco3 || preco3 <= 0) continue;
        if (item.produtoId && mockProdutos[item.produtoId]) {
          mockProdutos[item.produtoId].preco = preco3.toFixed(2);
          atualizados++;
        }
      }
      return { atualizados, historico: [] };
    }),
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
describe("tabelaPrecos.salvar — aplicação automática da Tabela 3", () => {
  const caller = appRouter.createCaller(createAdminCtx());

  it("deve salvar margens e retornar atualizados > 0 quando preco3 > 0", async () => {
    const result = await caller.tabelaPrecos.salvar({
      compraId: 1,
      items: [
        {
          compraItemId: 101,
          produtoId: 1,
          produtoNome: "ALSTROEMERIA BRANCA",
          custoUnitario: "17.70",
          margem1: "97.74",
          preco1: "35.00",
          margem2: "80.79",
          preco2: "32.00",
          margem3: "46.89",
          preco3: "26.00",
        },
        {
          compraItemId: 102,
          produtoId: 2,
          produtoNome: "ALSTROEMERIA LARANJA",
          custoUnitario: "17.20",
          margem1: "103.49",
          preco1: "35.00",
          margem2: "86.05",
          preco2: "32.00",
          margem3: "51.16",
          preco3: "26.00",
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.atualizados).toBe(2);
  });

  it("deve retornar atualizados = 0 quando preco3 = 0", async () => {
    const result = await caller.tabelaPrecos.salvar({
      compraId: 2,
      items: [
        {
          compraItemId: 201,
          produtoId: 1,
          produtoNome: "PRODUTO TESTE",
          custoUnitario: "10.00",
          margem1: "0",
          preco1: "10.00",
          margem2: "0",
          preco2: "10.00",
          margem3: "0",
          preco3: "0.00", // preco3 zerado → não deve atualizar
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.atualizados).toBe(0);
  });

  it("deve aceitar item sem produtoId (produto não vinculado)", async () => {
    const result = await caller.tabelaPrecos.salvar({
      compraId: 3,
      items: [
        {
          compraItemId: 301,
          produtoId: null,
          produtoNome: "PRODUTO SEM VINCULO",
          custoUnitario: "5.00",
          margem1: "100",
          preco1: "10.00",
          margem2: "80",
          preco2: "9.00",
          margem3: "60",
          preco3: "8.00",
        },
      ],
    });

    // Não deve lançar erro mesmo sem produtoId
    expect(result.success).toBe(true);
  });

  it("deve chamar saveTabelaPrecosBatch com os dados corretos", async () => {
    const db = await import("./db");
    const spy = vi.spyOn(db, "saveTabelaPrecosBatch");

    await caller.tabelaPrecos.salvar({
      compraId: 5,
      items: [
        {
          compraItemId: 501,
          produtoId: 1,
          produtoNome: "ROSA VERMELHA",
          custoUnitario: "8.00",
          margem1: "100",
          preco1: "16.00",
          margem2: "75",
          preco2: "14.00",
          margem3: "50",
          preco3: "12.00",
        },
      ],
    });

    expect(spy).toHaveBeenCalledWith(5, expect.arrayContaining([
      expect.objectContaining({ compraItemId: 501, preco3: "12.00" }),
    ]));
  });

  it("deve chamar applyTabela3ToProducts com preco3 de cada item", async () => {
    const db = await import("./db");
    const spy = vi.spyOn(db, "applyTabela3ToProducts");

    await caller.tabelaPrecos.salvar({
      compraId: 6,
      items: [
        {
          compraItemId: 601,
          produtoId: 1,
          produtoNome: "LÍRIO BRANCO",
          custoUnitario: "12.00",
          margem1: "100",
          preco1: "24.00",
          margem2: "75",
          preco2: "21.00",
          margem3: "50",
          preco3: "18.00",
        },
      ],
    });

    expect(spy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ produtoId: 1, preco3: "18.00" }),
      ]),
      expect.any(String) // usuarioNome
    );
  });
});
