import { createConnection } from 'mysql2/promise';
const conn = await createConnection(process.env.DATABASE_URL);

// Verificar se produtos com tipoOferta vazio têm dados GFP
const [comGfp] = await conn.execute(
  `SELECT COUNT(*) as cnt FROM veiling_produtos WHERE (tipoOferta IS NULL OR tipoOferta = '') AND gfpNumero IS NOT NULL AND gfpNumero != ''`
);
console.log(`Produtos tipoOferta vazio COM GFP: ${comGfp[0].cnt}`);

const [semGfp] = await conn.execute(
  `SELECT COUNT(*) as cnt FROM veiling_produtos WHERE (tipoOferta IS NULL OR tipoOferta = '') AND (gfpNumero IS NULL OR gfpNumero = '')`
);
console.log(`Produtos tipoOferta vazio SEM GFP: ${semGfp[0].cnt}`);

// Verificar tipo=3
const [tipo3] = await conn.execute(
  `SELECT offerId, nome, tipoOferta, gfpNumero FROM veiling_produtos WHERE tipoOferta = '3' LIMIT 5`
);
console.log('\nExemplos tipoOferta=3:');
tipo3.forEach(row => console.log(`  offerId=${row.offerId} nome="${row.nome}" gfp="${row.gfpNumero}"`));

await conn.end();
