CREATE TABLE `pedido_compra_itens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pedidoCompraId` int NOT NULL,
	`produtoId` int,
	`produtoNome` varchar(255) NOT NULL,
	`quantidade` decimal(12,2) NOT NULL DEFAULT '0',
	`precoVenda` decimal(12,2) NOT NULL DEFAULT '0.00',
	`subtotalVenda` decimal(12,2) NOT NULL DEFAULT '0.00',
	CONSTRAINT `pedido_compra_itens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pedidos_compra` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` int NOT NULL,
	`data` varchar(10) NOT NULL,
	`solicitante` varchar(255) NOT NULL,
	`observacoes` text,
	`status` enum('ABERTO','APROVADO','FINALIZADO','CANCELADO') NOT NULL DEFAULT 'ABERTO',
	`total` decimal(12,2) NOT NULL DEFAULT '0.00',
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pedidos_compra_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `venda_itens` ADD `qtdConferida2` decimal(12,2);