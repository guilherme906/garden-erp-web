CREATE TABLE `produtos_loja` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50),
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`unidade` varchar(20) NOT NULL DEFAULT 'UN',
	`departamento` varchar(100) NOT NULL DEFAULT '',
	`preco` decimal(12,2) NOT NULL DEFAULT '0.00',
	`precoCusto` decimal(12,2),
	`estoque` decimal(12,3) NOT NULL DEFAULT '0.000',
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `produtos_loja_id` PRIMARY KEY(`id`)
);
