CREATE TABLE `relatorios_compartilhados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`clienteId` int NOT NULL,
	`filtros` text,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `relatorios_compartilhados_id` PRIMARY KEY(`id`),
	CONSTRAINT `relatorios_compartilhados_token_unique` UNIQUE(`token`)
);
