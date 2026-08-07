import { createConnection } from 'mysql2/promise';
const conn = await createConnection(process.env.DATABASE_URL);
try {
  await conn.execute("ALTER TABLE `vendas` ADD `telefoneCliente` varchar(30)");
  console.log('✓ telefoneCliente adicionado');
} catch(e) { if (e.code === 'ER_DUP_FIELDNAME') console.log('~ telefoneCliente já existe'); else throw e; }
try {
  await conn.execute("ALTER TABLE `vendas` ADD `dataEntrega` varchar(10)");
  console.log('✓ dataEntrega adicionado');
} catch(e) { if (e.code === 'ER_DUP_FIELDNAME') console.log('~ dataEntrega já existe'); else throw e; }
try {
  await conn.execute("ALTER TABLE `vendas` ADD `horaEntrega` varchar(5)");
  console.log('✓ horaEntrega adicionado');
} catch(e) { if (e.code === 'ER_DUP_FIELDNAME') console.log('~ horaEntrega já existe'); else throw e; }
try {
  await conn.execute("ALTER TABLE `vendas` ADD `observacaoPedido` text");
  console.log('✓ observacaoPedido adicionado');
} catch(e) { if (e.code === 'ER_DUP_FIELDNAME') console.log('~ observacaoPedido já existe'); else throw e; }
await conn.end();
console.log('Migração concluída.');
