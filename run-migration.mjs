import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const sql = `CREATE TABLE IF NOT EXISTS venda_links (
  id int AUTO_INCREMENT NOT NULL,
  vendaId int NOT NULL,
  token varchar(64) NOT NULL,
  expiresAt timestamp NOT NULL,
  createdBy varchar(255),
  createdAt timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT venda_links_id PRIMARY KEY(id),
  CONSTRAINT venda_links_token_unique UNIQUE(token)
);`;
const [result] = await conn.execute(sql);
console.log('Migration result:', result);
await conn.end();
