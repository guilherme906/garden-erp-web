CREATE TABLE `acompanhamento_compras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`compraItemId` int NOT NULL,
	`compraId` int NOT NULL,
	`produtoId` int,
	`produtoNome` varchar(255) NOT NULL,
	`quantidadePedida` decimal(12,2) NOT NULL DEFAULT '0',
	`quantidadeComprada` decimal(12,2) NOT NULL DEFAULT '0',
	`quantidadeRestante` decimal(12,2) NOT NULL DEFAULT '0',
	`quantidadeExcedente` decimal(12,2) NOT NULL DEFAULT '0',
	`status` enum('PENDENTE','PARCIAL','COMPLETO','EXCEDENTE') NOT NULL DEFAULT 'PENDENTE',
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `acompanhamento_compras_id` PRIMARY KEY(`id`)
);
