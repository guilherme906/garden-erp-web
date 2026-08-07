CREATE TABLE `venda_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendaId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venda_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `venda_links_token_unique` UNIQUE(`token`)
);
