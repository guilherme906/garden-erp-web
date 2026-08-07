CREATE TABLE `sync_historico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fonte` enum('COOPERFLORA','VEILING') NOT NULL,
	`status` enum('SUCESSO','FALHA') NOT NULL,
	`total` int NOT NULL DEFAULT 0,
	`mensagem` text,
	`duracaoMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sync_historico_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `veiling_conversao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codItem` varchar(50) NOT NULL,
	`descCurta` varchar(255) NOT NULL DEFAULT '',
	`descLonga` varchar(255) NOT NULL DEFAULT '',
	`qtdVenda` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `veiling_conversao_id` PRIMARY KEY(`id`)
);
