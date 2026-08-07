import { getDb } from './server/db.ts';

const db = await getDb();
if (!db) {
  console.log("Erro ao conectar ao banco");
  process.exit(1);
}

// Importar as tabelas
const { vendaItens } = await import('./drizzle/schema.ts');
const { eq } = await import('drizzle-orm');

// Consultar itens da venda 1170001
const itens = await db.select().from(vendaItens).where(eq(vendaItens.vendaId, 1170001)).orderBy(vendaItens.ordem);

console.log("Itens da venda 1170001:");
console.log(JSON.stringify(itens, null, 2));
