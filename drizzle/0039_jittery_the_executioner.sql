CREATE TABLE `app_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chave` varchar(100) NOT NULL,
	`valor` text NOT NULL DEFAULT (''),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_config_chave_unique` UNIQUE(`chave`)
);
