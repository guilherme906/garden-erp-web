CREATE TABLE `telefones_clientes_bloqueados` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clienteId` int NOT NULL,
	`telefone` varchar(30) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telefones_clientes_bloqueados_id` PRIMARY KEY(`id`)
);
