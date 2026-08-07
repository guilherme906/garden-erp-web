import { createConnection } from 'mysql2/promise';
const conn = await createConnection(process.env.DATABASE_URL);

console.log('Corrigindo statusProduto para todos os produtos Veiling...');

// Regra corrigida:
// tipoOferta = '2' → ENP
// tipoOferta = qualquer outro valor (vazio, '1', '3') → verificar GFP
//   com gfpEntregaCvh preenchido → LKP_RECEPCIONADO
//   sem gfpEntregaCvh → LKP_SITIO

// 1. ENP (tipoOferta='2')
const [r1] = await conn.execute(
  `UPDATE veiling_produtos SET statusProduto = 'ENP' WHERE TRIM(COALESCE(tipoOferta,'')) = '2'`
);
console.log(`✓ ENP: ${r1.affectedRows} registros`);

// 2. LKP_RECEPCIONADO (tipoOferta != '2' E tem gfpEntregaCvh preenchido)
const [r2] = await conn.execute(
  `UPDATE veiling_produtos SET statusProduto = 'LKP_RECEPCIONADO'
   WHERE TRIM(COALESCE(tipoOferta,'')) != '2'
   AND gfpEntregaCvh IS NOT NULL AND TRIM(gfpEntregaCvh) != ''`
);
console.log(`✓ LKP_RECEPCIONADO: ${r2.affectedRows} registros`);

// 3. LKP_SITIO (tipoOferta != '2' E sem gfpEntregaCvh)
const [r3] = await conn.execute(
  `UPDATE veiling_produtos SET statusProduto = 'LKP_SITIO'
   WHERE TRIM(COALESCE(tipoOferta,'')) != '2'
   AND (gfpEntregaCvh IS NULL OR TRIM(gfpEntregaCvh) = '')`
);
console.log(`✓ LKP_SITIO: ${r3.affectedRows} registros`);

// Verificar resultado final
const [dist] = await conn.execute(
  `SELECT statusProduto, COUNT(*) as cnt FROM veiling_produtos GROUP BY statusProduto ORDER BY cnt DESC`
);
console.log('\nDistribuição final de status:');
dist.forEach(row => console.log(`  "${row.statusProduto || '(vazio)'}": ${row.cnt}`));

const [semStatus] = await conn.execute(
  `SELECT COUNT(*) as cnt FROM veiling_produtos WHERE statusProduto IS NULL OR statusProduto = ''`
);
console.log(`\n${semStatus[0].cnt === 0 ? '✓' : '⚠'} Sem status: ${semStatus[0].cnt} registros`);

// Total
const [total] = await conn.execute(`SELECT COUNT(*) as cnt FROM veiling_produtos`);
console.log(`Total de produtos: ${total[0].cnt}`);

await conn.end();
console.log('\nConcluído.');
