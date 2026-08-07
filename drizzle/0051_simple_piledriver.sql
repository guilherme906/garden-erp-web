CREATE TABLE `veiling_catalogo_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(64) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `veiling_catalogo_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `veiling_catalogo_links_token_unique` UNIQUE(`token`)
);
