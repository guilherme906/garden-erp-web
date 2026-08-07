import mysql from 'mysql2/promise';
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
async function run() {
  const conn = await mysql.createConnection(url);
  try {
    // Adicionar campo vendaId em pedidos_publicos para rastrear o orçamento gerado
    await conn.execute(`ALTER TABLE pedidos_publicos ADD COLUMN IF NOT EXISTS vendaId int NULL`);
    console.log('✅ Campo vendaId adicionado em pedidos_publicos');
  } catch (err) {
    if (err.message && err.message.includes('Duplicate column')) {
      console.log('ℹ️ Campo vendaId já existe em pedidos_publicos');
    } else {
      throw err;
    }
  }
  await conn.end();
  console.log('✅ Migration 0056 aplicada com sucesso');
}
run().catch(e => { console.error('❌ Erro:', e.message); process.exit(1); });
