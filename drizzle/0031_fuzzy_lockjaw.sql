CREATE TABLE `veiling_importacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dataImportacao` timestamp NOT NULL DEFAULT (now()),
	`dataPedidos` varchar(10) NOT NULL,
	`totalItens` int NOT NULL DEFAULT 0,
	`totalPedidos` int NOT NULL DEFAULT 0,
	`compraId` int,
	`status` enum('SUCESSO','ERRO','PARCIAL') NOT NULL DEFAULT 'SUCESSO',
	`mensagem` text,
	`origem` enum('AUTOMATICO','MANUAL') NOT NULL DEFAULT 'AUTOMATICO',
	CONSTRAINT `veiling_importacoes_id` PRIMARY KEY(`id`)
);
