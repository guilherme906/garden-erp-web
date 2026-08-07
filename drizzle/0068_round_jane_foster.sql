CREATE TABLE `categorias_customizadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`cor` varchar(7) DEFAULT '#3B82F6',
	`icone` varchar(50),
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categorias_customizadas_id` PRIMARY KEY(`id`),
	CONSTRAINT `categorias_customizadas_nome_unique` UNIQUE(`nome`)
);
