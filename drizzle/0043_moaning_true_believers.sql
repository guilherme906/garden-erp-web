CREATE TABLE `vendas_efetivas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orcamentoId` int NOT NULL,
	`orcamentoNum` varchar(50),
	`clienteId` int,
	`clienteNome` varchar(255),
	`vendedorId` int,
	`vendedorNome` varchar(255),
	`total` decimal(12,2) NOT NULL DEFAULT '0.00',
	`dataVenda` varchar(10) NOT NULL,
	`dataEntrega` varchar(10),
	`formaPagamento` varchar(100),
	`observacao` text,
	`status` enum('PENDENTE','ENTREGUE','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
	`convertidoPor` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendas_efetivas_id` PRIMARY KEY(`id`)
);
