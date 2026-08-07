CREATE TABLE `cooperflora_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`login` varchar(100) NOT NULL DEFAULT '',
	`senha` varchar(255) NOT NULL DEFAULT '',
	`chave` varchar(20) NOT NULL DEFAULT '62002',
	`rota` varchar(20) NOT NULL DEFAULT '463',
	`localEntrega` varchar(255) NOT NULL DEFAULT 'TRIANGULO MINEIRO - MG - BROKER',
	`margemPadrao` decimal(5,2) NOT NULL DEFAULT '30.00',
	`dataCarregamento` varchar(10) NOT NULL DEFAULT '',
	`ultimaAtualizacao` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cooperflora_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cooperflora_produtos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(30) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`precoMin` decimal(12,4) NOT NULL DEFAULT '0',
	`precoMax` decimal(12,4) NOT NULL DEFAULT '0',
	`qualidade` varchar(10) NOT NULL DEFAULT '',
	`estoque` int NOT NULL DEFAULT 0,
	`grupo` varchar(100) NOT NULL DEFAULT '',
	`imagemUrl` text,
	`dataCarregamento` varchar(10) NOT NULL DEFAULT '',
	`margemCustom` decimal(5,2),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cooperflora_produtos_id` PRIMARY KEY(`id`)
);
