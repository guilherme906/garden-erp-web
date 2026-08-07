import { createConnection } from 'mysql2/promise';
import { execSync } from 'child_process';

// Pegar DATABASE_URL do ambiente
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL não definida. Execute: DATABASE_URL=... node create-conversao.mjs');
  process.exit(1);
}

const conn = await createConnection(dbUrl);
console.log('Conectado ao banco');

await conn.execute(`
  CREATE TABLE IF NOT EXISTS veiling_conversao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codItem VARCHAR(50) NOT NULL,
    descCurta VARCHAR(255) NOT NULL DEFAULT '',
    descLonga VARCHAR(255) NOT NULL DEFAULT '',
    qtdVenda INT NOT NULL DEFAULT 1,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_descCurta (descCurta),
    INDEX idx_codItem (codItem)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
console.log('Tabela veiling_conversao criada/verificada');
await conn.end();
console.log('Pronto!');
