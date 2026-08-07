import { createConnection } from 'mysql2/promise';
const conn = await createConnection(process.env.DATABASE_URL);

// Atualizar todos os registros com statusProduto vazio ou nulo
// baseado no tipoOferta já salvo no banco:
//   tipoOferta = '2' → ENP (estoque no produtor)
//   tipoOferta = '1' → LKP_SITIO (por padrão; LKP_RECEPCIONADO é definido na sync completa com GFP)
//   outros → manter vazio

const [r1] = await conn.execute(
  `UPDATE veiling_produtos SET statusProduto = 'ENP' WHERE tipoOferta = '2' AND (statusProduto IS NULL OR statusProduto = '')`
);
console.log(`✓ ENP: ${r1.affectedRows} registros atualizados`);

const [r2] = await conn.execute(
  `UPDATE veiling_produtos SET statusProduto = 'LKP_SITIO' WHERE tipoOferta = '1' AND (statusProduto IS NULL OR statusProduto = '')`
);
console.log(`✓ LKP_SITIO: ${r2.affectedRows} registros atualizados`);

// Verificar quantos ficaram sem status
const [r3] = await conn.execute(
  `SELECT COUNT(*) as cnt FROM veiling_produtos WHERE statusProduto IS NULL OR statusProduto = ''`
);
console.log(`⚠ Sem status: ${r3[0].cnt} registros`);

// Resumo por status
const [r4] = await conn.execute(
  `SELECT statusProduto, COUNT(*) as cnt FROM veiling_produtos GROUP BY statusProduto ORDER BY cnt DESC`
);
console.log('Distribuição de status:');
r4.forEach(row => console.log(`  ${row.statusProduto || '(vazio)'}: ${row.cnt}`));

await conn.end();
console.log('Concluído.');
