import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, tinyint, bigint, foreignKey } from "drizzle-orm/mysql-core";

// ─── Users (Auth) ───
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Vendedores ───
export const vendedores = mysqlTable("vendedores", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 30 }),
  senha: varchar("senha", { length: 255 }).notNull(),
  perfil: mysqlEnum("perfil", ["ADMIN", "VENDEDOR"]).default("VENDEDOR").notNull(),
  ativo: int("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vendedor = typeof vendedores.$inferSelect;
export type InsertVendedor = typeof vendedores.$inferInsert;

// ─── Clientes ───
export const clientes = mysqlTable("clientes", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 30 }),
  whatsapp: varchar("whatsapp", { length: 30 }),
  email: varchar("email", { length: 320 }),
  endereco: text("endereco"),
  bloqueado: int("bloqueado").default(0).notNull(),
  motivoBloqueio: text("motivoBloqueio"),
  bloqueadoEm: timestamp("bloqueadoEm"),
  bloqueadoPor: varchar("bloqueadoPor", { length: 255 }),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

// ─── Telefones de Clientes Bloqueados ───
export const telefonesClientesBloqueados = mysqlTable("telefones_clientes_bloqueados", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull(),
  telefone: varchar("telefone", { length: 30 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TelefoneClienteBloqueado = typeof telefonesClientesBloqueados.$inferSelect;
export type InsertTelefoneClienteBloqueado = typeof telefonesClientesBloqueados.$inferInsert;

// ─── Produtos ───
export const produtos = mysqlTable("produtos", {
  id: int("id").autoincrement().primaryKey(),
  descricao: varchar("descricao", { length: 255 }).notNull(),
  custo: decimal("custo", { precision: 12, scale: 2 }).default("0.00").notNull(),
  fatorConversao: decimal("fatorConversao", { precision: 12, scale: 4 }).default("1.0000").notNull(),
  preco: decimal("preco", { precision: 12, scale: 2 }).default("0.00").notNull(),
  codigoExterno: varchar("codigoExterno", { length: 100 }),
  ativo: int("ativo").default(1).notNull(),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Produto = typeof produtos.$inferSelect;
export type InsertProduto = typeof produtos.$inferInsert;

// ─── Vendas ───
export const vendas = mysqlTable("vendas", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId"),
  clienteNome: varchar("clienteNome", { length: 255 }),
  vendedorId: int("vendedorId"),
  vendedorNome: varchar("vendedorNome", { length: 255 }),
  data: varchar("data", { length: 10 }).notNull(),
  status: mysqlEnum("status", ["AGUARDANDO", "APROVADO", "CANCELADO", "EXPIRADO"]).default("AGUARDANDO").notNull(),
  vencimento: varchar("vencimento", { length: 10 }),
  shareToken: varchar("shareToken", { length: 64 }),
  logistica: varchar("logistica", { length: 100 }),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  frete: decimal("frete", { precision: 10, scale: 2 }).default("0.00").notNull(),
  telefoneCliente: varchar("telefoneCliente", { length: 30 }),
  dataEntrega: varchar("dataEntrega", { length: 10 }),
  horaEntrega: varchar("horaEntrega", { length: 5 }),
  observacaoPedido: text("observacaoPedido"),
  conferido: int("conferido").default(0).notNull(),
  conferidoPor: varchar("conferidoPor", { length: 255 }),
  conferidoEm: timestamp("conferidoEm"),
  conferido2: int("conferido2").default(0).notNull(),
  conferidoPor2: varchar("conferidoPor2", { length: 255 }),
  conferidoEm2: timestamp("conferidoEm2"),
  faturado: int("faturado").default(0).notNull(),
  faturadoPor: varchar("faturadoPor", { length: 255 }),
  faturadoEm: timestamp("faturadoEm"),
   deletedAt: timestamp("deletedAt"),
  origem: varchar("origem", { length: 50 }).default("MANUAL"),
  qrCodeToken: varchar("qrCodeToken", { length: 64 }).unique(),
  numeroSequencial: int("numeroSequencial"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Venda = typeof vendas.$inferSelect;
export type InsertVenda = typeof vendas.$inferInsert;

// ─── Venda Itens ───
export const vendaItens = mysqlTable("venda_itens", {
  id: int("id").autoincrement().primaryKey(),
  vendaId: int("vendaId").notNull(),
  produtoId: int("produtoId"),
  produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
  quantidade: decimal("quantidade", { precision: 12, scale: 2 }).default("0").notNull(),
  valorUnitario: decimal("valorUnitario", { precision: 12, scale: 2 }).default("0.00").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
  observacao: text("observacao"),
  qtdConferida: decimal("qtdConferida", { precision: 12, scale: 2 }),
  qtdConferida2: decimal("qtdConferida2", { precision: 12, scale: 2 }),
  ordem: int("ordem").default(0).notNull(),
});

export type VendaItem = typeof vendaItens.$inferSelect;
export type InsertVendaItem = typeof vendaItens.$inferInsert;

// ─── Compras ───
export const compras = mysqlTable("compras", {
  id: int("id").autoincrement().primaryKey(),
  fornecedor: varchar("fornecedor", { length: 255 }),
  numNF: varchar("numNF", { length: 100 }),
  data: varchar("data", { length: 10 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  origem: varchar("origem", { length: 50 }).default("MANUAL"),
  status: mysqlEnum("status", ["RASCUNHO", "CONFIRMADO"]).default("CONFIRMADO").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Compra = typeof compras.$inferSelect;
export type InsertCompra = typeof compras.$inferInsert;

// ─── Compra Itens ───
export const compraItens = mysqlTable("compra_itens", {
  id: int("id").autoincrement().primaryKey(),
  compraId: int("compraId").notNull(),
  produtoId: int("produtoId"),
  produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
  quantidade: decimal("quantidade", { precision: 12, scale: 2 }).default("0").notNull(),
  valorUnitario: decimal("valorUnitario", { precision: 12, scale: 2 }).default("0.00").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
  transacaoGfp: varchar("transacaoGfp", { length: 50 }),
  isDuplicado: tinyint("isDuplicado").default(0),
});

export type CompraItem = typeof compraItens.$inferSelect;
export type InsertCompraItem = typeof compraItens.$inferInsert;

// ─── Acompanhamento de Compras ───
export const acompanhamentoCompras = mysqlTable("acompanhamento_compras", {
  id: int("id").autoincrement().primaryKey(),
  compraItemId: int("compraItemId").notNull(),
  compraId: int("compraId").notNull(),
  produtoId: int("produtoId"),
  produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
  quantidadePedida: decimal("quantidadePedida", { precision: 12, scale: 2 }).default("0").notNull(),
  quantidadeComprada: decimal("quantidadeComprada", { precision: 12, scale: 2 }).default("0").notNull(),
  quantidadeRestante: decimal("quantidadeRestante", { precision: 12, scale: 2 }).default("0").notNull(),
  quantidadeExcedente: decimal("quantidadeExcedente", { precision: 12, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["PENDENTE", "PARCIAL", "COMPLETO", "EXCEDENTE"]).default("PENDENTE").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AcompanhamentoCompra = typeof acompanhamentoCompras.$inferSelect;
export type InsertAcompanhamentoCompra = typeof acompanhamentoCompras.$inferInsert;

// ─── Ajustes de Estoque ───
export const estoqueAjustes = mysqlTable("estoque_ajustes", {
  id: int("id").autoincrement().primaryKey(),
  produtoId: int("produtoId").notNull(),
  produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
  quantidade: decimal("quantidade", { precision: 12, scale: 2 }).default("0").notNull(),
  motivo: text("motivo"),
  usuarioNome: varchar("usuarioNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EstoqueAjuste = typeof estoqueAjustes.$inferSelect;
export type InsertEstoqueAjuste = typeof estoqueAjustes.$inferInsert;

// ─── Histórico de Alterações ───
export const historicoAlteracoes = mysqlTable("historico_alteracoes", {
  id: int("id").autoincrement().primaryKey(),
  tabela: varchar("tabela", { length: 50 }).notNull(),
  registroId: int("registroId").notNull(),
  campo: varchar("campo", { length: 100 }).notNull(),
  valorAntigo: text("valorAntigo"),
  valorNovo: text("valorNovo"),
  usuarioNome: varchar("usuarioNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HistoricoAlteracao = typeof historicoAlteracoes.$inferSelect;
export type InsertHistoricoAlteracao = typeof historicoAlteracoes.$inferInsert;

// ─── Venda Links (Compartilhamento) ───
export const vendaLinks = mysqlTable("venda_links", {
  id: int("id").autoincrement().primaryKey(),
  vendaId: int("vendaId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdBy: varchar("createdBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VendaLink = typeof vendaLinks.$inferSelect;
export type InsertVendaLink = typeof vendaLinks.$inferInsert;

// ─── Backups ───
export const backups = mysqlTable("backups", {
  id: int("id").autoincrement().primaryKey(),
  nomeArquivo: varchar("nomeArquivo", { length: 255 }).notNull(),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  s3Url: text("s3Url"),
  tamanho: int("tamanho"),
  usuarioNome: varchar("usuarioNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = typeof backups.$inferInsert;

// ─── Tabela de Preços (Margens por entrada) ───
export const tabelaPrecos = mysqlTable("tabela_precos", {
  id: int("id").autoincrement().primaryKey(),
  compraItemId: int("compraItemId").notNull(),
  compraId: int("compraId").notNull(),
  produtoId: int("produtoId"),
  produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
  custoUnitario: decimal("custoUnitario", { precision: 12, scale: 2 }).default("0.00").notNull(),
  margem1: decimal("margem1", { precision: 8, scale: 2 }).default("0.00").notNull(),
  preco1: decimal("preco1", { precision: 12, scale: 2 }).default("0.00").notNull(),
  margem2: decimal("margem2", { precision: 8, scale: 2 }).default("0.00").notNull(),
  preco2: decimal("preco2", { precision: 12, scale: 2 }).default("0.00").notNull(),
  margem3: decimal("margem3", { precision: 8, scale: 2 }).default("0.00").notNull(),
  preco3: decimal("preco3", { precision: 12, scale: 2 }).default("0.00").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TabelaPreco = typeof tabelaPrecos.$inferSelect;
export type InsertTabelaPreco = typeof tabelaPrecos.$inferInsert;

// ─── Formas de Pagamento ───
export const formasPagamento = mysqlTable("formas_pagamento", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull().unique(),
  descricao: text("descricao"),
  ativo: int("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FormaPagamento = typeof formasPagamento.$inferSelect;
export type InsertFormaPagamento = typeof formasPagamento.$inferInsert;

// ─── Títulos (Faturas) ───
export const titulos = mysqlTable("titulos", {
  id: int("id").autoincrement().primaryKey(),
  vendaId: int("vendaId").notNull(),
  clienteId: int("clienteId").notNull(),
  clienteNome: varchar("clienteNome", { length: 255 }).notNull(),
  formaPagamentoId: int("formaPagamentoId"),
  formaPagamentoNome: varchar("formaPagamentoNome", { length: 100 }),
  valor: decimal("valor", { precision: 12, scale: 2 }).notNull(),
  dataEmissao: timestamp("dataEmissao").defaultNow().notNull(),
  dataVencimento: timestamp("dataVencimento").notNull(),
  dataPagamento: timestamp("dataPagamento"),
  status: mysqlEnum("status", ["PENDENTE", "PAGO", "VENCIDO", "CANCELADO"]).default("PENDENTE").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Titulo = typeof titulos.$inferSelect;
export type InsertTitulo = typeof titulos.$inferInsert;

// ─── Pedidos de Compra ───
export const pedidosCompra = mysqlTable("pedidos_compra", {
  id: int("id").autoincrement().primaryKey(),
  numero: int("numero").notNull(),
  data: varchar("data", { length: 10 }).notNull(),
  solicitante: varchar("solicitante", { length: 255 }).notNull(),
  observacoes: text("observacoes"),
  status: mysqlEnum("status", ["ABERTO", "APROVADO", "FINALIZADO", "CANCELADO"]).default("ABERTO").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  orcamentosOrigemIds: text("orcamentosOrigemIds"), // JSON array de IDs dos orçamentos mesclados
});

export type PedidoCompra = typeof pedidosCompra.$inferSelect;
export type InsertPedidoCompra = typeof pedidosCompra.$inferInsert;

// Helper para parsear IDs de orçamentos
export function parseOrcamentosOrigemIds(orcamentosOrigemIds: string | null): number[] {
  if (!orcamentosOrigemIds) return [];
  try {
    return JSON.parse(orcamentosOrigemIds);
  } catch {
    return [];
  }
}

// ─── Pedido de Compra Itens ───
export const pedidoCompraItens = mysqlTable("pedido_compra_itens", {
  id: int("id").autoincrement().primaryKey(),
  pedidoCompraId: int("pedidoCompraId").notNull(),
  produtoId: int("produtoId"),
  produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
  quantidade: decimal("quantidade", { precision: 12, scale: 2 }).default("0").notNull(),
  precoVenda: decimal("precoVenda", { precision: 12, scale: 2 }).default("0.00").notNull(),
  subtotalVenda: decimal("subtotalVenda", { precision: 12, scale: 2 }).default("0.00").notNull(),
  vendaOrigemId: int("vendaOrigemId"),
  observacao: text("observacao"),
});

export type PedidoCompraItem = typeof pedidoCompraItens.$inferSelect;
export type InsertPedidoCompraItem = typeof pedidoCompraItens.$inferInsert;

// ─── Cooperflora - Configuração ───
export const cooperfloraConfig = mysqlTable("cooperflora_config", {
  id: int("id").autoincrement().primaryKey(),
  login: varchar("login", { length: 100 }).notNull().default(""),
  senha: varchar("senha", { length: 255 }).notNull().default(""),
  chave: varchar("chave", { length: 20 }).notNull().default("62002"),
  rota: varchar("rota", { length: 20 }).notNull().default("463"),
  localEntrega: varchar("localEntrega", { length: 255 }).notNull().default("TRIANGULO MINEIRO - MG - BROKER"),
  margemPadrao: decimal("margemPadrao", { precision: 5, scale: 2 }).notNull().default("30.00"),
  dataCarregamento: varchar("dataCarregamento", { length: 10 }).notNull().default(""),
  ultimaAtualizacao: timestamp("ultimaAtualizacao"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CooperfloraConfig = typeof cooperfloraConfig.$inferSelect;
export type InsertCooperfloraConfig = typeof cooperfloraConfig.$inferInsert;

// ─── Cooperflora - Produtos ───
export const cooperfloraProdutos = mysqlTable("cooperflora_produtos", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 30 }).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  precoMin: decimal("precoMin", { precision: 12, scale: 4 }).notNull().default("0"),
  precoMax: decimal("precoMax", { precision: 12, scale: 4 }).notNull().default("0"),
  qualidade: varchar("qualidade", { length: 10 }).notNull().default(""),
  estoque: int("estoque").notNull().default(0),
  grupo: varchar("grupo", { length: 100 }).notNull().default(""),
  imagemUrl: text("imagemUrl"),
  dataCarregamento: varchar("dataCarregamento", { length: 10 }).notNull().default(""),
  margemCustom: decimal("margemCustom", { precision: 5, scale: 2 }),
  hastes: int("hastes").default(1).notNull(),
  hastesEmbalagem: int("hastesEmbalagem").default(1).notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});
export type CooperfloraProduto = typeof cooperfloraProdutos.$inferSelect;
export type InsertCooperfloraProduto = typeof cooperfloraProdutos.$inferInsert;

// ─── Cooperflora - Margens por Departamento (Grupo) ───
export const cooperfloraMargensDepartamento = mysqlTable("cooperflora_margens_departamento", {
  id: int("id").autoincrement().primaryKey(),
  grupo: varchar("grupo", { length: 100 }).notNull().unique(),
  margem: decimal("margem", { precision: 5, scale: 2 }).notNull().default("30.00"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CooperfloraMargemDepartamento = typeof cooperfloraMargensDepartamento.$inferSelect;
export type InsertCooperfloraMargemDepartamento = typeof cooperfloraMargensDepartamento.$inferInsert;

// ─── Cooperflora - Pendente de Revisão (diff de sync) ───
export const cooperfloraSyncPendente = mysqlTable("cooperflora_sync_pendente", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 30 }).notNull(),
  acao: mysqlEnum("acao", ["CRIAR", "ATUALIZAR", "REMOVER"]).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  qualidade: varchar("qualidade", { length: 10 }).notNull().default(""),
  grupo: varchar("grupo", { length: 100 }).notNull().default(""),
  custoNovo: decimal("custoNovo", { precision: 12, scale: 4 }).notNull().default("0"),
  precoNovo: decimal("precoNovo", { precision: 12, scale: 2 }).notNull().default("0"),
  custoAnterior: decimal("custoAnterior", { precision: 12, scale: 4 }),
  precoAnterior: decimal("precoAnterior", { precision: 12, scale: 2 }),
  estoqueNovo: int("estoqueNovo").notNull().default(0),
  estoqueAnterior: int("estoqueAnterior"),
  hastes: int("hastes").notNull().default(1),
  imagemUrl: text("imagemUrl"),
  produtoErpId: int("produtoErpId"),
  aprovado: int("aprovado").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CooperfloraSyncPendente = typeof cooperfloraSyncPendente.$inferSelect;
export type InsertCooperfloraSyncPendente = typeof cooperfloraSyncPendente.$inferInsert;

// ─── Veiling - Configurações ───
export const veilingConfig = mysqlTable("veiling_config", {
  id: int("id").autoincrement().primaryKey(),
  usuario: varchar("usuario", { length: 320 }).notNull().default(""),
  senha: varchar("senha", { length: 255 }).notNull().default(""),
  customerId: varchar("customerId", { length: 20 }).notNull().default("987"),
  customerIdPedidos: varchar("customerIdPedidos", { length: 20 }).notNull().default("5191"),
  margemGlobal: decimal("margemGlobal", { precision: 5, scale: 2 }).notNull().default("30.00"),
  dataCarregamento: varchar("dataCarregamento", { length: 10 }).notNull().default(""),
  ultimaAtualizacao: timestamp("ultimaAtualizacao"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VeilingConfig = typeof veilingConfig.$inferSelect;
export type InsertVeilingConfig = typeof veilingConfig.$inferInsert;

// ─── Veiling - Produtos (Ofertas) ───
export const veilingProdutos = mysqlTable("veiling_produtos", {
  id: int("id").autoincrement().primaryKey(),
  offerId: int("offerId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  nomeCompleto: varchar("nomeCompleto", { length: 255 }).notNull().default(""),
  categoria: varchar("categoria", { length: 100 }).notNull().default(""),
  categoriaId: int("categoriaId").notNull().default(0),
  produtor: varchar("produtor", { length: 255 }).notNull().default(""),
  qualidade: varchar("qualidade", { length: 20 }).notNull().default(""),
  dimensao: varchar("dimensao", { length: 50 }).notNull().default(""),
  embalagem: varchar("embalagem", { length: 100 }).notNull().default(""),
  precoCarrinho: decimal("precoCarrinho", { precision: 12, scale: 2 }),
  precoCamada: decimal("precoCamada", { precision: 12, scale: 2 }),
  precoEmbalagem: decimal("precoEmbalagem", { precision: 12, scale: 2 }),
  estoqueDisponivel: int("estoqueDisponivel").notNull().default(0),
  tipoOferta: varchar("tipoOferta", { length: 50 }).notNull().default(""),
  dataValidade: varchar("dataValidade", { length: 30 }),
  imagemUrl: text("imagemUrl"),
  imagemUrlCache: text("imagemUrlCache"),
  frete: decimal("frete", { precision: 10, scale: 2 }),
  multiplo: int("multiplo").notNull().default(1),
  compraMinima: int("compraMinima").notNull().default(1),
  packingId: int("packingId").default(0),
  gfpQualidade: varchar("gfpQualidade", { length: 10 }).default(""),
  gfpNumero: varchar("gfpNumero", { length: 50 }).default(""),
  gfpObs1: text("gfpObs1"),
  gfpObs2: text("gfpObs2"),
  gfpEntregaCvh: varchar("gfpEntregaCvh", { length: 20 }).default(""),
  gfpSerie: varchar("gfpSerie", { length: 50 }).default(""),
  gfpLote: varchar("gfpLote", { length: 50 }).default(""),
  cor: varchar("cor", { length: 100 }).default(""),
  statusProduto: varchar("statusProduto", { length: 50 }).default(""),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VeilingProduto = typeof veilingProdutos.$inferSelect;
export type InsertVeilingProduto = typeof veilingProdutos.$inferInsert;

// ─── Veiling - Margens por Departamento ───
export const veilingMargensDepartamento = mysqlTable("veiling_margens_departamento", {
  id: int("id").autoincrement().primaryKey(),
  categoria: varchar("categoria", { length: 100 }).notNull().unique(),
  margem: decimal("margem", { precision: 5, scale: 2 }).notNull().default("30.00"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VeilingMargemDepartamento = typeof veilingMargensDepartamento.$inferSelect;
export type InsertVeilingMargemDepartamento = typeof veilingMargensDepartamento.$inferInsert;

// ─── Produtos da Loja (Cadastro Manual) ───
export const produtosLoja = mysqlTable("produtos_loja", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  unidade: varchar("unidade", { length: 20 }).notNull().default("UN"),
  departamento: varchar("departamento", { length: 100 }).notNull().default(""),
  preco: decimal("preco", { precision: 12, scale: 2 }).notNull().default("0.00"),
  precoCusto: decimal("precoCusto", { precision: 12, scale: 2 }),
  estoque: decimal("estoque", { precision: 12, scale: 3 }).notNull().default("0.000"),
  ativo: int("ativo").notNull().default(1),
  imagemUrl: text("imagemUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProdutoLoja = typeof produtosLoja.$inferSelect;
export type InsertProdutoLoja = typeof produtosLoja.$inferInsert;

// ─── Veiling - Tabela de Conversão Unidade→Pacote ───
export const veilingConversao = mysqlTable("veiling_conversao", {
  id: int("id").autoincrement().primaryKey(),
  codItem: varchar("codItem", { length: 50 }).notNull(),
  descCurta: varchar("descCurta", { length: 255 }).notNull().default(""),
  descLonga: varchar("descLonga", { length: 255 }).notNull().default(""),
  qtdVenda: int("qtdVenda").notNull().default(1),
  fotoUrl: text("fotoUrl"),
  qualidade: varchar("qualidade", { length: 10 }).default(""),
  observacao: text("observacao"),
  numGfp: varchar("numGfp", { length: 50 }).default(""),
  icms: decimal("icms", { precision: 5, scale: 4 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VeilingConversao = typeof veilingConversao.$inferSelect;
export type InsertVeilingConversao = typeof veilingConversao.$inferInsert;

// ─── Histórico de Sincronizações ───
export const syncHistorico = mysqlTable("sync_historico", {
  id: int("id").autoincrement().primaryKey(),
  fonte: mysqlEnum("fonte", ["COOPERFLORA", "VEILING"]).notNull(),
  status: mysqlEnum("status", ["SUCESSO", "FALHA"]).notNull(),
  total: int("total").notNull().default(0),
  mensagem: text("mensagem"),
  duracaoMs: int("duracaoMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SyncHistorico = typeof syncHistorico.$inferSelect;
export type InsertSyncHistorico = typeof syncHistorico.$inferInsert;

// ─── Catálogos de Venda ───
export const catalogosVenda = mysqlTable("catalogos_venda", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  ativo: int("ativo").default(1).notNull(),
  criadoPor: varchar("criadoPor", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CatalogoVenda = typeof catalogosVenda.$inferSelect;
export type InsertCatalogoVenda = typeof catalogosVenda.$inferInsert;

// ─── Itens dos Catálogos de Venda ───
export const catalogosVendaItens = mysqlTable("catalogos_venda_itens", {
  id: int("id").autoincrement().primaryKey(),
  catalogoId: int("catalogoId").notNull(),
  // Tipo de origem: 'cooperflora' | 'veiling' | 'loja'
  origem: mysqlEnum("origem", ["cooperflora", "veiling", "loja"]).notNull(),
  // ID do produto na tabela de origem
  produtoId: varchar("produtoId", { length: 100 }).notNull(),
  // Snapshot do produto no momento da adição
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  preco: decimal("preco", { precision: 10, scale: 2 }),
  imagemUrl: text("imagemUrl"),
  unidade: varchar("unidade", { length: 50 }),
  ordem: int("ordem").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CatalogoVendaItem = typeof catalogosVendaItens.$inferSelect;
export type InsertCatalogoVendaItem = typeof catalogosVendaItens.$inferInsert;

// ─── Pedidos dos Catálogos de Venda (enviados por clientes) ───
export const catalogosPedidos = mysqlTable("catalogos_pedidos", {
  id: int("id").autoincrement().primaryKey(),
  catalogoId: int("catalogoId").notNull(),
  // Dados do cliente (obrigatórios)
  clienteNome: varchar("clienteNome", { length: 255 }).notNull(),
  clienteTelefone: varchar("clienteTelefone", { length: 30 }).notNull(),
  dataEntrega: varchar("dataEntrega", { length: 10 }).notNull(), // dd/MM/yyyy
  observacao: text("observacao"),
  status: mysqlEnum("status", ["NOVO", "VISTO", "APROVADO", "CANCELADO", "RECUSADO"]).default("NOVO").notNull(),
  motivoRecusa: text("motivoRecusa"),
  vendaId: int("vendaId"), // preenchido quando convertido em venda
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CatalogoPedido = typeof catalogosPedidos.$inferSelect;
export type InsertCatalogoPedido = typeof catalogosPedidos.$inferInsert;

// ─── Itens dos Pedidos dos Catálogos ───
export const catalogosPedidosItens = mysqlTable("catalogos_pedidos_itens", {
  id: int("id").autoincrement().primaryKey(),
  pedidoId: int("pedidoId").notNull(),
  catalogoItemId: int("catalogoItemId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  preco: decimal("preco", { precision: 10, scale: 2 }),
  quantidade: int("quantidade").notNull().default(1),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
});
export type CatalogoPedidoItem = typeof catalogosPedidosItens.$inferSelect;
export type InsertCatalogoPedidoItem = typeof catalogosPedidosItens.$inferInsert;

// ─── Movimentações de Estoque (Ajustes Manuais) ───
export const estoqueMovimentacoes = mysqlTable("estoque_movimentacoes", {
  id: int("id").autoincrement().primaryKey(),
  produtoId: int("produtoId").notNull(),
  tipo: mysqlEnum("tipo", ["ENTRADA", "SAIDA", "AJUSTE"]).notNull(),
  quantidade: decimal("quantidade", { precision: 12, scale: 3 }).notNull(),
  estoqueAntes: decimal("estoqueAntes", { precision: 12, scale: 3 }).notNull().default("0.000"),
  estoqueDepois: decimal("estoqueDepois", { precision: 12, scale: 3 }).notNull().default("0.000"),
  justificativa: text("justificativa").notNull(),
  usuarioNome: varchar("usuarioNome", { length: 255 }).notNull().default(""),
  usuarioId: varchar("usuarioId", { length: 100 }).default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EstoqueMovimentacao = typeof estoqueMovimentacoes.$inferSelect;
export type InsertEstoqueMovimentacao = typeof estoqueMovimentacoes.$inferInsert;

// ─── Veiling - Histórico de Importações Automáticas ───
export const veilingImportacoes = mysqlTable("veiling_importacoes", {
  id: int("id").autoincrement().primaryKey(),
  dataImportacao: timestamp("dataImportacao").defaultNow().notNull(),
  dataPedidos: varchar("dataPedidos", { length: 10 }).notNull(), // YYYY-MM-DD
  totalItens: int("totalItens").notNull().default(0),
  totalPedidos: int("totalPedidos").notNull().default(0),
  compraId: int("compraId"),
  status: mysqlEnum("status", ["SUCESSO", "ERRO", "PARCIAL"]).notNull().default("SUCESSO"),
  mensagem: text("mensagem"),
  origem: mysqlEnum("origem", ["AUTOMATICO", "MANUAL"]).notNull().default("AUTOMATICO"),
});
export type VeilingImportacao = typeof veilingImportacoes.$inferSelect;
export type InsertVeilingImportacao = typeof veilingImportacoes.$inferInsert;

// ─── Configurações do Sistema ───
export const appConfig = mysqlTable("app_config", {
  id: int("id").autoincrement().primaryKey(),
  chave: varchar("chave", { length: 100 }).notNull().unique(),
  valor: text("valor").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AppConfig = typeof appConfig.$inferSelect;
export type InsertAppConfig = typeof appConfig.$inferInsert;

// ─── Lembretes ───
export const lembretes = mysqlTable("lembretes", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 100 }).notNull(),        // openId do usuário
  userName: varchar("userName", { length: 255 }),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  dataHora: bigint("dataHora", { mode: "number" }).notNull(),  // UTC ms timestamp
  recorrencia: mysqlEnum("recorrencia", ["NENHUMA", "DIARIA", "SEMANAL", "MENSAL"]).default("NENHUMA").notNull(),
  status: mysqlEnum("status", ["PENDENTE", "DISPARADO", "LIDO", "CANCELADO"]).default("PENDENTE").notNull(),
  prioridade: mysqlEnum("prioridade", ["BAIXA", "MEDIA", "ALTA"]).default("MEDIA").notNull(),
  notificadoEm: bigint("notificadoEm", { mode: "number" }),    // quando foi disparado
  vinculoOrcamentoId: int("vinculoOrcamentoId"),               // id da venda/orçamento vinculado
  vinculoOrcamentoNum: varchar("vinculoOrcamentoNum", { length: 50 }), // número legível ex: #630003
  vinculoClienteNome: varchar("vinculoClienteNome", { length: 255 }), // nome do cliente vinculado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Lembrete = typeof lembretes.$inferSelect;
export type InsertLembrete = typeof lembretes.$inferInsert;

// ─── Vendas Efetivas (conversão de orçamentos) ───
export const vendasEfetivas = mysqlTable("vendas_efetivas", {
  id: int("id").autoincrement().primaryKey(),
  orcamentoId: int("orcamentoId").notNull(),          // id da venda/orçamento de origem
  orcamentoNum: varchar("orcamentoNum", { length: 50 }), // número legível ex: #630003
  clienteId: int("clienteId"),
  clienteNome: varchar("clienteNome", { length: 255 }),
  vendedorId: int("vendedorId"),
  vendedorNome: varchar("vendedorNome", { length: 255 }),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  dataVenda: varchar("dataVenda", { length: 10 }).notNull(),   // data da conversão
  dataEntrega: varchar("dataEntrega", { length: 10 }),          // data de entrega efetiva
  formaPagamento: varchar("formaPagamento", { length: 100 }),
  observacao: text("observacao"),
  status: mysqlEnum("status", ["PENDENTE", "ENTREGUE", "CANCELADA"]).default("PENDENTE").notNull(),
  convertidoPor: varchar("convertidoPor", { length: 255 }),    // nome do usuário que converteu
  itensSnapshot: json("itensSnapshot").$type<Array<{ produtoNome: string; quantidade: number; valorUnitario: number; subtotal: number; observacao?: string }>>(), // snapshot dos itens no momento da conversão
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VendaEfetiva = typeof vendasEfetivas.$inferSelect;
export type InsertVendaEfetiva = typeof vendasEfetivas.$inferInsert;

// ─── Controle de Caixa ───
export const caixas = mysqlTable("caixas", {
  id: int("id").autoincrement().primaryKey(),
  data: varchar("data", { length: 10 }).notNull(),              // YYYY-MM-DD
  saldoInicial: decimal("saldoInicial", { precision: 12, scale: 2 }).default("0.00").notNull(),
  saldoFinal: decimal("saldoFinal", { precision: 12, scale: 2 }),
  totalEntradas: decimal("totalEntradas", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalSaidas: decimal("totalSaidas", { precision: 12, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["ABERTO", "FECHADO"]).default("ABERTO").notNull(),
  abertoPor: varchar("abertoPor", { length: 255 }),
  fechadoPor: varchar("fechadoPor", { length: 255 }),
  fechadoEm: timestamp("fechadoEm"),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Caixa = typeof caixas.$inferSelect;
export type InsertCaixa = typeof caixas.$inferInsert;

export const caixaMovimentos = mysqlTable("caixa_movimentos", {
  id: int("id").autoincrement().primaryKey(),
  caixaId: int("caixaId").notNull(),
  tipo: mysqlEnum("tipo", ["ENTRADA", "SAIDA"]).notNull(),
  categoria: varchar("categoria", { length: 100 }).notNull(),   // ex: Venda, Despesa, Sangria, Suprimento
  descricao: varchar("descricao", { length: 500 }),
  valor: decimal("valor", { precision: 12, scale: 2 }).notNull(),
  formaPagamento: varchar("formaPagamento", { length: 100 }),
  vendaId: int("vendaId"),                                       // vínculo opcional com venda
  vendaNum: varchar("vendaNum", { length: 50 }),
  lancadoPor: varchar("lancadoPor", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CaixaMovimento = typeof caixaMovimentos.$inferSelect;
export type InsertCaixaMovimento = typeof caixaMovimentos.$inferInsert;

// ─── Anotações por Usuário ───────────────────────────────────────────────────
export const anotacoes = mysqlTable("anotacoes", {
  // ativa: 1 = ativa, 0 = inativa (desativada pelo usuário)
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),          // openId do usuário
  titulo: varchar("titulo", { length: 255 }).notNull().default("Nova anotação"),
  conteudo: text("conteudo").notNull().default(""),
  cor: varchar("cor", { length: 20 }).notNull().default("yellow"), // yellow | blue | green | pink | purple
  fixada: tinyint("fixada").notNull().default(0),
  ativa: tinyint("ativa").notNull().default(1),  // 1 = ativa, 0 = desativada
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Anotacao = typeof anotacoes.$inferSelect;
export type InsertAnotacao = typeof anotacoes.$inferInsert;

// ─── Relatórios Compartilhados (links públicos) ───────────────────────────────
export const relatoriosCompartilhados = mysqlTable("relatorios_compartilhados", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  clienteId: int("clienteId").notNull(),
  filtros: text("filtros"),                                    // JSON com filtros aplicados
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RelatorioCompartilhado = typeof relatoriosCompartilhados.$inferSelect;
export type InsertRelatorioCompartilhado = typeof relatoriosCompartilhados.$inferInsert;


// ─── Links de Catálogo Veiling Público ──────────────────────────────────────
export const veilingCatalogoLinks = mysqlTable("veiling_catalogo_links", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdBy: varchar("createdBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  // Filtros ativos no momento da geração do link
  filtroCategoria: varchar("filtroCategoria", { length: 100 }).default(""),
  filtroProdutor: varchar("filtroProdutor", { length: 255 }).default(""),
  filtroCor: varchar("filtroCor", { length: 100 }).default(""),
  filtroBusca: varchar("filtroBusca", { length: 255 }).default(""),
});

export type VeilingCatalogoLink = typeof veilingCatalogoLinks.$inferSelect;
export type InsertVeilingCatalogoLink = typeof veilingCatalogoLinks.$inferInsert;


// ─── Pedidos Públicos do Catálogo Veiling ──────────────────────────────────────
export const pedidosPublicos = mysqlTable("pedidos_publicos", {
  id: int("id").autoincrement().primaryKey(),
  linkToken: varchar("linkToken", { length: 64 }).notNull(),
  clienteNome: varchar("clienteNome", { length: 255 }).notNull(),
  clienteEmail: varchar("clienteEmail", { length: 320 }).notNull(),
  clienteTelefone: varchar("clienteTelefone", { length: 30 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["PENDENTE", "CONFIRMADO", "CONVERTIDO", "CANCELADO"]).default("PENDENTE").notNull(),
  observacoes: text("observacoes"),
  vendaId: int("vendaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PedidoPublico = typeof pedidosPublicos.$inferSelect;
export type InsertPedidoPublico = typeof pedidosPublicos.$inferInsert;

// ─── Itens de Pedidos Públicos ──────────────────────────────────────
export const pedidosPublicosItens = mysqlTable("pedidos_publicos_itens", {
  id: int("id").autoincrement().primaryKey(),
  pedidoPublicoId: int("pedidoPublicoId").notNull(),
  produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
  quantidade: decimal("quantidade", { precision: 10, scale: 2 }).notNull(),
  valorUnitario: decimal("valorUnitario", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PedidoPublicoItem = typeof pedidosPublicosItens.$inferSelect;
export type InsertPedidoPublicoItem = typeof pedidosPublicosItens.$inferInsert;

// ─── Filtros Salvos do Catálogo Veiling ──────────────────────────────────────
export const veilingFiltrosSalvos = mysqlTable("veiling_filtros_salvos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  categoria: varchar("categoria", { length: 255 }),
  produtor: varchar("produtor", { length: 255 }),
  cor: varchar("cor", { length: 255 }),
  busca: varchar("busca", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VeilingFiltroSalvo = typeof veilingFiltrosSalvos.$inferSelect;
export type InsertVeilingFiltroSalvo = typeof veilingFiltrosSalvos.$inferInsert;


// ─── Integração Bling ERP ───
export const blingConfig = mysqlTable("bling_config", {
  id: int("id").autoincrement().primaryKey(),
  apiKey: varchar("apiKey", { length: 500 }).notNull(), // Token de autenticação do Bling
  isActive: int("isActive").default(1).notNull(), // 1 = ativo, 0 = inativo
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BlingConfig = typeof blingConfig.$inferSelect;
export type InsertBlingConfig = typeof blingConfig.$inferInsert;

// Log de sincronizações
export const blingSync = mysqlTable("bling_sync", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // "pedido", "produto", "estoque"
  direction: varchar("direction", { length: 50 }).notNull(), // "garden_to_bling" ou "bling_to_garden"
  sourceId: varchar("sourceId", { length: 255 }).notNull(), // ID do pedido/produto no Garden
  blingId: varchar("blingId", { length: 255 }), // ID retornado pelo Bling
  status: varchar("status", { length: 50 }).notNull(), // "pending", "success", "failed", "retry"
  errorMessage: text("errorMessage"), // Mensagem de erro se falhar
  retryCount: int("retryCount").default(0),
  maxRetries: int("maxRetries").default(3),
  lastRetryAt: timestamp("lastRetryAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BlingSync = typeof blingSync.$inferSelect;
export type InsertBlingSync = typeof blingSync.$inferInsert;

// Mapeamento de pedidos Garden → Bling
export const blingPedidoMapping = mysqlTable("bling_pedido_mapping", {
  id: int("id").autoincrement().primaryKey(),
  gardenPedidoId: varchar("gardenPedidoId", { length: 255 }).notNull().unique(), // ID do pedido no Garden
  blingPedidoId: varchar("blingPedidoId", { length: 255 }).notNull(), // ID do pedido no Bling
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BlingPedidoMapping = typeof blingPedidoMapping.$inferSelect;
export type InsertBlingPedidoMapping = typeof blingPedidoMapping.$inferInsert;

// Mapeamento de produtos Garden → Bling
export const blingProdutoMapping = mysqlTable("bling_produto_mapping", {
  id: int("id").autoincrement().primaryKey(),
  gardenProdutoId: varchar("gardenProdutoId", { length: 255 }).notNull().unique(),
  blingProdutoId: varchar("blingProdutoId", { length: 255 }).notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BlingProdutoMapping = typeof blingProdutoMapping.$inferSelect;
export type InsertBlingProdutoMapping = typeof blingProdutoMapping.$inferInsert;

// Histórico de sincronizações (para auditoria)
export const blingSyncHistory = mysqlTable("bling_sync_history", {
  id: int("id").autoincrement().primaryKey(),
  syncId: int("syncId").notNull(), // FK para bling_sync
  action: varchar("action", { length: 50 }).notNull(), // "created", "updated", "deleted", "retry"
  details: text("details"), // JSON com detalhes da ação
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BlingSyncHistory = typeof blingSyncHistory.$inferSelect;
export type InsertBlingSyncHistory = typeof blingSyncHistory.$inferInsert;


// ─── Promoções ───
export const promocoes = mysqlTable("promocoes", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  tipoDesconto: mysqlEnum("tipoDesconto", ["percentual", "fixo"]).default("percentual").notNull(),
  valorDesconto: decimal("valorDesconto", { precision: 10, scale: 2 }).notNull(),
  imagemUrl: text("imagemUrl"),
  imagemBase64: text("imagemBase64"), // Armazenar imagem gerada
  ativo: int("ativo").default(1).notNull(),
  criadoPor: varchar("criadoPor", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Promocao = typeof promocoes.$inferSelect;
export type InsertPromocao = typeof promocoes.$inferInsert;

// ─── Itens de Promoções ───
export const promocoesItens = mysqlTable("promocoes_itens", {
  id: int("id").autoincrement().primaryKey(),
  promocaoId: int("promocaoId").notNull(),
  produtoId: varchar("produtoId", { length: 255 }).notNull(),
  produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
  precoOriginal: decimal("precoOriginal", { precision: 10, scale: 2 }).notNull(),
  precoPromocional: decimal("precoPromocional", { precision: 10, scale: 2 }).notNull(),
  imagemUrl: text("imagemUrl"),
  catalogo: varchar("catalogo", { length: 100 }), // "veiling", "cooperflora", "loja", etc
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromocaoItem = typeof promocoesItens.$inferSelect;
export type InsertPromocaoItem = typeof promocoesItens.$inferInsert;

// ─── Categorias de Produtos (para listas de preços) ───
export const categoriasProdutos = mysqlTable("categorias_produtos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  ordem: int("ordem").default(0).notNull(),
  ativo: int("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CategoriaProduto = typeof categoriasProdutos.$inferSelect;
export type InsertCategoriaProduto = typeof categoriasProdutos.$inferInsert;

// ─── Listas de Preços ───
export const listasPrecos = mysqlTable("listas_precos", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  subtitulo: varchar("subtitulo", { length: 255 }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt"),
  ativo: int("ativo").default(1).notNull(),
  aceitaPedidos: int("aceitaPedidos").default(1).notNull(),
  criadoPor: varchar("criadoPor", { length: 255 }),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ListaPreco = typeof listasPrecos.$inferSelect;
export type InsertListaPreco = typeof listasPrecos.$inferInsert;

// ─── Itens das Listas de Preços ───
export const listasItens = mysqlTable("listas_itens", {
  id: int("id").autoincrement().primaryKey(),
  listaId: int("listaId").notNull(),
  categoriaId: int("categoriaId"),
  categoriaNome: varchar("categoriaNome", { length: 255 }).notNull(), // snapshot
  variedade: varchar("variedade", { length: 255 }).notNull(),
  tamanho: varchar("tamanho", { length: 50 }),
  qtdHasteMaco: varchar("qtdHasteMaco", { length: 50 }), // ex: "10", "1 KG", "150"
  valorUnitario: decimal("valorUnitario", { precision: 10, scale: 2 }).notNull(),
  disponivel: int("disponivel").default(1).notNull(),
  ordem: int("ordem").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ListaItem = typeof listasItens.$inferSelect;
export type InsertListaItem = typeof listasItens.$inferInsert;

// ─── Pedidos das Listas de Preços ───
export const listasPedidos = mysqlTable("listas_pedidos", {
  id: int("id").autoincrement().primaryKey(),
  listaId: int("listaId").notNull(),
  clienteNome: varchar("clienteNome", { length: 255 }).notNull(),
  clienteTelefone: varchar("clienteTelefone", { length: 30 }),
  observacao: text("observacao"),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["NOVO", "VISTO", "APROVADO", "CANCELADO"]).default("NOVO").notNull(),
  vendaId: int("vendaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ListaPedido = typeof listasPedidos.$inferSelect;
export type InsertListaPedido = typeof listasPedidos.$inferInsert;

// ─── Itens dos Pedidos das Listas de Preços ───
export const listasPedidosItens = mysqlTable("listas_pedidos_itens", {
  id: int("id").autoincrement().primaryKey(),
  pedidoId: int("pedidoId").notNull(),
  listaItemId: int("listaItemId").notNull(),
  categoriaNome: varchar("categoriaNome", { length: 255 }).notNull(),
  variedade: varchar("variedade", { length: 255 }).notNull(),
  tamanho: varchar("tamanho", { length: 50 }),
  qtdHasteMaco: varchar("qtdHasteMaco", { length: 50 }),
  valorUnitario: decimal("valorUnitario", { precision: 10, scale: 2 }).notNull(),
  quantidade: int("quantidade").notNull().default(1),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
});
export type ListaPedidoItem = typeof listasPedidosItens.$inferSelect;
export type InsertListaPedidoItem = typeof listasPedidosItens.$inferInsert;

// ─── Produtos de Lista (cadastro manual, reutilizável em listas) ───
export const produtosLista = mysqlTable("produtos_lista", {
  id: int("id").autoincrement().primaryKey(),
  produtoLojaId: int("produtoLojaId"),
  categoriaId: int("categoriaId"),
  categoriaNome: varchar("categoriaNome", { length: 255 }).notNull(),
  variedade: varchar("variedade", { length: 255 }).notNull(),
  tamanho: varchar("tamanho", { length: 50 }),
  qtdHasteMaco: varchar("qtdHasteMaco", { length: 50 }),
  valorUnitario: decimal("valorUnitario", { precision: 10, scale: 2 }).notNull().default("0.00"),
  ativo: int("ativo").default(1).notNull(),
  observacao: text("observacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  ultimaSincronizacao: timestamp("ultimaSincronizacao"),
});
export type ProdutoLista = typeof produtosLista.$inferSelect;
export type InsertProdutoLista = typeof produtosLista.$inferInsert;

export const historicoAlteracoesLista = mysqlTable("historico_alteracoes_lista", {
  id: int("id").autoincrement().primaryKey(),
  produtoListaId: int("produtoListaId").notNull(),
  usuarioId: varchar("usuarioId", { length: 255 }).notNull(),
  usuarioNome: varchar("usuarioNome", { length: 255 }).notNull(),
  acao: varchar("acao", { length: 50 }).notNull(),
  campoAlterado: varchar("campoAlterado", { length: 100 }),
  valorAnterior: text("valorAnterior"),
  valorNovo: text("valorNovo"),
  data: timestamp("data").defaultNow().notNull(),
});
export type HistoricoAlteracoesLista = typeof historicoAlteracoesLista.$inferSelect;
export type InsertHistoricoAlteracoesLista = typeof historicoAlteracoesLista.$inferInsert;


// ─── Compras Importadas ───
export const comprasImportadas = mysqlTable("compras_importadas", {
  id: int("id").autoincrement().primaryKey(),
  produto: varchar("produto", { length: 255 }).notNull(),
  quantidade: decimal("quantidade", { precision: 12, scale: 4 }).default("0").notNull(),
  valorCusto: decimal("valorCusto", { precision: 12, scale: 2 }).default("0.00").notNull(),
  pacote: decimal("pacote", { precision: 12, scale: 4 }).default("0").notNull(), // Fator de conversão
  valorTotal: decimal("valorTotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
  freteUm: decimal("freteUm", { precision: 12, scale: 2 }).default("0.00").notNull(),
  freteTotal: decimal("freteTotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
  icms: decimal("icms", { precision: 12, scale: 2 }).default("0.00").notNull(),
  embalagem: decimal("embalagem", { precision: 12, scale: 2 }).default("0.00").notNull(),
  custoTotal: decimal("custoTotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalCompra: decimal("totalCompra", { precision: 12, scale: 2 }).default("0.00").notNull(),
  valorVarejo: decimal("valorVarejo", { precision: 12, scale: 2 }).default("0.00").notNull(),
  valorCdUm: decimal("valorCdUm", { precision: 12, scale: 2 }).default("0.00").notNull(),
  valorCdAta: decimal("valorCdAta", { precision: 12, scale: 2 }).default("0.00").notNull(),
  nomeArquivo: varchar("nomeArquivo", { length: 255 }).notNull(),
  dataImportacao: timestamp("dataImportacao").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompraImportada = typeof comprasImportadas.$inferSelect;
export type InsertCompraImportada = typeof comprasImportadas.$inferInsert;


// ─── Produtos Customizados (Catálogo Veiling Cliente) ───
export const produtosCustomizados = mysqlTable(
  "produtos_customizados",
  {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  precoUnitario: decimal("precoUnitario", { precision: 10, scale: 2 }).notNull().default("0.00"),
  estoque: int("estoque").notNull().default(0),
  estoqueMinimo: int("estoqueMinimo").default(0),
  fotoUrl: text("fotoUrl"),
  categoriaId: int("categoriaId"),
  ativo: int("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  // Foreign key para categoriasCustomizadas
}, (table) => ({
  fkCategoria: foreignKey({
    columns: [table.categoriaId],
    foreignColumns: [categoriasCustomizadas.id],
  }).onDelete("set null"),
}));

export type ProdutoCustomizado = typeof produtosCustomizados.$inferSelect;
export type InsertProdutoCustomizado = typeof produtosCustomizados.$inferInsert;

// ─── Categorias de Produtos Customizados ───
export const categoriasCustomizadas = mysqlTable("categorias_customizadas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull().unique(),
  descricao: text("descricao"),
  cor: varchar("cor", { length: 7 }).default("#3B82F6"),
  icone: varchar("icone", { length: 50 }),
  ativo: int("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CategoriaCustomizada = typeof categoriasCustomizadas.$inferSelect;
export type InsertCategoriaCustomizada = typeof categoriasCustomizadas.$inferInsert;

// ─── Adicionar coluna de categoria aos produtos customizados ───
// Nota: Será adicionada via migração SQL:
// ALTER TABLE produtos_customizados ADD COLUMN categoriaId INT AFTER descricao;
// ALTER TABLE produtos_customizados ADD FOREIGN KEY (categoriaId) REFERENCES categorias_customizadas(id) ON DELETE SET NULL;
