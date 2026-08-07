ALTER TABLE `vendas` ADD `qrCodeToken` varchar(64);--> statement-breakpoint
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_qrCodeToken_unique` UNIQUE(`qrCodeToken`);