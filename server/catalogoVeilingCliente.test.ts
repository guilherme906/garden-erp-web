import { describe, it, expect, beforeAll } from "vitest";
import { getDb, listVeilingProdutos } from "./db";
import { veilingProdutos } from "../drizzle/schema";
import { sql } from "drizzle-orm";

const PAGE_SIZE = 48;

describe("CatalogoVeilingCliente - Paginação Server-Side", () => {
  let db: any;
  let totalProdutos: number;

  beforeAll(async () => {
    db = await getDb();
    const [row] = await db.select({ count: sql<number>`count(*)` }).from(veilingProdutos).execute();
    totalProdutos = Number(row?.count ?? 0);
  });

  it("deve retornar PAGE_SIZE produtos por página (página 0)", async () => {
    const result = await listVeilingProdutos({ limit: PAGE_SIZE, offset: 0 });
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBeLessThanOrEqual(PAGE_SIZE);
    expect(typeof result.total).toBe("number");
    expect(result.total).toBeGreaterThan(0);
    console.log(`✅ Página 0: ${result.items.length} produtos de ${result.total} total`);
  });

  it("deve retornar a segunda página corretamente", async () => {
    const page0 = await listVeilingProdutos({ limit: PAGE_SIZE, offset: 0 });
    const page1 = await listVeilingProdutos({ limit: PAGE_SIZE, offset: PAGE_SIZE });
    // Verificar que as páginas não têm sobreposição de IDs
    // (a ordenação determinística por nome+id garante isso)
    const ids0 = new Set(page0.items.map((p: any) => p.id));
    const ids1 = new Set(page1.items.map((p: any) => p.id));
    const intersection = [...ids0].filter(id => ids1.has(id));
    expect(intersection.length).toBe(0);
    console.log(`✅ Página 0 e 1 têm produtos distintos (sem sobreposição)`);
  });

  it("deve retornar o total correto para cálculo de páginas", async () => {
    const result = await listVeilingProdutos({ limit: PAGE_SIZE, offset: 0 });
    const totalPages = Math.ceil(result.total / PAGE_SIZE);
    expect(totalPages).toBeGreaterThan(1); // Com 3000+ produtos, deve ter mais de 1 página
    console.log(`✅ Total: ${result.total} produtos → ${totalPages} páginas de ${PAGE_SIZE}`);
  });

  it("deve filtrar por categoria e retornar total correto", async () => {
    const result = await listVeilingProdutos({ limit: PAGE_SIZE, offset: 0, categoria: "Produto de Corte" });
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(0);
    // Todos os itens retornados devem ser da categoria correta
    for (const item of result.items) {
      expect(item.categoria).toBe("Produto de Corte");
    }
    console.log(`✅ Filtro por categoria: ${result.items.length} de ${result.total} produtos de corte`);
  });

  it("deve enriquecer produtos com imagemUrl priorizando cache S3", async () => {
    const result = await listVeilingProdutos({ limit: PAGE_SIZE, offset: 0 });
    // Verificar que produtos com imagemUrlCache têm o cache como imagemUrl
    const comCache = result.items.filter((p: any) => (p as any).imagemUrlCache);
    for (const p of comCache.slice(0, 5)) {
      // imagemUrl deve ser o cache S3 (não a URL temporária)
      expect((p as any).imagemUrl).toBe((p as any).imagemUrlCache);
    }
    console.log(`✅ ${comCache.length} produtos com cache S3 de imagem`);
  });
});
