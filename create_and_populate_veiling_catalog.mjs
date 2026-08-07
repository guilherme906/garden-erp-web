import mysql from 'mysql2/promise';
import { ENV } from './server/_core/env.ts';
import { getVeilingConfig, getVeilingConversaoMap } from './server/db.ts';

const conn = await mysql.createConnection(ENV.databaseUrl);

try {
  console.log("🔄 Criando e populando catálogo Veiling...");

  // 1. Obter configuração do Veiling
  const cfg = await getVeilingConfig();
  if (!cfg) {
    console.log("❌ Configuração do Veiling não encontrada");
    await conn.end();
    process.exit(1);
  }

  const margemGlobal = parseFloat(String(cfg?.margemGlobal || '40'));
  console.log(`📊 Margem global: ${margemGlobal}%`);

  // 2. Obter mapa de conversão
  const conversaoMap = await getVeilingConversaoMap();
  console.log(`📋 ${conversaoMap.size} conversões carregadas`);

  // 3. Criar catalogo Veiling
  console.log("📝 Criando catalogo Veiling...");
  const token = 'veiling-' + Math.random().toString(36).substr(2, 9);
  const [createResult] = await conn.execute(
    `INSERT INTO catalogos_venda (titulo, descricao, token, expiresAt, ativo, criadoPor, createdAt, updatedAt)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 365 DAY), 1, 'system', NOW(), NOW())`,
    ['Veiling', 'Catalogo de produtos do Veiling', token]
  );

  const catalogoId = createResult.insertId;
  console.log(`✅ Catálogo criado com ID: ${catalogoId}`);

  // 4. Obter todos os produtos Veiling com estoque > 0
  const [veilingProdutos] = await conn.execute(
    `SELECT id, offerId, nome, nomeCompleto, estoqueDisponivel, 
            precoCarrinho, precoCamada, precoEmbalagem, frete, multiplo, imagemUrl
     FROM veiling_produtos 
     WHERE estoqueDisponivel > 0 
     ORDER BY nomeCompleto ASC`
  );

  console.log(`📦 ${veilingProdutos.length} produtos com estoque disponível`);

  // 5. Inserir produtos no catálogo
  let inseridos = 0;
  let ordem = 0;

  for (const prod of veilingProdutos) {
    try {
      // Calcular preço de venda
      const _embS = prod.precoEmbalagem != null ? Number(prod.precoEmbalagem) : 0;
      const _camS = prod.precoCamada != null ? Number(prod.precoCamada) : 0;
      const _carS = prod.precoCarrinho != null ? Number(prod.precoCarrinho) : 0;
      const custoBase = (_embS > 0 ? _embS : (_camS > 0 ? _camS : _carS));

      if (custoBase <= 0) {
        continue;
      }

      // Obter conversão
      const convKey = prod.nomeCompleto ? prod.nomeCompleto.trim().toUpperCase() : prod.nome.trim().toUpperCase();
      const conv = conversaoMap.get(convKey) || conversaoMap.get(prod.nome.trim().toUpperCase());
      const qtdVenda = conv?.qtdVenda ?? Number(prod.multiplo) ?? 1;

      // Calcular preço de venda com margem
      const freteUnit = prod.frete != null ? Number(prod.frete) : 0;
      const precoVenda = (custoBase + freteUnit) * (1 + margemGlobal / 100);

      // Inserir no catálogo
      await conn.execute(
        `INSERT INTO catalogos_venda_itens 
         (catalogoId, origem, produtoId, nome, preco, imagemUrl, unidade, ordem, createdAt)
         VALUES (?, 'veiling', ?, ?, ?, ?, 'un', ?, NOW())`,
        [catalogoId, String(prod.offerId), prod.nomeCompleto || prod.nome, precoVenda.toFixed(2), prod.imagemUrl || null, ordem]
      );

      inseridos++;
      ordem++;

      if (inseridos % 100 === 0) {
        console.log(`✅ ${inseridos} produtos inseridos...`);
      }
    } catch (err) {
      console.error(`❌ Erro ao inserir ${prod.nomeCompleto}:`, err.message);
    }
  }

  console.log(`\n✨ Catálogo criado e populado com sucesso!`);
  console.log(`   - Catálogo ID: ${catalogoId}`);
  console.log(`   - ${inseridos} produtos inseridos`);
  console.log(`   - ${veilingProdutos.length - inseridos} produtos pulados (sem preço válido)`);

  await conn.end();
  process.exit(0);
} catch (err) {
  console.error("❌ Erro:", err.message);
  await conn.end();
  process.exit(1);
}
