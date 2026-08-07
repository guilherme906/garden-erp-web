CREATE TABLE `anotacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`titulo` varchar(255) NOT NULL DEFAULT 'Nova anotação',
	`conteudo` text NOT NULL DEFAULT (''),
	`cor` varchar(20) NOT NULL DEFAULT 'yellow',
	`fixada` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anotacoes_id` PRIMARY KEY(`id`)
);
