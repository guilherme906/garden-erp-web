import { createConnection } from 'mysql2/promise';
const conn = await createConnection(process.env.DATABASE_URL);

// tipoOferta vazio ou '1' ou '3' → LKP_SITIO (sem GFP de entrega = no sítio)
// tipoOferta = '2' → ENP (estoque no produtor)
// Produtos com tipoOferta='1' e gfpEntregaCvh preenchido → LKP_RECEPCIONADO

// 1. ENP (tipoOferta=2)
const [r1] = await conn.execute(
  `UPDATE veiling_produtos SET statusProduto = 'ENP' WHERE tipoOferta = '2' AND (statusProduto IS NULL OR statusProduto = '')`
);
console.log(`✓ ENP: ${r1.affectedRows} registros`);

// 2. LKP_SITIO (tipoOferta vazio, '1' ou '3' sem GFP de entrega)
const [r2] = await conn.execute(
  `UPDATE veiling_produtos SET statusProduto = 'LKP_SITIO' 
   WHERE (tipoOferta IS NULL OR tipoOferta = '' OR tipoOferta = '1' OR tipoOferta = '3')
   AND (gfpEntregaCvh IS NULL OR gfpEntregaCvh = '')
   AND (statusProduto IS NULL OR statusProduto = '')`
);
console.log(`✓ LKP_SITIO (sem entrega CVH): ${r2.affectedRows} registros`);

// 3. LKP_RECEPCIONADO (tipoOferta '1' com gfpEntregaCvh preenchido)
const [r3] = await conn.execute(
  `UPDATE veiling_produtos SET statusProduto = 'LKP_RECEPCIONADO' 
   WHERE (tipoOferta = '1' OR tipoOferta IS NULL OR tipoOferta = '')
   AND gfpEntregaCvh IS NOT NULL AND gfpEntregaCvh != ''
   AND (statusProduto IS NULL OR statusProduto = '')`
);
console.log(`✓ LKP_RECEPCIONADO (com entrega CVH): ${r3.affectedRows} registros`);

// Verificar resultado final
const [dist] = await conn.execute(
  `SELECT statusProduto, COUNT(*) as cnt FROM veiling_produtos GROUP BY statusProduto ORDER BY cnt DESC`
);
console.log('\nDistribuição final de status:');
dist.forEach(row => console.log(`  "${row.statusProduto || '(vazio)'}": ${row.cnt}`));

const [semStatus] = await conn.execute(
  `SELECT COUNT(*) as cnt FROM veiling_produtos WHERE statusProduto IS NULL OR statusProduto = ''`
);
console.log(`\n⚠ Ainda sem status: ${semStatus[0].cnt} registros`);

await conn.end();
console.log('Concluído.');
