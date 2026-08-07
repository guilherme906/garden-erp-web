import { getDb } from './server/db';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';

async function main() {
  const drizzleDb = await getDb();
  if (!drizzleDb) throw new Error('DB não disponível');
  // 1. Criar tabela
  await drizzleDb.execute(sql`
    CREATE TABLE IF NOT EXISTS veiling_conversao (
      id INT AUTO_INCREMENT PRIMARY KEY,
      codItem VARCHAR(50) NOT NULL,
      descCurta VARCHAR(255) NOT NULL DEFAULT '',
      descLonga VARCHAR(255) NOT NULL DEFAULT '',
      qtdVenda INT NOT NULL DEFAULT 1,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_descCurta (descCurta),
      INDEX idx_codItem (codItem)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✓ Tabela veiling_conversao criada/verificada');

  // 2. Ler JSON
  const data: Array<{ codItem: string; descCurta: string; descLonga: string; qtdVenda: number }> =
    JSON.parse(readFileSync('/tmp/conversao_data.json', 'utf8'));
  console.log(`✓ JSON lido: ${data.length} registros`);

  // 3. Limpar e reinserir
  await drizzleDb.execute(sql.raw('TRUNCATE TABLE veiling_conversao'));

  let inserted = 0;
  const BATCH = 200;
  for (let i = 0; i < data.length; i += BATCH) {
    const chunk = data.slice(i, i + BATCH);
    // Escapar strings
    const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const values = chunk.map(r =>
      `('${esc(r.codItem)}', '${esc(r.descCurta)}', '${esc(r.descLonga)}', ${r.qtdVenda})`
    ).join(', ');
    await drizzleDb.execute(sql.raw(
      `INSERT INTO veiling_conversao (codItem, descCurta, descLonga, qtdVenda) VALUES ${values}`
    ));
    inserted += chunk.length;
    process.stdout.write(`\r  Inserindo... ${inserted}/${data.length}`);
  }
  console.log(`\n✓ ${inserted} registros inseridos na tabela veiling_conversao`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
