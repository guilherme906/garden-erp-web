ALTER TABLE `clientes` ADD `bloqueado` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `clientes` ADD `motivoBloqueio` text;--> statement-breakpoint
ALTER TABLE `clientes` ADD `bloqueadoEm` timestamp;--> statement-breakpoint
ALTER TABLE `clientes` ADD `bloqueadoPor` varchar(255);