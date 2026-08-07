CREATE TABLE `formas_pagamento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(100) NOT NULL,
	`descricao` text,
	`ativo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `formas_pagamento_id` PRIMARY KEY(`id`),
	CONSTRAINT `formas_pagamento_nome_unique` UNIQUE(`nome`)
);
--> statement-breakpoint
CREATE TABLE `titulos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendaId` int NOT NULL,
	`clienteId` int NOT NULL,
	`clienteNome` varchar(255) NOT NULL,
	`formaPagamentoId` int,
	`formaPagamentoNome` varchar(100),
	`valor` decimal(12,2) NOT NULL,
	`dataEmissao` timestamp NOT NULL DEFAULT (now()),
	`dataVencimento` timestamp NOT NULL,
	`dataPagamento` timestamp,
	`status` enum('PENDENTE','PAGO','VENCIDO','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `titulos_id` PRIMARY KEY(`id`)
);
