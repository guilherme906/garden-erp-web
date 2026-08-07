import { createConnection } from 'mysql2/promise';

const conn = await createConnection(process.env.DATABASE_URL);

const sqls = [
  `CREATE TABLE IF NOT EXISTS \`catalogos_venda\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`titulo\` varchar(255) NOT NULL,
    \`descricao\` text,
    \`token\` varchar(64) NOT NULL,
    \`expiresAt\` timestamp NOT NULL,
    \`ativo\` int NOT NULL DEFAULT 1,
    \`criadoPor\` varchar(255),
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`catalogos_venda_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`catalogos_venda_token_unique\` UNIQUE(\`token\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`catalogos_venda_itens\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`catalogoId\` int NOT NULL,
    \`origem\` enum('cooperflora','veiling','loja') NOT NULL,
    \`produtoId\` varchar(100) NOT NULL,
    \`nome\` varchar(255) NOT NULL,
    \`descricao\` text,
    \`preco\` decimal(10,2),
    \`imagemUrl\` text,
    \`unidade\` varchar(50),
    \`ordem\` int NOT NULL DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`catalogos_venda_itens_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`catalogos_pedidos\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`catalogoId\` int NOT NULL,
    \`clienteNome\` varchar(255) NOT NULL,
    \`clienteTelefone\` varchar(30) NOT NULL,
    \`dataEntrega\` varchar(10) NOT NULL,
    \`observacao\` text,
    \`status\` enum('NOVO','VISTO','APROVADO','CANCELADO') NOT NULL DEFAULT 'NOVO',
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`catalogos_pedidos_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`catalogos_pedidos_itens\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`pedidoId\` int NOT NULL,
    \`catalogoItemId\` int NOT NULL,
    \`nome\` varchar(255) NOT NULL,
    \`preco\` decimal(10,2),
    \`quantidade\` int NOT NULL DEFAULT 1,
    \`subtotal\` decimal(10,2),
    CONSTRAINT \`catalogos_pedidos_itens_id\` PRIMARY KEY(\`id\`)
  )`,
];

for (const sql of sqls) {
  await conn.execute(sql);
  console.log('OK:', sql.substring(0, 60));
}

await conn.end();
console.log('Migração concluída!');
