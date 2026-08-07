CREATE TABLE `veiling_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario` varchar(320) NOT NULL DEFAULT '',
	`senha` varchar(255) NOT NULL DEFAULT '',
	`customerId` varchar(20) NOT NULL DEFAULT '987',
	`margemGlobal` decimal(5,2) NOT NULL DEFAULT '30.00',
	`ultimaAtualizacao` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `veiling_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `veiling_margens_departamento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoria` varchar(100) NOT NULL,
	`margem` decimal(5,2) NOT NULL DEFAULT '30.00',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `veiling_margens_departamento_id` PRIMARY KEY(`id`),
	CONSTRAINT `veiling_margens_departamento_categoria_unique` UNIQUE(`categoria`)
);
--> statement-breakpoint
CREATE TABLE `veiling_produtos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offerId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`nomeCompleto` varchar(255) NOT NULL DEFAULT '',
	`categoria` varchar(100) NOT NULL DEFAULT '',
	`categoriaId` int NOT NULL DEFAULT 0,
	`produtor` varchar(255) NOT NULL DEFAULT '',
	`qualidade` varchar(20) NOT NULL DEFAULT '',
	`dimensao` varchar(50) NOT NULL DEFAULT '',
	`embalagem` varchar(100) NOT NULL DEFAULT '',
	`precoCarrinho` decimal(12,2),
	`precoCamada` decimal(12,2),
	`precoEmbalagem` decimal(12,2),
	`estoqueDisponivel` int NOT NULL DEFAULT 0,
	`tipoOferta` varchar(50) NOT NULL DEFAULT '',
	`dataValidade` varchar(30),
	`imagemUrl` text,
	`frete` decimal(10,2),
	`multiplo` int NOT NULL DEFAULT 1,
	`compraMinima` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `veiling_produtos_id` PRIMARY KEY(`id`)
);
