/**
 * Script para popular o campo icms na tabela veiling_conversao
 * a partir dos dados extraídos da planilha de importação.
 * 
 * Os codItem no banco têm ponto e vírgula no final: '01005.221.000.00.00;'
 * Os codItem da planilha não têm: '01005.221.000.00.00'
 */
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';

const icmsData = JSON.parse(readFileSync('/tmp/icms_data.json', 'utf-8'));
console.log(`Total de produtos com ICMS na planilha: ${icmsData.length}`);

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Resetar todos os icms para NULL primeiro
await conn.execute('UPDATE veiling_conversao SET icms = NULL');
console.log('ICMS resetado para NULL em todos os registros');

// Atualizar os registros com ICMS
// O banco tem codItem com ';' no final, a planilha não tem
let updated = 0;
let notFound = 0;
for (const item of icmsData) {
  // Tentar com ';' no final (formato do banco)
  const codWithSemicolon = item.codItem + ';';
  const [result] = await conn.execute(
    'UPDATE veiling_conversao SET icms = ? WHERE codItem = ?',
    [item.icms, codWithSemicolon]
  );
  if (result.affectedRows > 0) {
    updated += result.affectedRows;
  } else {
    // Tentar sem ';' também
    const [result2] = await conn.execute(
      'UPDATE veiling_conversao SET icms = ? WHERE codItem = ?',
      [item.icms, item.codItem]
    );
    if (result2.affectedRows > 0) {
      updated += result2.affectedRows;
    } else {
      notFound++;
      if (notFound <= 5) {
        console.log(`  Não encontrado: ${item.codItem}`);
      }
    }
  }
}

console.log(`Atualizados: ${updated}, Não encontrados: ${notFound}`);

// Verificar resultado
const [check] = await conn.execute('SELECT COUNT(*) as total FROM veiling_conversao WHERE icms IS NOT NULL');
console.log('Total com ICMS no banco:', check[0].total);

// Mostrar exemplos com ICMS
const [examples] = await conn.execute('SELECT codItem, descLonga, icms FROM veiling_conversao WHERE icms IS NOT NULL LIMIT 5');
console.log('Exemplos com ICMS:', examples);

await conn.end();
console.log('Script concluído!');
