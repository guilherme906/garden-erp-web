import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn);

const statements = [
  "ALTER TABLE `venda_itens` ADD `qtdConferida` decimal(12,2)",
  "ALTER TABLE `vendas` ADD `conferido` int DEFAULT 0 NOT NULL",
  "ALTER TABLE `vendas` ADD `conferidoPor` varchar(255)",
  "ALTER TABLE `vendas` ADD `conferidoEm` timestamp",
];

for (const sql of statements) {
  try {
    await conn.execute(sql);
    console.log("OK:", sql.substring(0, 60));
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("SKIP (already exists):", sql.substring(0, 60));
    } else {
      console.error("ERR:", e.message);
    }
  }
}

await conn.end();
console.log("Migration 005 done!");
