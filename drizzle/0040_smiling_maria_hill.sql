ALTER TABLE `app_config` MODIFY COLUMN `valor` text NOT NULL;--> statement-breakpoint
ALTER TABLE `venda_itens` ADD `ordem` int DEFAULT 0 NOT NULL;