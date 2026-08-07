CREATE TABLE `cooperflora_margens_departamento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`grupo` varchar(100) NOT NULL,
	`margem` decimal(5,2) NOT NULL DEFAULT '30.00',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cooperflora_margens_departamento_id` PRIMARY KEY(`id`),
	CONSTRAINT `cooperflora_margens_departamento_grupo_unique` UNIQUE(`grupo`)
);
--> statement-breakpoint
CREATE TABLE `cooperflora_sync_pendente` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(30) NOT NULL,
	`acao` enum('CRIAR','ATUALIZAR','REMOVER') NOT NULL,
	`nome` varchar(255) NOT NULL,
	`qualidade` varchar(10) NOT NULL DEFAULT '',
	`grupo` varchar(100) NOT NULL DEFAULT '',
	`custoNovo` decimal(12,4) NOT NULL DEFAULT '0',
	`precoNovo` decimal(12,2) NOT NULL DEFAULT '0',
	`custoAnterior` decimal(12,4),
	`precoAnterior` decimal(12,2),
	`estoqueNovo` int NOT NULL DEFAULT 0,
	`estoqueAnterior` int,
	`hastes` int NOT NULL DEFAULT 1,
	`imagemUrl` text,
	`produtoErpId` int,
	`aprovado` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cooperflora_sync_pendente_id` PRIMARY KEY(`id`)
);
