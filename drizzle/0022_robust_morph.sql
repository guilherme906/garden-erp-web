ALTER TABLE `veiling_produtos` ADD `packingId` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `veiling_produtos` ADD `gfpQualidade` varchar(10) DEFAULT '';--> statement-breakpoint
ALTER TABLE `veiling_produtos` ADD `gfpNumero` varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE `veiling_produtos` ADD `gfpObs1` text;--> statement-breakpoint
ALTER TABLE `veiling_produtos` ADD `gfpObs2` text;--> statement-breakpoint
ALTER TABLE `veiling_produtos` ADD `gfpEntregaCvh` varchar(20) DEFAULT '';--> statement-breakpoint
ALTER TABLE `veiling_produtos` ADD `gfpSerie` varchar(50) DEFAULT '';--> statement-breakpoint
ALTER TABLE `veiling_produtos` ADD `gfpLote` varchar(50) DEFAULT '';