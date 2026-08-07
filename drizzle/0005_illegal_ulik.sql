ALTER TABLE `venda_itens` ADD `qtdConferida` decimal(12,2);--> statement-breakpoint
ALTER TABLE `vendas` ADD `conferido` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `vendas` ADD `conferidoPor` varchar(255);--> statement-breakpoint
ALTER TABLE `vendas` ADD `conferidoEm` timestamp;