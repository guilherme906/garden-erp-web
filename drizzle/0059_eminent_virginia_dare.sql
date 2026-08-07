CREATE TABLE `categorias_produtos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`ordem` int NOT NULL DEFAULT 0,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categorias_produtos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listas_itens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listaId` int NOT NULL,
	`categoriaId` int,
	`categoriaNome` varchar(255) NOT NULL,
	`variedade` varchar(255) NOT NULL,
	`tamanho` varchar(50),
	`qtdHasteMaco` varchar(50),
	`valorUnitario` decimal(10,2) NOT NULL,
	`disponivel` int NOT NULL DEFAULT 1,
	`ordem` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listas_itens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listas_pedidos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listaId` int NOT NULL,
	`clienteNome` varchar(255) NOT NULL,
	`clienteTelefone` varchar(30),
	`observacao` text,
	`total` decimal(12,2) NOT NULL DEFAULT '0.00',
	`status` enum('NOVO','VISTO','APROVADO','CANCELADO') NOT NULL DEFAULT 'NOVO',
	`vendaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listas_pedidos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listas_pedidos_itens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pedidoId` int NOT NULL,
	`listaItemId` int NOT NULL,
	`categoriaNome` varchar(255) NOT NULL,
	`variedade` varchar(255) NOT NULL,
	`tamanho` varchar(50),
	`qtdHasteMaco` varchar(50),
	`valorUnitario` decimal(10,2) NOT NULL,
	`quantidade` int NOT NULL DEFAULT 1,
	`subtotal` decimal(12,2) NOT NULL,
	CONSTRAINT `listas_pedidos_itens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listas_precos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`subtitulo` varchar(255),
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp,
	`ativo` int NOT NULL DEFAULT 1,
	`aceitaPedidos` int NOT NULL DEFAULT 1,
	`criadoPor` varchar(255),
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listas_precos_id` PRIMARY KEY(`id`),
	CONSTRAINT `listas_precos_token_unique` UNIQUE(`token`)
);
