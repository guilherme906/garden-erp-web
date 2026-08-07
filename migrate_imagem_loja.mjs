import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await conn.execute("ALTER TABLE `produtos_loja` ADD `imagemUrl` text");
  console.log("✅ Campo imagemUrl adicionado na tabela produtos_loja");
} catch (e) {
  if (e.message.includes('Duplicate column')) {
    console.log("ℹ️ Campo imagemUrl já existe");
  } else {
    throw e;
  }
} finally {
  await conn.end();
}
