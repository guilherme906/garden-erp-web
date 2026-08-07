CREATE TABLE `estoque_movimentacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`produtoId` int NOT NULL,
	`tipo` enum('ENTRADA','SAIDA','AJUSTE') NOT NULL,
	`quantidade` decimal(12,3) NOT NULL,
	`estoqueAntes` decimal(12,3) NOT NULL DEFAULT '0.000',
	`estoqueDepois` decimal(12,3) NOT NULL DEFAULT '0.000',
	`justificativa` text NOT NULL,
	`usuarioNome` varchar(255) NOT NULL DEFAULT '',
	`usuarioId` varchar(100) DEFAULT '',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `estoque_movimentacoes_id` PRIMARY KEY(`id`)
);
