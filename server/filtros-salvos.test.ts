import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db_module from "./db";

const db = db_module;

describe("Filtros Salvos do Catálogo Veiling", () => {
  const userId = 1;
  let filtroId: number;

  beforeAll(async () => {
    // Limpar filtros anteriores
    try {
      await db.deleteVeilingFiltro(filtroId, userId);
    } catch (err) {
      // Ignorar erro se não existir
    }
  });

  afterAll(async () => {
    // Limpar após testes
    try {
      if (filtroId) {
        await db.deleteVeilingFiltro(filtroId, userId);
      }
    } catch (err) {
      // Ignorar erro
    }
  });

  it("Deve salvar um filtro com sucesso", async () => {
    const result = await db.saveVeilingFiltro(
      userId,
      "Flores Vermelhas",
      "Produto de Corte",
      "Produtor A",
      "Vermelho",
      "rosa"
    );

    expect(result).toBeDefined();
    // Drizzle MySQL retorna o insertId diretamente no resultado
    filtroId = (result as any).insertId as number;
    // Verificar que o filtroId foi definido corretamente
    expect(filtroId).toBeGreaterThan(0);
  });

  it("Deve listar filtros salvos do usuário", async () => {
    const filtros = await db.listVeilingFiltros(userId);
    expect(Array.isArray(filtros)).toBe(true);
    expect(filtros.length).toBeGreaterThan(0);
    expect(filtros[0].nome).toBe("Flores Vermelhas");
  });

  it("Deve obter um filtro salvo específico", async () => {
    const filtro = await db.getVeilingFiltro(filtroId, userId);
    expect(filtro).toBeDefined();
    expect(filtro?.nome).toBe("Flores Vermelhas");
    expect(filtro?.categoria).toBe("Produto de Corte");
    expect(filtro?.produtor).toBe("Produtor A");
    expect(filtro?.cor).toBe("Vermelho");
    expect(filtro?.busca).toBe("rosa");
  });

  it("Deve atualizar um filtro salvo", async () => {
    await db.updateVeilingFiltro(
      filtroId,
      userId,
      "Flores Vermelhas - Atualizado",
      "Flor Envasada",
      "Produtor B",
      "Rosa",
      "tulipa"
    );

    const filtro = await db.getVeilingFiltro(filtroId, userId);
    expect(filtro?.nome).toBe("Flores Vermelhas - Atualizado");
    expect(filtro?.categoria).toBe("Flor Envasada");
    expect(filtro?.produtor).toBe("Produtor B");
    expect(filtro?.cor).toBe("Rosa");
    expect(filtro?.busca).toBe("tulipa");
  });

  it("Deve deletar um filtro salvo", async () => {
    await db.deleteVeilingFiltro(filtroId, userId);
    const filtro = await db.getVeilingFiltro(filtroId, userId);
    expect(filtro).toBeNull();
  });

  it("Não deve retornar filtros de outro usuário", async () => {
    const outroUserId = 999;
    const filtros = await db.listVeilingFiltros(outroUserId);
    expect(filtros.length).toBe(0);
  });
});
