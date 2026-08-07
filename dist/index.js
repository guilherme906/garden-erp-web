var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  acompanhamentoCompras: () => acompanhamentoCompras,
  anotacoes: () => anotacoes,
  appConfig: () => appConfig,
  backups: () => backups,
  blingConfig: () => blingConfig,
  blingPedidoMapping: () => blingPedidoMapping,
  blingProdutoMapping: () => blingProdutoMapping,
  blingSync: () => blingSync,
  blingSyncHistory: () => blingSyncHistory,
  caixaMovimentos: () => caixaMovimentos,
  caixas: () => caixas,
  catalogosPedidos: () => catalogosPedidos,
  catalogosPedidosItens: () => catalogosPedidosItens,
  catalogosVenda: () => catalogosVenda,
  catalogosVendaItens: () => catalogosVendaItens,
  categoriasCustomizadas: () => categoriasCustomizadas,
  categoriasProdutos: () => categoriasProdutos,
  clientes: () => clientes,
  compraItens: () => compraItens,
  compras: () => compras,
  comprasImportadas: () => comprasImportadas,
  cooperfloraConfig: () => cooperfloraConfig,
  cooperfloraMargensDepartamento: () => cooperfloraMargensDepartamento,
  cooperfloraProdutos: () => cooperfloraProdutos,
  cooperfloraSyncPendente: () => cooperfloraSyncPendente,
  estoqueAjustes: () => estoqueAjustes,
  estoqueMovimentacoes: () => estoqueMovimentacoes,
  formasPagamento: () => formasPagamento,
  historicoAlteracoes: () => historicoAlteracoes,
  historicoAlteracoesLista: () => historicoAlteracoesLista,
  lembretes: () => lembretes,
  listasItens: () => listasItens,
  listasPedidos: () => listasPedidos,
  listasPedidosItens: () => listasPedidosItens,
  listasPrecos: () => listasPrecos,
  parseOrcamentosOrigemIds: () => parseOrcamentosOrigemIds,
  pedidoCompraItens: () => pedidoCompraItens,
  pedidosCompra: () => pedidosCompra,
  pedidosPublicos: () => pedidosPublicos,
  pedidosPublicosItens: () => pedidosPublicosItens,
  produtos: () => produtos,
  produtosCustomizados: () => produtosCustomizados,
  produtosLista: () => produtosLista,
  produtosLoja: () => produtosLoja,
  promocoes: () => promocoes,
  promocoesItens: () => promocoesItens,
  relatoriosCompartilhados: () => relatoriosCompartilhados,
  syncHistorico: () => syncHistorico,
  tabelaPrecos: () => tabelaPrecos,
  telefonesClientesBloqueados: () => telefonesClientesBloqueados,
  titulos: () => titulos,
  users: () => users,
  veilingCatalogoLinks: () => veilingCatalogoLinks,
  veilingConfig: () => veilingConfig,
  veilingConversao: () => veilingConversao,
  veilingFiltrosSalvos: () => veilingFiltrosSalvos,
  veilingImportacoes: () => veilingImportacoes,
  veilingMargensDepartamento: () => veilingMargensDepartamento,
  veilingProdutos: () => veilingProdutos,
  vendaItens: () => vendaItens,
  vendaLinks: () => vendaLinks,
  vendas: () => vendas,
  vendasEfetivas: () => vendasEfetivas,
  vendedores: () => vendedores
});
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, tinyint, bigint, foreignKey } from "drizzle-orm/mysql-core";
function parseOrcamentosOrigemIds(orcamentosOrigemIds) {
  if (!orcamentosOrigemIds) return [];
  try {
    return JSON.parse(orcamentosOrigemIds);
  } catch {
    return [];
  }
}
var users, vendedores, clientes, telefonesClientesBloqueados, produtos, vendas, vendaItens, compras, compraItens, acompanhamentoCompras, estoqueAjustes, historicoAlteracoes, vendaLinks, backups, tabelaPrecos, formasPagamento, titulos, pedidosCompra, pedidoCompraItens, cooperfloraConfig, cooperfloraProdutos, cooperfloraMargensDepartamento, cooperfloraSyncPendente, veilingConfig, veilingProdutos, veilingMargensDepartamento, produtosLoja, veilingConversao, syncHistorico, catalogosVenda, catalogosVendaItens, catalogosPedidos, catalogosPedidosItens, estoqueMovimentacoes, veilingImportacoes, appConfig, lembretes, vendasEfetivas, caixas, caixaMovimentos, anotacoes, relatoriosCompartilhados, veilingCatalogoLinks, pedidosPublicos, pedidosPublicosItens, veilingFiltrosSalvos, blingConfig, blingSync, blingPedidoMapping, blingProdutoMapping, blingSyncHistory, promocoes, promocoesItens, categoriasProdutos, listasPrecos, listasItens, listasPedidos, listasPedidosItens, produtosLista, historicoAlteracoesLista, comprasImportadas, produtosCustomizados, categoriasCustomizadas;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    vendedores = mysqlTable("vendedores", {
      id: int("id").autoincrement().primaryKey(),
      nome: varchar("nome", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }),
      telefone: varchar("telefone", { length: 30 }),
      senha: varchar("senha", { length: 255 }).notNull(),
      perfil: mysqlEnum("perfil", ["ADMIN", "VENDEDOR"]).default("VENDEDOR").notNull(),
      ativo: int("ativo").default(1).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    clientes = mysqlTable("clientes", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    telefonesClientesBloqueados = mysqlTable("telefones_clientes_bloqueados", {
      id: int("id").autoincrement().primaryKey(),
      clienteId: int("clienteId").notNull(),
      telefone: varchar("telefone", { length: 30 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    produtos = mysqlTable("produtos", {
      id: int("id").autoincrement().primaryKey(),
      descricao: varchar("descricao", { length: 255 }).notNull(),
      custo: decimal("custo", { precision: 12, scale: 2 }).default("0.00").notNull(),
      fatorConversao: decimal("fatorConversao", { precision: 12, scale: 4 }).default("1.0000").notNull(),
      preco: decimal("preco", { precision: 12, scale: 2 }).default("0.00").notNull(),
      codigoExterno: varchar("codigoExterno", { length: 100 }),
      ativo: int("ativo").default(1).notNull(),
      deletedAt: timestamp("deletedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    vendas = mysqlTable("vendas", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    vendaItens = mysqlTable("venda_itens", {
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
      ordem: int("ordem").default(0).notNull()
    });
    compras = mysqlTable("compras", {
      id: int("id").autoincrement().primaryKey(),
      fornecedor: varchar("fornecedor", { length: 255 }),
      numNF: varchar("numNF", { length: 100 }),
      data: varchar("data", { length: 10 }).notNull(),
      total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
      origem: varchar("origem", { length: 50 }).default("MANUAL"),
      status: mysqlEnum("status", ["RASCUNHO", "CONFIRMADO"]).default("CONFIRMADO").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    compraItens = mysqlTable("compra_itens", {
      id: int("id").autoincrement().primaryKey(),
      compraId: int("compraId").notNull(),
      produtoId: int("produtoId"),
      produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
      quantidade: decimal("quantidade", { precision: 12, scale: 2 }).default("0").notNull(),
      valorUnitario: decimal("valorUnitario", { precision: 12, scale: 2 }).default("0.00").notNull(),
      subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
      transacaoGfp: varchar("transacaoGfp", { length: 50 }),
      isDuplicado: tinyint("isDuplicado").default(0)
    });
    acompanhamentoCompras = mysqlTable("acompanhamento_compras", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    estoqueAjustes = mysqlTable("estoque_ajustes", {
      id: int("id").autoincrement().primaryKey(),
      produtoId: int("produtoId").notNull(),
      produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
      quantidade: decimal("quantidade", { precision: 12, scale: 2 }).default("0").notNull(),
      motivo: text("motivo"),
      usuarioNome: varchar("usuarioNome", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    historicoAlteracoes = mysqlTable("historico_alteracoes", {
      id: int("id").autoincrement().primaryKey(),
      tabela: varchar("tabela", { length: 50 }).notNull(),
      registroId: int("registroId").notNull(),
      campo: varchar("campo", { length: 100 }).notNull(),
      valorAntigo: text("valorAntigo"),
      valorNovo: text("valorNovo"),
      usuarioNome: varchar("usuarioNome", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    vendaLinks = mysqlTable("venda_links", {
      id: int("id").autoincrement().primaryKey(),
      vendaId: int("vendaId").notNull(),
      token: varchar("token", { length: 64 }).notNull().unique(),
      expiresAt: timestamp("expiresAt").notNull(),
      createdBy: varchar("createdBy", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    backups = mysqlTable("backups", {
      id: int("id").autoincrement().primaryKey(),
      nomeArquivo: varchar("nomeArquivo", { length: 255 }).notNull(),
      s3Key: varchar("s3Key", { length: 500 }).notNull(),
      s3Url: text("s3Url"),
      tamanho: int("tamanho"),
      usuarioNome: varchar("usuarioNome", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    tabelaPrecos = mysqlTable("tabela_precos", {
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
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    formasPagamento = mysqlTable("formas_pagamento", {
      id: int("id").autoincrement().primaryKey(),
      nome: varchar("nome", { length: 100 }).notNull().unique(),
      descricao: text("descricao"),
      ativo: int("ativo").default(1).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    titulos = mysqlTable("titulos", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    pedidosCompra = mysqlTable("pedidos_compra", {
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
      orcamentosOrigemIds: text("orcamentosOrigemIds")
      // JSON array de IDs dos orçamentos mesclados
    });
    pedidoCompraItens = mysqlTable("pedido_compra_itens", {
      id: int("id").autoincrement().primaryKey(),
      pedidoCompraId: int("pedidoCompraId").notNull(),
      produtoId: int("produtoId"),
      produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
      quantidade: decimal("quantidade", { precision: 12, scale: 2 }).default("0").notNull(),
      precoVenda: decimal("precoVenda", { precision: 12, scale: 2 }).default("0.00").notNull(),
      subtotalVenda: decimal("subtotalVenda", { precision: 12, scale: 2 }).default("0.00").notNull(),
      vendaOrigemId: int("vendaOrigemId"),
      observacao: text("observacao")
    });
    cooperfloraConfig = mysqlTable("cooperflora_config", {
      id: int("id").autoincrement().primaryKey(),
      login: varchar("login", { length: 100 }).notNull().default(""),
      senha: varchar("senha", { length: 255 }).notNull().default(""),
      chave: varchar("chave", { length: 20 }).notNull().default("62002"),
      rota: varchar("rota", { length: 20 }).notNull().default("463"),
      localEntrega: varchar("localEntrega", { length: 255 }).notNull().default("TRIANGULO MINEIRO - MG - BROKER"),
      margemPadrao: decimal("margemPadrao", { precision: 5, scale: 2 }).notNull().default("30.00"),
      dataCarregamento: varchar("dataCarregamento", { length: 10 }).notNull().default(""),
      ultimaAtualizacao: timestamp("ultimaAtualizacao"),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    cooperfloraProdutos = mysqlTable("cooperflora_produtos", {
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
      atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull()
    });
    cooperfloraMargensDepartamento = mysqlTable("cooperflora_margens_departamento", {
      id: int("id").autoincrement().primaryKey(),
      grupo: varchar("grupo", { length: 100 }).notNull().unique(),
      margem: decimal("margem", { precision: 5, scale: 2 }).notNull().default("30.00"),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    cooperfloraSyncPendente = mysqlTable("cooperflora_sync_pendente", {
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
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    veilingConfig = mysqlTable("veiling_config", {
      id: int("id").autoincrement().primaryKey(),
      usuario: varchar("usuario", { length: 320 }).notNull().default(""),
      senha: varchar("senha", { length: 255 }).notNull().default(""),
      customerId: varchar("customerId", { length: 20 }).notNull().default("987"),
      customerIdPedidos: varchar("customerIdPedidos", { length: 20 }).notNull().default("5191"),
      margemGlobal: decimal("margemGlobal", { precision: 5, scale: 2 }).notNull().default("30.00"),
      dataCarregamento: varchar("dataCarregamento", { length: 10 }).notNull().default(""),
      ultimaAtualizacao: timestamp("ultimaAtualizacao"),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    veilingProdutos = mysqlTable("veiling_produtos", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    veilingMargensDepartamento = mysqlTable("veiling_margens_departamento", {
      id: int("id").autoincrement().primaryKey(),
      categoria: varchar("categoria", { length: 100 }).notNull().unique(),
      margem: decimal("margem", { precision: 5, scale: 2 }).notNull().default("30.00"),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    produtosLoja = mysqlTable("produtos_loja", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    veilingConversao = mysqlTable("veiling_conversao", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    syncHistorico = mysqlTable("sync_historico", {
      id: int("id").autoincrement().primaryKey(),
      fonte: mysqlEnum("fonte", ["COOPERFLORA", "VEILING"]).notNull(),
      status: mysqlEnum("status", ["SUCESSO", "FALHA"]).notNull(),
      total: int("total").notNull().default(0),
      mensagem: text("mensagem"),
      duracaoMs: int("duracaoMs"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    catalogosVenda = mysqlTable("catalogos_venda", {
      id: int("id").autoincrement().primaryKey(),
      titulo: varchar("titulo", { length: 255 }).notNull(),
      descricao: text("descricao"),
      token: varchar("token", { length: 64 }).notNull().unique(),
      expiresAt: timestamp("expiresAt").notNull(),
      ativo: int("ativo").default(1).notNull(),
      criadoPor: varchar("criadoPor", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    catalogosVendaItens = mysqlTable("catalogos_venda_itens", {
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
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    catalogosPedidos = mysqlTable("catalogos_pedidos", {
      id: int("id").autoincrement().primaryKey(),
      catalogoId: int("catalogoId").notNull(),
      // Dados do cliente (obrigatórios)
      clienteNome: varchar("clienteNome", { length: 255 }).notNull(),
      clienteTelefone: varchar("clienteTelefone", { length: 30 }).notNull(),
      dataEntrega: varchar("dataEntrega", { length: 10 }).notNull(),
      // dd/MM/yyyy
      observacao: text("observacao"),
      status: mysqlEnum("status", ["NOVO", "VISTO", "APROVADO", "CANCELADO", "RECUSADO"]).default("NOVO").notNull(),
      motivoRecusa: text("motivoRecusa"),
      vendaId: int("vendaId"),
      // preenchido quando convertido em venda
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    catalogosPedidosItens = mysqlTable("catalogos_pedidos_itens", {
      id: int("id").autoincrement().primaryKey(),
      pedidoId: int("pedidoId").notNull(),
      catalogoItemId: int("catalogoItemId").notNull(),
      nome: varchar("nome", { length: 255 }).notNull(),
      preco: decimal("preco", { precision: 10, scale: 2 }),
      quantidade: int("quantidade").notNull().default(1),
      subtotal: decimal("subtotal", { precision: 10, scale: 2 })
    });
    estoqueMovimentacoes = mysqlTable("estoque_movimentacoes", {
      id: int("id").autoincrement().primaryKey(),
      produtoId: int("produtoId").notNull(),
      tipo: mysqlEnum("tipo", ["ENTRADA", "SAIDA", "AJUSTE"]).notNull(),
      quantidade: decimal("quantidade", { precision: 12, scale: 3 }).notNull(),
      estoqueAntes: decimal("estoqueAntes", { precision: 12, scale: 3 }).notNull().default("0.000"),
      estoqueDepois: decimal("estoqueDepois", { precision: 12, scale: 3 }).notNull().default("0.000"),
      justificativa: text("justificativa").notNull(),
      usuarioNome: varchar("usuarioNome", { length: 255 }).notNull().default(""),
      usuarioId: varchar("usuarioId", { length: 100 }).default(""),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    veilingImportacoes = mysqlTable("veiling_importacoes", {
      id: int("id").autoincrement().primaryKey(),
      dataImportacao: timestamp("dataImportacao").defaultNow().notNull(),
      dataPedidos: varchar("dataPedidos", { length: 10 }).notNull(),
      // YYYY-MM-DD
      totalItens: int("totalItens").notNull().default(0),
      totalPedidos: int("totalPedidos").notNull().default(0),
      compraId: int("compraId"),
      status: mysqlEnum("status", ["SUCESSO", "ERRO", "PARCIAL"]).notNull().default("SUCESSO"),
      mensagem: text("mensagem"),
      origem: mysqlEnum("origem", ["AUTOMATICO", "MANUAL"]).notNull().default("AUTOMATICO")
    });
    appConfig = mysqlTable("app_config", {
      id: int("id").autoincrement().primaryKey(),
      chave: varchar("chave", { length: 100 }).notNull().unique(),
      valor: text("valor").notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    lembretes = mysqlTable("lembretes", {
      id: int("id").autoincrement().primaryKey(),
      userId: varchar("userId", { length: 100 }).notNull(),
      // openId do usuário
      userName: varchar("userName", { length: 255 }),
      titulo: varchar("titulo", { length: 255 }).notNull(),
      descricao: text("descricao"),
      dataHora: bigint("dataHora", { mode: "number" }).notNull(),
      // UTC ms timestamp
      recorrencia: mysqlEnum("recorrencia", ["NENHUMA", "DIARIA", "SEMANAL", "MENSAL"]).default("NENHUMA").notNull(),
      status: mysqlEnum("status", ["PENDENTE", "DISPARADO", "LIDO", "CANCELADO"]).default("PENDENTE").notNull(),
      prioridade: mysqlEnum("prioridade", ["BAIXA", "MEDIA", "ALTA"]).default("MEDIA").notNull(),
      notificadoEm: bigint("notificadoEm", { mode: "number" }),
      // quando foi disparado
      vinculoOrcamentoId: int("vinculoOrcamentoId"),
      // id da venda/orçamento vinculado
      vinculoOrcamentoNum: varchar("vinculoOrcamentoNum", { length: 50 }),
      // número legível ex: #630003
      vinculoClienteNome: varchar("vinculoClienteNome", { length: 255 }),
      // nome do cliente vinculado
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    vendasEfetivas = mysqlTable("vendas_efetivas", {
      id: int("id").autoincrement().primaryKey(),
      orcamentoId: int("orcamentoId").notNull(),
      // id da venda/orçamento de origem
      orcamentoNum: varchar("orcamentoNum", { length: 50 }),
      // número legível ex: #630003
      clienteId: int("clienteId"),
      clienteNome: varchar("clienteNome", { length: 255 }),
      vendedorId: int("vendedorId"),
      vendedorNome: varchar("vendedorNome", { length: 255 }),
      total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
      dataVenda: varchar("dataVenda", { length: 10 }).notNull(),
      // data da conversão
      dataEntrega: varchar("dataEntrega", { length: 10 }),
      // data de entrega efetiva
      formaPagamento: varchar("formaPagamento", { length: 100 }),
      observacao: text("observacao"),
      status: mysqlEnum("status", ["PENDENTE", "ENTREGUE", "CANCELADA"]).default("PENDENTE").notNull(),
      convertidoPor: varchar("convertidoPor", { length: 255 }),
      // nome do usuário que converteu
      itensSnapshot: json("itensSnapshot").$type(),
      // snapshot dos itens no momento da conversão
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    caixas = mysqlTable("caixas", {
      id: int("id").autoincrement().primaryKey(),
      data: varchar("data", { length: 10 }).notNull(),
      // YYYY-MM-DD
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    caixaMovimentos = mysqlTable("caixa_movimentos", {
      id: int("id").autoincrement().primaryKey(),
      caixaId: int("caixaId").notNull(),
      tipo: mysqlEnum("tipo", ["ENTRADA", "SAIDA"]).notNull(),
      categoria: varchar("categoria", { length: 100 }).notNull(),
      // ex: Venda, Despesa, Sangria, Suprimento
      descricao: varchar("descricao", { length: 500 }),
      valor: decimal("valor", { precision: 12, scale: 2 }).notNull(),
      formaPagamento: varchar("formaPagamento", { length: 100 }),
      vendaId: int("vendaId"),
      // vínculo opcional com venda
      vendaNum: varchar("vendaNum", { length: 50 }),
      lancadoPor: varchar("lancadoPor", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    anotacoes = mysqlTable("anotacoes", {
      // ativa: 1 = ativa, 0 = inativa (desativada pelo usuário)
      id: int("id").autoincrement().primaryKey(),
      userId: varchar("userId", { length: 255 }).notNull(),
      // openId do usuário
      titulo: varchar("titulo", { length: 255 }).notNull().default("Nova anota\xE7\xE3o"),
      conteudo: text("conteudo").notNull().default(""),
      cor: varchar("cor", { length: 20 }).notNull().default("yellow"),
      // yellow | blue | green | pink | purple
      fixada: tinyint("fixada").notNull().default(0),
      ativa: tinyint("ativa").notNull().default(1),
      // 1 = ativa, 0 = desativada
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    relatoriosCompartilhados = mysqlTable("relatorios_compartilhados", {
      id: int("id").autoincrement().primaryKey(),
      token: varchar("token", { length: 64 }).notNull().unique(),
      clienteId: int("clienteId").notNull(),
      filtros: text("filtros"),
      // JSON com filtros aplicados
      expiresAt: timestamp("expiresAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    veilingCatalogoLinks = mysqlTable("veiling_catalogo_links", {
      id: int("id").autoincrement().primaryKey(),
      token: varchar("token", { length: 64 }).notNull().unique(),
      expiresAt: timestamp("expiresAt").notNull(),
      createdBy: varchar("createdBy", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      // Filtros ativos no momento da geração do link
      filtroCategoria: varchar("filtroCategoria", { length: 100 }).default(""),
      filtroProdutor: varchar("filtroProdutor", { length: 255 }).default(""),
      filtroCor: varchar("filtroCor", { length: 100 }).default(""),
      filtroBusca: varchar("filtroBusca", { length: 255 }).default("")
    });
    pedidosPublicos = mysqlTable("pedidos_publicos", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    pedidosPublicosItens = mysqlTable("pedidos_publicos_itens", {
      id: int("id").autoincrement().primaryKey(),
      pedidoPublicoId: int("pedidoPublicoId").notNull(),
      produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
      quantidade: decimal("quantidade", { precision: 10, scale: 2 }).notNull(),
      valorUnitario: decimal("valorUnitario", { precision: 10, scale: 2 }).notNull(),
      subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    veilingFiltrosSalvos = mysqlTable("veiling_filtros_salvos", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      nome: varchar("nome", { length: 255 }).notNull(),
      categoria: varchar("categoria", { length: 255 }),
      produtor: varchar("produtor", { length: 255 }),
      cor: varchar("cor", { length: 255 }),
      busca: varchar("busca", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    blingConfig = mysqlTable("bling_config", {
      id: int("id").autoincrement().primaryKey(),
      apiKey: varchar("apiKey", { length: 500 }).notNull(),
      // Token de autenticação do Bling
      isActive: int("isActive").default(1).notNull(),
      // 1 = ativo, 0 = inativo
      lastSyncAt: timestamp("lastSyncAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    blingSync = mysqlTable("bling_sync", {
      id: int("id").autoincrement().primaryKey(),
      type: varchar("type", { length: 50 }).notNull(),
      // "pedido", "produto", "estoque"
      direction: varchar("direction", { length: 50 }).notNull(),
      // "garden_to_bling" ou "bling_to_garden"
      sourceId: varchar("sourceId", { length: 255 }).notNull(),
      // ID do pedido/produto no Garden
      blingId: varchar("blingId", { length: 255 }),
      // ID retornado pelo Bling
      status: varchar("status", { length: 50 }).notNull(),
      // "pending", "success", "failed", "retry"
      errorMessage: text("errorMessage"),
      // Mensagem de erro se falhar
      retryCount: int("retryCount").default(0),
      maxRetries: int("maxRetries").default(3),
      lastRetryAt: timestamp("lastRetryAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    blingPedidoMapping = mysqlTable("bling_pedido_mapping", {
      id: int("id").autoincrement().primaryKey(),
      gardenPedidoId: varchar("gardenPedidoId", { length: 255 }).notNull().unique(),
      // ID do pedido no Garden
      blingPedidoId: varchar("blingPedidoId", { length: 255 }).notNull(),
      // ID do pedido no Bling
      syncedAt: timestamp("syncedAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    blingProdutoMapping = mysqlTable("bling_produto_mapping", {
      id: int("id").autoincrement().primaryKey(),
      gardenProdutoId: varchar("gardenProdutoId", { length: 255 }).notNull().unique(),
      blingProdutoId: varchar("blingProdutoId", { length: 255 }).notNull(),
      syncedAt: timestamp("syncedAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    blingSyncHistory = mysqlTable("bling_sync_history", {
      id: int("id").autoincrement().primaryKey(),
      syncId: int("syncId").notNull(),
      // FK para bling_sync
      action: varchar("action", { length: 50 }).notNull(),
      // "created", "updated", "deleted", "retry"
      details: text("details"),
      // JSON com detalhes da ação
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    promocoes = mysqlTable("promocoes", {
      id: int("id").autoincrement().primaryKey(),
      titulo: varchar("titulo", { length: 255 }).notNull(),
      descricao: text("descricao"),
      tipoDesconto: mysqlEnum("tipoDesconto", ["percentual", "fixo"]).default("percentual").notNull(),
      valorDesconto: decimal("valorDesconto", { precision: 10, scale: 2 }).notNull(),
      imagemUrl: text("imagemUrl"),
      imagemBase64: text("imagemBase64"),
      // Armazenar imagem gerada
      ativo: int("ativo").default(1).notNull(),
      criadoPor: varchar("criadoPor", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    promocoesItens = mysqlTable("promocoes_itens", {
      id: int("id").autoincrement().primaryKey(),
      promocaoId: int("promocaoId").notNull(),
      produtoId: varchar("produtoId", { length: 255 }).notNull(),
      produtoNome: varchar("produtoNome", { length: 255 }).notNull(),
      precoOriginal: decimal("precoOriginal", { precision: 10, scale: 2 }).notNull(),
      precoPromocional: decimal("precoPromocional", { precision: 10, scale: 2 }).notNull(),
      imagemUrl: text("imagemUrl"),
      catalogo: varchar("catalogo", { length: 100 }),
      // "veiling", "cooperflora", "loja", etc
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    categoriasProdutos = mysqlTable("categorias_produtos", {
      id: int("id").autoincrement().primaryKey(),
      nome: varchar("nome", { length: 255 }).notNull(),
      descricao: text("descricao"),
      ordem: int("ordem").default(0).notNull(),
      ativo: int("ativo").default(1).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    listasPrecos = mysqlTable("listas_precos", {
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    listasItens = mysqlTable("listas_itens", {
      id: int("id").autoincrement().primaryKey(),
      listaId: int("listaId").notNull(),
      categoriaId: int("categoriaId"),
      categoriaNome: varchar("categoriaNome", { length: 255 }).notNull(),
      // snapshot
      variedade: varchar("variedade", { length: 255 }).notNull(),
      tamanho: varchar("tamanho", { length: 50 }),
      qtdHasteMaco: varchar("qtdHasteMaco", { length: 50 }),
      // ex: "10", "1 KG", "150"
      valorUnitario: decimal("valorUnitario", { precision: 10, scale: 2 }).notNull(),
      disponivel: int("disponivel").default(1).notNull(),
      ordem: int("ordem").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    listasPedidos = mysqlTable("listas_pedidos", {
      id: int("id").autoincrement().primaryKey(),
      listaId: int("listaId").notNull(),
      clienteNome: varchar("clienteNome", { length: 255 }).notNull(),
      clienteTelefone: varchar("clienteTelefone", { length: 30 }),
      observacao: text("observacao"),
      total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
      status: mysqlEnum("status", ["NOVO", "VISTO", "APROVADO", "CANCELADO"]).default("NOVO").notNull(),
      vendaId: int("vendaId"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    listasPedidosItens = mysqlTable("listas_pedidos_itens", {
      id: int("id").autoincrement().primaryKey(),
      pedidoId: int("pedidoId").notNull(),
      listaItemId: int("listaItemId").notNull(),
      categoriaNome: varchar("categoriaNome", { length: 255 }).notNull(),
      variedade: varchar("variedade", { length: 255 }).notNull(),
      tamanho: varchar("tamanho", { length: 50 }),
      qtdHasteMaco: varchar("qtdHasteMaco", { length: 50 }),
      valorUnitario: decimal("valorUnitario", { precision: 10, scale: 2 }).notNull(),
      quantidade: int("quantidade").notNull().default(1),
      subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull()
    });
    produtosLista = mysqlTable("produtos_lista", {
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
      ultimaSincronizacao: timestamp("ultimaSincronizacao")
    });
    historicoAlteracoesLista = mysqlTable("historico_alteracoes_lista", {
      id: int("id").autoincrement().primaryKey(),
      produtoListaId: int("produtoListaId").notNull(),
      usuarioId: varchar("usuarioId", { length: 255 }).notNull(),
      usuarioNome: varchar("usuarioNome", { length: 255 }).notNull(),
      acao: varchar("acao", { length: 50 }).notNull(),
      campoAlterado: varchar("campoAlterado", { length: 100 }),
      valorAnterior: text("valorAnterior"),
      valorNovo: text("valorNovo"),
      data: timestamp("data").defaultNow().notNull()
    });
    comprasImportadas = mysqlTable("compras_importadas", {
      id: int("id").autoincrement().primaryKey(),
      produto: varchar("produto", { length: 255 }).notNull(),
      quantidade: decimal("quantidade", { precision: 12, scale: 4 }).default("0").notNull(),
      valorCusto: decimal("valorCusto", { precision: 12, scale: 2 }).default("0.00").notNull(),
      pacote: decimal("pacote", { precision: 12, scale: 4 }).default("0").notNull(),
      // Fator de conversão
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
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    produtosCustomizados = mysqlTable(
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
        updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
        // Foreign key para categoriasCustomizadas
      },
      (table) => ({
        fkCategoria: foreignKey({
          columns: [table.categoriaId],
          foreignColumns: [categoriasCustomizadas.id]
        }).onDelete("set null")
      })
    );
    categoriasCustomizadas = mysqlTable("categorias_customizadas", {
      id: int("id").autoincrement().primaryKey(),
      nome: varchar("nome", { length: 255 }).notNull().unique(),
      descricao: text("descricao"),
      cor: varchar("cor", { length: 7 }).default("#3B82F6"),
      icone: varchar("icone", { length: 50 }),
      ativo: int("ativo").default(1).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
  }
});

// server/_core/env.ts
var env_exports = {};
__export(env_exports, {
  ENV: () => ENV
});
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addCatalogoItem: () => addCatalogoItem,
  addCompraItem: () => addCompraItem,
  addItemToPedidoCompra: () => addItemToPedidoCompra,
  addListaItem: () => addListaItem,
  addTelefoneClienteBloqueado: () => addTelefoneClienteBloqueado,
  aplicarPrecosComprasImportadasNoVeiling: () => aplicarPrecosComprasImportadasNoVeiling,
  aplicarSyncVendas: () => aplicarSyncVendas,
  aplicarTodosPrecosComprasImportadas: () => aplicarTodosPrecosComprasImportadas,
  applyTabela3ToProducts: () => applyTabela3ToProducts,
  atualizarCatalogoHistorico: () => atualizarCatalogoHistorico,
  atualizarCategoriaCustomizada: () => atualizarCategoriaCustomizada,
  atualizarProdutoCustomizado: () => atualizarProdutoCustomizado,
  atualizarQrCodeToken: () => atualizarQrCodeToken,
  bloquearCliente: () => bloquearCliente,
  buscarPedidosConferencia: () => buscarPedidosConferencia,
  calcularEstoqueProduto: () => calcularEstoqueProduto,
  calcularEstoqueTodos: () => calcularEstoqueTodos,
  calcularValoresCompraImportada: () => calcularValoresCompraImportada,
  checkTransacoesExistentes: () => checkTransacoesExistentes,
  clearCatalogoItens: () => clearCatalogoItens,
  converterRcoldescParaCompraImportada: () => converterRcoldescParaCompraImportada,
  countVeilingConversao: () => countVeilingConversao,
  createAjusteEstoque: () => createAjusteEstoque,
  createBackupRecord: () => createBackupRecord,
  createCatalogoPedido: () => createCatalogoPedido,
  createCatalogoVenda: () => createCatalogoVenda,
  createCategoriaProduto: () => createCategoriaProduto,
  createCliente: () => createCliente,
  createCompra: () => createCompra,
  createCompraImportada: () => createCompraImportada,
  createFormaPagamento: () => createFormaPagamento,
  createHistorico: () => createHistorico,
  createHistoricoAlteracao: () => createHistoricoAlteracao,
  createListaPreco: () => createListaPreco,
  createPedidoCompra: () => createPedidoCompra,
  createPedidoPublico: () => createPedidoPublico,
  createProduto: () => createProduto,
  createProdutoLista: () => createProdutoLista,
  createProdutoLoja: () => createProdutoLoja,
  createPromocao: () => createPromocao,
  createTitulo: () => createTitulo,
  createVeilingCatalogoLink: () => createVeilingCatalogoLink,
  createVeilingImportacao: () => createVeilingImportacao,
  createVenda: () => createVenda,
  createVendaLink: () => createVendaLink,
  createVendedor: () => createVendedor,
  criarCategoriaCustomizada: () => criarCategoriaCustomizada,
  criarListaPedido: () => criarListaPedido,
  criarMovimentacaoEstoque: () => criarMovimentacaoEstoque,
  criarOuAtualizarAcompanhamento: () => criarOuAtualizarAcompanhamento,
  criarProdutoCustomizado: () => criarProdutoCustomizado,
  decrementarEstoqueProdutoCustomizado: () => decrementarEstoqueProdutoCustomizado,
  deletarAcompanhamento: () => deletarAcompanhamento,
  deletarCatalogoHistorico: () => deletarCatalogoHistorico,
  deletarCategoriaCustomizada: () => deletarCategoriaCustomizada,
  deletarProdutoCustomizado: () => deletarProdutoCustomizado,
  deleteCatalogoVenda: () => deleteCatalogoVenda,
  deleteCategoriaProduto: () => deleteCategoriaProduto,
  deleteCliente: () => deleteCliente,
  deleteClientePermanente: () => deleteClientePermanente,
  deleteCompra: () => deleteCompra,
  deleteCompraImportada: () => deleteCompraImportada,
  deleteCompraItem: () => deleteCompraItem,
  deleteFormaPagamento: () => deleteFormaPagamento,
  deleteListaItem: () => deleteListaItem,
  deleteListaPreco: () => deleteListaPreco,
  deleteMargemDepartamento: () => deleteMargemDepartamento,
  deletePedidoCompra: () => deletePedidoCompra,
  deleteProduto: () => deleteProduto,
  deleteProdutoLista: () => deleteProdutoLista,
  deleteProdutoLoja: () => deleteProdutoLoja,
  deleteProdutoPermanente: () => deleteProdutoPermanente,
  deletePromocao: () => deletePromocao,
  deleteTelefonesClienteBloqueado: () => deleteTelefonesClienteBloqueado,
  deleteTitulo: () => deleteTitulo,
  deleteVeilingCatalogoLink: () => deleteVeilingCatalogoLink,
  deleteVeilingFiltro: () => deleteVeilingFiltro,
  deleteVeilingMargem: () => deleteVeilingMargem,
  deleteVenda: () => deleteVenda,
  deleteVendaLink: () => deleteVendaLink,
  deleteVendaPermanente: () => deleteVendaPermanente,
  desbloquearCliente: () => desbloquearCliente,
  expirarVendasVencidas: () => expirarVendasVencidas,
  extrairCorDoProduto: () => extrairCorDoProduto,
  faturarVenda: () => faturarVenda,
  gerarPdfComprasImportadas: () => gerarPdfComprasImportadas,
  gerarQrCodeToken: () => gerarQrCodeToken,
  getAllDataForBackup: () => getAllDataForBackup,
  getAppConfig: () => getAppConfig,
  getCatalogoPedidoById: () => getCatalogoPedidoById,
  getCatalogoVenda: () => getCatalogoVenda,
  getCatalogoVendaByToken: () => getCatalogoVendaByToken,
  getCliente: () => getCliente,
  getCompra: () => getCompra,
  getCompraImportadaById: () => getCompraImportadaById,
  getCompraItens: () => getCompraItens,
  getComprasImportadas: () => getComprasImportadas,
  getCooperfloraConfig: () => getCooperfloraConfig,
  getCoresVeiling: () => getCoresVeiling,
  getDb: () => getDb,
  getHistoricoAlteracao: () => getHistoricoAlteracao,
  getKardex: () => getKardex,
  getListaPedidoById: () => getListaPedidoById,
  getListaPrecoById: () => getListaPrecoById,
  getListaPrecoByToken: () => getListaPrecoByToken,
  getMargemEfetiva: () => getMargemEfetiva,
  getNextNumeroPedidoCompra: () => getNextNumeroPedidoCompra,
  getPedidoCompra: () => getPedidoCompra,
  getPedidoPublico: () => getPedidoPublico,
  getProduto: () => getProduto,
  getProdutoByDescricao: () => getProdutoByDescricao,
  getProdutoByName: () => getProdutoByName,
  getProdutoListaById: () => getProdutoListaById,
  getProdutoLoja: () => getProdutoLoja,
  getPromocaoById: () => getPromocaoById,
  getPromocoes: () => getPromocoes,
  getRankingProdutos: () => getRankingProdutos,
  getRelatorioVendas: () => getRelatorioVendas,
  getTitulosByVenda: () => getTitulosByVenda,
  getUserByOpenId: () => getUserByOpenId,
  getValidadePrecosCooperflora: () => getValidadePrecosCooperflora,
  getValidadePrecosVeiling: () => getValidadePrecosVeiling,
  getVeilingCatalogoLink: () => getVeilingCatalogoLink,
  getVeilingCategorias: () => getVeilingCategorias,
  getVeilingConfig: () => getVeilingConfig,
  getVeilingConversaoByProduto: () => getVeilingConversaoByProduto,
  getVeilingConversaoMap: () => getVeilingConversaoMap,
  getVeilingCores: () => getVeilingCores,
  getVeilingFiltro: () => getVeilingFiltro,
  getVeilingMargemEfetiva: () => getVeilingMargemEfetiva,
  getVeilingProdutores: () => getVeilingProdutores,
  getVeilingStatusRecepcionados: () => getVeilingStatusRecepcionados,
  getVenda: () => getVenda,
  getVendaByToken: () => getVendaByToken,
  getVendaItens: () => getVendaItens,
  getVendasFaturadosIds: () => getVendasFaturadosIds,
  getVendasNaoFaturadas: () => getVendasNaoFaturadas,
  getVendedor: () => getVendedor,
  getVendedorByLogin: () => getVendedorByLogin,
  importBackupData: () => importBackupData,
  importVeilingConversao: () => importVeilingConversao,
  isVendaFaturada: () => isVendaFaturada,
  listAllCatalogoPedidos: () => listAllCatalogoPedidos,
  listBackups: () => listBackups,
  listCatalogoItens: () => listCatalogoItens,
  listCatalogoPedidos: () => listCatalogoPedidos,
  listCatalogosVenda: () => listCatalogosVenda,
  listCategoriasProdutos: () => listCategoriasProdutos,
  listClientes: () => listClientes,
  listClientesBloqueados: () => listClientesBloqueados,
  listClientesLixeira: () => listClientesLixeira,
  listCompras: () => listCompras,
  listCooperfloraProdutos: () => listCooperfloraProdutos,
  listDepartamentosLoja: () => listDepartamentosLoja,
  listFormasPagamento: () => listFormasPagamento,
  listHistorico: () => listHistorico,
  listListasPedidos: () => listListasPedidos,
  listListasPrecos: () => listListasPrecos,
  listMargensDepartamento: () => listMargensDepartamento,
  listPedidosCompra: () => listPedidosCompra,
  listPedidosPublicos: () => listPedidosPublicos,
  listProdutos: () => listProdutos,
  listProdutosLista: () => listProdutosLista,
  listProdutosLixeira: () => listProdutosLixeira,
  listProdutosLoja: () => listProdutosLoja,
  listTabelaPrecosByCompra: () => listTabelaPrecosByCompra,
  listTelefonesClienteBloqueado: () => listTelefonesClienteBloqueado,
  listTitulosPagos: () => listTitulosPagos,
  listTitulosPendentes: () => listTitulosPendentes,
  listVeilingCatalogoLinks: () => listVeilingCatalogoLinks,
  listVeilingFiltros: () => listVeilingFiltros,
  listVeilingImportacoes: () => listVeilingImportacoes,
  listVeilingMargens: () => listVeilingMargens,
  listVeilingProdutos: () => listVeilingProdutos,
  listVendaLinks: () => listVendaLinks,
  listVendas: () => listVendas,
  listVendasExpiradas: () => listVendasExpiradas,
  listVendasLixeira: () => listVendasLixeira,
  listVendedores: () => listVendedores,
  listarAcompanhamentosPorCompra: () => listarAcompanhamentosPorCompra,
  listarCatalogosHistorico: () => listarCatalogosHistorico,
  listarCategoriasCustomizadas: () => listarCategoriasCustomizadas,
  listarComprasComAcompanhamento: () => listarComprasComAcompanhamento,
  listarDivergenciasConferencia: () => listarDivergenciasConferencia,
  listarMovimentacoesEstoque: () => listarMovimentacoesEstoque,
  listarProdutosCustomizados: () => listarProdutosCustomizados,
  listarSyncHistorico: () => listarSyncHistorico,
  obterAcompanhamento: () => obterAcompanhamento,
  obterCatalogoHistorico: () => obterCatalogoHistorico,
  obterProdutoCustomizado: () => obterProdutoCustomizado,
  obterResumoCompra: () => obterResumoCompra,
  obterVendaPorQrCodeToken: () => obterVendaPorQrCodeToken,
  parseRcoldescFile: () => parseRcoldescFile,
  previewSyncVendas: () => previewSyncVendas,
  recalcCompraTotal: () => recalcCompraTotal,
  recategorizarVeilingProdutos: () => recategorizarVeilingProdutos,
  registrarSyncHistorico: () => registrarSyncHistorico,
  relatorioEstoqueProdutos: () => relatorioEstoqueProdutos,
  removeCatalogoItem: () => removeCatalogoItem,
  removeTelefoneClienteBloqueado: () => removeTelefoneClienteBloqueado,
  replaceListaItens: () => replaceListaItens,
  restaurarCatalogoHistorico: () => restaurarCatalogoHistorico,
  restoreCliente: () => restoreCliente,
  restoreProduto: () => restoreProduto,
  restoreVenda: () => restoreVenda,
  salvarCatalogoHistorico: () => salvarCatalogoHistorico,
  salvarConferencia: () => salvarConferencia,
  salvarConferencia2: () => salvarConferencia2,
  saveTabelaPrecosBatch: () => saveTabelaPrecosBatch,
  saveVeilingConfig: () => saveVeilingConfig,
  saveVeilingFiltro: () => saveVeilingFiltro,
  searchProdutosLoja: () => searchProdutosLoja,
  searchProdutosLojaSemelhanca: () => searchProdutosLojaSemelhanca,
  searchProdutosSemelhanca: () => searchProdutosSemelhanca,
  setAppConfig: () => setAppConfig,
  setValidadePrecosCooperflora: () => setValidadePrecosCooperflora,
  setValidadePrecosVeiling: () => setValidadePrecosVeiling,
  sincronizarCompraImportadaComVeiling: () => sincronizarCompraImportadaComVeiling,
  sincronizarPedidosCompraAoAlterarOrcamento: () => sincronizarPedidosCompraAoAlterarOrcamento,
  sincronizarTodasComprasImportadas: () => sincronizarTodasComprasImportadas,
  syncCatalogosVendaAposSync: () => syncCatalogosVendaAposSync,
  syncProdutoLojaToLista: () => syncProdutoLojaToLista,
  syncProdutosVendaFromCooperflora: () => syncProdutosVendaFromCooperflora,
  toggleProdutoListaAtivo: () => toggleProdutoListaAtivo,
  updateCatalogoPedidoStatus: () => updateCatalogoPedidoStatus,
  updateCatalogoPedidoStatusComMotivo: () => updateCatalogoPedidoStatusComMotivo,
  updateCatalogoVenda: () => updateCatalogoVenda,
  updateCategoriaProduto: () => updateCategoriaProduto,
  updateCliente: () => updateCliente,
  updateCompra: () => updateCompra,
  updateCompraItem: () => updateCompraItem,
  updateCompraStatus: () => updateCompraStatus,
  updateCooperfloraHastes: () => updateCooperfloraHastes,
  updateCooperfloraMargem: () => updateCooperfloraMargem,
  updateFormaPagamento: () => updateFormaPagamento,
  updateListaItem: () => updateListaItem,
  updateListaPedidoStatus: () => updateListaPedidoStatus,
  updateListaPreco: () => updateListaPreco,
  updatePedidoCompra: () => updatePedidoCompra,
  updatePedidoPublicoStatus: () => updatePedidoPublicoStatus,
  updatePedidoPublicoVendaId: () => updatePedidoPublicoVendaId,
  updateProduto: () => updateProduto,
  updateProdutoLista: () => updateProdutoLista,
  updateProdutoLoja: () => updateProdutoLoja,
  updatePromocao: () => updatePromocao,
  updateStatusPedidoCompra: () => updateStatusPedidoCompra,
  updateTituloStatus: () => updateTituloStatus,
  updateVeilingConversaoObservacoes: () => updateVeilingConversaoObservacoes,
  updateVeilingFiltro: () => updateVeilingFiltro,
  updateVenda: () => updateVenda,
  updateVendedor: () => updateVendedor,
  upsertCooperfloraConfig: () => upsertCooperfloraConfig,
  upsertCooperfloraProdutos: () => upsertCooperfloraProdutos,
  upsertMargemDepartamento: () => upsertMargemDepartamento,
  upsertProdutoLojaFromCompra: () => upsertProdutoLojaFromCompra,
  upsertTabelaPreco: () => upsertTabelaPreco,
  upsertUser: () => upsertUser,
  upsertVeilingMargem: () => upsertVeilingMargem,
  upsertVeilingProdutos: () => upsertVeilingProdutos,
  verificarDesatualizacao: () => verificarDesatualizacao,
  zerarEstoque: () => zerarEstoque
});
import { eq, like, or, and, desc, sql, asc, isNull, isNotNull, inArray, gt } from "drizzle-orm";
import crypto from "crypto";
import { drizzle } from "drizzle-orm/mysql2";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  const assignNullable = (field) => {
    const value = user[field];
    if (value === void 0) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function listVendedores() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendedores).orderBy(asc(vendedores.id));
}
async function getVendedor(id) {
  const db = await getDb();
  if (!db) return void 0;
  const r = await db.select().from(vendedores).where(eq(vendedores.id, id)).limit(1);
  return r[0];
}
async function getVendedorByLogin(nome, senha) {
  const db = await getDb();
  if (!db) return void 0;
  const r = await db.select().from(vendedores).where(and(eq(vendedores.nome, nome), eq(vendedores.senha, senha))).limit(1);
  return r[0];
}
async function createVendedor(data) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(vendedores).values(data);
  return result.insertId;
}
async function updateVendedor(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(vendedores).set(data).where(eq(vendedores.id, id));
}
async function listClientes(search, includeDeleted = false) {
  const db = await getDb();
  if (!db) return [];
  const conditions = includeDeleted ? [] : [isNull(clientes.deletedAt)];
  if (search) {
    const s = search.toLowerCase();
    conditions.push(or(sql`LOWER(${clientes.nome}) LIKE ${`%${s}%`}`, sql`LOWER(${clientes.telefone}) LIKE ${`%${s}%`}`));
  }
  return db.select().from(clientes).where(conditions.length ? and(...conditions) : void 0).orderBy(asc(clientes.id));
}
async function getCliente(id) {
  const db = await getDb();
  if (!db) return void 0;
  const r = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return r[0];
}
async function createCliente(data) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(clientes).values(data);
  return result.insertId;
}
async function updateCliente(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientes).set(data).where(eq(clientes.id, id));
}
async function deleteCliente(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientes).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(clientes.id, id));
}
async function restoreCliente(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientes).set({ deletedAt: null }).where(eq(clientes.id, id));
}
async function listClientesLixeira() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientes).where(isNotNull(clientes.deletedAt)).orderBy(desc(clientes.deletedAt));
}
async function deleteClientePermanente(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(historicoAlteracoes).where(and(eq(historicoAlteracoes.tabela, "clientes"), eq(historicoAlteracoes.registroId, id)));
  await db.delete(clientes).where(eq(clientes.id, id));
}
async function listProdutos(search, includeDeleted = false) {
  const db = await getDb();
  if (!db) return [];
  const conditions = includeDeleted ? [] : [isNull(produtos.deletedAt)];
  if (search) {
    const s = search.toLowerCase();
    conditions.push(or(sql`LOWER(${produtos.descricao}) LIKE ${`%${s}%`}`, sql`LOWER(${produtos.codigoExterno}) LIKE ${`%${s}%`}`));
  }
  return db.select().from(produtos).where(conditions.length ? and(...conditions) : void 0).orderBy(asc(produtos.id));
}
async function getProduto(id) {
  const db = await getDb();
  if (!db) return void 0;
  const r = await db.select().from(produtos).where(eq(produtos.id, id)).limit(1);
  return r[0];
}
async function getProdutoByDescricao(descricao) {
  const db = await getDb();
  if (!db) return void 0;
  const r = await db.select().from(produtos).where(eq(produtos.descricao, descricao)).limit(1);
  return r[0];
}
async function createProduto(data) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(produtos).values(data);
  return result.insertId;
}
async function updateProduto(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(produtos).set(data).where(eq(produtos.id, id));
}
async function deleteProduto(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(produtos).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(produtos.id, id));
}
async function restoreProduto(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(produtos).set({ deletedAt: null }).where(eq(produtos.id, id));
}
async function listProdutosLixeira() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(produtos).where(isNotNull(produtos.deletedAt)).orderBy(desc(produtos.deletedAt));
}
async function deleteProdutoPermanente(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(estoqueAjustes).where(eq(estoqueAjustes.produtoId, id));
  await db.delete(historicoAlteracoes).where(and(eq(historicoAlteracoes.tabela, "produtos"), eq(historicoAlteracoes.registroId, id)));
  await db.delete(produtos).where(eq(produtos.id, id));
}
async function calcularEstoqueProduto(produtoId) {
  const db = await getDb();
  if (!db) return 0;
  const [entradas] = await db.select({ total: sql`COALESCE(SUM(quantidade), 0)` }).from(compraItens).where(eq(compraItens.produtoId, produtoId));
  const [saidas] = await db.select({ total: sql`COALESCE(SUM(quantidade), 0)` }).from(vendaItens).where(eq(vendaItens.produtoId, produtoId));
  const [ajustes] = await db.select({ total: sql`COALESCE(SUM(quantidade), 0)` }).from(estoqueAjustes).where(eq(estoqueAjustes.produtoId, produtoId));
  return Number(entradas.total) - Number(saidas.total) + Number(ajustes.total);
}
async function calcularEstoqueTodos() {
  const db = await getDb();
  if (!db) return [];
  const prods = await db.select().from(produtos).where(isNull(produtos.deletedAt)).orderBy(asc(produtos.id));
  const result = [];
  for (const p of prods) {
    const saldo = await calcularEstoqueProduto(p.id);
    result.push({ ...p, estoque: saldo });
  }
  return result;
}
async function getKardex(produtoId) {
  const db = await getDb();
  if (!db) return { entradas: [], saidas: [], ajustes: [] };
  const entradas = await db.select().from(compraItens).where(eq(compraItens.produtoId, produtoId));
  const saidas = await db.select().from(vendaItens).where(eq(vendaItens.produtoId, produtoId));
  const ajustesList = await db.select().from(estoqueAjustes).where(eq(estoqueAjustes.produtoId, produtoId));
  return { entradas, saidas, ajustes: ajustesList };
}
async function createAjusteEstoque(data) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(estoqueAjustes).values(data);
  return result.insertId;
}
async function listVendas(search, includeDeleted = false) {
  const db = await getDb();
  if (!db) return [];
  const conditions = includeDeleted ? [] : [isNull(vendas.deletedAt)];
  if (search) {
    const s = search.toLowerCase();
    conditions.push(or(sql`LOWER(${vendas.clienteNome}) LIKE ${`%${s}%`}`, sql`LOWER(${vendas.vendedorNome}) LIKE ${`%${s}%`}`));
  }
  return db.select().from(vendas).where(conditions.length ? and(...conditions) : void 0).orderBy(asc(vendas.id));
}
async function getVenda(id) {
  const db = await getDb();
  if (!db) return void 0;
  const r = await db.select().from(vendas).where(eq(vendas.id, id)).limit(1);
  return r[0];
}
async function getVendaItens(vendaId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendaItens).where(eq(vendaItens.vendaId, vendaId)).orderBy(asc(vendaItens.ordem));
}
async function createVenda(data, itens) {
  const db = await getDb();
  if (!db) return null;
  const ultimaVenda = await db.select({ numeroSequencial: vendas.numeroSequencial }).from(vendas).orderBy(desc(vendas.numeroSequencial)).limit(1);
  const proximoNumero = (ultimaVenda[0]?.numeroSequencial || 0) + 1;
  const [result] = await db.insert(vendas).values({
    ...data,
    numeroSequencial: proximoNumero
  });
  const vendaId = result.insertId;
  for (let i = 0; i < itens.length; i++) {
    await db.insert(vendaItens).values({ ...itens[i], vendaId, ordem: i });
  }
  return vendaId;
}
async function updateVenda(id, data, itens) {
  const db = await getDb();
  if (!db) return;
  await db.update(vendas).set(data).where(eq(vendas.id, id));
  if (itens && Array.isArray(itens) && itens.length > 0) {
    await db.delete(vendaItens).where(eq(vendaItens.vendaId, id));
    for (let i = 0; i < itens.length; i++) {
      await db.insert(vendaItens).values({ ...itens[i], vendaId: id, ordem: i });
    }
  }
}
async function deleteVenda(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(vendas).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(vendas.id, id));
}
async function restoreVenda(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(vendas).set({ deletedAt: null }).where(eq(vendas.id, id));
}
async function listVendasLixeira() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendas).where(isNotNull(vendas.deletedAt)).orderBy(desc(vendas.deletedAt));
}
async function deleteVendaPermanente(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(vendaLinks).where(eq(vendaLinks.vendaId, id));
  await db.delete(vendaItens).where(eq(vendaItens.vendaId, id));
  await db.delete(vendas).where(eq(vendas.id, id));
}
async function listCompras() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(compras).orderBy(desc(compras.id));
}
async function getCompra(id) {
  const db = await getDb();
  if (!db) return void 0;
  const r = await db.select().from(compras).where(eq(compras.id, id)).limit(1);
  return r[0];
}
async function getCompraItens(compraId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(compraItens).where(eq(compraItens.compraId, compraId));
}
async function createCompra(data, itens) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(compras).values(data);
  const compraId = result.insertId;
  for (const item of itens) {
    await db.insert(compraItens).values({ ...item, compraId });
  }
  return compraId;
}
async function listHistorico(tabela, registroId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(historicoAlteracoes).where(and(eq(historicoAlteracoes.tabela, tabela), eq(historicoAlteracoes.registroId, registroId))).orderBy(desc(historicoAlteracoes.createdAt));
}
async function createHistorico(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(historicoAlteracoes).values(data);
}
async function getRelatorioVendas(dataInicio, dataFim, status) {
  const db = await getDb();
  if (!db) return [];
  let query;
  if (status && status !== "TODOS") {
    query = db.select().from(vendas).where(and(
      sql`${vendas.data} >= ${dataInicio}`,
      sql`${vendas.data} <= ${dataFim}`,
      eq(vendas.status, status),
      isNull(vendas.deletedAt)
    )).orderBy(asc(vendas.clienteNome));
  } else {
    query = db.select().from(vendas).where(and(
      sql`${vendas.data} >= ${dataInicio}`,
      sql`${vendas.data} <= ${dataFim}`,
      isNull(vendas.deletedAt)
    )).orderBy(asc(vendas.clienteNome));
  }
  return query;
}
async function getRankingProdutos(dataInicio, dataFim, status) {
  const db = await getDb();
  if (!db) return [];
  const vendasList = await getRelatorioVendas(dataInicio, dataFim, status);
  const mapa = {};
  for (const v of vendasList) {
    const itens = await getVendaItens(v.id);
    for (const it of itens) {
      const key = it.produtoNome.trim().toUpperCase();
      if (!mapa[key]) {
        mapa[key] = {
          produtoId: it.produtoId ?? null,
          produtoNome: it.produtoNome,
          valorUnitario: Number(it.valorUnitario),
          quantidade: 0,
          total: 0,
          observacoes: [],
          estoque: null,
          estoqueDisponivel: null
        };
      }
      mapa[key].quantidade += Number(it.quantidade);
      mapa[key].total += Number(it.subtotal);
      if (it.observacao && !mapa[key].observacoes.includes(it.observacao)) {
        mapa[key].observacoes.push(it.observacao);
      }
      if (!mapa[key].produtoId && it.produtoId) {
        mapa[key].produtoId = it.produtoId;
      }
    }
  }
  for (const entry of Object.values(mapa)) {
    const nomeNorm = entry.produtoNome.trim().toUpperCase();
    const [lojaRow] = await db.select({ estoque: produtosLoja.estoque }).from(produtosLoja).where(sql`UPPER(TRIM(${produtosLoja.nome})) = ${nomeNorm}`).limit(1);
    if (lojaRow) {
      entry.estoque = Number(lojaRow.estoque);
      entry.estoqueDisponivel = Number(lojaRow.estoque) - entry.quantidade;
      continue;
    }
    if (entry.produtoId) {
      const saldo = await calcularEstoqueProduto(entry.produtoId);
      entry.estoque = saldo;
      entry.estoqueDisponivel = saldo - entry.quantidade;
    } else {
      const [prod] = await db.select({ id: produtos.id }).from(produtos).where(sql`UPPER(TRIM(${produtos.descricao})) = ${nomeNorm}`).limit(1);
      if (prod) {
        entry.produtoId = prod.id;
        const saldo = await calcularEstoqueProduto(prod.id);
        entry.estoque = saldo;
        entry.estoqueDisponivel = saldo - entry.quantidade;
      }
    }
  }
  return Object.values(mapa).sort((a, b) => a.produtoNome.localeCompare(b.produtoNome, "pt-BR", { sensitivity: "base" }));
}
async function getAllDataForBackup() {
  const db = await getDb();
  if (!db) return null;
  const [c, p, v, vi, co, ci, ea, ha, ve, b] = await Promise.all([
    db.select().from(clientes),
    db.select().from(produtos),
    db.select().from(vendas),
    db.select().from(vendaItens),
    db.select().from(compras),
    db.select().from(compraItens),
    db.select().from(estoqueAjustes),
    db.select().from(historicoAlteracoes),
    db.select().from(vendedores),
    db.select().from(backups)
  ]);
  return { clientes: c, produtos: p, vendas: v, vendaItens: vi, compras: co, compraItens: ci, estoqueAjustes: ea, historicoAlteracoes: ha, vendedores: ve, backups: b };
}
async function createBackupRecord(data) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(backups).values(data);
  return result.insertId;
}
async function listBackups() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(backups).orderBy(desc(backups.createdAt));
}
async function createVendaLink(data) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(vendaLinks).values(data);
  return result.insertId;
}
async function getVendaByToken(token) {
  const db = await getDb();
  if (!db) return null;
  const [link] = await db.select().from(vendaLinks).where(eq(vendaLinks.token, token));
  if (!link) return null;
  if (new Date(link.expiresAt) < /* @__PURE__ */ new Date()) return { expired: true, link };
  const venda = await getVenda(link.vendaId);
  if (!venda) return null;
  const itens = await getVendaItens(link.vendaId);
  return { expired: false, link, venda: { ...venda, itens } };
}
async function listVendaLinks(vendaId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendaLinks).where(eq(vendaLinks.vendaId, vendaId)).orderBy(desc(vendaLinks.createdAt));
}
async function deleteVendaLink(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(vendaLinks).where(eq(vendaLinks.id, id));
}
async function zerarEstoque() {
  const db = await getDb();
  if (!db) return;
  await db.update(cooperfloraProdutos).set({ estoque: 0 });
  await db.update(veilingProdutos).set({ estoqueDisponivel: 0 });
  await db.update(produtosLoja).set({ estoque: "0.000" });
}
async function importBackupData(data) {
  const db = await getDb();
  if (!db) return;
  const backup = data.db || data;
  await db.delete(compraItens);
  await db.delete(compras);
  await db.delete(vendaItens);
  await db.delete(vendas);
  await db.delete(estoqueAjustes);
  await db.delete(historicoAlteracoes);
  await db.delete(clientes);
  await db.delete(produtos);
  const existingVendedores = await db.select().from(vendedores);
  for (const v of existingVendedores) {
    if (v.nome !== "admin") {
      await db.delete(vendedores).where(eq(vendedores.id, v.id));
    }
  }
  const clienteIdMap = /* @__PURE__ */ new Map();
  const produtoIdMap = /* @__PURE__ */ new Map();
  const vendedorIdMap = /* @__PURE__ */ new Map();
  const vendaIdMap = /* @__PURE__ */ new Map();
  const compraIdMap = /* @__PURE__ */ new Map();
  if (backup.clientes?.length) {
    for (const c of backup.clientes) {
      const [result] = await db.insert(clientes).values({ nome: c.nome, telefone: c.telefone, email: c.email, endereco: c.endereco });
      clienteIdMap.set(c.id, result.insertId);
    }
  }
  if (backup.produtos?.length) {
    for (const p of backup.produtos) {
      const [result] = await db.insert(produtos).values({ descricao: p.descricao, preco: p.preco, codigoExterno: p.codigoExterno });
      produtoIdMap.set(p.id, result.insertId);
    }
  }
  if (backup.vendedores?.length) {
    for (const v of backup.vendedores) {
      if (v.nome === "admin") {
        const existing = existingVendedores.find((ev) => ev.nome === "admin");
        if (existing) vendedorIdMap.set(v.id, existing.id);
        continue;
      }
      const [result] = await db.insert(vendedores).values({ nome: v.nome, email: v.email, telefone: v.telefone, senha: v.senha || "123", perfil: v.perfil || "VENDEDOR" });
      vendedorIdMap.set(v.id, result.insertId);
    }
  }
  if (backup.vendas?.length) {
    for (const v of backup.vendas) {
      const [result] = await db.insert(vendas).values({
        clienteId: v.clienteId ? clienteIdMap.get(v.clienteId) || v.clienteId : void 0,
        clienteNome: v.clienteNome,
        vendedorId: v.vendedorId ? vendedorIdMap.get(v.vendedorId) || v.vendedorId : void 0,
        vendedorNome: v.vendedorNome,
        data: v.data,
        status: v.status || "AGUARDANDO",
        logistica: v.logistica,
        total: v.total
      });
      vendaIdMap.set(v.id, result.insertId);
    }
  }
  if (backup.vendaItens?.length) {
    for (const vi of backup.vendaItens) {
      await db.insert(vendaItens).values({
        vendaId: vendaIdMap.get(vi.vendaId) || vi.vendaId,
        produtoId: vi.produtoId ? produtoIdMap.get(vi.produtoId) || vi.produtoId : void 0,
        produtoNome: vi.produtoNome,
        quantidade: vi.quantidade,
        valorUnitario: vi.valorUnitario,
        subtotal: vi.subtotal,
        observacao: vi.observacao
      });
    }
  }
  if (backup.compras?.length) {
    for (const c of backup.compras) {
      const [result] = await db.insert(compras).values({
        fornecedor: c.fornecedor,
        numNF: c.numNF,
        data: c.data,
        total: c.total,
        origem: c.origem
      });
      compraIdMap.set(c.id, result.insertId);
    }
  }
  if (backup.compraItens?.length) {
    for (const ci of backup.compraItens) {
      await db.insert(compraItens).values({
        compraId: compraIdMap.get(ci.compraId) || ci.compraId,
        produtoId: ci.produtoId ? produtoIdMap.get(ci.produtoId) || ci.produtoId : void 0,
        produtoNome: ci.produtoNome,
        quantidade: ci.quantidade,
        valorUnitario: ci.valorUnitario,
        subtotal: ci.subtotal
      });
    }
  }
  if (backup.estoqueAjustes?.length) {
    for (const ea of backup.estoqueAjustes) {
      await db.insert(estoqueAjustes).values({
        produtoId: produtoIdMap.get(ea.produtoId) || ea.produtoId,
        produtoNome: ea.produtoNome,
        quantidade: ea.quantidade,
        motivo: ea.motivo,
        usuarioNome: ea.usuarioNome
      });
    }
  }
  if (backup.historicoAlteracoes?.length) {
    for (const h of backup.historicoAlteracoes) {
      await db.insert(historicoAlteracoes).values({
        tabela: h.tabela,
        registroId: h.registroId,
        campo: h.campo,
        valorAntigo: h.valorAntigo,
        valorNovo: h.valorNovo,
        usuarioNome: h.usuarioNome
      });
    }
  }
}
async function buscarPedidosConferencia(search) {
  const db = await getDb();
  if (!db) return [];
  const searchNum = parseInt(search, 10);
  const conditions = [isNull(vendas.deletedAt)];
  if (!isNaN(searchNum) && String(searchNum) === search.trim()) {
    conditions.push(eq(vendas.id, searchNum));
  } else {
    const sl = search.toLowerCase();
    conditions.push(
      or(
        sql`LOWER(${vendas.clienteNome}) LIKE ${`%${sl}%`}`,
        sql`${vendas.clienteId} IN (SELECT id FROM clientes WHERE LOWER(telefone) LIKE ${`%${sl}%`})`
      )
    );
  }
  return db.select().from(vendas).where(and(...conditions)).orderBy(desc(vendas.createdAt)).limit(50);
}
async function salvarConferencia(vendaId, itensConferidos, conferidoPor) {
  const db = await getDb();
  if (!db) return;
  for (const item of itensConferidos) {
    await db.update(vendaItens).set({ qtdConferida: item.qtdConferida }).where(eq(vendaItens.id, item.itemId));
  }
  await db.update(vendas).set({
    conferido: 1,
    conferidoPor,
    conferidoEm: /* @__PURE__ */ new Date()
  }).where(eq(vendas.id, vendaId));
}
async function salvarConferencia2(vendaId, itensConferidos, conferidoPor) {
  const db = await getDb();
  if (!db) return;
  for (const item of itensConferidos) {
    await db.update(vendaItens).set({ qtdConferida2: item.qtdConferida }).where(eq(vendaItens.id, item.itemId));
  }
  await db.update(vendas).set({
    conferido2: 1,
    conferidoPor2: conferidoPor,
    conferidoEm2: /* @__PURE__ */ new Date()
  }).where(eq(vendas.id, vendaId));
}
async function listarDivergenciasConferencia() {
  const db = await getDb();
  if (!db) return [];
  const vendasConferidas = await db.select().from(vendas).where(and(or(eq(vendas.conferido, 1), eq(vendas.conferido2, 1)), isNull(vendas.deletedAt))).orderBy(asc(vendas.clienteNome));
  const results = [];
  for (const v of vendasConferidas) {
    const itensVenda = await db.select().from(vendaItens).where(eq(vendaItens.vendaId, v.id));
    const itensDivergentes1 = itensVenda.filter(
      (item) => item.qtdConferida !== null && item.qtdConferida !== item.quantidade
    );
    const itensDivergentes2 = itensVenda.filter(
      (item) => item.qtdConferida2 !== null && item.qtdConferida2 !== item.quantidade
    );
    results.push({
      id: v.id,
      clienteNome: v.clienteNome,
      data: v.data,
      status: v.status,
      conferidoPor: v.conferidoPor,
      conferidoEm: v.conferidoEm,
      conferidoPor2: v.conferidoPor2,
      conferidoEm2: v.conferidoEm2,
      conferido2: v.conferido2,
      totalItens: itensVenda.length,
      itensDivergentes: itensDivergentes1.length,
      itensDivergentes2: itensDivergentes2.length,
      itensOk: itensVenda.filter((i) => i.qtdConferida !== null && i.qtdConferida === i.quantidade).length,
      itensOk2: itensVenda.filter((i) => i.qtdConferida2 !== null && i.qtdConferida2 === i.quantidade).length,
      itens: itensVenda.map((item) => ({
        id: item.id,
        produtoNome: item.produtoNome,
        quantidade: item.quantidade,
        qtdConferida: item.qtdConferida,
        qtdConferida2: item.qtdConferida2,
        divergente: item.qtdConferida !== null && item.qtdConferida !== item.quantidade,
        divergente2: item.qtdConferida2 !== null && item.qtdConferida2 !== item.quantidade
      }))
    });
  }
  return results;
}
async function listTabelaPrecosByCompra(compraId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tabelaPrecos).where(eq(tabelaPrecos.compraId, compraId)).orderBy(asc(tabelaPrecos.id));
}
async function upsertTabelaPreco(data) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(tabelaPrecos).where(eq(tabelaPrecos.compraItemId, data.compraItemId)).limit(1);
  if (existing.length > 0) {
    await db.update(tabelaPrecos).set({
      produtoNome: data.produtoNome,
      custoUnitario: data.custoUnitario,
      margem1: data.margem1,
      preco1: data.preco1,
      margem2: data.margem2,
      preco2: data.preco2,
      margem3: data.margem3,
      preco3: data.preco3
    }).where(eq(tabelaPrecos.id, existing[0].id));
    return existing[0].id;
  } else {
    const [result] = await db.insert(tabelaPrecos).values(data);
    return result.insertId;
  }
}
async function saveTabelaPrecosBatch(compraId, items) {
  for (const item of items) {
    await upsertTabelaPreco({ ...item, compraId });
  }
}
async function createFormaPagamento(nome, descricao) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.insert(formasPagamento).values({ nome, descricao }).execute();
  return result;
}
async function listFormasPagamento() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(formasPagamento).where(eq(formasPagamento.ativo, 1)).execute();
}
async function updateFormaPagamento(id, nome, descricao, ativo) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const updates = {};
  if (nome !== void 0) updates.nome = nome;
  if (descricao !== void 0) updates.descricao = descricao;
  if (ativo !== void 0) updates.ativo = ativo;
  return await db.update(formasPagamento).set(updates).where(eq(formasPagamento.id, id)).execute();
}
async function deleteFormaPagamento(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.update(formasPagamento).set({ ativo: 0 }).where(eq(formasPagamento.id, id)).execute();
}
async function createTitulo(input) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.insert(titulos).values(input).execute();
  return result;
}
async function listTitulosPendentes() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(titulos).where(inArray(titulos.status, ["PENDENTE", "VENCIDO"])).orderBy(titulos.dataVencimento).execute();
}
async function listTitulosPagos() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(titulos).where(eq(titulos.status, "PAGO")).orderBy(desc(titulos.dataPagamento)).execute();
}
async function getTitulosByVenda(vendaId) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(titulos).where(eq(titulos.vendaId, vendaId)).execute();
}
async function updateTituloStatus(id, status, dataPagamento) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const updates = { status };
  if (dataPagamento) updates.dataPagamento = dataPagamento;
  return await db.update(titulos).set(updates).where(eq(titulos.id, id)).execute();
}
async function deleteTitulo(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.update(titulos).set({ status: "CANCELADO" }).where(eq(titulos.id, id)).execute();
}
async function faturarVenda(vendaId, formaPagamentoId, faturadoPor, dataVencimento) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const venda = await db.select().from(vendas).where(eq(vendas.id, vendaId)).limit(1);
  if (!venda.length) throw new Error("Venda n\xE3o encontrada");
  const v = venda[0];
  await db.update(vendas).set({
    faturado: 1,
    faturadoPor,
    faturadoEm: /* @__PURE__ */ new Date()
  }).where(eq(vendas.id, vendaId)).execute();
  const result = await createTitulo({
    vendaId,
    clienteId: v.clienteId || 0,
    clienteNome: v.clienteNome || "",
    formaPagamentoId,
    valor: v.total,
    dataVencimento,
    status: "PENDENTE"
  });
  return { vendaId, tituloId: result.insertId || 0 };
}
async function getVendasNaoFaturadas() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(vendas).where(eq(vendas.faturado, 0)).execute();
}
async function listPedidosCompra() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const pedidos = await db.select().from(pedidosCompra).where(isNull(pedidosCompra.deletedAt)).orderBy(asc(pedidosCompra.numero)).execute();
  if (!pedidos.length) return [];
  const ids = pedidos.map((p) => p.id);
  const origensRes = await db.execute(
    sql`SELECT pci.pedidoCompraId, pci.vendaOrigemId, MIN(v.id) as vendaId, MIN(c.nome) as clienteNome
        FROM pedido_compra_itens pci
        LEFT JOIN vendas v ON v.id = pci.vendaOrigemId
        LEFT JOIN clientes c ON c.id = v.clienteId
        WHERE pci.pedidoCompraId IN (${sql.raw(ids.join(","))}) AND pci.vendaOrigemId IS NOT NULL
        GROUP BY pci.pedidoCompraId, pci.vendaOrigemId`
  );
  const origensRows = origensRes[0];
  const origensMap = {};
  for (const row of origensRows) {
    const pid = Number(row.pedidoCompraId);
    if (!origensMap[pid]) origensMap[pid] = [];
    origensMap[pid].push({ vendaOrigemId: Number(row.vendaOrigemId), clienteNome: row.clienteNome || null });
  }
  return pedidos.map((p) => ({ ...p, origens: origensMap[p.id] || [] }));
}
async function getPedidoCompra(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const [pedido] = await db.select().from(pedidosCompra).where(eq(pedidosCompra.id, id)).execute();
  if (!pedido) return null;
  const itens = await db.select().from(pedidoCompraItens).where(eq(pedidoCompraItens.pedidoCompraId, id)).execute();
  return { ...pedido, itens };
}
async function getNextNumeroPedidoCompra() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const [result] = await db.select({ maxNum: sql`COALESCE(MAX(${pedidosCompra.numero}), 0)` }).from(pedidosCompra).execute();
  return (result?.maxNum || 0) + 1;
}
async function createPedidoCompra(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const [result] = await db.insert(pedidosCompra).values({
    numero: data.numero,
    data: data.data,
    solicitante: data.solicitante,
    observacoes: data.observacoes || null,
    total: data.total
  }).execute();
  const pedidoId = result.insertId;
  if (data.itens.length > 0) {
    await db.insert(pedidoCompraItens).values(
      data.itens.map((item) => ({
        pedidoCompraId: pedidoId,
        produtoId: item.produtoId || null,
        produtoNome: item.produtoNome,
        quantidade: item.quantidade,
        precoVenda: item.precoVenda,
        subtotalVenda: item.subtotalVenda
      }))
    ).execute();
  }
  return pedidoId;
}
async function updatePedidoCompra(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const updateData = {
    data: data.data,
    solicitante: data.solicitante,
    observacoes: data.observacoes || null,
    total: data.total
  };
  if (data.status) updateData.status = data.status;
  await db.update(pedidosCompra).set(updateData).where(eq(pedidosCompra.id, id)).execute();
  await db.delete(pedidoCompraItens).where(eq(pedidoCompraItens.pedidoCompraId, id)).execute();
  if (data.itens.length > 0) {
    await db.insert(pedidoCompraItens).values(
      data.itens.map((item) => ({
        pedidoCompraId: id,
        produtoId: item.produtoId || null,
        produtoNome: item.produtoNome,
        quantidade: item.quantidade,
        precoVenda: item.precoVenda,
        subtotalVenda: item.subtotalVenda
      }))
    ).execute();
  }
}
async function deletePedidoCompra(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.update(pedidosCompra).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(pedidosCompra.id, id)).execute();
}
async function updateStatusPedidoCompra(id, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.update(pedidosCompra).set({ status }).where(eq(pedidosCompra.id, id)).execute();
}
async function getCooperfloraConfig() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const rows = await db.select().from(cooperfloraConfig).execute();
  return rows[0] || null;
}
async function upsertCooperfloraConfig(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const existing = await getCooperfloraConfig();
  if (existing) {
    await db.update(cooperfloraConfig).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(cooperfloraConfig.id, existing.id)).execute();
    const rows = await db.select().from(cooperfloraConfig).where(eq(cooperfloraConfig.id, existing.id)).execute();
    return rows[0];
  } else {
    await db.insert(cooperfloraConfig).values({ login: "", senha: "", ...data }).execute();
    const rows = await db.select().from(cooperfloraConfig).execute();
    return rows[0];
  }
}
async function listCooperfloraProdutos(filtro) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const rows = await db.select().from(cooperfloraProdutos).orderBy(cooperfloraProdutos.nome).execute();
  let result = rows;
  if (filtro?.nome) {
    const n = filtro.nome.toLowerCase();
    result = result.filter((r) => r.nome.toLowerCase().includes(n));
  }
  if (filtro?.qualidade) {
    result = result.filter((r) => r.qualidade === filtro.qualidade);
  }
  if (filtro?.grupo) {
    const g = filtro.grupo.toLowerCase();
    result = result.filter((r) => r.grupo.toLowerCase().includes(g));
  }
  return result;
}
async function upsertCooperfloraProdutos(produtos2) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  if (produtos2.length === 0) return;
  await db.delete(cooperfloraProdutos).execute();
  for (let i = 0; i < produtos2.length; i += 100) {
    const batch = produtos2.slice(i, i + 100);
    await db.insert(cooperfloraProdutos).values(batch).execute();
  }
}
async function updateCooperfloraMargem(codigo, margemCustom) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.update(cooperfloraProdutos).set({ margemCustom: margemCustom !== null ? String(margemCustom) : null }).where(eq(cooperfloraProdutos.codigo, codigo)).execute();
}
async function updateCooperfloraHastes(codigo, hastes, hastesEmbalagem) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const updateData = { hastes };
  if (hastesEmbalagem && hastesEmbalagem > 1) updateData.hastesEmbalagem = hastesEmbalagem;
  await db.update(cooperfloraProdutos).set(updateData).where(eq(cooperfloraProdutos.codigo, codigo)).execute();
}
async function syncProdutosVendaFromCooperflora(margemPadrao = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const cooperfloraRows = await db.select().from(cooperfloraProdutos).execute();
  const codigosCooperflora = new Set(cooperfloraRows.map((r) => r.codigo));
  const produtosErp = await db.select().from(produtos).where(isNotNull(produtos.codigoExterno)).execute();
  const produtosErpMap = new Map(produtosErp.map((p) => [p.codigoExterno, p]));
  let criados = 0, atualizados = 0, removidos = 0, restaurados = 0, estoqueAjustado = 0;
  for (const cp of cooperfloraRows) {
    const margem = cp.margemCustom ? Number(cp.margemCustom) : margemPadrao;
    const custoUnitario = Number(cp.precoMin);
    const precoVenda = custoUnitario > 0 ? Math.round(custoUnitario * (1 + margem / 100) * 100) / 100 : 0;
    const fator = cp.hastes > 1 ? cp.hastes : 1;
    const descricao = cp.qualidade ? `${cp.nome} (${cp.qualidade})` : cp.nome;
    const existente = produtosErpMap.get(cp.codigo);
    if (!existente) {
      const [res] = await db.insert(produtos).values({
        descricao,
        custo: String(custoUnitario),
        preco: String(precoVenda),
        fatorConversao: String(fator),
        codigoExterno: cp.codigo
      }).execute();
      const novoProdutoId = res.insertId;
      criados++;
      if (cp.estoque > 0) {
        await db.insert(estoqueAjustes).values({
          produtoId: novoProdutoId,
          produtoNome: descricao,
          quantidade: String(cp.estoque),
          motivo: `Estoque inicial via sincroniza\xE7\xE3o Cooperflora (${cp.dataCarregamento})`,
          usuarioNome: "Sistema"
        }).execute();
        estoqueAjustado++;
      }
    } else {
      const updates = {
        descricao,
        custo: String(custoUnitario),
        preco: String(precoVenda),
        fatorConversao: String(fator)
      };
      if (existente.deletedAt) {
        updates.deletedAt = null;
        restaurados++;
      }
      await db.update(produtos).set(updates).where(eq(produtos.id, existente.id)).execute();
      atualizados++;
      const saldoAtual = await calcularEstoqueProduto(existente.id);
      const diff = cp.estoque - saldoAtual;
      if (diff !== 0) {
        await db.insert(estoqueAjustes).values({
          produtoId: existente.id,
          produtoNome: descricao,
          quantidade: String(diff),
          motivo: `Ajuste de estoque via sincroniza\xE7\xE3o Cooperflora (${cp.dataCarregamento}). Saldo anterior: ${saldoAtual}, novo: ${cp.estoque}`,
          usuarioNome: "Sistema"
        }).execute();
        estoqueAjustado++;
      }
    }
  }
  for (const [codigo, prod] of Array.from(produtosErpMap.entries())) {
    if (!codigosCooperflora.has(codigo) && !prod.deletedAt) {
      const [vendasVinculadas] = await db.select({ count: sql`COUNT(*)` }).from(vendaItens).where(eq(vendaItens.produtoId, prod.id)).execute();
      const [comprasVinculadas] = await db.select({ count: sql`COUNT(*)` }).from(compraItens).where(eq(compraItens.produtoId, prod.id)).execute();
      await db.update(produtos).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(produtos.id, prod.id)).execute();
      removidos++;
    }
  }
  return { criados, atualizados, removidos, restaurados, estoqueAjustado };
}
async function listMargensDepartamento() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cooperfloraMargensDepartamento).orderBy(asc(cooperfloraMargensDepartamento.grupo)).execute();
}
async function upsertMargemDepartamento(grupo, margem) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(cooperfloraMargensDepartamento).where(eq(cooperfloraMargensDepartamento.grupo, grupo)).limit(1).execute();
  if (existing.length > 0) {
    await db.update(cooperfloraMargensDepartamento).set({ margem: String(margem) }).where(eq(cooperfloraMargensDepartamento.grupo, grupo)).execute();
  } else {
    await db.insert(cooperfloraMargensDepartamento).values({ grupo, margem: String(margem) }).execute();
  }
}
async function deleteMargemDepartamento(grupo) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cooperfloraMargensDepartamento).where(eq(cooperfloraMargensDepartamento.grupo, grupo)).execute();
}
async function getMargemEfetiva(grupo, margemCustomProduto, margemPadrao) {
  if (margemCustomProduto !== null && margemCustomProduto !== void 0) {
    return Number(margemCustomProduto);
  }
  const db = await getDb();
  if (!db) return margemPadrao;
  const rows = await db.select().from(cooperfloraMargensDepartamento).where(eq(cooperfloraMargensDepartamento.grupo, grupo)).limit(1).execute();
  if (rows.length > 0) return Number(rows[0].margem);
  return margemPadrao;
}
async function previewSyncVendas(margemPadrao = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const cooperfloraRows = await db.select().from(cooperfloraProdutos).execute();
  const codigosCooperflora = new Set(cooperfloraRows.map((r) => r.codigo));
  const produtosErp = await db.select().from(produtos).where(isNotNull(produtos.codigoExterno)).execute();
  const produtosErpMap = new Map(produtosErp.map((p) => [p.codigoExterno, p]));
  const result = [];
  for (const cp of cooperfloraRows) {
    const margem = await getMargemEfetiva(cp.grupo, cp.margemCustom, margemPadrao);
    const custoNovo = Number(cp.precoMin);
    const precoNovo = custoNovo > 0 ? Math.round(custoNovo * (1 + margem / 100) * 100) / 100 : 0;
    const hastes = cp.hastes > 1 ? cp.hastes : 1;
    const descricao = cp.qualidade ? `${cp.nome} (${cp.qualidade})` : cp.nome;
    const existente = produtosErpMap.get(cp.codigo);
    if (!existente) {
      result.push({
        codigo: cp.codigo,
        acao: "CRIAR",
        nome: descricao,
        qualidade: cp.qualidade,
        grupo: cp.grupo,
        custoNovo,
        precoNovo,
        estoqueNovo: cp.estoque,
        hastes,
        imagemUrl: cp.imagemUrl || void 0
      });
    } else {
      const custoAnterior = Number(existente.custo);
      const precoAnterior = Number(existente.preco);
      const estoqueAnterior = await calcularEstoqueProduto(existente.id);
      const mudou = Math.abs(custoAnterior - custoNovo) > 1e-3 || Math.abs(precoAnterior - precoNovo) > 1e-3 || estoqueAnterior !== cp.estoque || existente.deletedAt !== null;
      if (mudou) {
        result.push({
          codigo: cp.codigo,
          acao: existente.deletedAt ? "CRIAR" : "ATUALIZAR",
          nome: descricao,
          qualidade: cp.qualidade,
          grupo: cp.grupo,
          custoNovo,
          precoNovo,
          custoAnterior,
          precoAnterior,
          estoqueNovo: cp.estoque,
          estoqueAnterior,
          hastes,
          imagemUrl: cp.imagemUrl || void 0,
          produtoErpId: existente.id
        });
      }
    }
  }
  for (const [codigo, prod] of Array.from(produtosErpMap.entries())) {
    if (!codigosCooperflora.has(codigo) && !prod.deletedAt) {
      result.push({
        codigo,
        acao: "REMOVER",
        nome: prod.descricao,
        qualidade: "",
        grupo: "",
        custoNovo: 0,
        precoNovo: 0,
        custoAnterior: Number(prod.custo),
        precoAnterior: Number(prod.preco),
        estoqueNovo: 0,
        estoqueAnterior: await calcularEstoqueProduto(prod.id),
        hastes: 1,
        produtoErpId: prod.id
      });
    }
  }
  return result;
}
async function aplicarSyncVendas(codigosAprovados, margemPadrao = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const aprovadosSet = new Set(codigosAprovados);
  const cooperfloraRows = await db.select().from(cooperfloraProdutos).where(inArray(cooperfloraProdutos.codigo, codigosAprovados.length > 0 ? codigosAprovados : ["__nenhum__"])).execute();
  const produtosErp = await db.select().from(produtos).where(isNotNull(produtos.codigoExterno)).execute();
  const produtosErpMap = new Map(produtosErp.map((p) => [p.codigoExterno, p]));
  let criados = 0, atualizados = 0, removidos = 0, restaurados = 0, estoqueAjustado = 0;
  for (const cp of cooperfloraRows) {
    if (!aprovadosSet.has(cp.codigo)) continue;
    const margem = await getMargemEfetiva(cp.grupo, cp.margemCustom, margemPadrao);
    const custoUnitario = Number(cp.precoMin);
    const precoVenda = custoUnitario > 0 ? Math.round(custoUnitario * (1 + margem / 100) * 100) / 100 : 0;
    const fator = cp.hastes > 1 ? cp.hastes : 1;
    const descricao = cp.qualidade ? `${cp.nome} (${cp.qualidade})` : cp.nome;
    const existente = produtosErpMap.get(cp.codigo);
    if (!existente) {
      const [res] = await db.insert(produtos).values({
        descricao,
        custo: String(custoUnitario),
        preco: String(precoVenda),
        fatorConversao: String(fator),
        codigoExterno: cp.codigo
      }).execute();
      if (cp.estoque > 0) {
        await db.insert(estoqueAjustes).values({
          produtoId: res.insertId,
          produtoNome: descricao,
          quantidade: String(cp.estoque),
          motivo: `Estoque inicial via sincroniza\xE7\xE3o Cooperflora`,
          usuarioNome: "Sistema"
        }).execute();
        estoqueAjustado++;
      }
      criados++;
    } else {
      const updates = {
        descricao,
        custo: String(custoUnitario),
        preco: String(precoVenda),
        fatorConversao: String(fator)
      };
      if (existente.deletedAt) {
        updates.deletedAt = null;
        restaurados++;
      }
      await db.update(produtos).set(updates).where(eq(produtos.id, existente.id)).execute();
      const saldoAtual = await calcularEstoqueProduto(existente.id);
      const diff = cp.estoque - saldoAtual;
      if (diff !== 0) {
        await db.insert(estoqueAjustes).values({
          produtoId: existente.id,
          produtoNome: descricao,
          quantidade: String(diff),
          motivo: `Ajuste via sincroniza\xE7\xE3o Cooperflora. Anterior: ${saldoAtual}, novo: ${cp.estoque}`,
          usuarioNome: "Sistema"
        }).execute();
        estoqueAjustado++;
      }
      atualizados++;
    }
  }
  for (const [codigo, prod] of Array.from(produtosErpMap.entries())) {
    if (aprovadosSet.has(codigo) && !prod.deletedAt) {
      const cpExiste = await db.select().from(cooperfloraProdutos).where(eq(cooperfloraProdutos.codigo, codigo)).limit(1).execute();
      if (cpExiste.length === 0) {
        await db.update(produtos).set({ deletedAt: /* @__PURE__ */ new Date() }).where(eq(produtos.id, prod.id)).execute();
        removidos++;
      }
    }
  }
  return { criados, atualizados, removidos, restaurados, estoqueAjustado };
}
async function getVeilingConfig() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(veilingConfig).execute();
  return rows[0] || null;
}
async function saveVeilingConfig(data) {
  const db = await getDb();
  if (!db) throw new Error("DB n\xE3o dispon\xEDvel");
  const existing = await db.select().from(veilingConfig).execute();
  if (existing.length > 0) {
    await db.update(veilingConfig).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(veilingConfig.id, existing[0].id)).execute();
  } else {
    await db.insert(veilingConfig).values({ usuario: "", senha: "", ...data }).execute();
  }
}
async function listVeilingProdutos(filtros) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  conditions.push(gt(veilingProdutos.estoqueDisponivel, 0));
  if (filtros?.categoria) conditions.push(eq(veilingProdutos.categoria, filtros.categoria));
  if (filtros?.produtor) conditions.push(eq(veilingProdutos.produtor, filtros.produtor));
  if (filtros?.letra) {
    conditions.push(
      or(
        sql`UPPER(${veilingProdutos.nomeCompleto}) LIKE ${filtros.letra.toUpperCase() + "%"}`,
        sql`UPPER(${veilingProdutos.nome}) LIKE ${filtros.letra.toUpperCase() + "%"}`
      )
    );
  }
  if (filtros?.busca) {
    const b = filtros.busca.toLowerCase();
    conditions.push(
      or(
        sql`LOWER(${veilingProdutos.nomeCompleto}) LIKE ${`%${b}%`}`,
        sql`LOWER(${veilingProdutos.nome}) LIKE ${`%${b}%`}`,
        sql`LOWER(${veilingProdutos.produtor}) LIKE ${`%${b}%`}`,
        sql`LOWER(COALESCE(${veilingProdutos.gfpNumero}, '')) LIKE ${`%${b}%`}`,
        sql`LOWER(COALESCE(${veilingProdutos.embalagem}, '')) LIKE ${`%${b}%`}`
      )
    );
  }
  if (filtros?.cor) conditions.push(eq(veilingProdutos.cor, filtros.cor));
  if (filtros?.cores && filtros.cores.length > 0) {
    conditions.push(inArray(veilingProdutos.cor, filtros.cores));
  }
  const where = conditions.length > 0 ? and(...conditions) : void 0;
  const [items, countRows, conversaoMap] = await Promise.all([
    db.select().from(veilingProdutos).where(where).orderBy(asc(veilingProdutos.nome), asc(veilingProdutos.id)).limit(filtros?.limit ?? 200).offset(filtros?.offset ?? 0).execute(),
    db.select({ count: sql`COALESCE(COUNT(*), 0)` }).from(veilingProdutos).where(where).execute(),
    getVeilingConversaoMap()
  ]);
  const enriched = items.map((item) => {
    let conv = item.nomeCompleto ? conversaoMap.get(item.nomeCompleto.trim().toUpperCase()) : void 0;
    if (!conv) {
      conv = conversaoMap.get(item.nome.trim().toUpperCase());
    }
    if (!conv && item.nome) {
      const nomeProdutoUpper = item.nome.trim().toUpperCase();
      conversaoMap.forEach((value, key) => {
        if (!conv && (key.startsWith(nomeProdutoUpper) || nomeProdutoUpper.startsWith(key))) {
          conv = value;
        }
      });
    }
    const qtdVenda = conv?.qtdVenda ?? Number(item.multiplo) ?? 1;
    const fotoConversao = conv?.fotoUrl ?? null;
    const qualidadeConversao = conv?.qualidade ?? "";
    const observacaoGfp = conv?.observacao ?? null;
    const numGfp = conv?.numGfp ?? "";
    const icms = conv?.icms ?? null;
    const proxyOfferId = item.offerId ? `/api/veiling/image?offerId=${item.offerId}` : null;
    const imagemUrlValida = item.imagemUrl && !item.imagemUrl.includes("/Default") ? item.imagemUrl : null;
    const imagemFinal = item.imagemUrlCache || imagemUrlValida || proxyOfferId || fotoConversao;
    return { ...item, imagemUrl: imagemFinal, qtdVenda, fotoConversao, qualidadeConversao, observacaoGfp, numGfp, icms, nomeProdutor: item.produtor };
  });
  const total = countRows[0]?.count != null ? Number(countRows[0].count) : items.length;
  return { items: enriched, total };
}
async function getVeilingStatusRecepcionados() {
  const db = await getDb();
  if (!db) return /* @__PURE__ */ new Set();
  const rows = await db.select({ offerId: veilingProdutos.offerId }).from(veilingProdutos).where(eq(veilingProdutos.statusProduto, "LKP_RECEPCIONADO")).execute();
  return new Set(rows.map((r) => r.offerId));
}
async function upsertVeilingProdutos(ofertas, recepcionadosIds) {
  const db = await getDb();
  if (!db) throw new Error("DB n\xE3o dispon\xEDvel");
  await db.delete(veilingProdutos).execute();
  if (ofertas.length === 0) return 0;
  const ofertasComStatus = recepcionadosIds && recepcionadosIds.size > 0 ? ofertas.map((o) => ({
    ...o,
    statusProduto: recepcionadosIds.has(o.offerId) ? "LKP_RECEPCIONADO" : o.statusProduto
  })) : ofertas;
  const BATCH = 200;
  for (let i = 0; i < ofertasComStatus.length; i += BATCH) {
    await db.insert(veilingProdutos).values(ofertasComStatus.slice(i, i + BATCH)).execute();
  }
  return ofertasComStatus.length;
}
async function getCoresVeiling() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ cor: veilingProdutos.cor }).from(veilingProdutos).groupBy(veilingProdutos.cor).orderBy(asc(veilingProdutos.cor)).execute();
  return rows.map((r) => r.cor).filter((c) => c != null && c.trim() !== "");
}
async function getVeilingCategorias() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ categoria: veilingProdutos.categoria }).from(veilingProdutos).groupBy(veilingProdutos.categoria).orderBy(asc(veilingProdutos.categoria)).execute();
  return rows.map((r) => r.categoria).filter(Boolean);
}
async function getVeilingProdutores(categoria) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select({ produtor: veilingProdutos.produtor }).from(veilingProdutos).groupBy(veilingProdutos.produtor).orderBy(asc(veilingProdutos.produtor));
  if (categoria) {
    const rows2 = await db.select({ produtor: veilingProdutos.produtor }).from(veilingProdutos).where(eq(veilingProdutos.categoria, categoria)).groupBy(veilingProdutos.produtor).orderBy(asc(veilingProdutos.produtor)).execute();
    return rows2.map((r) => r.produtor).filter(Boolean);
  }
  const rows = await query.execute();
  return rows.map((r) => r.produtor).filter(Boolean);
}
async function listVeilingMargens() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(veilingMargensDepartamento).orderBy(asc(veilingMargensDepartamento.categoria)).execute();
}
async function upsertVeilingMargem(categoria, margem) {
  const db = await getDb();
  if (!db) throw new Error("DB n\xE3o dispon\xEDvel");
  const existing = await db.select().from(veilingMargensDepartamento).where(eq(veilingMargensDepartamento.categoria, categoria)).limit(1).execute();
  if (existing.length > 0) {
    await db.update(veilingMargensDepartamento).set({ margem: String(margem), updatedAt: /* @__PURE__ */ new Date() }).where(eq(veilingMargensDepartamento.id, existing[0].id)).execute();
  } else {
    await db.insert(veilingMargensDepartamento).values({ categoria, margem: String(margem) }).execute();
  }
}
async function deleteVeilingMargem(id) {
  const db = await getDb();
  if (!db) throw new Error("DB n\xE3o dispon\xEDvel");
  await db.delete(veilingMargensDepartamento).where(eq(veilingMargensDepartamento.id, id)).execute();
}
function normalizarCategoriaVeiling(cat) {
  const c = cat.toLowerCase().trim();
  if (c.includes("corte")) return "produto de corte";
  if (c.includes("envasada") || c.includes("flor envasada")) return "flor envasada";
  if (c.includes("ornamental") || c.includes("planta")) return "planta ornamental";
  if (c.includes("decorado") || c.includes("decorada")) return "produto decorado";
  return c;
}
async function getVeilingMargemEfetiva(categoria, margemGlobal) {
  const db = await getDb();
  if (!db) return margemGlobal;
  const rows = await db.select().from(veilingMargensDepartamento).execute();
  const catNorm = normalizarCategoriaVeiling(categoria);
  const match = rows.find((r) => normalizarCategoriaVeiling(r.categoria) === catNorm);
  if (match) return Number(match.margem);
  return margemGlobal;
}
async function recategorizarVeilingProdutos(catMapById, catMapByCode, catMapByCodeTrimmed) {
  const db = await getDb();
  if (!db) return 0;
  const semCategoria = await db.select({ id: veilingProdutos.id, categoriaId: veilingProdutos.categoriaId }).from(veilingProdutos).where(eq(veilingProdutos.categoria, "")).execute();
  let corrigidos = 0;
  for (const p of semCategoria) {
    const catId = p.categoriaId || 0;
    const catNome = catMapById.get(catId) || catMapByCode.get(String(catId)) || catMapByCodeTrimmed.get(String(catId)) || "";
    if (catNome) {
      await db.update(veilingProdutos).set({ categoria: catNome }).where(eq(veilingProdutos.id, p.id)).execute();
      corrigidos++;
    }
  }
  return corrigidos;
}
async function listProdutosLoja(opts) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { busca, departamento, ativo, limit = 100, offset = 0 } = opts ?? {};
  const conditions = [];
  if (busca) {
    const b = busca.toLowerCase();
    conditions.push(or(sql`LOWER(${produtosLoja.nome}) LIKE ${`%${b}%`}`, sql`LOWER(${produtosLoja.codigo}) LIKE ${`%${b}%`}`, sql`LOWER(${produtosLoja.descricao}) LIKE ${`%${b}%`}`));
  }
  if (departamento) conditions.push(eq(produtosLoja.departamento, departamento));
  if (ativo !== void 0) conditions.push(eq(produtosLoja.ativo, ativo));
  const where = conditions.length > 0 ? and(...conditions) : void 0;
  const [items, countRows] = await Promise.all([
    db.select().from(produtosLoja).where(where).orderBy(asc(produtosLoja.nome)).limit(limit).offset(offset).execute(),
    db.select({ count: sql`count(*)` }).from(produtosLoja).where(where).execute()
  ]);
  return { items, total: Number(countRows[0]?.count ?? 0) };
}
async function getProdutoLoja(id) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(produtosLoja).where(eq(produtosLoja.id, id)).limit(1).execute();
  return rows[0] ?? null;
}
async function createProdutoLoja(data) {
  const db = await getDb();
  if (!db) throw new Error("DB n\xE3o dispon\xEDvel");
  const [result] = await db.insert(produtosLoja).values(data).execute();
  return { id: result.insertId };
}
async function updateProdutoLoja(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB n\xE3o dispon\xEDvel");
  await db.update(produtosLoja).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(produtosLoja.id, id)).execute();
  await syncProdutoLojaToLista(id, data);
  return { id };
}
async function syncProdutoLojaToLista(produtoLojaId, data) {
  const db = await getDb();
  if (!db) return;
  const { produtosLista: produtosLista3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const updateData = { updatedAt: /* @__PURE__ */ new Date() };
  if (data.nome) updateData.variedade = data.nome;
  if (data.departamento) updateData.categoriaNome = data.departamento;
  if (data.preco) updateData.valorUnitario = data.preco;
  if (data.ativo !== void 0) updateData.ativo = data.ativo;
  if (Object.keys(updateData).length > 1) {
    await db.update(produtosLista3).set(updateData).where(eq(produtosLista3.produtoLojaId, produtoLojaId)).execute();
  }
}
async function deleteProdutoLoja(id) {
  const db = await getDb();
  if (!db) throw new Error("DB n\xE3o dispon\xEDvel");
  const { produtosLista: produtosLista3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.update(produtosLista3).set({ produtoLojaId: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq(produtosLista3.produtoLojaId, id)).execute();
  await db.delete(produtosLoja).where(eq(produtosLoja.id, id)).execute();
}
async function listDepartamentosLoja() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.selectDistinct({ departamento: produtosLoja.departamento }).from(produtosLoja).where(and(sql`${produtosLoja.departamento} != ''`)).orderBy(asc(produtosLoja.departamento)).execute();
  return rows.map((r) => r.departamento).filter(Boolean);
}
async function getVeilingConversaoMap() {
  const db = await getDb();
  if (!db) return /* @__PURE__ */ new Map();
  try {
    const rows = await db.select({
      descCurta: veilingConversao.descCurta,
      descLonga: veilingConversao.descLonga,
      qtdVenda: veilingConversao.qtdVenda,
      fotoUrl: veilingConversao.fotoUrl,
      qualidade: veilingConversao.qualidade,
      observacao: veilingConversao.observacao,
      numGfp: veilingConversao.numGfp,
      icms: veilingConversao.icms
    }).from(veilingConversao).execute();
    const map = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const icmsVal = r.icms != null ? parseFloat(String(r.icms)) : null;
      const entry = { qtdVenda: r.qtdVenda, fotoUrl: r.fotoUrl ?? null, qualidade: r.qualidade ?? "", observacao: r.observacao ?? null, numGfp: r.numGfp ?? "", icms: icmsVal };
      if (r.descLonga) {
        const keyLonga = r.descLonga.trim().toUpperCase();
        map.set(keyLonga, entry);
      }
      const keyCurta = r.descCurta.trim().toUpperCase();
      if (!map.has(keyCurta)) map.set(keyCurta, entry);
    }
    return map;
  } catch {
    return /* @__PURE__ */ new Map();
  }
}
async function importVeilingConversao(rows) {
  const db = await getDb();
  if (!db) throw new Error("DB n\xE3o dispon\xEDvel");
  await db.execute(sql`TRUNCATE TABLE veiling_conversao`);
  let inserted = 0;
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await db.insert(veilingConversao).values(chunk.map((r) => ({
      codItem: r.codItem,
      descCurta: r.descCurta,
      descLonga: r.descLonga,
      qtdVenda: r.qtdVenda,
      fotoUrl: r.fotoUrl ?? null,
      qualidade: r.qualidade ?? "",
      observacao: r.observacao ?? null,
      numGfp: r.numGfp ?? "",
      icms: r.icms != null ? String(r.icms) : null
    }))).execute();
    inserted += chunk.length;
  }
  return inserted;
}
async function countVeilingConversao() {
  const db = await getDb();
  if (!db) return 0;
  try {
    const rows = await db.select({ count: sql`COUNT(*)` }).from(veilingConversao).execute();
    return Number(rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}
async function registrarSyncHistorico(data) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(syncHistorico).values(data).execute();
  } catch (err) {
    console.warn("[SyncHistorico] Falha ao registrar:", err);
  }
}
async function listarSyncHistorico(fonte, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  try {
    const where = fonte ? eq(syncHistorico.fonte, fonte) : void 0;
    return db.select().from(syncHistorico).where(where).orderBy(desc(syncHistorico.createdAt)).limit(limit).execute();
  } catch {
    return [];
  }
}
async function upsertProdutoLojaFromCompra(data) {
  const db = await getDb();
  if (!db) return;
  try {
    const nomeNorm = data.nome.trim().toUpperCase();
    if (!nomeNorm) return;
    const [existing] = await db.select().from(produtosLoja).where(sql`UPPER(TRIM(${produtosLoja.nome})) = ${nomeNorm}`).limit(1).execute();
    if (existing) {
      const novoEstoque = Number(existing.estoque) + (data.quantidade || 0);
      await db.update(produtosLoja).set({
        precoCusto: data.precoCusto !== void 0 ? String(data.precoCusto.toFixed(2)) : existing.precoCusto,
        estoque: String(novoEstoque.toFixed(3)),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(produtosLoja.id, existing.id)).execute();
    } else {
      await db.insert(produtosLoja).values({
        nome: nomeNorm,
        codigo: data.codigoExterno || null,
        precoCusto: data.precoCusto !== void 0 ? String(data.precoCusto.toFixed(2)) : "0.00",
        preco: data.precoCusto !== void 0 ? String((data.precoCusto * 1.3).toFixed(2)) : "0.00",
        estoque: String((data.quantidade || 0).toFixed(3)),
        unidade: "UN",
        departamento: "",
        ativo: 1
      }).execute();
    }
  } catch (err) {
    console.warn("[upsertProdutoLojaFromCompra] Falha:", err);
  }
}
async function createCatalogoVenda(data) {
  const db = await getDb();
  if (!db) throw new Error("DB indispon\xEDvel");
  const [result] = await db.insert(catalogosVenda).values(data);
  return result.insertId;
}
async function listCatalogosVenda() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(catalogosVenda).orderBy(catalogosVenda.createdAt);
  return rows;
}
async function getCatalogoVenda(id) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(catalogosVenda).where(eq(catalogosVenda.id, id));
  return rows[0] || null;
}
async function getCatalogoVendaByToken(token) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(catalogosVenda).where(eq(catalogosVenda.token, token));
  return rows[0] || null;
}
async function updateCatalogoVenda(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(catalogosVenda).set(data).where(eq(catalogosVenda.id, id));
}
async function deleteCatalogoVenda(id) {
  const db = await getDb();
  if (!db) return;
  const pedidos = await db.select({ id: catalogosPedidos.id }).from(catalogosPedidos).where(eq(catalogosPedidos.catalogoId, id));
  for (const p of pedidos) {
    await db.delete(catalogosPedidosItens).where(eq(catalogosPedidosItens.pedidoId, p.id));
  }
  await db.delete(catalogosPedidos).where(eq(catalogosPedidos.catalogoId, id));
  await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.catalogoId, id));
  await db.delete(catalogosVenda).where(eq(catalogosVenda.id, id));
}
async function addCatalogoItem(data) {
  const db = await getDb();
  if (!db) throw new Error("DB indispon\xEDvel");
  const [result] = await db.insert(catalogosVendaItens).values(data);
  return result.insertId;
}
async function removeCatalogoItem(itemId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.id, itemId));
}
async function listCatalogoItens(catalogoId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(catalogosVendaItens).where(eq(catalogosVendaItens.catalogoId, catalogoId)).orderBy(catalogosVendaItens.ordem, catalogosVendaItens.id);
}
async function clearCatalogoItens(catalogoId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.catalogoId, catalogoId));
}
async function createCatalogoPedido(pedido, itens) {
  const db = await getDb();
  if (!db) throw new Error("DB indispon\xEDvel");
  const [result] = await db.insert(catalogosPedidos).values(pedido);
  const pedidoId = result.insertId;
  if (itens.length > 0) {
    await db.insert(catalogosPedidosItens).values(itens.map((i) => ({ ...i, pedidoId })));
  }
  return pedidoId;
}
async function listCatalogoPedidos(catalogoId) {
  const db = await getDb();
  if (!db) return [];
  const pedidos = await db.select().from(catalogosPedidos).where(eq(catalogosPedidos.catalogoId, catalogoId)).orderBy(catalogosPedidos.createdAt);
  const result = [];
  for (const p of pedidos) {
    const itens = await db.select().from(catalogosPedidosItens).where(eq(catalogosPedidosItens.pedidoId, p.id));
    result.push({ ...p, itens });
  }
  return result;
}
async function listAllCatalogoPedidos() {
  const db = await getDb();
  if (!db) return [];
  const pedidos = await db.select().from(catalogosPedidos).orderBy(catalogosPedidos.createdAt);
  const result = [];
  for (const p of pedidos) {
    const itens = await db.select().from(catalogosPedidosItens).where(eq(catalogosPedidosItens.pedidoId, p.id));
    result.push({ ...p, itens });
  }
  return result;
}
async function updateCatalogoPedidoStatus(pedidoId, status, vendaId) {
  const db = await getDb();
  if (!db) return;
  const updateData = { status };
  if (vendaId !== void 0) updateData.vendaId = vendaId;
  await db.update(catalogosPedidos).set(updateData).where(eq(catalogosPedidos.id, pedidoId));
}
async function getCatalogoPedidoById(pedidoId) {
  const db = await getDb();
  if (!db) return null;
  const [pedido] = await db.select().from(catalogosPedidos).where(eq(catalogosPedidos.id, pedidoId));
  if (!pedido) return null;
  const itens = await db.select().from(catalogosPedidosItens).where(eq(catalogosPedidosItens.pedidoId, pedidoId));
  return { ...pedido, itens };
}
async function addItemToPedidoCompra(pedidoId, item) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.insert(pedidoCompraItens).values({
    pedidoCompraId: pedidoId,
    produtoId: null,
    produtoNome: item.produtoNome,
    quantidade: item.quantidade,
    precoVenda: item.precoVenda,
    subtotalVenda: item.subtotalVenda
  }).execute();
  const itens = await db.select().from(pedidoCompraItens).where(eq(pedidoCompraItens.pedidoCompraId, pedidoId)).execute();
  const novoTotal = itens.reduce((acc, i) => acc + parseFloat(String(i.subtotalVenda) || "0"), 0);
  await db.update(pedidosCompra).set({ total: novoTotal.toFixed(2) }).where(eq(pedidosCompra.id, pedidoId)).execute();
}
async function criarMovimentacaoEstoque(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const [prod] = await db.select({ estoque: produtosLoja.estoque }).from(produtosLoja).where(eq(produtosLoja.id, data.produtoId));
  if (!prod) throw new Error("Produto n\xE3o encontrado");
  const estoqueAntes = parseFloat(String(prod.estoque || "0"));
  let estoqueDepois;
  if (data.tipo === "ENTRADA") {
    estoqueDepois = estoqueAntes + data.quantidade;
  } else if (data.tipo === "SAIDA") {
    estoqueDepois = estoqueAntes - data.quantidade;
  } else {
    estoqueDepois = data.quantidade;
  }
  await db.insert(estoqueMovimentacoes).values({
    produtoId: data.produtoId,
    tipo: data.tipo,
    quantidade: String(data.tipo === "AJUSTE" ? Math.abs(estoqueDepois - estoqueAntes) : data.quantidade),
    estoqueAntes: String(estoqueAntes),
    estoqueDepois: String(estoqueDepois),
    justificativa: data.justificativa,
    usuarioNome: data.usuarioNome,
    usuarioId: data.usuarioId || ""
  }).execute();
  await db.update(produtosLoja).set({ estoque: String(estoqueDepois) }).where(eq(produtosLoja.id, data.produtoId)).execute();
  return { estoqueAntes, estoqueDepois };
}
async function listarMovimentacoesEstoque(params) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  if (params.produtoId) conditions.push(eq(estoqueMovimentacoes.produtoId, params.produtoId));
  if (params.tipo) conditions.push(eq(estoqueMovimentacoes.tipo, params.tipo));
  if (params.usuarioNome) conditions.push(like(estoqueMovimentacoes.usuarioNome, `%${params.usuarioNome}%`));
  const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
  const [countResult] = await db.select({ count: sql`COUNT(*)` }).from(estoqueMovimentacoes).where(whereClause);
  const items = await db.select({
    id: estoqueMovimentacoes.id,
    produtoId: estoqueMovimentacoes.produtoId,
    produtoNome: produtosLoja.nome,
    produtoCodigo: produtosLoja.codigo,
    tipo: estoqueMovimentacoes.tipo,
    quantidade: estoqueMovimentacoes.quantidade,
    estoqueAntes: estoqueMovimentacoes.estoqueAntes,
    estoqueDepois: estoqueMovimentacoes.estoqueDepois,
    justificativa: estoqueMovimentacoes.justificativa,
    usuarioNome: estoqueMovimentacoes.usuarioNome,
    usuarioId: estoqueMovimentacoes.usuarioId,
    createdAt: estoqueMovimentacoes.createdAt
  }).from(estoqueMovimentacoes).leftJoin(produtosLoja, eq(estoqueMovimentacoes.produtoId, produtosLoja.id)).where(whereClause).orderBy(desc(estoqueMovimentacoes.createdAt)).limit(params.limit || 100).offset(params.offset || 0);
  return { items, total: Number(countResult?.count || 0) };
}
async function relatorioEstoqueProdutos() {
  const db = await getDb();
  if (!db) return [];
  const produtos2 = await db.select({
    id: produtosLoja.id,
    codigo: produtosLoja.codigo,
    nome: produtosLoja.nome,
    departamento: produtosLoja.departamento,
    unidade: produtosLoja.unidade,
    estoque: produtosLoja.estoque,
    ativo: produtosLoja.ativo
  }).from(produtosLoja).where(eq(produtosLoja.ativo, 1)).orderBy(produtosLoja.nome);
  const result = [];
  for (const p of produtos2) {
    const [stats] = await db.select({
      totalEntradas: sql`COALESCE(SUM(CASE WHEN tipo = 'ENTRADA' THEN quantidade ELSE 0 END), 0)`,
      totalSaidas: sql`COALESCE(SUM(CASE WHEN tipo = 'SAIDA' THEN quantidade ELSE 0 END), 0)`,
      totalAjustes: sql`COALESCE(COUNT(CASE WHEN tipo = 'AJUSTE' THEN 1 END), 0)`,
      totalMovimentacoes: sql`COUNT(*)`
    }).from(estoqueMovimentacoes).where(eq(estoqueMovimentacoes.produtoId, p.id));
    result.push({
      ...p,
      totalEntradas: Number(stats?.totalEntradas || 0),
      totalSaidas: Number(stats?.totalSaidas || 0),
      totalAjustes: Number(stats?.totalAjustes || 0),
      totalMovimentacoes: Number(stats?.totalMovimentacoes || 0)
    });
  }
  return result;
}
async function applyTabela3ToProducts(items, usuarioNome = "SISTEMA") {
  const db = await getDb();
  if (!db) throw new Error("DB n\xE3o dispon\xEDvel");
  let atualizados = 0;
  const historico = [];
  for (const item of items) {
    const preco3 = parseFloat(item.preco3);
    if (!preco3 || preco3 <= 0) continue;
    const precoStr = preco3.toFixed(2);
    if (item.produtoId) {
      const [existing] = await db.select().from(produtos).where(eq(produtos.id, item.produtoId)).limit(1);
      if (existing) {
        const precoAnterior = String(existing.preco ?? "0.00");
        await db.update(produtos).set({ preco: precoStr }).where(eq(produtos.id, item.produtoId));
        await db.insert(historicoAlteracoes).values({
          tabela: "produtos",
          registroId: item.produtoId,
          campo: "preco",
          valorAntigo: precoAnterior,
          valorNovo: precoStr,
          usuarioNome
        });
        historico.push({ nome: item.produtoNome, precoAnterior, precoNovo: precoStr });
        atualizados++;
      }
    }
    const nomeNorm = item.produtoNome.trim().toUpperCase();
    const lojaRows = await db.select().from(produtosLoja).where(sql`UPPER(TRIM(${produtosLoja.nome})) = ${nomeNorm}`).limit(5);
    for (const loja of lojaRows) {
      await db.update(produtosLoja).set({ preco: precoStr, updatedAt: /* @__PURE__ */ new Date() }).where(eq(produtosLoja.id, loja.id));
    }
  }
  return { atualizados, historico };
}
async function syncCatalogosVendaAposSync(fonte) {
  const db = await getDb();
  if (!db) return { removidos: 0, atualizados: 0 };
  const itens = await db.select().from(catalogosVendaItens).where(eq(catalogosVendaItens.origem, fonte));
  let removidos = 0;
  let atualizados = 0;
  for (const item of itens) {
    if (fonte === "veiling") {
      const nomeItem = item.nome?.trim().toUpperCase();
      if (!nomeItem) continue;
      const prods = await db.select().from(veilingProdutos).where(eq(veilingProdutos.nomeCompleto, item.nome?.trim() || ""));
      let prodsValidos = prods.filter((p) => {
        const c = Math.min(
          ...[p.precoCarrinho, p.precoCamada, p.precoEmbalagem].map((v) => v != null ? Number(v) : Infinity).filter((v) => v > 0 && isFinite(v))
        );
        return isFinite(c);
      });
      if (prodsValidos.length === 0 && prods.length === 0) {
        const offerId = parseInt(item.produtoId);
        if (!isNaN(offerId)) {
          const prodsById = await db.select().from(veilingProdutos).where(eq(veilingProdutos.offerId, offerId));
          prodsValidos = prodsById.filter((p) => {
            const c = Math.min(
              ...[p.precoCarrinho, p.precoCamada, p.precoEmbalagem].map((v) => v != null ? Number(v) : Infinity).filter((v) => v > 0 && isFinite(v))
            );
            return isFinite(c);
          });
        }
      }
      if (prodsValidos.length === 0) {
        await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.id, item.id));
        removidos++;
        continue;
      }
      const prodComEstoque = prodsValidos.find((p) => p.estoqueDisponivel != null && Number(p.estoqueDisponivel) > 0);
      if (!prodComEstoque && prodsValidos.every((p) => p.estoqueDisponivel != null && Number(p.estoqueDisponivel) <= 0)) {
        await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.id, item.id));
        removidos++;
        continue;
      }
      const cfg = await getVeilingConfig();
      const conversaoMap = await getVeilingConversaoMap();
      const margemEfetiva = parseFloat(String(cfg?.margemGlobal || "40"));
      const prod = prodsValidos[0];
      const _embS = prodsValidos[0].precoEmbalagem != null ? Number(prodsValidos[0].precoEmbalagem) : 0;
      const _camS = prodsValidos[0].precoCamada != null ? Number(prodsValidos[0].precoCamada) : 0;
      const _carS = prodsValidos[0].precoCarrinho != null ? Number(prodsValidos[0].precoCarrinho) : 0;
      const custoBase = _embS > 0 ? _embS : _camS > 0 ? _camS : _carS;
      const convKey = prod.nomeCompleto ? prod.nomeCompleto.trim().toUpperCase() : prod.nome.trim().toUpperCase();
      const conv = conversaoMap.get(convKey) || conversaoMap.get(prod.nome.trim().toUpperCase());
      const qtdVenda = conv?.qtdVenda ?? Number(prod.multiplo) ?? 1;
      const freteUnitSync = prodsValidos[0].frete != null ? Number(prodsValidos[0].frete) : 0;
      const custoComFreteSync = custoBase + freteUnitSync;
      const icmsFatorSync = conv?.icms != null ? parseFloat(String(conv.icms)) : null;
      const custoFinal = icmsFatorSync && icmsFatorSync > 0 && icmsFatorSync < 1 ? Math.round(custoComFreteSync / icmsFatorSync * 100) / 100 : custoComFreteSync;
      const novoPreco = custoFinal > 0 ? parseFloat((custoFinal * (1 + margemEfetiva / 100) * qtdVenda).toFixed(2)) : null;
      const precoAtual = item.preco != null ? parseFloat(String(item.preco)) : null;
      if (novoPreco !== null && precoAtual !== novoPreco) {
        await db.update(catalogosVendaItens).set({ preco: String(novoPreco) }).where(eq(catalogosVendaItens.id, item.id));
        atualizados++;
      }
    } else if (fonte === "cooperflora") {
      const [prod] = await db.select().from(cooperfloraProdutos).where(eq(cooperfloraProdutos.codigo, item.produtoId)).limit(1);
      if (!prod) {
        await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.id, item.id));
        removidos++;
        continue;
      }
      if (prod.estoque !== null && Number(prod.estoque) <= 0) {
        await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.id, item.id));
        removidos++;
        continue;
      }
      const cfg = await getCooperfloraConfig();
      ;
      const margem = parseFloat(String(cfg?.margemPadrao || "30")) / 100;
      const precoBase = parseFloat(String(prod.precoMin || "0"));
      const novoPreco = precoBase > 0 ? parseFloat((precoBase * (1 + margem)).toFixed(2)) : null;
      const precoAtual = item.preco != null ? parseFloat(String(item.preco)) : null;
      if (novoPreco !== null && precoAtual !== novoPreco) {
        await db.update(catalogosVendaItens).set({ preco: String(novoPreco) }).where(eq(catalogosVendaItens.id, item.id));
        atualizados++;
      }
    }
  }
  return { removidos, atualizados };
}
async function updateCatalogoPedidoStatusComMotivo(pedidoId, status, motivoRecusa) {
  const db = await getDb();
  if (!db) return;
  await db.update(catalogosPedidos).set({ status, motivoRecusa: motivoRecusa || null }).where(eq(catalogosPedidos.id, pedidoId));
}
function extrairCorDoProduto(nome) {
  const nomeUpper = nome.toUpperCase();
  for (const cor of CORES_FLORES) {
    const regex = new RegExp(`(^|\\s|/)${cor}(\\s|/|$)`);
    if (regex.test(nomeUpper)) {
      if (cor === "BRANCO") return "BRANCA";
      if (cor === "VERMELHO") return "VERMELHA";
      if (cor === "AMARELO") return "AMARELA";
      if (cor === "ROXO") return "ROXA";
      if (cor === "LILAS" || cor === "LIL\xC1S") return "LIL\xC1S";
      if (cor === "SALMAO") return "SALM\xC3O";
      if (cor === "BORDO") return "BORD\xD4";
      if (cor === "PRETO") return "PRETA";
      if (cor === "MISTO" || cor === "COLORIDO") return "MISTA";
      return cor;
    }
  }
  return null;
}
async function getVeilingCores() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ nome: veilingProdutos.nomeCompleto }).from(veilingProdutos).execute();
  const coresSet = /* @__PURE__ */ new Set();
  for (const row of rows) {
    const cor = extrairCorDoProduto(row.nome || "");
    if (cor) coresSet.add(cor);
  }
  return Array.from(coresSet).sort();
}
async function createVeilingImportacao(data) {
  const db = await getDb();
  if (!db) throw new Error("DB n\xE3o dispon\xEDvel");
  const [result] = await db.insert(veilingImportacoes).values(data).execute();
  return result?.insertId ?? 0;
}
async function listVeilingImportacoes(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(veilingImportacoes).orderBy(desc(veilingImportacoes.dataImportacao)).limit(limit).execute();
}
async function updateCompra(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(compras).set(data).where(eq(compras.id, id));
}
async function deleteCompra(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(compraItens).where(eq(compraItens.compraId, id));
  await db.delete(compras).where(eq(compras.id, id));
}
async function updateCompraStatus(id, status) {
  const db = await getDb();
  if (!db) return;
  await db.update(compras).set({ status }).where(eq(compras.id, id));
}
async function updateCompraItem(itemId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(compraItens).set(data).where(eq(compraItens.id, itemId));
}
async function deleteCompraItem(itemId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(compraItens).where(eq(compraItens.id, itemId));
}
async function addCompraItem(compraId, data) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(compraItens).values({ ...data, compraId });
  return result.insertId;
}
async function recalcCompraTotal(compraId) {
  const db = await getDb();
  if (!db) return;
  const itens = await db.select().from(compraItens).where(eq(compraItens.compraId, compraId));
  const total = itens.reduce((s, i) => s + parseFloat(i.subtotal || "0"), 0);
  await db.update(compras).set({ total: total.toFixed(2) }).where(eq(compras.id, compraId));
}
async function searchProdutosSemelhanca(termo, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const t2 = `%${termo}%`;
  return db.select({
    id: produtos.id,
    descricao: produtos.descricao,
    custo: produtos.custo
  }).from(produtos).where(or(like(produtos.descricao, t2), like(produtos.codigoExterno, t2))).limit(limit);
}
async function searchProdutosLojaSemelhanca(termo, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const t2 = `%${termo}%`;
  return db.select({
    id: produtosLoja.id,
    nome: produtosLoja.nome,
    precoCusto: produtosLoja.precoCusto,
    unidade: produtosLoja.unidade
  }).from(produtosLoja).where(like(produtosLoja.nome, t2)).limit(limit);
}
async function checkTransacoesExistentes(numeros) {
  const db = await getDb();
  if (!db || numeros.length === 0) return [];
  return db.select({
    transacaoGfp: compraItens.transacaoGfp,
    compraId: compraItens.compraId
  }).from(compraItens).where(inArray(compraItens.transacaoGfp, numeros));
}
async function getAppConfig(chave) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(appConfig).where(eq(appConfig.chave, chave)).limit(1);
  return rows[0]?.valor ?? null;
}
async function setAppConfig(chave, valor) {
  const db = await getDb();
  if (!db) return;
  await db.insert(appConfig).values({ chave, valor }).onDuplicateKeyUpdate({ set: { valor } });
}
async function getValidadePrecosVeiling() {
  const valor = await getAppConfig("VALIDADE_PRECOS_VEILING_DIAS");
  return valor ? parseInt(valor, 10) : 7;
}
async function setValidadePrecosVeiling(dias) {
  await setAppConfig("VALIDADE_PRECOS_VEILING_DIAS", String(dias));
}
async function getValidadePrecosCooperflora() {
  const valor = await getAppConfig("VALIDADE_PRECOS_COOPERFLORA_DIAS");
  return valor ? parseInt(valor, 10) : 7;
}
async function setValidadePrecosCooperflora(dias) {
  await setAppConfig("VALIDADE_PRECOS_COOPERFLORA_DIAS", String(dias));
}
async function listVendasExpiradas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vendas).where(and(eq(vendas.status, "EXPIRADO"), isNull(vendas.deletedAt))).orderBy(desc(vendas.updatedAt));
}
async function expirarVendasVencidas() {
  const db = await getDb();
  if (!db) return 0;
  const hoje = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const result = await db.update(vendas).set({ status: "EXPIRADO" }).where(and(
    eq(vendas.status, "AGUARDANDO"),
    isNull(vendas.deletedAt),
    sql`\`vencimento\` IS NOT NULL AND \`vencimento\` < ${hoje}`
  ));
  return result[0]?.affectedRows ?? 0;
}
async function sincronizarPedidosCompraAoAlterarOrcamento(vendaId, novoItens) {
  const db = await getDb();
  if (!db) return;
  const { sql: sqlFn, sql: sql3 } = await import("drizzle-orm");
  const pedidosRes = await db.execute(sqlFn`
    SELECT DISTINCT pedidoCompraId FROM pedido_compra_itens 
    WHERE vendaOrigemId = ${vendaId}
  `);
  const pedidos = pedidosRes[0];
  if (!pedidos || pedidos.length === 0) return;
  for (const pedidoRow of pedidos) {
    const pedidoId = pedidoRow.pedidoCompraId;
    const todosItensRes = await db.execute(sqlFn`
      SELECT id, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda, vendaOrigemId 
      FROM pedido_compra_itens
      WHERE pedidoCompraId = ${pedidoId}
    `);
    const todosItensExistentes = todosItensRes[0];
    const mapaConsolidado = /* @__PURE__ */ new Map();
    for (const item of todosItensExistentes) {
      if (Number(item.vendaOrigemId) !== Number(vendaId)) {
        const chave = `${item.produtoNome}||${parseFloat(item.precoVenda)}`;
        mapaConsolidado.set(chave, {
          id: item.id,
          produtoId: item.produtoId || null,
          produtoNome: item.produtoNome,
          quantidade: parseFloat(item.quantidade),
          precoVenda: parseFloat(item.precoVenda),
          subtotalVenda: parseFloat(item.subtotalVenda),
          vendaOrigemId: item.vendaOrigemId ? Number(item.vendaOrigemId) : null
        });
      }
    }
    const mapaNovoOrcamento = /* @__PURE__ */ new Map();
    for (const novoItem of novoItens) {
      const valorUnitario = typeof novoItem.valorUnitario === "string" ? parseFloat(novoItem.valorUnitario) : novoItem.valorUnitario || 0;
      const quantidade = typeof novoItem.quantidade === "string" ? parseFloat(novoItem.quantidade) : novoItem.quantidade || 0;
      const subtotal = typeof novoItem.subtotal === "string" ? parseFloat(novoItem.subtotal) : novoItem.subtotal || 0;
      const chave = `${novoItem.produtoNome}||${valorUnitario}`;
      if (mapaNovoOrcamento.has(chave)) {
        const existing = mapaNovoOrcamento.get(chave);
        existing.quantidade += quantidade;
        existing.subtotalVenda += subtotal;
      } else {
        mapaNovoOrcamento.set(chave, {
          id: 0,
          produtoId: novoItem.produtoId || null,
          produtoNome: novoItem.produtoNome || "",
          quantidade,
          precoVenda: valorUnitario,
          subtotalVenda: subtotal,
          vendaOrigemId: vendaId
        });
      }
    }
    for (const [chave, novoItemConsolidado] of Array.from(mapaNovoOrcamento.entries())) {
      if (mapaConsolidado.has(chave)) {
        const existing = mapaConsolidado.get(chave);
        existing.quantidade += novoItemConsolidado.quantidade;
        existing.subtotalVenda += novoItemConsolidado.subtotalVenda;
      } else {
        mapaConsolidado.set(chave, novoItemConsolidado);
      }
    }
    const itensConsolidados = Array.from(mapaConsolidado.values()).sort(
      (a, b) => a.produtoNome.localeCompare(b.produtoNome, "pt-BR")
    );
    await db.execute(sqlFn`DELETE FROM pedido_compra_itens WHERE pedidoCompraId = ${pedidoId}`);
    let totalPedido = 0;
    for (const item of itensConsolidados) {
      await db.execute(sqlFn`
        INSERT INTO pedido_compra_itens (pedidoCompraId, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda, vendaOrigemId)
        VALUES (${pedidoId}, ${item.produtoId}, ${item.produtoNome}, ${item.quantidade}, ${item.precoVenda}, ${item.subtotalVenda}, ${item.vendaOrigemId})
      `);
      totalPedido += item.subtotalVenda;
    }
    await db.execute(sqlFn`
      UPDATE pedidos_compra SET total = ${totalPedido}, updatedAt = NOW() WHERE id = ${pedidoId}
    `);
  }
}
async function createVeilingCatalogoLink(expiresAt, createdBy, filtroCategoria, filtroProdutor, filtroCor, filtroBusca) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  expiresAt.setMilliseconds(0);
  const sanitizedCreatedBy = (createdBy || "system").replace(/[^a-zA-Z0-9\s@._-]/g, "").substring(0, 255).trim() || "system";
  const result = await db.insert(veilingCatalogoLinks).values({
    token,
    expiresAt,
    createdBy: sanitizedCreatedBy,
    filtroCategoria: filtroCategoria || "",
    filtroProdutor: filtroProdutor || "",
    filtroCor: filtroCor || "",
    filtroBusca: filtroBusca || ""
  });
  return { token, expiresAt, createdBy: sanitizedCreatedBy, createdAt: /* @__PURE__ */ new Date(), filtroCategoria: filtroCategoria || "", filtroProdutor: filtroProdutor || "", filtroCor: filtroCor || "", filtroBusca: filtroBusca || "" };
}
async function getVeilingCatalogoLink(token) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const link = await db.select().from(veilingCatalogoLinks).where(eq(veilingCatalogoLinks.token, token)).limit(1);
  if (!link.length) return null;
  const linkData = link[0];
  if (/* @__PURE__ */ new Date() > linkData.expiresAt) {
    return null;
  }
  return linkData;
}
async function deleteVeilingCatalogoLink(token) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.delete(veilingCatalogoLinks).where(eq(veilingCatalogoLinks.token, token));
}
async function listVeilingCatalogoLinks() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const links = await db.select().from(veilingCatalogoLinks).orderBy(desc(veilingCatalogoLinks.createdAt));
  return links.map((link) => ({
    ...link,
    isExpired: /* @__PURE__ */ new Date() > link.expiresAt
  }));
}
async function createPedidoPublico(data, itens, itemsWithIds) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [result] = await db.insert(pedidosPublicos).values(data);
  const pedidoId = result.insertId || 0;
  if (itens.length > 0 && pedidoId) {
    const itensComPedidoId = itens.map((item) => ({
      ...item,
      pedidoPublicoId: pedidoId
    }));
    await db.insert(pedidosPublicosItens).values(itensComPedidoId);
  }
  if (itemsWithIds && itemsWithIds.length > 0) {
    for (const item of itemsWithIds) {
      if (item.produtoId) {
        const produto = await db.select().from(produtosCustomizados).where(eq(produtosCustomizados.id, item.produtoId));
        if (produto.length > 0) {
          const estoqueAtual = Number(produto[0].estoque) || 0;
          const novoEstoque = Math.max(0, estoqueAtual - item.quantidade);
          await db.update(produtosCustomizados).set({
            estoque: novoEstoque,
            ativo: novoEstoque > 0 ? 1 : 0
          }).where(eq(produtosCustomizados.id, item.produtoId));
        }
      }
    }
  }
  return { id: pedidoId, ...data };
}
async function getPedidoPublico(id) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const pedido = await db.select().from(pedidosPublicos).where(eq(pedidosPublicos.id, id));
  if (!pedido.length) return null;
  const itens = await db.select().from(pedidosPublicosItens).where(eq(pedidosPublicosItens.pedidoPublicoId, id));
  return {
    ...pedido[0],
    itens
  };
}
async function listPedidosPublicos(linkToken) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  if (linkToken) {
    return await db.select().from(pedidosPublicos).where(eq(pedidosPublicos.linkToken, linkToken)).orderBy(desc(pedidosPublicos.createdAt));
  }
  return await db.select().from(pedidosPublicos).orderBy(desc(pedidosPublicos.createdAt));
}
async function updatePedidoPublicoVendaId(id, vendaId) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.update(pedidosPublicos).set({ vendaId, status: "CONVERTIDO" }).where(eq(pedidosPublicos.id, id));
}
async function updatePedidoPublicoStatus(id, status) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.update(pedidosPublicos).set({ status }).where(eq(pedidosPublicos.id, id));
}
async function saveVeilingFiltro(userId, nome, categoria, produtor, cor, busca) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [result] = await db.insert(veilingFiltrosSalvos).values({
    userId,
    nome,
    categoria,
    produtor,
    cor,
    busca
  });
  return result;
}
async function listVeilingFiltros(userId) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const filtros = await db.select().from(veilingFiltrosSalvos).where(eq(veilingFiltrosSalvos.userId, userId));
  return filtros;
}
async function getVeilingFiltro(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const filtro = await db.select().from(veilingFiltrosSalvos).where(
    and(eq(veilingFiltrosSalvos.id, id), eq(veilingFiltrosSalvos.userId, userId))
  ).limit(1);
  return filtro.length > 0 ? filtro[0] : null;
}
async function deleteVeilingFiltro(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.delete(veilingFiltrosSalvos).where(
    and(eq(veilingFiltrosSalvos.id, id), eq(veilingFiltrosSalvos.userId, userId))
  );
  return { ok: true };
}
async function updateVeilingFiltro(id, userId, nome, categoria, produtor, cor, busca) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.update(veilingFiltrosSalvos).set({
    nome,
    categoria,
    produtor,
    cor,
    busca,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(
    and(eq(veilingFiltrosSalvos.id, id), eq(veilingFiltrosSalvos.userId, userId))
  );
  return { ok: true };
}
async function getVendasFaturadosIds(ids) {
  if (!ids.length) return [];
  const db = await getDb();
  if (!db) return [];
  const chunkSize = 100;
  const allResults = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { vendasEfetivas: vendasEfetivas2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { inArray: inArray3 } = await import("drizzle-orm");
    const rows = await db.select({ orcamentoId: vendasEfetivas2.orcamentoId }).from(vendasEfetivas2).where(inArray3(vendasEfetivas2.orcamentoId, chunk));
    allResults.push(...rows.map((r) => r.orcamentoId));
  }
  return allResults;
}
async function isVendaFaturada(vendaId) {
  const ids = await getVendasFaturadosIds([vendaId]);
  return ids.length > 0;
}
async function createPromocao(data) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { promocoes: promocoes2, promocoesItens: promocoesItens2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const [result] = await db.insert(promocoes2).values({
    titulo: data.titulo,
    descricao: data.descricao,
    tipoDesconto: data.tipoDesconto,
    valorDesconto: String(data.valorDesconto),
    imagemUrl: data.imagemUrl,
    imagemBase64: data.imagemBase64,
    criadoPor: data.criadoPor
  });
  const promocaoId = result.insertId;
  if (data.itens && data.itens.length > 0) {
    for (const item of data.itens) {
      if (!db) throw new Error("Database connection failed");
      await db.insert(promocoesItens2).values({
        promocaoId,
        produtoId: item.produtoId,
        produtoNome: item.produtoNome,
        precoOriginal: String(item.precoOriginal),
        precoPromocional: String(item.precoPromocional),
        imagemUrl: item.imagemUrl,
        catalogo: item.catalogo
      });
    }
  }
  return promocaoId;
}
async function getPromocoes(ativo) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { promocoes: promocoes2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  if (ativo !== void 0) {
    return db.select().from(promocoes2).where(eq3(promocoes2.ativo, ativo ? 1 : 0));
  }
  return db.select().from(promocoes2);
}
async function getPromocaoById(id) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { promocoes: promocoes2, promocoesItens: promocoesItens2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  const [promo] = await db.select().from(promocoes2).where(eq3(promocoes2.id, id));
  if (!promo) return null;
  const itens = await db.select().from(promocoesItens2).where(eq3(promocoesItens2.promocaoId, id));
  return { ...promo, itens };
}
async function updatePromocao(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { promocoes: promocoes2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  const updateData = {};
  if (data.titulo !== void 0) updateData.titulo = data.titulo;
  if (data.descricao !== void 0) updateData.descricao = data.descricao;
  if (data.tipoDesconto !== void 0) updateData.tipoDesconto = data.tipoDesconto;
  if (data.valorDesconto !== void 0) updateData.valorDesconto = String(data.valorDesconto);
  if (data.imagemUrl !== void 0) updateData.imagemUrl = data.imagemUrl;
  if (data.imagemBase64 !== void 0) updateData.imagemBase64 = data.imagemBase64;
  if (data.ativo !== void 0) updateData.ativo = data.ativo ? 1 : 0;
  await db.update(promocoes2).set(updateData).where(eq3(promocoes2.id, id));
}
async function deletePromocao(id) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { promocoes: promocoes2, promocoesItens: promocoesItens2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  await db.delete(promocoesItens2).where(eq3(promocoesItens2.promocaoId, id));
  await db.delete(promocoes2).where(eq3(promocoes2.id, id));
}
async function listCategoriasProdutos() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { categoriasProdutos: categoriasProdutos3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { asc: asc2 } = await import("drizzle-orm");
  return db.select().from(categoriasProdutos3).orderBy(asc2(categoriasProdutos3.ordem), asc2(categoriasProdutos3.nome));
}
async function createCategoriaProduto(data) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { categoriasProdutos: categoriasProdutos3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const [result] = await db.insert(categoriasProdutos3).values({
    nome: data.nome,
    descricao: data.descricao,
    ordem: data.ordem ?? 0
  });
  return { id: result.insertId };
}
async function updateCategoriaProduto(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { categoriasProdutos: categoriasProdutos3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  const upd = {};
  if (data.nome !== void 0) upd.nome = data.nome;
  if (data.descricao !== void 0) upd.descricao = data.descricao;
  if (data.ordem !== void 0) upd.ordem = data.ordem;
  if (data.ativo !== void 0) upd.ativo = data.ativo ? 1 : 0;
  await db.update(categoriasProdutos3).set(upd).where(eq3(categoriasProdutos3.id, id));
}
async function deleteCategoriaProduto(id) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { categoriasProdutos: categoriasProdutos3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  await db.delete(categoriasProdutos3).where(eq3(categoriasProdutos3.id, id));
}
async function listListasPrecos() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPrecos: listasPrecos3, listasItens: listasItens3, listasPedidos: listasPedidos3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { desc: desc2, eq: eq3, sql: sql3 } = await import("drizzle-orm");
  const listas = await db.select().from(listasPrecos3).orderBy(desc2(listasPrecos3.createdAt));
  const itensCount = await db.select({
    listaId: listasItens3.listaId,
    count: sql3`COUNT(*)`
  }).from(listasItens3).groupBy(listasItens3.listaId);
  const pedidosCount = await db.select({
    listaId: listasPedidos3.listaId,
    count: sql3`COUNT(*)`,
    novos: sql3`SUM(CASE WHEN ${listasPedidos3.status} = 'NOVO' THEN 1 ELSE 0 END)`
  }).from(listasPedidos3).groupBy(listasPedidos3.listaId);
  return listas.map((l) => ({
    ...l,
    totalItens: Number(itensCount.find((i) => i.listaId === l.id)?.count ?? 0),
    totalPedidos: Number(pedidosCount.find((p) => p.listaId === l.id)?.count ?? 0),
    pedidosNovos: Number(pedidosCount.find((p) => p.listaId === l.id)?.novos ?? 0)
  }));
}
async function getListaPrecoByToken(token) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPrecos: listasPrecos3, listasItens: listasItens3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3, asc: asc2 } = await import("drizzle-orm");
  const [lista] = await db.select().from(listasPrecos3).where(eq3(listasPrecos3.token, token));
  if (!lista) return null;
  const itens = await db.select().from(listasItens3).where(eq3(listasItens3.listaId, lista.id)).orderBy(asc2(listasItens3.categoriaNome), asc2(listasItens3.ordem), asc2(listasItens3.variedade));
  return { ...lista, itens };
}
async function getListaPrecoById(id) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPrecos: listasPrecos3, listasItens: listasItens3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3, asc: asc2 } = await import("drizzle-orm");
  const [lista] = await db.select().from(listasPrecos3).where(eq3(listasPrecos3.id, id));
  if (!lista) return null;
  const itens = await db.select().from(listasItens3).where(eq3(listasItens3.listaId, lista.id)).orderBy(asc2(listasItens3.categoriaNome), asc2(listasItens3.ordem), asc2(listasItens3.variedade));
  return { ...lista, itens };
}
async function createListaPreco(data) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPrecos: listasPrecos3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const [result] = await db.insert(listasPrecos3).values({
    titulo: data.titulo,
    subtitulo: data.subtitulo,
    token: data.token,
    expiresAt: data.expiresAt,
    aceitaPedidos: data.aceitaPedidos !== false ? 1 : 0,
    criadoPor: data.criadoPor,
    observacao: data.observacao
  });
  return { id: result.insertId };
}
async function updateListaPreco(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPrecos: listasPrecos3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  const upd = {};
  if (data.titulo !== void 0) upd.titulo = data.titulo;
  if (data.subtitulo !== void 0) upd.subtitulo = data.subtitulo;
  if (data.expiresAt !== void 0) upd.expiresAt = data.expiresAt;
  if (data.ativo !== void 0) upd.ativo = data.ativo ? 1 : 0;
  if (data.aceitaPedidos !== void 0) upd.aceitaPedidos = data.aceitaPedidos ? 1 : 0;
  if (data.observacao !== void 0) upd.observacao = data.observacao;
  await db.update(listasPrecos3).set(upd).where(eq3(listasPrecos3.id, id));
}
async function deleteListaPreco(id) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPrecos: listasPrecos3, listasItens: listasItens3, listasPedidos: listasPedidos3, listasPedidosItens: listasPedidosItens3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  const pedidos = await db.select({ id: listasPedidos3.id }).from(listasPedidos3).where(eq3(listasPedidos3.listaId, id));
  for (const p of pedidos) {
    await db.delete(listasPedidosItens3).where(eq3(listasPedidosItens3.pedidoId, p.id));
  }
  await db.delete(listasPedidos3).where(eq3(listasPedidos3.listaId, id));
  await db.delete(listasItens3).where(eq3(listasItens3.listaId, id));
  await db.delete(listasPrecos3).where(eq3(listasPrecos3.id, id));
}
async function addListaItem(data) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasItens: listasItens3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const [result] = await db.insert(listasItens3).values({
    listaId: data.listaId,
    categoriaId: data.categoriaId,
    categoriaNome: data.categoriaNome,
    variedade: data.variedade,
    tamanho: data.tamanho,
    qtdHasteMaco: data.qtdHasteMaco,
    valorUnitario: String(data.valorUnitario),
    ordem: data.ordem ?? 0
  });
  return { id: result.insertId };
}
async function updateListaItem(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasItens: listasItens3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  const upd = {};
  if (data.categoriaNome !== void 0) upd.categoriaNome = data.categoriaNome;
  if (data.variedade !== void 0) upd.variedade = data.variedade;
  if (data.tamanho !== void 0) upd.tamanho = data.tamanho;
  if (data.qtdHasteMaco !== void 0) upd.qtdHasteMaco = data.qtdHasteMaco;
  if (data.valorUnitario !== void 0) upd.valorUnitario = String(data.valorUnitario);
  if (data.disponivel !== void 0) upd.disponivel = data.disponivel ? 1 : 0;
  if (data.ordem !== void 0) upd.ordem = data.ordem;
  await db.update(listasItens3).set(upd).where(eq3(listasItens3.id, id));
}
async function deleteListaItem(id) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasItens: listasItens3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  await db.delete(listasItens3).where(eq3(listasItens3.id, id));
}
async function replaceListaItens(listaId, itens) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasItens: listasItens3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  await db.delete(listasItens3).where(eq3(listasItens3.listaId, listaId));
  if (itens.length > 0) {
    await db.insert(listasItens3).values(itens.map((item, idx) => ({
      listaId,
      categoriaId: item.categoriaId,
      categoriaNome: item.categoriaNome,
      variedade: item.variedade,
      tamanho: item.tamanho,
      qtdHasteMaco: item.qtdHasteMaco,
      valorUnitario: String(item.valorUnitario),
      disponivel: item.disponivel !== false ? 1 : 0,
      ordem: item.ordem ?? idx
    })));
  }
}
async function criarListaPedido(data) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPedidos: listasPedidos3, listasPedidosItens: listasPedidosItens3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const total = data.itens.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0);
  const [result] = await db.insert(listasPedidos3).values({
    listaId: data.listaId,
    clienteNome: data.clienteNome,
    clienteTelefone: data.clienteTelefone,
    observacao: data.observacao,
    total: String(total.toFixed(2))
  });
  const pedidoId = result.insertId;
  if (data.itens.length > 0) {
    await db.insert(listasPedidosItens3).values(data.itens.map((i) => ({
      pedidoId,
      listaItemId: i.listaItemId,
      categoriaNome: i.categoriaNome,
      variedade: i.variedade,
      tamanho: i.tamanho,
      qtdHasteMaco: i.qtdHasteMaco,
      valorUnitario: String(i.valorUnitario),
      quantidade: i.quantidade,
      subtotal: String((i.valorUnitario * i.quantidade).toFixed(2))
    })));
  }
  return { id: pedidoId, total };
}
async function listListasPedidos(listaId) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPedidos: listasPedidos3, listasPedidosItens: listasPedidosItens3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3, desc: desc2 } = await import("drizzle-orm");
  const pedidos = await db.select().from(listasPedidos3).where(eq3(listasPedidos3.listaId, listaId)).orderBy(desc2(listasPedidos3.createdAt));
  const itens = await db.select().from(listasPedidosItens3).where(eq3(listasPedidosItens3.pedidoId, pedidos.length > 0 ? pedidos[0].id : -1));
  const allItens = pedidos.length > 0 ? await db.select().from(listasPedidosItens3) : [];
  return pedidos.map((p) => ({
    ...p,
    itens: allItens.filter((i) => i.pedidoId === p.id)
  }));
}
async function getListaPedidoById(id) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPedidos: listasPedidos3, listasPedidosItens: listasPedidosItens3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  const [pedido] = await db.select().from(listasPedidos3).where(eq3(listasPedidos3.id, id));
  if (!pedido) return null;
  const itens = await db.select().from(listasPedidosItens3).where(eq3(listasPedidosItens3.pedidoId, id));
  return { ...pedido, itens };
}
async function updateListaPedidoStatus(id, status, vendaId) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPedidos: listasPedidos3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const { eq: eq3 } = await import("drizzle-orm");
  const upd = { status };
  if (vendaId !== void 0) upd.vendaId = vendaId;
  await db.update(listasPedidos3).set(upd).where(eq3(listasPedidos3.id, id));
}
async function listProdutosLista(filtros) {
  const db = await getDb();
  if (!db) return [];
  const { produtosLista: produtosLista3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  let rows = await db.select().from(produtosLista3).orderBy(asc(produtosLista3.categoriaNome), asc(produtosLista3.variedade));
  if (filtros?.ativo !== void 0) rows = rows.filter((r) => r.ativo === 1 === filtros.ativo);
  if (filtros?.categoriaId) rows = rows.filter((r) => r.categoriaId === filtros.categoriaId);
  if (filtros?.busca) {
    const b = filtros.busca.toLowerCase();
    rows = rows.filter((r) => r.variedade.toLowerCase().includes(b) || r.categoriaNome.toLowerCase().includes(b));
  }
  return rows;
}
async function getProdutoListaById(id) {
  const db = await getDb();
  if (!db) return null;
  const { produtosLista: produtosLista3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const rows = await db.select().from(produtosLista3).where(eq(produtosLista3.id, id)).limit(1);
  return rows[0] ?? null;
}
async function searchProdutosLoja(busca) {
  const db = await getDb();
  if (!db) return [];
  const { produtosLoja: produtosLoja2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  let conditions = [eq(produtosLoja2.ativo, 1)];
  if (busca && busca.trim().length >= 2) {
    const termo = `%${busca.toLowerCase()}%`;
    conditions.push(sql`LOWER(${produtosLoja2.nome}) LIKE ${termo}`);
  }
  return await db.select().from(produtosLoja2).where(and(...conditions)).limit(10);
}
async function createProdutoLista(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { produtosLista: produtosLista3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const [result] = await db.insert(produtosLista3).values({
    produtoLojaId: data.produtoLojaId ?? null,
    categoriaId: data.categoriaId ?? null,
    categoriaNome: data.categoriaNome.toUpperCase(),
    variedade: data.variedade.toUpperCase(),
    tamanho: data.tamanho ?? null,
    qtdHasteMaco: data.qtdHasteMaco ?? null,
    valorUnitario: String(data.valorUnitario),
    observacao: data.observacao ?? null,
    ativo: 1
  });
  return { id: result.insertId };
}
async function updateProdutoLista(id, data) {
  const db = await getDb();
  if (!db) return;
  const { produtosLista: produtosLista3, produtosLoja: produtosLoja2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const [current] = await db.select().from(produtosLista3).where(eq(produtosLista3.id, id)).limit(1);
  const update = {};
  if (data.produtoLojaId !== void 0) update.produtoLojaId = data.produtoLojaId;
  if (data.categoriaId !== void 0) update.categoriaId = data.categoriaId;
  if (data.categoriaNome !== void 0) update.categoriaNome = data.categoriaNome.toUpperCase();
  if (data.variedade !== void 0) update.variedade = data.variedade.toUpperCase();
  if (data.tamanho !== void 0) update.tamanho = data.tamanho;
  if (data.qtdHasteMaco !== void 0) update.qtdHasteMaco = data.qtdHasteMaco;
  if (data.valorUnitario !== void 0) update.valorUnitario = String(data.valorUnitario);
  if (data.ativo !== void 0) update.ativo = data.ativo ? 1 : 0;
  if (data.observacao !== void 0) update.observacao = data.observacao;
  await db.update(produtosLista3).set(update).where(eq(produtosLista3.id, id));
  if (Object.keys(update).length > 0 && current) {
    if (data.variedade !== void 0 || data.categoriaNome !== void 0 || data.valorUnitario !== void 0 || data.ativo !== void 0) {
      await createHistoricoAlteracao({
        produtoListaId: id,
        usuarioId: "sistema",
        usuarioNome: "Sistema",
        acao: "EDICAO",
        campoAlterado: "multiplos",
        valorAnterior: JSON.stringify({
          variedade: current.variedade,
          categoriaNome: current.categoriaNome,
          valorUnitario: current.valorUnitario,
          ativo: current.ativo
        }),
        valorNovo: JSON.stringify({
          variedade: data.variedade,
          categoriaNome: data.categoriaNome,
          valorUnitario: data.valorUnitario,
          ativo: data.ativo
        })
      });
    }
  }
  if (current && current.produtoLojaId) {
    const lojaUpdate = {};
    if (data.variedade !== void 0) lojaUpdate.nome = data.variedade.toUpperCase();
    if (data.categoriaNome !== void 0) lojaUpdate.departamento = data.categoriaNome.toUpperCase();
    if (data.valorUnitario !== void 0) lojaUpdate.preco = String(data.valorUnitario);
    if (data.ativo !== void 0) lojaUpdate.ativo = data.ativo ? 1 : 0;
    if (Object.keys(lojaUpdate).length > 0) {
      await db.update(produtosLoja2).set(lojaUpdate).where(eq(produtosLoja2.id, current.produtoLojaId));
    }
  }
}
async function deleteProdutoLista(id) {
  const db = await getDb();
  if (!db) return;
  const { produtosLista: produtosLista3 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.delete(produtosLista3).where(eq(produtosLista3.id, id));
}
async function toggleProdutoListaAtivo(id, ativo) {
  const db = await getDb();
  if (!db) return;
  const { produtosLista: produtosLista3, produtosLoja: produtosLoja2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const [current] = await db.select().from(produtosLista3).where(eq(produtosLista3.id, id)).limit(1);
  await db.update(produtosLista3).set({ ativo: ativo ? 1 : 0 }).where(eq(produtosLista3.id, id));
  if (current && current.produtoLojaId) {
    await db.update(produtosLoja2).set({ ativo: ativo ? 1 : 0 }).where(eq(produtosLoja2.id, current.produtoLojaId));
  }
}
async function createHistoricoAlteracao(data) {
  const db = await getDb();
  if (!db) return;
  const { historicoAlteracoesLista: historicoAlteracoesLista2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.insert(historicoAlteracoesLista2).values({
    produtoListaId: data.produtoListaId,
    usuarioId: data.usuarioId,
    usuarioNome: data.usuarioNome,
    acao: data.acao,
    campoAlterado: data.campoAlterado || null,
    valorAnterior: data.valorAnterior || null,
    valorNovo: data.valorNovo || null
  });
}
async function getHistoricoAlteracao(produtoListaId) {
  const db = await getDb();
  if (!db) return [];
  const { historicoAlteracoesLista: historicoAlteracoesLista2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return await db.select().from(historicoAlteracoesLista2).where(eq(historicoAlteracoesLista2.produtoListaId, produtoListaId)).orderBy(desc(historicoAlteracoesLista2.data));
}
async function verificarDesatualizacao(produtoListaId) {
  const db = await getDb();
  if (!db) return null;
  const { produtosLista: produtosLista3, produtosLoja: produtosLoja2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const [produtoLista] = await db.select().from(produtosLista3).where(eq(produtosLista3.id, produtoListaId)).limit(1);
  if (!produtoLista || !produtoLista.produtoLojaId) {
    return null;
  }
  const [produtoLoja] = await db.select().from(produtosLoja2).where(eq(produtosLoja2.id, produtoLista.produtoLojaId)).limit(1);
  if (!produtoLoja) return null;
  const desatualizado = {
    nome: produtoLista.variedade !== produtoLoja.nome,
    departamento: produtoLista.categoriaNome !== produtoLoja.departamento,
    preco: String(produtoLista.valorUnitario) !== produtoLoja.preco,
    ativo: produtoLista.ativo === 1 !== (produtoLoja.ativo === 1)
  };
  return {
    estaDesatualizado: Object.values(desatualizado).some((v) => v),
    desatualizado,
    ultimaSincronizacao: produtoLista.ultimaSincronizacao,
    produtoLoja: {
      nome: produtoLoja.nome,
      departamento: produtoLoja.departamento,
      preco: produtoLoja.preco,
      ativo: produtoLoja.ativo === 1
    }
  };
}
async function updateVeilingConversaoObservacoes(nomeCompleto, qualidade, observacao) {
  try {
    const db = await getDb();
    if (!db) return;
    const { veilingConversao: veilingConversao2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    await db.update(veilingConversao2).set({
      qualidade: qualidade || "",
      observacao: observacao || null
    }).where(eq(veilingConversao2.descLonga, nomeCompleto));
  } catch (e) {
  }
}
async function createCompraImportada(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(comprasImportadas).values(data);
  return result.insertId;
}
async function getComprasImportadas() {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.select().from(comprasImportadas).orderBy(comprasImportadas.dataImportacao);
}
async function getCompraImportadaById(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.select().from(comprasImportadas).where(eq(comprasImportadas.id, id));
  return result[0] || null;
}
async function deleteCompraImportada(id) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(comprasImportadas).where(eq(comprasImportadas.id, id));
  return { success: true };
}
async function getProdutoByName(nome) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.select().from(produtos).where(eq(produtos.descricao, nome));
  return result[0] || null;
}
function calcularValoresCompraImportada(data) {
  const valorTotal = data.pacote * data.valorCusto;
  const freteTotal = data.pacote * data.freteUm;
  const custoTotal = (valorTotal + freteTotal + data.embalagem) / data.icms;
  const totalCompra = custoTotal * data.quantidade;
  const valorVarejo = custoTotal / 0.4;
  const valorCdUm = totalCompra / 0.4;
  const valorCdAta = custoTotal / 0.55;
  return {
    valorTotal: parseFloat(valorTotal.toFixed(2)),
    freteTotal: parseFloat(freteTotal.toFixed(2)),
    custoTotal: parseFloat(custoTotal.toFixed(2)),
    totalCompra: parseFloat(totalCompra.toFixed(2)),
    valorVarejo: parseFloat(valorVarejo.toFixed(2)),
    valorCdUm: parseFloat(valorCdUm.toFixed(2)),
    valorCdAta: parseFloat(valorCdAta.toFixed(2))
  };
}
async function getVeilingConversaoByProduto(nomeProduto) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(veilingConversao).where(
    or(
      like(veilingConversao.descCurta, `%${nomeProduto}%`),
      like(veilingConversao.descLonga, `%${nomeProduto}%`)
    )
  ).limit(1);
  return result[0] || null;
}
async function sincronizarCompraImportadaComVeiling(compraImportadaId) {
  const db = await getDb();
  if (!db) return null;
  const compra = await db.select().from(comprasImportadas).where(eq(comprasImportadas.id, compraImportadaId)).limit(1);
  if (!compra[0]) return null;
  const conversao = await getVeilingConversaoByProduto(compra[0].produto);
  if (conversao) {
    const qtdVenda = Number(conversao.qtdVenda) || 1;
    await db.update(comprasImportadas).set({
      pacote: qtdVenda.toString(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(comprasImportadas.id, compraImportadaId));
    return { ...compra[0], pacote: qtdVenda };
  }
  return compra[0];
}
async function sincronizarTodasComprasImportadas() {
  const db = await getDb();
  if (!db) return [];
  const compras2 = await db.select().from(comprasImportadas);
  const resultados = [];
  for (const compra of compras2) {
    const resultado = await sincronizarCompraImportadaComVeiling(compra.id);
    resultados.push(resultado);
  }
  return resultados;
}
async function aplicarPrecosComprasImportadasNoVeiling(compraImportadaIds) {
  const db = await getDb();
  if (!db) return [];
  const compras2 = await db.select().from(comprasImportadas).where(inArray(comprasImportadas.id, compraImportadaIds));
  const resultados = [];
  for (const compra of compras2) {
    const veilingProduto = await db.select().from(veilingConversao).where(
      or(
        like(veilingConversao.descCurta, `%${compra.produto}%`),
        like(veilingConversao.descLonga, `%${compra.produto}%`)
      )
    ).limit(1);
    if (veilingProduto[0]) {
      resultados.push({
        compraId: compra.id,
        veilingId: veilingProduto[0].id,
        produto: compra.produto,
        valorVarejo: compra.valorVarejo,
        valorCdUm: compra.valorCdUm,
        valorCdAta: compra.valorCdAta,
        status: "atualizado"
      });
    } else {
      resultados.push({
        compraId: compra.id,
        produto: compra.produto,
        status: "nao_encontrado"
      });
    }
  }
  return resultados;
}
async function aplicarTodosPrecosComprasImportadas() {
  const db = await getDb();
  if (!db) return [];
  const compras2 = await db.select().from(comprasImportadas);
  const ids = compras2.map((c) => c.id);
  return aplicarPrecosComprasImportadasNoVeiling(ids);
}
function parseRcoldescFile(conteudo) {
  const linhas = conteudo.trim().split("\n");
  const resultado = [];
  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;
    const campos = linha.split(";");
    if (campos.length < 9) continue;
    resultado.push({
      dtVenda: campos[0],
      nomeProdutor: campos[1],
      chave: campos[2],
      codProd: campos[3],
      descricaoProduto: campos[4],
      qtEmb: parseInt(campos[5]) || 0,
      qtPorEmb: parseInt(campos[6]) || 0,
      preco: parseFloat(campos[7]) || 0,
      vlrTotal: parseFloat(campos[8]) || 0
    });
  }
  return resultado;
}
async function converterRcoldescParaCompraImportada(rcoldescRows) {
  const db = await getDb();
  if (!db) return [];
  const resultado = [];
  for (const row of rcoldescRows) {
    const conversao = await getVeilingConversaoByProduto(row.descricaoProduto);
    const qtdVenda = conversao ? Number(conversao.qtdVenda) : row.qtPorEmb;
    const quantidade = row.qtEmb * row.qtPorEmb;
    const valorCusto = row.preco;
    const calculos = calcularValoresCompraImportada({
      quantidade,
      valorCusto,
      pacote: qtdVenda,
      freteUm: 0,
      icms: 1,
      embalagem: 0
    });
    resultado.push({
      produto: row.descricaoProduto,
      quantidade,
      valorCusto: valorCusto.toString(),
      pacote: qtdVenda.toString(),
      valorTotal: calculos.valorTotal.toString(),
      freteUm: "0",
      freteTotal: calculos.freteTotal.toString(),
      icms: "1.0",
      embalagem: "0",
      custoTotal: calculos.custoTotal.toString(),
      totalCompra: calculos.totalCompra.toString(),
      valorVarejo: calculos.valorVarejo.toString(),
      valorCdUm: calculos.valorCdUm.toString(),
      valorCdAta: calculos.valorCdAta.toString(),
      nomeArquivo: "rcoldesc.txt",
      codProd: row.codProd,
      dtVenda: row.dtVenda,
      nomeProdutor: row.nomeProdutor
    });
  }
  return resultado;
}
function gerarPdfComprasImportadas(compras2) {
  const { PDFDocument, rgb } = __require("pdf-lib");
  const doc = new PDFDocument({
    size: "A4",
    margin: 20
  });
  doc.fontSize(16).font("Helvetica-Bold").text("Relat\xF3rio de Compras Importadas", { align: "center" });
  doc.fontSize(10).font("Helvetica").text(`Data: ${(/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR")}`, { align: "center" });
  doc.moveDown(0.5);
  const tableTop = doc.y;
  const colWidths = [80, 40, 40, 30, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40];
  const headers = ["Produto", "Qtd", "V/Custo", "Pacote", "V.Total", "Frete", "Frete T", "ICMS", "Embal", "C.Total", "T.Compra", "V/Varejo", "V/CD UM", "V/CD ATA"];
  doc.fontSize(8).font("Helvetica-Bold");
  let x = 20;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x, tableTop, { width: colWidths[i], align: "center" });
    x += colWidths[i];
  }
  doc.font("Helvetica").fontSize(7);
  let y = tableTop + 20;
  for (const compra of compras2) {
    const valores = [
      compra.produto || "",
      compra.quantidade || "",
      compra.valorCusto || "",
      compra.pacote || "",
      compra.valorTotal || "",
      compra.freteUm || "",
      compra.freteTotal || "",
      compra.icms || "",
      compra.embalagem || "",
      compra.custoTotal || "",
      compra.totalCompra || "",
      compra.valorVarejo || "",
      compra.valorCdUm || "",
      compra.valorCdAta || ""
    ];
    x = 20;
    for (let i = 0; i < valores.length; i++) {
      doc.text(String(valores[i]).substring(0, 10), x, y, { width: colWidths[i], align: "center" });
      x += colWidths[i];
    }
    y += 15;
    if (y > 750) {
      doc.addPage();
      y = 20;
    }
  }
  return doc;
}
async function criarOuAtualizarAcompanhamento(compraItemId, compraId, produtoId, produtoNome, quantidadePedida, quantidadeComprada, observacoes) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const quantidadeRestante = Math.max(0, quantidadePedida - quantidadeComprada);
  const quantidadeExcedente = Math.max(0, quantidadeComprada - quantidadePedida);
  let status = "PENDENTE";
  if (quantidadeComprada === 0) status = "PENDENTE";
  else if (quantidadeComprada < quantidadePedida) status = "PARCIAL";
  else if (quantidadeComprada === quantidadePedida) status = "COMPLETO";
  else if (quantidadeComprada > quantidadePedida) status = "EXCEDENTE";
  const existente = await db.select().from(acompanhamentoCompras).where(eq(acompanhamentoCompras.compraItemId, compraItemId)).limit(1);
  if (existente.length > 0) {
    return await db.update(acompanhamentoCompras).set({
      quantidadeComprada: quantidadeComprada.toString(),
      quantidadeRestante: quantidadeRestante.toString(),
      quantidadeExcedente: quantidadeExcedente.toString(),
      status,
      observacoes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(acompanhamentoCompras.compraItemId, compraItemId));
  } else {
    return await db.insert(acompanhamentoCompras).values({
      compraItemId,
      compraId,
      produtoId,
      produtoNome,
      quantidadePedida: quantidadePedida.toString(),
      quantidadeComprada: quantidadeComprada.toString(),
      quantidadeRestante: quantidadeRestante.toString(),
      quantidadeExcedente: quantidadeExcedente.toString(),
      status,
      observacoes
    });
  }
}
async function listarAcompanhamentosPorCompra(compraId) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(acompanhamentoCompras).where(eq(acompanhamentoCompras.compraId, compraId)).orderBy(acompanhamentoCompras.produtoNome);
}
async function obterAcompanhamento(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const resultado = await db.select().from(acompanhamentoCompras).where(eq(acompanhamentoCompras.id, id)).limit(1);
  return resultado[0] || null;
}
async function listarComprasComAcompanhamento() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const comprasComAcompanhamento = await db.select({
    compraId: acompanhamentoCompras.compraId,
    fornecedor: compras.fornecedor,
    data: compras.data,
    total: compras.total,
    status: compras.status,
    totalProdutos: sql`COUNT(DISTINCT ${acompanhamentoCompras.id})`,
    produtosCompletos: sql`SUM(CASE WHEN ${acompanhamentoCompras.status} = 'COMPLETO' THEN 1 ELSE 0 END)`,
    produtosExcedentes: sql`SUM(CASE WHEN ${acompanhamentoCompras.status} = 'EXCEDENTE' THEN 1 ELSE 0 END)`,
    produtosPendentes: sql`SUM(CASE WHEN ${acompanhamentoCompras.status} = 'PENDENTE' THEN 1 ELSE 0 END)`
  }).from(acompanhamentoCompras).leftJoin(compras, eq(acompanhamentoCompras.compraId, compras.id)).groupBy(acompanhamentoCompras.compraId).orderBy(desc(compras.data));
  return comprasComAcompanhamento;
}
async function obterResumoCompra(compraId) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const acompanhamentos = await listarAcompanhamentosPorCompra(compraId);
  const resumo = {
    totalProdutos: acompanhamentos.length,
    produtosCompletos: acompanhamentos.filter((a) => a.status === "COMPLETO").length,
    produtosExcedentes: acompanhamentos.filter((a) => a.status === "EXCEDENTE").length,
    produtosParciais: acompanhamentos.filter((a) => a.status === "PARCIAL").length,
    produtosPendentes: acompanhamentos.filter((a) => a.status === "PENDENTE").length,
    quantidadeTotalPedida: acompanhamentos.reduce((sum, a) => sum + parseFloat(a.quantidadePedida.toString()), 0),
    quantidadeTotalComprada: acompanhamentos.reduce((sum, a) => sum + parseFloat(a.quantidadeComprada.toString()), 0),
    quantidadeTotalRestante: acompanhamentos.reduce((sum, a) => sum + parseFloat(a.quantidadeRestante.toString()), 0),
    quantidadeTotalExcedente: acompanhamentos.reduce((sum, a) => sum + parseFloat(a.quantidadeExcedente.toString()), 0)
  };
  return resumo;
}
async function deletarAcompanhamento(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.delete(acompanhamentoCompras).where(eq(acompanhamentoCompras.id, id));
}
async function gerarQrCodeToken() {
  return crypto.randomBytes(16).toString("hex");
}
async function obterVendaPorQrCodeToken(token) {
  const db = await getDb();
  if (!db) return void 0;
  return db.query.vendas.findFirst({
    where: eq(vendas.qrCodeToken, token),
    with: {
      itens: {
        with: {
          produto: true
        }
      }
    }
  });
}
async function atualizarQrCodeToken(vendaId, token) {
  const db = await getDb();
  if (!db) return void 0;
  return db.update(vendas).set({ qrCodeToken: token }).where(eq(vendas.id, vendaId));
}
async function criarProdutoCustomizado(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.insert(produtosCustomizados).values(data);
  return result;
}
async function listarProdutosCustomizados() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(produtosCustomizados).orderBy(produtosCustomizados.nome);
}
async function obterProdutoCustomizado(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(produtosCustomizados).where(eq(produtosCustomizados.id, id)).limit(1).then((rows) => rows[0]);
}
async function atualizarProdutoCustomizado(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  if (data.estoque === 0) {
    data.ativo = 0;
  }
  return await db.update(produtosCustomizados).set(data).where(eq(produtosCustomizados.id, id));
}
async function deletarProdutoCustomizado(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.delete(produtosCustomizados).where(eq(produtosCustomizados.id, id));
}
async function decrementarEstoqueProdutoCustomizado(id, quantidade) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const produto = await obterProdutoCustomizado(id);
  if (!produto) throw new Error("Produto n\xE3o encontrado");
  const novoEstoque = Math.max(0, produto.estoque - quantidade);
  const ativo = novoEstoque > 0 ? 1 : 0;
  return await db.update(produtosCustomizados).set({ estoque: novoEstoque, ativo }).where(eq(produtosCustomizados.id, id));
}
async function listarCategoriasCustomizadas() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(categoriasCustomizadas).where(eq(categoriasCustomizadas.ativo, 1)).orderBy(categoriasCustomizadas.nome);
}
async function criarCategoriaCustomizada(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.insert(categoriasCustomizadas).values(data);
}
async function atualizarCategoriaCustomizada(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.update(categoriasCustomizadas).set(data).where(eq(categoriasCustomizadas.id, id));
}
async function deletarCategoriaCustomizada(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.delete(categoriasCustomizadas).where(eq(categoriasCustomizadas.id, id));
}
async function salvarCatalogoHistorico(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.execute(`
    INSERT INTO catalogoHistorico (nome, produtosCount, usuarioId, pdfUrl, produtosJson, desconto)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [data.nome, data.produtosCount, data.usuarioId || null, data.pdfUrl || null, data.produtosJson, data.desconto || 0]);
  return result;
}
async function listarCatalogosHistorico(usuarioId) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  let query = `
    SELECT id, nome, dataGeracao, produtosCount, usuarioId, pdfUrl, produtosJson, desconto, createdAt, updatedAt
    FROM catalogoHistorico
    WHERE deletedAt IS NULL
  `;
  const params = [];
  if (usuarioId) {
    query += ` AND usuarioId = ?`;
    params.push(usuarioId);
  }
  query += ` ORDER BY dataGeracao DESC LIMIT 100`;
  const result = await db.execute(query, params);
  return result[0] || [];
}
async function obterCatalogoHistorico(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.execute(`
    SELECT id, nome, dataGeracao, produtosCount, usuarioId, pdfUrl, produtosJson, desconto, createdAt, updatedAt
    FROM catalogoHistorico
    WHERE id = ? AND deletedAt IS NULL
  `, [id]);
  return result[0]?.[0];
}
async function atualizarCatalogoHistorico(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const updates = [];
  const params = [];
  if (data.nome !== void 0) {
    updates.push(`nome = ?`);
    params.push(data.nome);
  }
  if (data.produtosCount !== void 0) {
    updates.push(`produtosCount = ?`);
    params.push(data.produtosCount);
  }
  if (data.pdfUrl !== void 0) {
    updates.push(`pdfUrl = ?`);
    params.push(data.pdfUrl);
  }
  if (data.produtosJson !== void 0) {
    updates.push(`produtosJson = ?`);
    params.push(data.produtosJson);
  }
  if (data.desconto !== void 0) {
    updates.push(`desconto = ?`);
    params.push(data.desconto);
  }
  if (updates.length === 0) return;
  updates.push(`updatedAt = NOW()`);
  params.push(id);
  const result = await db.execute(`
    UPDATE catalogoHistorico
    SET ${updates.join(", ")}
    WHERE id = ? AND deletedAt IS NULL
  `, params);
  return result;
}
async function deletarCatalogoHistorico(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.execute(`
    UPDATE catalogoHistorico
    SET deletedAt = NOW()
    WHERE id = ? AND deletedAt IS NULL
  `, [id]);
  return result;
}
async function restaurarCatalogoHistorico(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.execute(`
    UPDATE catalogoHistorico
    SET deletedAt = NULL
    WHERE id = ?
  `, [id]);
  return result;
}
async function listClientesBloqueados(search) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(clientes.bloqueado, 1), isNull(clientes.deletedAt)];
  if (search) {
    const s = search.toLowerCase();
    conditions.push(or(sql`LOWER(${clientes.nome}) LIKE ${`%${s}%`}`, sql`LOWER(${clientes.telefone}) LIKE ${`%${s}%`}`));
  }
  return db.select().from(clientes).where(and(...conditions)).orderBy(desc(clientes.bloqueadoEm));
}
async function bloquearCliente(clienteId, motivo, usuarioNome) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientes).set({
    bloqueado: 1,
    motivoBloqueio: motivo,
    bloqueadoEm: /* @__PURE__ */ new Date(),
    bloqueadoPor: usuarioNome || "Sistema"
  }).where(eq(clientes.id, clienteId));
}
async function desbloquearCliente(clienteId) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientes).set({
    bloqueado: 0,
    motivoBloqueio: null,
    bloqueadoEm: null,
    bloqueadoPor: null
  }).where(eq(clientes.id, clienteId));
}
async function addTelefoneClienteBloqueado(clienteId, telefone) {
  const db = await getDb();
  if (!db) return;
  await db.insert(telefonesClientesBloqueados).values({ clienteId, telefone });
}
async function removeTelefoneClienteBloqueado(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(telefonesClientesBloqueados).where(eq(telefonesClientesBloqueados.id, id));
}
async function listTelefonesClienteBloqueado(clienteId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(telefonesClientesBloqueados).where(eq(telefonesClientesBloqueados.clienteId, clienteId)).orderBy(asc(telefonesClientesBloqueados.id));
}
async function deleteTelefonesClienteBloqueado(clienteId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(telefonesClientesBloqueados).where(eq(telefonesClientesBloqueados.clienteId, clienteId));
}
var _db, CORES_FLORES;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    init_schema();
    _db = null;
    CORES_FLORES = [
      "BRANCA",
      "BRANCO",
      "VERMELHA",
      "VERMELHO",
      "ROSA",
      "PINK",
      "AMARELA",
      "AMARELO",
      "LARANJA",
      "ROXA",
      "ROXO",
      "LILAS",
      "LIL\xC1S",
      "VIOLETA",
      "LAVANDA",
      "AZUL",
      "VERDE",
      "BICOLOR",
      "MULTICOLOR",
      "MISTA",
      "MISTO",
      "COLORIDA",
      "COLORIDO",
      "CREME",
      "CHAMPAGNE",
      "MARFIM",
      "SALM\xC3O",
      "SALMAO",
      "CORAL",
      "PEACH",
      "BORDO",
      "BORD\xD4",
      "PRETA",
      "PRETO",
      "BRANCA/ROXA",
      "BRANCA/ROSA",
      "BRANCA/VERMELHA"
    ];
  }
});

// server/veilingApi.ts
var veilingApi_exports = {};
__export(veilingApi_exports, {
  veilingGetAllOffers: () => veilingGetAllOffers,
  veilingGetCategories: () => veilingGetCategories,
  veilingGetGfpByOffer: () => veilingGetGfpByOffer,
  veilingGetOffers: () => veilingGetOffers,
  veilingLogin: () => veilingLogin
});
async function veilingLogin(usuario, senha) {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    username: usuario,
    password: senha,
    scope: "openid profile offline_access"
  });
  const resp = await fetchWithTimeout(
    `${VEILING_BASE}/identity/connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    },
    15e3
  );
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Login Veiling falhou (${resp.status}): ${err}`);
  }
  await assertJson(resp, "Login");
  return resp.json();
}
async function veilingGetCategories(token) {
  const MAX_RETRIES = 3;
  let lastErr = new Error("Erro desconhecido");
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetchWithTimeout(
        `${VEILING_BASE}/ecommerce/api/productcategory`,
        { headers: { Authorization: `Bearer ${token}` } },
        3e4
        // 30s timeout (era 10s — servidor pode demorar mais)
      );
      if (!resp.ok) throw new Error(`Erro ao buscar categorias (${resp.status})`);
      await assertJson(resp, "Categorias");
      return resp.json();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await sleep(1e3 * attempt);
      }
    }
  }
  throw lastErr;
}
async function veilingGetOffers(token, customerId, page, pageSize, options = {}) {
  const params = new URLSearchParams({
    page: String(page),
    totalPage: String(pageSize),
    customerId,
    orderBy: options.orderBy || "AZ",
    includeGfpImages: "false"
  });
  if (options.categoryId) params.append("productCategoryId", String(options.categoryId));
  if (options.letter && options.letter !== "Todas") params.append("letter", options.letter);
  if (options.search) params.append("productName", options.search);
  const resp = await fetchWithTimeout(
    `${VEILING_BASE}/ecommerce/api/Offer?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
    45e3
    // Aumentado de 15s para 45s (pode demorar com 5500+ ofertas)
  );
  if (!resp.ok) throw new Error(`Erro ao buscar ofertas (${resp.status})`);
  await assertJson(resp, "Ofertas");
  return resp.json();
}
async function veilingGetAllOffers(token, customerId, categoryId, onProgress) {
  const PAGE_SIZE = 100;
  const MAX_RETRIES = 5;
  const DELAY_MS = 100;
  let totalPages = 0;
  async function fetchPage(page) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Veiling] Buscando p\xE1gina ${page}/${totalPages || "?"} (tentativa ${attempt}/${MAX_RETRIES})`);
        return await veilingGetOffers(token, customerId, page, PAGE_SIZE, { categoryId });
      } catch (err) {
        console.warn(`[Veiling] Erro na p\xE1gina ${page} (tentativa ${attempt}/${MAX_RETRIES}): ${err.message}`);
        if (attempt === MAX_RETRIES) throw err;
        const delayMs = Math.min(1e3 * Math.pow(2, attempt - 1), 1e4);
        console.log(`[Veiling] Aguardando ${delayMs}ms antes de retry...`);
        await sleep(delayMs);
      }
    }
    throw new Error("N\xE3o deveria chegar aqui");
  }
  console.log("[Veiling] Iniciando busca de ofertas...");
  const first = await fetchPage(1);
  totalPages = first.offers.length > 0 ? first.offers[0].pagesCount : 0;
  const totalEstimado = totalPages * PAGE_SIZE;
  console.log(`[Veiling] Total de p\xE1ginas: ${totalPages} (~${totalEstimado} ofertas)`);
  const allOffers = [...first.offers];
  if (onProgress) onProgress(allOffers.length, totalEstimado);
  for (let p = 2; p <= totalPages; p++) {
    try {
      const resp = await fetchPage(p);
      allOffers.push(...resp.offers);
      console.log(`[Veiling] P\xE1gina ${p} carregada: ${allOffers.length}/${totalEstimado} ofertas`);
    } catch (err) {
      console.warn(`[Veiling] Erro cr\xEDtico na p\xE1gina ${p}, pulando: ${err.message}`);
    }
    if (onProgress) onProgress(allOffers.length, totalEstimado);
    await sleep(DELAY_MS);
  }
  console.log(`[Veiling] Busca conclu\xEDda: ${allOffers.length} ofertas carregadas`);
  return allOffers;
}
async function veilingGetGfpByOffer(token, offerId, offerType, packingId, auctionDate) {
  const params = new URLSearchParams({
    offerType: String(offerType),
    packingId: String(packingId),
    auctionDate
  });
  const resp = await fetchWithTimeout(
    `${VEILING_BASE}/ecommerce/api/offer/by-gfp/${offerId}?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
    2e4
    // Aumentado de 10s para 20s
  );
  if (!resp.ok) return [];
  if (resp.status === 204) return [];
  const ct = resp.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return [];
  return resp.json();
}
async function assertJson(resp, context) {
  const ct = resp.headers.get("content-type") || "";
  if (!ct.includes("application/json") && !ct.includes("text/json")) {
    const body = await resp.text();
    const preview = body.substring(0, 100).replace(/\n/g, " ");
    throw new Error(`Veiling retornou resposta inv\xE1lida em ${context} (esperado JSON, recebido: ${ct || "sem content-type"}). Preview: ${preview}`);
  }
}
function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(
    () => clearTimeout(timer)
  );
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
var VEILING_BASE, CLIENT_ID, CLIENT_SECRET;
var init_veilingApi = __esm({
  "server/veilingApi.ts"() {
    "use strict";
    VEILING_BASE = "https://backend.veilingonline.com.br";
    CLIENT_ID = "veiling-online";
    CLIENT_SECRET = "9be425c1-cac1-46ba-a89b-2b564f9ad474";
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  storageGet: () => storageGet,
  storagePut: () => storagePut
});
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
async function buildDownloadUrl(baseUrl, relKey, apiKey) {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey)
  });
  return (await response.json()).url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}
async function storageGet(relKey) {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey)
  };
}
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_env();
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/syncProgress.ts
import { EventEmitter } from "events";
var SyncProgressEmitter = class extends EventEmitter {
  lastEvent = /* @__PURE__ */ new Map();
  emit(event, sessionId, data) {
    this.lastEvent.set(sessionId, data);
    return super.emit(event, sessionId, data);
  }
  getLastEvent(sessionId) {
    return this.lastEvent.get(sessionId);
  }
  clearSession(sessionId) {
    this.lastEvent.delete(sessionId);
  }
};
var syncProgressEmitter = new SyncProgressEmitter();
syncProgressEmitter.setMaxListeners(50);
var SYNC_EVENT = "sync:progress";

// server/routers.ts
init_veilingApi();
init_storage();
init_db();

// server/autoSync.ts
init_db();
init_veilingApi();
import * as XLSX from "xlsx";

// shared/veilingParser.ts
function parseNumber(val) {
  if (val === null || val === void 0 || val === "") return 0;
  if (typeof val === "number") return val;
  const str = String(val).trim();
  const cleaned = str.replace(/"/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}
function parseVeilingRows(rows) {
  if (!rows || rows.length < 4) {
    return { success: false, chaveInfo: "", items: [], error: "Arquivo vazio ou com poucas linhas" };
  }
  const chaveInfo = String(rows[1]?.[0] ?? "");
  const items = [];
  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 20) continue;
    const tipo = String(row[0] ?? "").trim();
    if (!tipo) continue;
    const descricao = String(row[11] ?? "").trim();
    if (!descricao) continue;
    items.push({
      tipo,
      dataCompra: String(row[1] ?? "").trim(),
      pedido: String(row[5] ?? "").trim(),
      codBarras: String(row[9] ?? "").trim(),
      descricao,
      qualidade: String(row[12] ?? "").trim(),
      nomeSitio: String(row[14] ?? "").trim(),
      vlrEmb: parseNumber(row[16]),
      qeXqpe: String(row[17] ?? "").trim(),
      totalUn: parseNumber(row[18]),
      freteUn: parseNumber(row[19]),
      vlrUnit: parseNumber(row[20]),
      subTotal: parseNumber(row[21]),
      total: parseNumber(row[23]),
      observacao: String(row[24] ?? "").trim(),
      numGfp: String(row[25] ?? "").trim()
    });
  }
  if (items.length === 0) {
    return { success: false, chaveInfo, items: [], error: "Nenhum item v\xE1lido encontrado no arquivo" };
  }
  return { success: true, chaveInfo, items };
}
function extractFornecedorFromChave(chaveInfo) {
  const parts = chaveInfo.split(" - ");
  if (parts.length >= 2) return parts[1].trim();
  return chaveInfo;
}

// server/retry.ts
async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 4,
    baseDelayMs = 1e3,
    maxDelayMs = 3e4,
    factor = 2,
    label = "[Retry]",
    isRetryable = () => true
  } = options;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLast = attempt === maxAttempts;
      const errMsg = err instanceof Error ? err.message : String(err);
      if (isLast || !isRetryable(err)) {
        if (!isLast) {
          console.error(`${label} Erro n\xE3o recuper\xE1vel na tentativa ${attempt}/${maxAttempts}: ${errMsg}`);
        }
        throw err;
      }
      const exponential = Math.min(baseDelayMs * Math.pow(factor, attempt - 1), maxDelayMs);
      const jitter = exponential * 0.2 * (Math.random() * 2 - 1);
      const delay = Math.round(exponential + jitter);
      console.warn(
        `${label} Tentativa ${attempt}/${maxAttempts} falhou: ${errMsg}. Pr\xF3xima tentativa em ${(delay / 1e3).toFixed(1)}s...`
      );
      await sleep2(delay);
    }
  }
  throw lastError;
}
function isConnectionError(err) {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  const cause = err.cause;
  const causeMsg = cause instanceof Error ? cause.message.toLowerCase() : "";
  const transientKeywords = [
    "econnreset",
    "etimedout",
    "econnrefused",
    "enotfound",
    "socket hang up",
    "connection lost",
    "connection refused",
    "too many connections",
    "deadlock",
    "lock wait timeout",
    "server has gone away",
    "broken pipe",
    "epipe"
  ];
  return transientKeywords.some((k) => msg.includes(k) || causeMsg.includes(k));
}
function sleep2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// server/autoSync.ts
init_storage();
async function cacheVeilingImage(offerId, tempUrl) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(tempUrl, { signal: AbortSignal.timeout(1e4) });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1e3 * attempt));
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpeg";
      const key = `veiling-images/${offerId}.${ext}`;
      const { url } = await storagePut(key, buf, contentType);
      return url;
    } catch (e) {
      lastError = e;
      if (attempt < 3) {
        const delay = 1e3 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.warn(`[AutoSync] Falha ao cachear imagem ${offerId}: ${lastError?.message || "unknown"}`);
  return null;
}
async function cacheVeilingImages(produtos2) {
  const mysql = await import("mysql2/promise");
  const { ENV: ENV2 } = await Promise.resolve().then(() => (init_env(), env_exports));
  const conn = await mysql.createConnection(ENV2.databaseUrl);
  try {
    const offerIds = produtos2.filter((p) => p.imagemUrl).map((p) => p.offerId);
    if (offerIds.length === 0) return;
    const placeholders = offerIds.map(() => "?").join(",");
    const [rows] = await conn.execute(
      `SELECT offerId FROM veiling_produtos WHERE offerId IN (${placeholders}) AND (imagemUrlCache IS NULL OR imagemUrlCache = '')`,
      offerIds
    );
    const semCache = new Set(rows.map((r) => r.offerId));
    const paraCache = produtos2.filter((p) => p.imagemUrl && semCache.has(p.offerId));
    if (paraCache.length === 0) {
      console.log("[AutoSync] Imagens Veiling: todas j\xE1 em cache.");
      return;
    }
    console.log(`[AutoSync] Cacheando ${paraCache.length} imagens Veiling em background...`);
    const LOTE = 10;
    let cached = 0;
    let fallback = 0;
    for (let i = 0; i < paraCache.length; i += LOTE) {
      const lote = paraCache.slice(i, i + LOTE);
      await Promise.all(lote.map(async (p) => {
        const url = await cacheVeilingImage(p.offerId, p.imagemUrl);
        if (url) {
          await conn.execute("UPDATE veiling_produtos SET imagemUrlCache = ? WHERE offerId = ?", [url, p.offerId]);
          cached++;
        } else {
          await conn.execute("UPDATE veiling_produtos SET imagemUrlCache = ? WHERE offerId = ?", [p.imagemUrl, p.offerId]);
          fallback++;
        }
      }));
    }
    console.log(`[AutoSync] Imagens Veiling: ${cached}/${paraCache.length} cacheadas com sucesso, ${fallback} usando fallback temporario.`);
  } finally {
    await conn.end();
  }
}
var DB_RETRY_OPTS = {
  maxAttempts: 4,
  baseDelayMs: 1500,
  maxDelayMs: 3e4,
  factor: 2,
  isRetryable: isConnectionError
};
var INTERVALO_MS = 20 * 60 * 1e3;
function proximoDiaUtil(base) {
  const SP_OFFSET_MS = -3 * 60 * 60 * 1e3;
  const now = base ?? /* @__PURE__ */ new Date();
  const spMs = now.getTime() + now.getTimezoneOffset() * 6e4 + SP_OFFSET_MS;
  const sp = new Date(spMs);
  sp.setDate(sp.getDate() + 1);
  while (sp.getDay() === 0 || sp.getDay() === 6) {
    sp.setDate(sp.getDate() + 1);
  }
  const dd = String(sp.getDate()).padStart(2, "0");
  const mm = String(sp.getMonth() + 1).padStart(2, "0");
  const yyyy = sp.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function msAteProximas18hSP() {
  const SP_OFFSET_MS = -3 * 60 * 60 * 1e3;
  const now = /* @__PURE__ */ new Date();
  const spMs = now.getTime() + now.getTimezoneOffset() * 6e4 + SP_OFFSET_MS;
  const sp = new Date(spMs);
  const alvo = new Date(spMs);
  alvo.setHours(18, 0, 0, 0);
  if (alvo.getTime() <= sp.getTime()) {
    alvo.setDate(alvo.getDate() + 1);
  }
  return alvo.getTime() - sp.getTime();
}
function agendarJobDataCarregamento() {
  function disparar() {
    const novaData = proximoDiaUtil();
    saveVeilingConfig({ dataCarregamento: novaData }).then(() => console.log(`[AutoSync] Data de carregamento Veiling atualizada para ${novaData}`)).catch((e) => console.error("[AutoSync] Erro ao atualizar data de carregamento Veiling:", e.message));
    upsertCooperfloraConfig({ dataCarregamento: novaData }).then(() => console.log(`[AutoSync] Data de carregamento Cooperflora atualizada para ${novaData}`)).catch((e) => console.error("[AutoSync] Erro ao atualizar data de carregamento Cooperflora:", e.message));
    setTimeout(disparar, msAteProximas18hSP() + 6e4);
  }
  const delay = msAteProximas18hSP();
  const horas = Math.floor(delay / 36e5);
  const mins = Math.floor(delay % 36e5 / 6e4);
  console.log(`[AutoSync] Job data carregamento Veiling+Cooperflora: pr\xF3xima execu\xE7\xE3o em ${horas}h${mins}m (\xE0s 18h SP)`);
  setTimeout(disparar, delay);
}
var schedulerStatus = {
  cooperflora: {
    ultimaSync: null,
    proximaSync: null,
    ultimoStatus: null,
    rodando: false
  },
  veiling: {
    ultimaSync: null,
    proximaSync: null,
    ultimoStatus: null,
    rodando: false
  },
  importacaoPedidos: {
    ultimaSync: null,
    proximaSync: null,
    ultimoStatus: null,
    rodando: false
  }
};
async function executarSyncVeiling() {
  if (schedulerStatus.veiling.rodando) {
    console.log("[AutoSync] Veiling j\xE1 est\xE1 sincronizando, pulando...");
    return;
  }
  schedulerStatus.veiling.rodando = true;
  const inicio = Date.now();
  console.log("[AutoSync] Iniciando sincroniza\xE7\xE3o autom\xE1tica do Veiling...");
  try {
    const cfg = await withRetry(
      () => getVeilingConfig(),
      { ...DB_RETRY_OPTS, label: "[AutoSync Veiling] getVeilingConfig" }
    );
    if (!cfg || !cfg.usuario || !cfg.senha) {
      console.log("[AutoSync] Veiling: credenciais n\xE3o configuradas, pulando.");
      schedulerStatus.veiling.rodando = false;
      return;
    }
    const tokenData = await veilingLogin(cfg.usuario, cfg.senha);
    const token = tokenData.access_token;
    const categorias = await veilingGetCategories(token);
    const todasOfertas = await veilingGetAllOffers(token, cfg.customerId);
    const recepcionadosIds = await withRetry(
      () => getVeilingStatusRecepcionados(),
      { ...DB_RETRY_OPTS, label: "[AutoSync Veiling] getVeilingStatusRecepcionados" }
    );
    const catMapById = new Map(categorias.map((c) => [c.id, c.description]));
    const catMapByCode = new Map(categorias.map((c) => [c.code, c.description]));
    const catMapByCodeTrimmed = new Map(categorias.map((c) => [String(parseInt(c.code, 10)), c.description]));
    const inseridos = todasOfertas.map((o) => {
      const catId = Number(o.productCategory) || 0;
      const catNome = o.productCategoryDescription || catMapById.get(catId) || catMapByCode.get(o.productCategory) || catMapByCodeTrimmed.get(o.productCategory) || "";
      return {
        offerId: o.offerId,
        nome: o.name,
        nomeCompleto: o.longName || o.name,
        categoria: catNome,
        categoriaId: catId,
        produtor: o.siteName || o.producerName || "",
        qualidade: o.quality || "",
        dimensao: o.dimension || "",
        embalagem: o.packagingName || "",
        precoCarrinho: o.trolleyPrice != null ? String(o.trolleyPrice) : null,
        precoCamada: o.layerPrice != null ? String(o.layerPrice) : null,
        precoEmbalagem: o.packagingPrice != null ? String(o.packagingPrice) : null,
        estoqueDisponivel: o.availableStock || 0,
        tipoOferta: o.offerType || "",
        dataValidade: o.endDate ? o.endDate.substring(0, 10) : null,
        imagemUrl: o.defaultImage || null,
        frete: (() => {
          const filialFrete = o.shippingFeeFilials?.[0]?.productShippingValue;
          if (filialFrete != null && filialFrete > 0) return String(filialFrete);
          if (o.shippingFee != null && o.shippingFee > 0) return String(o.shippingFee);
          const patternFrete = o.siteDeliveryPatterns?.[0]?.freightValue;
          if (patternFrete != null && patternFrete > 0) return String(patternFrete);
          return null;
        })(),
        multiplo: o.packings?.[0]?.minimumQuantity || 1,
        compraMinima: 1,
        cor: o.colors && o.colors !== "N/A" ? String(o.colors) : "",
        // Status do produto derivado do offerType
        // offerType=2 (ENP: estoque no produtor); qualquer outro valor (1, 3, vazio) = LKP_SITIO
        statusProduto: String(o.offerType).trim() === "2" ? "ENP" : "LKP_SITIO"
      };
    });
    const total = await withRetry(
      () => upsertVeilingProdutos(inseridos, recepcionadosIds),
      { ...DB_RETRY_OPTS, label: "[AutoSync Veiling] upsertVeilingProdutos" }
    );
    console.log("[AutoSync] Extraindo observa\xE7\xF5es de GFPs para atualizar veilingConversao...");
    try {
      const { veilingGetGfpByOffer: veilingGetGfpByOffer2 } = await Promise.resolve().then(() => (init_veilingApi(), veilingApi_exports));
      const LOTE_GFP = 30;
      const MAX_GFP_TIME = 20 * 60 * 1e3;
      const gfpStartTime = Date.now();
      let atualizadas = 0;
      let puladas = 0;
      const MAX_CONCURRENT = 5;
      for (let i = 0; i < todasOfertas.length; i += LOTE_GFP * MAX_CONCURRENT) {
        if (Date.now() - gfpStartTime > MAX_GFP_TIME) {
          console.log(`[AutoSync] Limite de tempo de GFP atingido (20min). Pulando ${todasOfertas.length - i} produtos restantes.`);
          puladas = todasOfertas.length - i;
          break;
        }
        const megaLote = todasOfertas.slice(i, i + LOTE_GFP * MAX_CONCURRENT);
        const progressPercent = Math.round(i / todasOfertas.length * 100);
        console.log(`[AutoSync] GFP: ${i}/${todasOfertas.length} (${progressPercent}%)`);
        await Promise.all(megaLote.map(async (oferta) => {
          try {
            const gfps = await Promise.race([
              veilingGetGfpByOffer2(
                token,
                oferta.offerId,
                parseInt(oferta.offerType || "1"),
                oferta.packings?.[0]?.id || 0,
                oferta.endDate || (/* @__PURE__ */ new Date()).toISOString()
              ),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout GFP")), 1e4))
            ]);
            if (gfps && Array.isArray(gfps) && gfps.length > 0) {
              const gfp = gfps[0];
              const qualidade = gfp.quality || "";
              const observacao = [gfp.qualityObservation1, gfp.qualityObservation2, gfp.observation].filter(Boolean).join(" - ") || null;
              const nomeCompleto = oferta.longName || oferta.name;
              await updateVeilingConversaoObservacoes(nomeCompleto, qualidade, observacao);
              atualizadas++;
            }
          } catch (e) {
          }
        }));
      }
      console.log(`[AutoSync] Observa\xE7\xF5es de GFPs atualizadas: ${atualizadas}/${todasOfertas.length - puladas} (${puladas} puladas por timeout)`);
    } catch (e) {
      console.warn("[AutoSync] Erro ao extrair observa\xE7\xF5es de GFPs:", e.message);
    }
    await withRetry(
      () => saveVeilingConfig({ ultimaAtualizacao: /* @__PURE__ */ new Date() }),
      { ...DB_RETRY_OPTS, label: "[AutoSync Veiling] saveVeilingConfig" }
    );
    try {
      const catalogoSync = await syncCatalogosVendaAposSync("veiling");
      if (catalogoSync.removidos > 0 || catalogoSync.atualizados > 0) {
        console.log(`[AutoSync] Cat\xE1logos Veiling: ${catalogoSync.removidos} itens removidos, ${catalogoSync.atualizados} pre\xE7os atualizados`);
      }
    } catch (e) {
      console.warn("[AutoSync] Erro ao sincronizar cat\xE1logos Veiling:", e.message);
    }
    cacheVeilingImages(inseridos.map((p) => ({ offerId: p.offerId, imagemUrl: p.imagemUrl ?? null }))).catch((e) => console.warn("[AutoSync] Erro ao cachear imagens Veiling:", e.message));
    const msg = `AutoSync: ${total} ofertas carregadas.`;
    await withRetry(
      () => registrarSyncHistorico({ fonte: "VEILING", status: "SUCESSO", total, mensagem: msg, duracaoMs: Date.now() - inicio }),
      { ...DB_RETRY_OPTS, label: "[AutoSync Veiling] registrarSyncHistorico" }
    );
    schedulerStatus.veiling.ultimaSync = /* @__PURE__ */ new Date();
    schedulerStatus.veiling.ultimoStatus = "SUCESSO";
    console.log(`[AutoSync] Veiling conclu\xEDdo: ${total} ofertas em ${((Date.now() - inicio) / 1e3).toFixed(1)}s`);
  } catch (err) {
    const msg = `AutoSync falhou: ${err?.message || "erro desconhecido"}`;
    console.error("[AutoSync] Veiling erro:", msg);
    await withRetry(
      () => registrarSyncHistorico({ fonte: "VEILING", status: "FALHA", total: 0, mensagem: msg, duracaoMs: Date.now() - inicio }),
      { ...DB_RETRY_OPTS, label: "[AutoSync Veiling] registrarSyncHistorico FALHA", maxAttempts: 3 }
    ).catch(() => {
    });
    schedulerStatus.veiling.ultimaSync = /* @__PURE__ */ new Date();
    schedulerStatus.veiling.ultimoStatus = "FALHA";
  } finally {
    schedulerStatus.veiling.rodando = false;
  }
}
async function executarSyncCooperflora() {
  if (schedulerStatus.cooperflora.rodando) {
    console.log("[AutoSync] Cooperflora j\xE1 est\xE1 sincronizando, pulando...");
    return;
  }
  schedulerStatus.cooperflora.rodando = true;
  const inicio = Date.now();
  console.log("[AutoSync] Iniciando sincroniza\xE7\xE3o autom\xE1tica da Cooperflora...");
  try {
    const config = await withRetry(
      () => getCooperfloraConfig(),
      { ...DB_RETRY_OPTS, label: "[AutoSync Cooperflora] getCooperfloraConfig" }
    );
    if (!config || !config.login || !config.senha) {
      console.log("[AutoSync] Cooperflora: credenciais n\xE3o configuradas, pulando.");
      schedulerStatus.cooperflora.rodando = false;
      return;
    }
    const dataCarregamento = config.dataCarregamento;
    if (!dataCarregamento) {
      console.log("[AutoSync] Cooperflora: data de carregamento n\xE3o configurada, pulando.");
      schedulerStatus.cooperflora.rodando = false;
      return;
    }
    const https = await import("https");
    const http = await import("http");
    const fetchRaw = (url, options, timeoutMs = 15e3) => {
      return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const lib = urlObj.protocol === "https:" ? https : http;
        const reqOptions = {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: options.method || "GET",
          headers: options.headers || {}
        };
        const req = lib.request(reqOptions, (res) => {
          let data = "";
          res.on("data", (chunk) => data += chunk);
          res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        });
        req.on("error", reject);
        req.setTimeout(timeoutMs, () => {
          req.destroy();
          reject(new Error(`Timeout ap\xF3s ${timeoutMs}ms para ${url}`));
        });
        if (options.body) req.write(options.body);
        req.end();
      });
    };
    const cookieJar = {};
    const extractCookies = (headers) => {
      const setCookies = headers["set-cookie"] || [];
      const arr = Array.isArray(setCookies) ? setCookies : [setCookies];
      arr.forEach((c) => {
        if (!c) return;
        const [pair] = c.split(";");
        const [name, ...valParts] = pair.split("=");
        if (name && valParts.length) cookieJar[name.trim()] = valParts.join("=").trim();
      });
    };
    const indexResp = await fetchRaw("https://comercial.cooperflora.com.br/index.jsp", {
      method: "GET",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
      }
    });
    extractCookies(indexResp.headers);
    const loginApiResp = await fetchRaw("https://apinovo.cooperflora.com.br/api/v1/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://comercial.cooperflora.com.br",
        "Referer": "https://comercial.cooperflora.com.br/index.jsp",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: JSON.stringify({ login: config.login, senha: config.senha })
    });
    let cooperToken = "";
    let usuario = {};
    let menu = [];
    try {
      const loginData = JSON.parse(loginApiResp.body);
      if (loginData?.CODERR !== 0 && loginData?.CODERR !== void 0) {
        throw new Error(`Login Cooperflora falhou: ${loginData?.MSG || "Credenciais inv\xE1lidas"}`);
      }
      cooperToken = loginData?.TOKEN || "";
      usuario = loginData?.USUARIO || {};
      menu = loginData?.MENU || [];
    } catch (e) {
      throw new Error(`Falha no login da Cooperflora: ${e.message}`);
    }
    if (!cooperToken) throw new Error("Falha no login da Cooperflora. Verifique login e senha.");
    const cookieHeader = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join("; ");
    const sessionBody = new URLSearchParams({
      TOKEN: cooperToken,
      USUARIO: JSON.stringify(usuario),
      BASE_URL: "https://apinovo.cooperflora.com.br",
      MENU: JSON.stringify(menu),
      CHAVE_PAGINA: "0"
    }).toString();
    const sessionResp = await fetchRaw("https://comercial.cooperflora.com.br/session/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": cookieHeader,
        "Origin": "https://comercial.cooperflora.com.br",
        "Referer": "https://comercial.cooperflora.com.br/index.jsp",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: sessionBody
    });
    extractCookies(sessionResp.headers);
    const cookieStr = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join("; ");
    if (!cookieStr) throw new Error("Falha ao obter sess\xE3o do site Cooperflora.");
    const chave = config.chave || "62002";
    const rota = config.rota || "463";
    const produtosBody = new URLSearchParams({
      chave,
      rota,
      enderecoEntrega: "0",
      dataCarregamento,
      filial: "",
      indexTr: "-1",
      utilizarCredito: "false",
      utilizarCreditoDisponivel: "false",
      utilizarCaixaSeca: "false",
      grupos: "16,17,18,6,2,21,8,11",
      agencias: "",
      especies: "",
      tamanhos: "",
      cores: "",
      qualidades: "",
      produtores: "",
      temas: "",
      recepcionado: "",
      variedades: ""
    }).toString();
    const produtosResp = await fetchRaw("https://comercial.cooperflora.com.br/pedido/comprar/listarProdutos", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "text/html, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Cookie": cookieStr,
        "Referer": "https://comercial.cooperflora.com.br/pedido/comprar/principal",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      body: produtosBody
    });
    const html = produtosResp.body;
    const allProdutos = [];
    const onclickPattern = /abrirModalComprarProduto\('(\d+)', '([^']+)', '([A-Z0-9]+)','([^']+)'/g;
    const seen = /* @__PURE__ */ new Set();
    let onclickMatch;
    while ((onclickMatch = onclickPattern.exec(html)) !== null) {
      const [, , , codigo, qualidade] = onclickMatch;
      const key = `${codigo}_${qualidade}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const idx = onclickMatch.index;
      const ctx = html.substring(Math.max(0, idx - 2e3), idx);
      const nomeMatches = ctx.match(/<span class="fw-semibold[^"]*"\s*>\s*([^<]+?)\s*<\/span>/g);
      const nomeMatch = nomeMatches ? nomeMatches[nomeMatches.length - 1].match(/>\s*([^<]+?)\s*<\/span>/) : null;
      const nome = nomeMatch ? nomeMatch[1].trim().substring(0, 100) : "";
      if (!nome) continue;
      const precoMatches = ctx.match(/<td class="w-20">\s*(R\$[\d.,]+(?:\s*-\s*[\d.,]+)?)\s*<\/td>/g);
      const precoMatch = precoMatches ? precoMatches[precoMatches.length - 1].match(/(R\$[\d.,]+(?:\s*-\s*[\d.,]+)?)/) : null;
      const preco = precoMatch ? precoMatch[1].trim() : "R$0";
      const estoqueMatches = ctx.substring(ctx.length - 500).match(/<td>\s*(\d+)\s*<\/td>/g);
      const estoqueStr = estoqueMatches ? estoqueMatches[estoqueMatches.length - 1].replace(/<[^>]+>/g, "").trim() : "0";
      const estoque = parseInt(estoqueStr) || 0;
      allProdutos.push({ codigo, nome, preco, qualidade, estoque });
    }
    const produtosParaSalvar = allProdutos.map((p) => {
      const precoStr = p.preco.replace("R$", "").trim();
      const partes = precoStr.split(/\s*-\s*/);
      const precoMin = parseFloat(partes[0].replace(",", ".")) || 0;
      const precoMax = partes.length > 1 ? parseFloat(partes[1].replace(",", ".")) || precoMin : precoMin;
      return {
        codigo: p.codigo,
        nome: p.nome,
        precoMin: String(precoMin),
        precoMax: String(precoMax),
        qualidade: p.qualidade,
        estoque: p.estoque,
        grupo: "",
        imagemUrl: `https://apinovo.cooperflora.com.br/api/v1/imagem?codigo=${p.codigo}`,
        dataCarregamento,
        atualizadoEm: /* @__PURE__ */ new Date()
      };
    });
    await withRetry(
      () => upsertCooperfloraProdutos(produtosParaSalvar),
      { ...DB_RETRY_OPTS, label: "[AutoSync Cooperflora] upsertCooperfloraProdutos" }
    );
    await withRetry(
      () => upsertCooperfloraConfig({ ultimaAtualizacao: /* @__PURE__ */ new Date(), dataCarregamento }),
      { ...DB_RETRY_OPTS, label: "[AutoSync Cooperflora] upsertCooperfloraConfig" }
    );
    const sleep3 = (ms) => new Promise((r) => setTimeout(r, ms));
    const buscarHastesProduto = async (prod) => {
      const detBody = new URLSearchParams({
        chave,
        dataCarregamento,
        produto: prod.codigo,
        qualidade: prod.qualidade,
        rota,
        endereco: "0",
        compraRapida: "false",
        filial: "",
        indexTr: "-1",
        utilizaCredito: "false",
        utilizarCreditoDisponivel: "false",
        valorCreditoDisponivel: "0",
        utilizarCaixaSeca: "false"
      }).toString();
      const detResp = await fetchRaw("https://comercial.cooperflora.com.br/pedido/comprar/detalheProduto", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Accept": "text/html, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          "Cookie": cookieStr,
          "Referer": "https://comercial.cooperflora.com.br/pedido/comprar/principal",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        body: detBody
      }, 1e4);
      const detHtml = detResp.body;
      const hMatch = detHtml.match(/Hastes[^<]*<\/[^>]+>\s*<[^>]+>\s*(\d+)/);
      const hastesNum = hMatch ? parseInt(hMatch[1]) : 1;
      const trPat = /<tr[^>]*data-cod-sitio="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/;
      const trM = trPat.exec(detHtml);
      let hastesEmbNum = 1;
      if (trM) {
        const tds = trM[2].match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
        const embTd = tds[3] || "";
        const embText = embTd.replace(/<[^>]+>/g, "").trim();
        const embM = embText.match(/(\d+)/);
        if (embM) hastesEmbNum = parseInt(embM[1]);
      }
      await updateCooperfloraHastes(prod.codigo, hastesNum > 0 ? hastesNum : 1, hastesEmbNum);
    };
    const BATCH_SIZE = 5;
    for (let i = 0; i < produtosParaSalvar.length; i += BATCH_SIZE) {
      const lote = produtosParaSalvar.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(lote.map((prod) => buscarHastesProduto(prod)));
      if (i + BATCH_SIZE < produtosParaSalvar.length) await sleep3(300);
    }
    const margemSync = parseFloat(String(config.margemPadrao || "30"));
    const syncResult = await withRetry(
      () => syncProdutosVendaFromCooperflora(margemSync),
      { ...DB_RETRY_OPTS, label: "[AutoSync Cooperflora] syncProdutosVendaFromCooperflora" }
    );
    try {
      const catalogoSyncCoop = await syncCatalogosVendaAposSync("cooperflora");
      if (catalogoSyncCoop.removidos > 0 || catalogoSyncCoop.atualizados > 0) {
        console.log(`[AutoSync] Cat\xE1logos Cooperflora: ${catalogoSyncCoop.removidos} itens removidos, ${catalogoSyncCoop.atualizados} pre\xE7os atualizados`);
      }
    } catch (e) {
      console.warn("[AutoSync] Erro ao sincronizar cat\xE1logos Cooperflora:", e.message);
    }
    const totalProdutos = produtosParaSalvar.length;
    const syncMsg = `AutoSync: ${totalProdutos} produtos. Vendas: +${syncResult.criados} novos, ${syncResult.atualizados} atualizados.`;
    await withRetry(
      () => registrarSyncHistorico({ fonte: "COOPERFLORA", status: "SUCESSO", total: totalProdutos, mensagem: syncMsg, duracaoMs: Date.now() - inicio }),
      { ...DB_RETRY_OPTS, label: "[AutoSync Cooperflora] registrarSyncHistorico" }
    );
    schedulerStatus.cooperflora.ultimaSync = /* @__PURE__ */ new Date();
    schedulerStatus.cooperflora.ultimoStatus = "SUCESSO";
    console.log(`[AutoSync] Cooperflora conclu\xEDdo: ${totalProdutos} produtos em ${((Date.now() - inicio) / 1e3).toFixed(1)}s`);
  } catch (err) {
    const msg = `AutoSync falhou: ${err?.message || "erro desconhecido"}`;
    console.error("[AutoSync] Cooperflora erro:", msg);
    await withRetry(
      () => registrarSyncHistorico({ fonte: "COOPERFLORA", status: "FALHA", total: 0, mensagem: msg, duracaoMs: Date.now() - inicio }),
      { ...DB_RETRY_OPTS, label: "[AutoSync Cooperflora] registrarSyncHistorico FALHA", maxAttempts: 3 }
    ).catch(() => {
    });
    schedulerStatus.cooperflora.ultimaSync = /* @__PURE__ */ new Date();
    schedulerStatus.cooperflora.ultimoStatus = "FALHA";
  } finally {
    schedulerStatus.cooperflora.rodando = false;
  }
}
function iniciarAutoSync() {
  console.log(`[AutoSync] Scheduler iniciado \u2014 sincroniza\xE7\xE3o a cada ${INTERVALO_MS / 6e4} minutos`);
  const agora = Date.now();
  schedulerStatus.cooperflora.proximaSync = new Date(agora + INTERVALO_MS);
  schedulerStatus.veiling.proximaSync = new Date(agora + INTERVALO_MS);
  setInterval(async () => {
    schedulerStatus.veiling.proximaSync = new Date(Date.now() + INTERVALO_MS);
    await executarSyncVeiling();
  }, INTERVALO_MS);
  setTimeout(() => {
    setInterval(async () => {
      schedulerStatus.cooperflora.proximaSync = new Date(Date.now() + INTERVALO_MS);
      await executarSyncCooperflora();
    }, INTERVALO_MS);
    executarSyncCooperflora().catch(console.error);
  }, 2 * 60 * 1e3);
  setTimeout(() => {
    executarSyncVeiling().catch(console.error);
  }, 3 * 60 * 1e3);
  getVeilingConfig().then((cfg) => {
    if (!cfg?.dataCarregamento) {
      const data = proximoDiaUtil();
      saveVeilingConfig({ dataCarregamento: data }).then(() => console.log(`[AutoSync] Data de carregamento Veiling inicializada: ${data}`)).catch(console.error);
    }
  }).catch(console.error);
  getCooperfloraConfig().then((cfg) => {
    if (!cfg?.dataCarregamento) {
      const data = proximoDiaUtil();
      upsertCooperfloraConfig({ dataCarregamento: data }).then(() => console.log(`[AutoSync] Data de carregamento Cooperflora inicializada: ${data}`)).catch(console.error);
    }
  }).catch(console.error);
  agendarJobDataCarregamento();
  agendarImportacaoPedidos();
}
async function executarImportacaoPedidosVeiling() {
  console.log("[AutoSync] Iniciando importa\xE7\xE3o autom\xE1tica de pedidos Veiling...");
  try {
    const config = await withRetry(
      () => getVeilingConfig(),
      { ...DB_RETRY_OPTS, label: "[AutoSync ImportPedidos] getVeilingConfig" }
    );
    if (!config?.usuario || !config?.senha) {
      console.log("[AutoSync] Importa\xE7\xE3o pedidos Veiling: credenciais n\xE3o configuradas, pulando.");
      return;
    }
    const tokenData = await veilingLogin(config.usuario, config.senha);
    const token = tokenData.access_token;
    const customerId = config.customerId || "987";
    const targetDate = /* @__PURE__ */ new Date();
    const dateStr = targetDate.toISOString().split("T")[0];
    const dataBR = dateStr.split("-").reverse().join("/");
    const exportUrl = `https://backend.veilingonline.com.br/ecommerce/api/Order/export?startDate=${dateStr}&endDate=${dateStr}&filterBy=purchaseDate&customerId=${customerId}`;
    const exportResp = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!exportResp.ok) {
      const errText = await exportResp.text();
      await createVeilingImportacao({ dataPedidos: dateStr, totalItens: 0, totalPedidos: 0, status: "ERRO", mensagem: `HTTP ${exportResp.status}: ${errText.substring(0, 200)}`, origem: "AUTOMATICO" });
      return;
    }
    const contentType = exportResp.headers.get("content-type") || "";
    let buffer;
    if (contentType.includes("json")) {
      const jsonData = await exportResp.json();
      if (!jsonData || jsonData.length === 0) {
        await createVeilingImportacao({ dataPedidos: dateStr, totalItens: 0, totalPedidos: 0, status: "SUCESSO", mensagem: `Nenhum pedido para ${dataBR}`, origem: "AUTOMATICO" });
        return;
      }
      const ws2 = XLSX.utils.json_to_sheet(jsonData);
      const wb2 = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb2, ws2, "Pedidos");
      buffer = Buffer.from(XLSX.write(wb2, { type: "buffer", bookType: "xlsx" }));
    } else {
      const arrayBuffer = await exportResp.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) {
      await createVeilingImportacao({ dataPedidos: dateStr, totalItens: 0, totalPedidos: 0, status: "ERRO", mensagem: "Planilha vazia", origem: "AUTOMATICO" });
      return;
    }
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    const parseResult = parseVeilingRows(rows);
    if (!parseResult.success || parseResult.items.length === 0) {
      await createVeilingImportacao({ dataPedidos: dateStr, totalItens: 0, totalPedidos: 0, status: "PARCIAL", mensagem: parseResult.error || `Nenhum item v\xE1lido para ${dataBR}`, origem: "AUTOMATICO" });
      return;
    }
    const items = parseResult.items;
    const fornecedor = extractFornecedorFromChave(parseResult.chaveInfo) || config.usuario;
    const produtosResult = await listProdutosLoja({ limit: 1e3 });
    const produtosList = produtosResult.items || [];
    const numerosNovos = items.map((i) => i.pedido).filter(Boolean);
    const existentesSet = /* @__PURE__ */ new Set();
    if (numerosNovos.length > 0) {
      const existentes = await checkTransacoesExistentes(numerosNovos);
      existentes.forEach((e) => {
        if (e.transacaoGfp) existentesSet.add(String(e.transacaoGfp));
      });
    }
    const itensPayload = items.map((item) => {
      const existing = produtosList.find((p) => p.nome?.toLowerCase() === item.descricao?.toLowerCase());
      const qtdTotal = item.totalUn || 1;
      const isDuplicado = item.pedido ? existentesSet.has(item.pedido) : false;
      return {
        produtoId: existing?.id ?? void 0,
        produtoNome: item.descricao,
        quantidade: String(qtdTotal),
        valorUnitario: String(item.vlrUnit || 0),
        subtotal: String(qtdTotal * (item.vlrUnit || 0)),
        transacaoGfp: item.pedido || null,
        isDuplicado: isDuplicado ? 1 : 0
      };
    });
    const total = itensPayload.reduce((s, i) => s + parseFloat(i.subtotal), 0);
    const compraId = await withRetry(
      () => createCompra(
        { fornecedor, data: dateStr, total: total.toFixed(2), origem: "IMPORTACAO" },
        itensPayload
      ),
      { ...DB_RETRY_OPTS, label: "[AutoSync ImportPedidos] createCompra" }
    );
    for (const item of itensPayload) {
      if (item.produtoNome?.trim()) {
        await withRetry(
          () => upsertProdutoLojaFromCompra({
            nome: item.produtoNome.trim(),
            precoCusto: parseFloat(item.valorUnitario) || 0,
            quantidade: parseFloat(item.quantidade) || 0
          }),
          { ...DB_RETRY_OPTS, label: "[AutoSync ImportPedidos] upsertProdutoLojaFromCompra" }
        );
      }
    }
    await withRetry(
      () => createVeilingImportacao({ dataPedidos: dateStr, totalItens: items.length, totalPedidos: 1, compraId, status: "SUCESSO", mensagem: `${items.length} itens importados de ${dataBR}`, origem: "AUTOMATICO" }),
      { ...DB_RETRY_OPTS, label: "[AutoSync ImportPedidos] createVeilingImportacao" }
    );
    console.log(`[AutoSync] Importa\xE7\xE3o pedidos Veiling: ${items.length} itens importados de ${dataBR}`);
  } catch (err) {
    console.error("[AutoSync] Erro na importa\xE7\xE3o de pedidos Veiling:", err?.message);
    try {
      const dateStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      await createVeilingImportacao({ dataPedidos: dateStr, totalItens: 0, totalPedidos: 0, status: "ERRO", mensagem: err?.message || "erro desconhecido", origem: "AUTOMATICO" });
    } catch {
    }
  }
}
function agendarImportacaoPedidos() {
  function disparar() {
    schedulerStatus.importacaoPedidos.rodando = true;
    executarImportacaoPedidosVeiling().then(() => {
      schedulerStatus.importacaoPedidos.ultimaSync = /* @__PURE__ */ new Date();
      schedulerStatus.importacaoPedidos.ultimoStatus = "SUCESSO";
    }).catch((err) => {
      schedulerStatus.importacaoPedidos.ultimaSync = /* @__PURE__ */ new Date();
      schedulerStatus.importacaoPedidos.ultimoStatus = "FALHA";
      console.error("[AutoSync] Importa\xE7\xE3o pedidos falhou:", err?.message);
    }).finally(() => {
      schedulerStatus.importacaoPedidos.rodando = false;
      const nextDelay = msAteProximas18hSP() + 6e4;
      schedulerStatus.importacaoPedidos.proximaSync = new Date(Date.now() + nextDelay);
      setTimeout(disparar, nextDelay);
    });
  }
  const delay = msAteProximas18hSP();
  const horas = Math.floor(delay / 36e5);
  const mins = Math.floor(delay % 36e5 / 6e4);
  schedulerStatus.importacaoPedidos.proximaSync = new Date(Date.now() + delay);
  console.log(`[AutoSync] Job importa\xE7\xE3o pedidos Veiling: pr\xF3xima execu\xE7\xE3o em ${horas}h${mins}m (\xE0s 18h SP)`);
  setTimeout(disparar, delay);
}

// server/pedidoPublicoEmitter.ts
import { EventEmitter as EventEmitter2 } from "events";
var PedidoPublicoEmitter = class extends EventEmitter2 {
  pending = [];
  emit(event, data) {
    this.pending.push({ ...data, timestamp: Date.now() });
    if (this.pending.length > 20) this.pending.shift();
    return super.emit(event, data);
  }
  getPending(since) {
    return this.pending.filter((p) => (p.timestamp ?? 0) > since);
  }
};
var pedidoPublicoEmitter = new PedidoPublicoEmitter();
pedidoPublicoEmitter.setMaxListeners(100);
var PEDIDO_PUBLICO_EVENT = "pedido-publico:novo";

// server/routers.ts
import { eq as eq2, and as and2, isNull as isNull2, sql as sql2 } from "drizzle-orm";
import * as XLSX2 from "xlsx";
init_schema();
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // ─── Vendedores (Login interno ERP) ───
  vendedores: router({
    login: publicProcedure.input(z2.object({ nome: z2.string(), senha: z2.string() })).mutation(async ({ input }) => {
      const v = await getVendedorByLogin(input.nome, input.senha);
      if (!v) return { success: false, error: "Usu\xE1rio ou senha inv\xE1lidos" };
      return { success: true, vendedor: { id: v.id, nome: v.nome, email: v.email, telefone: v.telefone, perfil: v.perfil } };
    }),
    list: protectedProcedure.query(async () => {
      return listVendedores();
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getVendedor(input.id);
    }),
    create: protectedProcedure.input(z2.object({
      nome: z2.string().min(1),
      email: z2.string().optional(),
      telefone: z2.string().optional(),
      senha: z2.string().min(1),
      perfil: z2.enum(["ADMIN", "VENDEDOR"])
    })).mutation(async ({ input }) => {
      const id = await createVendedor(input);
      return { id };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      nome: z2.string().optional(),
      email: z2.string().optional(),
      telefone: z2.string().optional(),
      senha: z2.string().optional(),
      perfil: z2.enum(["ADMIN", "VENDEDOR"]).optional(),
      usuarioNome: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, usuarioNome, ...data } = input;
      const old = await getVendedor(id);
      if (old && usuarioNome) {
        const fields = ["nome", "email", "telefone", "perfil"];
        for (const f of fields) {
          if (data[f] !== void 0 && data[f] !== old[f]) {
            await createHistorico({ tabela: "vendedores", registroId: id, campo: f, valorAntigo: String(old[f] ?? ""), valorNovo: String(data[f]), usuarioNome });
          }
        }
        if (data.senha && data.senha !== old.senha) {
          await createHistorico({ tabela: "vendedores", registroId: id, campo: "senha", valorAntigo: "***", valorNovo: "***", usuarioNome });
        }
      }
      await updateVendedor(id, data);
      return { success: true };
    })
  }),
  // ─── Clientes ───
  clientes: router({
    list: protectedProcedure.input(z2.object({ search: z2.string().optional() }).optional()).query(async ({ input }) => {
      return listClientes(input?.search);
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getCliente(input.id);
    }),
    create: protectedProcedure.input(z2.object({
      nome: z2.string().min(1),
      telefone: z2.string().optional(),
      whatsapp: z2.string().optional(),
      email: z2.string().optional(),
      endereco: z2.string().optional()
    })).mutation(async ({ input }) => {
      const id = await createCliente(input);
      return { id };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      nome: z2.string().optional(),
      telefone: z2.string().optional(),
      whatsapp: z2.string().optional(),
      email: z2.string().optional(),
      endereco: z2.string().optional(),
      usuarioNome: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, usuarioNome, ...data } = input;
      const old = await getCliente(id);
      if (old && usuarioNome) {
        const fields = ["nome", "telefone", "whatsapp", "email", "endereco"];
        for (const f of fields) {
          if (data[f] !== void 0 && data[f] !== old[f]) {
            await createHistorico({ tabela: "clientes", registroId: id, campo: f, valorAntigo: String(old[f] ?? ""), valorNovo: String(data[f]), usuarioNome });
          }
        }
      }
      await updateCliente(id, data);
      return { success: true };
    }),
    historico: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return listHistorico("clientes", input.id);
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteCliente(input.id);
      return { success: true };
    }),
    lixeira: protectedProcedure.query(async () => {
      return listClientesLixeira();
    }),
    restore: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await restoreCliente(input.id);
      return { success: true };
    }),
    deletePermanente: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteClientePermanente(input.id);
      return { success: true };
    }),
    listBloqueados: protectedProcedure.input(z2.object({ search: z2.string().optional() }).optional()).query(async ({ input }) => {
      return listClientesBloqueados(input?.search);
    }),
    bloquear: protectedProcedure.input(z2.object({
      clienteId: z2.number(),
      motivo: z2.string().min(1),
      usuarioNome: z2.string().optional()
    })).mutation(async ({ input }) => {
      await bloquearCliente(input.clienteId, input.motivo, input.usuarioNome);
      return { success: true };
    }),
    desbloquear: protectedProcedure.input(z2.object({ clienteId: z2.number() })).mutation(async ({ input }) => {
      await desbloquearCliente(input.clienteId);
      return { success: true };
    }),
    listTelefones: protectedProcedure.input(z2.object({ clienteId: z2.number() })).query(async ({ input }) => {
      return listTelefonesClienteBloqueado(input.clienteId);
    }),
    addTelefone: protectedProcedure.input(z2.object({
      clienteId: z2.number(),
      telefone: z2.string().min(1)
    })).mutation(async ({ input }) => {
      await addTelefoneClienteBloqueado(input.clienteId, input.telefone);
      return { success: true };
    }),
    removeTelefone: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await removeTelefoneClienteBloqueado(input.id);
      return { success: true };
    })
  }),
  // ─── Produtos ───
  produtos: router({
    list: protectedProcedure.input(z2.object({ search: z2.string().optional() }).optional()).query(async ({ input }) => {
      return calcularEstoqueTodos();
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const p = await getProduto(input.id);
      if (!p) return void 0;
      const estoque = await calcularEstoqueProduto(p.id);
      return { ...p, estoque };
    }),
    getByDescricao: protectedProcedure.input(z2.object({ descricao: z2.string() })).query(async ({ input }) => {
      return getProdutoByDescricao(input.descricao);
    }),
    create: protectedProcedure.input(z2.object({
      descricao: z2.string().min(1),
      preco: z2.string().optional(),
      custo: z2.string().optional(),
      fatorConversao: z2.string().optional(),
      codigoExterno: z2.string().optional()
    })).mutation(async ({ input }) => {
      const custo = Number(input.custo || 0);
      const fator = Number(input.fatorConversao || 1);
      const precoCalc = input.preco || String((custo * fator).toFixed(2));
      const id = await createProduto({ ...input, preco: precoCalc, custo: String(custo), fatorConversao: String(fator) });
      await upsertProdutoLojaFromCompra({
        nome: input.descricao,
        precoCusto: custo || void 0,
        codigoExterno: input.codigoExterno
      });
      return { id };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      descricao: z2.string().optional(),
      preco: z2.string().optional(),
      custo: z2.string().optional(),
      fatorConversao: z2.string().optional(),
      codigoExterno: z2.string().optional(),
      usuarioNome: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, usuarioNome, ...data } = input;
      if (data.custo !== void 0 || data.fatorConversao !== void 0) {
        const old2 = await getProduto(id);
        const custo = Number(data.custo ?? old2?.custo ?? 0);
        const fator = Number(data.fatorConversao ?? old2?.fatorConversao ?? 1);
        data.preco = String((custo * fator).toFixed(2));
      }
      const old = await getProduto(id);
      if (old && usuarioNome) {
        const fields = ["descricao", "preco", "custo", "fatorConversao", "codigoExterno"];
        for (const f of fields) {
          if (data[f] !== void 0 && String(data[f]) !== String(old[f] ?? "")) {
            await createHistorico({ tabela: "produtos", registroId: id, campo: f, valorAntigo: String(old[f] ?? ""), valorNovo: String(data[f]), usuarioNome });
          }
        }
      }
      await updateProduto(id, data);
      return { success: true };
    }),
    aplicarPrecosImportados: protectedProcedure.input(z2.object({
      precos: z2.array(z2.object({
        produtoNome: z2.string(),
        preco1: z2.number(),
        preco2: z2.number(),
        preco3: z2.number()
      }))
    })).mutation(async ({ input }) => {
      let atualizados = 0;
      let erros = [];
      for (const item of input.precos) {
        try {
          const produto = await getProdutoByDescricao(item.produtoNome);
          if (!produto) {
            erros.push(`Produto "${item.produtoNome}" n\xE3o encontrado`);
            continue;
          }
          await updateProduto(produto.id, { preco: String(item.preco1.toFixed(2)) });
          atualizados++;
        } catch (e) {
          erros.push(`Erro ao atualizar "${item.produtoNome}": ${e.message}`);
        }
      }
      return { atualizados, erros, total: input.precos.length };
    }),
    historico: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return listHistorico("produtos", input.id);
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteProduto(input.id);
      return { success: true };
    }),
    // Lixeira
    lixeira: protectedProcedure.query(async () => {
      return listProdutosLixeira();
    }),
    restore: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await restoreProduto(input.id);
      return { success: true };
    }),
    deletePermanente: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteProdutoPermanente(input.id);
      return { success: true };
    })
  }),
  // ─── Estoque ───
  estoque: router({
    list: protectedProcedure.query(async () => {
      return calcularEstoqueTodos();
    }),
    kardex: protectedProcedure.input(z2.object({ produtoId: z2.number() })).query(async ({ input }) => {
      return getKardex(input.produtoId);
    }),
    ajustar: protectedProcedure.input(z2.object({
      produtoId: z2.number(),
      produtoNome: z2.string(),
      quantidade: z2.string(),
      motivo: z2.string().optional(),
      usuarioNome: z2.string().optional()
    })).mutation(async ({ input }) => {
      const id = await createAjusteEstoque(input);
      return { id };
    })
  }),
  // ─── Vendas ───
  vendas: router({
    list: protectedProcedure.input(z2.object({ search: z2.string().optional() }).optional()).query(async ({ input }) => {
      const vendasList = await listVendas(input?.search);
      const ids = vendasList.map((v) => v.id);
      const faturadosIds = await getVendasFaturadosIds(ids);
      const faturadosSet = new Set(faturadosIds);
      const result = [];
      for (const v of vendasList) {
        const itens = await getVendaItens(v.id);
        result.push({ ...v, itens, isFaturado: faturadosSet.has(v.id) });
      }
      return result;
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const v = await getVenda(input.id);
      if (!v) return void 0;
      const itens = await getVendaItens(v.id);
      return { ...v, itens };
    }),
    recrearOrcamentos: protectedProcedure.mutation(async () => {
      const orcamentos = [
        {
          numero: "540013",
          cliente: "RC FESTAS",
          data: "2026-04-16",
          vendedor: "THIAGO",
          total: "2781.62",
          status: "AGUARDANDO",
          itens: [
            { produtoNome: "FOLHAGEM LATANIA M", quantidade: "4", valorUnitario: "18.00", subtotal: "72.00" },
            { produtoNome: "FOLHAGEM CAPIM PAMPA", quantidade: "4", valorUnitario: "35.00", subtotal: "140.00" },
            { produtoNome: "ALSTROEMERIA BRANCA", quantidade: "7", valorUnitario: "31.92", subtotal: "223.44" },
            { produtoNome: "LISIANTHUS BRANCO", quantidade: "3", valorUnitario: "75.00", subtotal: "225.00" },
            { produtoNome: "GYPSOPHILA PANICULATA PEARLS BLOSSOM 070 CM MIN 250 GRAMAS", quantidade: "7", valorUnitario: "28.00", subtotal: "196.00" },
            { produtoNome: "BOCA DE LEAO BRANCA", quantidade: "5", valorUnitario: "31.08", subtotal: "155.40" },
            { produtoNome: "ROSA BRANCA 40 CM", quantidade: "4", valorUnitario: "51.80", subtotal: "207.20" },
            { produtoNome: "FOLHAGEM TUIA", quantidade: "12", valorUnitario: "16.16", subtotal: "193.92" },
            { produtoNome: "LISIANTHUS FLOR BRANCO", quantidade: "25", valorUnitario: "8.77", subtotal: "219.25" },
            { produtoNome: "FOLHAGEM EUCAFLOR", quantidade: "4", valorUnitario: "25.00", subtotal: "100.00" },
            { produtoNome: "FOLHAGEM PAULISTINHA", quantidade: "5", valorUnitario: "25.00", subtotal: "125.00" },
            { produtoNome: "FOLHAGEM ARICANA", quantidade: "25", valorUnitario: "7.00", subtotal: "175.00" },
            { produtoNome: "FOLHAGEM MONSTERA 30 CM", quantidade: "3", valorUnitario: "24.47", subtotal: "73.41" },
            { produtoNome: "ASTER MARIANA", quantidade: "40", valorUnitario: "16.90", subtotal: "676.00" }
          ]
        },
        {
          numero: "540014",
          cliente: "RC FESTAS",
          data: "2026-04-16",
          vendedor: "THIAGO",
          total: "2589.89",
          status: "AGUARDANDO",
          itens: [
            { produtoNome: "ALSTROEMERIA LILAS", quantidade: "4", valorUnitario: "30.80", subtotal: "123.20" },
            { produtoNome: "ALSTROEMERIA BRANCA", quantidade: "4", valorUnitario: "31.92", subtotal: "127.68" },
            { produtoNome: "ALSTROEMERIA ROSA CLARO", quantidade: "4", valorUnitario: "37.38", subtotal: "149.52" },
            { produtoNome: "LIMONIUM LILAS", quantidade: "4", valorUnitario: "24.04", subtotal: "96.16" },
            { produtoNome: "LISIANTHUS ROSA CLARO", quantidade: "3", valorUnitario: "75.00", subtotal: "225.00" },
            { produtoNome: "FOLHAGEM TUIA", quantidade: "10", valorUnitario: "16.16", subtotal: "161.60" },
            { produtoNome: "LISIANTHUS LILAS", quantidade: "4", valorUnitario: "75.00", subtotal: "300.00" },
            { produtoNome: "GYPSOPHILA PANICULATA PEARLS BLOSSOM 070 CM MIN 250 GRAMAS", quantidade: "6", valorUnitario: "28.00", subtotal: "168.00" },
            { produtoNome: "ASTER MARIANA", quantidade: "10", valorUnitario: "16.90", subtotal: "169.00" },
            { produtoNome: "FOLHAGEM EUCAFLOR", quantidade: "6", valorUnitario: "25.00", subtotal: "150.00" },
            { produtoNome: "BOCA DE LEAO BRANCA", quantidade: "5", valorUnitario: "31.08", subtotal: "155.40" },
            { produtoNome: "ROSA LILAS 40 CM", quantidade: "4", valorUnitario: "59.92", subtotal: "239.68" },
            { produtoNome: "ROSA BRANCA 40 CM", quantidade: "3", valorUnitario: "51.80", subtotal: "155.40" },
            { produtoNome: "LISIANTHUS FLOR BRANCO", quantidade: "25", valorUnitario: "8.77", subtotal: "219.25" },
            { produtoNome: "FOLHAGEM PAULISTINHA", quantidade: "6", valorUnitario: "25.00", subtotal: "150.00" }
          ]
        }
      ];
      const createdIds = [];
      for (const orc of orcamentos) {
        const id = await createVenda({
          clienteNome: orc.cliente,
          vendedorNome: orc.vendedor,
          data: orc.data,
          status: orc.status,
          total: orc.total
        }, orc.itens);
        createdIds.push(id);
      }
      return { success: true, message: `${createdIds.length} or\xE7amentos recriados com sucesso!`, ids: createdIds };
    }),
    create: protectedProcedure.input(z2.object({
      clienteId: z2.number().optional(),
      clienteNome: z2.string().optional(),
      vendedorId: z2.number().optional(),
      vendedorNome: z2.string().optional(),
      data: z2.string(),
      status: z2.enum(["AGUARDANDO", "APROVADO", "CANCELADO"]).optional(),
      logistica: z2.string().optional(),
      total: z2.string(),
      frete: z2.string().optional(),
      vencimento: z2.string().optional(),
      telefoneCliente: z2.string().optional(),
      dataEntrega: z2.string().optional(),
      horaEntrega: z2.string().optional(),
      observacaoPedido: z2.string().optional(),
      itens: z2.array(z2.object({
        produtoId: z2.number().nullish(),
        produtoNome: z2.string(),
        quantidade: z2.string(),
        valorUnitario: z2.string(),
        subtotal: z2.string(),
        observacao: z2.string().nullish()
      }))
    })).mutation(async ({ input }) => {
      for (const item of input.itens) {
        item.subtotal = (Number(item.quantidade) * Number(item.valorUnitario)).toFixed(2);
      }
      input.total = input.itens.reduce((s, i) => s + Number(i.subtotal), 0).toFixed(2);
      const { itens, ...vendaData } = input;
      const id = await createVenda(vendaData, itens);
      return { id };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      clienteNome: z2.string().optional(),
      data: z2.string().optional(),
      status: z2.enum(["AGUARDANDO", "APROVADO", "CANCELADO", "EXPIRADO"]).optional(),
      logistica: z2.string().optional(),
      total: z2.string().optional(),
      frete: z2.string().optional(),
      vencimento: z2.string().optional().nullable(),
      telefoneCliente: z2.string().optional(),
      dataEntrega: z2.string().optional(),
      horaEntrega: z2.string().optional(),
      observacaoPedido: z2.string().optional(),
      itens: z2.array(z2.object({
        produtoId: z2.number().nullish(),
        produtoNome: z2.string(),
        quantidade: z2.string(),
        valorUnitario: z2.string(),
        subtotal: z2.string(),
        observacao: z2.string().nullish()
      })).optional()
    })).mutation(async ({ input }) => {
      const { id, itens, ...data } = input;
      await updateVenda(id, data, itens);
      if (itens && itens.length > 0) {
        await sincronizarPedidosCompraAoAlterarOrcamento(id, itens);
      }
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const faturado = await isVendaFaturada(input.id);
      if (faturado) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: `Este or\xE7amento j\xE1 foi faturado e n\xE3o pode ser exclu\xEDdo. Para exclu\xED-lo, desfature a venda primeiro.`
        });
      }
      await deleteVenda(input.id);
      return { success: true };
    }),
    deleteMany: protectedProcedure.input(z2.object({ ids: z2.array(z2.number()).min(1) })).mutation(async ({ input }) => {
      const faturadosIds = await getVendasFaturadosIds(input.ids);
      if (faturadosIds.length > 0) {
        const nums = faturadosIds.map((id) => `#${id}`).join(", ");
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: `${faturadosIds.length === 1 ? "O or\xE7amento" : "Os or\xE7amentos"} ${nums} j\xE1 ${faturadosIds.length === 1 ? "foi faturado" : "foram faturados"} e n\xE3o pode${faturadosIds.length === 1 ? "" : "m"} ser exclu\xEDdo${faturadosIds.length === 1 ? "" : "s"}.`
        });
      }
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { vendas: vendasTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { inArray: inArr } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      await dbConn.update(vendasTable).set({ deletedAt: /* @__PURE__ */ new Date() }).where(inArr(vendasTable.id, input.ids));
      return { deleted: input.ids.length };
    }),
    lixeira: protectedProcedure.query(async () => {
      return listVendasLixeira();
    }),
    restore: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await restoreVenda(input.id);
      return { success: true };
    }),
    deletePermanente: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteVendaPermanente(input.id);
      return { success: true };
    }),
    // ─── Endpoints para o modal "Adicionar ao Orçamento" nos catálogos ───
    listAbertos: protectedProcedure.query(async () => {
      const todos = await listVendas();
      return todos.filter((v) => v.status === "AGUARDANDO" && !v.deletedAt).map((v) => ({
        id: v.id,
        numero: v.id,
        clienteNome: v.clienteNome || "(sem cliente)",
        data: v.data,
        total: v.total,
        status: v.status
      }));
    }),
    addItemToOrcamento: protectedProcedure.input(z2.object({
      orcamentoId: z2.number(),
      produtoNome: z2.string(),
      quantidade: z2.string(),
      valorUnitario: z2.string(),
      subtotal: z2.string(),
      obs: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { vendaItens: vendaItensTable, vendas: vendasTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, sql: sqlFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      await dbConn.insert(vendaItensTable).values({
        vendaId: input.orcamentoId,
        produtoNome: input.produtoNome,
        quantidade: input.quantidade,
        valorUnitario: input.valorUnitario,
        subtotal: input.subtotal,
        observacao: input.obs || ""
      });
      await dbConn.update(vendasTable).set({ total: sqlFn`CAST(COALESCE(total, 0) AS DECIMAL(10,2)) + ${parseFloat(input.subtotal)}` }).where(eqFn(vendasTable.id, input.orcamentoId));
      return { success: true };
    }),
    // ─── Adicionar múltiplos itens de uma vez (lote) ───
    addItensLote: protectedProcedure.input(z2.object({
      orcamentoId: z2.number(),
      itens: z2.array(z2.object({
        produtoNome: z2.string(),
        quantidade: z2.string(),
        valorUnitario: z2.string(),
        subtotal: z2.string(),
        obs: z2.string().optional()
      }))
    })).mutation(async ({ input }) => {
      const now = /* @__PURE__ */ new Date();
      const dayOfWeek = now.getDay();
      const hour = now.getHours();
      const isBlockedTime = dayOfWeek === 2 && hour >= 20 || dayOfWeek === 3 || dayOfWeek === 4 && hour < 7;
      if (isBlockedTime) {
        throw new Error("Pedidos bloqueados de ter\xE7a \xE0s 20:00 at\xE9 quinta \xE0s 07:00. Em caso de d\xFAvidas, chamar no WhatsApp.");
      }
      if (input.itens.length === 0) return { success: true, count: 0 };
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { vendaItens: vendaItensTable, vendas: vendasTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, sql: sqlFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      await dbConn.insert(vendaItensTable).values(
        input.itens.map((item) => ({
          vendaId: input.orcamentoId,
          produtoNome: item.produtoNome,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          subtotal: item.subtotal,
          observacao: item.obs || ""
        }))
      );
      const totalAdicional = input.itens.reduce((s, i) => s + parseFloat(i.subtotal), 0);
      await dbConn.update(vendasTable).set({ total: sqlFn`CAST(COALESCE(total, 0) AS DECIMAL(10,2)) + ${totalAdicional}` }).where(eqFn(vendasTable.id, input.orcamentoId));
      return { success: true, count: input.itens.length };
    }),
    // ─── Criar orçamento com múltiplos itens (lote) ───
    createComItensLote: protectedProcedure.input(z2.object({
      clienteNome: z2.string().optional(),
      clienteId: z2.number().optional(),
      origem: z2.enum(["catalogo-publico", "interno"]).optional(),
      itens: z2.array(z2.object({
        produtoNome: z2.string(),
        quantidade: z2.string(),
        valorUnitario: z2.string(),
        subtotal: z2.string(),
        obs: z2.string().optional()
      }))
    })).mutation(async ({ input }) => {
      const now = /* @__PURE__ */ new Date();
      const dayOfWeek = now.getDay();
      const hour = now.getHours();
      const isBlockedTime = dayOfWeek === 2 && hour >= 20 || dayOfWeek === 3 || dayOfWeek === 4 && hour < 7;
      if (isBlockedTime) {
        throw new Error("Pedidos bloqueados de ter\xE7a \xE0s 20:00 at\xE9 quinta \xE0s 07:00. Em caso de d\xFAvidas, chamar no WhatsApp.");
      }
      if (input.itens.length === 0) throw new Error("Nenhum item informado");
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { vendas: vendasTable, vendaItens: vendaItensTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const hoje = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const totalGeral = input.itens.reduce((s, i) => s + parseFloat(i.subtotal), 0).toFixed(2);
      const [result] = await dbConn.insert(vendasTable).values({
        clienteNome: input.clienteNome || "",
        clienteId: input.clienteId || null,
        data: hoje,
        status: input.origem === "catalogo-publico" ? "APROVADO" : "AGUARDANDO",
        total: totalGeral,
        origem: input.origem || "interno"
      });
      const vendaId = result.insertId;
      await dbConn.insert(vendaItensTable).values(
        input.itens.map((item) => ({
          vendaId,
          produtoNome: item.produtoNome,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          subtotal: item.subtotal,
          observacao: item.obs || ""
        }))
      );
      return { id: vendaId };
    }),
    createComItem: protectedProcedure.input(z2.object({
      clienteNome: z2.string().optional(),
      clienteId: z2.number().optional(),
      produtoNome: z2.string(),
      quantidade: z2.string(),
      valorUnitario: z2.string(),
      subtotal: z2.string()
    })).mutation(async ({ input }) => {
      const hoje = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const id = await createVenda({
        clienteNome: input.clienteNome || "",
        clienteId: input.clienteId || null,
        data: hoje,
        status: "AGUARDANDO",
        total: input.subtotal
      }, [{
        produtoNome: input.produtoNome,
        quantidade: input.quantidade,
        valorUnitario: input.valorUnitario,
        subtotal: input.subtotal
      }]);
      return { id };
    }),
    // ─── Prorrogar vencimento ───
    prorrogar: protectedProcedure.input(z2.object({
      id: z2.number(),
      vencimento: z2.string()
      // YYYY-MM-DD
    })).mutation(async ({ input }) => {
      await updateVenda(input.id, { vencimento: input.vencimento });
      const v = await getVenda(input.id);
      if (v && v.status === "EXPIRADO") {
        await updateVenda(input.id, { status: "AGUARDANDO" });
      }
      return { success: true };
    }),
    // ─── Gerar link de compartilhamento (shareToken) ───
    gerarLink: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const { randomBytes } = await import("crypto");
      const token = randomBytes(24).toString("hex");
      await updateVenda(input.id, { shareToken: token });
      return { token };
    }),
    // ─── Visualizar orçamento público pelo shareToken ───
    getPublico: publicProcedure.input(z2.object({ token: z2.string() })).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { vendas: vendasTable, vendaItens: vendaItensTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq3 } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) return null;
      const rows = await dbConn.select().from(vendasTable).where(eq3(vendasTable.shareToken, input.token)).limit(1);
      if (!rows[0]) return null;
      const v = rows[0];
      const itens = await getVendaItens(v.id);
      return { ...v, itens };
    }),
    // ─── Listar expirados ───
    listExpirados: protectedProcedure.query(async () => {
      const lista = await listVendasExpiradas();
      const result = [];
      for (const v of lista) {
        const itens = await getVendaItens(v.id);
        result.push({ ...v, itens });
      }
      return result;
    }),
    // ─── Desbloquear orçamento expirado (com senha) ───
    desbloquear: protectedProcedure.input(z2.object({
      id: z2.number(),
      senha: z2.string()
    })).mutation(async ({ input }) => {
      const senhaConfig = await getAppConfig("senha_desbloqueio_orcamento");
      const senhaCorreta = senhaConfig || "1234";
      if (input.senha !== senhaCorreta) throw new Error("Senha incorreta");
      await updateVenda(input.id, { status: "AGUARDANDO", vencimento: null });
      return { success: true };
    }),
    // ─── Expirar vendas vencidas (chamado pelo job) ───
    expirarVencidos: protectedProcedure.mutation(async () => {
      const count = await expirarVendasVencidas();
      return { count };
    }),
    // ─── Salvar senha de desbloqueio ───
    setSenhaDesbloqueio: protectedProcedure.input(z2.object({ senha: z2.string().min(4) })).mutation(async ({ input }) => {
      await setAppConfig("senha_desbloqueio_orcamento", input.senha);
      return { success: true };
    }),
    getSenhaDesbloqueio: protectedProcedure.query(async () => {
      const v = await getAppConfig("senha_desbloqueio_orcamento");
      return { configurada: !!v };
    }),
    // ─── Remover item individual do orçamento ───
    removeItemOrcamento: protectedProcedure.input(z2.object({
      itemId: z2.number(),
      vendaId: z2.number()
    })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { vendaItens: vendaItensTable, vendas: vendasTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      await dbConn.delete(vendaItensTable).where(eqFn(vendaItensTable.id, input.itemId));
      const itensRestantes = await dbConn.select().from(vendaItensTable).where(eqFn(vendaItensTable.vendaId, input.vendaId));
      const novoTotal = itensRestantes.reduce((s, i) => s + Number(i.subtotal || 0), 0).toFixed(2);
      await dbConn.update(vendasTable).set({ total: novoTotal }).where(eqFn(vendasTable.id, input.vendaId));
      return { success: true, novoTotal };
    }),
    // ─── Reordenar itens do orçamento (drag-and-drop) ───
    reordenarItens: protectedProcedure.input(z2.object({
      vendaId: z2.number(),
      itens: z2.array(z2.object({ id: z2.number(), ordem: z2.number() }))
    })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { vendaItens: vendaItensTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      for (const item of input.itens) {
        await dbConn.update(vendaItensTable).set({ ordem: item.ordem }).where(eqFn(vendaItensTable.id, item.id));
      }
      return { success: true };
    }),
    // ─── Buscar múltiplos orçamentos com itens (para impressão em lote) ───
    getByIds: protectedProcedure.input(z2.object({
      ids: z2.array(z2.number()).min(1).max(100)
    })).query(async ({ input }) => {
      const result = [];
      for (const id of input.ids) {
        const v = await getVenda(id);
        if (!v) continue;
        const itens = await getVendaItens(id);
        result.push({ ...v, itens });
      }
      result.sort((a, b) => a.id - b.id);
      return result;
    }),
    // ─── Mesclar múltiplos orçamentos em um único ───
    mesclar: protectedProcedure.input(z2.object({
      ids: z2.array(z2.number()).min(2).max(50),
      clienteNome: z2.string().optional(),
      clienteId: z2.number().optional(),
      vendedorNome: z2.string().optional(),
      vendedorId: z2.number().optional(),
      telefoneCliente: z2.string().optional(),
      observacaoPedido: z2.string().optional(),
      vencimento: z2.string().optional(),
      agruparItensIguais: z2.boolean().default(true),
      moverOriginaisParaLixeira: z2.boolean().default(true)
    })).mutation(async ({ input, ctx }) => {
      const orcamentos = [];
      for (const id of input.ids) {
        const v = await getVenda(id);
        if (!v) throw new Error(`Or\xE7amento #${id} n\xE3o encontrado`);
        const itens = await getVendaItens(id);
        orcamentos.push({ ...v, itens });
      }
      const base = orcamentos[0];
      const clienteNome = input.clienteNome ?? base.clienteNome ?? "";
      const clienteId = input.clienteId ?? base.clienteId ?? void 0;
      const vendedorNome = input.vendedorNome ?? base.vendedorNome ?? "";
      const vendedorId = input.vendedorId ?? base.vendedorId ?? void 0;
      const telefoneCliente = input.telefoneCliente ?? base.telefoneCliente ?? "";
      const vencimento = input.vencimento ?? base.vencimento ?? "";
      let todosItens = [];
      for (const orc of orcamentos) {
        for (const item of orc.itens) {
          todosItens.push({
            produtoId: item.produtoId ?? null,
            produtoNome: item.produtoNome,
            quantidade: String(item.quantidade),
            valorUnitario: String(item.valorUnitario),
            subtotal: String(Number(item.quantidade) * Number(item.valorUnitario)),
            observacao: item.observacao ?? null
          });
        }
      }
      if (input.agruparItensIguais) {
        const mapa = /* @__PURE__ */ new Map();
        for (const item of todosItens) {
          const chave = item.produtoId ? `id:${item.produtoId}` : `nome:${item.produtoNome.toLowerCase().trim()}`;
          if (mapa.has(chave)) {
            const existente = mapa.get(chave);
            const novaQtd = Number(existente.quantidade) + Number(item.quantidade);
            existente.quantidade = String(novaQtd);
            existente.subtotal = String(novaQtd * Number(existente.valorUnitario));
            if (item.observacao && item.observacao !== existente.observacao) {
              existente.observacao = [existente.observacao, item.observacao].filter(Boolean).join("; ");
            }
          } else {
            mapa.set(chave, { ...item });
          }
        }
        todosItens = Array.from(mapa.values());
      }
      const total = todosItens.reduce((s, i) => s + Number(i.subtotal), 0).toFixed(2);
      const refIds = input.ids.map((id) => `#${id}`).join(", ");
      const obsBase = input.observacaoPedido ?? "";
      const observacaoPedido = obsBase ? `${obsBase}
[Mesclado de: ${refIds}]` : `[Mesclado de: ${refIds}]`;
      const hoje = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const novoId = await createVenda({
        clienteNome,
        clienteId,
        vendedorNome,
        vendedorId,
        telefoneCliente,
        vencimento,
        data: hoje,
        status: "AGUARDANDO",
        total,
        observacaoPedido
      }, todosItens.map((item, idx) => ({ ...item, vendaId: 0, ordem: idx })));
      if (input.moverOriginaisParaLixeira) {
        for (const id of input.ids) {
          await deleteVenda(id);
        }
      }
      return { novoId, totalItens: todosItens.length, idsOriginais: input.ids };
    }),
    // ─── Buscar estoque dos itens de um orçamento ───
    getEstoqueItens: protectedProcedure.input(z2.object({
      vendaId: z2.number()
    })).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const {
        vendaItens: vendaItensTable,
        veilingProdutos: veilingProdutos2,
        cooperfloraProdutos: cooperfloraProdutos2,
        produtosLoja: produtosLoja2
      } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq3, like: like2, sql: sql3 } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) return [];
      const itens = await dbConn.select().from(vendaItensTable).where(eq3(vendaItensTable.vendaId, input.vendaId));
      if (!itens.length) return [];
      const result = await Promise.all(itens.map(async (item) => {
        const nome = item.produtoNome.trim();
        if (item.produtoId) {
          const [pl] = await dbConn.select({ estoque: produtosLoja2.estoque }).from(produtosLoja2).where(eq3(produtosLoja2.id, item.produtoId)).limit(1);
          if (pl) return { itemId: item.id, produtoNome: nome, estoque: Number(pl.estoque), fonte: "loja" };
        }
        const [vp] = await dbConn.select({ estoqueDisponivel: veilingProdutos2.estoqueDisponivel, nomeCompleto: veilingProdutos2.nomeCompleto }).from(veilingProdutos2).where(sql3`LOWER(${veilingProdutos2.nomeCompleto}) LIKE LOWER(${`%${nome.substring(0, 30)}%`})`).limit(1);
        if (vp) return { itemId: item.id, produtoNome: nome, estoque: vp.estoqueDisponivel, fonte: "veiling" };
        const [cp] = await dbConn.select({ estoque: cooperfloraProdutos2.estoque }).from(cooperfloraProdutos2).where(sql3`LOWER(${cooperfloraProdutos2.nome}) LIKE LOWER(${`%${nome.substring(0, 30)}%`})`).limit(1);
        if (cp) return { itemId: item.id, produtoNome: nome, estoque: cp.estoque, fonte: "cooperflora" };
        const [plNome] = await dbConn.select({ estoque: produtosLoja2.estoque }).from(produtosLoja2).where(sql3`LOWER(${produtosLoja2.nome}) LIKE LOWER(${`%${nome.substring(0, 30)}%`})`).limit(1);
        if (plNome) return { itemId: item.id, produtoNome: nome, estoque: Number(plNome.estoque), fonte: "loja" };
        return { itemId: item.id, produtoNome: nome, estoque: null, fonte: "desconhecido" };
      }));
      return result;
    }),
    gerarQrCode: protectedProcedure.input(z2.object({
      vendaId: z2.number()
    })).mutation(async ({ input }) => {
      const token = await gerarQrCodeToken();
      await atualizarQrCodeToken(input.vendaId, token);
      return { token, vendaId: input.vendaId };
    })
  }),
  // ─── Venda Linkss (Compartilhamento) ───
  vendaLinks: router({
    create: protectedProcedure.input(z2.object({
      vendaId: z2.number(),
      expiresInHours: z2.number().min(1).max(8760)
      // 1h a 365 dias
    })).mutation(async ({ input }) => {
      const { randomBytes } = await import("crypto");
      const token = randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1e3);
      const id = await createVendaLink({ vendaId: input.vendaId, token, expiresAt });
      return { id, token, expiresAt };
    }),
    list: protectedProcedure.input(z2.object({ vendaId: z2.number() })).query(async ({ input }) => {
      return listVendaLinks(input.vendaId);
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteVendaLink(input.id);
      return { success: true };
    }),
    // Endpoint público - visualizar pedido via token
    viewByToken: publicProcedure.input(z2.object({ token: z2.string() })).query(async ({ input }) => {
      const result = await getVendaByToken(input.token);
      if (!result) return { found: false, expired: false, venda: null };
      if (result.expired) return { found: true, expired: true, venda: null };
      return { found: true, expired: false, venda: result.venda };
    })
  }),
  // ─── Compras ───
  compras: router({
    list: protectedProcedure.input(z2.object({}).optional()).query(async () => {
      const comprasList = await listCompras();
      const result = [];
      for (const c of comprasList) {
        const itens = await getCompraItens(c.id);
        result.push({ ...c, itens });
      }
      return result;
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const c = await getCompra(input.id);
      if (!c) return void 0;
      const itens = await getCompraItens(c.id);
      return { ...c, itens };
    }),
    create: protectedProcedure.input(z2.object({
      fornecedor: z2.string().optional(),
      numNF: z2.string().optional(),
      data: z2.string(),
      total: z2.string(),
      origem: z2.string().optional(),
      itens: z2.array(z2.object({
        produtoId: z2.number().optional(),
        produtoNome: z2.string(),
        quantidade: z2.string(),
        valorUnitario: z2.string(),
        subtotal: z2.string()
      }))
    })).mutation(async ({ input }) => {
      const { itens, ...compraData } = input;
      const id = await createCompra(compraData, itens);
      for (const item of itens) {
        if (item.produtoNome?.trim()) {
          await upsertProdutoLojaFromCompra({
            nome: item.produtoNome.trim(),
            precoCusto: parseFloat(item.valorUnitario) || 0,
            quantidade: parseFloat(item.quantidade) || 0
          });
        }
      }
      return { id };
    }),
    updateItem: protectedProcedure.input(z2.object({
      itemId: z2.number(),
      compraId: z2.number(),
      produtoId: z2.number().optional().nullable(),
      produtoNome: z2.string(),
      quantidade: z2.string(),
      valorUnitario: z2.string(),
      subtotal: z2.string()
    })).mutation(async ({ input }) => {
      const { itemId, compraId, ...data } = input;
      await updateCompraItem(itemId, data);
      await recalcCompraTotal(compraId);
      return { ok: true };
    }),
    deleteItem: protectedProcedure.input(z2.object({
      itemId: z2.number(),
      compraId: z2.number()
    })).mutation(async ({ input }) => {
      await deleteCompraItem(input.itemId);
      await recalcCompraTotal(input.compraId);
      return { ok: true };
    }),
    addItem: protectedProcedure.input(z2.object({
      compraId: z2.number(),
      produtoId: z2.number().optional().nullable(),
      produtoNome: z2.string(),
      quantidade: z2.string(),
      valorUnitario: z2.string(),
      subtotal: z2.string()
    })).mutation(async ({ input }) => {
      const { compraId, ...data } = input;
      const id = await addCompraItem(compraId, data);
      await recalcCompraTotal(compraId);
      return { id };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      fornecedor: z2.string().optional(),
      numNF: z2.string().optional(),
      data: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCompra(id, data);
      return { ok: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteCompra(input.id);
      return { ok: true };
    }),
    confirmar: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await updateCompraStatus(input.id, "CONFIRMADO");
      const itens = await getCompraItens(input.id);
      for (const item of itens) {
        if (item.produtoNome?.trim()) {
          await upsertProdutoLojaFromCompra({
            nome: item.produtoNome.trim(),
            precoCusto: parseFloat(item.valorUnitario) || 0,
            quantidade: parseFloat(item.quantidade) || 0
          });
        }
      }
      return { ok: true };
    }),
    searchProdutos: protectedProcedure.input(z2.object({ termo: z2.string() })).query(async ({ input }) => {
      const [loja, geral] = await Promise.all([
        searchProdutosLojaSemelhanca(input.termo, 8),
        searchProdutosSemelhanca(input.termo, 8)
      ]);
      return { loja, geral };
    })
  }),
  // ─── Acompanhamento de Compras ────
  acompanhamentoCompras: router({
    listarPorCompra: protectedProcedure.input(z2.object({ compraId: z2.number() })).query(async ({ input }) => {
      return await listarAcompanhamentosPorCompra(input.compraId);
    }),
    listarTodas: protectedProcedure.query(async () => {
      return await listarComprasComAcompanhamento();
    }),
    obter: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return await obterAcompanhamento(input.id);
    }),
    obterResumo: protectedProcedure.input(z2.object({ compraId: z2.number() })).query(async ({ input }) => {
      return await obterResumoCompra(input.compraId);
    }),
    criar: protectedProcedure.input(z2.object({
      compraItemId: z2.number(),
      compraId: z2.number(),
      produtoId: z2.number().optional().nullable(),
      produtoNome: z2.string(),
      quantidadePedida: z2.number(),
      quantidadeComprada: z2.number(),
      observacoes: z2.string().optional()
    })).mutation(async ({ input }) => {
      await criarOuAtualizarAcompanhamento(
        input.compraItemId,
        input.compraId,
        input.produtoId || null,
        input.produtoNome,
        input.quantidadePedida,
        input.quantidadeComprada,
        input.observacoes
      );
      return { ok: true };
    }),
    atualizar: protectedProcedure.input(z2.object({
      compraItemId: z2.number(),
      compraId: z2.number(),
      produtoId: z2.number().optional().nullable(),
      produtoNome: z2.string(),
      quantidadePedida: z2.number(),
      quantidadeComprada: z2.number(),
      observacoes: z2.string().optional()
    })).mutation(async ({ input }) => {
      await criarOuAtualizarAcompanhamento(
        input.compraItemId,
        input.compraId,
        input.produtoId || null,
        input.produtoNome,
        input.quantidadePedida,
        input.quantidadeComprada,
        input.observacoes
      );
      return { ok: true };
    }),
    deletar: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deletarAcompanhamento(input.id);
      return { ok: true };
    })
  }),
  // ─── Relatórios ────
  relatorios: router({
    vendas: protectedProcedure.input(z2.object({
      dataInicio: z2.string(),
      dataFim: z2.string(),
      status: z2.string().optional()
    })).query(async ({ input }) => {
      const vendasList = await getRelatorioVendas(input.dataInicio, input.dataFim, input.status);
      const result = [];
      for (const v of vendasList) {
        const itens = await getVendaItens(v.id);
        result.push({ ...v, itens });
      }
      return result;
    }),
    ranking: protectedProcedure.input(z2.object({
      dataInicio: z2.string(),
      dataFim: z2.string(),
      status: z2.string().optional()
    })).query(async ({ input }) => {
      return getRankingProdutos(input.dataInicio, input.dataFim, input.status);
    })
  }),
  // ─── Configurações ───
  config: router({
    exportBackup: protectedProcedure.input(z2.object({ usuarioNome: z2.string().optional() })).mutation(async ({ input }) => {
      const allData = await getAllDataForBackup();
      if (!allData) return { success: false, error: "Sem dados" };
      const json2 = JSON.stringify({ data: (/* @__PURE__ */ new Date()).toISOString(), usuario: input.usuarioNome || "SISTEMA", db: allData }, null, 2);
      const buffer = Buffer.from(json2, "utf-8");
      const fileName = `backup_garden_erp_${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.json`;
      const fileKey = `backups/${fileName}`;
      const { url } = await storagePut(fileKey, buffer, "application/json");
      await createBackupRecord({ nomeArquivo: fileName, s3Key: fileKey, s3Url: url, tamanho: buffer.length, usuarioNome: input.usuarioNome });
      return { success: true, url, fileName };
    }),
    importBackup: protectedProcedure.input(z2.object({ data: z2.any() })).mutation(async ({ input }) => {
      await importBackupData(input.data);
      return { success: true };
    }),
    listBackups: protectedProcedure.query(async () => {
      return listBackups();
    }),
    getBackupUrl: protectedProcedure.input(z2.object({ s3Key: z2.string() })).query(async ({ input }) => {
      const { url } = await storageGet(input.s3Key);
      return { url };
    }),
    zerarEstoque: protectedProcedure.input(z2.object({ confirmacao: z2.literal("CONFIRMAR") })).mutation(async ({ input }) => {
      await zerarEstoque();
      return { success: true };
    }),
    stats: protectedProcedure.query(async () => {
      const allData = await getAllDataForBackup();
      if (!allData) return null;
      return {
        clientes: allData.clientes.length,
        produtos: allData.produtos.length,
        vendas: allData.vendas.length,
        compras: allData.compras.length,
        vendedores: allData.vendedores.length
      };
    }),
    // ─── Senha de desbloqueio de orçamentos expirados ───
    getSenhaDesbloqueio: protectedProcedure.query(async () => {
      const val = await getAppConfig("senha_desbloqueio_orcamento");
      return { configurada: !!val };
    }),
    setSenhaDesbloqueio: protectedProcedure.input(z2.object({
      senhaAtual: z2.string().optional(),
      novaSenha: z2.string().min(4, "M\xEDnimo 4 caracteres")
    })).mutation(async ({ input }) => {
      const atual = await getAppConfig("senha_desbloqueio_orcamento");
      if (atual && input.senhaAtual !== atual) {
        throw new Error("Senha atual incorreta");
      }
      await setAppConfig("senha_desbloqueio_orcamento", input.novaSenha);
      return { ok: true };
    }),
    getValidadePrecos: protectedProcedure.query(async () => {
      const [veiling, cooperflora] = await Promise.all([
        getValidadePrecosVeiling(),
        getValidadePrecosCooperflora()
      ]);
      return { veiling, cooperflora };
    }),
    setValidadePrecosVeiling: protectedProcedure.input(z2.object({
      dias: z2.number().min(1).max(365)
    })).mutation(async ({ input }) => {
      await setValidadePrecosVeiling(input.dias);
      return { ok: true };
    }),
    setValidadePrecosCooperflora: protectedProcedure.input(z2.object({
      dias: z2.number().min(1).max(365)
    })).mutation(async ({ input }) => {
      await setValidadePrecosCooperflora(input.dias);
      return { ok: true };
    }),
    // ─── Saúde do AutoSync ───
    syncHealth: protectedProcedure.query(async () => {
      const [historicoVeiling, historicoCooperflora, historicoImport] = await Promise.all([
        listarSyncHistorico("VEILING", 10),
        listarSyncHistorico("COOPERFLORA", 10),
        listarSyncHistorico("VEILING_IMPORT", 10)
      ]);
      const historicoImportacoes = await listVeilingImportacoes(10);
      return {
        jobs: {
          veilingCatalogo: {
            ...schedulerStatus.veiling,
            historico: historicoVeiling
          },
          cooperfloraCatalogo: {
            ...schedulerStatus.cooperflora,
            historico: historicoCooperflora
          },
          veilingImportacaoPedidos: {
            ...schedulerStatus.importacaoPedidos,
            ultimaSync: schedulerStatus.importacaoPedidos.ultimaSync ?? historicoImportacoes[0]?.dataImportacao ?? null,
            ultimoStatus: schedulerStatus.importacaoPedidos.ultimoStatus ?? (historicoImportacoes[0]?.status === "SUCESSO" ? "SUCESSO" : historicoImportacoes[0]?.status === "ERRO" ? "FALHA" : historicoImportacoes[0] ? "SUCESSO" : null),
            historico: historicoImportacoes
          }
        }
      };
    })
  }),
  // ─── Tabela de Preços ───
  tabelaPrecos: router({
    // Listar margens salvas para uma compra específica
    getByCompra: protectedProcedure.input(z2.object({ compraId: z2.number() })).query(async ({ input }) => {
      return listTabelaPrecosByCompra(input.compraId);
    }),
    // Salvar margens em lote para uma compra
    salvar: protectedProcedure.input(z2.object({
      compraId: z2.number(),
      items: z2.array(z2.object({
        compraItemId: z2.number(),
        produtoId: z2.number().nullish(),
        produtoNome: z2.string(),
        custoUnitario: z2.string(),
        margem1: z2.string(),
        preco1: z2.string(),
        margem2: z2.string(),
        preco2: z2.string(),
        margem3: z2.string(),
        preco3: z2.string()
      }))
    })).mutation(async ({ input, ctx }) => {
      await saveTabelaPrecosBatch(input.compraId, input.items);
      const usuarioNome = ctx.user?.name || ctx.user?.email || "SISTEMA";
      const applyResult = await applyTabela3ToProducts(
        input.items.map((i) => ({
          produtoId: i.produtoId ?? null,
          produtoNome: i.produtoNome,
          preco3: i.preco3,
          custoUnitario: i.custoUnitario
        })),
        usuarioNome
      );
      return { success: true, atualizados: applyResult.atualizados };
    }),
    // Aplicar preço de uma tabela selecionada ao cadastro do produto
    aplicarPreco: protectedProcedure.input(z2.object({
      tabela: z2.enum(["1", "2", "3"]),
      items: z2.array(z2.object({
        produtoId: z2.number().nullish(),
        produtoNome: z2.string(),
        preco: z2.string()
      })),
      usuarioNome: z2.string().optional()
    })).mutation(async ({ input }) => {
      let atualizados = 0;
      let criados = 0;
      for (const item of input.items) {
        if (item.produtoId) {
          const old = await getProduto(item.produtoId);
          if (old) {
            await createHistorico({
              tabela: "produtos",
              registroId: item.produtoId,
              campo: "preco",
              valorAntigo: String(old.preco ?? "0"),
              valorNovo: item.preco,
              usuarioNome: input.usuarioNome || "SISTEMA"
            });
          }
          await updateProduto(item.produtoId, { preco: item.preco });
          atualizados++;
        } else {
          await createProduto({
            descricao: item.produtoNome.trim().toUpperCase(),
            preco: item.preco,
            custo: "0"
          });
          criados++;
        }
      }
      return { success: true, atualizados, criados };
    })
  }),
  // ─── Rastreamento Público (QR Code) ───
  rastreamento: router({
    getVenda: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const v = await getVenda(input.id);
      if (!v) return { found: false, venda: null };
      const itens = await getVendaItens(v.id);
      return { found: true, venda: { ...v, itens } };
    }),
    salvarConferencia: publicProcedure.input(z2.object({
      vendaId: z2.number(),
      itens: z2.array(z2.object({
        itemId: z2.number(),
        qtdConferida: z2.string()
      })),
      conferidoPor: z2.string()
    })).mutation(async ({ input }) => {
      await salvarConferencia(input.vendaId, input.itens, input.conferidoPor);
      await createHistorico({
        tabela: "vendas",
        registroId: input.vendaId,
        campo: "conferencia_separacao",
        valorAntigo: "N\xE3o conferido",
        valorNovo: `Separa\xE7\xE3o conferida por ${input.conferidoPor} (via QR)`,
        usuarioNome: input.conferidoPor
      });
      return { success: true };
    }),
    salvarConferencia2: publicProcedure.input(z2.object({
      vendaId: z2.number(),
      itens: z2.array(z2.object({
        itemId: z2.number(),
        qtdConferida: z2.string()
      })),
      conferidoPor: z2.string()
    })).mutation(async ({ input }) => {
      await salvarConferencia2(input.vendaId, input.itens, input.conferidoPor);
      await createHistorico({
        tabela: "vendas",
        registroId: input.vendaId,
        campo: "conferencia_entrega",
        valorAntigo: "N\xE3o conferido",
        valorNovo: `Entrega conferida por ${input.conferidoPor} (via QR)`,
        usuarioNome: input.conferidoPor
      });
      return { success: true };
    })
  }),
  // ─── Conferência de Pedidos ───
  conferencia: router({
    buscar: protectedProcedure.input(z2.object({ search: z2.string().min(1) })).query(async ({ input }) => {
      const vendas2 = await buscarPedidosConferencia(input.search);
      const results = [];
      for (const v of vendas2) {
        const itens = await getVendaItens(v.id);
        let clienteTelefone = null;
        if (v.clienteId) {
          const cliente = await getCliente(v.clienteId);
          if (cliente) clienteTelefone = cliente.telefone;
        }
        results.push({ ...v, itens, clienteTelefone });
      }
      return results;
    }),
    salvar: protectedProcedure.input(z2.object({
      vendaId: z2.number(),
      itens: z2.array(z2.object({
        itemId: z2.number(),
        qtdConferida: z2.string()
      })),
      conferidoPor: z2.string()
    })).mutation(async ({ input }) => {
      await salvarConferencia(input.vendaId, input.itens, input.conferidoPor);
      await createHistorico({
        tabela: "vendas",
        registroId: input.vendaId,
        campo: "conferencia_separacao",
        valorAntigo: "N\xE3o conferido",
        valorNovo: `Separa\xE7\xE3o conferida por ${input.conferidoPor}`,
        usuarioNome: input.conferidoPor
      });
      return { success: true };
    }),
    salvar2: protectedProcedure.input(z2.object({
      vendaId: z2.number(),
      itens: z2.array(z2.object({
        itemId: z2.number(),
        qtdConferida: z2.string()
      })),
      conferidoPor: z2.string()
    })).mutation(async ({ input }) => {
      await salvarConferencia2(input.vendaId, input.itens, input.conferidoPor);
      await createHistorico({
        tabela: "vendas",
        registroId: input.vendaId,
        campo: "conferencia_entrega",
        valorAntigo: "N\xE3o conferido",
        valorNovo: `Entrega conferida por ${input.conferidoPor}`,
        usuarioNome: input.conferidoPor
      });
      return { success: true };
    }),
    divergencias: protectedProcedure.query(async () => {
      return await listarDivergenciasConferencia();
    }),
    obterPorQrCode: publicProcedure.input(z2.object({
      token: z2.string().min(1)
    })).query(async ({ input }) => {
      const venda = await obterVendaPorQrCodeToken(input.token);
      if (!venda) throw new TRPCError3({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
      return venda;
    }),
    confirmarPorQrCode: publicProcedure.input(z2.object({
      token: z2.string().min(1),
      conferidoPor: z2.string().min(1),
      itens: z2.array(z2.object({
        itemId: z2.number(),
        quantidadeContada: z2.number()
      }))
    })).mutation(async ({ input }) => {
      const venda = await obterVendaPorQrCodeToken(input.token);
      if (!venda) throw new TRPCError3({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
      const itensIncorretos = [];
      for (const itemContado of input.itens) {
        const itemOriginal = venda.itens.find((i) => i.id === itemContado.itemId);
        if (itemOriginal && itemContado.quantidadeContada !== itemOriginal.quantidade) {
          itensIncorretos.push({
            produtoNome: itemOriginal.produtoNome,
            quantidadePedida: itemOriginal.quantidade,
            quantidadeContada: itemContado.quantidadeContada,
            diferenca: Math.abs(itemContado.quantidadeContada - itemOriginal.quantidade)
          });
        }
      }
      if (itensIncorretos.length > 0) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: `${itensIncorretos.length} produto(s) com quantidade incorreta. Corrija antes de confirmar.`,
          cause: itensIncorretos
        });
      }
      await salvarConferencia2(
        venda.id,
        input.itens.map((item) => ({
          itemId: item.itemId,
          qtdConferida: item.quantidadeContada.toString()
        })),
        input.conferidoPor
      );
      await createHistorico({
        tabela: "vendas",
        registroId: venda.id,
        campo: "conferencia_entrega_qrcode",
        valorAntigo: "N\xE3o conferido",
        valorNovo: `Entrega conferida por ${input.conferidoPor} via QR Code`,
        usuarioNome: input.conferidoPor
      });
      return { success: true, vendaId: venda.id };
    })
  }),
  financeiro: router({
    formasPagamento: router({
      list: protectedProcedure.query(async () => {
        return await listFormasPagamento();
      }),
      create: protectedProcedure.input(z2.object({
        nome: z2.string().min(1),
        descricao: z2.string().optional()
      })).mutation(async ({ input }) => {
        return await createFormaPagamento(input.nome, input.descricao);
      }),
      update: protectedProcedure.input(z2.object({
        id: z2.number(),
        nome: z2.string().optional(),
        descricao: z2.string().optional(),
        ativo: z2.number().optional()
      })).mutation(async ({ input }) => {
        await updateFormaPagamento(input.id, input.nome, input.descricao, input.ativo);
        return { success: true };
      }),
      delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
        await deleteFormaPagamento(input.id);
        return { success: true };
      })
    }),
    titulos: router({
      listPendentes: protectedProcedure.query(async () => {
        return await listTitulosPendentes();
      }),
      listPagos: protectedProcedure.query(async () => {
        return await listTitulosPagos();
      }),
      getByVenda: protectedProcedure.input(z2.object({ vendaId: z2.number() })).query(async ({ input }) => {
        return await getTitulosByVenda(input.vendaId);
      }),
      create: protectedProcedure.input(z2.object({
        vendaId: z2.number(),
        clienteId: z2.number(),
        clienteNome: z2.string(),
        formaPagamentoId: z2.number().optional(),
        formaPagamentoNome: z2.string().optional(),
        valor: z2.string(),
        dataVencimento: z2.date(),
        observacoes: z2.string().optional()
      })).mutation(async ({ input }) => {
        return await createTitulo({
          vendaId: input.vendaId,
          clienteId: input.clienteId,
          clienteNome: input.clienteNome,
          formaPagamentoId: input.formaPagamentoId,
          formaPagamentoNome: input.formaPagamentoNome,
          valor: input.valor,
          dataVencimento: input.dataVencimento,
          observacoes: input.observacoes,
          status: "PENDENTE"
        });
      }),
      updateStatus: protectedProcedure.input(z2.object({
        id: z2.number(),
        status: z2.enum(["PENDENTE", "PAGO", "VENCIDO", "CANCELADO"]),
        dataPagamento: z2.date().optional()
      })).mutation(async ({ input }) => {
        await updateTituloStatus(input.id, input.status, input.dataPagamento);
        return { success: true };
      }),
      faturar: protectedProcedure.input(z2.object({
        vendaId: z2.number(),
        formaPagamentoId: z2.number(),
        dataVencimento: z2.date(),
        faturadoPor: z2.string(),
        formaPagamentoNome: z2.string().optional()
      })).mutation(async ({ input, ctx }) => {
        const resultado = await faturarVenda(input.vendaId, input.formaPagamentoId, input.faturadoPor, input.dataVencimento);
        const venda = await getVenda(input.vendaId);
        const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const { caixas: caixas2, caixaMovimentos: caixaMovimentos2, vendasEfetivas: vendasEfetivas2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const { eq: eqFn, sql: sqlFn } = await import("drizzle-orm");
        const dbConn = await getDb2();
        if (!dbConn) return { ...resultado, caixaLancado: false, vendaEfetivaId: null };
        let caixaLancado = false;
        let caixaAviso = null;
        if (venda) {
          const [caixaAberto] = await dbConn.select().from(caixas2).where(eqFn(caixas2.status, "ABERTO")).limit(1);
          if (caixaAberto) {
            const valorTotal = Number(venda.total) || 0;
            if (valorTotal > 0) {
              await dbConn.insert(caixaMovimentos2).values({
                caixaId: caixaAberto.id,
                tipo: "ENTRADA",
                categoria: "VENDA",
                descricao: `Venda #${String(input.vendaId).padStart(6, "0")} - ${venda.clienteNome || "Cliente"}`,
                valor: String(valorTotal.toFixed(2)),
                formaPagamento: input.formaPagamentoNome ?? "N\xE3o informado",
                vendaId: input.vendaId,
                vendaNum: `#${String(input.vendaId).padStart(6, "0")}`,
                lancadoPor: ctx.user.name || ctx.user.openId
              });
              await dbConn.update(caixas2).set({ totalEntradas: sqlFn`totalEntradas + ${valorTotal}` }).where(eqFn(caixas2.id, caixaAberto.id));
              caixaLancado = true;
            }
          } else {
            caixaAviso = "N\xE3o h\xE1 caixa aberto. O faturamento foi registrado, mas nenhum lan\xE7amento foi feito no caixa.";
          }
        }
        let vendaEfetivaId = null;
        if (venda) {
          const jaConvertido = await dbConn.select().from(vendasEfetivas2).where(eqFn(vendasEfetivas2.orcamentoId, input.vendaId)).limit(1);
          if (jaConvertido.length === 0) {
            const hoje = /* @__PURE__ */ new Date();
            const dataVenda = hoje.toLocaleDateString("pt-BR");
            const vendaItensParaSnapshot = await getVendaItens(input.vendaId);
            const itensSnapshotFaturar = (vendaItensParaSnapshot || []).map((item) => ({
              produtoNome: item.produtoNome,
              quantidade: Number(item.quantidade),
              valorUnitario: Number(item.valorUnitario),
              subtotal: Number(item.subtotal),
              observacao: item.observacao || void 0
            }));
            const [veResult] = await dbConn.insert(vendasEfetivas2).values({
              orcamentoId: input.vendaId,
              orcamentoNum: `#${String(input.vendaId).padStart(6, "0")}`,
              clienteId: venda.clienteId ?? void 0,
              clienteNome: venda.clienteNome ?? "",
              vendedorId: venda.vendedorId ?? void 0,
              vendedorNome: venda.vendedorNome ?? "",
              total: venda.total,
              dataVenda,
              dataEntrega: venda.dataEntrega ?? void 0,
              formaPagamento: input.formaPagamentoNome ?? void 0,
              status: "PENDENTE",
              convertidoPor: ctx.user.name ?? ctx.user.openId,
              itensSnapshot: itensSnapshotFaturar.length > 0 ? itensSnapshotFaturar : void 0
            });
            vendaEfetivaId = veResult.insertId ?? null;
          } else {
            vendaEfetivaId = jaConvertido[0].id;
          }
        }
        return { ...resultado, caixaLancado, caixaAviso, vendaEfetivaId };
      }),
      getNaoFaturadas: protectedProcedure.query(async () => {
        return await getVendasNaoFaturadas();
      })
    })
  }),
  // ─── Pedidos de Compra ───
  pedidosCompra: router({
    list: protectedProcedure.query(async () => {
      return await listPedidosCompra();
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return await getPedidoCompra(input.id);
    }),
    nextNumero: protectedProcedure.query(async () => {
      return await getNextNumeroPedidoCompra();
    }),
    create: protectedProcedure.input(z2.object({
      numero: z2.number(),
      data: z2.string(),
      solicitante: z2.string(),
      observacoes: z2.string().optional(),
      total: z2.string(),
      itens: z2.array(z2.object({
        produtoId: z2.number().optional(),
        produtoNome: z2.string(),
        quantidade: z2.string(),
        precoVenda: z2.string(),
        subtotalVenda: z2.string()
      }))
    })).mutation(async ({ input }) => {
      return await createPedidoCompra(input);
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      data: z2.string(),
      solicitante: z2.string(),
      observacoes: z2.string().optional(),
      total: z2.string(),
      status: z2.string().optional(),
      itens: z2.array(z2.object({
        produtoId: z2.number().optional(),
        produtoNome: z2.string(),
        quantidade: z2.string(),
        precoVenda: z2.string(),
        subtotalVenda: z2.string()
      }))
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updatePedidoCompra(id, data);
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deletePedidoCompra(input.id);
    }),
    updateStatus: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.string()
    })).mutation(async ({ input }) => {
      await updateStatusPedidoCompra(input.id, input.status);
    }),
    addItemToPedido: protectedProcedure.input(z2.object({
      pedidoId: z2.number(),
      produtoNome: z2.string(),
      quantidade: z2.string(),
      precoVenda: z2.string(),
      subtotalVenda: z2.string()
    })).mutation(async ({ input }) => {
      const { pedidoId, ...item } = input;
      await addItemToPedidoCompra(pedidoId, item);
    }),
    listAbertos: protectedProcedure.query(async () => {
      const todos = await listPedidosCompra();
      return todos.filter((p) => p.status === "ABERTO" || p.status === "APROVADO");
    }),
    createComItem: protectedProcedure.input(z2.object({
      solicitante: z2.string(),
      produtoNome: z2.string(),
      quantidade: z2.string(),
      precoVenda: z2.string(),
      subtotalVenda: z2.string()
    })).mutation(async ({ input }) => {
      const numero = await getNextNumeroPedidoCompra();
      const hoje = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const pedidoId = await createPedidoCompra({
        numero,
        data: hoje,
        solicitante: input.solicitante,
        total: input.subtotalVenda,
        itens: [{ produtoNome: input.produtoNome, quantidade: input.quantidade, precoVenda: input.precoVenda, subtotalVenda: input.subtotalVenda }]
      });
      return pedidoId;
    })
  }),
  // ─── Cooperflora ────
  cooperflora: router({
    getConfig: protectedProcedure.query(async () => {
      return getCooperfloraConfig();
    }),
    setDataCarregamento: protectedProcedure.input(z2.object({
      dataCarregamento: z2.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Formato dd/MM/yyyy")
    })).mutation(async ({ input }) => {
      await upsertCooperfloraConfig({ dataCarregamento: input.dataCarregamento });
      return { ok: true };
    }),
    salvarConfig: protectedProcedure.input(z2.object({
      login: z2.string(),
      senha: z2.string(),
      chave: z2.string().optional(),
      rota: z2.string().optional(),
      localEntrega: z2.string().optional(),
      margemPadrao: z2.number().optional(),
      dataCarregamento: z2.string().optional()
    })).mutation(async ({ input }) => {
      return upsertCooperfloraConfig({
        login: input.login,
        senha: input.senha,
        chave: input.chave || "62002",
        rota: input.rota || "463",
        localEntrega: input.localEntrega || "TRIANGULO MINEIRO - MG - BROKER",
        margemPadrao: input.margemPadrao !== void 0 ? String(input.margemPadrao) : void 0,
        dataCarregamento: input.dataCarregamento || ""
      });
    }),
    sincronizar: protectedProcedure.input(z2.object({
      dataCarregamento: z2.string().optional(),
      sessionId: z2.string().optional()
    })).mutation(async ({ input }) => {
      const syncSessionId = input.sessionId || "default";
      const syncInicioMs = Date.now();
      const emitProgress = (phase, current, total, message) => {
        syncProgressEmitter.emit(SYNC_EVENT, syncSessionId, { phase, current, total, message });
      };
      const config = await getCooperfloraConfig();
      if (!config || !config.login || !config.senha) {
        await registrarSyncHistorico({ fonte: "COOPERFLORA", status: "FALHA", total: 0, mensagem: "Credenciais n\xE3o configuradas", duracaoMs: Date.now() - syncInicioMs });
        throw new Error("Configure as credenciais da Cooperflora primeiro");
      }
      const https = await import("https");
      const http = await import("http");
      const dataCarregamento = input.dataCarregamento || config.dataCarregamento;
      if (!dataCarregamento) throw new Error("Informe a data de carregamento");
      const fetchRaw = (url, options, timeoutMs = 15e3) => {
        return new Promise((resolve, reject) => {
          const urlObj = new URL(url);
          const lib = urlObj.protocol === "https:" ? https : http;
          const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || "GET",
            headers: options.headers || {}
          };
          const req = lib.request(reqOptions, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
          });
          req.on("error", reject);
          req.setTimeout(timeoutMs, () => {
            req.destroy();
            reject(new Error(`Timeout ap\xF3s ${timeoutMs}ms para ${url}`));
          });
          if (options.body) req.write(options.body);
          req.end();
        });
      };
      const indexResp = await fetchRaw("https://comercial.cooperflora.com.br/index.jsp", {
        method: "GET",
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
        }
      });
      const cookieJar = {};
      const extractCookies = (headers) => {
        const setCookies = headers["set-cookie"] || [];
        const arr = Array.isArray(setCookies) ? setCookies : [setCookies];
        arr.forEach((c) => {
          if (!c) return;
          const [pair] = c.split(";");
          const [name, ...valParts] = pair.split("=");
          if (name && valParts.length) cookieJar[name.trim()] = valParts.join("=").trim();
        });
      };
      extractCookies(indexResp.headers);
      const loginApiResp = await fetchRaw("https://apinovo.cooperflora.com.br/api/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://comercial.cooperflora.com.br",
          "Referer": "https://comercial.cooperflora.com.br/index.jsp",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: JSON.stringify({ login: config.login, senha: config.senha })
      });
      let cooperToken = "";
      let usuario = {};
      let menu = [];
      try {
        const loginData = JSON.parse(loginApiResp.body);
        if (loginData?.CODERR !== 0 && loginData?.CODERR !== void 0) {
          throw new Error(`Login Cooperflora falhou: ${loginData?.MSG || "Credenciais inv\xE1lidas"}`);
        }
        cooperToken = loginData?.TOKEN || "";
        usuario = loginData?.USUARIO || {};
        menu = loginData?.MENU || [];
      } catch (e) {
        throw new Error(`Falha no login da Cooperflora: ${e.message}`);
      }
      if (!cooperToken) {
        throw new Error("Falha no login da Cooperflora. Verifique login e senha.");
      }
      const cookieHeader = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join("; ");
      const sessionBody = new URLSearchParams({
        TOKEN: cooperToken,
        USUARIO: JSON.stringify(usuario),
        BASE_URL: "https://apinovo.cooperflora.com.br",
        MENU: JSON.stringify(menu),
        CHAVE_PAGINA: "0"
      }).toString();
      const sessionResp = await fetchRaw("https://comercial.cooperflora.com.br/session/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cookie": cookieHeader,
          "Origin": "https://comercial.cooperflora.com.br",
          "Referer": "https://comercial.cooperflora.com.br/index.jsp",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        body: sessionBody
      });
      extractCookies(sessionResp.headers);
      const cookieStr = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join("; ");
      if (!cookieStr) {
        throw new Error("Falha ao obter sess\xE3o do site Cooperflora.");
      }
      emitProgress("produtos", 0, 0, "Buscando lista de produtos...");
      const chave = config.chave || "62002";
      const rota = config.rota || "463";
      const produtosBody = new URLSearchParams({
        chave,
        rota,
        enderecoEntrega: "0",
        dataCarregamento,
        filial: "",
        indexTr: "-1",
        utilizarCredito: "false",
        utilizarCreditoDisponivel: "false",
        utilizarCaixaSeca: "false",
        grupos: "16,17,18,6,2,21,8,11",
        agencias: "",
        especies: "",
        tamanhos: "",
        cores: "",
        qualidades: "",
        produtores: "",
        temas: "",
        recepcionado: "",
        variedades: ""
      }).toString();
      const produtosResp = await fetchRaw("https://comercial.cooperflora.com.br/pedido/comprar/listarProdutos", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Accept": "text/html, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          "Cookie": cookieStr,
          "Referer": "https://comercial.cooperflora.com.br/pedido/comprar/principal",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        body: produtosBody
      });
      const html = produtosResp.body;
      const allProdutos = [];
      const onclickPattern = /abrirModalComprarProduto\('(\d+)', '([^']+)', '([A-Z0-9]+)','([^']+)'/g;
      const seen = /* @__PURE__ */ new Set();
      let onclickMatch;
      while ((onclickMatch = onclickPattern.exec(html)) !== null) {
        const [, , , codigo, qualidade] = onclickMatch;
        const key = `${codigo}_${qualidade}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const idx = onclickMatch.index;
        const ctx = html.substring(Math.max(0, idx - 2e3), idx);
        const nomeMatches = ctx.match(/<span class="fw-semibold[^"]*"\s*>\s*([^<]+?)\s*<\/span>/g);
        const nomeMatch = nomeMatches ? nomeMatches[nomeMatches.length - 1].match(/>\s*([^<]+?)\s*<\/span>/) : null;
        const nome = nomeMatch ? nomeMatch[1].trim().substring(0, 100) : "";
        if (!nome) continue;
        const precoMatches = ctx.match(/<td class="w-20">\s*(R\$[\d.,]+(?:\s*-\s*[\d.,]+)?)\s*<\/td>/g);
        const precoMatch = precoMatches ? precoMatches[precoMatches.length - 1].match(/(R\$[\d.,]+(?:\s*-\s*[\d.,]+)?)/) : null;
        const preco = precoMatch ? precoMatch[1].trim() : "R$0";
        const estoqueMatches = ctx.substring(ctx.length - 500).match(/<td>\s*(\d+)\s*<\/td>/g);
        const estoqueStr = estoqueMatches ? estoqueMatches[estoqueMatches.length - 1].replace(/<[^>]+>/g, "").trim() : "0";
        const estoque = parseInt(estoqueStr) || 0;
        allProdutos.push({ codigo, nome, preco, qualidade, estoque });
      }
      const produtosParaSalvar = allProdutos.map((p) => {
        const precoStr = p.preco.replace("R$", "").trim();
        const partes = precoStr.split(/\s*-\s*/);
        const precoMin = parseFloat(partes[0].replace(",", ".")) || 0;
        const precoMax = partes.length > 1 ? parseFloat(partes[1].replace(",", ".")) || precoMin : precoMin;
        return {
          codigo: p.codigo,
          nome: p.nome,
          precoMin: String(precoMin),
          precoMax: String(precoMax),
          qualidade: p.qualidade,
          estoque: p.estoque,
          grupo: "",
          imagemUrl: `https://apinovo.cooperflora.com.br/api/v1/imagem?codigo=${p.codigo}`,
          dataCarregamento,
          atualizadoEm: /* @__PURE__ */ new Date()
        };
      });
      await upsertCooperfloraProdutos(produtosParaSalvar);
      await upsertCooperfloraConfig({ ultimaAtualizacao: /* @__PURE__ */ new Date(), dataCarregamento });
      emitProgress("produtos", produtosParaSalvar.length, produtosParaSalvar.length, `${produtosParaSalvar.length} produtos salvos. Carregando hastes...`);
      const sleep3 = (ms) => new Promise((r) => setTimeout(r, ms));
      const chaveConf = config.chave || "62002";
      const rotaConf = config.rota || "463";
      let hastesCarregados = 0;
      const totalProdutos = produtosParaSalvar.length;
      const buscarHastesProduto = async (prod) => {
        const detBody = new URLSearchParams({
          chave: chaveConf,
          dataCarregamento,
          produto: prod.codigo,
          qualidade: prod.qualidade,
          rota: rotaConf,
          endereco: "0",
          compraRapida: "false",
          filial: "",
          indexTr: "-1",
          utilizaCredito: "false",
          utilizarCreditoDisponivel: "false",
          valorCreditoDisponivel: "0",
          utilizarCaixaSeca: "false"
        }).toString();
        const detResp = await fetchRaw("https://comercial.cooperflora.com.br/pedido/comprar/detalheProduto", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept": "text/html, */*; q=0.01",
            "X-Requested-With": "XMLHttpRequest",
            "Cookie": cookieStr,
            "Referer": "https://comercial.cooperflora.com.br/pedido/comprar/principal",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          body: detBody
        }, 1e4);
        const detHtml = detResp.body;
        const hMatch = detHtml.match(/Hastes[^<]*<\/[^>]+>\s*<[^>]+>\s*(\d+)/);
        const hastesNum = hMatch ? parseInt(hMatch[1]) : 1;
        const trPat = /<tr[^>]*data-cod-sitio="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/;
        const trM = trPat.exec(detHtml);
        let hastesEmbNum = 1;
        if (trM) {
          const tds = trM[2].match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
          const embTd = tds[3] || "";
          const embText = embTd.replace(/<[^>]+>/g, "").trim();
          const embM = embText.match(/(\d+)/);
          if (embM) hastesEmbNum = parseInt(embM[1]);
        }
        await updateCooperfloraHastes(prod.codigo, hastesNum > 0 ? hastesNum : 1, hastesEmbNum);
      };
      const BATCH_SIZE = 5;
      for (let i = 0; i < produtosParaSalvar.length; i += BATCH_SIZE) {
        const lote = produtosParaSalvar.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(lote.map((prod) => buscarHastesProduto(prod)));
        hastesCarregados = Math.min(i + BATCH_SIZE, totalProdutos);
        emitProgress("hastes", hastesCarregados, totalProdutos, `Carregando hastes: ${hastesCarregados}/${totalProdutos}`);
        if (i + BATCH_SIZE < produtosParaSalvar.length) await sleep3(300);
      }
      emitProgress("concluido", totalProdutos, totalProdutos, `Sincronizando cat\xE1logo de vendas...`);
      const margemSync = parseFloat(String(config.margemPadrao || "30"));
      const syncResult = await syncProdutosVendaFromCooperflora(margemSync);
      const syncMsg = `Conclu\xEDdo! ${totalProdutos} produtos. Vendas: +${syncResult.criados} novos, ${syncResult.atualizados} atualizados, ${syncResult.removidos} removidos.`;
      emitProgress("concluido", totalProdutos, totalProdutos, syncMsg);
      await registrarSyncHistorico({ fonte: "COOPERFLORA", status: "SUCESSO", total: totalProdutos, mensagem: syncMsg, duracaoMs: Date.now() - syncInicioMs });
      return { total: produtosParaSalvar.length, dataCarregamento, hastesCarregados: totalProdutos, syncVendas: syncResult };
    }),
    listar: protectedProcedure.input(z2.object({
      nome: z2.string().optional(),
      qualidade: z2.string().optional(),
      grupo: z2.string().optional()
    })).query(async ({ input }) => {
      const [produtos2, config] = await Promise.all([
        listCooperfloraProdutos(input),
        getCooperfloraConfig()
      ]);
      const margemPadrao = parseFloat(String(config?.margemPadrao || "30"));
      return produtos2.map((p) => {
        const margem = p.margemCustom !== null && p.margemCustom !== void 0 ? parseFloat(String(p.margemCustom)) : margemPadrao;
        const precoMin = parseFloat(String(p.precoMin));
        const precoMax = parseFloat(String(p.precoMax));
        const precoVendaMin = precoMin > 0 ? precoMin * (1 + margem / 100) : 0;
        const precoVendaMax = precoMax > 0 ? precoMax * (1 + margem / 100) : 0;
        return {
          ...p,
          margem,
          precoVendaMin: precoVendaMin.toFixed(4),
          precoVendaMax: precoVendaMax.toFixed(4)
        };
      });
    }),
    atualizarMargem: protectedProcedure.input(z2.object({
      codigo: z2.string(),
      margemCustom: z2.number().nullable()
    })).mutation(async ({ input }) => {
      await updateCooperfloraMargem(input.codigo, input.margemCustom);
    }),
    atualizarMargemGlobal: protectedProcedure.input(z2.object({
      margemPadrao: z2.number()
    })).mutation(async ({ input }) => {
      await upsertCooperfloraConfig({ margemPadrao: String(input.margemPadrao) });
    }),
    buscarDetalhesProduto: protectedProcedure.input(z2.object({
      codigo: z2.string(),
      qualidade: z2.string(),
      dataCarregamento: z2.string()
    })).query(async ({ input }) => {
      const config = await getCooperfloraConfig();
      if (!config || !config.login || !config.senha) {
        throw new Error("Configure as credenciais da Cooperflora primeiro");
      }
      const https = await import("https");
      const http = await import("http");
      const fetchRaw = (url, options) => {
        return new Promise((resolve, reject) => {
          const urlObj = new URL(url);
          const lib = urlObj.protocol === "https:" ? https : http;
          const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || "GET",
            headers: options.headers || {}
          };
          const req = lib.request(reqOptions, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
          });
          req.on("error", reject);
          if (options.body) req.write(options.body);
          req.end();
        });
      };
      const cookieJar = {};
      const extractCookies = (headers) => {
        const setCookies = headers["set-cookie"] || [];
        const arr = Array.isArray(setCookies) ? setCookies : [setCookies];
        arr.forEach((c) => {
          if (!c) return;
          const [pair] = c.split(";");
          const [name, ...valParts] = pair.split("=");
          if (name && valParts.length) cookieJar[name.trim()] = valParts.join("=").trim();
        });
      };
      const indexResp = await fetchRaw("https://comercial.cooperflora.com.br/index.jsp", {
        method: "GET",
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      extractCookies(indexResp.headers);
      const loginApiResp = await fetchRaw("https://apinovo.cooperflora.com.br/api/v1/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://comercial.cooperflora.com.br",
          "Referer": "https://comercial.cooperflora.com.br/index.jsp",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
        },
        body: JSON.stringify({ login: config.login, senha: config.senha })
      });
      let cooperToken = "";
      let usuario = {};
      let menu = [];
      try {
        const loginData = JSON.parse(loginApiResp.body);
        if (loginData?.CODERR !== 0 && loginData?.CODERR !== void 0) {
          throw new Error(`Login Cooperflora falhou: ${loginData?.MSG || "Credenciais inv\xE1lidas"}`);
        }
        cooperToken = loginData?.TOKEN || "";
        usuario = loginData?.USUARIO || {};
        menu = loginData?.MENU || [];
      } catch (e) {
        throw new Error(`Falha no login da Cooperflora: ${e.message}`);
      }
      if (!cooperToken) throw new Error("Falha no login da Cooperflora.");
      const cookieHeader = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join("; ");
      const sessionBody = new URLSearchParams({
        TOKEN: cooperToken,
        USUARIO: JSON.stringify(usuario),
        BASE_URL: "https://apinovo.cooperflora.com.br",
        MENU: JSON.stringify(menu),
        CHAVE_PAGINA: "0"
      }).toString();
      const sessionResp = await fetchRaw("https://comercial.cooperflora.com.br/session/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Cookie": cookieHeader,
          "Origin": "https://comercial.cooperflora.com.br",
          "Referer": "https://comercial.cooperflora.com.br/index.jsp",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
        },
        body: sessionBody
      });
      extractCookies(sessionResp.headers);
      const cookieStr = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join("; ");
      const detalheBody = new URLSearchParams({
        chave: config.chave || "62002",
        dataCarregamento: input.dataCarregamento,
        produto: input.codigo,
        qualidade: input.qualidade,
        rota: config.rota || "463",
        endereco: "0",
        compraRapida: "false",
        filial: "",
        indexTr: "-1",
        utilizaCredito: "false",
        utilizarCreditoDisponivel: "false",
        valorCreditoDisponivel: "0",
        utilizarCaixaSeca: "false"
      }).toString();
      const detalheResp = await fetchRaw("https://comercial.cooperflora.com.br/pedido/comprar/detalheProduto", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Accept": "text/html, */*; q=0.01",
          "X-Requested-With": "XMLHttpRequest",
          "Cookie": cookieStr,
          "Referer": "https://comercial.cooperflora.com.br/pedido/comprar/principal",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        body: detalheBody
      });
      const html = detalheResp.body;
      const sitios = [];
      let nomeProduto = input.codigo;
      let codigoProduto = input.codigo;
      let qualidadeInfo = input.qualidade;
      let corInfo = "";
      let tamanhoInfo = "";
      let hastesNum = null;
      let imagemUrl = `https://apinovo.cooperflora.com.br/api/v1/imagem?codigo=${input.codigo}`;
      const jsonMatch = html.match(/var postOfertasBody\s*=\s*(\{[\s\S]*?\});/);
      if (jsonMatch) {
        try {
          const postData = JSON.parse(jsonMatch[1]);
          const produto = postData.PRODUTO || {};
          const ofertas = postData.OFERTAS || [];
          nomeProduto = produto.descricao || input.codigo;
          codigoProduto = produto.produto || input.codigo;
          qualidadeInfo = produto.qualidade || input.qualidade;
          corInfo = produto.corProduto || "";
          tamanhoInfo = produto.tamanho || "";
          hastesNum = produto.qtdeHasteMaco ? parseInt(String(produto.qtdeHasteMaco)) : null;
          if (produto.urlProduto) {
            imagemUrl = produto.urlProduto.startsWith("http") ? produto.urlProduto : `https://apinovo.cooperflora.com.br${produto.urlProduto}`;
          }
          for (const oferta of ofertas) {
            const codigoSitio = String(oferta.sitio || "");
            const nomeSitio = oferta.nomePropriedade || oferta.nomeProdutor || codigoSitio;
            const logoRaw = oferta.urlSitio || "";
            const logoUrl = logoRaw.startsWith("http") ? logoRaw : logoRaw ? `https://apinovo.cooperflora.com.br${logoRaw}` : "";
            const qtdEmb = oferta.qtdPorEmbalagem || 1;
            const embalagem = `${qtdEmb} un`;
            const pontoAbertura = oferta.moqDescricao || "PADR\xC3O";
            const saldo = parseInt(String(oferta.saldo || 0)) || 0;
            const precoUnid = parseFloat(String(oferta.preco || 0)) || 0;
            const desconto = 0;
            const participaDesconto = oferta.participaLMPM === "S";
            if (codigoSitio && precoUnid > 0) {
              sitios.push({
                codigoSitio,
                nomeSitio,
                logoUrl,
                embalagem,
                pontoAbertura,
                saldo,
                precoUnid,
                desconto,
                participaDesconto
              });
            }
          }
        } catch (_e) {
        }
      }
      if (sitios.length === 0) {
        const nomeMatchHtml = html.match(/<h5[^>]*class="[^"]*text-success[^"]*"[^>]*>\s*([^<]+?)\s*<\/h5>/i) || html.match(/<strong[^>]*>\s*([A-Z][A-Z0-9 ]+)\s*<\/strong>/);
        if (nomeMatchHtml) nomeProduto = nomeMatchHtml[1].trim();
        const qualidadeMatch = html.match(/Qualidade[^<]*<\/[^>]+>\s*<[^>]+>\s*([^<]+)/);
        const corMatch = html.match(/Cor[^<]*<\/[^>]+>\s*<[^>]+>\s*([^<]+)/);
        const tamanhoMatch = html.match(/Tamanho[^<]*<\/[^>]+>\s*<[^>]+>\s*([^<]+)/);
        const hastesMatch = html.match(/Hastes[^<]*<\/[^>]+>\s*<[^>]+>\s*(\d+)/);
        const imgMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*class="[^"]*img-produto[^"]*"|<img[^>]*class="[^"]*img-produto[^"]*"[^>]+src="([^"]+)"/);
        if (qualidadeMatch) qualidadeInfo = qualidadeMatch[1].trim();
        if (corMatch) corInfo = corMatch[1].trim();
        if (tamanhoMatch) tamanhoInfo = tamanhoMatch[1].trim();
        if (hastesMatch) hastesNum = parseInt(hastesMatch[1]);
        if (imgMatch) imagemUrl = imgMatch[1] || imgMatch[2];
        const trPattern = /<tr[^>]*data-cod-sitio="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g;
        let trMatch;
        while ((trMatch = trPattern.exec(html)) !== null) {
          const [, codigoSitio, trContent] = trMatch;
          const tds = [];
          const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/g;
          let tdMatch;
          while ((tdMatch = tdPattern.exec(trContent)) !== null) {
            tds.push(tdMatch[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim());
          }
          const logoMatch = trContent.match(/<img[^>]+src="([^"]+)"/);
          const logoUrl = logoMatch ? logoMatch[1].startsWith("http") ? logoMatch[1] : `https://comercial.cooperflora.com.br${logoMatch[1]}` : "";
          const nomeSitio = tds[2] || tds[1] || "";
          const embalagem = tds[3] || "";
          const pontoAbertura = tds[4] || "PADR\xC3O";
          const saldo = parseInt((tds[5] || "0").replace(/[^0-9]/g, "")) || 0;
          const precoUnid = parseFloat((tds[7] || "0").replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
          const desconto = parseFloat((tds[8] || "0").replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
          const participaDesconto = (tds[9] || "").toLowerCase().includes("sim");
          if (nomeSitio) {
            sitios.push({ codigoSitio, nomeSitio: nomeSitio.trim(), logoUrl, embalagem: embalagem.trim(), pontoAbertura: pontoAbertura.trim(), saldo, precoUnid, desconto, participaDesconto });
          }
        }
        if (sitios.length === 0) {
          const trPattern2 = /<tr[^>]*data-row-index="[^"]+"[^>]*>([\s\S]*?)<\/tr>/g;
          let trMatch2;
          while ((trMatch2 = trPattern2.exec(html)) !== null) {
            const trContent = trMatch2[1];
            if (!trContent.includes("<td")) continue;
            const tds = [];
            const tdPattern2 = /<td[^>]*>([\s\S]*?)<\/td>/g;
            let tdMatch2;
            while ((tdMatch2 = tdPattern2.exec(trContent)) !== null) {
              tds.push(tdMatch2[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim());
            }
            if (tds.length < 5) continue;
            const codigoSitio = tds[0].replace(/\D/g, "") || "";
            if (!codigoSitio) continue;
            const logoMatch2 = trContent.match(/<img[^>]+src="([^"]+)"/);
            const logoUrl = logoMatch2 ? logoMatch2[1].startsWith("http") ? logoMatch2[1] : `https://apinovo.cooperflora.com.br${logoMatch2[1]}` : "";
            const nomeSitio = tds[2] || tds[1] || "";
            const embalagem = tds[3] || "";
            const pontoAbertura = tds[4] || "PADR\xC3O";
            const saldo = parseInt((tds[5] || "0").replace(/[^0-9]/g, "")) || 0;
            const precoUnid = parseFloat((tds[7] || "0").replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
            const desconto = parseFloat((tds[8] || "0").replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
            const participaDesconto = (tds[9] || "").toLowerCase().includes("sim");
            if (nomeSitio && precoUnid > 0) {
              sitios.push({ codigoSitio, nomeSitio: nomeSitio.trim(), logoUrl, embalagem: embalagem.trim(), pontoAbertura: pontoAbertura.trim(), saldo, precoUnid, desconto, participaDesconto });
            }
          }
        }
      }
      const primeiroSitio = sitios[0];
      const hastesEmbNum = primeiroSitio ? (() => {
        const m = primeiroSitio.embalagem.match(/(\d+)/);
        return m ? parseInt(m[1]) : 1;
      })() : 1;
      if (hastesNum && hastesNum > 1) {
        await updateCooperfloraHastes(input.codigo, hastesNum, hastesEmbNum).catch(() => {
        });
      } else if (hastesEmbNum > 1) {
        await updateCooperfloraHastes(input.codigo, 1, hastesEmbNum).catch(() => {
        });
      }
      return {
        codigo: input.codigo,
        qualidade: input.qualidade,
        nomeProduto,
        codigoProduto,
        qualidadeInfo,
        cor: corInfo,
        tamanho: tamanhoInfo,
        hastes: hastesNum,
        imagemUrl,
        sitios,
        htmlRaw: html.length > 100 ? "ok" : "empty"
      };
    }),
    // ─── Margens por Departamento ───
    listarMargensDepartamento: protectedProcedure.query(async () => {
      return listMargensDepartamento();
    }),
    salvarMargemDepartamento: protectedProcedure.input(z2.object({
      grupo: z2.string().min(1),
      margem: z2.number().min(0).max(500)
    })).mutation(async ({ input }) => {
      await upsertMargemDepartamento(input.grupo, input.margem);
      return { ok: true };
    }),
    deletarMargemDepartamento: protectedProcedure.input(z2.object({
      grupo: z2.string().min(1)
    })).mutation(async ({ input }) => {
      await deleteMargemDepartamento(input.grupo);
      return { ok: true };
    }),
    // ─── Preview de Sincronização (dry-run) ───
    previewSync: protectedProcedure.query(async () => {
      const config = await getCooperfloraConfig();
      const margemPadrao = parseFloat(String(config?.margemPadrao || "30"));
      return previewSyncVendas(margemPadrao);
    }),
    // ─── Confirmar Sincronização (aplica itens aprovados) ───
    confirmarSync: protectedProcedure.input(z2.object({
      codigosAprovados: z2.array(z2.string())
    })).mutation(async ({ input }) => {
      const config = await getCooperfloraConfig();
      const margemPadrao = parseFloat(String(config?.margemPadrao || "30"));
      return aplicarSyncVendas(input.codigosAprovados, margemPadrao);
    }),
    // ─── Histórico de Sincronizações ───
    getHistoricoSync: protectedProcedure.query(async () => {
      return listarSyncHistorico("COOPERFLORA", 50);
    }),
    // ─── Status do Auto-Sync ───
    getAutoSyncStatus: protectedProcedure.query(() => {
      return schedulerStatus.cooperflora;
    })
  }),
  // ─── Veiling ───
  veiling: router({
    getConfig: protectedProcedure.query(async () => {
      const cfg = await getVeilingConfig();
      return cfg ? { ...cfg, senha: cfg.senha ? "\u2022\u2022\u2022\u2022\u2022\u2022" : "" } : null;
    }),
    saveConfig: protectedProcedure.input(z2.object({
      usuario: z2.string().min(1),
      senha: z2.string().min(1),
      customerId: z2.string().default("987"),
      customerIdPedidos: z2.string().default("5191"),
      margemGlobal: z2.number().min(0).max(200).default(30)
    })).mutation(async ({ input }) => {
      await saveVeilingConfig({
        usuario: input.usuario,
        senha: input.senha,
        customerId: input.customerId,
        customerIdPedidos: input.customerIdPedidos,
        margemGlobal: String(input.margemGlobal)
      });
      return { ok: true };
    }),
    setDataCarregamento: protectedProcedure.input(z2.object({
      dataCarregamento: z2.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Formato dd/MM/yyyy")
    })).mutation(async ({ input }) => {
      await saveVeilingConfig({ dataCarregamento: input.dataCarregamento });
      return { ok: true };
    }),
    listProdutos: protectedProcedure.input(z2.object({
      categoria: z2.string().optional(),
      produtor: z2.string().optional(),
      busca: z2.string().optional(),
      cor: z2.string().optional(),
      cores: z2.array(z2.string()).optional(),
      limit: z2.number().default(48),
      offset: z2.number().default(0)
    })).query(async ({ input }) => {
      const [result, cfg, todasMargens] = await Promise.all([
        listVeilingProdutos(input),
        getVeilingConfig(),
        listVeilingMargens()
      ]);
      const margemGlobal = parseFloat(String(cfg?.margemGlobal || "30"));
      const margemMap = /* @__PURE__ */ new Map();
      for (const m of todasMargens) {
        const key = m.categoria.toLowerCase().trim();
        margemMap.set(key, Number(m.margem));
      }
      function getMargemPorCategoria(categoria) {
        const c = (categoria || "").toLowerCase().trim();
        if (c.includes("corte")) return margemMap.get("produto de corte") ?? margemMap.get("flores de corte") ?? margemGlobal;
        if (c.includes("envasada")) return margemMap.get("flor envasada") ?? margemGlobal;
        if (c.includes("ornamental") || c.includes("planta")) return margemMap.get("planta ornamental") ?? margemGlobal;
        if (c.includes("decorado") || c.includes("decorada")) return margemMap.get("produto decorado") ?? margemGlobal;
        return margemMap.get(c) ?? margemGlobal;
      }
      const enriched = result.items.map((item) => {
        const margem = getMargemPorCategoria(item.categoria || "");
        const _emb1 = item.precoEmbalagem != null ? Number(item.precoEmbalagem) : 0;
        const _cam1 = item.precoCamada != null ? Number(item.precoCamada) : 0;
        const _car1 = item.precoCarrinho != null ? Number(item.precoCarrinho) : 0;
        const custoBaseVal = _emb1 > 0 ? _emb1 : _cam1 > 0 ? _cam1 : _car1;
        const freteUnit = item.frete != null ? Number(item.frete) : 0;
        const custoComFrete = custoBaseVal + freteUnit;
        const icmsFator = item.icms != null ? Number(item.icms) : null;
        const custoFinal = icmsFator && icmsFator > 0 && icmsFator < 1 ? custoComFrete / icmsFator : custoComFrete;
        const valorIcmsUnit = icmsFator && icmsFator > 0 && icmsFator < 1 ? Math.round((custoFinal - custoComFrete) * 100) / 100 : 0;
        const qtdVenda = Number(item.qtdVenda) || Number(item.multiplo) || 1;
        const precoVenda = custoFinal > 0 ? Math.round(custoFinal * (1 + margem / 100) * qtdVenda * 100) / 100 : 0;
        return { ...item, margem, precoVenda, custoFinal: Math.round(custoFinal * 100) / 100, freteUnit, valorIcmsUnit };
      });
      return { ...result, items: enriched };
    }),
    // Versão pública de listProdutos (sem autenticação)
    listProdutosPublico: publicProcedure.input(z2.object({
      categoria: z2.string().optional(),
      produtor: z2.string().optional(),
      busca: z2.string().optional(),
      cor: z2.string().optional(),
      cores: z2.array(z2.string()).optional(),
      letra: z2.string().optional(),
      limit: z2.number().default(48),
      offset: z2.number().default(0)
    })).query(async ({ input }) => {
      const [result, cfg, todasMargens] = await Promise.all([
        listVeilingProdutos(input),
        getVeilingConfig(),
        listVeilingMargens()
      ]);
      const margemGlobal = parseFloat(String(cfg?.margemGlobal || "30"));
      const margemMap = /* @__PURE__ */ new Map();
      for (const m of todasMargens) {
        const key = m.categoria.toLowerCase().trim();
        margemMap.set(key, Number(m.margem));
      }
      function getMargemPorCategoria(categoria) {
        const c = (categoria || "").toLowerCase().trim();
        if (c.includes("corte")) return margemMap.get("produto de corte") ?? margemMap.get("flores de corte") ?? margemGlobal;
        if (c.includes("envasada")) return margemMap.get("flor envasada") ?? margemGlobal;
        if (c.includes("ornamental") || c.includes("planta")) return margemMap.get("planta ornamental") ?? margemGlobal;
        if (c.includes("decorado") || c.includes("decorada")) return margemMap.get("produto decorado") ?? margemGlobal;
        return margemMap.get(c) ?? margemGlobal;
      }
      const enriched = result.items.map((item) => {
        const margem = getMargemPorCategoria(item.categoria || "");
        const _emb1 = item.precoEmbalagem != null ? Number(item.precoEmbalagem) : 0;
        const _cam1 = item.precoCamada != null ? Number(item.precoCamada) : 0;
        const _car1 = item.precoCarrinho != null ? Number(item.precoCarrinho) : 0;
        const custoBaseVal = _emb1 > 0 ? _emb1 : _cam1 > 0 ? _cam1 : _car1;
        const freteUnit = item.frete != null ? Number(item.frete) : 0;
        const custoComFrete = custoBaseVal + freteUnit;
        const icmsFator = item.icms != null ? Number(item.icms) : null;
        const custoFinal = icmsFator && icmsFator > 0 && icmsFator < 1 ? custoComFrete / icmsFator : custoComFrete;
        const valorIcmsUnit = icmsFator && icmsFator > 0 && icmsFator < 1 ? Math.round((custoFinal - custoComFrete) * 100) / 100 : 0;
        const qtdVenda = Number(item.qtdVenda) || Number(item.multiplo) || 1;
        const precoVenda = custoFinal > 0 ? Math.round(custoFinal * (1 + margem / 100) * qtdVenda * 100) / 100 : 0;
        return { ...item, margem, precoVenda, custoFinal: Math.round(custoFinal * 100) / 100, freteUnit, valorIcmsUnit };
      });
      return { ...result, items: enriched };
    }),
    sincronizar: protectedProcedure.input(z2.object({
      sessionId: z2.string().optional()
    })).mutation(async ({ input }) => {
      const sid = input.sessionId || `veiling-${Date.now()}`;
      const veilingSyncInicioMs = Date.now();
      const emit = (fase, atual, total, msg) => {
        syncProgressEmitter.emit(SYNC_EVENT, sid, { phase: fase, current: atual, total, message: msg ?? fase });
      };
      const cfgCheck = await getVeilingConfig();
      if (!cfgCheck || !cfgCheck.usuario || !cfgCheck.senha) {
        throw new Error("Configure o usu\xE1rio e senha do Veiling em Configura\xE7\xF5es antes de sincronizar.");
      }
      (async () => {
        try {
          const cfg = await getVeilingConfig();
          if (!cfg || !cfg.usuario || !cfg.senha) {
            await registrarSyncHistorico({ fonte: "VEILING", status: "FALHA", total: 0, mensagem: "Credenciais n\xE3o configuradas", duracaoMs: Date.now() - veilingSyncInicioMs });
            emit("erro", 0, 0, "Credenciais n\xE3o configuradas");
            return;
          }
          emit("login", 0, 1, "Autenticando no Veiling Online...");
          const tokenData = await veilingLogin(cfg.usuario, cfg.senha);
          const token = tokenData.access_token;
          emit("categorias", 0, 1, "Buscando categorias...");
          const categorias = await veilingGetCategories(token);
          emit("produtos", 0, 1, "Buscando ofertas...");
          const todasOfertas = await veilingGetAllOffers(
            token,
            cfg.customerId,
            void 0,
            (atual, total2) => emit("produtos", atual, total2, `Carregando ofertas: ${atual}/${total2}`)
          );
          emit("salvando", 0, todasOfertas.length, "Salvando no banco de dados...");
          const catMapById = new Map(categorias.map((c) => [c.id, c.description]));
          const catMapByCode = new Map(categorias.map((c) => [c.code, c.description]));
          const catMapByCodeTrimmed = new Map(categorias.map((c) => [String(parseInt(c.code, 10)), c.description]));
          emit("gfp", 0, todasOfertas.length, "Buscando dados de GFP das ofertas...");
          const tomorrow = /* @__PURE__ */ new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const auctionDate = tomorrow.toISOString().substring(0, 10);
          const lkpOfertas = todasOfertas.filter((o) => Number(o.offerType) === 1);
          const gfpMap = /* @__PURE__ */ new Map();
          const BATCH_GFP = 30;
          for (let i = 0; i < lkpOfertas.length; i += BATCH_GFP) {
            const lote = lkpOfertas.slice(i, i + BATCH_GFP);
            await Promise.all(lote.map(async (o) => {
              try {
                const packingId = o.packings?.[0]?.id || 0;
                const gfps = await veilingGetGfpByOffer(token, o.offerId, 1, packingId, auctionDate);
                if (gfps && gfps.length > 0) {
                  const g = gfps[0];
                  gfpMap.set(o.offerId, {
                    quality: g.quality || "",
                    gfpNumero: g.lot || "",
                    // lot = Nº GFP (ex: "A")
                    obs1: g.qualityObservation1 || "",
                    obs2: g.qualityObservation2 || "",
                    deliveryDate: g.deliveryDate || "",
                    serie: g.gfpNumber || "",
                    // gfpNumber = Série
                    lote: g.lot || "",
                    packingId
                  });
                }
              } catch {
              }
            }));
            emit("gfp", Math.min(i + BATCH_GFP, lkpOfertas.length), lkpOfertas.length, `GFP: ${Math.min(i + BATCH_GFP, lkpOfertas.length)}/${lkpOfertas.length}`);
            await new Promise((r) => setTimeout(r, 50));
          }
          const inseridos = todasOfertas.map((o) => {
            const catId = Number(o.productCategory) || 0;
            const catNome = o.productCategoryDescription || catMapById.get(catId) || catMapByCode.get(o.productCategory) || catMapByCodeTrimmed.get(o.productCategory) || "";
            const gfp = gfpMap.get(o.offerId);
            return {
              offerId: o.offerId,
              nome: o.name,
              nomeCompleto: o.longName || o.name,
              categoria: catNome,
              categoriaId: catId,
              produtor: o.siteName || o.producerName || "",
              qualidade: o.quality || "",
              dimensao: o.dimension || "",
              embalagem: o.packagingName || "",
              precoCarrinho: o.trolleyPrice != null ? String(o.trolleyPrice) : null,
              precoCamada: o.layerPrice != null ? String(o.layerPrice) : null,
              precoEmbalagem: o.packagingPrice != null ? String(o.packagingPrice) : null,
              estoqueDisponivel: o.availableStock || 0,
              tipoOferta: o.offerType || "",
              dataValidade: o.endDate ? o.endDate.substring(0, 10) : null,
              imagemUrl: o.defaultImage || null,
              frete: (() => {
                const filialFrete = o.shippingFeeFilials?.[0]?.productShippingValue;
                if (filialFrete != null && filialFrete > 0) return String(filialFrete);
                const patternFrete = o.siteDeliveryPatterns?.[0]?.freightValue;
                if (patternFrete != null && patternFrete > 0) return String(patternFrete);
                if (o.shippingFee != null && o.shippingFee > 0) return String(o.shippingFee);
                return null;
              })(),
              multiplo: o.packings?.[0]?.minimumQuantity || 1,
              compraMinima: 1,
              packingId: gfp?.packingId ?? (o.packings?.[0]?.id || 0),
              gfpQualidade: gfp?.quality ?? "",
              gfpNumero: gfp?.gfpNumero ?? "",
              gfpObs1: gfp?.obs1 ?? null,
              gfpObs2: gfp?.obs2 ?? null,
              gfpEntregaCvh: gfp?.deliveryDate ?? "",
              gfpSerie: gfp?.serie ?? "",
              gfpLote: gfp?.lote ?? "",
              // Cor do produto: vem do campo colors da API do Veiling
              cor: o.colors ? String(o.colors).toUpperCase().trim() : "",
              // Status do produto: derivado do offerType e dados GFP
              // offerType=1 (LKP): se tem GFP com entrega → RECEPCIONADO LKP; senão → NO SITIO LKP
              // offerType=2 (ENP): ESTQ NO PROD. ENP
              statusProduto: (() => {
                const tipoStr = String(o.offerType || "").trim();
                if (tipoStr === "2") return "ENP";
                const g = gfpMap.get(o.offerId);
                if (g && g.deliveryDate) return "LKP_RECEPCIONADO";
                return "LKP_SITIO";
              })()
            };
          });
          const total = await upsertVeilingProdutos(inseridos);
          await saveVeilingConfig({ ultimaAtualizacao: /* @__PURE__ */ new Date() });
          const veilingMsg = `Sincroniza\xE7\xE3o conclu\xEDda! ${total} ofertas carregadas.`;
          emit("concluido", total, total, veilingMsg);
          await registrarSyncHistorico({ fonte: "VEILING", status: "SUCESSO", total, mensagem: veilingMsg, duracaoMs: Date.now() - veilingSyncInicioMs });
          cacheVeilingImages(inseridos.map((p) => ({ offerId: p.offerId, imagemUrl: p.imagemUrl ?? null }))).catch((e) => console.warn("[Sync Manual] Erro ao cachear imagens Veiling:", e instanceof Error ? e.message : String(e)));
        } catch (bgErr) {
          const msg = bgErr instanceof Error ? bgErr.message : String(bgErr);
          emit("erro", 0, 0, `Erro na sincroniza\xE7\xE3o: ${msg}`);
          await registrarSyncHistorico({ fonte: "VEILING", status: "FALHA", total: 0, mensagem: msg, duracaoMs: Date.now() - veilingSyncInicioMs });
        }
      })();
      return { total: 0, categorias: [], sessionId: sid, iniciado: true };
    }),
    // Alias para compatibilidade retroativa
    sincronizarStatus: protectedProcedure.input(z2.object({
      sessionId: z2.string()
    })).query(({ input }) => {
      const last = syncProgressEmitter.getLastEvent(input.sessionId);
      return last || { phase: "aguardando", current: 0, total: 0, message: "Aguardando in\xEDcio..." };
    }),
    listarMargens: protectedProcedure.query(async () => listVeilingMargens()),
    salvarMargem: protectedProcedure.input(z2.object({
      categoria: z2.string().min(1),
      margem: z2.number().min(0).max(200)
    })).mutation(async ({ input }) => {
      await upsertVeilingMargem(input.categoria, input.margem);
      return { ok: true };
    }),
    deletarMargem: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteVeilingMargem(input.id);
      return { ok: true };
    }),
    recategorizarProdutos: protectedProcedure.mutation(async () => {
      const cfg = await getVeilingConfig();
      if (!cfg || !cfg.usuario || !cfg.senha) throw new Error("Configure o usu\xE1rio e senha do Veiling.");
      const tokenData = await veilingLogin(cfg.usuario, cfg.senha);
      const categorias = await veilingGetCategories(tokenData.access_token);
      const catMapById = new Map(categorias.map((c) => [c.id, c.description]));
      const catMapByCode = new Map(categorias.map((c) => [c.code, c.description]));
      const catMapByCodeTrimmed = new Map(categorias.map((c) => [String(parseInt(c.code, 10)), c.description]));
      const corrigidos = await recategorizarVeilingProdutos(catMapById, catMapByCode, catMapByCodeTrimmed);
      return { corrigidos };
    }),
    getConversaoInfo: protectedProcedure.query(async () => {
      const count = await countVeilingConversao();
      return { count };
    }),
    // ─── Histórico de Sincronizações ───
    getHistoricoSync: protectedProcedure.query(async () => {
      return listarSyncHistorico("VEILING", 50);
    }),
    // ─── Status do Auto-Sync ───
    getAutoSyncStatus: protectedProcedure.query(() => {
      return schedulerStatus.veiling;
    }),
    cachearImagens: protectedProcedure.mutation(async () => {
      const { ENV: ENV2 } = await Promise.resolve().then(() => (init_env(), env_exports));
      const mysql = await import("mysql2/promise");
      const conn = await mysql.createConnection(ENV2.databaseUrl);
      let total = 0;
      try {
        const [rows] = await conn.execute(
          'SELECT offerId, imagemUrl FROM veiling_produtos WHERE imagemUrl IS NOT NULL AND imagemUrl != "" AND (imagemUrlCache IS NULL OR imagemUrlCache = "") LIMIT 500'
        );
        total = rows.length;
        if (total > 0) {
          cacheVeilingImages(rows.map((r) => ({ offerId: r.offerId, imagemUrl: r.imagemUrl }))).catch((e) => console.warn("[cachearImagens] Erro:", e instanceof Error ? e.message : String(e)));
        }
      } finally {
        await conn.end();
      }
      return { iniciado: true, total };
    }),
    importarConversao: protectedProcedure.input(z2.object({
      rows: z2.array(z2.object({
        codItem: z2.string(),
        descCurta: z2.string(),
        descLonga: z2.string().default(""),
        qtdVenda: z2.number().int().min(1),
        fotoUrl: z2.string().nullable().optional(),
        qualidade: z2.string().optional(),
        observacao: z2.string().nullable().optional(),
        numGfp: z2.string().optional(),
        icms: z2.number().nullable().optional()
        // fator ICMS ex: 0.82 = 18% ICMS
      }))
    })).mutation(async ({ input }) => {
      const total = await importVeilingConversao(input.rows);
      return { total };
    }),
    // ─── Veiling - Importação Automática de Pedidos ──────────────────────────────
    checkDuplicatasPedidos: protectedProcedure.input(z2.object({
      data: z2.string().optional()
      // YYYY-MM-DD, default = hoje
    })).mutation(async ({ input }) => {
      const dateStr = input.data || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const config = await getVeilingConfig();
      if (!config?.usuario || !config?.senha) throw new Error("Credenciais n\xE3o configuradas");
      const tokenData = await veilingLogin(config.usuario, config.senha);
      const token = tokenData.access_token;
      const accountCodePedidos = config.customerIdPedidos || config.customerId || "5191";
      let customerId = accountCodePedidos;
      try {
        const meResp = await fetch("https://backend.veilingonline.com.br/ecommerce/api/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const meData = await meResp.json();
        const customers = meData.customers || meData.data?.customers || meData;
        if (Array.isArray(customers)) {
          const found = customers.find((c) => String(c.accountCode) === String(accountCodePedidos) || String(c.code) === String(accountCodePedidos));
          if (found) customerId = String(found.id);
        }
      } catch {
      }
      const exportUrl = `https://backend.veilingonline.com.br/ecommerce/api/sale/export?Data.CustomerId=${customerId}&Data.SaleDate=${dateStr}&Data.IsDirected=true&Data.IsVol=true&Data.IsTransit=true&Data.IsReceived=true`;
      const exportResp = await fetch(exportUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!exportResp.ok) return { duplicatas: [], totalNovos: 0 };
      const exportData = await exportResp.json();
      const base64 = exportData.data || exportData;
      if (!base64 || typeof base64 !== "string") return { duplicatas: [], totalNovos: 0 };
      const buffer = Buffer.from(base64, "base64");
      const wb = XLSX2.read(buffer, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX2.utils.sheet_to_json(ws, { header: 1, defval: "" });
      const parseResult = parseVeilingRows(rows);
      if (!parseResult.success || parseResult.items.length === 0) return { duplicatas: [], totalNovos: 0 };
      const numerosNovos = parseResult.items.map((i) => i.pedido).filter(Boolean);
      if (numerosNovos.length === 0) return { duplicatas: [], totalNovos: parseResult.items.length };
      const existentes = await checkTransacoesExistentes(numerosNovos);
      const numerosExistentes = new Set(existentes.map((e) => e.transacaoGfp));
      const duplicatas = parseResult.items.filter((i) => i.pedido && numerosExistentes.has(i.pedido)).map((i) => ({ pedido: i.pedido, descricao: i.descricao }));
      const totalNovos = parseResult.items.filter((i) => !i.pedido || !numerosExistentes.has(i.pedido)).length;
      return { duplicatas, totalNovos };
    }),
    importarPedidosDia: protectedProcedure.input(z2.object({
      data: z2.string().optional(),
      // YYYY-MM-DD, default = hoje
      origem: z2.enum(["AUTOMATICO", "MANUAL"]).default("MANUAL"),
      forcarImportacao: z2.boolean().default(false)
      // true = importar mesmo com duplicatas
    })).mutation(async ({ input }) => {
      const config = await getVeilingConfig();
      if (!config?.usuario || !config?.senha) {
        throw new Error("Credenciais do Veiling n\xE3o configuradas. Configure usu\xE1rio e senha na aba Veiling.");
      }
      const tokenData = await veilingLogin(config.usuario, config.senha);
      const token = tokenData.access_token;
      const accountCodePedidos = config.customerIdPedidos || config.customerId || "5191";
      let customerId = accountCodePedidos;
      try {
        const meResp = await fetch("https://backend.veilingonline.com.br/ecommerce/api/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (meResp.ok) {
          const meData = await meResp.json();
          const customers = meData?.customers || [];
          const found = customers.find(
            (c) => String(c.accountCode) === String(accountCodePedidos) || String(c.id) === String(accountCodePedidos)
          );
          if (found) {
            customerId = String(found.id);
          }
        }
      } catch (e) {
      }
      const dateStr = input.data || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const dataBR = dateStr.split("-").reverse().join("/");
      const exportParams = new URLSearchParams({
        "Data.CustomerId": customerId,
        "Data.Status": "",
        "Data.IsDirected": "true",
        "Data.IsVol": "true",
        "Data.IsTransit": "true",
        "Data.IsReceived": "true",
        "Data.SaleDate": dateStr
      });
      const exportUrl = `https://backend.veilingonline.com.br/ecommerce/api/sale/export?${exportParams.toString()}`;
      const exportResp = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!exportResp.ok) {
        const errText = await exportResp.text();
        throw new Error(`Erro ao baixar pedidos do Veiling (${exportResp.status}): ${errText.substring(0, 200)}`);
      }
      let buffer;
      const contentType = exportResp.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const jsonResp = await exportResp.json();
        if (jsonResp?.data) {
          buffer = Buffer.from(jsonResp.data, "base64");
        } else if (Array.isArray(jsonResp) && jsonResp.length === 0) {
          await createVeilingImportacao({
            dataPedidos: dateStr,
            totalItens: 0,
            totalPedidos: 0,
            status: "SUCESSO",
            mensagem: `Nenhum pedido encontrado para ${dataBR}`,
            origem: input.origem
          });
          return { success: true, totalItens: 0, totalPedidos: 0, mensagem: `Nenhum pedido encontrado para ${dataBR}`, compraId: null };
        } else {
          const jsonData = Array.isArray(jsonResp) ? jsonResp : [];
          const ws2 = XLSX2.utils.json_to_sheet(jsonData);
          const wb2 = XLSX2.utils.book_new();
          XLSX2.utils.book_append_sheet(wb2, ws2, "Pedidos");
          buffer = Buffer.from(XLSX2.write(wb2, { type: "buffer", bookType: "xlsx" }));
        }
      } else {
        const arrayBuffer = await exportResp.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }
      const wb = XLSX2.read(buffer, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("Planilha vazia no arquivo de pedidos");
      const rows = XLSX2.utils.sheet_to_json(ws, { header: 1, defval: "" });
      const parseResult = parseVeilingRows(rows);
      if (!parseResult.success || parseResult.items.length === 0) {
        await createVeilingImportacao({
          dataPedidos: dateStr,
          totalItens: 0,
          totalPedidos: 0,
          status: "PARCIAL",
          mensagem: parseResult.error || `Nenhum item v\xE1lido para ${dataBR}`,
          origem: input.origem
        });
        return { success: true, totalItens: 0, totalPedidos: 0, mensagem: parseResult.error || "Nenhum item", compraId: null };
      }
      const items = parseResult.items;
      const fornecedor = extractFornecedorFromChave(parseResult.chaveInfo) || config.usuario;
      const produtosResult = await listProdutosLoja({ limit: 1e3 });
      const produtosList = produtosResult.items || [];
      const numerosNovos = items.map((i) => i.pedido).filter(Boolean);
      const existentesSet = /* @__PURE__ */ new Set();
      if (numerosNovos.length > 0) {
        const existentes = await checkTransacoesExistentes(numerosNovos);
        existentes.forEach((e) => {
          if (e.transacaoGfp) existentesSet.add(String(e.transacaoGfp));
        });
      }
      const itensPayload = items.map((item) => {
        const existing = produtosList.find(
          (p) => p.nome?.toLowerCase() === item.descricao?.toLowerCase()
        );
        const qtdTotal = item.totalUn || 1;
        const isDuplicado = item.pedido ? existentesSet.has(item.pedido) : false;
        return {
          produtoId: existing?.id ?? void 0,
          produtoNome: item.descricao,
          quantidade: String(qtdTotal),
          valorUnitario: String(item.vlrUnit || 0),
          subtotal: String(qtdTotal * (item.vlrUnit || 0)),
          transacaoGfp: item.pedido || null,
          isDuplicado: isDuplicado ? 1 : 0
        };
      });
      const total = itensPayload.reduce((s, i) => s + parseFloat(i.subtotal), 0);
      const compraResult = await createCompra(
        { fornecedor, data: dateStr, total: total.toFixed(2), origem: "IMPORTACAO", status: "RASCUNHO" },
        itensPayload
      );
      for (const item of itensPayload) {
        if (item.produtoNome?.trim()) {
          await upsertProdutoLojaFromCompra({
            nome: item.produtoNome.trim(),
            precoCusto: parseFloat(item.valorUnitario) || 0,
            quantidade: parseFloat(item.quantidade) || 0
          });
        }
      }
      await createVeilingImportacao({
        dataPedidos: dateStr,
        totalItens: items.length,
        totalPedidos: 1,
        compraId: compraResult,
        status: "SUCESSO",
        mensagem: `${items.length} itens importados de ${dataBR}`,
        origem: input.origem
      });
      return { success: true, totalItens: items.length, totalPedidos: 1, mensagem: `${items.length} itens importados`, compraId: compraResult };
    }),
    listarImportacoes: protectedProcedure.query(async () => {
      return listVeilingImportacoes(30);
    }),
    criarPedidoPublico: publicProcedure.input(z2.object({
      linkToken: z2.string(),
      clienteNome: z2.string().min(1),
      clienteEmail: z2.string().email(),
      clienteTelefone: z2.string().min(1),
      itens: z2.array(z2.object({
        produtoNome: z2.string(),
        quantidade: z2.number().min(0.01),
        valorUnitario: z2.number().min(0),
        qualidade: z2.string().optional(),
        produtor: z2.string().optional(),
        produtoId: z2.number().optional()
      }))
    })).mutation(async ({ input }) => {
      try {
        const now = /* @__PURE__ */ new Date();
        const dayOfWeek = now.getDay();
        const hour = now.getHours();
        const isBlockedTime = dayOfWeek === 2 && hour >= 20 || dayOfWeek === 3 || dayOfWeek === 4 && hour < 7;
        if (isBlockedTime) {
          throw new Error("Pedidos bloqueados de ter\xE7a \xE0s 20:00 at\xE9 quinta \xE0s 07:00. Em caso de d\xFAvidas, chamar no WhatsApp.");
        }
        const total = input.itens.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0);
        const pedido = await createPedidoPublico(
          {
            linkToken: input.linkToken,
            clienteNome: input.clienteNome,
            clienteEmail: input.clienteEmail,
            clienteTelefone: input.clienteTelefone,
            total: String(total),
            status: "PENDENTE"
          },
          input.itens.map((item) => ({
            produtoNome: item.produtoNome,
            quantidade: String(item.quantidade),
            valorUnitario: String(item.valorUnitario),
            subtotal: String(item.quantidade * item.valorUnitario),
            observacao: item.qualidade ? `Qualidade: ${item.qualidade}${item.produtor ? ` - ${item.produtor}` : ""}` : item.produtor ? item.produtor : void 0
          })),
          input.itens.map((item) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade
          }))
        );
        let vendaId = null;
        try {
          const hoje = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
          vendaId = await createVenda(
            {
              clienteNome: input.clienteNome,
              telefoneCliente: input.clienteTelefone,
              data: hoje,
              status: "AGUARDANDO",
              total: String(total),
              frete: "0.00",
              origem: "CATALOGO_VEILING",
              observacaoPedido: `Pedido via cat\xE1logo p\xFAblico Veiling
Email: ${input.clienteEmail}
Telefone: ${input.clienteTelefone}`
            },
            input.itens.map((item, idx) => ({
              produtoNome: item.produtoNome,
              quantidade: String(item.quantidade),
              valorUnitario: String(item.valorUnitario),
              subtotal: String(item.quantidade * item.valorUnitario),
              observacao: item.qualidade ? `Qualidade: ${item.qualidade}${item.produtor ? ` - ${item.produtor}` : ""}` : item.produtor ? item.produtor : void 0,
              ordem: idx
            }))
          );
          if (vendaId && pedido?.id) {
            try {
              await updatePedidoPublicoVendaId(pedido.id, vendaId);
            } catch (e) {
              console.error("[criarPedidoPublico] Erro ao salvar vendaId:", e);
            }
          }
        } catch (err) {
          console.error("[criarPedidoPublico] Erro ao criar or\xE7amento:", err);
        }
        try {
          pedidoPublicoEmitter.emit("novo-pedido", {
            id: pedido?.id,
            vendaId,
            clienteNome: input.clienteNome,
            total,
            itens: input.itens.length
          });
        } catch (err) {
          console.error("[criarPedidoPublico] Erro ao emitir evento SSE:", err);
        }
        try {
          const itemsText = input.itens.map((i) => `${i.produtoNome} x ${i.quantidade} @ R$ ${i.valorUnitario.toFixed(2)}`).join("\n");
          await notifyOwner({
            title: `\u{1F4E6} Novo Pedido P\xFAblico - ${input.clienteNome}`,
            content: `Cliente: ${input.clienteNome}
Email: ${input.clienteEmail}
Telefone: ${input.clienteTelefone}

Itens:
${itemsText}

Total: R$ ${total.toFixed(2)}`
          });
        } catch (err) {
          console.error("Erro ao notificar propriet\xE1rio:", err);
        }
        return { ...pedido, vendaId };
      } catch (err) {
        console.error("[criarPedidoPublico] Erro geral:", err);
        throw new Error(`Erro ao criar pedido: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),
    getPedidoPublico: publicProcedure.input(z2.object({
      id: z2.number()
    })).query(async ({ input }) => {
      return getPedidoPublico(input.id);
    }),
    // ─── Procedures públicas para catálogo público ───
    listar: publicProcedure.input(z2.object({
      pagina: z2.number().default(0),
      limite: z2.number().default(50),
      busca: z2.string().optional(),
      cor: z2.string().optional(),
      cores: z2.array(z2.string()).optional(),
      categoria: z2.string().optional(),
      produtor: z2.string().optional()
    })).query(async ({ input }) => {
      const offset = input.pagina * input.limite;
      const [result, cfg] = await Promise.all([
        listVeilingProdutos({
          categoria: input.categoria,
          produtor: input.produtor,
          busca: input.busca,
          cor: input.cor,
          cores: input.cores,
          limit: input.limite + 1,
          offset
        }),
        getVeilingConfig()
      ]);
      const margemGlobal = parseFloat(String(cfg?.margemGlobal || "30"));
      const enriched = await Promise.all(result.items.slice(0, input.limite).map(async (item) => {
        const margem = await getVeilingMargemEfetiva(item.categoria || "", margemGlobal);
        const _emb1 = item.precoEmbalagem != null ? Number(item.precoEmbalagem) : 0;
        const _cam1 = item.precoCamada != null ? Number(item.precoCamada) : 0;
        const _car1 = item.precoCarrinho != null ? Number(item.precoCarrinho) : 0;
        const custoBaseVal = _emb1 > 0 ? _emb1 : _cam1 > 0 ? _cam1 : _car1;
        const freteUnit = item.frete != null ? Number(item.frete) : 0;
        const custoComFrete = custoBaseVal + freteUnit;
        const icmsFator = item.icms != null ? Number(item.icms) : null;
        const custoFinal = icmsFator && icmsFator > 0 && icmsFator < 1 ? custoComFrete / icmsFator : custoComFrete;
        const qtdVenda = Number(item.qtdVenda) || Number(item.multiplo) || 1;
        const precoVenda = custoFinal > 0 ? Math.round(custoFinal * (1 + margem / 100) * qtdVenda * 100) / 100 : 0;
        return {
          id: item.id,
          offerId: item.offerId || null,
          nome: item.nome,
          nomeCompleto: item.nomeCompleto || item.nome,
          categoria: item.categoria,
          produtor: item.produtor,
          cor: item.cor,
          qualidade: item.qualidade,
          qtdVenda,
          precoVenda: String(precoVenda),
          imagemUrl: item.imagemUrl || null,
          estoqueDisponivel: item.estoqueDisponivel ?? null
        };
      }));
      return {
        produtos: enriched,
        hasMore: result.items.length > input.limite,
        total: result.total
      };
    }),
    getInfoLink: publicProcedure.input(z2.object({ token: z2.string() })).query(async ({ input }) => {
      const link = await getVeilingCatalogoLink(input.token);
      if (!link) return null;
      const filtroCor = link.filtroCor || "";
      return {
        filtroCategoria: link.filtroCategoria || "",
        filtroProdutor: link.filtroProdutor || "",
        filtroCores: filtroCor ? filtroCor.split(",").filter((c) => c.trim()) : [],
        filtroBusca: link.filtroBusca || ""
      };
    }),
    getCategorias: publicProcedure.query(async () => {
      const result = await getVeilingCategorias();
      return Array.isArray(result) ? result : [];
    }),
    getCores: publicProcedure.query(async () => {
      const result = await getCoresVeiling();
      return Array.isArray(result) ? result : [];
    }),
    getProdutores: publicProcedure.input(z2.object({
      categoria: z2.string().optional()
    })).query(async ({ input }) => {
      const result = await getVeilingProdutores(input.categoria);
      return Array.isArray(result) ? result : [];
    }),
    gerarLinkCatalogo: protectedProcedure.input(z2.object({
      diasValidade: z2.number().min(1).max(365).default(7),
      filtroCategoria: z2.string().optional().default(""),
      filtroProdutor: z2.string().optional().default(""),
      filtroCores: z2.array(z2.string()).optional().default([]),
      filtroBusca: z2.string().optional().default("")
    })).mutation(async ({ input, ctx }) => {
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setDate(expiresAt.getDate() + input.diasValidade);
      const link = await createVeilingCatalogoLink(
        expiresAt,
        ctx.user.name || ctx.user.openId,
        input.filtroCategoria || "",
        input.filtroProdutor || "",
        (input.filtroCores || []).join(","),
        input.filtroBusca || ""
      );
      return link;
    }),
    listarLinksPublicos: protectedProcedure.query(async () => {
      return listVeilingCatalogoLinks();
    }),
    deletarLinkPublico: protectedProcedure.input(z2.object({ token: z2.string() })).mutation(async ({ input }) => {
      await deleteVeilingCatalogoLink(input.token);
      return { ok: true };
    }),
    // ─── Gerenciamento de Pedidos Públicos ───
    listarPedidosPublicos: protectedProcedure.input(z2.object({
      status: z2.enum(["PENDENTE", "CONFIRMADO", "CONVERTIDO", "CANCELADO"]).optional(),
      busca: z2.string().optional(),
      limit: z2.number().min(1).max(500).default(50),
      offset: z2.number().min(0).default(0)
    })).query(async ({ input }) => {
      const allPedidos = await listPedidosPublicos();
      let filtered = allPedidos;
      if (input.status) {
        filtered = filtered.filter((p) => p.status === input.status);
      }
      if (input.busca) {
        const searchLower = input.busca.toLowerCase();
        filtered = filtered.filter(
          (p) => p.clienteNome.toLowerCase().includes(searchLower) || p.clienteEmail.toLowerCase().includes(searchLower) || p.clienteTelefone.includes(input.busca)
        );
      }
      const total = filtered.length;
      const items = filtered.slice(input.offset, input.offset + input.limit);
      const itemsWithDetails = await Promise.all(
        items.map(async (pedido) => {
          const detalhes = await getPedidoPublico(pedido.id);
          return detalhes;
        })
      );
      return { items: itemsWithDetails, total };
    }),
    obterPedidoPublico: protectedProcedure.input(z2.object({
      id: z2.number()
    })).query(async ({ input }) => {
      return getPedidoPublico(input.id);
    }),
    atualizarStatusPedido: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["PENDENTE", "CONFIRMADO", "CONVERTIDO", "CANCELADO"])
    })).mutation(async ({ input, ctx }) => {
      await updatePedidoPublicoStatus(input.id, input.status);
      const pedido = await getPedidoPublico(input.id);
      if (pedido) {
        try {
          const statusTexto = {
            "PENDENTE": "Pendente",
            "CONFIRMADO": "Confirmado",
            "CONVERTIDO": "Convertido em Venda",
            "CANCELADO": "Cancelado"
          }[input.status] || input.status;
          console.log(`Pedido ${input.id} atualizado para ${input.status}`);
        } catch (err) {
          console.error("Erro ao notificar cliente:", err);
        }
      }
      return { ok: true };
    }),
    converterEmOrcamento: protectedProcedure.input(z2.object({
      id: z2.number()
    })).mutation(async ({ input, ctx }) => {
      const pedido = await getPedidoPublico(input.id);
      if (!pedido) throw new TRPCError3({ code: "NOT_FOUND", message: "Pedido n\xE3o encontrado" });
      if (pedido.vendaId) {
        throw new TRPCError3({
          code: "CONFLICT",
          message: `Este pedido j\xE1 foi convertido no Or\xE7amento #${pedido.vendaId}`
        });
      }
      const hoje = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
      const totalVenda = itens.reduce((s, i) => s + parseFloat(i.subtotalVenda ?? i.subtotal ?? 0), 0);
      const vendaId = await createVenda(
        {
          clienteNome: pedido.clienteNome,
          telefoneCliente: pedido.clienteTelefone ?? void 0,
          data: hoje,
          status: "AGUARDANDO",
          total: String(totalVenda.toFixed(2)),
          frete: "0.00",
          observacaoPedido: pedido.observacoes ?? void 0,
          origem: "CATALOGO_VEILING"
        },
        itens.map((item, idx) => ({
          vendaId: 0,
          // será sobrescrito pelo createVenda
          produtoId: item.produtoId ?? void 0,
          produtoNome: item.produtoNome,
          quantidade: String(item.quantidade),
          valorUnitario: String(parseFloat(item.valorUnitario ?? item.precoVenda ?? 0).toFixed(2)),
          subtotal: String(parseFloat(item.subtotalVenda ?? item.subtotal ?? 0).toFixed(2)),
          ordem: idx
        }))
      );
      if (!vendaId) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar or\xE7amento" });
      await updatePedidoPublicoVendaId(input.id, vendaId);
      return { vendaId };
    }),
    // ─── Filtros Salvos ───
    salvarFiltro: protectedProcedure.input(z2.object({
      nome: z2.string().min(1).max(255),
      categoria: z2.string().optional(),
      produtor: z2.string().optional(),
      cor: z2.string().optional(),
      busca: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      return saveVeilingFiltro(ctx.user.id, input.nome, input.categoria, input.produtor, input.cor, input.busca);
    }),
    listarFiltrosSalvos: protectedProcedure.query(async ({ ctx }) => {
      return listVeilingFiltros(ctx.user.id);
    }),
    obterFiltroSalvo: protectedProcedure.input(z2.object({
      id: z2.number()
    })).query(async ({ input, ctx }) => {
      return getVeilingFiltro(input.id, ctx.user.id);
    }),
    deletarFiltroSalvo: protectedProcedure.input(z2.object({
      id: z2.number()
    })).mutation(async ({ input, ctx }) => {
      return deleteVeilingFiltro(input.id, ctx.user.id);
    }),
    atualizarFiltroSalvo: protectedProcedure.input(z2.object({
      id: z2.number(),
      nome: z2.string().min(1).max(255),
      categoria: z2.string().optional(),
      produtor: z2.string().optional(),
      cor: z2.string().optional(),
      busca: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      return updateVeilingFiltro(input.id, ctx.user.id, input.nome, input.categoria, input.produtor, input.cor, input.busca);
    }),
    // ─── Criar Orçamento a partir do Carrinho Veiling ────────────────────────
    criarOrcamentoDoCarrinho: protectedProcedure.input(z2.object({
      clienteId: z2.number().optional(),
      clienteNome: z2.string().min(1, "Nome do cliente \xE9 obrigat\xF3rio"),
      telefoneCliente: z2.string().optional(),
      dataEntrega: z2.string().optional(),
      observacaoPedido: z2.string().optional(),
      itens: z2.array(z2.object({
        produtoId: z2.number().optional(),
        produtoNome: z2.string(),
        quantidade: z2.number().min(1),
        valorUnitario: z2.number().min(0),
        subtotal: z2.number().min(0)
      })).min(1, "O carrinho n\xE3o pode estar vazio")
    })).mutation(async ({ input, ctx }) => {
      const hoje = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const total = input.itens.reduce((s, i) => s + i.subtotal, 0);
      const vendaId = await createVenda({
        clienteId: input.clienteId ?? null,
        clienteNome: input.clienteNome,
        telefoneCliente: input.telefoneCliente ?? null,
        data: hoje,
        dataEntrega: input.dataEntrega ?? null,
        observacaoPedido: input.observacaoPedido ?? null,
        status: "AGUARDANDO",
        total: total.toFixed(2),
        vendedorNome: ctx.user.name ?? null
      }, input.itens.map((item, idx) => ({
        produtoId: item.produtoId ?? null,
        produtoNome: item.produtoNome,
        quantidade: String(item.quantidade),
        valorUnitario: item.valorUnitario.toFixed(2),
        subtotal: item.subtotal.toFixed(2),
        ordem: idx
      })));
      if (!vendaId) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar or\xE7amento" });
      return { id: vendaId, numero: `#${String(vendaId).padStart(6, "0")}` };
    })
  }),
  // ─── Cadastro de Produtos da Loja ────────────────────────────────────────────
  loja: router({
    listar: protectedProcedure.input(z2.object({
      busca: z2.string().optional(),
      departamento: z2.string().optional(),
      ativo: z2.number().optional(),
      limit: z2.number().min(1).max(500).default(100),
      offset: z2.number().min(0).default(0)
    })).query(async ({ input }) => {
      return listProdutosLoja(input);
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getProdutoLoja(input.id);
    }),
    criar: protectedProcedure.input(z2.object({
      codigo: z2.string().optional(),
      nome: z2.string().min(1),
      descricao: z2.string().optional(),
      unidade: z2.string().default("UN"),
      departamento: z2.string().default(""),
      preco: z2.number().min(0).default(0),
      precoCusto: z2.number().min(0).optional(),
      estoque: z2.number().default(0),
      ativo: z2.number().default(1),
      imagemUrl: z2.string().optional()
    })).mutation(async ({ input }) => {
      return createProdutoLoja({
        ...input,
        preco: String(input.preco),
        precoCusto: input.precoCusto != null ? String(input.precoCusto) : null,
        estoque: String(input.estoque)
      });
    }),
    atualizar: protectedProcedure.input(z2.object({
      id: z2.number(),
      codigo: z2.string().optional(),
      nome: z2.string().min(1).optional(),
      descricao: z2.string().optional(),
      unidade: z2.string().optional(),
      departamento: z2.string().optional(),
      preco: z2.number().min(0).optional(),
      precoCusto: z2.number().min(0).optional().nullable(),
      estoque: z2.number().optional(),
      ativo: z2.number().optional(),
      imagemUrl: z2.string().optional().nullable()
    })).mutation(async ({ input }) => {
      const { id, preco, precoCusto, estoque, ...rest } = input;
      return updateProdutoLoja(id, {
        ...rest,
        ...preco !== void 0 ? { preco: String(preco) } : {},
        ...precoCusto !== void 0 ? { precoCusto: precoCusto != null ? String(precoCusto) : null } : {},
        ...estoque !== void 0 ? { estoque: String(estoque) } : {}
      });
    }),
    deletar: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteProdutoLoja(input.id);
      return { ok: true };
    }),
    listDepartamentos: protectedProcedure.query(async () => {
      return listDepartamentosLoja();
    }),
    // ─── Ajuste de Estoque ───
    ajustarEstoque: protectedProcedure.input(z2.object({
      produtoId: z2.number(),
      tipo: z2.enum(["ENTRADA", "SAIDA", "AJUSTE"]),
      quantidade: z2.number().positive(),
      justificativa: z2.string().min(3)
    })).mutation(async ({ input, ctx }) => {
      const usuarioNome = ctx.user?.name || ctx.user?.username || "Usu\xE1rio";
      const usuarioId = String(ctx.user?.id || "");
      return criarMovimentacaoEstoque({
        produtoId: input.produtoId,
        tipo: input.tipo,
        quantidade: input.quantidade,
        justificativa: input.justificativa,
        usuarioNome,
        usuarioId
      });
    }),
    listarMovimentacoes: protectedProcedure.input(z2.object({
      produtoId: z2.number().optional(),
      tipo: z2.enum(["ENTRADA", "SAIDA", "AJUSTE"]).optional(),
      usuarioNome: z2.string().optional(),
      limit: z2.number().min(1).max(500).default(100),
      offset: z2.number().min(0).default(0)
    })).query(async ({ input }) => {
      return listarMovimentacoesEstoque(input);
    }),
    relatorioEstoque: protectedProcedure.query(async () => {
      return relatorioEstoqueProdutos();
    })
  }),
  // ─── Catálogos de Venda ────
  catalogosVenda: router({
    // Listar todos os catálogos
    list: protectedProcedure.query(async () => {
      return listCatalogosVenda();
    }),
    // Buscar catálogo por ID com itens
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      const catalogo = await getCatalogoVenda(input.id);
      if (!catalogo) return null;
      const itens = await listCatalogoItens(input.id);
      return { ...catalogo, itens };
    }),
    // Criar novo catálogo
    criar: protectedProcedure.input(z2.object({
      titulo: z2.string().min(1),
      descricao: z2.string().optional(),
      expiresInHours: z2.number().min(1).max(8760).default(168),
      // 7 dias default
      criadoPor: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { randomBytes } = await import("crypto");
      const token = randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1e3);
      const id = await createCatalogoVenda({
        titulo: input.titulo,
        descricao: input.descricao || null,
        token,
        expiresAt,
        criadoPor: input.criadoPor || null
      });
      return { id, token };
    }),
    // Atualizar catálogo
    atualizar: protectedProcedure.input(z2.object({
      id: z2.number(),
      titulo: z2.string().min(1).optional(),
      descricao: z2.string().optional(),
      ativo: z2.number().optional(),
      expiresInHours: z2.number().min(1).max(8760).optional()
    })).mutation(async ({ input }) => {
      const { id, expiresInHours, ...rest } = input;
      const updateData = { ...rest };
      if (expiresInHours) {
        updateData.expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1e3);
      }
      await updateCatalogoVenda(id, updateData);
      return { ok: true };
    }),
    // Deletar catálogo
    deletar: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteCatalogoVenda(input.id);
      return { ok: true };
    }),
    // Prorrogar validade do catálogo
    prorrogar: protectedProcedure.input(z2.object({
      id: z2.number(),
      horasAdicionais: z2.number().min(1).max(8760)
    })).mutation(async ({ input }) => {
      const catalogo = await getCatalogoVenda(input.id);
      if (!catalogo) throw new Error("Cat\xE1logo n\xE3o encontrado");
      const base = new Date(catalogo.expiresAt) < /* @__PURE__ */ new Date() ? /* @__PURE__ */ new Date() : new Date(catalogo.expiresAt);
      const novaExpiracao = new Date(base.getTime() + input.horasAdicionais * 60 * 60 * 1e3);
      await updateCatalogoVenda(input.id, { expiresAt: novaExpiracao, ativo: 1 });
      return { ok: true, novaExpiracao };
    }),
    // Adicionar item ao catálogo
    addItem: protectedProcedure.input(z2.object({
      catalogoId: z2.number(),
      origem: z2.enum(["cooperflora", "veiling", "loja"]),
      produtoId: z2.string(),
      nome: z2.string(),
      descricao: z2.string().optional(),
      preco: z2.number().optional(),
      imagemUrl: z2.string().optional(),
      unidade: z2.string().optional(),
      ordem: z2.number().optional()
    })).mutation(async ({ input }) => {
      const id = await addCatalogoItem({
        catalogoId: input.catalogoId,
        origem: input.origem,
        produtoId: input.produtoId,
        nome: input.nome,
        descricao: input.descricao || null,
        preco: input.preco != null ? String(input.preco) : null,
        imagemUrl: input.imagemUrl || null,
        unidade: input.unidade || null,
        ordem: input.ordem || 0
      });
      return { id };
    }),
    // Remover item do catálogo
    removeItem: protectedProcedure.input(z2.object({ itemId: z2.number() })).mutation(async ({ input }) => {
      await removeCatalogoItem(input.itemId);
      return { ok: true };
    }),
    // Listar itens do catálogo
    listItens: protectedProcedure.input(z2.object({ catalogoId: z2.number() })).query(async ({ input }) => {
      return listCatalogoItens(input.catalogoId);
    }),
    // Limpar todos os itens do catálogo
    clearItens: protectedProcedure.input(z2.object({ catalogoId: z2.number() })).mutation(async ({ input }) => {
      await clearCatalogoItens(input.catalogoId);
      return { ok: true };
    }),
    // Listar pedidos de um catálogo
    listPedidos: protectedProcedure.input(z2.object({ catalogoId: z2.number() })).query(async ({ input }) => {
      return listCatalogoPedidos(input.catalogoId);
    }),
    // Listar todos os pedidos
    listAllPedidos: protectedProcedure.query(async () => {
      return listAllCatalogoPedidos();
    }),
    // Atualizar status de pedido
    updatePedidoStatus: protectedProcedure.input(z2.object({
      pedidoId: z2.number(),
      status: z2.enum(["NOVO", "VISTO", "APROVADO", "CANCELADO", "RECUSADO"]),
      motivoRecusa: z2.string().optional()
    })).mutation(async ({ input }) => {
      await updateCatalogoPedidoStatusComMotivo(input.pedidoId, input.status, input.motivoRecusa);
      return { ok: true };
    }),
    // ─── Pública: visualizar catálogo por token (sem auth) ───
    viewByToken: publicProcedure.input(z2.object({ token: z2.string() })).query(async ({ input }) => {
      const catalogo = await getCatalogoVendaByToken(input.token);
      if (!catalogo) return { found: false, expired: false, catalogo: null };
      const expired = catalogo.expiresAt < /* @__PURE__ */ new Date() || catalogo.ativo === 0;
      if (expired) return { found: true, expired: true, catalogo: null };
      const itens = await listCatalogoItens(catalogo.id);
      return { found: true, expired: false, catalogo: { ...catalogo, itens } };
    }),
    // ─── Pública: enviar pedido pelo link do catálogo (sem auth) ───
    converterEmVenda: protectedProcedure.input(z2.object({
      pedidoId: z2.number()
    })).mutation(async ({ input }) => {
      const pedido = await getCatalogoPedidoById(input.pedidoId);
      if (!pedido) throw new Error("Pedido n\xE3o encontrado");
      if (pedido.vendaId) throw new Error(`Este pedido j\xE1 foi convertido na Venda #${pedido.vendaId}`);
      const hoje = /* @__PURE__ */ new Date();
      const dataFormatada = hoje.toISOString().split("T")[0];
      const total = pedido.itens.reduce((s, i) => s + Number(i.subtotal || 0), 0);
      const vendaId = await createVenda({
        clienteNome: pedido.clienteNome,
        data: dataFormatada,
        status: "AGUARDANDO",
        total: total.toFixed(2)
      }, pedido.itens.map((i) => ({
        produtoId: null,
        produtoNome: i.nome,
        quantidade: String(i.quantidade),
        valorUnitario: i.preco ? String(i.preco) : "0",
        subtotal: i.subtotal ? String(i.subtotal) : "0",
        observacao: `Tel: ${pedido.clienteTelefone} | Entrega: ${pedido.dataEntrega}`
      })));
      await updateCatalogoPedidoStatus(input.pedidoId, "APROVADO", vendaId ?? void 0);
      return { vendaId };
    }),
    enviarPedido: publicProcedure.input(z2.object({
      token: z2.string(),
      clienteNome: z2.string().min(1),
      clienteTelefone: z2.string().min(1),
      dataEntrega: z2.string().min(1),
      observacao: z2.string().optional(),
      itens: z2.array(z2.object({
        catalogoItemId: z2.number(),
        nome: z2.string(),
        preco: z2.number().optional(),
        quantidade: z2.number().min(1),
        subtotal: z2.number().optional()
      }))
    })).mutation(async ({ input }) => {
      const catalogo = await getCatalogoVendaByToken(input.token);
      if (!catalogo) throw new Error("Cat\xE1logo n\xE3o encontrado");
      if (catalogo.expiresAt < /* @__PURE__ */ new Date() || catalogo.ativo === 0) throw new Error("Cat\xE1logo expirado ou inativo");
      if (!input.itens.length) throw new Error("Selecione ao menos um produto");
      const pedidoId = await createCatalogoPedido(
        {
          catalogoId: catalogo.id,
          clienteNome: input.clienteNome,
          clienteTelefone: input.clienteTelefone,
          dataEntrega: input.dataEntrega,
          observacao: input.observacao || null
        },
        input.itens.map((i) => ({
          pedidoId: 0,
          // será sobrescrito no helper
          catalogoItemId: i.catalogoItemId,
          nome: i.nome,
          preco: i.preco != null ? String(i.preco) : null,
          quantidade: i.quantidade,
          subtotal: i.subtotal != null ? String(i.subtotal) : null
        }))
      );
      const totalItens = input.itens.reduce((s, i) => s + i.quantidade, 0);
      const totalValor = input.itens.reduce((s, i) => s + (i.preco || 0) * i.quantidade, 0);
      const listaItens = input.itens.map((i) => `\u2022 ${i.quantidade}x ${i.nome}${i.preco ? ` (R$ ${(i.preco * i.quantidade).toFixed(2)})` : ""}`).join("\n");
      notifyOwner({
        title: `\u{1F6D2} Novo pedido do cat\xE1logo: ${catalogo.titulo}`,
        content: `Cliente: ${input.clienteNome}
Telefone: ${input.clienteTelefone}
Entrega: ${input.dataEntrega}

Itens (${totalItens}):
${listaItens}

Total: R$ ${totalValor.toFixed(2)}${input.observacao ? `

Obs: ${input.observacao}` : ""}`
      }).catch(() => {
      });
      return { ok: true, pedidoId };
    })
  }),
  // ─── Catálogo Unificado ───
  catalogoUnificado: router({
    listGrupos: protectedProcedure.input(z2.object({
      origem: z2.enum(["todos", "veiling", "cooperflora"]).default("todos")
    })).query(async ({ input }) => {
      const grupos = /* @__PURE__ */ new Set();
      if (input.origem === "todos" || input.origem === "cooperflora") {
        const cfProdutos = await listCooperfloraProdutos({});
        for (const p of cfProdutos) {
          if (p.grupo) grupos.add(p.grupo.trim());
        }
      }
      if (input.origem === "todos" || input.origem === "veiling") {
        const veilResult = await listVeilingProdutos({ limit: 5e3, offset: 0 });
        for (const p of veilResult.items) {
          if (p.categoria) grupos.add(p.categoria.trim());
        }
      }
      return Array.from(grupos).sort((a, b) => a.localeCompare(b));
    }),
    listProdutos: protectedProcedure.input(z2.object({
      busca: z2.string().optional(),
      origem: z2.enum(["todos", "veiling", "cooperflora"]).default("todos"),
      qualidade: z2.string().optional(),
      grupo: z2.string().optional(),
      limit: z2.number().default(200),
      offset: z2.number().default(0)
    })).query(async ({ input }) => {
      const [cfConfig, veilConfig] = await Promise.all([
        getCooperfloraConfig(),
        getVeilingConfig()
      ]);
      const cfMargemPadrao = parseFloat(String(cfConfig?.margemPadrao || "30"));
      const veilMargemGlobal = parseFloat(String(veilConfig?.margemGlobal || "30"));
      const resultados = [];
      if (input.origem === "todos" || input.origem === "cooperflora") {
        const cfProdutos = await listCooperfloraProdutos({
          nome: input.busca,
          qualidade: input.qualidade
        });
        for (const p of cfProdutos) {
          if (input.grupo && (p.grupo || "").trim() !== input.grupo) continue;
          const margem = await getMargemEfetiva(p.grupo || "", p.margemCustom, cfMargemPadrao);
          const precoMin = parseFloat(String(p.precoMin)) || 0;
          const hastes = p.hastes || 1;
          const hastesEmb = p.hastesEmbalagem || hastes;
          const precoVenda = precoMin > 0 ? Math.round(precoMin * (1 + margem / 100) * hastesEmb * 100) / 100 : 0;
          resultados.push({
            id: `cf-${p.id}`,
            origem: "Cooperflora",
            nome: p.nome,
            qualidade: p.qualidade || "",
            estoque: p.estoque,
            precoCompra: precoMin,
            precoVenda,
            margem,
            imagemUrl: p.imagemUrl || null,
            grupo: p.grupo || "",
            dimensao: "",
            hastes,
            hastesEmbalagem: hastesEmb,
            codigo: p.codigo
          });
        }
      }
      if (input.origem === "todos" || input.origem === "veiling") {
        const veilResult = await listVeilingProdutos({
          busca: input.busca,
          limit: 5e3,
          offset: 0
        });
        const veilProdutos = veilResult.items;
        for (const p of veilProdutos) {
          if (input.qualidade && p.qualidade !== input.qualidade) continue;
          if (input.grupo && (p.categoria || "").trim() !== input.grupo) continue;
          const margem = await getVeilingMargemEfetiva(p.categoria || "", veilMargemGlobal);
          const _emb2 = p.precoEmbalagem != null ? Number(p.precoEmbalagem) : 0;
          const _cam2 = p.precoCamada != null ? Number(p.precoCamada) : 0;
          const _car2 = p.precoCarrinho != null ? Number(p.precoCarrinho) : 0;
          const custoBaseVal = _emb2 > 0 ? _emb2 : _cam2 > 0 ? _cam2 : _car2;
          const freteUnit = p.frete != null ? Number(p.frete) : 0;
          const custoComFrete = custoBaseVal + freteUnit;
          const icmsFator = p.icms != null ? Number(p.icms) : null;
          const custoFinal = icmsFator && icmsFator > 0 && icmsFator < 1 ? custoComFrete / icmsFator : custoComFrete;
          const valorIcmsUnit = icmsFator && icmsFator > 0 && icmsFator < 1 ? Math.round((custoFinal - custoComFrete) * 100) / 100 : 0;
          const qtdVenda = Number(p.qtdVenda) || Number(p.multiplo) || 1;
          const precoVenda = custoFinal > 0 ? Math.round(custoFinal * (1 + margem / 100) * qtdVenda * 100) / 100 : 0;
          resultados.push({
            id: `vl-${p.id}`,
            origem: "Veiling",
            nome: p.nome,
            qualidade: p.qualidade || "",
            estoque: p.estoqueDisponivel,
            precoCompra: Math.round(custoFinal * 100) / 100,
            precoVenda,
            margem,
            imagemUrl: p.imagemUrl || null,
            grupo: p.categoria || "",
            dimensao: p.dimensao || "",
            hastes: qtdVenda,
            hastesEmbalagem: qtdVenda,
            codigo: String(p.offerId || p.id),
            freteUnit,
            valorIcmsUnit,
            custoFinal: Math.round(custoFinal * 100) / 100
          });
        }
      }
      resultados.sort((a, b) => a.nome.localeCompare(b.nome));
      const total = resultados.length;
      const paginated = resultados.slice(input.offset, input.offset + input.limit);
      return { items: paginated, total };
    })
  }),
  // ─── Dashboard ────────────────────────────────────────────────────────────
  dashboard: router({
    resumo: protectedProcedure.query(async () => {
      const dbConn = await getDb();
      if (!dbConn) return null;
      const hoje = /* @__PURE__ */ new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioMesStr = `${String(inicioMes.getDate()).padStart(2, "0")}/${String(inicioMes.getMonth() + 1).padStart(2, "0")}/${inicioMes.getFullYear()}`;
      const fimMesStr = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
      const vendasMes = await dbConn.select().from(vendas).where(
        and2(isNull2(vendas.deletedAt), sql2`${vendas.data} >= ${inicioMesStr}`, sql2`${vendas.data} <= ${fimMesStr}`)
      );
      const faturamentoMes = vendasMes.reduce((s, v) => s + Number(v.total || 0), 0);
      const pedidosNovos = await dbConn.select({ count: sql2`COUNT(*)` }).from(catalogosPedidos).where(eq2(catalogosPedidos.status, "NOVO"));
      const qtdPedidosNovos = Number(pedidosNovos[0]?.count || 0);
      const catalogosAtivos = await dbConn.select({ count: sql2`COUNT(*)` }).from(catalogosVenda).where(
        and2(eq2(catalogosVenda.ativo, 1), sql2`${catalogosVenda.expiresAt} > NOW()`)
      );
      const qtdCatalogosAtivos = Number(catalogosAtivos[0]?.count || 0);
      const todosProdutos = await calcularEstoqueTodos();
      const qtdProdutosEstoque = todosProdutos.filter((p) => Number(p.saldo) > 0).length;
      const titulosPendentes = await listTitulosPendentes();
      const valorPendente = titulosPendentes.reduce((s, t2) => s + Number(t2.valor || 0), 0);
      const todosClientes = await listClientes();
      const qtdClientes = todosClientes.length;
      const inicio30 = new Date(hoje);
      inicio30.setDate(hoje.getDate() - 29);
      const toDateStr = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      const toShortStr = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      const toDateStrISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const todasVendas = await dbConn.select().from(vendas).where(isNull2(vendas.deletedAt));
      const vendasPorDia = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(inicio30);
        d.setDate(inicio30.getDate() + i);
        vendasPorDia[toDateStr(d)] = 0;
      }
      for (const v of todasVendas) {
        if (v.data && vendasPorDia[v.data] !== void 0) {
          vendasPorDia[v.data] = (vendasPorDia[v.data] || 0) + Number(v.total || 0);
        }
      }
      const graficoVendasDia = Object.entries(vendasPorDia).map(([data, total]) => {
        const [d, m] = data.split("/");
        return { data: `${d}/${m}`, total: Math.round(Number(total) * 100) / 100 };
      });
      const meses = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        meses.push({
          label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
          inicio: toDateStr(d),
          fim: toDateStr(fim)
        });
      }
      const graficoFaturamentoMensal = meses.map((m) => {
        const total = todasVendas.filter((v) => v.data >= m.inicio && v.data <= m.fim).reduce((s, v) => s + Number(v.total || 0), 0);
        return { mes: m.label, total: Math.round(total * 100) / 100 };
      });
      const todosPedidos = await dbConn.select().from(catalogosPedidos);
      const statusCount = { NOVO: 0, VISTO: 0, APROVADO: 0, CANCELADO: 0, RECUSADO: 0 };
      for (const p of todosPedidos) {
        statusCount[p.status] = (statusCount[p.status] || 0) + 1;
      }
      const graficoPedidosStatus = Object.entries(statusCount).filter(([, v]) => v > 0).map(([status, count]) => ({
        status,
        label: status === "NOVO" ? "Novo" : status === "VISTO" ? "Visto" : status === "APROVADO" ? "Convertido" : status === "CANCELADO" ? "Cancelado" : "Recusado",
        count
      }));
      const vendasStatusMes = { AGUARDANDO: 0, APROVADO: 0, CANCELADO: 0 };
      for (const v of vendasMes) {
        vendasStatusMes[v.status] = (vendasStatusMes[v.status] || 0) + 1;
      }
      const hojeStr = toDateStr(hoje);
      const vendasHoje = todasVendas.filter((v) => v.data === hojeStr);
      const faturamentoHoje = vendasHoje.reduce((s, v) => s + Number(v.total || 0), 0);
      const ticketMedioHoje = vendasHoje.length > 0 ? faturamentoHoje / vendasHoje.length : 0;
      const vendasAbertasHoje = vendasHoje.filter((v) => v.status === "AGUARDANDO").length;
      const vendasAprovadasHoje = vendasHoje.filter((v) => v.status === "APROVADO").length;
      const vendasUlt30 = todasVendas.filter((v) => {
        const [d, m, y] = (v.data || "").split("/");
        if (!d || !m || !y) return false;
        const dt = new Date(Number(y), Number(m) - 1, Number(d));
        return dt >= inicio30 && dt <= hoje;
      });
      const clienteMap = {};
      for (const v of vendasUlt30) {
        const nome = v.clienteNome || "Sem nome";
        clienteMap[nome] = (clienteMap[nome] || 0) + Number(v.total || 0);
      }
      const topClientes = Object.entries(clienteMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([nome, total]) => ({ nome, total: Math.round(total * 100) / 100 }));
      const { vendaItens: vendaItensTable2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const idsUlt30 = vendasUlt30.map((v) => v.id);
      let topProdutos = [];
      if (idsUlt30.length > 0) {
        const itensUlt30 = await dbConn.select().from(vendaItensTable2).where(
          sql2`${vendaItensTable2.vendaId} IN (${sql2.join(idsUlt30.map((id) => sql2`${id}`), sql2`, `)})`
        );
        const prodMap = {};
        for (const it of itensUlt30) {
          const nome = it.produto || "Produto";
          if (!prodMap[nome]) prodMap[nome] = { qtd: 0, total: 0 };
          prodMap[nome].qtd += Number(it.qtd || 0);
          prodMap[nome].total += Number(it.qtd || 0) * Number(it.precoUnit || 0);
        }
        topProdutos = Object.entries(prodMap).sort((a, b) => b[1].total - a[1].total).slice(0, 5).map(([nome, v]) => ({ nome, qtd: Math.round(v.qtd * 10) / 10, total: Math.round(v.total * 100) / 100 }));
      }
      const ultimosHoje = vendasHoje.sort((a, b) => b.id - a.id).slice(0, 8).map((v) => ({ id: v.id, clienteNome: v.clienteNome || "-", total: Number(v.total || 0), status: v.status }));
      return {
        kpis: {
          faturamentoMes: Math.round(faturamentoMes * 100) / 100,
          qtdVendasMes: vendasMes.length,
          qtdPedidosNovos,
          qtdCatalogosAtivos,
          qtdProdutosEstoque,
          valorPendente: Math.round(valorPendente * 100) / 100,
          qtdClientes,
          // KPIs do dia
          faturamentoHoje: Math.round(faturamentoHoje * 100) / 100,
          qtdVendasHoje: vendasHoje.length,
          ticketMedioHoje: Math.round(ticketMedioHoje * 100) / 100,
          vendasAbertasHoje,
          vendasAprovadasHoje
        },
        graficoVendasDia,
        graficoFaturamentoMensal,
        graficoPedidosStatus,
        vendasStatusMes,
        topClientes,
        topProdutos,
        ultimosHoje
      };
    })
  }),
  // ─── Vendas Efetivas ───
  vendasEfetivas: router({
    // Listar todas as vendas efetivas
    list: protectedProcedure.input(z2.object({
      status: z2.enum(["PENDENTE", "ENTREGUE", "CANCELADA", "todos"]).default("todos"),
      search: z2.string().optional()
    }).optional()).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      let query = dbConn.select().from(vendasEfetivas).$dynamic();
      const conditions = [];
      if (input?.status && input.status !== "todos") {
        conditions.push(eq2(vendasEfetivas.status, input.status));
      }
      if (conditions.length > 0) {
        query = query.where(and2(...conditions));
      }
      const rows = await query.orderBy(sql2`${vendasEfetivas.createdAt} DESC`);
      return rows;
    }),
    // Converter orçamento em venda efetiva
    converter: protectedProcedure.input(z2.object({
      orcamentoId: z2.number(),
      dataEntrega: z2.string().optional(),
      formaPagamento: z2.string().optional(),
      observacao: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const orcamento = await getVenda(input.orcamentoId);
      if (!orcamento) throw new Error("Or\xE7amento n\xE3o encontrado");
      if (orcamento.status !== "APROVADO") throw new Error("Apenas or\xE7amentos com status APROVADO podem ser convertidos em venda efetiva");
      const jaConvertido = await dbConn.select().from(vendasEfetivas).where(eq2(vendasEfetivas.orcamentoId, input.orcamentoId)).limit(1);
      if (jaConvertido.length > 0) throw new Error(`Este or\xE7amento j\xE1 foi convertido em Venda Efetiva #${jaConvertido[0].id}`);
      const hoje = /* @__PURE__ */ new Date();
      const dataVenda = hoje.toLocaleDateString("pt-BR");
      const orcamentoItens = await getVendaItens(input.orcamentoId);
      const itensSnapshot = (orcamentoItens || []).map((item) => ({
        produtoNome: item.produtoNome,
        quantidade: Number(item.quantidade),
        valorUnitario: Number(item.valorUnitario),
        subtotal: Number(item.subtotal),
        observacao: item.observacao || void 0
      }));
      const [result] = await dbConn.insert(vendasEfetivas).values({
        orcamentoId: input.orcamentoId,
        orcamentoNum: `#${String(input.orcamentoId).padStart(6, "0")}`,
        clienteId: orcamento.clienteId ?? void 0,
        clienteNome: orcamento.clienteNome ?? "",
        vendedorId: orcamento.vendedorId ?? void 0,
        vendedorNome: orcamento.vendedorNome ?? "",
        total: orcamento.total,
        dataVenda,
        dataEntrega: input.dataEntrega ?? orcamento.dataEntrega ?? void 0,
        formaPagamento: input.formaPagamento ?? void 0,
        observacao: input.observacao ?? void 0,
        status: "PENDENTE",
        convertidoPor: ctx.user.name ?? ctx.user.openId,
        itensSnapshot: itensSnapshot.length > 0 ? itensSnapshot : void 0
      });
      await dbConn.update(vendas).set({ faturado: 1, faturadoPor: ctx.user.name ?? ctx.user.openId, faturadoEm: /* @__PURE__ */ new Date() }).where(eq2(vendas.id, input.orcamentoId));
      return { ok: true, vendaEfetivaId: result.insertId };
    }),
    // Atualizar status da venda efetiva
    updateStatus: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["PENDENTE", "ENTREGUE", "CANCELADA"])
    })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      await dbConn.update(vendasEfetivas).set({ status: input.status }).where(eq2(vendasEfetivas.id, input.id));
      return { ok: true };
    }),
    // Verificar se orçamento já foi convertido
    verificarConversao: protectedProcedure.input(z2.object({
      orcamentoId: z2.number()
    })).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const rows = await dbConn.select().from(vendasEfetivas).where(eq2(vendasEfetivas.orcamentoId, input.orcamentoId)).limit(1);
      return rows.length > 0 ? rows[0] : null;
    }),
    // Sincronizar pedidos faturados que ainda não foram convertidos em Venda Efetiva
    sincronizarFaturados: protectedProcedure.mutation(async ({ ctx }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { vendasEfetivas: veTable, vendas: vendasTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, isNotNull: isNotNull2 } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const jaConvertidos = await dbConn.select({ orcamentoId: veTable.orcamentoId }).from(veTable);
      const idsConvertidos = jaConvertidos.map((r) => r.orcamentoId).filter(Boolean);
      const faturados = await dbConn.select().from(vendasTable).where(eqFn(vendasTable.faturado, 1));
      const semConversao = faturados.filter((v) => !idsConvertidos.includes(v.id) && !v.deletedAt);
      if (semConversao.length === 0) {
        return { sincronizados: 0, mensagem: "Todos os pedidos faturados j\xE1 est\xE3o em Vendas Efetivas." };
      }
      const hoje = /* @__PURE__ */ new Date();
      const dataVenda = hoje.toLocaleDateString("pt-BR");
      let sincronizados = 0;
      for (const venda of semConversao) {
        await dbConn.insert(veTable).values({
          orcamentoId: venda.id,
          orcamentoNum: `#${String(venda.id).padStart(6, "0")}`,
          clienteId: venda.clienteId ?? void 0,
          clienteNome: venda.clienteNome ?? "",
          vendedorId: venda.vendedorId ?? void 0,
          vendedorNome: venda.vendedorNome ?? "",
          total: venda.total,
          dataVenda,
          dataEntrega: venda.dataEntrega ?? void 0,
          status: "PENDENTE",
          convertidoPor: ctx.user.name ?? ctx.user.openId
        });
        sincronizados++;
      }
      return { sincronizados, mensagem: `${sincronizados} pedido(s) adicionado(s) em Vendas Efetivas.` };
    })
  }),
  // ─── Lembretes ───
  lembretes: router({
    // Listar lembretes do usuário logado
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { lembretes: lembretesTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, and: andFn, ne } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) return [];
      return dbConn.select().from(lembretesTable).where(andFn(eqFn(lembretesTable.userId, ctx.user.openId), ne(lembretesTable.status, "CANCELADO"))).orderBy(lembretesTable.dataHora);
    }),
    // Criar novo lembrete
    create: protectedProcedure.input(z2.object({
      titulo: z2.string().min(1).max(255),
      descricao: z2.string().optional(),
      dataHora: z2.number(),
      // UTC ms
      recorrencia: z2.enum(["NENHUMA", "DIARIA", "SEMANAL", "MENSAL"]).default("NENHUMA"),
      prioridade: z2.enum(["BAIXA", "MEDIA", "ALTA"]).default("MEDIA"),
      vinculoOrcamentoId: z2.number().optional(),
      vinculoOrcamentoNum: z2.string().optional(),
      vinculoClienteNome: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { lembretes: lembretesTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const [result] = await dbConn.insert(lembretesTable).values({
        userId: ctx.user.openId,
        userName: ctx.user.name || ctx.user.email || "Usu\xE1rio",
        titulo: input.titulo,
        descricao: input.descricao,
        dataHora: input.dataHora,
        recorrencia: input.recorrencia,
        prioridade: input.prioridade,
        status: "PENDENTE",
        vinculoOrcamentoId: input.vinculoOrcamentoId,
        vinculoOrcamentoNum: input.vinculoOrcamentoNum,
        vinculoClienteNome: input.vinculoClienteNome
      });
      return { id: result.insertId };
    }),
    // Atualizar lembrete
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      titulo: z2.string().min(1).max(255).optional(),
      descricao: z2.string().optional().nullable(),
      dataHora: z2.number().optional(),
      recorrencia: z2.enum(["NENHUMA", "DIARIA", "SEMANAL", "MENSAL"]).optional(),
      prioridade: z2.enum(["BAIXA", "MEDIA", "ALTA"]).optional(),
      status: z2.enum(["PENDENTE", "DISPARADO", "LIDO", "CANCELADO"]).optional(),
      vinculoOrcamentoId: z2.number().optional().nullable(),
      vinculoOrcamentoNum: z2.string().optional().nullable(),
      vinculoClienteNome: z2.string().optional().nullable()
    })).mutation(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { lembretes: lembretesTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, and: andFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const { id, ...data } = input;
      await dbConn.update(lembretesTable).set(data).where(andFn(eqFn(lembretesTable.id, id), eqFn(lembretesTable.userId, ctx.user.openId)));
      return { ok: true };
    }),
    // Deletar (cancelar) lembrete
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { lembretes: lembretesTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, and: andFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      await dbConn.update(lembretesTable).set({ status: "CANCELADO" }).where(andFn(eqFn(lembretesTable.id, input.id), eqFn(lembretesTable.userId, ctx.user.openId)));
      return { ok: true };
    }),
    // Marcar como lido
    marcarLido: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { lembretes: lembretesTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, and: andFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      await dbConn.update(lembretesTable).set({ status: "LIDO" }).where(andFn(eqFn(lembretesTable.id, input.id), eqFn(lembretesTable.userId, ctx.user.openId)));
      return { ok: true };
    }),
    // Polling: buscar lembretes que devem ser disparados agora (para o agente frontend)
    // Retorna lembretes PENDENTES cujo dataHora <= agora + 1 min de margem
    // Após retornar, marca como DISPARADO e agenda próxima ocorrência se recorrente
    pollPendentes: protectedProcedure.query(async ({ ctx }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { lembretes: lembretesTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, and: andFn, lte } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) return [];
      const agora = Date.now();
      const margem = agora + 6e4;
      const pendentes = await dbConn.select().from(lembretesTable).where(andFn(
        eqFn(lembretesTable.userId, ctx.user.openId),
        eqFn(lembretesTable.status, "PENDENTE"),
        lte(lembretesTable.dataHora, margem)
      ));
      for (const l of pendentes) {
        let proxDataHora = null;
        if (l.recorrencia !== "NENHUMA") {
          const base = l.dataHora;
          if (l.recorrencia === "DIARIA") proxDataHora = base + 864e5;
          else if (l.recorrencia === "SEMANAL") proxDataHora = base + 7 * 864e5;
          else if (l.recorrencia === "MENSAL") {
            const d = new Date(base);
            d.setMonth(d.getMonth() + 1);
            proxDataHora = d.getTime();
          }
        }
        await dbConn.update(lembretesTable).set({ status: "DISPARADO", notificadoEm: agora }).where(eqFn(lembretesTable.id, l.id));
        if (proxDataHora) {
          await dbConn.insert(lembretesTable).values({
            userId: l.userId,
            userName: l.userName,
            titulo: l.titulo,
            descricao: l.descricao,
            dataHora: proxDataHora,
            recorrencia: l.recorrencia,
            prioridade: l.prioridade,
            status: "PENDENTE"
          });
        }
      }
      return pendentes;
    })
  }),
  // ─── Controle de Caixa ───
  caixa: router({
    // Retorna o caixa ABERTO do dia (com movimentos)
    getAtual: protectedProcedure.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { caixas: caixas2, caixaMovimentos: caixaMovimentos2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) return null;
      const [caixaAberto] = await dbConn.select().from(caixas2).where(eqFn(caixas2.status, "ABERTO")).limit(1);
      if (!caixaAberto) return null;
      const movimentos = await dbConn.select().from(caixaMovimentos2).where(eqFn(caixaMovimentos2.caixaId, caixaAberto.id));
      return { ...caixaAberto, movimentos };
    }),
    // Abrir caixa com saldo inicial
    abrir: protectedProcedure.input(z2.object({
      saldoInicial: z2.number().min(0).default(0),
      observacao: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { caixas: caixas2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const [jaAberto] = await dbConn.select().from(caixas2).where(eqFn(caixas2.status, "ABERTO")).limit(1);
      if (jaAberto) throw new Error("J\xE1 existe um caixa aberto. Feche-o antes de abrir um novo.");
      const hoje = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const [result] = await dbConn.insert(caixas2).values({
        data: hoje,
        saldoInicial: String(input.saldoInicial),
        totalEntradas: "0.00",
        totalSaidas: "0.00",
        status: "ABERTO",
        abertoPor: ctx.user.name || ctx.user.openId,
        observacao: input.observacao
      });
      return { id: result.insertId, ok: true };
    }),
    // Fechar caixa
    fechar: protectedProcedure.input(z2.object({
      observacao: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { caixas: caixas2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const [caixaAberto] = await dbConn.select().from(caixas2).where(eqFn(caixas2.status, "ABERTO")).limit(1);
      if (!caixaAberto) throw new Error("Nenhum caixa aberto encontrado.");
      const saldoInicial = Number(caixaAberto.saldoInicial);
      const totalEntradas = Number(caixaAberto.totalEntradas);
      const totalSaidas = Number(caixaAberto.totalSaidas);
      const saldoFinal = saldoInicial + totalEntradas - totalSaidas;
      await dbConn.update(caixas2).set({
        status: "FECHADO",
        saldoFinal: String(saldoFinal.toFixed(2)),
        fechadoPor: ctx.user.name || ctx.user.openId,
        fechadoEm: /* @__PURE__ */ new Date(),
        observacao: input.observacao || caixaAberto.observacao
      }).where(eqFn(caixas2.id, caixaAberto.id));
      return { ok: true, saldoFinal };
    }),
    // Lançar movimento (entrada ou saída manual)
    lancar: protectedProcedure.input(z2.object({
      tipo: z2.enum(["ENTRADA", "SAIDA"]),
      categoria: z2.string().min(1),
      descricao: z2.string().optional(),
      valor: z2.number().positive(),
      formaPagamento: z2.string().optional(),
      vendaId: z2.number().optional(),
      vendaNum: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { caixas: caixas2, caixaMovimentos: caixaMovimentos2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, sql: sqlFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const [caixaAberto] = await dbConn.select().from(caixas2).where(eqFn(caixas2.status, "ABERTO")).limit(1);
      if (!caixaAberto) throw new Error("Nenhum caixa aberto. Abra o caixa antes de lan\xE7ar.");
      await dbConn.insert(caixaMovimentos2).values({
        caixaId: caixaAberto.id,
        tipo: input.tipo,
        categoria: input.categoria,
        descricao: input.descricao,
        valor: String(input.valor.toFixed(2)),
        formaPagamento: input.formaPagamento,
        vendaId: input.vendaId,
        vendaNum: input.vendaNum,
        lancadoPor: ctx.user.name || ctx.user.openId
      });
      if (input.tipo === "ENTRADA") {
        await dbConn.update(caixas2).set({ totalEntradas: sqlFn`totalEntradas + ${input.valor}` }).where(eqFn(caixas2.id, caixaAberto.id));
      } else {
        await dbConn.update(caixas2).set({ totalSaidas: sqlFn`totalSaidas + ${input.valor}` }).where(eqFn(caixas2.id, caixaAberto.id));
      }
      return { ok: true };
    }),
    // Excluir movimento
    excluirMovimento: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { caixas: caixas2, caixaMovimentos: caixaMovimentos2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, sql: sqlFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const [mov] = await dbConn.select().from(caixaMovimentos2).where(eqFn(caixaMovimentos2.id, input.id)).limit(1);
      if (!mov) throw new Error("Movimento n\xE3o encontrado.");
      if (mov.tipo === "ENTRADA") {
        await dbConn.update(caixas2).set({ totalEntradas: sqlFn`GREATEST(0, totalEntradas - ${Number(mov.valor)})` }).where(eqFn(caixas2.id, mov.caixaId));
      } else {
        await dbConn.update(caixas2).set({ totalSaidas: sqlFn`GREATEST(0, totalSaidas - ${Number(mov.valor)})` }).where(eqFn(caixas2.id, mov.caixaId));
      }
      await dbConn.delete(caixaMovimentos2).where(eqFn(caixaMovimentos2.id, input.id));
      return { ok: true };
    }),
    // Relatório por período
    relatorio: protectedProcedure.input(z2.object({
      dataInicio: z2.string(),
      // YYYY-MM-DD
      dataFim: z2.string()
      // YYYY-MM-DD
    })).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { caixas: caixas2, caixaMovimentos: caixaMovimentos2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, and: andFn, gte, lte, inArray: inArray3 } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) return { caixas: [], totalEntradas: 0, totalSaidas: 0, saldoFinal: 0 };
      const caixasPeriodo = await dbConn.select().from(caixas2).where(andFn(gte(caixas2.data, input.dataInicio), lte(caixas2.data, input.dataFim))).orderBy(caixas2.data);
      if (caixasPeriodo.length === 0) return { caixas: [], totalEntradas: 0, totalSaidas: 0, saldoFinal: 0 };
      const caixaIds = caixasPeriodo.map((c) => c.id);
      const movimentos = await dbConn.select().from(caixaMovimentos2).where(inArray3(caixaMovimentos2.caixaId, caixaIds));
      const totalEntradas = movimentos.filter((m) => m.tipo === "ENTRADA").reduce((s, m) => s + Number(m.valor), 0);
      const totalSaidas = movimentos.filter((m) => m.tipo === "SAIDA").reduce((s, m) => s + Number(m.valor), 0);
      const saldoInicial = caixasPeriodo.reduce((s, c) => s + Number(c.saldoInicial), 0);
      const saldoFinal = saldoInicial + totalEntradas - totalSaidas;
      return {
        caixas: caixasPeriodo.map((c) => ({
          ...c,
          movimentos: movimentos.filter((m) => m.caixaId === c.id)
        })),
        totalEntradas,
        totalSaidas,
        saldoFinal
      };
    }),
    // Histórico de caixas fechados (paginado)
    historico: protectedProcedure.input(z2.object({
      page: z2.number().min(1).default(1),
      limit: z2.number().min(1).max(50).default(20)
    })).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { caixas: caixas2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, desc: desc2 } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) return { items: [], total: 0 };
      const offset = (input.page - 1) * input.limit;
      const items = await dbConn.select().from(caixas2).where(eqFn(caixas2.status, "FECHADO")).orderBy(desc2(caixas2.data)).limit(input.limit).offset(offset);
      return { items, total: items.length };
    }),
    // Sincronizar pedidos faturados que ainda não têm lançamento no caixa
    sincronizarFaturados: protectedProcedure.mutation(async ({ ctx }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { caixas: caixas2, caixaMovimentos: caixaMovimentos2, vendas: vendasTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, isNotNull: isNotNull2, sql: sqlFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const [caixaAberto] = await dbConn.select().from(caixas2).where(eqFn(caixas2.status, "ABERTO")).limit(1);
      if (!caixaAberto) throw new Error("N\xE3o h\xE1 caixa aberto. Abra o caixa antes de sincronizar.");
      const movExistentes = await dbConn.select({ vendaId: caixaMovimentos2.vendaId }).from(caixaMovimentos2).where(isNotNull2(caixaMovimentos2.vendaId));
      const idsComMovimento = movExistentes.map((m) => m.vendaId).filter(Boolean);
      let query = dbConn.select().from(vendasTable).where(eqFn(vendasTable.faturado, 1));
      const faturados = await query;
      const semLancamento = faturados.filter((v) => !idsComMovimento.includes(v.id) && !v.deletedAt);
      if (semLancamento.length === 0) return { sincronizados: 0, mensagem: "Todos os pedidos faturados j\xE1 est\xE3o no caixa." };
      let totalSincronizado = 0;
      let totalValor = 0;
      for (const venda of semLancamento) {
        const valor = Number(venda.total) || 0;
        if (valor <= 0) continue;
        await dbConn.insert(caixaMovimentos2).values({
          caixaId: caixaAberto.id,
          tipo: "ENTRADA",
          categoria: "VENDA",
          descricao: `Venda #${String(venda.id).padStart(6, "0")} - ${venda.clienteNome || "Cliente"} (sincronizado)`,
          valor: String(valor.toFixed(2)),
          formaPagamento: "N\xE3o informado",
          vendaId: venda.id,
          vendaNum: `#${String(venda.id).padStart(6, "0")}`,
          lancadoPor: ctx.user.name || ctx.user.openId
        });
        totalValor += valor;
        totalSincronizado++;
      }
      if (totalSincronizado > 0) {
        await dbConn.update(caixas2).set({ totalEntradas: sqlFn`totalEntradas + ${totalValor}` }).where(eqFn(caixas2.id, caixaAberto.id));
      }
      return { sincronizados: totalSincronizado, totalValor, mensagem: `${totalSincronizado} pedido(s) sincronizado(s) no caixa.` };
    })
  }),
  // ─── Anotações por Usuário ───
  anotacoes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { anotacoes: anotacoes2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, desc: desc2 } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) return [];
      return dbConn.select().from(anotacoes2).where(eqFn(anotacoes2.userId, ctx.user.openId)).orderBy(desc2(anotacoes2.fixada), desc2(anotacoes2.updatedAt));
    }),
    create: protectedProcedure.input(z2.object({
      titulo: z2.string().min(1).max(255).default("Nova anota\xE7\xE3o"),
      conteudo: z2.string().default(""),
      cor: z2.enum(["yellow", "blue", "green", "pink", "purple"]).default("yellow")
    })).mutation(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { anotacoes: anotacoes2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const [result] = await dbConn.insert(anotacoes2).values({
        userId: ctx.user.openId,
        titulo: input.titulo,
        conteudo: input.conteudo,
        cor: input.cor
      });
      const [nova] = await dbConn.select().from(anotacoes2).where(
        (await import("drizzle-orm")).eq(anotacoes2.id, result.insertId)
      );
      return nova;
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      titulo: z2.string().min(1).max(255).optional(),
      conteudo: z2.string().optional(),
      cor: z2.enum(["yellow", "blue", "green", "pink", "purple"]).optional(),
      fixada: z2.boolean().optional(),
      ativa: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { anotacoes: anotacoes2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, and: andFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const updates = {};
      if (input.titulo !== void 0) updates.titulo = input.titulo;
      if (input.conteudo !== void 0) updates.conteudo = input.conteudo;
      if (input.cor !== void 0) updates.cor = input.cor;
      if (input.fixada !== void 0) updates.fixada = input.fixada ? 1 : 0;
      if (input.ativa !== void 0) updates.ativa = input.ativa ? 1 : 0;
      await dbConn.update(anotacoes2).set(updates).where(andFn(eqFn(anotacoes2.id, input.id), eqFn(anotacoes2.userId, ctx.user.openId)));
      return { ok: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ ctx, input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { anotacoes: anotacoes2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, and: andFn } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      await dbConn.delete(anotacoes2).where(andFn(eqFn(anotacoes2.id, input.id), eqFn(anotacoes2.userId, ctx.user.openId)));
      return { ok: true };
    })
  }),
  // ─── Relatório Financeiro por Cliente ───
  relatorioFinanceiro: router({
    // Lista clientes com movimento financeiro
    listarClientes: protectedProcedure.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { clientes: clientes2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { isNull: isNull3, asc: asc2 } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) return [];
      return dbConn.select({ id: clientes2.id, nome: clientes2.nome, telefone: clientes2.telefone, email: clientes2.email }).from(clientes2).where(isNull3(clientes2.deletedAt)).orderBy(asc2(clientes2.nome));
    }),
    // Relatório completo de um cliente com filtros
    getRelatorio: protectedProcedure.input(z2.object({
      clienteId: z2.number(),
      dataInicio: z2.string().optional(),
      // YYYY-MM-DD
      dataFim: z2.string().optional(),
      // YYYY-MM-DD
      statusTitulo: z2.enum(["TODOS", "PENDENTE", "PAGO", "VENCIDO", "CANCELADO"]).default("TODOS")
    })).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { clientes: clientes2, vendas: vendas2, titulos: titulos2, vendasEfetivas: vendasEfetivas2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, and: andFn, isNull: isNull3, gte, lte, desc: desc2, asc: asc2 } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const [cliente] = await dbConn.select().from(clientes2).where(eqFn(clientes2.id, input.clienteId));
      if (!cliente) throw new Error("Cliente n\xE3o encontrado");
      const pedidosWhere = [eqFn(vendas2.clienteId, input.clienteId), isNull3(vendas2.deletedAt)];
      if (input.dataInicio) pedidosWhere.push(gte(vendas2.data, input.dataInicio));
      if (input.dataFim) pedidosWhere.push(lte(vendas2.data, input.dataFim));
      const pedidos = await dbConn.select().from(vendas2).where(andFn(...pedidosWhere)).orderBy(desc2(vendas2.data));
      const titulosWhere = [eqFn(titulos2.clienteId, input.clienteId)];
      if (input.statusTitulo !== "TODOS") titulosWhere.push(eqFn(titulos2.status, input.statusTitulo));
      if (input.dataInicio) titulosWhere.push(gte(titulos2.dataVencimento, new Date(input.dataInicio)));
      if (input.dataFim) titulosWhere.push(lte(titulos2.dataVencimento, /* @__PURE__ */ new Date(input.dataFim + "T23:59:59")));
      const titulosList = await dbConn.select().from(titulos2).where(andFn(...titulosWhere)).orderBy(desc2(titulos2.dataVencimento));
      const veWhere = [eqFn(vendasEfetivas2.clienteId, input.clienteId)];
      if (input.dataInicio) veWhere.push(gte(vendasEfetivas2.dataVenda, input.dataInicio));
      if (input.dataFim) veWhere.push(lte(vendasEfetivas2.dataVenda, input.dataFim));
      const vendasEfetivasList = await dbConn.select().from(vendasEfetivas2).where(andFn(...veWhere)).orderBy(desc2(vendasEfetivas2.dataVenda));
      const totalPedidos = pedidos.reduce((s, p) => s + parseFloat(p.total || "0"), 0);
      const totalTitulosPago = titulosList.filter((t2) => t2.status === "PAGO").reduce((s, t2) => s + parseFloat(t2.valor || "0"), 0);
      const totalTitulosPendente = titulosList.filter((t2) => t2.status === "PENDENTE").reduce((s, t2) => s + parseFloat(t2.valor || "0"), 0);
      const totalTitulosVencido = titulosList.filter((t2) => t2.status === "VENCIDO").reduce((s, t2) => s + parseFloat(t2.valor || "0"), 0);
      const totalVendasEfetivas = vendasEfetivasList.reduce((s, v) => s + parseFloat(v.total || "0"), 0);
      const porFormaPagamento = {};
      for (const t2 of titulosList.filter((t3) => t3.status === "PAGO")) {
        const fp = t2.formaPagamentoNome || "N\xE3o informado";
        porFormaPagamento[fp] = (porFormaPagamento[fp] || 0) + parseFloat(t2.valor || "0");
      }
      return {
        cliente,
        pedidos,
        titulos: titulosList,
        vendasEfetivas: vendasEfetivasList,
        resumo: {
          totalPedidos,
          totalTitulosPago,
          totalTitulosPendente,
          totalTitulosVencido,
          totalVendasEfetivas,
          porFormaPagamento,
          qtdPedidos: pedidos.length,
          qtdTitulos: titulosList.length
        }
      };
    }),
    // Gerar token de compartilhamento
    gerarTokenCompartilhamento: protectedProcedure.input(z2.object({
      clienteId: z2.number(),
      dataInicio: z2.string().optional(),
      dataFim: z2.string().optional(),
      statusTitulo: z2.enum(["TODOS", "PENDENTE", "PAGO", "VENCIDO", "CANCELADO"]).default("TODOS"),
      expiresHours: z2.number().min(1).max(720).default(72)
    })).mutation(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { relatoriosCompartilhados: relatoriosCompartilhados2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const { randomBytes } = await import("crypto");
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + input.expiresHours * 3600 * 1e3);
      await dbConn.insert(relatoriosCompartilhados2).values({
        token,
        clienteId: input.clienteId,
        filtros: JSON.stringify({ dataInicio: input.dataInicio, dataFim: input.dataFim, statusTitulo: input.statusTitulo }),
        expiresAt
      });
      return { token };
    }),
    // Visualizar relatório via token público
    getRelatorioPublico: publicProcedure.input(z2.object({ token: z2.string() })).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { relatoriosCompartilhados: relatoriosCompartilhados2, clientes: clientes2, vendas: vendas2, titulos: titulos2, vendasEfetivas: vendasEfetivas2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eqFn, and: andFn, isNull: isNull3, gte, lte, desc: desc2 } = await import("drizzle-orm");
      const dbConn = await getDb2();
      if (!dbConn) throw new Error("DB not available");
      const [compartilhado] = await dbConn.select().from(relatoriosCompartilhados2).where(eqFn(relatoriosCompartilhados2.token, input.token));
      if (!compartilhado) throw new TRPCError3({ code: "NOT_FOUND", message: "Link inv\xE1lido ou expirado" });
      if (compartilhado.expiresAt && /* @__PURE__ */ new Date() > compartilhado.expiresAt) {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Link expirado" });
      }
      const filtros = JSON.parse(compartilhado.filtros || "{}");
      const clienteId = compartilhado.clienteId;
      const [cliente] = await dbConn.select().from(clientes2).where(eqFn(clientes2.id, clienteId));
      if (!cliente) throw new TRPCError3({ code: "NOT_FOUND", message: "Cliente n\xE3o encontrado" });
      const pedidosWhere = [eqFn(vendas2.clienteId, clienteId), isNull3(vendas2.deletedAt)];
      if (filtros.dataInicio) pedidosWhere.push(gte(vendas2.data, filtros.dataInicio));
      if (filtros.dataFim) pedidosWhere.push(lte(vendas2.data, filtros.dataFim));
      const pedidos = await dbConn.select().from(vendas2).where(andFn(...pedidosWhere)).orderBy(desc2(vendas2.data));
      const titulosWhere = [eqFn(titulos2.clienteId, clienteId)];
      if (filtros.statusTitulo && filtros.statusTitulo !== "TODOS") titulosWhere.push(eqFn(titulos2.status, filtros.statusTitulo));
      if (filtros.dataInicio) titulosWhere.push(gte(titulos2.dataVencimento, new Date(filtros.dataInicio)));
      if (filtros.dataFim) titulosWhere.push(lte(titulos2.dataVencimento, /* @__PURE__ */ new Date(filtros.dataFim + "T23:59:59")));
      const titulosList = await dbConn.select().from(titulos2).where(andFn(...titulosWhere)).orderBy(desc2(titulos2.dataVencimento));
      const veWhere = [eqFn(vendasEfetivas2.clienteId, clienteId)];
      if (filtros.dataInicio) veWhere.push(gte(vendasEfetivas2.dataVenda, filtros.dataInicio));
      if (filtros.dataFim) veWhere.push(lte(vendasEfetivas2.dataVenda, filtros.dataFim));
      const vendasEfetivasList = await dbConn.select().from(vendasEfetivas2).where(andFn(...veWhere)).orderBy(desc2(vendasEfetivas2.dataVenda));
      const totalPedidos = pedidos.reduce((s, p) => s + parseFloat(p.total || "0"), 0);
      const totalTitulosPago = titulosList.filter((t2) => t2.status === "PAGO").reduce((s, t2) => s + parseFloat(t2.valor || "0"), 0);
      const totalTitulosPendente = titulosList.filter((t2) => t2.status === "PENDENTE").reduce((s, t2) => s + parseFloat(t2.valor || "0"), 0);
      const totalTitulosVencido = titulosList.filter((t2) => t2.status === "VENCIDO").reduce((s, t2) => s + parseFloat(t2.valor || "0"), 0);
      const totalVendasEfetivas = vendasEfetivasList.reduce((s, v) => s + parseFloat(v.total || "0"), 0);
      const porFormaPagamento = {};
      for (const t2 of titulosList.filter((t3) => t3.status === "PAGO")) {
        const fp = t2.formaPagamentoNome || "N\xE3o informado";
        porFormaPagamento[fp] = (porFormaPagamento[fp] || 0) + parseFloat(t2.valor || "0");
      }
      return {
        cliente,
        pedidos,
        titulos: titulosList,
        vendasEfetivas: vendasEfetivasList,
        resumo: { totalPedidos, totalTitulosPago, totalTitulosPendente, totalTitulosVencido, totalVendasEfetivas, porFormaPagamento, qtdPedidos: pedidos.length, qtdTitulos: titulosList.length },
        filtros,
        expiresAt: compartilhado.expiresAt
      };
    })
  }),
  // ─── Enviar Orçamento para Pedido de Compra ───────────────────────────────────
  enviarPedidoCompra: router({
    // Busca prévia dos itens mesclados do orçamento (antes de enviar)
    preview: protectedProcedure.input(z2.object({ vendaId: z2.number() })).query(async ({ input }) => {
      const { vendaId } = input;
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dbConn = await getDb2();
      if (!dbConn) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "DB indispon\xEDvel" });
      const { sql: sqlFn } = await import("drizzle-orm");
      const itens = await dbConn.execute(sqlFn`
        SELECT vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.subtotal,
               COALESCE(vp.produtor, 'Outros') as produtor
        FROM venda_itens vi
        LEFT JOIN veiling_produtos vp ON vp.nome = vi.produtoNome
        WHERE vi.vendaId = ${vendaId}
        ORDER BY vi.ordem ASC
      `);
      const rows = itens[0];
      const mapa = /* @__PURE__ */ new Map();
      for (const item of rows) {
        const chave = `${item.produtoNome}||${parseFloat(item.valorUnitario)}`;
        if (mapa.has(chave)) {
          const existing = mapa.get(chave);
          existing.quantidade += parseFloat(item.quantidade);
          existing.subtotalVenda += parseFloat(item.subtotal);
        } else {
          mapa.set(chave, {
            produtoNome: item.produtoNome,
            quantidade: parseFloat(item.quantidade),
            precoVenda: parseFloat(item.valorUnitario),
            subtotalVenda: parseFloat(item.subtotal),
            produtor: item.produtor || "Outros"
          });
        }
      }
      const itensMesclados = Array.from(mapa.values()).sort(
        (a, b) => a.produtoNome.localeCompare(b.produtoNome, "pt-BR")
      );
      return { itens: itensMesclados, qtdOriginal: rows.length };
    }),
    // Enviar itens do orçamento para um pedido de compra (novo ou existente)
    enviar: protectedProcedure.input(z2.object({
      vendaId: z2.number(),
      pedidoCompraId: z2.number().optional(),
      observacoes: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const { vendaId, pedidoCompraId, observacoes } = input;
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dbConn = await getDb2();
      if (!dbConn) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "DB indispon\xEDvel" });
      const { sql: sqlFn } = await import("drizzle-orm");
      const vendaRes = await dbConn.execute(sqlFn`
        SELECT v.id, c.nome as clienteNome FROM vendas v
        LEFT JOIN clientes c ON v.clienteId = c.id WHERE v.id = ${vendaId}
      `);
      const vendaRows = vendaRes[0];
      if (!vendaRows.length) throw new TRPCError3({ code: "NOT_FOUND", message: "Or\xE7amento n\xE3o encontrado" });
      const venda = vendaRows[0];
      const itensRes = await dbConn.execute(sqlFn`
        SELECT vi.produtoId, vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.subtotal
        FROM venda_itens vi WHERE vi.vendaId = ${vendaId} ORDER BY vi.ordem ASC
      `);
      const itens = itensRes[0];
      const mapa = /* @__PURE__ */ new Map();
      for (const item of itens) {
        const chave = `${item.produtoNome}||${parseFloat(item.valorUnitario)}`;
        if (mapa.has(chave)) {
          const existing = mapa.get(chave);
          existing.quantidade += parseFloat(item.quantidade);
          existing.subtotalVenda += parseFloat(item.subtotal);
        } else {
          mapa.set(chave, {
            produtoId: item.produtoId || null,
            produtoNome: item.produtoNome,
            quantidade: parseFloat(item.quantidade),
            precoVenda: parseFloat(item.valorUnitario),
            subtotalVenda: parseFloat(item.subtotal)
          });
        }
      }
      const itensMesclados = Array.from(mapa.values()).sort(
        (a, b) => a.produtoNome.localeCompare(b.produtoNome, "pt-BR")
      );
      const totalVenda = itensMesclados.reduce((s, i) => s + i.subtotalVenda, 0);
      const dataStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      let pedidoId = pedidoCompraId;
      if (!pedidoId) {
        const obs = observacoes || `Gerado do or\xE7amento #${vendaId} - ${venda.clienteNome || "Cliente"}`;
        const solicitante = ctx.user.name || ctx.user.openId || "sistema";
        const maxNumRes = await dbConn.execute(sqlFn`SELECT COALESCE(MAX(numero), 0) as maxNum FROM pedidos_compra`);
        const maxNum = (maxNumRes[0][0]?.maxNum || 0) + 1;
        const insertRes = await dbConn.execute(sqlFn`
          INSERT INTO pedidos_compra (numero, data, solicitante, observacoes, status, total, createdAt, updatedAt)
          VALUES (${maxNum}, ${dataStr}, ${solicitante}, ${obs}, 'ABERTO', ${totalVenda}, NOW(), NOW())
        `);
        pedidoId = insertRes[0].insertId;
      } else {
        await dbConn.execute(sqlFn`
          UPDATE pedidos_compra SET total = total + ${totalVenda}, updatedAt = NOW() WHERE id = ${pedidoId}
        `);
      }
      const existentesRes = await dbConn.execute(sqlFn`
        SELECT produtoNome, precoVenda FROM pedido_compra_itens WHERE pedidoCompraId = ${pedidoId}
      `);
      const existentes = new Set(existentesRes[0].map((e) => `${e.produtoNome}||${e.precoVenda}`));
      for (const item of itensMesclados) {
        const chave = `${item.produtoNome}||${item.precoVenda}`;
        if (existentes.has(chave)) {
          await dbConn.execute(sqlFn`
            UPDATE pedido_compra_itens 
            SET quantidade = quantidade + ${item.quantidade}, 
                subtotalVenda = subtotalVenda + ${item.subtotalVenda}
            WHERE pedidoCompraId = ${pedidoId} 
            AND produtoNome = ${item.produtoNome} 
            AND precoVenda = ${item.precoVenda}
          `);
        } else {
          await dbConn.execute(sqlFn`
            INSERT INTO pedido_compra_itens (pedidoCompraId, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda, vendaOrigemId)
            VALUES (${pedidoId}, ${item.produtoId}, ${item.produtoNome}, ${item.quantidade}, ${item.precoVenda}, ${item.subtotalVenda}, ${vendaId})
          `);
          existentes.add(chave);
        }
      }
      return { pedidoId, qtdItens: itensMesclados.length, total: totalVenda };
    }),
    // Enviar múltiplos orçamentos para um único pedido de compra (em lote)
    enviarLote: protectedProcedure.input(z2.object({
      vendaIds: z2.array(z2.number()).min(1),
      pedidoCompraId: z2.number().optional(),
      observacoes: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const { vendaIds, pedidoCompraId, observacoes } = input;
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dbConn = await getDb2();
      if (!dbConn) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "DB indispon\xEDvel" });
      const { sql: sqlFn, sql: sql3 } = await import("drizzle-orm");
      const vendasRes = await dbConn.execute(sqlFn`
        SELECT v.id, v.status, v.faturado, c.nome as clienteNome FROM vendas v
        LEFT JOIN clientes c ON v.clienteId = c.id 
        WHERE v.id IN (${sql3.raw(vendaIds.join(","))})
      `);
      const vendas2 = vendasRes[0];
      if (vendas2.length !== vendaIds.length) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "Um ou mais or\xE7amentos n\xE3o encontrados" });
      }
      const naoAprovados = vendas2.filter((v) => v.status !== "APROVADO");
      if (naoAprovados.length > 0) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: `${naoAprovados.length} or\xE7amento(s) n\xE3o est\xE1(o) aprovado(s)` });
      }
      const convertidos = vendas2.filter((v) => v.faturado === 1);
      if (convertidos.length > 0) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: `${convertidos.length} or\xE7amento(s) j\xE1 foi/foram convertido(s) em venda` });
      }
      const itensRes = await dbConn.execute(sqlFn`
        SELECT vi.produtoId, vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.subtotal, vi.vendaId
        FROM venda_itens vi 
        WHERE vi.vendaId IN (${sql3.raw(vendaIds.join(","))})
        ORDER BY vi.vendaId ASC, vi.ordem ASC
      `);
      const itens = itensRes[0];
      const mapa = /* @__PURE__ */ new Map();
      for (const item of itens) {
        const chave = `${item.produtoNome}||${parseFloat(item.valorUnitario)}`;
        if (mapa.has(chave)) {
          const existing = mapa.get(chave);
          existing.quantidade += parseFloat(item.quantidade);
          existing.subtotalVenda += parseFloat(item.subtotal);
          if (!existing.vendaIds.includes(item.vendaId)) {
            existing.vendaIds.push(item.vendaId);
          }
        } else {
          mapa.set(chave, {
            produtoId: item.produtoId || null,
            produtoNome: item.produtoNome,
            quantidade: parseFloat(item.quantidade),
            precoVenda: parseFloat(item.valorUnitario),
            subtotalVenda: parseFloat(item.subtotal),
            vendaIds: [item.vendaId]
          });
        }
      }
      const itensMesclados = Array.from(mapa.values()).sort(
        (a, b) => a.produtoNome.localeCompare(b.produtoNome, "pt-BR")
      );
      const totalVenda = itensMesclados.reduce((s, i) => s + i.subtotalVenda, 0);
      const dataStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      let pedidoId = pedidoCompraId;
      if (!pedidoId) {
        const clientesStr = vendas2.map((v) => v.clienteNome).join(", ");
        const obs = observacoes || `Gerado dos or\xE7amentos #${vendaIds.join(", #")} - Clientes: ${clientesStr}`;
        const solicitante = ctx.user.name || ctx.user.openId || "sistema";
        const maxNumRes = await dbConn.execute(sqlFn`SELECT COALESCE(MAX(numero), 0) as maxNum FROM pedidos_compra`);
        const maxNum = (maxNumRes[0][0]?.maxNum || 0) + 1;
        const insertRes = await dbConn.execute(sqlFn`
          INSERT INTO pedidos_compra (numero, data, solicitante, observacoes, status, total, createdAt, updatedAt)
          VALUES (${maxNum}, ${dataStr}, ${solicitante}, ${obs}, 'ABERTO', ${totalVenda}, NOW(), NOW())
        `);
        pedidoId = insertRes[0].insertId;
      } else {
        await dbConn.execute(sqlFn`
          UPDATE pedidos_compra SET total = total + ${totalVenda}, updatedAt = NOW() WHERE id = ${pedidoId}
        `);
      }
      const existentesRes = await dbConn.execute(sqlFn`
        SELECT produtoNome, precoVenda FROM pedido_compra_itens WHERE pedidoCompraId = ${pedidoId}
      `);
      const existentes = new Set(existentesRes[0].map((e) => `${e.produtoNome}||${e.precoVenda}`));
      if (pedidoCompraId) {
        const todosItensRes = await dbConn.execute(sqlFn`
          SELECT produtoId, produtoNome, quantidade, precoVenda, subtotalVenda FROM pedido_compra_itens
          WHERE pedidoCompraId = ${pedidoId}
        `);
        const todosItensExistentes = todosItensRes[0];
        const mapaConsolidado = /* @__PURE__ */ new Map();
        for (const item of todosItensExistentes) {
          const chave = `${item.produtoNome}||${item.precoVenda}`;
          mapaConsolidado.set(chave, {
            produtoId: item.produtoId || null,
            produtoNome: item.produtoNome,
            quantidade: parseFloat(item.quantidade),
            precoVenda: parseFloat(item.precoVenda),
            subtotalVenda: parseFloat(item.subtotalVenda)
          });
        }
        for (const item of itensMesclados) {
          const chave = `${item.produtoNome}||${item.precoVenda}`;
          if (mapaConsolidado.has(chave)) {
            const existing = mapaConsolidado.get(chave);
            existing.quantidade += item.quantidade;
            existing.subtotalVenda += item.subtotalVenda;
          } else {
            mapaConsolidado.set(chave, {
              produtoId: item.produtoId,
              produtoNome: item.produtoNome,
              quantidade: item.quantidade,
              precoVenda: item.precoVenda,
              subtotalVenda: item.subtotalVenda
            });
          }
        }
        const itensConsolidados = Array.from(mapaConsolidado.values()).sort(
          (a, b) => a.produtoNome.localeCompare(b.produtoNome, "pt-BR")
        );
        await dbConn.execute(sqlFn`DELETE FROM pedido_compra_itens WHERE pedidoCompraId = ${pedidoId}`);
        for (const item of itensConsolidados) {
          await dbConn.execute(sqlFn`
            INSERT INTO pedido_compra_itens (pedidoCompraId, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda)
            VALUES (${pedidoId}, ${item.produtoId}, ${item.produtoNome}, ${item.quantidade}, ${item.precoVenda}, ${item.subtotalVenda})
          `);
        }
      } else {
        for (const item of itensMesclados) {
          const vendaOrigemId = item.vendaIds[0];
          await dbConn.execute(sqlFn`
            INSERT INTO pedido_compra_itens (pedidoCompraId, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda, vendaOrigemId)
            VALUES (${pedidoId}, ${item.produtoId}, ${item.produtoNome}, ${item.quantidade}, ${item.precoVenda}, ${item.subtotalVenda}, ${vendaOrigemId})
          `);
        }
      }
      const orcamentosOrigemIds = JSON.stringify(vendaIds);
      await dbConn.execute(sqlFn`
        UPDATE pedidos_compra SET orcamentosOrigemIds = ${orcamentosOrigemIds} WHERE id = ${pedidoId}
      `);
      return { pedidoId, qtdOrcamentos: vendaIds.length, qtdItens: itensMesclados.length, total: totalVenda };
    }),
    // Listar pedidos de compra disponíveis para adicionar itens
    listarPedidosCompra: protectedProcedure.query(async () => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dbConn = await getDb2();
      if (!dbConn) return [];
      const { sql: sqlFn } = await import("drizzle-orm");
      const res = await dbConn.execute(sqlFn`
        SELECT id, numero, data, status, total FROM pedidos_compra
        WHERE deletedAt IS NULL AND status IN ('ABERTO', 'PENDENTE', 'EM_ANDAMENTO')
        ORDER BY createdAt DESC LIMIT 20
      `);
      return res[0];
    }),
    // Verificar se uma venda já foi enviada para pedido de compra
    verificarEnviado: protectedProcedure.input(z2.object({ vendaId: z2.number() })).query(async ({ input }) => {
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dbConn = await getDb2();
      if (!dbConn) return { enviado: false, pedidoId: null };
      const { sql: sqlFn } = await import("drizzle-orm");
      const res = await dbConn.execute(sqlFn`
        SELECT pci.pedidoCompraId, pc.numero
        FROM pedido_compra_itens pci
        JOIN pedidos_compra pc ON pc.id = pci.pedidoCompraId
        WHERE pci.vendaOrigemId = ${input.vendaId} AND pc.deletedAt IS NULL
        LIMIT 1
      `);
      const rows = res[0];
      if (!rows.length) return { enviado: false, pedidoId: null, numero: null };
      return { enviado: true, pedidoId: rows[0].pedidoCompraId, numero: rows[0].numero };
    }),
    // Verificar múltiplas vendas de uma vez (para a lista)
    verificarEnviadoLote: protectedProcedure.input(z2.object({ vendaIds: z2.array(z2.number()) })).query(async ({ input }) => {
      if (!input.vendaIds.length) return {};
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dbConn = await getDb2();
      if (!dbConn) return {};
      const map = {};
      const ids = input.vendaIds.slice(0, 500);
      if (!ids.length) return map;
      try {
        const { eq: eq3, inArray: inArray3 } = await import("drizzle-orm");
        const { pedidoCompraItens: pedidoCompraItens2, pedidosCompra: pedidosCompra2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
        const results = await dbConn.select({
          vendaOrigemId: pedidoCompraItens2.vendaOrigemId,
          pedidoCompraId: pedidoCompraItens2.pedidoCompraId,
          numero: pedidosCompra2.numero
        }).from(pedidoCompraItens2).innerJoin(pedidosCompra2, eq3(pedidosCompra2.id, pedidoCompraItens2.pedidoCompraId)).where(inArray3(pedidoCompraItens2.vendaOrigemId, ids)).execute();
        for (const r of results) {
          if (r.vendaOrigemId) {
            map[r.vendaOrigemId] = { pedidoId: r.pedidoCompraId, numero: String(r.numero || "") };
          }
        }
      } catch (err) {
        console.error("[verificarEnviadoLote] Erro ao buscar pedidos:", err);
      }
      return map;
    }),
    gerarPdfLote: protectedProcedure.input(z2.object({ vendaIds: z2.array(z2.number()).min(1) })).mutation(async ({ input }) => {
      const { vendaIds } = input;
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const dbConn = await getDb2();
      if (!dbConn) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponivel" });
      const { sql: sqlFn } = await import("drizzle-orm");
      const vendasRes = await dbConn.execute(sqlFn`
        SELECT v.id, v.numero, v.data, v.status, v.total, v.clienteNome, v.vencimento
        FROM vendas v
        WHERE v.id IN (${vendaIds.join(",")})
        ORDER BY v.numero ASC
      `);
      const vendas2 = vendasRes[0];
      if (vendas2.length === 0) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "Nenhum orcamento encontrado" });
      }
      const itensRes = await dbConn.execute(sqlFn`
        SELECT vi.vendaId, vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.subtotal
        FROM venda_itens vi
        WHERE vi.vendaId IN (${vendaIds.join(",")})
        ORDER BY vi.vendaId ASC, vi.ordem ASC
      `);
      const itens = itensRes[0];
      return {
        vendas: vendas2,
        itens,
        totalOrcamentos: vendas2.length,
        totalItens: itens.length
      };
    })
  }),
  // ─── Promoções ───
  promocoes: router({
    create: protectedProcedure.input(z2.object({
      titulo: z2.string().min(1),
      descricao: z2.string().optional(),
      tipoDesconto: z2.enum(["percentual", "fixo"]),
      valorDesconto: z2.number().positive(),
      imagemUrl: z2.string().optional(),
      imagemBase64: z2.string().optional(),
      itens: z2.array(z2.object({
        produtoId: z2.string(),
        produtoNome: z2.string(),
        precoOriginal: z2.number(),
        precoPromocional: z2.number(),
        imagemUrl: z2.string().optional(),
        catalogo: z2.string().optional()
      }))
    })).mutation(async ({ input, ctx }) => {
      const id = await createPromocao({
        ...input,
        criadoPor: ctx.user?.name || "Sistema"
      });
      return { success: true, id };
    }),
    list: protectedProcedure.input(z2.object({
      ativo: z2.boolean().optional()
    })).query(async ({ input }) => {
      return getPromocoes(input.ativo);
    }),
    getById: protectedProcedure.input(z2.object({
      id: z2.number()
    })).query(async ({ input }) => {
      return getPromocaoById(input.id);
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      titulo: z2.string().optional(),
      descricao: z2.string().optional(),
      tipoDesconto: z2.enum(["percentual", "fixo"]).optional(),
      valorDesconto: z2.number().positive().optional(),
      imagemUrl: z2.string().optional(),
      imagemBase64: z2.string().optional(),
      ativo: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updatePromocao(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({
      id: z2.number()
    })).mutation(async ({ input }) => {
      await deletePromocao(input.id);
      return { success: true };
    })
  }),
  // ═══════════════════════════════════════════════════════════════
  // CATEGORIAS DE PRODUTOS
  // ═══════════════════════════════════════════════════════════════
  categoriasProdutos: router({
    list: protectedProcedure.query(async () => {
      return listCategoriasProdutos();
    }),
    create: protectedProcedure.input(z2.object({
      nome: z2.string().min(1),
      descricao: z2.string().optional(),
      ordem: z2.number().optional()
    })).mutation(async ({ input }) => {
      return createCategoriaProduto(input);
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      nome: z2.string().optional(),
      descricao: z2.string().optional(),
      ordem: z2.number().optional(),
      ativo: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCategoriaProduto(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({
      id: z2.number()
    })).mutation(async ({ input }) => {
      await deleteCategoriaProduto(input.id);
      return { success: true };
    })
  }),
  // ═══════════════════════════════════════════════════════════════
  // LISTAS DE PREÇOS
  // ═══════════════════════════════════════════════════════════════
  listasPrecos: router({
    list: protectedProcedure.query(async () => {
      return listListasPrecos();
    }),
    getById: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getListaPrecoById(input.id);
    }),
    getByToken: publicProcedure.input(z2.object({ token: z2.string() })).query(async ({ input }) => {
      return getListaPrecoByToken(input.token);
    }),
    create: protectedProcedure.input(z2.object({
      titulo: z2.string().min(1),
      subtitulo: z2.string().optional(),
      expiresAt: z2.date().optional(),
      aceitaPedidos: z2.boolean().optional(),
      observacao: z2.string().optional(),
      criadoPor: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const crypto2 = await import("crypto");
      const token = crypto2.randomBytes(24).toString("hex");
      return createListaPreco({ ...input, token, criadoPor: input.criadoPor ?? ctx.user?.name ?? "Sistema" });
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      titulo: z2.string().optional(),
      subtitulo: z2.string().optional(),
      expiresAt: z2.date().nullable().optional(),
      ativo: z2.boolean().optional(),
      aceitaPedidos: z2.boolean().optional(),
      observacao: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateListaPreco(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteListaPreco(input.id);
      return { success: true };
    }),
    // Salvar todos os itens de uma lista (substituição completa)
    saveItens: protectedProcedure.input(z2.object({
      listaId: z2.number(),
      itens: z2.array(z2.object({
        categoriaId: z2.number().optional(),
        categoriaNome: z2.string(),
        variedade: z2.string(),
        tamanho: z2.string().optional(),
        qtdHasteMaco: z2.string().optional(),
        valorUnitario: z2.number(),
        disponivel: z2.boolean().optional(),
        ordem: z2.number().optional()
      }))
    })).mutation(async ({ input }) => {
      await replaceListaItens(input.listaId, input.itens);
      return { success: true };
    }),
    addItem: protectedProcedure.input(z2.object({
      listaId: z2.number(),
      categoriaId: z2.number().optional(),
      categoriaNome: z2.string(),
      variedade: z2.string(),
      tamanho: z2.string().optional(),
      qtdHasteMaco: z2.string().optional(),
      valorUnitario: z2.number(),
      ordem: z2.number().optional()
    })).mutation(async ({ input }) => {
      return addListaItem(input);
    }),
    updateItem: protectedProcedure.input(z2.object({
      id: z2.number(),
      categoriaNome: z2.string().optional(),
      variedade: z2.string().optional(),
      tamanho: z2.string().optional(),
      qtdHasteMaco: z2.string().optional(),
      valorUnitario: z2.number().optional(),
      disponivel: z2.boolean().optional(),
      ordem: z2.number().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateListaItem(id, data);
      return { success: true };
    }),
    deleteItem: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteListaItem(input.id);
      return { success: true };
    }),
    // Receber pedido de cliente (público) — converte automaticamente em orçamento
    fazerPedido: publicProcedure.input(z2.object({
      token: z2.string(),
      clienteNome: z2.string().min(1),
      clienteTelefone: z2.string().optional(),
      observacao: z2.string().optional(),
      itens: z2.array(z2.object({
        listaItemId: z2.number(),
        categoriaNome: z2.string(),
        variedade: z2.string(),
        tamanho: z2.string().optional(),
        qtdHasteMaco: z2.string().optional(),
        valorUnitario: z2.number(),
        quantidade: z2.number().min(1)
      }))
    })).mutation(async ({ input }) => {
      const lista = await getListaPrecoByToken(input.token);
      if (!lista) throw new TRPCError3({ code: "NOT_FOUND", message: "Lista n\xE3o encontrada" });
      if (!lista.ativo) throw new TRPCError3({ code: "FORBIDDEN", message: "Esta lista n\xE3o est\xE1 mais ativa" });
      if (lista.expiresAt && new Date(lista.expiresAt) < /* @__PURE__ */ new Date()) throw new TRPCError3({ code: "FORBIDDEN", message: "Esta lista expirou" });
      if (!lista.aceitaPedidos) throw new TRPCError3({ code: "FORBIDDEN", message: "Esta lista n\xE3o aceita pedidos no momento" });
      const { id: pedidoId, total } = await criarListaPedido({
        listaId: lista.id,
        clienteNome: input.clienteNome,
        clienteTelefone: input.clienteTelefone,
        observacao: input.observacao,
        itens: input.itens
      });
      let vendaId;
      try {
        const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        const dbConn = await getDb2();
        if (dbConn) {
          const hoje = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          const itensVenda = input.itens.map((i) => ({
            produtoNome: `${i.categoriaNome} - ${i.variedade}${i.tamanho ? ` ${i.tamanho}` : ""}`,
            quantidade: String(i.quantidade),
            valorUnitario: String(i.valorUnitario),
            subtotal: String((i.valorUnitario * i.quantidade).toFixed(2)),
            observacao: i.qtdHasteMaco ? `Qtd HST/M\xC7: ${i.qtdHasteMaco}` : ""
          }));
          const [res] = await dbConn.insert(vendas).values({
            clienteNome: input.clienteNome,
            data: hoje,
            status: "AGUARDANDO",
            logistica: "RETIRADA",
            total: String(total.toFixed(2)),
            frete: "0.00",
            telefoneCliente: input.clienteTelefone,
            observacaoPedido: `Pedido via Lista de Pre\xE7os: ${lista.titulo}${input.observacao ? "\n" + input.observacao : ""}`
          });
          vendaId = res.insertId;
          if (vendaId && itensVenda.length > 0) {
            const { vendaItens: vendaItens2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
            await dbConn.insert(vendaItens2).values(itensVenda.map((item, idx) => ({
              vendaId,
              produtoNome: item.produtoNome,
              quantidade: item.quantidade,
              valorUnitario: item.valorUnitario,
              subtotal: item.subtotal,
              observacao: item.observacao,
              ordem: idx + 1
            })));
          }
          await updateListaPedidoStatus(pedidoId, "NOVO", vendaId);
        }
      } catch (err) {
        console.error("[listasPrecos.fazerPedido] Erro ao criar or\xE7amento:", err);
      }
      const itensTexto = input.itens.map(
        (i) => `\u2022 ${i.categoriaNome} - ${i.variedade}${i.tamanho ? ` ${i.tamanho}` : ""} x${i.quantidade} = R$ ${(i.valorUnitario * i.quantidade).toFixed(2)}`
      ).join("\n");
      const mensagemWpp = `\u{1F338} *NOVO PEDIDO - ${lista.titulo}*

\u{1F464} Cliente: ${input.clienteNome}
\u{1F4DE} Tel: ${input.clienteTelefone || "-"}

${itensTexto}

\u{1F4B0} *Total: R$ ${total.toFixed(2)}*${input.observacao ? "\n\n\u{1F4DD} Obs: " + input.observacao : ""}${vendaId ? "\n\n\u2705 Or\xE7amento #" + vendaId + " criado automaticamente no ERP" : ""}`;
      const whatsappUrl = `https://wa.me/5534991255878?text=${encodeURIComponent(mensagemWpp)}`;
      try {
        await notifyOwner({
          title: `\u{1F338} Novo Pedido - ${lista.titulo} | ${input.clienteNome}`,
          content: `Cliente: ${input.clienteNome}
Telefone: ${input.clienteTelefone || "-"}

${itensTexto}

Total: R$ ${total.toFixed(2)}${vendaId ? "\n\nOr\xE7amento #" + vendaId + " criado automaticamente." : ""}`
        });
      } catch (err) {
        console.error("[listasPrecos.fazerPedido] Erro ao notificar:", err);
      }
      return { pedidoId, vendaId, total, whatsappUrl };
    }),
    // Listar pedidos de uma lista
    listPedidos: protectedProcedure.input(z2.object({ listaId: z2.number() })).query(async ({ input }) => {
      return listListasPedidos(input.listaId);
    }),
    getPedido: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getListaPedidoById(input.id);
    }),
    updatePedidoStatus: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["NOVO", "VISTO", "APROVADO", "CANCELADO"])
    })).mutation(async ({ input }) => {
      await updateListaPedidoStatus(input.id, input.status);
      return { success: true };
    })
  }),
  // ═══════════════════════════════════════════════════════════════
  // PRODUTOS DE LISTA (cadastro manual)
  // ═══════════════════════════════════════════════════════════════
  produtosLista: router({
    searchLoja: protectedProcedure.input(z2.object({
      busca: z2.string().optional()
    })).query(async ({ input }) => {
      return searchProdutosLoja(input.busca);
    }),
    list: protectedProcedure.input(z2.object({
      categoriaId: z2.number().optional(),
      ativo: z2.boolean().optional(),
      busca: z2.string().optional()
    }).optional()).query(async ({ input }) => {
      return listProdutosLista(input ?? {});
    }),
    create: protectedProcedure.input(z2.object({
      produtoLojaId: z2.number().optional().nullable(),
      categoriaId: z2.number().optional(),
      categoriaNome: z2.string().min(1),
      variedade: z2.string().min(1),
      tamanho: z2.string().optional(),
      qtdHasteMaco: z2.string().optional(),
      valorUnitario: z2.number().default(0),
      observacao: z2.string().optional()
    })).mutation(async ({ input }) => {
      return createProdutoLista(input);
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      produtoLojaId: z2.number().optional().nullable(),
      categoriaId: z2.number().optional().nullable(),
      categoriaNome: z2.string().optional(),
      variedade: z2.string().optional(),
      tamanho: z2.string().optional().nullable(),
      qtdHasteMaco: z2.string().optional().nullable(),
      valorUnitario: z2.number().optional(),
      ativo: z2.boolean().optional(),
      observacao: z2.string().optional().nullable()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateProdutoLista(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteProdutoLista(input.id);
      return { success: true };
    }),
    toggleAtivo: protectedProcedure.input(z2.object({ id: z2.number(), ativo: z2.boolean() })).mutation(async ({ input }) => {
      await toggleProdutoListaAtivo(input.id, input.ativo);
      return { success: true };
    }),
    syncFromLoja: protectedProcedure.input(z2.object({
      produtoListaId: z2.number()
    })).mutation(async ({ input }) => {
      const produtoLista = await getProdutoListaById(input.produtoListaId);
      if (!produtoLista || !produtoLista.produtoLojaId) {
        throw new Error("Produto nao vinculado");
      }
      const produtoLoja = await getProdutoLoja(produtoLista.produtoLojaId);
      if (!produtoLoja) throw new Error("Produto loja nao encontrado");
      await updateProdutoLista(input.produtoListaId, {
        variedade: produtoLoja.nome,
        categoriaNome: produtoLoja.departamento,
        valorUnitario: Number(produtoLoja.preco),
        ativo: produtoLoja.ativo === 1
      });
      return { success: true };
    }),
    syncToLoja: protectedProcedure.input(z2.object({
      produtoListaId: z2.number()
    })).mutation(async ({ input }) => {
      const produtoLista = await getProdutoListaById(input.produtoListaId);
      if (!produtoLista || !produtoLista.produtoLojaId) {
        throw new Error("Produto nao vinculado");
      }
      await updateProdutoLoja(produtoLista.produtoLojaId, {
        nome: produtoLista.variedade,
        departamento: produtoLista.categoriaNome,
        preco: String(produtoLista.valorUnitario),
        ativo: produtoLista.ativo
      });
      return { success: true };
    }),
    getHistorico: protectedProcedure.input(z2.object({
      produtoListaId: z2.number()
    })).query(async ({ input }) => {
      return getHistoricoAlteracao(input.produtoListaId);
    }),
    verificarDesatualizado: protectedProcedure.input(z2.object({
      produtoListaId: z2.number()
    })).query(async ({ input }) => {
      return verificarDesatualizacao(input.produtoListaId);
    })
  }),
  // ─── Compras Importadas ───
  comprasImportadas: router({
    list: protectedProcedure.query(async () => {
      return getComprasImportadas();
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getCompraImportadaById(input.id);
    }),
    create: protectedProcedure.input(z2.object({
      produto: z2.string(),
      quantidade: z2.string(),
      valorCusto: z2.string(),
      pacote: z2.string(),
      freteUm: z2.string().optional(),
      icms: z2.string().optional(),
      embalagem: z2.string().optional(),
      nomeArquivo: z2.string(),
      // Campos opcionais para cálculos manuais
      valorTotal: z2.string().optional(),
      freteTotal: z2.string().optional(),
      custoTotal: z2.string().optional(),
      totalCompra: z2.string().optional(),
      valorVarejo: z2.string().optional(),
      valorCdUm: z2.string().optional(),
      valorCdAta: z2.string().optional()
    })).mutation(async ({ input }) => {
      const freteUm = parseFloat(input.freteUm || "0");
      const icms = parseFloat(input.icms || "1.0");
      const embalagem = parseFloat(input.embalagem || "0");
      const quantidade = parseFloat(input.quantidade);
      const valorCusto = parseFloat(input.valorCusto);
      const pacote = parseFloat(input.pacote);
      const calculos = calcularValoresCompraImportada({
        quantidade,
        valorCusto,
        pacote,
        freteUm,
        icms,
        embalagem
      });
      const id = await createCompraImportada({
        produto: input.produto,
        quantidade,
        valorCusto: valorCusto.toString(),
        pacote,
        valorTotal: calculos.valorTotal.toString(),
        freteUm: freteUm.toString(),
        freteTotal: calculos.freteTotal.toString(),
        icms: icms.toString(),
        embalagem: embalagem.toString(),
        custoTotal: calculos.custoTotal.toString(),
        totalCompra: calculos.totalCompra.toString(),
        valorVarejo: calculos.valorVarejo.toString(),
        valorCdUm: calculos.valorCdUm.toString(),
        valorCdAta: calculos.valorCdAta.toString(),
        nomeArquivo: input.nomeArquivo
      });
      return { id };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      return deleteCompraImportada(input.id);
    }),
    getProdutoFatorConversao: protectedProcedure.input(z2.object({ nomeProduto: z2.string() })).query(async ({ input }) => {
      const produto = await getProdutoByName(input.nomeProduto);
      if (!produto) return { fatorConversao: 0, encontrado: false };
      return { fatorConversao: produto.fatorConversao, encontrado: true, produtoId: produto.id };
    }),
    sincronizarComVeiling: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      return sincronizarCompraImportadaComVeiling(input.id);
    }),
    sincronizarTodas: protectedProcedure.mutation(async () => {
      return sincronizarTodasComprasImportadas();
    }),
    aplicarPrecosNoVeiling: protectedProcedure.input(z2.object({ ids: z2.array(z2.number()) })).mutation(async ({ input }) => {
      return aplicarPrecosComprasImportadasNoVeiling(input.ids);
    }),
    aplicarTodosPrecosNoVeiling: protectedProcedure.mutation(async () => {
      return aplicarTodosPrecosComprasImportadas();
    }),
    processarRcoldesc: protectedProcedure.input(z2.object({ conteudo: z2.string() })).mutation(async ({ input }) => {
      const rcoldescRows = parseRcoldescFile(input.conteudo);
      const comprasConvertidas = await converterRcoldescParaCompraImportada(rcoldescRows);
      return { total: comprasConvertidas.length, compras: comprasConvertidas };
    })
  }),
  // ─── Produtos Customizados ───
  categoriasCustomizadas: router({
    listar: publicProcedure.query(async () => {
      return listarCategoriasCustomizadas();
    }),
    criar: protectedProcedure.input(z2.object({
      nome: z2.string().min(1),
      descricao: z2.string().optional(),
      cor: z2.string().optional(),
      icone: z2.string().optional()
    })).mutation(async ({ input }) => {
      return criarCategoriaCustomizada(input);
    }),
    atualizar: protectedProcedure.input(z2.object({
      id: z2.number(),
      nome: z2.string().optional(),
      descricao: z2.string().optional(),
      cor: z2.string().optional(),
      icone: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return atualizarCategoriaCustomizada(id, data);
    }),
    deletar: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      return deletarCategoriaCustomizada(input.id);
    })
  }),
  produtosCustomizados: router({
    listar: publicProcedure.query(async () => {
      return listarProdutosCustomizados();
    }),
    obter: publicProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return obterProdutoCustomizado(input.id);
    }),
    criar: protectedProcedure.input(z2.object({
      nome: z2.string().min(1),
      descricao: z2.string().optional(),
      precoUnitario: z2.number().positive(),
      estoque: z2.number().nonnegative(),
      estoqueMinimo: z2.number().nonnegative().optional(),
      fotoUrl: z2.string().optional(),
      categoriaId: z2.number().optional()
    })).mutation(async ({ input }) => {
      return criarProdutoCustomizado({
        nome: input.nome,
        descricao: input.descricao,
        precoUnitario: input.precoUnitario.toString(),
        estoque: input.estoque,
        estoqueMinimo: input.estoqueMinimo,
        fotoUrl: input.fotoUrl,
        categoriaId: input.categoriaId,
        ativo: input.estoque > 0 ? 1 : 0
      });
    }),
    atualizar: protectedProcedure.input(z2.object({
      id: z2.number(),
      nome: z2.string().optional(),
      descricao: z2.string().optional(),
      precoUnitario: z2.number().optional(),
      estoque: z2.number().optional(),
      estoqueMinimo: z2.number().optional(),
      fotoUrl: z2.string().optional(),
      categoriaId: z2.number().optional().nullable(),
      ativo: z2.number().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData = {};
      if (data.nome !== void 0) updateData.nome = data.nome;
      if (data.descricao !== void 0) updateData.descricao = data.descricao;
      if (data.precoUnitario !== void 0) updateData.precoUnitario = data.precoUnitario.toString();
      if (data.estoque !== void 0) updateData.estoque = data.estoque;
      if (data.estoqueMinimo !== void 0) updateData.estoqueMinimo = data.estoqueMinimo;
      if (data.fotoUrl !== void 0) updateData.fotoUrl = data.fotoUrl;
      if (data.categoriaId !== void 0) updateData.categoriaId = data.categoriaId;
      if (data.ativo !== void 0) updateData.ativo = data.ativo;
      return atualizarProdutoCustomizado(id, updateData);
    }),
    deletar: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      return deletarProdutoCustomizado(input.id);
    }),
    decrementarEstoque: protectedProcedure.input(z2.object({
      id: z2.number(),
      quantidade: z2.number().positive()
    })).mutation(async ({ input }) => {
      return decrementarEstoqueProdutoCustomizado(input.id, input.quantidade);
    })
  }),
  // ─── Histórico de Catálogos PDF ───
  catalogoHistorico: router({
    listar: protectedProcedure.query(async ({ ctx }) => {
      return listarCatalogosHistorico(ctx.user?.id);
    }),
    obter: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return obterCatalogoHistorico(input.id);
    }),
    salvar: protectedProcedure.input(z2.object({
      nome: z2.string().min(1),
      produtosCount: z2.number().positive(),
      pdfUrl: z2.string().optional(),
      produtosJson: z2.string(),
      desconto: z2.number().optional()
    })).mutation(async ({ input, ctx }) => {
      return salvarCatalogoHistorico({
        nome: input.nome,
        produtosCount: input.produtosCount,
        usuarioId: ctx.user?.id,
        pdfUrl: input.pdfUrl,
        produtosJson: input.produtosJson,
        desconto: input.desconto
      });
    }),
    atualizar: protectedProcedure.input(z2.object({
      id: z2.number(),
      nome: z2.string().optional(),
      produtosCount: z2.number().optional(),
      pdfUrl: z2.string().optional(),
      produtosJson: z2.string().optional(),
      desconto: z2.number().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return atualizarCatalogoHistorico(id, data);
    }),
    deletar: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      return deletarCatalogoHistorico(input.id);
    }),
    restaurar: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      return restaurarCatalogoHistorico(input.id);
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
init_db();
init_veilingApi();
import busboy from "busboy";
var veilingTokenCache = null;
async function getVeilingToken() {
  try {
    if (veilingTokenCache && Date.now() < veilingTokenCache.expiresAt) {
      return veilingTokenCache.token;
    }
    const config = await getVeilingConfig();
    if (!config?.usuario || !config?.senha) return null;
    const tokenData = await veilingLogin(config.usuario, config.senha);
    veilingTokenCache = {
      token: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in - 60) * 1e3
    };
    return veilingTokenCache.token;
  } catch {
    return null;
  }
}
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.get("/api/cooperflora/sync-stream", (req, res) => {
    const sessionId = req.query.sessionId || "default";
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();
    const last = syncProgressEmitter.getLastEvent(sessionId);
    if (last) {
      res.write(`data: ${JSON.stringify(last)}

`);
    }
    const listener = (sid, data) => {
      if (sid === sessionId) {
        res.write(`data: ${JSON.stringify(data)}

`);
        if (data.phase === "concluido" || data.phase === "erro") {
          syncProgressEmitter.clearSession(sid);
          res.end();
        }
      }
    };
    syncProgressEmitter.on(SYNC_EVENT, listener);
    req.on("close", () => {
      syncProgressEmitter.off(SYNC_EVENT, listener);
    });
  });
  app.get("/api/pedidos-publicos/stream", (req, res) => {
    const since = parseInt(req.query.since || "0", 10);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();
    const pending = pedidoPublicoEmitter.getPending(since);
    for (const p of pending) {
      res.write(`data: ${JSON.stringify(p)}

`);
    }
    const heartbeat = setInterval(() => {
      res.write(`:heartbeat

`);
    }, 3e4);
    const listener = (data) => {
      res.write(`data: ${JSON.stringify(data)}

`);
    };
    pedidoPublicoEmitter.on(PEDIDO_PUBLICO_EVENT, listener);
    req.on("close", () => {
      clearInterval(heartbeat);
      pedidoPublicoEmitter.off(PEDIDO_PUBLICO_EVENT, listener);
    });
  });
  app.get("/api/veiling/image", async (req, res) => {
    const offerId = req.query.offerId;
    if (!offerId) {
      res.status(400).send("offerId obrigat\xF3rio");
      return;
    }
    try {
      const token = await getVeilingToken();
      if (!token) {
        res.status(503).send("Token Veiling indispon\xEDvel");
        return;
      }
      const config = await getVeilingConfig();
      const customerId = config?.customerId || "987";
      const offerResp = await fetch(
        `https://backend.veilingonline.com.br/ecommerce/api/Offer?page=1&totalPage=1&customerId=${customerId}&orderBy=AZ&includeGfpImages=false&offerId=${offerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!offerResp.ok) {
        res.status(404).send("Oferta n\xE3o encontrada");
        return;
      }
      const offerData = await offerResp.json();
      const imageUrl = offerData.offers?.[0]?.defaultImage;
      if (!imageUrl) {
        res.status(404).send("Imagem n\xE3o dispon\xEDvel");
        return;
      }
      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) {
        res.status(404).send("Imagem expirada");
        return;
      }
      const contentType = imgResp.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=1200");
      const buffer = await imgResp.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch {
      res.status(500).send("Erro ao buscar imagem");
    }
  });
  app.get("/api/veiling/foto", async (req, res) => {
    const url = req.query.url;
    if (!url) {
      res.status(400).send("url obrigat\xF3ria");
      return;
    }
    if (!url.startsWith("http://cvh-img.brazilsouth.cloudapp.azure.com/")) {
      res.status(403).send("URL n\xE3o permitida");
      return;
    }
    try {
      const imgResp = await fetch(url);
      if (!imgResp.ok) {
        res.status(404).send("Imagem n\xE3o encontrada");
        return;
      }
      const contentType = imgResp.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      const buffer = await imgResp.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch {
      res.status(500).send("Erro ao buscar imagem");
    }
  });
  app.post("/api/upload/produto-loja", async (req, res) => {
    try {
      const { base64, mimeType, fileName } = req.body;
      if (!base64 || !mimeType) {
        res.status(400).json({ error: "base64 e mimeType s\xE3o obrigat\xF3rios" });
        return;
      }
      const buffer = Buffer.from(base64, "base64");
      const ext = mimeType.split("/")[1] || "jpg";
      const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const safeName = (fileName || "produto").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const fileKey = `produtos-loja/${safeName}-${suffix}.${ext}`;
      const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const { url } = await storagePut2(fileKey, buffer, mimeType);
      res.json({ url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: msg });
    }
  });
  app.post("/api/upload", async (req, res) => {
    try {
      const bb = busboy({
        headers: req.headers,
        limits: { fileSize: 50 * 1024 * 1024 }
        // 50MB
      });
      let fileBuffer = null;
      let mimeType = "image/jpeg";
      let fileName = "foto";
      bb.on("file", (fieldname, file, info) => {
        const chunks = [];
        mimeType = info.mimetype || "image/jpeg";
        fileName = info.filename || "foto";
        file.on("data", (chunk) => {
          chunks.push(chunk);
        });
        file.on("end", () => {
          fileBuffer = Buffer.concat(chunks);
        });
        file.on("error", (err) => {
          res.status(500).json({ error: err.message });
        });
      });
      bb.on("close", async () => {
        try {
          if (!fileBuffer) {
            res.status(400).json({ error: "Nenhum arquivo enviado" });
            return;
          }
          const ext = mimeType.split("/")[1] || "jpg";
          const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          const safeName = (fileName || "produto").replace(/[^a-z0-9]/gi, "_").toLowerCase();
          const fileKey = `produtos-customizados/${safeName}-${suffix}.${ext}`;
          const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
          const { url } = await storagePut2(fileKey, fileBuffer, mimeType);
          res.json({ url });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          res.status(500).json({ error: msg });
        }
      });
      bb.on("error", (err) => {
        res.status(500).json({ error: err.message });
      });
      req.pipe(bb);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: msg });
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  app.get("/api/autosync/status", (_req, res) => {
    res.json({
      cooperflora: {
        ultimaSync: schedulerStatus.cooperflora.ultimaSync,
        proximaSync: schedulerStatus.cooperflora.proximaSync,
        ultimoStatus: schedulerStatus.cooperflora.ultimoStatus,
        rodando: schedulerStatus.cooperflora.rodando
      },
      veiling: {
        ultimaSync: schedulerStatus.veiling.ultimaSync,
        proximaSync: schedulerStatus.veiling.proximaSync,
        ultimoStatus: schedulerStatus.veiling.ultimoStatus,
        rodando: schedulerStatus.veiling.rodando
      }
    });
  });
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    iniciarAutoSync();
  });
}
startServer().catch(console.error);
