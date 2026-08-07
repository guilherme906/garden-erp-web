// Schema para integração com Bling ERP
// Este arquivo será adicionado ao schema.ts principal

import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Configuração da integração Bling
export const blingConfig = sqliteTable("bling_config", {
  id: integer("id").primaryKey(),
  apiKey: text("api_key").notNull(), // Token de autenticação do Bling
  isActive: integer("is_active").default(1), // 1 = ativo, 0 = inativo
  createdAt: integer("created_at").default(sql`(cast(strftime('%s', 'now') as integer))`),
  updatedAt: integer("updated_at").default(sql`(cast(strftime('%s', 'now') as integer))`),
});

// Log de sincronizações
export const blingSync = sqliteTable("bling_sync", {
  id: integer("id").primaryKey(),
  type: text("type").notNull(), // "pedido", "produto", "estoque"
  direction: text("direction").notNull(), // "garden_to_bling" ou "bling_to_garden"
  sourceId: text("source_id").notNull(), // ID do pedido/produto no Garden
  blingId: text("bling_id"), // ID retornado pelo Bling
  status: text("status").notNull(), // "pending", "success", "failed", "retry"
  errorMessage: text("error_message"), // Mensagem de erro se falhar
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  lastRetryAt: integer("last_retry_at"),
  createdAt: integer("created_at").default(sql`(cast(strftime('%s', 'now') as integer))`),
  updatedAt: integer("updated_at").default(sql`(cast(strftime('%s', 'now') as integer))`),
});

// Mapeamento de pedidos Garden → Bling
export const blingPedidoMapping = sqliteTable("bling_pedido_mapping", {
  id: integer("id").primaryKey(),
  gardenPedidoId: text("garden_pedido_id").notNull().unique(), // ID do pedido no Garden
  blingPedidoId: text("bling_pedido_id").notNull(), // ID do pedido no Bling
  syncedAt: integer("synced_at").default(sql`(cast(strftime('%s', 'now') as integer))`),
  updatedAt: integer("updated_at").default(sql`(cast(strftime('%s', 'now') as integer))`),
});

// Mapeamento de produtos Garden → Bling
export const blingProdutoMapping = sqliteTable("bling_produto_mapping", {
  id: integer("id").primaryKey(),
  gardenProdutoId: text("garden_produto_id").notNull().unique(),
  blingProdutoId: text("bling_produto_id").notNull(),
  syncedAt: integer("synced_at").default(sql`(cast(strftime('%s', 'now') as integer))`),
  updatedAt: integer("updated_at").default(sql`(cast(strftime('%s', 'now') as integer))`),
});

// Histórico de sincronizações (para auditoria)
export const blingSyncHistory = sqliteTable("bling_sync_history", {
  id: integer("id").primaryKey(),
  syncId: integer("sync_id").notNull(), // FK para bling_sync
  action: text("action").notNull(), // "created", "updated", "deleted", "retry"
  details: text("details"), // JSON com detalhes da ação
  createdAt: integer("created_at").default(sql`(cast(strftime('%s', 'now') as integer))`),
});
