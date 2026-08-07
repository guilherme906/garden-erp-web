import { getDb } from "./server/db.ts";
import { vendaItens } from "./drizzle/schema.ts";
import { sql } from "drizzle-orm";

const db = await getDb();
if (!db) {
  console.log("Erro ao conectar ao banco");
  process.exit(1);
}

console.log("Iniciando preenchimento de ordem nos itens...");

// Executar SQL para preencher ordem
await db.execute(sql`
  UPDATE venda_itens vi
  SET ordem = (
    SELECT COALESCE(
      (SELECT COUNT(*) 
       FROM venda_itens vi2 
       WHERE vi2.vendaId = vi.vendaId AND vi2.id <= vi.id) - 1,
      0
    )
  )
  WHERE ordem = 0
`);

console.log("✅ Ordem preenchida com sucesso!");

// Verificar resultado
const resultado = await db.execute(sql`
  SELECT vendaId, COUNT(*) as total_itens, MIN(ordem) as min_ordem, MAX(ordem) as max_ordem
  FROM venda_itens
  GROUP BY vendaId
  HAVING total_itens > 0
  ORDER BY vendaId DESC
  LIMIT 10
`);

console.log("\nÚltimos 10 orçamentos:");
console.log(resultado.rows);

process.exit(0);
