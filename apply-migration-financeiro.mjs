import { execSync } from 'child_process';
import fs from 'fs';

const sql = fs.readFileSync('drizzle/0007_wealthy_catseye.sql', 'utf-8');
const commands = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);

console.log('Aplicando migration de financeiro...');
console.log(`${commands.length} comandos SQL encontrados`);

// Usar drizzle-kit migrate (mais seguro)
try {
  const result = execSync('pnpm drizzle-kit migrate --dialect mysql', { encoding: 'utf-8' });
  console.log('✓ Migration aplicada com sucesso');
  console.log(result);
} catch (e) {
  console.error('Erro ao aplicar migration:', e.message);
  process.exit(1);
}
