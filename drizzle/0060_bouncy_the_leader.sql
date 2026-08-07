CREATE TABLE `produtos_lista` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoriaId` int,
	`categoriaNome` varchar(255) NOT NULL,
	`variedade` varchar(255) NOT NULL,
	`tamanho` varchar(50),
	`qtdHasteMaco` varchar(50),
	`valorUnitario` decimal(10,2) NOT NULL DEFAULT '0.00',
	`ativo` int NOT NULL DEFAULT 1,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `produtos_lista_id` PRIMARY KEY(`id`)
);
