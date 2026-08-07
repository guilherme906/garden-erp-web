CREATE TABLE `bling_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiKey` varchar(500) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bling_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bling_pedido_mapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gardenPedidoId` varchar(255) NOT NULL,
	`blingPedidoId` varchar(255) NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bling_pedido_mapping_id` PRIMARY KEY(`id`),
	CONSTRAINT `bling_pedido_mapping_gardenPedidoId_unique` UNIQUE(`gardenPedidoId`)
);
--> statement-breakpoint
CREATE TABLE `bling_produto_mapping` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gardenProdutoId` varchar(255) NOT NULL,
	`blingProdutoId` varchar(255) NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bling_produto_mapping_id` PRIMARY KEY(`id`),
	CONSTRAINT `bling_produto_mapping_gardenProdutoId_unique` UNIQUE(`gardenProdutoId`)
);
--> statement-breakpoint
CREATE TABLE `bling_sync` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL,
	`direction` varchar(50) NOT NULL,
	`sourceId` varchar(255) NOT NULL,
	`blingId` varchar(255),
	`status` varchar(50) NOT NULL,
	`errorMessage` text,
	`retryCount` int DEFAULT 0,
	`maxRetries` int DEFAULT 3,
	`lastRetryAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bling_sync_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bling_sync_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`syncId` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bling_sync_history_id` PRIMARY KEY(`id`)
);
