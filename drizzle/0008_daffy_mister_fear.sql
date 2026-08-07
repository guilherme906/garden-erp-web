ALTER TABLE `vendas` ADD `faturado` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `vendas` ADD `faturadoPor` varchar(255);--> statement-breakpoint
ALTER TABLE `vendas` ADD `faturadoEm` timestamp;