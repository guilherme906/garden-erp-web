ALTER TABLE `vendas` MODIFY COLUMN `status` enum('AGUARDANDO','APROVADO','CANCELADO','EXPIRADO') NOT NULL DEFAULT 'AGUARDANDO';--> statement-breakpoint
ALTER TABLE `vendas` ADD `vencimento` varchar(10);--> statement-breakpoint
ALTER TABLE `vendas` ADD `shareToken` varchar(64);