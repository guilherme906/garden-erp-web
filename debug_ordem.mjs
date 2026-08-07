import { getDb } from "./server/db.ts";
import { vendaItens } from "./drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = await getDb();
if (!db) {
  console.log("Erro ao conectar ao banco");
  process.exit(1);
}

// Verificar pedido 1170001
console.log("=== Pedido 1170001 ===");
const itens1170001 = await db.select().from(vendaItens).where(eq(vendaItens.vendaId, 1170001));
console.log(`Total de itens: ${itens1170001.length}`);
itens1170001.forEach((item, idx) => {
  console.log(`${idx + 1}. ID: ${item.id}, Nome: ${item.produtoNome}, Ordem: ${item.ordem}`);
});

// Verificar alguns outros pedidos
console.log("\n=== Primeiros 5 pedidos ===");
const todosPedidos = await db.select().from(vendaItens);
const pedidosUnicos = [...new Set(todosPedidos.map(i => i.vendaId))].slice(0, 5);

for (const pedidoId of pedidosUnicos) {
  const itensDopedido = todosPedidos.filter(i => i.vendaId === pedidoId);
  console.log(`\nPedido ${pedidoId}: ${itensDopedido.length} itens`);
  itensDopedido.forEach(item => {
    console.log(`  - ${item.produtoNome} (ordem: ${item.ordem})`);
  });
}

process.exit(0);
