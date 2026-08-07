CREATE TABLE `veiling_filtros_salvos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`categoria` varchar(255),
	`produtor` varchar(255),
	`cor` varchar(255),
	`busca` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `veiling_filtros_salvos_id` PRIMARY KEY(`id`)
);
