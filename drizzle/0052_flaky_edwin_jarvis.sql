CREATE TABLE `pedidos_publicos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`linkToken` varchar(64) NOT NULL,
	`clienteNome` varchar(255) NOT NULL,
	`clienteEmail` varchar(320) NOT NULL,
	`clienteTelefone` varchar(30) NOT NULL,
	`total` decimal(12,2) NOT NULL,
	`status` enum('PENDENTE','CONFIRMADO','CONVERTIDO','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pedidos_publicos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pedidos_publicos_itens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pedidoPublicoId` int NOT NULL,
	`produtoNome` varchar(255) NOT NULL,
	`quantidade` decimal(10,2) NOT NULL,
	`valorUnitario` decimal(10,2) NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pedidos_publicos_itens_id` PRIMARY KEY(`id`)
);
