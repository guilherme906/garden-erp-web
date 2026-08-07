CREATE TABLE `lembretes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(100) NOT NULL,
	`userName` varchar(255),
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`dataHora` bigint NOT NULL,
	`recorrencia` enum('NENHUMA','DIARIA','SEMANAL','MENSAL') NOT NULL DEFAULT 'NENHUMA',
	`status` enum('PENDENTE','DISPARADO','LIDO','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
	`prioridade` enum('BAIXA','MEDIA','ALTA') NOT NULL DEFAULT 'MEDIA',
	`notificadoEm` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lembretes_id` PRIMARY KEY(`id`)
);
