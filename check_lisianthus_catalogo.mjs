import mysql from 'mysql2/promise';
import { ENV } from './server/_core/env.ts';

const conn = await mysql.createConnection(ENV.databaseUrl);

try {
  // Procurar em catalogos_venda_itens
  const [catalogoItens] = await conn.execute(
    `SELECT cvi.id, cvi.catalogoId, cvi.produtoId, cvi.origem, p.nome 
     FROM catalogos_venda_itens cvi 
     LEFT JOIN produtos p ON cvi.produtoId = p.id 
     WHERE p.nome LIKE ? OR cvi.origem = 'veiling'`,
    ['%LISIANTHUS%BRANCO%']
  );
  
  console.log("=== Catálogo Venda Itens ===");
  if (catalogoItens.length === 0) {
    console.log("✅ Nenhum LISIANTHUS BRANCO encontrado");
  } else {
    catalogoItens.forEach(ci => {
      console.log(`❌ ID: ${ci.id}, Catálogo: ${ci.catalogoId}, Origem: ${ci.origem}, Produto: ${ci.nome}`);
    });
  }

  // Procurar especificamente por offerId 2250472
  const [lisianthus] = await conn.execute(
    `SELECT vp.id, vp.offerId, vp.nome, vp.nomeCompleto, vp.estoqueDisponivel 
     FROM veiling_produtos vp 
     WHERE vp.offerId = 2250472`
  );
  
  console.log("\n=== Veiling Produtos (offerId 2250472) ===");
  if (lisianthus.length === 0) {
    console.log("❌ Produto não encontrado");
  } else {
    lisianthus.forEach(p => {
      console.log(`✅ ${p.nomeCompleto} (estoque: ${p.estoqueDisponivel})`);
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

  await conn.end();
  process.exit(0);
} catch (err) {
  console.error("❌ Erro:", err.message);
  await conn.end();
  process.exit(1);
}
