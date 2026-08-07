import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

async function run() {
  const conn = await mysql.createConnection(url);

  const statements = [
    `CREATE TABLE IF NOT EXISTS pedido_compra_itens (
      id int AUTO_INCREMENT NOT NULL,
      pedidoCompraId int NOT NULL,
      produtoId int,
      produtoNome varchar(255) NOT NULL,
      quantidade decimal(12,2) NOT NULL DEFAULT '0',
      precoVenda decimal(12,2) NOT NULL DEFAULT '0.00',
      subtotalVenda decimal(12,2) NOT NULL DEFAULT '0.00',
      CONSTRAINT pedido_compra_itens_id PRIMARY KEY(id)
    )`,
    `CREATE TABLE IF NOT EXISTS pedidos_compra (
      id int AUTO_INCREMENT NOT NULL,
      numero int NOT NULL,
      data varchar(10) NOT NULL,
      solicitante varchar(255) NOT NULL,
      observacoes text,
      status enum('ABERTO','APROVADO','FINALIZADO','CANCELADO') NOT NULL DEFAULT 'ABERTO',
      total decimal(12,2) NOT NULL DEFAULT '0.00',
      deletedAt timestamp NULL,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT pedidos_compra_id PRIMARY KEY(id)
    )`,
  ];

  for (const sql of statements) {
    try {
      await conn.execute(sql);
      console.log("OK:", sql.substring(0, 60) + "...");
    } catch (err) {
      if (err.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("SKIP (already exists):", sql.substring(0, 60));
      } else {
        console.error("ERR:", err.message);
      }
    }
  }

  // Verify
  const [tables] = await conn.query("SHOW TABLES");
  console.log("Tables:", tables.map(t => Object.values(t)[0]));

  await conn.end();
  console.log("Migration complete!");
}

run().catch(e => { console.error(e); process.exit(1); });
