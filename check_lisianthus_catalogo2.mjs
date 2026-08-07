import mysql from 'mysql2/promise';
import { ENV } from './server/_core/env.ts';

const conn = await mysql.createConnection(ENV.databaseUrl);

try {
  // Procurar em catalogos_venda_itens com LISIANTHUS BRANCO
  const [catalogoItens] = await conn.execute(
    `SELECT cvi.id, cvi.catalogoId, cvi.produtoId, cvi.origem, p.nome 
     FROM catalogos_venda_itens cvi 
     LEFT JOIN produtos p ON cvi.produtoId = p.id 
     WHERE cvi.origem = 'veiling' AND p.nome LIKE '%LISIANTHUS%BRANCO%'`
  );
  
  console.log("=== Catálogo Venda Itens (LISIANTHUS BRANCO) ===");
  if (catalogoItens.length === 0) {
    console.log("✅ Nenhum LISIANTHUS BRANCO encontrado em catalogos_venda_itens");
  } else {
    catalogoItens.forEach(ci => {
      console.log(`❌ ID: ${ci.id}, Catálogo: ${ci.catalogoId}, Origem: ${ci.origem}, Produto: ${ci.nome}`);
    });
  }

  // Listar todos os catálogos
  const [catalogos] = await conn.execute(
    "SELECT id, nome, origem FROM catalogos_venda"
  );
  
  console.log("\n=== Catálogos Venda ===");
  catalogos.forEach(c => {
    console.log(`${c.id}: ${c.nome} (origem: ${c.origem})`);
  });

  // Contar itens por origem
  const [contagem] = await conn.execute(
    "SELECT origem, COUNT(*) as total FROM catalogos_venda_itens GROUP BY origem"
  );
  
  console.log("\n=== Itens por Origem ===");
  contagem.forEach(c => {
    console.log(`${c.origem}: ${c.total} itens`);
  });

  await conn.end();
  process.exit(0);
} catch (err) {
  console.error("❌ Erro:", err.message);
  await conn.end();
  process.exit(1);
}
