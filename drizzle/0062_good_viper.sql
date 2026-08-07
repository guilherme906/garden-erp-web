CREATE TABLE `historico_alteracoes_lista` (
	`id` int AUTO_INCREMENT NOT NULL,
	`produtoListaId` int NOT NULL,
	`usuarioId` varchar(255) NOT NULL,
	`usuarioNome` varchar(255) NOT NULL,
	`acao` varchar(50) NOT NULL,
	`campoAlterado` varchar(100),
	`valorAnterior` text,
	`valorNovo` text,
	`data` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historico_alteracoes_lista_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `produtos_lista` ADD `ultimaSincronizacao` timestamp;