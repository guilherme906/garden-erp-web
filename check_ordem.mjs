import { getDb } from "./server/db.ts";
import { vendaItens } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = await getDb();
if (!db) {
  console.log("Erro ao conectar ao banco");
  process.exit(1);
}

const itens = await db.select().from(vendaItens).where(eq(vendaItens.vendaId, 1170001));
console.log("Itens do pedido 1170001 (do banco):");
itens.forEach((item, idx) => {
  console.log(`${idx + 1}. ${item.produtoNome} - ordem: ${item.ordem}`);
});
