import { getDb } from './server/db.ts';

const db = await getDb();
if (!db) {
  console.log("Erro ao conectar ao banco");
  process.exit(1);
}

// Importar as tabelas
const { vendaItens } = await import('./drizzle/schema.ts');

// Adicionar o item FOLHAGEM SEMENTE LINGUESTRE com ordem 15 (após FLORAL F2 CX que tem ordem 14)
const novoItem = {
  vendaId: 1170001,
  produtoId: null,
  produtoNome: "FOLHAGEM SEMENTE LINGUESTRE",
  quantidade: "10.00",
  valorUnitario: "25.00",
  subtotal: "250.00",
  observacao: null,
  qtdConferida: null,
  qtdConferida2: null,
  ordem: 15
};

try {
  const result = await db.insert(vendaItens).values(novoItem);
  console.log("✅ Item adicionado com sucesso!");
  console.log("Resultado:", result);
} catch (error) {
  console.log("❌ Erro ao adicionar item:", error.message);
}
