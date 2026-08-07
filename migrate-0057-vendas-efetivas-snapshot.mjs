import mysql from 'mysql2/promise';
const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
async function run() {
  const conn = await mysql.createConnection(url);
  try {
    // Adicionar coluna itensSnapshot (JSON) em vendas_efetivas
    await conn.execute(`
      ALTER TABLE vendas_efetivas
      ADD COLUMN IF NOT EXISTS itensSnapshot JSON NULL COMMENT 'Snapshot dos itens do orçamento original no momento da conversão'
    `);
    console.log("✅ Coluna itensSnapshot adicionada em vendas_efetivas");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("ℹ️  Coluna itensSnapshot já existe — nada a fazer");
    } else {
      throw e;
    }
  } finally {
    await conn.end();
  }
}
run().catch(e => { console.error("❌ Erro:", e.message); process.exit(1); });
