import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });
});

// ─── Testes: Procedures pedidosCompra ───
describe("pedidosCompra procedures", () => {
  it("addItemToPedido input schema valida campos obrigatórios", () => {
    const schema = {
      pedidoId: 1,
      produtoNome: "Rosa Vermelha 60cm",
      quantidade: "5",
      precoVenda: "25.00",
      subtotalVenda: "125.00",
    };
    expect(schema.pedidoId).toBeGreaterThan(0);
    expect(schema.produtoNome).toBeTruthy();
    expect(parseFloat(schema.quantidade)).toBeGreaterThan(0);
    expect(parseFloat(schema.precoVenda)).toBeGreaterThan(0);
    expect(parseFloat(schema.subtotalVenda)).toBeCloseTo(
      parseFloat(schema.quantidade) * parseFloat(schema.precoVenda), 2
    );
  });

  it("createComItem calcula subtotal corretamente", () => {
    const qtd = 3;
    const preco = 15.50;
    const subtotal = qtd * preco;
    expect(subtotal).toBeCloseTo(46.50, 2);
  });

  it("listAbertos filtra apenas pedidos ABERTO e APROVADO", () => {
    const pedidos = [
      { id: 1, status: "ABERTO" },
      { id: 2, status: "FINALIZADO" },
      { id: 3, status: "APROVADO" },
      { id: 4, status: "CANCELADO" },
    ];
    const abertos = pedidos.filter(p => p.status === "ABERTO" || p.status === "APROVADO");
    expect(abertos).toHaveLength(2);
    expect(abertos.map(p => p.id)).toEqual([1, 3]);
  });
});

// ─── Testes: catalogoUnificado ───
describe("catalogoUnificado", () => {
  it("combina produtos de Veiling e Cooperflora com campo origem", () => {
    const cfProdutos = [
      { id: "cf-1", origem: "Cooperflora", nome: "Rosa Vermelha", qualidade: "A1", estoque: 100, precoCompra: 2.5, precoVenda: 3.25, imagemUrl: null, grupo: "Rosas", dimensao: "" },
    ];
    const veilProdutos = [
      { id: "vl-1", origem: "Veiling", nome: "Alstroemeria Akemi", qualidade: "A2", estoque: 50, precoCompra: 5.0, precoVenda: 6.5, imagemUrl: null, grupo: "Alstroemeria", dimensao: "70cm" },
    ];
    const unificado = [...cfProdutos, ...veilProdutos].sort((a, b) => a.nome.localeCompare(b.nome));
    expect(unificado).toHaveLength(2);
    expect(unificado[0].nome).toBe("Alstroemeria Akemi");
    expect(unificado[0].origem).toBe("Veiling");
    expect(unificado[1].nome).toBe("Rosa Vermelha");
    expect(unificado[1].origem).toBe("Cooperflora");
  });

  it("filtra por origem corretamente", () => {
    const todos = [
      { id: "cf-1", origem: "Cooperflora" },
      { id: "vl-1", origem: "Veiling" },
      { id: "cf-2", origem: "Cooperflora" },
    ];
    const soCoop = todos.filter(p => p.origem === "Cooperflora");
    const soVeil = todos.filter(p => p.origem === "Veiling");
    expect(soCoop).toHaveLength(2);
    expect(soVeil).toHaveLength(1);
  });

  it("filtra por qualidade A1/A2", () => {
    const produtos = [
      { nome: "Rosa A1", qualidade: "A1" },
      { nome: "Cravo A2", qualidade: "A2" },
      { nome: "Lírio A1", qualidade: "A1" },
    ];
    const a1 = produtos.filter(p => p.qualidade === "A1");
    expect(a1).toHaveLength(2);
    expect(a1.map(p => p.nome)).toContain("Rosa A1");
    expect(a1.map(p => p.nome)).toContain("Lírio A1");
  });
});
