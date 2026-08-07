/**
 * Script para verificar e limpar URLs placeholder do Veiling no banco de dados.
 * URLs com '/Default' no caminho são imagens genéricas, não fotos reais dos produtos.
 */
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

// Ler DATABASE_URL do .env
let dbUrl;
try {
  const envContent = readFileSync('/home/ubuntu/garden-erp-web/.env', 'utf8');
  const match = envContent.match(/DATABASE_URL=(.+)/);
  if (match) dbUrl = match[1].trim();
} catch {}

if (!dbUrl) {
  // Tentar via variável de ambiente
  dbUrl = process.env.DATABASE_URL;
}

if (!dbUrl) {
  console.error('DATABASE_URL não encontrada');
  process.exit(1);
}

const conn = await mysql.createConnection(dbUrl);

try {
  // Contar placeholders por tipo
  const [countDefault] = await conn.query('SELECT COUNT(*) as n FROM veiling_produtos WHERE imagemUrl LIKE "%/Default%"');
  const [countProducers] = await conn.query('SELECT COUNT(*) as n FROM veiling_produtos WHERE imagemUrl LIKE "%Producers/Default%"');
  const [countPreference] = await conn.query('SELECT COUNT(*) as n FROM veiling_produtos WHERE imagemUrl LIKE "%ProductPreference%"');
  const [countTotal] = await conn.query('SELECT COUNT(*) as n FROM veiling_produtos WHERE imagemUrl IS NOT NULL AND imagemUrl != ""');
  const [countCache] = await conn.query('SELECT COUNT(*) as n FROM veiling_produtos WHERE imagemUrlCache IS NOT NULL AND imagemUrlCache != ""');
  const [countSemFoto] = await conn.query('SELECT COUNT(*) as n FROM veiling_produtos WHERE (imagemUrl IS NULL OR imagemUrl = "") AND (imagemUrlCache IS NULL OR imagemUrlCache = "")');

  console.log('=== Estatísticas de Imagens Veiling ===');
  console.log(`Total de produtos: (ver abaixo)`);
  console.log(`Com imagemUrl: ${countTotal[0].n}`);
  console.log(`  - Placeholders /Default: ${countDefault[0].n}`);
  console.log(`  - Placeholders Producers/Default: ${countProducers[0].n}`);
  console.log(`  - ProductPreference: ${countPreference[0].n}`);
  console.log(`Com imagemUrlCache (S3): ${countCache[0].n}`);
  console.log(`Sem nenhuma foto: ${countSemFoto[0].n}`);

  // Mostrar amostra de URLs placeholder
  const [samples] = await conn.query(
    'SELECT offerId, nome, imagemUrl FROM veiling_produtos WHERE imagemUrl LIKE "%/Default%" LIMIT 5'
  );
  console.log('\nAmostra de URLs placeholder:');
  samples.forEach(r => console.log(`  offerId=${r.offerId} | ${r.nome} | ${r.imagemUrl}`));

  // Verificar se imagemUrlCache tem fotos que vieram de placeholder
  const [cacheFromPlaceholder] = await conn.query(`
    SELECT COUNT(*) as n FROM veiling_produtos 
    WHERE imagemUrlCache IS NOT NULL AND imagemUrlCache != ''
    AND imagemUrl LIKE "%/Default%"
  `);
  console.log(`\nProdutos com cache que vieram de placeholder: ${cacheFromPlaceholder[0].n}`);

  // Limpar imagemUrlCache que foi gerado a partir de URLs placeholder
  // (214 produtos tiveram fotos genéricas cacheadas no S3 erroneamente)
  const [result1] = await conn.query(`
    UPDATE veiling_produtos 
    SET imagemUrlCache = NULL 
    WHERE imagemUrlCache IS NOT NULL 
    AND imagemUrl LIKE "%/Default%"
  `);
  console.log(`\nLimpas ${result1.affectedRows} imagemUrlCache de URLs placeholder`);

  // Limpar imagemUrl que são placeholders (para usar proxy offerId no lugar)
  const [result2] = await conn.query(`
    UPDATE veiling_produtos 
    SET imagemUrl = NULL 
    WHERE imagemUrl LIKE "%/Default%" 
    OR imagemUrl LIKE "%ProductPreference%"
  `);
  console.log(`Limpas ${result2.affectedRows} imagemUrl placeholder`);
  console.log('\n✅ Limpeza concluída!');

} finally {
  await conn.end();
}
