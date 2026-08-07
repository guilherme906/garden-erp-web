import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Simular o que listVeilingProdutos faz
const [items] = await conn.execute('SELECT id, nome, nomeCompleto, offerId FROM veiling_produtos LIMIT 10');
const [conversao] = await conn.execute('SELECT descCurta, qtdVenda, fotoUrl FROM veiling_conversao WHERE fotoUrl IS NOT NULL LIMIT 100');

// Criar mapa
const map = new Map();
for (const r of conversao) {
  const key = r.descCurta.trim().toUpperCase();
  if (!map.has(key)) map.set(key, { qtdVenda: r.qtdVenda, fotoUrl: r.fotoUrl });
}

console.log('Mapa de conversão (primeiros 5 keys):', [...map.keys()].slice(0, 5));

// Fazer match
for (const item of items) {
  const nomeKey = item.nome.trim().toUpperCase();
  const conv = map.get(nomeKey);
  console.log(`"${item.nome}" -> ${conv ? 'MATCH: ' + conv.fotoUrl?.substring(0, 60) : 'SEM MATCH'}`);
}

// Verificar total de matches
const [allItems] = await conn.execute('SELECT COUNT(*) as total FROM veiling_produtos');
const [allConv] = await conn.execute('SELECT COUNT(*) as total FROM veiling_conversao WHERE fotoUrl IS NOT NULL');
console.log('\nTotal produtos Veiling:', allItems[0].total);
console.log('Total conversão com foto:', allConv[0].total);

await conn.end();
