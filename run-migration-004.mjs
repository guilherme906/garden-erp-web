import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn);

const statements = [
  "ALTER TABLE `clientes` ADD `deletedAt` timestamp",
  "ALTER TABLE `produtos` ADD `custo` decimal(12,2) DEFAULT '0.00' NOT NULL",
  "ALTER TABLE `produtos` ADD `fatorConversao` decimal(12,4) DEFAULT '1.0000' NOT NULL",
  "ALTER TABLE `produtos` ADD `deletedAt` timestamp",
  "ALTER TABLE `vendas` ADD `deletedAt` timestamp",
];

for (const sql of statements) {
  try {
    await conn.execute(sql);
    console.log("OK:", sql.substring(0, 60));
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("SKIP (already exists):", sql.substring(0, 60));
    } else {
      console.error("ERROR:", e.message);
    }
  }
}

await conn.end();
console.log("Migration complete!");
