CREATE TABLE `produtos_customizados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`precoUnitario` decimal(10,2) NOT NULL DEFAULT '0.00',
	`estoque` int NOT NULL DEFAULT 0,
	`estoqueMinimo` int DEFAULT 0,
	`fotoUrl` text,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `produtos_customizados_id` PRIMARY KEY(`id`)
);
