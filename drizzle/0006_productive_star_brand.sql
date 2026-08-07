CREATE TABLE `tabela_precos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`compraItemId` int NOT NULL,
	`compraId` int NOT NULL,
	`produtoId` int,
	`produtoNome` varchar(255) NOT NULL,
	`custoUnitario` decimal(12,2) NOT NULL DEFAULT '0.00',
	`margem1` decimal(8,2) NOT NULL DEFAULT '0.00',
	`preco1` decimal(12,2) NOT NULL DEFAULT '0.00',
	`margem2` decimal(8,2) NOT NULL DEFAULT '0.00',
	`preco2` decimal(12,2) NOT NULL DEFAULT '0.00',
	`margem3` decimal(8,2) NOT NULL DEFAULT '0.00',
	`preco3` decimal(12,2) NOT NULL DEFAULT '0.00',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tabela_precos_id` PRIMARY KEY(`id`)
);
