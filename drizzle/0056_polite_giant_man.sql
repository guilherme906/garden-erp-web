ALTER TABLE `pedidos_publicos` ADD `vendaId` int;--> statement-breakpoint
ALTER TABLE `veiling_catalogo_links` ADD `filtroCategoria` varchar(100) DEFAULT '';--> statement-breakpoint
ALTER TABLE `veiling_catalogo_links` ADD `filtroProdutor` varchar(255) DEFAULT '';--> statement-breakpoint
ALTER TABLE `veiling_catalogo_links` ADD `filtroCor` varchar(100) DEFAULT '';--> statement-breakpoint
ALTER TABLE `veiling_catalogo_links` ADD `filtroBusca` varchar(255) DEFAULT '';--> statement-breakpoint
ALTER TABLE `vendas_efetivas` ADD `itensSnapshot` json;