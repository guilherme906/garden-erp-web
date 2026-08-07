CREATE TABLE `caixa_movimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caixaId` int NOT NULL,
	`tipo` enum('ENTRADA','SAIDA') NOT NULL,
	`categoria` varchar(100) NOT NULL,
	`descricao` varchar(500),
	`valor` decimal(12,2) NOT NULL,
	`formaPagamento` varchar(100),
	`vendaId` int,
	`vendaNum` varchar(50),
	`lancadoPor` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `caixa_movimentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `caixas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`data` varchar(10) NOT NULL,
	`saldoInicial` decimal(12,2) NOT NULL DEFAULT '0.00',
	`saldoFinal` decimal(12,2),
	`totalEntradas` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalSaidas` decimal(12,2) NOT NULL DEFAULT '0.00',
	`status` enum('ABERTO','FECHADO') NOT NULL DEFAULT 'ABERTO',
	`abertoPor` varchar(255),
	`fechadoPor` varchar(255),
	`fechadoEm` timestamp,
	`observacao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `caixas_id` PRIMARY KEY(`id`)
);
