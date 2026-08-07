import { getDb } from "./server/db.ts";

const db = await getDb();
if (!db) {
  console.log("❌ Erro ao conectar ao banco");
  process.exit(1);
}

// Procurar pelo produto LISIANTHUS FLOR BRANCO
const mysql = await import('mysql2/promise');
const { ENV } = await import('./server/_core/env.ts');
const conn = await mysql.createConnection(ENV.databaseUrl);

try {
  // Procurar em veiling_produtos
  const [veilingProdutos] = await conn.execute(
    "SELECT id, offerId, nome, nomeCompleto, estoqueDisponivel, statusProduto FROM veiling_produtos WHERE nome LIKE ? OR nomeCompleto LIKE ?",
    ['%LISIANTHUS%BRANCO%', '%LISIANTHUS%BRANCO%']
  );
  
  console.log("=== Veiling Produtos ===");
  if (veilingProdutos.length === 0) {
    console.log("❌ Produto NÃO encontrado em veiling_produtos");
  } else {
    veilingProdutos.forEach(p => {
      console.log(`✅ Encontrado: ${p.nomeCompleto} (offerId: ${p.offerId}, estoque: ${p.estoqueDisponivel}, status: ${p.statusProduto})`);
    });
  }

  // Procurar em catalogo_itens (Veiling)
  const [catalogoItens] = await conn.execute(
    "SELECT ci.id, ci.produtoId, p.nome, ci.estoque FROM catalogo_itens ci JOIN produtos p ON ci.produtoId = p.id WHERE ci.origem = 'veiling' AND p.nome LIKE ?",
    ['%LISIANTHUS%BRANCO%']
  );
  
  console.log("\n=== Catálogo Veiling ===");
  if (catalogoItens.length === 0) {
    console.log("✅ Produto NÃO está no catálogo Veiling");
  } else {
    catalogoItens.forEach(ci => {
      console.log(`❌ Encontrado no catálogo: ${ci.nome} (estoque: ${ci.estoque})`);
    });
  }

  // Procurar em catalogo_clientes_itens (Veiling Clientes)
  const [catalogoClientesItens] = await conn.execute(
    "SELECT cci.id, cci.produtoId, p.nome FROM catalogo_clientes_itens cci JOIN produtos p ON cci.produtoId = p.id WHERE cci.origem = 'veiling' AND p.nome LIKE ?",
    ['%LISIANTHUS%BRANCO%']
  );
  
  console.log("\n=== Catálogo Veiling Clientes ===");
  if (catalogoClientesItens.length === 0) {
    console.log("✅ Produto NÃO está no catálogo Veiling Clientes");
  } else {
    catalogoClientesItens.forEach(cci => {
      console.log(`❌ Encontrado no catálogo: ${cci.nome}`);
    });
  }

  await conn.end();
  process.exit(0);
} catch (err) {
  console.error("❌ Erro:", err.message);
  await conn.end();
  process.exit(1);
}
