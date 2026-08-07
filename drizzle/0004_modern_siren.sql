ALTER TABLE `clientes` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `produtos` ADD `custo` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `produtos` ADD `fatorConversao` decimal(12,4) DEFAULT '1.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE `produtos` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `vendas` ADD `deletedAt` timestamp;