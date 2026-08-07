CREATE TABLE `promocoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`tipoDesconto` enum('percentual','fixo') NOT NULL DEFAULT 'percentual',
	`valorDesconto` decimal(10,2) NOT NULL,
	`imagemUrl` text,
	`imagemBase64` text,
	`ativo` int NOT NULL DEFAULT 1,
	`criadoPor` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promocoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promocoes_itens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promocaoId` int NOT NULL,
	`produtoId` varchar(255) NOT NULL,
	`produtoNome` varchar(255) NOT NULL,
	`precoOriginal` decimal(10,2) NOT NULL,
	`precoPromocional` decimal(10,2) NOT NULL,
	`imagemUrl` text,
	`catalogo` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promocoes_itens_id` PRIMARY KEY(`id`)
);
