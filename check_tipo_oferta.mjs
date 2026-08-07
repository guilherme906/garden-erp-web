import { createConnection } from 'mysql2/promise';
const conn = await createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(
  `SELECT tipoOferta, COUNT(*) as cnt FROM veiling_produtos GROUP BY tipoOferta ORDER BY cnt DESC LIMIT 20`
);
console.log('Valores de tipoOferta no banco:');
rows.forEach(row => console.log(`  "${row.tipoOferta}": ${row.cnt}`));

// Ver alguns exemplos dos que estão sem status
const [exemplos] = await conn.execute(
  `SELECT offerId, nome, tipoOferta, statusProduto FROM veiling_produtos WHERE statusProduto IS NULL OR statusProduto = '' LIMIT 5`
);
console.log('\nExemplos sem status:');
exemplos.forEach(row => console.log(`  offerId=${row.offerId} nome="${row.nome}" tipoOferta="${row.tipoOferta}" status="${row.statusProduto}"`));

await conn.end();
