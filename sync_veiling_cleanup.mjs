import { getDb, getVeilingConfig } from "./server/db.ts";
import { veilingLogin, veilingGetAllOffers } from "./server/veilingApi.ts";

const db = await getDb();
if (!db) {
  console.log("❌ Erro ao conectar ao banco");
  process.exit(1);
}

// Obter configurações do Veiling
const cfg = await getVeilingConfig();
if (!cfg || !cfg.usuario || !cfg.senha) {
  console.log("❌ Credenciais do Veiling não configuradas");
  process.exit(1);
}

console.log("🔄 Sincronizando Veiling para remover produtos deletados...");

try {
  // 1. Login no Veiling
  console.log("📝 Fazendo login no Veiling...");
  const tokenData = await veilingLogin(cfg.usuario, cfg.senha);
  const token = tokenData.access_token;

  // 2. Obter todas as ofertas ativas do Veiling Online
  console.log("📥 Obtendo ofertas ativas do Veiling Online...");
  const ofertasAtuais = await veilingGetAllOffers(token, cfg.customerId);
  const offerIdsAtuais = new Set(ofertasAtuais.map(o => o.offerId));
  
  console.log(`✅ ${ofertasAtuais.length} ofertas ativas encontradas no Veiling Online`);

  // 3. Obter todos os produtos locais
  console.log("📂 Obtendo produtos locais...");
  const mysql = await import('mysql2/promise');
  const { ENV } = await import('./server/_core/env.ts');
  const conn = await mysql.createConnection(ENV.databaseUrl);
  
  const [produtosLocais] = await conn.execute(
    'SELECT id, offerId, nome FROM veiling_produtos'
  );
  
  console.log(`✅ ${produtosLocais.length} produtos locais encontrados`);

  // 4. Identificar produtos deletados
  const produtosDeletados = produtosLocais.filter(p => !offerIdsAtuais.has(p.offerId));
  
  if (produtosDeletados.length === 0) {
    console.log("✅ Nenhum produto deletado encontrado!");
    await conn.end();
    process.exit(0);
  }

  console.log(`\n⚠️  ${produtosDeletados.length} produtos foram deletados do Veiling Online:`);
  produtosDeletados.forEach(p => {
    console.log(`   - ID ${p.offerId}: ${p.nome}`);
  });

  // 5. Remover produtos deletados da tabela veiling_produtos
  console.log(`\n🗑️  Removendo ${produtosDeletados.length} produtos de veiling_produtos...`);
  const offerIdsParaRemover = produtosDeletados.map(p => p.offerId);
  const placeholders = offerIdsParaRemover.map(() => '?').join(',');
  
  const [result] = await conn.execute(
    `DELETE FROM veiling_produtos WHERE offerId IN (${placeholders})`,
    offerIdsParaRemover
  );
  
  console.log(`✅ ${result.affectedRows} produtos removidos de veiling_produtos`);

  // 6. Remover dos catálogos de venda
  console.log(`\n🗑️  Removendo produtos dos catálogos de venda...`);
  
  // Remover do catalogo_itens (Veiling)
  const [result2] = await conn.execute(
    `DELETE FROM catalogo_itens WHERE origem = 'veiling' AND produtoId IN (
      SELECT id FROM produtos WHERE sku IN (${placeholders})
    )`,
    offerIdsParaRemover
  );
  console.log(`✅ ${result2.affectedRows} itens removidos do catálogo Veiling`);

  // Remover do catalogo_clientes_itens (Veiling Clientes)
  const [result3] = await conn.execute(
    `DELETE FROM catalogo_clientes_itens WHERE origem = 'veiling' AND produtoId IN (
      SELECT id FROM produtos WHERE sku IN (${placeholders})
    )`,
    offerIdsParaRemover
  );
  console.log(`✅ ${result3.affectedRows} itens removidos do catálogo Veiling Clientes`);

  // 7. Remover produtos órfãos da tabela produtos
  console.log(`\n🗑️  Removendo produtos órfãos...`);
  const [result4] = await conn.execute(
    `DELETE FROM produtos WHERE sku IN (${placeholders}) AND id NOT IN (
      SELECT produtoId FROM catalogo_itens WHERE produtoId IS NOT NULL
    )`,
    offerIdsParaRemover
  );
  console.log(`✅ ${result4.affectedRows} produtos órfãos removidos`);

  console.log(`\n✨ Sincronização concluída com sucesso!`);
  console.log(`   - ${produtosDeletados.length} produtos removidos`);
  console.log(`   - ${result2.affectedRows} itens removidos do catálogo Veiling`);
  console.log(`   - ${result3.affectedRows} itens removidos do catálogo Veiling Clientes`);

  await conn.end();
  process.exit(0);
} catch (err) {
  console.error("❌ Erro durante sincronização:", err.message);
  process.exit(1);
}
