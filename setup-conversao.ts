import { db as drizzleDb } from './server/db';
import { sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

async function main() {
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

  // 2. Ler Excel
  const buf = readFileSync('/home/ubuntu/upload/tabelaimportaçãosite.xlsx');
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });
  console.log(`✓ Excel lido: ${rows.length} linhas`);

  // 3. Limpar tabela e inserir
  await drizzleDb.execute(sql`TRUNCATE TABLE veiling_conversao`);
  
  const batch: { codItem: string; descCurta: string; descLonga: string; qtdVenda: number }[] = [];
  for (const row of rows) {
    const codItem = String(row['COD_ITEM'] || '').replace(/;$/, '').trim();
    const descCurta = String(row['DESC_CURTA'] || '').trim();
    const descLonga = String(row['DESC_LONGA'] || '').trim();
    const qtdVenda = Number(row['QUANTIDADE DE VENDA']) || 1;
    if (!codItem || !descCurta) continue;
    batch.push({ codItem, descCurta, descLonga, qtdVenda });
  }

  // Inserir em lotes de 500
  let inserted = 0;
  for (let i = 0; i < batch.length; i += 500) {
    const chunk = batch.slice(i, i + 500);
    const values = chunk.map(r => `(${drizzleDb.dialect ? '' : ''}${[
      `'${r.codItem.replace(/'/g, "''")}'`,
      `'${r.descCurta.replace(/'/g, "''")}'`,
      `'${r.descLonga.replace(/'/g, "''")}'`,
      r.qtdVenda
    ].join(', ')})`).join(', ');
    
    await drizzleDb.execute(sql.raw(
      `INSERT INTO veiling_conversao (codItem, descCurta, descLonga, qtdVenda) VALUES ${values}`
    ));
    inserted += chunk.length;
    process.stdout.write(`\r  Inserindo... ${inserted}/${batch.length}`);
  }
  console.log(`\n✓ ${inserted} registros inseridos`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
