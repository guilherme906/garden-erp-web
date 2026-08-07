CREATE TABLE `backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomeArquivo` varchar(255) NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`s3Url` text,
	`tamanho` int,
	`usuarioNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`telefone` varchar(30),
	`email` varchar(320),
	`endereco` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compra_itens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`compraId` int NOT NULL,
	`produtoId` int,
	`produtoNome` varchar(255) NOT NULL,
	`quantidade` decimal(12,2) NOT NULL DEFAULT '0',
	`valorUnitario` decimal(12,2) NOT NULL DEFAULT '0.00',
	`subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
	CONSTRAINT `compra_itens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `compras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fornecedor` varchar(255),
	`data` varchar(10) NOT NULL,
	`total` decimal(12,2) NOT NULL DEFAULT '0.00',
	`origem` varchar(50) DEFAULT 'MANUAL',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compras_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estoque_ajustes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`produtoId` int NOT NULL,
	`produtoNome` varchar(255) NOT NULL,
	`quantidade` decimal(12,2) NOT NULL DEFAULT '0',
	`motivo` text,
	`usuarioNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `estoque_ajustes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `historico_alteracoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tabela` varchar(50) NOT NULL,
	`registroId` int NOT NULL,
	`campo` varchar(100) NOT NULL,
	`valorAntigo` text,
	`valorNovo` text,
	`usuarioNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historico_alteracoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `produtos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`descricao` varchar(255) NOT NULL,
	`preco` decimal(12,2) NOT NULL DEFAULT '0.00',
	`codigoExterno` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `produtos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venda_itens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendaId` int NOT NULL,
	`produtoId` int,
	`produtoNome` varchar(255) NOT NULL,
	`quantidade` decimal(12,2) NOT NULL DEFAULT '0',
	`valorUnitario` decimal(12,2) NOT NULL DEFAULT '0.00',
	`subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
	`observacao` text,
	CONSTRAINT `venda_itens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clienteId` int,
	`clienteNome` varchar(255),
	`vendedorId` int,
	`vendedorNome` varchar(255),
	`data` varchar(10) NOT NULL,
	`status` enum('AGUARDANDO','APROVADO','CANCELADO') NOT NULL DEFAULT 'AGUARDANDO',
	`logistica` varchar(100),
	`total` decimal(12,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendedores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320),
	`telefone` varchar(30),
	`senha` varchar(255) NOT NULL,
	`perfil` enum('ADMIN','VENDEDOR') NOT NULL DEFAULT 'VENDEDOR',
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendedores_id` PRIMARY KEY(`id`)
);
