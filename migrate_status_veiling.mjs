import { createConnection } from 'mysql2/promise';
const conn = await createConnection(process.env.DATABASE_URL);
try {
  await conn.execute(`ALTER TABLE \`veiling_produtos\` ADD COLUMN IF NOT EXISTS \`statusProduto\` varchar(50) DEFAULT ''`);
  console.log('✓ Coluna statusProduto adicionada à tabela veiling_produtos');
} catch (e) {
  if (e.code === 'ER_DUP_FIELDNAME') {
    console.log('✓ Coluna statusProduto já existe (nada a fazer)');
  } else {
    console.error('Erro:', e.message);
    process.exit(1);
  }
}
await conn.end();
console.log('Migração concluída.');
