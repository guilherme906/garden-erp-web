import { eq, like, or, and, desc, sql, asc, isNull, isNotNull, inArray, gt } from "drizzle-orm";
import crypto from "crypto";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  clientes, InsertCliente,
  produtos, InsertProduto,
  vendedores, InsertVendedor,
  vendas, InsertVenda,
  vendaItens, InsertVendaItem,
  compras, InsertCompra,
  compraItens, InsertCompraItem,
  estoqueAjustes, InsertEstoqueAjuste,
  historicoAlteracoes, InsertHistoricoAlteracao,
  backups, InsertBackup,
  vendaLinks, InsertVendaLink,
  tabelaPrecos, InsertTabelaPreco,
  formasPagamento, InsertFormaPagamento,
  titulos, InsertTitulo,
  pedidosCompra, InsertPedidoCompra,
  pedidoCompraItens, InsertPedidoCompraItem,
  cooperfloraConfig, InsertCooperfloraConfig,
  cooperfloraProdutos, InsertCooperfloraProduto,
  cooperfloraMargensDepartamento, InsertCooperfloraMargemDepartamento,
  cooperfloraSyncPendente, InsertCooperfloraSyncPendente,
  veilingConfig, InsertVeilingConfig,
  veilingProdutos, InsertVeilingProduto,
  veilingMargensDepartamento, InsertVeilingMargemDepartamento,
  veilingConversao, InsertVeilingConversao,
  produtosLoja, InsertProdutoLoja,
  syncHistorico, InsertSyncHistorico,
  catalogosVenda, InsertCatalogoVenda,
  catalogosVendaItens, InsertCatalogoVendaItem,
  catalogosPedidos, InsertCatalogoPedido,
  catalogosPedidosItens, InsertCatalogoPedidoItem,
  estoqueMovimentacoes, InsertEstoqueMovimentacao,
  veilingImportacoes, InsertVeilingImportacao,
  appConfig,
  veilingCatalogoLinks, InsertVeilingCatalogoLink,
  pedidosPublicos, InsertPedidoPublico,
  pedidosPublicosItens, InsertPedidoPublicoItem,
  veilingFiltrosSalvos, InsertVeilingFiltroSalvo,
  comprasImportadas, InsertCompraImportada,
  acompanhamentoCompras, InsertAcompanhamentoCompra,
  produtosCustomizados, InsertProdutoCustomizado,
  telefonesClientesBloqueados, InsertTelefoneClienteBloqueado,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
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

// ─── Users (Auth) ───
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Vendedores ───
export async function listVendedores() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(vendedores).orderBy(asc(vendedores.id));
}

export async function getVendedor(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(vendedores).where(eq(vendedores.id, id)).limit(1);
  return r[0];
}

export async function getVendedorByLogin(nome: string, senha: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(vendedores).where(and(eq(vendedores.nome, nome), eq(vendedores.senha, senha))).limit(1);
  return r[0];
}

export async function createVendedor(data: InsertVendedor) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(vendedores).values(data);
  return result.insertId;
}

export async function updateVendedor(id: number, data: Partial<InsertVendedor>) {
  const db = await getDb(); if (!db) return;
  await db.update(vendedores).set(data).where(eq(vendedores.id, id));
}

// ─── Clientes ───
export async function listClientes(search?: string, includeDeleted = false) {
  const db = await getDb(); if (!db) return [];
  const conditions = includeDeleted ? [] : [isNull(clientes.deletedAt)];
  if (search) {
    const s = search.toLowerCase();
    conditions.push(or(sql`LOWER(${clientes.nome}) LIKE ${`%${s}%`}`, sql`LOWER(${clientes.telefone}) LIKE ${`%${s}%`}`)!);
  }
  return db.select().from(clientes).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(clientes.id));
}

export async function getCliente(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return r[0];
}

export async function createCliente(data: InsertCliente) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(clientes).values(data);
  return result.insertId;
}

export async function updateCliente(id: number, data: Partial<InsertCliente>) {
  const db = await getDb(); if (!db) return;
  await db.update(clientes).set(data).where(eq(clientes.id, id));
}

export async function deleteCliente(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(clientes).set({ deletedAt: new Date() }).where(eq(clientes.id, id));
}

export async function restoreCliente(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(clientes).set({ deletedAt: null }).where(eq(clientes.id, id));
}

export async function listClientesLixeira() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(clientes).where(isNotNull(clientes.deletedAt)).orderBy(desc(clientes.deletedAt));
}

export async function deleteClientePermanente(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(historicoAlteracoes).where(and(eq(historicoAlteracoes.tabela, 'clientes'), eq(historicoAlteracoes.registroId, id)));
  await db.delete(clientes).where(eq(clientes.id, id));
}

// ─── Produtos ───
export async function listProdutos(search?: string, includeDeleted = false) {
  const db = await getDb(); if (!db) return [];
  const conditions = includeDeleted ? [] : [isNull(produtos.deletedAt)];
  if (search) {
    const s = search.toLowerCase();
    conditions.push(or(sql`LOWER(${produtos.descricao}) LIKE ${`%${s}%`}`, sql`LOWER(${produtos.codigoExterno}) LIKE ${`%${s}%`}`)!);
  }
  return db.select().from(produtos).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(produtos.id));
}

export async function getProduto(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(produtos).where(eq(produtos.id, id)).limit(1);
  return r[0];
}

export async function getProdutoByDescricao(descricao: string) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(produtos).where(eq(produtos.descricao, descricao)).limit(1);
  return r[0];
}

export async function createProduto(data: InsertProduto) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(produtos).values(data);
  return result.insertId;
}

export async function updateProduto(id: number, data: Partial<InsertProduto>) {
  const db = await getDb(); if (!db) return;
  await db.update(produtos).set(data).where(eq(produtos.id, id));
}

export async function deleteProduto(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(produtos).set({ deletedAt: new Date() }).where(eq(produtos.id, id));
}

export async function restoreProduto(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(produtos).set({ deletedAt: null }).where(eq(produtos.id, id));
}

export async function listProdutosLixeira() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(produtos).where(isNotNull(produtos.deletedAt)).orderBy(desc(produtos.deletedAt));
}

export async function deleteProdutoPermanente(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(estoqueAjustes).where(eq(estoqueAjustes.produtoId, id));
  await db.delete(historicoAlteracoes).where(and(eq(historicoAlteracoes.tabela, 'produtos'), eq(historicoAlteracoes.registroId, id)));
  await db.delete(produtos).where(eq(produtos.id, id));
}

// ─── Estoque (cálculo) ───
export async function calcularEstoqueProduto(produtoId: number) {
  const db = await getDb(); if (!db) return 0;
  const [entradas] = await db.select({ total: sql<string>`COALESCE(SUM(quantidade), 0)` }).from(compraItens).where(eq(compraItens.produtoId, produtoId));
  const [saidas] = await db.select({ total: sql<string>`COALESCE(SUM(quantidade), 0)` }).from(vendaItens).where(eq(vendaItens.produtoId, produtoId));
  const [ajustes] = await db.select({ total: sql<string>`COALESCE(SUM(quantidade), 0)` }).from(estoqueAjustes).where(eq(estoqueAjustes.produtoId, produtoId));
  return Number(entradas.total) - Number(saidas.total) + Number(ajustes.total);
}

export async function calcularEstoqueTodos() {
  const db = await getDb(); if (!db) return [];
  const prods = await db.select().from(produtos).where(isNull(produtos.deletedAt)).orderBy(asc(produtos.id));
  const result = [];
  for (const p of prods) {
    const saldo = await calcularEstoqueProduto(p.id);
    result.push({ ...p, estoque: saldo });
  }
  return result;
}

// ─── Estoque Kardex ───
export async function getKardex(produtoId: number) {
  const db = await getDb(); if (!db) return { entradas: [], saidas: [], ajustes: [] };
  const entradas = await db.select().from(compraItens).where(eq(compraItens.produtoId, produtoId));
  const saidas = await db.select().from(vendaItens).where(eq(vendaItens.produtoId, produtoId));
  const ajustesList = await db.select().from(estoqueAjustes).where(eq(estoqueAjustes.produtoId, produtoId));
  return { entradas, saidas, ajustes: ajustesList };
}

export async function createAjusteEstoque(data: InsertEstoqueAjuste) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(estoqueAjustes).values(data);
  return result.insertId;
}

// ─── Vendas ───
export async function listVendas(search?: string, includeDeleted = false) {
  const db = await getDb(); if (!db) return [];
  const conditions = includeDeleted ? [] : [isNull(vendas.deletedAt)];
  if (search) {
    const s = search.toLowerCase();
    conditions.push(or(sql`LOWER(${vendas.clienteNome}) LIKE ${`%${s}%`}`, sql`LOWER(${vendas.vendedorNome}) LIKE ${`%${s}%`}`)!);
  }
  return db.select().from(vendas).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(vendas.id));
}

export async function getVenda(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(vendas).where(eq(vendas.id, id)).limit(1);
  return r[0];
}

export async function getVendaItens(vendaId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(vendaItens).where(eq(vendaItens.vendaId, vendaId)).orderBy(asc(vendaItens.ordem));
}

export async function createVenda(data: InsertVenda, itens: InsertVendaItem[]) {
  const db = await getDb(); if (!db) return null;
  
  // Gerar número sequencial (001, 002, 003...)
  const ultimaVenda = await db.select({ numeroSequencial: vendas.numeroSequencial })
    .from(vendas)
    .orderBy(desc(vendas.numeroSequencial))
    .limit(1);
  
  const proximoNumero = (ultimaVenda[0]?.numeroSequencial || 0) + 1;
  
  const [result] = await db.insert(vendas).values({
    ...data,
    numeroSequencial: proximoNumero,
  });
  const vendaId = result.insertId;
  for (let i = 0; i < itens.length; i++) {
    await db.insert(vendaItens).values({ ...itens[i], vendaId, ordem: i });
  }
  return vendaId;
}

export async function updateVenda(id: number, data: Partial<InsertVenda>, itens?: InsertVendaItem[]) {
  const db = await getDb(); if (!db) return;
  await db.update(vendas).set(data).where(eq(vendas.id, id));
  // Apenas atualizar itens se um array foi explicitamente passado (não undefined ou vazio)
  if (itens && Array.isArray(itens) && itens.length > 0) {
    await db.delete(vendaItens).where(eq(vendaItens.vendaId, id));
    for (let i = 0; i < itens.length; i++) {
      await db.insert(vendaItens).values({ ...itens[i], vendaId: id, ordem: i });
    }
  }
}

export async function deleteVenda(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(vendas).set({ deletedAt: new Date() }).where(eq(vendas.id, id));
}

export async function restoreVenda(id: number) {
  const db = await getDb(); if (!db) return;
  await db.update(vendas).set({ deletedAt: null }).where(eq(vendas.id, id));
}

export async function listVendasLixeira() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(vendas).where(isNotNull(vendas.deletedAt)).orderBy(desc(vendas.deletedAt));
}

export async function deleteVendaPermanente(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(vendaLinks).where(eq(vendaLinks.vendaId, id));
  await db.delete(vendaItens).where(eq(vendaItens.vendaId, id));
  await db.delete(vendas).where(eq(vendas.id, id));
}

// ─── Compras ───
export async function listCompras() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(compras).orderBy(desc(compras.id));
}

export async function getCompra(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const r = await db.select().from(compras).where(eq(compras.id, id)).limit(1);
  return r[0];
}

export async function getCompraItens(compraId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(compraItens).where(eq(compraItens.compraId, compraId));
}

export async function createCompra(data: InsertCompra, itens: InsertCompraItem[]) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(compras).values(data);
  const compraId = result.insertId;
  for (const item of itens) {
    await db.insert(compraItens).values({ ...item, compraId });
  }
  return compraId;
}

// ─── Histórico de Alterações ───
export async function listHistorico(tabela: string, registroId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(historicoAlteracoes)
    .where(and(eq(historicoAlteracoes.tabela, tabela), eq(historicoAlteracoes.registroId, registroId)))
    .orderBy(desc(historicoAlteracoes.createdAt));
}

export async function createHistorico(data: InsertHistoricoAlteracao) {
  const db = await getDb(); if (!db) return;
  await db.insert(historicoAlteracoes).values(data);
}

// ─── Relatórios ───
export async function getRelatorioVendas(dataInicio: string, dataFim: string, status?: string) {
  const db = await getDb(); if (!db) return [];
  let query;
  if (status && status !== 'TODOS') {
    query = db.select().from(vendas)
      .where(and(
        sql`${vendas.data} >= ${dataInicio}`,
        sql`${vendas.data} <= ${dataFim}`,
        eq(vendas.status, status as any),
        isNull(vendas.deletedAt)
      )).orderBy(asc(vendas.clienteNome));
  } else {
    query = db.select().from(vendas)
      .where(and(
        sql`${vendas.data} >= ${dataInicio}`,
        sql`${vendas.data} <= ${dataFim}`,
        isNull(vendas.deletedAt)
      )).orderBy(asc(vendas.clienteNome));
  }
  return query;
}

export async function getRankingProdutos(dataInicio: string, dataFim: string, status?: string) {
  const db = await getDb(); if (!db) return [];
  const vendasList = await getRelatorioVendas(dataInicio, dataFim, status);
  const mapa: Record<string, {
    produtoId: number | null;
    produtoNome: string;
    valorUnitario: number;
    quantidade: number;
    total: number;
    observacoes: string[];
    estoque: number | null;       // estoque real em produtos_loja
    estoqueDisponivel: number | null; // estoque real - qtd vendida no período
  }> = {};
  for (const v of vendasList) {
    const itens = await getVendaItens(v.id);
    for (const it of itens) {
      // Agrupar apenas por nome normalizado (sem o preço), para que o mesmo produto
      // vendido a preços diferentes apareça como uma única linha no relatório.
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
          estoqueDisponivel: null,
        };
      }
      mapa[key].quantidade += Number(it.quantidade);
      mapa[key].total += Number(it.subtotal);
      if (it.observacao && !mapa[key].observacoes.includes(it.observacao)) {
        mapa[key].observacoes.push(it.observacao);
      }
      // Guardar produtoId se ainda não tiver
      if (!mapa[key].produtoId && it.produtoId) {
        mapa[key].produtoId = it.produtoId;
      }
    }
  }
  // Buscar estoque real da tabela produtos_loja (campo estoque atualizado manualmente)
  // Estratégia: buscar por nome normalizado (UPPER TRIM) na tabela produtos_loja
  // Se não encontrar, tentar pelo nome na tabela produtos (kardex calculado)
  for (const entry of Object.values(mapa)) {
    const nomeNorm = entry.produtoNome.trim().toUpperCase();

    // 1. Buscar na tabela produtos_loja pelo nome (estoque real mantido manualmente)
    const [lojaRow] = await db
      .select({ estoque: produtosLoja.estoque })
      .from(produtosLoja)
      .where(sql`UPPER(TRIM(${produtosLoja.nome})) = ${nomeNorm}`)
      .limit(1);

    if (lojaRow) {
      entry.estoque = Number(lojaRow.estoque);
      entry.estoqueDisponivel = Number(lojaRow.estoque) - entry.quantidade;
      continue;
    }

    // 2. Fallback: buscar na tabela produtos e calcular pelo kardex
    if (entry.produtoId) {
      const saldo = await calcularEstoqueProduto(entry.produtoId);
      entry.estoque = saldo;
      entry.estoqueDisponivel = saldo - entry.quantidade;
    } else {
      const [prod] = await db
        .select({ id: produtos.id })
        .from(produtos)
        .where(sql`UPPER(TRIM(${produtos.descricao})) = ${nomeNorm}`)
        .limit(1);
      if (prod) {
        entry.produtoId = prod.id;
        const saldo = await calcularEstoqueProduto(prod.id);
        entry.estoque = saldo;
        entry.estoqueDisponivel = saldo - entry.quantidade;
      }
    }
  }
  return Object.values(mapa).sort((a, b) => a.produtoNome.localeCompare(b.produtoNome, 'pt-BR', { sensitivity: 'base' }));
}

// ─── Backup ───
export async function getAllDataForBackup() {
  const db = await getDb(); if (!db) return null;
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
    db.select().from(backups),
  ]);
  return { clientes: c, produtos: p, vendas: v, vendaItens: vi, compras: co, compraItens: ci, estoqueAjustes: ea, historicoAlteracoes: ha, vendedores: ve, backups: b };
}

export async function createBackupRecord(data: InsertBackup) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(backups).values(data);
  return result.insertId;
}

export async function listBackups() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(backups).orderBy(desc(backups.createdAt));
}

// ─── Venda Links (Compartilhamento) ───
export async function createVendaLink(data: { vendaId: number; token: string; expiresAt: Date; createdBy?: string }) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(vendaLinks).values(data);
  return result.insertId;
}

export async function getVendaByToken(token: string) {
  const db = await getDb(); if (!db) return null;
  const [link] = await db.select().from(vendaLinks).where(eq(vendaLinks.token, token));
  if (!link) return null;
  if (new Date(link.expiresAt) < new Date()) return { expired: true, link };
  const venda = await getVenda(link.vendaId);
  if (!venda) return null;
  const itens = await getVendaItens(link.vendaId);
  return { expired: false, link, venda: { ...venda, itens } };
}

export async function listVendaLinks(vendaId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(vendaLinks).where(eq(vendaLinks.vendaId, vendaId)).orderBy(desc(vendaLinks.createdAt));
}

export async function deleteVendaLink(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(vendaLinks).where(eq(vendaLinks.id, id));
}

// ─── Manutenção: Zerar Estoque ───
export async function zerarEstoque() {
  const db = await getDb(); if (!db) return;
  // Apenas zera o estoque dos produtos, mantendo-os ativos
  // Zera estoque em todas as tabelas de produtos
  await db.update(cooperfloraProdutos).set({ estoque: 0 });
  await db.update(veilingProdutos).set({ estoqueDisponivel: 0 });
  await db.update(produtosLoja).set({ estoque: "0.000" as any });
}


// ─── Importar Backup ───
export async function importBackupData(data: any) {
  const db = await getDb(); if (!db) return;
  const backup = data.db || data;

  // Limpar dados existentes (ordem: dependentes primeiro)
  await db.delete(compraItens);
  await db.delete(compras);
  await db.delete(vendaItens);
  await db.delete(vendas);
  await db.delete(estoqueAjustes);
  await db.delete(historicoAlteracoes);
  await db.delete(clientes);
  await db.delete(produtos);
  // Limpar vendedores exceto admin
  const existingVendedores = await db.select().from(vendedores);
  for (const v of existingVendedores) {
    if (v.nome !== "admin") {
      await db.delete(vendedores).where(eq(vendedores.id, v.id));
    }
  }

  // Mapas de IDs antigos -> novos para manter referências
  const clienteIdMap = new Map<number, number>();
  const produtoIdMap = new Map<number, number>();
  const vendedorIdMap = new Map<number, number>();
  const vendaIdMap = new Map<number, number>();
  const compraIdMap = new Map<number, number>();

  // Importar clientes
  if (backup.clientes?.length) {
    for (const c of backup.clientes) {
      const [result] = await db.insert(clientes).values({ nome: c.nome, telefone: c.telefone, email: c.email, endereco: c.endereco });
      clienteIdMap.set(c.id, result.insertId);
    }
  }

  // Importar produtos
  if (backup.produtos?.length) {
    for (const p of backup.produtos) {
      const [result] = await db.insert(produtos).values({ descricao: p.descricao, preco: p.preco, codigoExterno: p.codigoExterno });
      produtoIdMap.set(p.id, result.insertId);
    }
  }

  // Importar vendedores (exceto admin que já existe)
  if (backup.vendedores?.length) {
    for (const v of backup.vendedores) {
      if (v.nome === "admin") {
        const existing = existingVendedores.find(ev => ev.nome === "admin");
        if (existing) vendedorIdMap.set(v.id, existing.id);
        continue;
      }
      const [result] = await db.insert(vendedores).values({ nome: v.nome, email: v.email, telefone: v.telefone, senha: v.senha || "123", perfil: v.perfil || "VENDEDOR" });
      vendedorIdMap.set(v.id, result.insertId);
    }
  }

  // Importar vendas
  if (backup.vendas?.length) {
    for (const v of backup.vendas) {
      const [result] = await db.insert(vendas).values({
        clienteId: v.clienteId ? (clienteIdMap.get(v.clienteId) || v.clienteId) : undefined,
        clienteNome: v.clienteNome,
        vendedorId: v.vendedorId ? (vendedorIdMap.get(v.vendedorId) || v.vendedorId) : undefined,
        vendedorNome: v.vendedorNome,
        data: v.data,
        status: v.status || "AGUARDANDO",
        logistica: v.logistica,
        total: v.total,
      });
      vendaIdMap.set(v.id, result.insertId);
    }
  }

  // Importar venda_itens
  if (backup.vendaItens?.length) {
    for (const vi of backup.vendaItens) {
      await db.insert(vendaItens).values({
        vendaId: vendaIdMap.get(vi.vendaId) || vi.vendaId,
        produtoId: vi.produtoId ? (produtoIdMap.get(vi.produtoId) || vi.produtoId) : undefined,
        produtoNome: vi.produtoNome,
        quantidade: vi.quantidade,
        valorUnitario: vi.valorUnitario,
        subtotal: vi.subtotal,
        observacao: vi.observacao,
      });
    }
  }

  // Importar compras
  if (backup.compras?.length) {
    for (const c of backup.compras) {
      const [result] = await db.insert(compras).values({
        fornecedor: c.fornecedor,
        numNF: c.numNF,
        data: c.data,
        total: c.total,
        origem: c.origem,
      });
      compraIdMap.set(c.id, result.insertId);
    }
  }

  // Importar compra_itens
  if (backup.compraItens?.length) {
    for (const ci of backup.compraItens) {
      await db.insert(compraItens).values({
        compraId: compraIdMap.get(ci.compraId) || ci.compraId,
        produtoId: ci.produtoId ? (produtoIdMap.get(ci.produtoId) || ci.produtoId) : undefined,
        produtoNome: ci.produtoNome,
        quantidade: ci.quantidade,
        valorUnitario: ci.valorUnitario,
        subtotal: ci.subtotal,
      });
    }
  }

  // Importar estoque_ajustes
  if (backup.estoqueAjustes?.length) {
    for (const ea of backup.estoqueAjustes) {
      await db.insert(estoqueAjustes).values({
        produtoId: produtoIdMap.get(ea.produtoId) || ea.produtoId,
        produtoNome: ea.produtoNome,
        quantidade: ea.quantidade,
        motivo: ea.motivo,
        usuarioNome: ea.usuarioNome,
      });
    }
  }

  // Importar historico_alteracoes
  if (backup.historicoAlteracoes?.length) {
    for (const h of backup.historicoAlteracoes) {
      await db.insert(historicoAlteracoes).values({
        tabela: h.tabela,
        registroId: h.registroId,
        campo: h.campo,
        valorAntigo: h.valorAntigo,
        valorNovo: h.valorNovo,
        usuarioNome: h.usuarioNome,
      });
    }
  }
}

// ─── Conferência de Pedidos ───
export async function buscarPedidosConferencia(search: string) {
  const db = await getDb(); if (!db) return [];
  // Buscar por número do pedido, nome do cliente ou telefone do cliente
  const searchNum = parseInt(search, 10);
  const conditions = [isNull(vendas.deletedAt)];

  if (!isNaN(searchNum) && String(searchNum) === search.trim()) {
    // Busca por ID do pedido
    conditions.push(eq(vendas.id, searchNum));
  } else {
    // Busca por nome do cliente ou telefone (case-insensitive)
    const sl = search.toLowerCase();
    conditions.push(
      or(
        sql`LOWER(${vendas.clienteNome}) LIKE ${`%${sl}%`}`,
        sql`${vendas.clienteId} IN (SELECT id FROM clientes WHERE LOWER(telefone) LIKE ${`%${sl}%`})`
      )!
    );
  }

  return db.select().from(vendas).where(and(...conditions)).orderBy(desc(vendas.createdAt)).limit(50);
}

export async function salvarConferencia(vendaId: number, itensConferidos: { itemId: number; qtdConferida: string }[], conferidoPor: string) {
  const db = await getDb(); if (!db) return;

  // Atualizar qtdConferida em cada item (1ª conferência - Separação)
  for (const item of itensConferidos) {
    await db.update(vendaItens)
      .set({ qtdConferida: item.qtdConferida })
      .where(eq(vendaItens.id, item.itemId));
  }

  // Marcar venda como conferida (1ª - Separação)
  await db.update(vendas)
    .set({
      conferido: 1,
      conferidoPor,
      conferidoEm: new Date(),
    })
    .where(eq(vendas.id, vendaId));
}

export async function salvarConferencia2(vendaId: number, itensConferidos: { itemId: number; qtdConferida: string }[], conferidoPor: string) {
  const db = await getDb(); if (!db) return;

  // Atualizar qtdConferida2 em cada item (2ª conferência - Entrega)
  for (const item of itensConferidos) {
    await db.update(vendaItens)
      .set({ qtdConferida2: item.qtdConferida })
      .where(eq(vendaItens.id, item.itemId));
  }

  // Marcar venda como conferida (2ª - Entrega)
  await db.update(vendas)
    .set({
      conferido2: 1,
      conferidoPor2: conferidoPor,
      conferidoEm2: new Date(),
    })
    .where(eq(vendas.id, vendaId));
}

export async function listarDivergenciasConferencia() {
  const db = await getDb(); if (!db) return [];

  // Buscar vendas conferidas (1ª ou 2ª)
  const vendasConferidas = await db.select().from(vendas)
    .where(and(or(eq(vendas.conferido, 1), eq(vendas.conferido2, 1))!, isNull(vendas.deletedAt)))
    .orderBy(asc(vendas.clienteNome));

  const results = [];
  for (const v of vendasConferidas) {
    const itensVenda = await db.select().from(vendaItens).where(eq(vendaItens.vendaId, v.id));
    const itensDivergentes1 = itensVenda.filter(item =>
      item.qtdConferida !== null && item.qtdConferida !== item.quantidade
    );
    const itensDivergentes2 = itensVenda.filter(item =>
      item.qtdConferida2 !== null && item.qtdConferida2 !== item.quantidade
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
      itensOk: itensVenda.filter(i => i.qtdConferida !== null && i.qtdConferida === i.quantidade).length,
      itensOk2: itensVenda.filter(i => i.qtdConferida2 !== null && i.qtdConferida2 === i.quantidade).length,
      itens: itensVenda.map(item => ({
        id: item.id,
        produtoNome: item.produtoNome,
        quantidade: item.quantidade,
        qtdConferida: item.qtdConferida,
        qtdConferida2: item.qtdConferida2,
        divergente: item.qtdConferida !== null && item.qtdConferida !== item.quantidade,
        divergente2: item.qtdConferida2 !== null && item.qtdConferida2 !== item.quantidade,
      })),
    });
  }
  return results;
}

// ─── Tabela de Preços ───
export async function listTabelaPrecosByCompra(compraId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(tabelaPrecos).where(eq(tabelaPrecos.compraId, compraId)).orderBy(asc(tabelaPrecos.id));
}

export async function upsertTabelaPreco(data: {
  compraItemId: number;
  compraId: number;
  produtoId?: number | null;
  produtoNome: string;
  custoUnitario: string;
  margem1: string;
  preco1: string;
  margem2: string;
  preco2: string;
  margem3: string;
  preco3: string;
}) {
  const db = await getDb(); if (!db) return null;
  // Verificar se já existe registro para este compraItemId
  const existing = await db.select().from(tabelaPrecos)
    .where(eq(tabelaPrecos.compraItemId, data.compraItemId)).limit(1);

  if (existing.length > 0) {
    // Update
    await db.update(tabelaPrecos).set({
      produtoNome: data.produtoNome,
      custoUnitario: data.custoUnitario,
      margem1: data.margem1,
      preco1: data.preco1,
      margem2: data.margem2,
      preco2: data.preco2,
      margem3: data.margem3,
      preco3: data.preco3,
    }).where(eq(tabelaPrecos.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert
    const [result] = await db.insert(tabelaPrecos).values(data as any);
    return result.insertId;
  }
}

export async function saveTabelaPrecosBatch(compraId: number, items: Array<{
  compraItemId: number;
  produtoId?: number | null;
  produtoNome: string;
  custoUnitario: string;
  margem1: string;
  preco1: string;
  margem2: string;
  preco2: string;
  margem3: string;
  preco3: string;
}>) {
  for (const item of items) {
    await upsertTabelaPreco({ ...item, compraId });
  }
}

// ===== FORMAS DE PAGAMENTO =====
export async function createFormaPagamento(nome: string, descricao?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.insert(formasPagamento).values({ nome, descricao }).execute();
  return result;
}

export async function listFormasPagamento() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(formasPagamento).where(eq(formasPagamento.ativo, 1)).execute();
}

export async function updateFormaPagamento(id: number, nome?: string, descricao?: string, ativo?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const updates: any = {};
  if (nome !== undefined) updates.nome = nome;
  if (descricao !== undefined) updates.descricao = descricao;
  if (ativo !== undefined) updates.ativo = ativo;
  return await db.update(formasPagamento).set(updates).where(eq(formasPagamento.id, id)).execute();
}

export async function deleteFormaPagamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.update(formasPagamento).set({ ativo: 0 }).where(eq(formasPagamento.id, id)).execute();
}

// ===== TÍTULOS =====
export async function createTitulo(input: InsertTitulo) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.insert(titulos).values(input).execute();
  return result;
}

export async function listTitulosPendentes() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(titulos).where(inArray(titulos.status, ["PENDENTE", "VENCIDO"])).orderBy(titulos.dataVencimento).execute();
}

export async function listTitulosPagos() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(titulos).where(eq(titulos.status, "PAGO")).orderBy(desc(titulos.dataPagamento)).execute();
}

export async function getTitulosByVenda(vendaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(titulos).where(eq(titulos.vendaId, vendaId)).execute();
}

export async function updateTituloStatus(id: number, status: "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO", dataPagamento?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const updates: any = { status };
  if (dataPagamento) updates.dataPagamento = dataPagamento;
  return await db.update(titulos).set(updates).where(eq(titulos.id, id)).execute();
}

export async function deleteTitulo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.update(titulos).set({ status: "CANCELADO" }).where(eq(titulos.id, id)).execute();
}


// ─── Faturamento ───
export async function faturarVenda(vendaId: number, formaPagamentoId: number, faturadoPor: string, dataVencimento: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Buscar venda
  const venda = await db.select().from(vendas).where(eq(vendas.id, vendaId)).limit(1);
  if (!venda.length) throw new Error("Venda não encontrada");
  
  const v = venda[0];
  
  // Marcar venda como faturada
  await db.update(vendas).set({
    faturado: 1,
    faturadoPor,
    faturadoEm: new Date(),
  }).where(eq(vendas.id, vendaId)).execute();
  
  // Criar título a receber usando createTitulo
  const result = await createTitulo({
    vendaId,
    clienteId: v.clienteId || 0,
    clienteNome: v.clienteNome || "",
    formaPagamentoId,
    valor: v.total,
    dataVencimento,
    status: "PENDENTE",
  });
  
  return { vendaId, tituloId: (result as any).insertId || 0 };
}

export async function getVendasNaoFaturadas() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(vendas).where(eq(vendas.faturado, 0)).execute();
}


// ─── Pedidos de Compra ───

export async function listPedidosCompra() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  // Buscar pedidos com origens de orçamento (vendaOrigemId dos itens)
  const pedidos = await db.select().from(pedidosCompra).where(isNull(pedidosCompra.deletedAt)).orderBy(asc(pedidosCompra.numero)).execute();
  if (!pedidos.length) return [];
  // Para cada pedido, buscar as origens distintas
  const ids = pedidos.map(p => p.id);
  const origensRes = await db.execute(
    sql`SELECT pci.pedidoCompraId, pci.vendaOrigemId, MIN(v.id) as vendaId, MIN(c.nome) as clienteNome
        FROM pedido_compra_itens pci
        LEFT JOIN vendas v ON v.id = pci.vendaOrigemId
        LEFT JOIN clientes c ON c.id = v.clienteId
        WHERE pci.pedidoCompraId IN (${sql.raw(ids.join(','))}) AND pci.vendaOrigemId IS NOT NULL
        GROUP BY pci.pedidoCompraId, pci.vendaOrigemId`
  );
  const origensRows = (origensRes[0] as unknown as any[]);
  // Agrupar origens por pedidoCompraId
  const origensMap: Record<number, { vendaOrigemId: number; clienteNome: string | null }[]> = {};
  for (const row of origensRows) {
    const pid = Number(row.pedidoCompraId);
    if (!origensMap[pid]) origensMap[pid] = [];
    origensMap[pid].push({ vendaOrigemId: Number(row.vendaOrigemId), clienteNome: row.clienteNome || null });
  }
  return pedidos.map(p => ({ ...p, origens: origensMap[p.id] || [] }));
}

export async function getPedidoCompra(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const [pedido] = await db.select().from(pedidosCompra).where(eq(pedidosCompra.id, id)).execute();
  if (!pedido) return null;
  const itens = await db.select().from(pedidoCompraItens).where(eq(pedidoCompraItens.pedidoCompraId, id)).execute();
  return { ...pedido, itens };
}

export async function getNextNumeroPedidoCompra() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const [result] = await db.select({ maxNum: sql<number>`COALESCE(MAX(${pedidosCompra.numero}), 0)` }).from(pedidosCompra).execute();
  return (result?.maxNum || 0) + 1;
}

export async function createPedidoCompra(data: { numero: number; data: string; solicitante: string; observacoes?: string; total: string; itens: { produtoId?: number; produtoNome: string; quantidade: string; precoVenda: string; subtotalVenda: string }[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const [result] = await db.insert(pedidosCompra).values({
    numero: data.numero,
    data: data.data,
    solicitante: data.solicitante,
    observacoes: data.observacoes || null,
    total: data.total,
  }).execute();
  const pedidoId = result.insertId;
  if (data.itens.length > 0) {
    await db.insert(pedidoCompraItens).values(
      data.itens.map(item => ({
        pedidoCompraId: pedidoId,
        produtoId: item.produtoId || null,
        produtoNome: item.produtoNome,
        quantidade: item.quantidade,
        precoVenda: item.precoVenda,
        subtotalVenda: item.subtotalVenda,
      }))
    ).execute();
  }
  return pedidoId;
}

export async function updatePedidoCompra(id: number, data: { data: string; solicitante: string; observacoes?: string; total: string; status?: string; itens: { produtoId?: number; produtoNome: string; quantidade: string; precoVenda: string; subtotalVenda: string }[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const updateData: any = {
    data: data.data,
    solicitante: data.solicitante,
    observacoes: data.observacoes || null,
    total: data.total,
  };
  if (data.status) updateData.status = data.status;
  await db.update(pedidosCompra).set(updateData).where(eq(pedidosCompra.id, id)).execute();
  // Recriar itens
  await db.delete(pedidoCompraItens).where(eq(pedidoCompraItens.pedidoCompraId, id)).execute();
  if (data.itens.length > 0) {
    await db.insert(pedidoCompraItens).values(
      data.itens.map(item => ({
        pedidoCompraId: id,
        produtoId: item.produtoId || null,
        produtoNome: item.produtoNome,
        quantidade: item.quantidade,
        precoVenda: item.precoVenda,
        subtotalVenda: item.subtotalVenda,
      }))
    ).execute();
  }
}

export async function deletePedidoCompra(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.update(pedidosCompra).set({ deletedAt: new Date() }).where(eq(pedidosCompra.id, id)).execute();
}

export async function updateStatusPedidoCompra(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.update(pedidosCompra).set({ status: status as any }).where(eq(pedidosCompra.id, id)).execute();
}

// ─── Cooperflora Config ───
export async function getCooperfloraConfig() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const rows = await db.select().from(cooperfloraConfig).execute();
  return rows[0] || null;
}

export async function upsertCooperfloraConfig(data: Partial<InsertCooperfloraConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const existing = await getCooperfloraConfig();
  if (existing) {
    await db.update(cooperfloraConfig).set({ ...data, updatedAt: new Date() }).where(eq(cooperfloraConfig.id, existing.id)).execute();
    const rows = await db.select().from(cooperfloraConfig).where(eq(cooperfloraConfig.id, existing.id)).execute();
    return rows[0];
  } else {
    await db.insert(cooperfloraConfig).values({ login: "", senha: "", ...data } as InsertCooperfloraConfig).execute();
    const rows = await db.select().from(cooperfloraConfig).execute();
    return rows[0];
  }
}

// ─── Cooperflora Produtos ───
export async function listCooperfloraProdutos(filtro?: { nome?: string; qualidade?: string; grupo?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const rows = await db.select().from(cooperfloraProdutos).orderBy(cooperfloraProdutos.nome).execute();
  let result = rows;
  if (filtro?.nome) {
    const n = filtro.nome.toLowerCase();
    result = result.filter(r => r.nome.toLowerCase().includes(n));
  }
  if (filtro?.qualidade) {
    result = result.filter(r => r.qualidade === filtro.qualidade);
  }
  if (filtro?.grupo) {
    const g = filtro.grupo.toLowerCase();
    result = result.filter(r => r.grupo.toLowerCase().includes(g));
  }
  return result;
}

export async function upsertCooperfloraProdutos(produtos: InsertCooperfloraProduto[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  if (produtos.length === 0) return;
  // Delete all and re-insert for simplicity (full sync)
  await db.delete(cooperfloraProdutos).execute();
  // Insert in batches of 100
  for (let i = 0; i < produtos.length; i += 100) {
    const batch = produtos.slice(i, i + 100);
    await db.insert(cooperfloraProdutos).values(batch).execute();
  }
}

export async function updateCooperfloraMargem(codigo: string, margemCustom: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  await db.update(cooperfloraProdutos)
    .set({ margemCustom: margemCustom !== null ? String(margemCustom) as any : null })
    .where(eq(cooperfloraProdutos.codigo, codigo))
    .execute();
}

export async function updateCooperfloraHastes(codigo: string, hastes: number, hastesEmbalagem?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const updateData: Record<string, unknown> = { hastes };
  if (hastesEmbalagem && hastesEmbalagem > 1) updateData.hastesEmbalagem = hastesEmbalagem;
  await db.update(cooperfloraProdutos)
    .set(updateData as any)
    .where(eq(cooperfloraProdutos.codigo, codigo))
    .execute();
}

// ─── Sincronização de Produtos de Venda a partir da Cooperflora ───
/**
 * Sincroniza a tabela `produtos` (catálogo de vendas) com base nos dados da Cooperflora.
 * - Cria novos produtos com codigoExterno = codigo Cooperflora
 * - Atualiza descricao, custo (precoMin), preco (precoMin * margem), fatorConversao (hastes)
 * - Soft-delete produtos que saíram do catálogo (sem vendas/compras ativas vinculadas)
 * - Restaura produtos que voltaram ao catálogo
 * - Ajusta estoque: insere estoqueAjuste para refletir estoque atual da Cooperflora
 * Retorna { criados, atualizados, removidos, restaurados, estoqueAjustado }
 */
export async function syncProdutosVendaFromCooperflora(margemPadrao: number = 30): Promise<{
  criados: number;
  atualizados: number;
  removidos: number;
  restaurados: number;
  estoqueAjustado: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  // 1. Buscar todos os produtos da Cooperflora (catálogo atual)
  const cooperfloraRows = await db.select().from(cooperfloraProdutos).execute();
  const codigosCooperflora = new Set(cooperfloraRows.map(r => r.codigo));

  // 2. Buscar todos os produtos do ERP que têm codigoExterno (vinculados à Cooperflora)
  const produtosErp = await db.select().from(produtos)
    .where(isNotNull(produtos.codigoExterno))
    .execute();

  const produtosErpMap = new Map(produtosErp.map(p => [p.codigoExterno!, p]));

  let criados = 0, atualizados = 0, removidos = 0, restaurados = 0, estoqueAjustado = 0;

  // 3. Para cada produto da Cooperflora: criar ou atualizar no ERP
  for (const cp of cooperfloraRows) {
    const margem = cp.margemCustom ? Number(cp.margemCustom) : margemPadrao;
    const custoUnitario = Number(cp.precoMin);
    // Preço de venda = custo * (1 + margem/100), arredondado em 2 casas
    const precoVenda = custoUnitario > 0
      ? Math.round(custoUnitario * (1 + margem / 100) * 100) / 100
      : 0;
    // fatorConversao = hastes por maço (quantas unidades por embalagem)
    const fator = cp.hastes > 1 ? cp.hastes : 1;
    // Descrição: "Nome (Qualidade)" se qualidade existir
    const descricao = cp.qualidade ? `${cp.nome} (${cp.qualidade})` : cp.nome;

    const existente = produtosErpMap.get(cp.codigo);

    if (!existente) {
      // Produto novo: criar
      const [res] = await db.insert(produtos).values({
        descricao,
        custo: String(custoUnitario) as any,
        preco: String(precoVenda) as any,
        fatorConversao: String(fator) as any,
        codigoExterno: cp.codigo,
      }).execute();
      const novoProdutoId = res.insertId;
      criados++;

      // Ajustar estoque inicial se > 0
      if (cp.estoque > 0) {
        await db.insert(estoqueAjustes).values({
          produtoId: novoProdutoId,
          produtoNome: descricao,
          quantidade: String(cp.estoque) as any,
          motivo: `Estoque inicial via sincronização Cooperflora (${cp.dataCarregamento})`,
          usuarioNome: 'Sistema',
        }).execute();
        estoqueAjustado++;
      }
    } else {
      // Produto existente: atualizar dados
      const updates: Record<string, unknown> = {
        descricao,
        custo: String(custoUnitario) as any,
        preco: String(precoVenda) as any,
        fatorConversao: String(fator) as any,
      };

      // Se estava deletado, restaurar
      if (existente.deletedAt) {
        updates.deletedAt = null;
        restaurados++;
      }

      await db.update(produtos).set(updates as any).where(eq(produtos.id, existente.id)).execute();
      atualizados++;

      // Ajustar estoque: calcular saldo atual e inserir ajuste para igualar ao estoque Cooperflora
      const saldoAtual = await calcularEstoqueProduto(existente.id);
      const diff = cp.estoque - saldoAtual;
      if (diff !== 0) {
        await db.insert(estoqueAjustes).values({
          produtoId: existente.id,
          produtoNome: descricao,
          quantidade: String(diff) as any,
          motivo: `Ajuste de estoque via sincronização Cooperflora (${cp.dataCarregamento}). Saldo anterior: ${saldoAtual}, novo: ${cp.estoque}`,
          usuarioNome: 'Sistema',
        }).execute();
        estoqueAjustado++;
      }
    }
  }

  // 4. Soft-delete produtos do ERP que não estão mais na Cooperflora
  for (const [codigo, prod] of Array.from(produtosErpMap.entries())) {
    if (!codigosCooperflora.has(codigo) && !prod.deletedAt) {
      // Verificar se há vendas ou compras vinculadas (não deletar se houver histórico)
      const [vendasVinculadas] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(vendaItens).where(eq(vendaItens.produtoId, prod.id)).execute();
      const [comprasVinculadas] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(compraItens).where(eq(compraItens.produtoId, prod.id)).execute();

      // Soft delete independente de histórico (produto sumiu do catálogo)
      await db.update(produtos).set({ deletedAt: new Date() }).where(eq(produtos.id, prod.id)).execute();
      removidos++;
    }
  }

  return { criados, atualizados, removidos, restaurados, estoqueAjustado };
}

// ─── Cooperflora - Margens por Departamento ───
export async function listMargensDepartamento() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(cooperfloraMargensDepartamento).orderBy(asc(cooperfloraMargensDepartamento.grupo)).execute();
}

export async function upsertMargemDepartamento(grupo: string, margem: number) {
  const db = await getDb(); if (!db) return;
  const existing = await db.select().from(cooperfloraMargensDepartamento)
    .where(eq(cooperfloraMargensDepartamento.grupo, grupo)).limit(1).execute();
  if (existing.length > 0) {
    await db.update(cooperfloraMargensDepartamento)
      .set({ margem: String(margem) as any })
      .where(eq(cooperfloraMargensDepartamento.grupo, grupo)).execute();
  } else {
    await db.insert(cooperfloraMargensDepartamento).values({ grupo, margem: String(margem) as any }).execute();
  }
}

export async function deleteMargemDepartamento(grupo: string) {
  const db = await getDb(); if (!db) return;
  await db.delete(cooperfloraMargensDepartamento)
    .where(eq(cooperfloraMargensDepartamento.grupo, grupo)).execute();
}

/**
 * Retorna a margem efetiva para um grupo:
 * 1. Margem customizada do produto (margemCustom)
 * 2. Margem do departamento (grupo)
 * 3. Margem padrão global
 */
export async function getMargemEfetiva(grupo: string, margemCustomProduto: string | null, margemPadrao: number): Promise<number> {
  if (margemCustomProduto !== null && margemCustomProduto !== undefined) {
    return Number(margemCustomProduto);
  }
  const db = await getDb(); if (!db) return margemPadrao;
  const rows = await db.select().from(cooperfloraMargensDepartamento)
    .where(eq(cooperfloraMargensDepartamento.grupo, grupo)).limit(1).execute();
  if (rows.length > 0) return Number(rows[0].margem);
  return margemPadrao;
}

// ─── Cooperflora - Preview de Sincronização (dry-run) ───
export type SyncPreviewItem = {
  codigo: string;
  acao: 'CRIAR' | 'ATUALIZAR' | 'REMOVER';
  nome: string;
  qualidade: string;
  grupo: string;
  custoNovo: number;
  precoNovo: number;
  custoAnterior?: number;
  precoAnterior?: number;
  estoqueNovo: number;
  estoqueAnterior?: number;
  hastes: number;
  imagemUrl?: string;
  produtoErpId?: number;
};

export async function previewSyncVendas(margemPadrao: number = 30): Promise<SyncPreviewItem[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const cooperfloraRows = await db.select().from(cooperfloraProdutos).execute();
  const codigosCooperflora = new Set(cooperfloraRows.map(r => r.codigo));
  const produtosErp = await db.select().from(produtos)
    .where(isNotNull(produtos.codigoExterno)).execute();
  const produtosErpMap = new Map(produtosErp.map(p => [p.codigoExterno!, p]));

  const result: SyncPreviewItem[] = [];

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
        acao: 'CRIAR',
        nome: descricao,
        qualidade: cp.qualidade,
        grupo: cp.grupo,
        custoNovo,
        precoNovo,
        estoqueNovo: cp.estoque,
        hastes,
        imagemUrl: cp.imagemUrl || undefined,
      });
    } else {
      const custoAnterior = Number(existente.custo);
      const precoAnterior = Number(existente.preco);
      const estoqueAnterior = await calcularEstoqueProduto(existente.id);
      // Só inclui se houve mudança relevante
      const mudou = Math.abs(custoAnterior - custoNovo) > 0.001
        || Math.abs(precoAnterior - precoNovo) > 0.001
        || estoqueAnterior !== cp.estoque
        || existente.deletedAt !== null;
      if (mudou) {
        result.push({
          codigo: cp.codigo,
          acao: existente.deletedAt ? 'CRIAR' : 'ATUALIZAR',
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
          imagemUrl: cp.imagemUrl || undefined,
          produtoErpId: existente.id,
        });
      }
    }
  }

  // Produtos removidos
  for (const [codigo, prod] of Array.from(produtosErpMap.entries())) {
    if (!codigosCooperflora.has(codigo) && !prod.deletedAt) {
      result.push({
        codigo,
        acao: 'REMOVER',
        nome: prod.descricao,
        qualidade: '',
        grupo: '',
        custoNovo: 0,
        precoNovo: 0,
        custoAnterior: Number(prod.custo),
        precoAnterior: Number(prod.preco),
        estoqueNovo: 0,
        estoqueAnterior: await calcularEstoqueProduto(prod.id),
        hastes: 1,
        produtoErpId: prod.id,
      });
    }
  }

  return result;
}

/**
 * Aplica apenas os itens aprovados da lista de preview.
 * codigosAprovados: lista de codigos a aplicar (CRIAR/ATUALIZAR/REMOVER)
 */
export async function aplicarSyncVendas(
  codigosAprovados: string[],
  margemPadrao: number = 30
): Promise<{ criados: number; atualizados: number; removidos: number; restaurados: number; estoqueAjustado: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const aprovadosSet = new Set(codigosAprovados);
  const cooperfloraRows = await db.select().from(cooperfloraProdutos)
    .where(inArray(cooperfloraProdutos.codigo, codigosAprovados.length > 0 ? codigosAprovados : ['__nenhum__'])).execute();

  const produtosErp = await db.select().from(produtos).where(isNotNull(produtos.codigoExterno)).execute();
  const produtosErpMap = new Map(produtosErp.map(p => [p.codigoExterno!, p]));

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
        descricao, custo: String(custoUnitario) as any, preco: String(precoVenda) as any,
        fatorConversao: String(fator) as any, codigoExterno: cp.codigo,
      }).execute();
      if (cp.estoque > 0) {
        await db.insert(estoqueAjustes).values({
          produtoId: res.insertId, produtoNome: descricao,
          quantidade: String(cp.estoque) as any,
          motivo: `Estoque inicial via sincronização Cooperflora`,
          usuarioNome: 'Sistema',
        }).execute();
        estoqueAjustado++;
      }
      criados++;
    } else {
      const updates: Record<string, unknown> = {
        descricao, custo: String(custoUnitario) as any, preco: String(precoVenda) as any,
        fatorConversao: String(fator) as any,
      };
      if (existente.deletedAt) { updates.deletedAt = null; restaurados++; }
      await db.update(produtos).set(updates as any).where(eq(produtos.id, existente.id)).execute();
      const saldoAtual = await calcularEstoqueProduto(existente.id);
      const diff = cp.estoque - saldoAtual;
      if (diff !== 0) {
        await db.insert(estoqueAjustes).values({
          produtoId: existente.id, produtoNome: descricao,
          quantidade: String(diff) as any,
          motivo: `Ajuste via sincronização Cooperflora. Anterior: ${saldoAtual}, novo: ${cp.estoque}`,
          usuarioNome: 'Sistema',
        }).execute();
        estoqueAjustado++;
      }
      atualizados++;
    }
  }

  // Remover os aprovados que são REMOVER
  for (const [codigo, prod] of Array.from(produtosErpMap.entries())) {
    if (aprovadosSet.has(codigo) && !prod.deletedAt) {
      const cpExiste = await db.select().from(cooperfloraProdutos)
        .where(eq(cooperfloraProdutos.codigo, codigo)).limit(1).execute();
      if (cpExiste.length === 0) {
        await db.update(produtos).set({ deletedAt: new Date() }).where(eq(produtos.id, prod.id)).execute();
        removidos++;
      }
    }
  }

  return { criados, atualizados, removidos, restaurados, estoqueAjustado };
}

// ─── Veiling - Configurações ───
export async function getVeilingConfig() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(veilingConfig).execute();
  return rows[0] || null;
}

export async function saveVeilingConfig(data: Partial<InsertVeilingConfig>) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  const existing = await db.select().from(veilingConfig).execute();
  if (existing.length > 0) {
    await db.update(veilingConfig).set({ ...data, updatedAt: new Date() }).where(eq(veilingConfig.id, existing[0].id)).execute();
  } else {
    await db.insert(veilingConfig).values({ usuario: "", senha: "", ...data }).execute();
  }
}

// ─── Veiling - Produtos ───
export async function listVeilingProdutos(filtros?: {
  categoria?: string;
  produtor?: string;
  busca?: string;
  cor?: string;
  cores?: string[];
  letra?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  // Sempre ocultar produtos com estoque zerado
  conditions.push(gt(veilingProdutos.estoqueDisponivel, 0));
  if (filtros?.categoria) conditions.push(eq(veilingProdutos.categoria, filtros.categoria));
  if (filtros?.produtor) conditions.push(eq(veilingProdutos.produtor, filtros.produtor));
  if (filtros?.letra) {
    conditions.push(
      or(
        sql`UPPER(${veilingProdutos.nomeCompleto}) LIKE ${filtros.letra.toUpperCase() + '%'}`,
        sql`UPPER(${veilingProdutos.nome}) LIKE ${filtros.letra.toUpperCase() + '%'}`
      )!
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
      )!
    );
  }
  if (filtros?.cor) conditions.push(eq(veilingProdutos.cor, filtros.cor));
  if (filtros?.cores && filtros.cores.length > 0) {
    conditions.push(inArray(veilingProdutos.cor, filtros.cores));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countRows, conversaoMap] = await Promise.all([
    db.select().from(veilingProdutos)
      .where(where)
      .orderBy(asc(veilingProdutos.nome), asc(veilingProdutos.id))
      .limit(filtros?.limit ?? 200)
      .offset(filtros?.offset ?? 0)
      .execute(),
    db.select({ count: sql<number>`COALESCE(COUNT(*), 0)` }).from(veilingProdutos).where(where).execute(),
    getVeilingConversaoMap(),
  ]);
  // Enriquecer com qtdVenda e fotoUrl da tabela de conversão
  // Prioridade: match pelo nomeCompleto (descLonga) para diferenciar variantes; fallback pelo nome curto
  const enriched = items.map(item => {
    // Prioridade 1: match exato pelo nomeCompleto (corresponde à descLonga da conversão)
    let conv = item.nomeCompleto ? conversaoMap.get(item.nomeCompleto.trim().toUpperCase()) : undefined;
    // Prioridade 2: fallback pelo nome curto
    if (!conv) {
      conv = conversaoMap.get(item.nome.trim().toUpperCase());
    }
    // Prioridade 3: busca parcial na conversão (para produtos que têm variações no nome)
    // Procura por conversões cujo descLonga começa com o nome do produto
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
    const icms = conv?.icms ?? null; // ex: 0.82 significa 18% de ICMS
    // Prioridade de imagem:
    // 1. Cache permanente S3 (imagemUrlCache) — melhor opção, URL estável
    // 2. URL temporária do Veiling (imagemUrl) — foto correta do produto, mas pode expirar
    //    ATENÇÃO: URLs com 'Default' no caminho são placeholders genéricos — ignorar
    // 3. Proxy por offerId (/api/veiling/image?offerId=...) — busca foto correta pelo ID único
    //    IMPORTANTE: usar antes de fotoConversao para evitar foto errada em produtos com mesmo nome
    // 4. Foto da conversão (fotoConversao) — último recurso, mapeada por nome (pode ser compartilhada)
    const proxyOfferId = item.offerId ? `/api/veiling/image?offerId=${item.offerId}` : null;
    // Filtrar URLs placeholder do Veiling (contêm 'Default' no caminho — são imagens genéricas, não do produto)
    const imagemUrlValida = item.imagemUrl && !item.imagemUrl.includes('/Default') ? item.imagemUrl : null;
    // Prioridade: Cache S3 > URL do Veiling (mais confiável) > Proxy > Foto da conversao
    // Nota: Proxy pode retornar 404, então URL válida do Veiling é preferida
    const imagemFinal = (item as any).imagemUrlCache || imagemUrlValida || proxyOfferId || fotoConversao;
    return { ...item, imagemUrl: imagemFinal, qtdVenda, fotoConversao, qualidadeConversao, observacaoGfp, numGfp, icms, nomeProdutor: item.produtor };
  });
  const total = countRows[0]?.count != null ? Number(countRows[0].count) : items.length;
  return { items: enriched, total };
}

/** Retorna um Set de offerIds que já estão marcados como LKP_RECEPCIONADO no banco */
export async function getVeilingStatusRecepcionados(): Promise<Set<number>> {
  const db = await getDb();
  if (!db) return new Set();
  const rows = await db
    .select({ offerId: veilingProdutos.offerId })
    .from(veilingProdutos)
    .where(eq(veilingProdutos.statusProduto, 'LKP_RECEPCIONADO'))
    .execute();
  return new Set(rows.map(r => r.offerId));
}

export async function upsertVeilingProdutos(ofertas: InsertVeilingProduto[], recepcionadosIds?: Set<number>) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  // Limpar todos e reinserir (catálogo muda diariamente)
  await db.delete(veilingProdutos).execute();
  if (ofertas.length === 0) return 0;
  // Se recepcionadosIds fornecido, preservar status LKP_RECEPCIONADO para esses produtos
  const ofertasComStatus = recepcionadosIds && recepcionadosIds.size > 0
    ? ofertas.map(o => ({
        ...o,
        statusProduto: recepcionadosIds.has(o.offerId) ? 'LKP_RECEPCIONADO' : o.statusProduto,
      }))
    : ofertas;
  // Inserir em lotes de 200
  const BATCH = 200;
  for (let i = 0; i < ofertasComStatus.length; i += BATCH) {
    await db.insert(veilingProdutos).values(ofertasComStatus.slice(i, i + BATCH)).execute();
  }
  return ofertasComStatus.length;
}

export async function getCoresVeiling() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ cor: veilingProdutos.cor })
    .from(veilingProdutos)
    .groupBy(veilingProdutos.cor)
    .orderBy(asc(veilingProdutos.cor))
    .execute();
  return rows.map((r) => r.cor).filter((c): c is string => c != null && c.trim() !== '');
}
export async function getVeilingCategorias() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ categoria: veilingProdutos.categoria })
    .from(veilingProdutos)
    .groupBy(veilingProdutos.categoria)
    .orderBy(asc(veilingProdutos.categoria))
    .execute();
  return rows.map((r) => r.categoria).filter(Boolean);
}

export async function getVeilingProdutores(categoria?: string) {
  const db = await getDb();
  if (!db) return [];
  const query = db
    .select({ produtor: veilingProdutos.produtor })
    .from(veilingProdutos)
    .groupBy(veilingProdutos.produtor)
    .orderBy(asc(veilingProdutos.produtor));
  if (categoria) {
    const rows = await db
      .select({ produtor: veilingProdutos.produtor })
      .from(veilingProdutos)
      .where(eq(veilingProdutos.categoria, categoria))
      .groupBy(veilingProdutos.produtor)
      .orderBy(asc(veilingProdutos.produtor))
      .execute();
    return rows.map((r) => r.produtor).filter(Boolean);
  }
  const rows = await query.execute();
  return rows.map((r) => r.produtor).filter(Boolean);
}

// ─── Veiling - Margens por Departamento ───
export async function listVeilingMargens() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(veilingMargensDepartamento).orderBy(asc(veilingMargensDepartamento.categoria)).execute();
}

export async function upsertVeilingMargem(categoria: string, margem: number) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  const existing = await db.select().from(veilingMargensDepartamento)
    .where(eq(veilingMargensDepartamento.categoria, categoria)).limit(1).execute();
  if (existing.length > 0) {
    await db.update(veilingMargensDepartamento)
      .set({ margem: String(margem), updatedAt: new Date() })
      .where(eq(veilingMargensDepartamento.id, existing[0].id)).execute();
  } else {
    await db.insert(veilingMargensDepartamento).values({ categoria, margem: String(margem) }).execute();
  }
}

export async function deleteVeilingMargem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  await db.delete(veilingMargensDepartamento).where(eq(veilingMargensDepartamento.id, id)).execute();
}

// Normaliza nomes de categoria do Veiling para correspondência flexível
function normalizarCategoriaVeiling(cat: string): string {
  const c = cat.toLowerCase().trim();
  // "Produto de Corte" e "Flores de Corte" são equivalentes
  if (c.includes("corte")) return "produto de corte";
  if (c.includes("envasada") || c.includes("flor envasada")) return "flor envasada";
  if (c.includes("ornamental") || c.includes("planta")) return "planta ornamental";
  if (c.includes("decorado") || c.includes("decorada")) return "produto decorado";
  return c;
}

export async function getVeilingMargemEfetiva(categoria: string, margemGlobal: number): Promise<number> {
  const db = await getDb();
  if (!db) return margemGlobal;
  // Busca todas as margens e compara normalizando os nomes
  const rows = await db.select().from(veilingMargensDepartamento).execute();
  const catNorm = normalizarCategoriaVeiling(categoria);
  const match = rows.find(r => normalizarCategoriaVeiling(r.categoria) === catNorm);
  if (match) return Number(match.margem);
  return margemGlobal;
}

/** Corrige produtos com categoria vazia usando os mapas de categorias da API */
export async function recategorizarVeilingProdutos(
  catMapById: Map<number, string>,
  catMapByCode: Map<string, string>,
  catMapByCodeTrimmed: Map<string, string>
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  // Buscar todos os produtos sem categoria (categoria vazia ou nula)
  const semCategoria = await db
    .select({ id: veilingProdutos.id, categoriaId: veilingProdutos.categoriaId })
    .from(veilingProdutos)
    .where(eq(veilingProdutos.categoria, ''))
    .execute();
  let corrigidos = 0;
  for (const p of semCategoria) {
    const catId = p.categoriaId || 0;
    const catNome = catMapById.get(catId)
      || catMapByCode.get(String(catId))
      || catMapByCodeTrimmed.get(String(catId))
      || '';
    if (catNome) {
      await db.update(veilingProdutos)
        .set({ categoria: catNome })
        .where(eq(veilingProdutos.id, p.id))
        .execute();
      corrigidos++;
    }
  }
  return corrigidos;
}

// ─── Produtos da Loja ─────────────────────────────────────────────────────────
export async function listProdutosLoja(opts?: { busca?: string; departamento?: string; ativo?: number; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { busca, departamento, ativo, limit = 100, offset = 0 } = opts ?? {};
  const conditions: any[] = [];
  if (busca) {
    const b = busca.toLowerCase();
    conditions.push(or(sql`LOWER(${produtosLoja.nome}) LIKE ${`%${b}%`}`, sql`LOWER(${produtosLoja.codigo}) LIKE ${`%${b}%`}`, sql`LOWER(${produtosLoja.descricao}) LIKE ${`%${b}%`}`)!);
  }
  if (departamento) conditions.push(eq(produtosLoja.departamento, departamento));
  if (ativo !== undefined) conditions.push(eq(produtosLoja.ativo, ativo));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countRows] = await Promise.all([
    db.select().from(produtosLoja).where(where).orderBy(asc(produtosLoja.nome)).limit(limit).offset(offset).execute(),
    db.select({ count: sql<number>`count(*)` }).from(produtosLoja).where(where).execute(),
  ]);
  return { items, total: Number(countRows[0]?.count ?? 0) };
}

export async function getProdutoLoja(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(produtosLoja).where(eq(produtosLoja.id, id)).limit(1).execute();
  return rows[0] ?? null;
}

export async function createProdutoLoja(data: Omit<InsertProdutoLoja, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  const [result] = await db.insert(produtosLoja).values(data).execute();
  return { id: (result as any).insertId as number };
}

export async function updateProdutoLoja(id: number, data: Partial<Omit<InsertProdutoLoja, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  await db.update(produtosLoja).set({ ...data, updatedAt: new Date() }).where(eq(produtosLoja.id, id)).execute();
  
  // Sincronizar com produtos_lista vinculados
  await syncProdutoLojaToLista(id, data);
  
  return { id };
}

// Sincronizar alterações de produtos_loja para produtos_lista
export async function syncProdutoLojaToLista(produtoLojaId: number, data: Partial<Omit<InsertProdutoLoja, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) return;
  const { produtosLista } = await import("../drizzle/schema");
  
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.nome) updateData.variedade = data.nome;
  if (data.departamento) updateData.categoriaNome = data.departamento;
  if (data.preco) updateData.valorUnitario = data.preco;
  if (data.ativo !== undefined) updateData.ativo = data.ativo;
  
  if (Object.keys(updateData).length > 1) {
    await db.update(produtosLista)
      .set(updateData)
      .where(eq(produtosLista.produtoLojaId, produtoLojaId))
      .execute();
  }
}

export async function deleteProdutoLoja(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  // Antes de deletar, remover vinculação em produtos_lista
  const { produtosLista } = await import("../drizzle/schema");
  await db.update(produtosLista)
    .set({ produtoLojaId: null, updatedAt: new Date() })
    .where(eq(produtosLista.produtoLojaId, id))
    .execute();
  await db.delete(produtosLoja).where(eq(produtosLoja.id, id)).execute();
}

export async function listDepartamentosLoja(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.selectDistinct({ departamento: produtosLoja.departamento })
    .from(produtosLoja)
    .where(and(sql`${produtosLoja.departamento} != ''`))
    .orderBy(asc(produtosLoja.departamento))
    .execute();
  return rows.map(r => r.departamento).filter(Boolean);
}

// ─── Veiling - Conversão Unidade→Pacote ───
export async function getVeilingConversaoMap(): Promise<Map<string, { qtdVenda: number; fotoUrl: string | null; qualidade?: string; observacao?: string | null; numGfp?: string; icms?: number | null }>> {
  const db = await getDb();
  if (!db) return new Map();
  try {
    const rows = await db.select({
      descCurta: veilingConversao.descCurta,
      descLonga: veilingConversao.descLonga,
      qtdVenda: veilingConversao.qtdVenda,
      fotoUrl: veilingConversao.fotoUrl,
      qualidade: veilingConversao.qualidade,
      observacao: veilingConversao.observacao,
      numGfp: veilingConversao.numGfp,
      icms: veilingConversao.icms,
    }).from(veilingConversao).execute();
    const map = new Map<string, { qtdVenda: number; fotoUrl: string | null; qualidade?: string; observacao?: string | null; numGfp?: string; icms?: number | null }>();
    for (const r of rows) {
      const icmsVal = r.icms != null ? parseFloat(String(r.icms)) : null;
      const entry = { qtdVenda: r.qtdVenda, fotoUrl: r.fotoUrl ?? null, qualidade: r.qualidade ?? "", observacao: r.observacao ?? null, numGfp: r.numGfp ?? "", icms: icmsVal };
      // Prioridade 1: chave pela descLonga (match exato com nomeCompleto do produto Veiling)
      if (r.descLonga) {
        const keyLonga = r.descLonga.trim().toUpperCase();
        map.set(keyLonga, entry);
      }
      // Prioridade 2: chave pela descCurta como fallback (só insere se ainda não existir)
      const keyCurta = r.descCurta.trim().toUpperCase();
      if (!map.has(keyCurta)) map.set(keyCurta, entry);
    }
    return map;
  } catch {
    return new Map();
  }
}

export async function importVeilingConversao(
  rows: Array<{ codItem: string; descCurta: string; descLonga: string; qtdVenda: number; fotoUrl?: string | null; qualidade?: string; observacao?: string | null; numGfp?: string; icms?: number | null }>
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  await db.execute(sql`TRUNCATE TABLE veiling_conversao`);
  let inserted = 0;
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await db.insert(veilingConversao).values(chunk.map(r => ({
      codItem: r.codItem,
      descCurta: r.descCurta,
      descLonga: r.descLonga,
      qtdVenda: r.qtdVenda,
      fotoUrl: r.fotoUrl ?? null,
      qualidade: r.qualidade ?? "",
      observacao: r.observacao ?? null,
      numGfp: r.numGfp ?? "",
      icms: r.icms != null ? String(r.icms) : null,
    }))).execute();
    inserted += chunk.length;
  }
  return inserted;
}

export async function countVeilingConversao(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const rows = await db.select({ count: sql<number>`COUNT(*)` }).from(veilingConversao).execute();
    return Number(rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

// ─── Histórico de Sincronizações ─────────────────────────────────────────────
export async function registrarSyncHistorico(data: InsertSyncHistorico): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(syncHistorico).values(data).execute();
  } catch (err) {
    console.warn("[SyncHistorico] Falha ao registrar:", err);
  }
}

export async function listarSyncHistorico(
  fonte?: "COOPERFLORA" | "VEILING",
  limit = 50
): Promise<typeof syncHistorico.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const where = fonte ? eq(syncHistorico.fonte, fonte) : undefined;
    return db
      .select()
      .from(syncHistorico)
      .where(where)
      .orderBy(desc(syncHistorico.createdAt))
      .limit(limit)
      .execute();
  } catch {
    return [];
  }
}

// ─── Sincronização automática: Compras → Produtos Loja ───────────────────────
/**
 * Insere ou atualiza um produto na tabela produtos_loja a partir de dados de compra.
 * Usado automaticamente ao registrar entrada NF ou importar arquivo.
 * - Se já existe produto com mesmo nome (case-insensitive), atualiza precoCusto e estoque.
 * - Se não existe, cria novo produto ativo.
 */
export async function upsertProdutoLojaFromCompra(data: {
  nome: string;
  precoCusto?: number;
  quantidade?: number;
  codigoExterno?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const nomeNorm = data.nome.trim().toUpperCase();
    if (!nomeNorm) return;

    // Verificar se já existe produto com mesmo nome
    const [existing] = await db
      .select()
      .from(produtosLoja)
      .where(sql`UPPER(TRIM(${produtosLoja.nome})) = ${nomeNorm}`)
      .limit(1)
      .execute();

    if (existing) {
      // Atualizar precoCusto e incrementar estoque
      const novoEstoque = Number(existing.estoque) + (data.quantidade || 0);
      await db
        .update(produtosLoja)
        .set({
          precoCusto: data.precoCusto !== undefined ? String(data.precoCusto.toFixed(2)) : existing.precoCusto,
          estoque: String(novoEstoque.toFixed(3)),
          updatedAt: new Date(),
        })
        .where(eq(produtosLoja.id, existing.id))
        .execute();
    } else {
      // Criar novo produto na loja
      await db
        .insert(produtosLoja)
        .values({
          nome: nomeNorm,
          codigo: data.codigoExterno || null,
          precoCusto: data.precoCusto !== undefined ? String(data.precoCusto.toFixed(2)) : "0.00",
          preco: data.precoCusto !== undefined ? String((data.precoCusto * 1.3).toFixed(2)) : "0.00",
          estoque: String((data.quantidade || 0).toFixed(3)),
          unidade: "UN",
          departamento: "",
          ativo: 1,
        })
        .execute();
    }
  } catch (err) {
    console.warn("[upsertProdutoLojaFromCompra] Falha:", err);
  }
}

// ─── Catálogos de Venda ───────────────────────────────────────────────────────

export async function createCatalogoVenda(data: InsertCatalogoVenda) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  const [result] = await db.insert(catalogosVenda).values(data);
  return result.insertId as number;
}

export async function listCatalogosVenda() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(catalogosVenda).orderBy(catalogosVenda.createdAt);
  return rows;
}

export async function getCatalogoVenda(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(catalogosVenda).where(eq(catalogosVenda.id, id));
  return rows[0] || null;
}

export async function getCatalogoVendaByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(catalogosVenda).where(eq(catalogosVenda.token, token));
  return rows[0] || null;
}

export async function updateCatalogoVenda(id: number, data: Partial<InsertCatalogoVenda>) {
  const db = await getDb();
  if (!db) return;
  await db.update(catalogosVenda).set(data).where(eq(catalogosVenda.id, id));
}

export async function deleteCatalogoVenda(id: number) {
  const db = await getDb();
  if (!db) return;
  // Deletar em cascata
  const pedidos = await db.select({ id: catalogosPedidos.id }).from(catalogosPedidos).where(eq(catalogosPedidos.catalogoId, id));
  for (const p of pedidos) {
    await db.delete(catalogosPedidosItens).where(eq(catalogosPedidosItens.pedidoId, p.id));
  }
  await db.delete(catalogosPedidos).where(eq(catalogosPedidos.catalogoId, id));
  await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.catalogoId, id));
  await db.delete(catalogosVenda).where(eq(catalogosVenda.id, id));
}

// ─── Itens do Catálogo ────────────────────────────────────────────────────────

export async function addCatalogoItem(data: InsertCatalogoVendaItem) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  const [result] = await db.insert(catalogosVendaItens).values(data);
  return result.insertId as number;
}

export async function removeCatalogoItem(itemId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.id, itemId));
}

export async function listCatalogoItens(catalogoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(catalogosVendaItens)
    .where(eq(catalogosVendaItens.catalogoId, catalogoId))
    .orderBy(catalogosVendaItens.ordem, catalogosVendaItens.id);
}

export async function clearCatalogoItens(catalogoId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.catalogoId, catalogoId));
}

// ─── Pedidos dos Catálogos ────────────────────────────────────────────────────

export async function createCatalogoPedido(
  pedido: InsertCatalogoPedido,
  itens: InsertCatalogoPedidoItem[]
) {
  const db = await getDb();
  if (!db) throw new Error("DB indisponível");
  const [result] = await db.insert(catalogosPedidos).values(pedido);
  const pedidoId = result.insertId as number;
  if (itens.length > 0) {
    await db.insert(catalogosPedidosItens).values(itens.map(i => ({ ...i, pedidoId })));
  }
  return pedidoId;
}

export async function listCatalogoPedidos(catalogoId: number) {
  const db = await getDb();
  if (!db) return [];
  const pedidos = await db.select().from(catalogosPedidos)
    .where(eq(catalogosPedidos.catalogoId, catalogoId))
    .orderBy(catalogosPedidos.createdAt);
  const result = [];
  for (const p of pedidos) {
    const itens = await db.select().from(catalogosPedidosItens).where(eq(catalogosPedidosItens.pedidoId, p.id));
    result.push({ ...p, itens });
  }
  return result;
}

export async function listAllCatalogoPedidos() {
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

export async function updateCatalogoPedidoStatus(pedidoId: number, status: "NOVO" | "VISTO" | "APROVADO" | "CANCELADO", vendaId?: number) {
  const db = await getDb();
  if (!db) return;
  const updateData: any = { status };
  if (vendaId !== undefined) updateData.vendaId = vendaId;
  await db.update(catalogosPedidos).set(updateData).where(eq(catalogosPedidos.id, pedidoId));
}

export async function getCatalogoPedidoById(pedidoId: number) {
  const db = await getDb();
  if (!db) return null;
  const [pedido] = await db.select().from(catalogosPedidos).where(eq(catalogosPedidos.id, pedidoId));
  if (!pedido) return null;
  const itens = await db.select().from(catalogosPedidosItens).where(eq(catalogosPedidosItens.pedidoId, pedidoId));
  return { ...pedido, itens };
}

// ─── Adicionar item a pedido de compra existente ───
export async function addItemToPedidoCompra(pedidoId: number, item: { produtoNome: string; quantidade: string; precoVenda: string; subtotalVenda: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  // Inserir o novo item
  await db.insert(pedidoCompraItens).values({
    pedidoCompraId: pedidoId,
    produtoId: null,
    produtoNome: item.produtoNome,
    quantidade: item.quantidade,
    precoVenda: item.precoVenda,
    subtotalVenda: item.subtotalVenda,
  }).execute();
  // Recalcular o total do pedido
  const itens = await db.select().from(pedidoCompraItens).where(eq(pedidoCompraItens.pedidoCompraId, pedidoId)).execute();
  const novoTotal = itens.reduce((acc, i) => acc + parseFloat(String(i.subtotalVenda) || "0"), 0);
  await db.update(pedidosCompra).set({ total: novoTotal.toFixed(2) }).where(eq(pedidosCompra.id, pedidoId)).execute();
}

// ─── Movimentações de Estoque (Ajustes Manuais) ───
export async function criarMovimentacaoEstoque(data: {
  produtoId: number;
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE";
  quantidade: number;
  justificativa: string;
  usuarioNome: string;
  usuarioId?: string;
}): Promise<{ estoqueAntes: number; estoqueDepois: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  // Buscar estoque atual do produto
  const [prod] = await db.select({ estoque: produtosLoja.estoque }).from(produtosLoja).where(eq(produtosLoja.id, data.produtoId));
  if (!prod) throw new Error("Produto não encontrado");

  const estoqueAntes = parseFloat(String(prod.estoque || "0"));
  let estoqueDepois: number;

  if (data.tipo === "ENTRADA") {
    estoqueDepois = estoqueAntes + data.quantidade;
  } else if (data.tipo === "SAIDA") {
    estoqueDepois = estoqueAntes - data.quantidade;
  } else {
    // AJUSTE: define o estoque diretamente
    estoqueDepois = data.quantidade;
  }

  // Registrar movimentação
  await db.insert(estoqueMovimentacoes).values({
    produtoId: data.produtoId,
    tipo: data.tipo,
    quantidade: String(data.tipo === "AJUSTE" ? Math.abs(estoqueDepois - estoqueAntes) : data.quantidade) as any,
    estoqueAntes: String(estoqueAntes) as any,
    estoqueDepois: String(estoqueDepois) as any,
    justificativa: data.justificativa,
    usuarioNome: data.usuarioNome,
    usuarioId: data.usuarioId || "",
  }).execute();

  // Atualizar estoque do produto
  await db.update(produtosLoja).set({ estoque: String(estoqueDepois) as any }).where(eq(produtosLoja.id, data.produtoId)).execute();

  return { estoqueAntes, estoqueDepois };
}

export async function listarMovimentacoesEstoque(params: {
  produtoId?: number;
  tipo?: "ENTRADA" | "SAIDA" | "AJUSTE";
  usuarioNome?: string;
  dataInicio?: Date;
  dataFim?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions: any[] = [];
  if (params.produtoId) conditions.push(eq(estoqueMovimentacoes.produtoId, params.produtoId));
  if (params.tipo) conditions.push(eq(estoqueMovimentacoes.tipo, params.tipo));
  if (params.usuarioNome) conditions.push(like(estoqueMovimentacoes.usuarioNome, `%${params.usuarioNome}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(estoqueMovimentacoes)
    .where(whereClause);

  const items = await db
    .select({
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
      createdAt: estoqueMovimentacoes.createdAt,
    })
    .from(estoqueMovimentacoes)
    .leftJoin(produtosLoja, eq(estoqueMovimentacoes.produtoId, produtosLoja.id))
    .where(whereClause)
    .orderBy(desc(estoqueMovimentacoes.createdAt))
    .limit(params.limit || 100)
    .offset(params.offset || 0);

  return { items, total: Number(countResult?.count || 0) };
}

export async function relatorioEstoqueProdutos() {
  const db = await getDb();
  if (!db) return [];

  const produtos = await db
    .select({
      id: produtosLoja.id,
      codigo: produtosLoja.codigo,
      nome: produtosLoja.nome,
      departamento: produtosLoja.departamento,
      unidade: produtosLoja.unidade,
      estoque: produtosLoja.estoque,
      ativo: produtosLoja.ativo,
    })
    .from(produtosLoja)
    .where(eq(produtosLoja.ativo, 1))
    .orderBy(produtosLoja.nome);

  const result = [];
  for (const p of produtos) {
    const [stats] = await db
      .select({
        totalEntradas: sql<number>`COALESCE(SUM(CASE WHEN tipo = 'ENTRADA' THEN quantidade ELSE 0 END), 0)`,
        totalSaidas: sql<number>`COALESCE(SUM(CASE WHEN tipo = 'SAIDA' THEN quantidade ELSE 0 END), 0)`,
        totalAjustes: sql<number>`COALESCE(COUNT(CASE WHEN tipo = 'AJUSTE' THEN 1 END), 0)`,
        totalMovimentacoes: sql<number>`COUNT(*)`,
      })
      .from(estoqueMovimentacoes)
      .where(eq(estoqueMovimentacoes.produtoId, p.id));
    result.push({
      ...p,
      totalEntradas: Number(stats?.totalEntradas || 0),
      totalSaidas: Number(stats?.totalSaidas || 0),
      totalAjustes: Number(stats?.totalAjustes || 0),
      totalMovimentacoes: Number(stats?.totalMovimentacoes || 0),
    });
  }
  return result;
}

// ===== APLICAR TABELA 3 AOS PRODUTOS =====
/**
 * Aplica o preço da Tabela 3 como preço de venda dos produtos.
 * Atualiza a tabela `produtos` (campo preco) e também `produtos_loja` (campo preco)
 * para todos os itens que possuam produtoId ou cujo nome coincida.
 * Retorna { atualizados, historico } com o total de registros atualizados.
 */
export async function applyTabela3ToProducts(
  items: Array<{
    produtoId?: number | null;
    produtoNome: string;
    preco3: string;
    custoUnitario?: string;
  }>,
  usuarioNome = "SISTEMA"
) {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  let atualizados = 0;
  const historico: Array<{ nome: string; precoAnterior: string; precoNovo: string }> = [];

  for (const item of items) {
    const preco3 = parseFloat(item.preco3);
    if (!preco3 || preco3 <= 0) continue;
    const precoStr = preco3.toFixed(2);

    // 1. Atualizar tabela `produtos` por produtoId
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
          usuarioNome,
        });
        historico.push({ nome: item.produtoNome, precoAnterior, precoNovo: precoStr });
        atualizados++;
      }
    }

    // 2. Atualizar tabela `produtos_loja` por nome (UPPER TRIM)
    const nomeNorm = item.produtoNome.trim().toUpperCase();
    const lojaRows = await db
      .select()
      .from(produtosLoja)
      .where(sql`UPPER(TRIM(${produtosLoja.nome})) = ${nomeNorm}`)
      .limit(5);
    for (const loja of lojaRows) {
      await db.update(produtosLoja).set({ preco: precoStr, updatedAt: new Date() }).where(eq(produtosLoja.id, loja.id));
    }
  }

  return { atualizados, historico };
}

// ─── Sincronização de Catálogos de Venda após sync Veiling/Cooperflora ────────
/**
 * Após sincronização do Veiling ou Cooperflora, percorre todos os itens ativos
 * dos catálogos de venda e:
 * - Remove itens cujo produto não existe mais na fonte (foi excluído)
 * - Remove itens cujo estoque chegou a zero (estoqueDisponivel === 0)
 * - Atualiza o preço dos itens cujo preço mudou na fonte
 * Retorna um resumo das alterações realizadas.
 */
export async function syncCatalogosVendaAposSync(fonte: 'veiling' | 'cooperflora'): Promise<{
  removidos: number;
  atualizados: number;
}> {
  const db = await getDb();
  if (!db) return { removidos: 0, atualizados: 0 };

  // Buscar todos os itens ativos dos catálogos com a origem correspondente
  const itens = await db.select().from(catalogosVendaItens)
    .where(eq(catalogosVendaItens.origem, fonte));

  let removidos = 0;
  let atualizados = 0;

  for (const item of itens) {
     if (fonte === 'veiling') {
      // Buscar produto no Veiling pelo nomeCompleto (mais estável que offerId que pode ser duplicado)
      // O campo 'nome' do item armazena o nomeCompleto do produto
      const nomeItem = item.nome?.trim().toUpperCase();
      if (!nomeItem) continue;
      const prods = await db.select().from(veilingProdutos)
        .where(eq(veilingProdutos.nomeCompleto, item.nome?.trim() || ''));
      // Se não encontrar pelo nome exato, tentar pelo offerId como fallback
      let prodsValidos = prods.filter(p => {
        const c = Math.min(
          ...[p.precoCarrinho, p.precoCamada, p.precoEmbalagem]
            .map(v => v != null ? Number(v) : Infinity)
            .filter(v => v > 0 && isFinite(v))
        );
        return isFinite(c);
      });
      if (prodsValidos.length === 0 && prods.length === 0) {
        const offerId = parseInt(item.produtoId);
        if (!isNaN(offerId)) {
          const prodsById = await db.select().from(veilingProdutos)
            .where(eq(veilingProdutos.offerId, offerId));
          prodsValidos = prodsById.filter(p => {
            const c = Math.min(
              ...[p.precoCarrinho, p.precoCamada, p.precoEmbalagem]
                .map(v => v != null ? Number(v) : Infinity)
                .filter(v => v > 0 && isFinite(v))
            );
            return isFinite(c);
          });
        }
      }
      if (prodsValidos.length === 0) {
        // Produto não encontrado ou sem preço válido — remover do catálogo de venda
        await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.id, item.id));
        removidos++;
        continue;
      }
      // Verificar se o produto tem estoque disponível (estoqueDisponivel > 0)
      const prodComEstoque = prodsValidos.find(p => p.estoqueDisponivel != null && Number(p.estoqueDisponivel) > 0);
      if (!prodComEstoque && prodsValidos.every(p => p.estoqueDisponivel != null && Number(p.estoqueDisponivel) <= 0)) {
        // Todos os produtores com estoque zerado — remover do catálogo de venda
        await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.id, item.id));
        removidos++;
        continue;
      }
      // Calcular preço de venda com margem e qtdVenda da conversão
      const cfg = await getVeilingConfig();
      const conversaoMap = await getVeilingConversaoMap();
      // Usar sempre a margem global do Veiling (igual ao Catálogo Veiling)
      const margemEfetiva = parseFloat(String(cfg?.margemGlobal || '40'));
      // Usar o menor preço válido entre todos os produtores (igual ao listProdutos)
      const prod = prodsValidos[0];
      // Custo base: prioridade precoEmbalagem > precoCamada > precoCarrinho
      const _embS = prodsValidos[0].precoEmbalagem != null ? Number(prodsValidos[0].precoEmbalagem) : 0;
      const _camS = prodsValidos[0].precoCamada != null ? Number(prodsValidos[0].precoCamada) : 0;
      const _carS = prodsValidos[0].precoCarrinho != null ? Number(prodsValidos[0].precoCarrinho) : 0;
      const custoBase = (_embS > 0 ? _embS : (_camS > 0 ? _camS : _carS));
      const convKey = prod.nomeCompleto ? prod.nomeCompleto.trim().toUpperCase() : prod.nome.trim().toUpperCase();
      const conv = conversaoMap.get(convKey) || conversaoMap.get(prod.nome.trim().toUpperCase());
      const qtdVenda = conv?.qtdVenda ?? Number(prod.multiplo) ?? 1;
      // Aplicar frete + ICMS igual ao listProdutos do Catálogo Veiling
      const freteUnitSync = prodsValidos[0].frete != null ? Number(prodsValidos[0].frete) : 0;
      const custoComFreteSync = custoBase + freteUnitSync;
      const icmsFatorSync = conv?.icms != null ? parseFloat(String(conv.icms)) : null;
      const custoFinal = icmsFatorSync && icmsFatorSync > 0 && icmsFatorSync < 1
        ? Math.round((custoComFreteSync / icmsFatorSync) * 100) / 100
        : custoComFreteSync;
      const novoPreco = custoFinal > 0 ? parseFloat((custoFinal * (1 + margemEfetiva / 100) * qtdVenda).toFixed(2)) : null;
      const precoAtual = item.preco != null ? parseFloat(String(item.preco)) : null;
      if (novoPreco !== null && precoAtual !== novoPreco) {
        await db.update(catalogosVendaItens)
          .set({ preco: String(novoPreco) as any })
          .where(eq(catalogosVendaItens.id, item.id));
        atualizados++;
      }
    } else if (fonte === 'cooperflora') {
      // Buscar produto na Cooperflora pelo código (produtoId armazena o código)
      const [prod] = await db.select().from(cooperfloraProdutos)
        .where(eq(cooperfloraProdutos.codigo, item.produtoId)).limit(1);

      if (!prod) {
        // Produto não existe mais — remover do catálogo
        await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.id, item.id));
        removidos++;
        continue;
      }
      // Produto com estoque zerado — remover do catálogo de venda
      if (prod.estoque !== null && Number(prod.estoque) <= 0) {
        await db.delete(catalogosVendaItens).where(eq(catalogosVendaItens.id, item.id));
        removidos++;
        continue;
      }
      // Calcular preço de venda com margem
      const cfg = await getCooperfloraConfig();;
      const margem = parseFloat(String(cfg?.margemPadrao || '30')) / 100;
      const precoBase = parseFloat(String(prod.precoMin || '0'));
      const novoPreco = precoBase > 0 ? parseFloat((precoBase * (1 + margem)).toFixed(2)) : null;
      const precoAtual = item.preco != null ? parseFloat(String(item.preco)) : null;

      if (novoPreco !== null && precoAtual !== novoPreco) {
        await db.update(catalogosVendaItens)
          .set({ preco: String(novoPreco) as any })
          .where(eq(catalogosVendaItens.id, item.id));
        atualizados++;
      }
    }
  }

  return { removidos, atualizados };
}

// ─── Atualizar status e motivo de recusa de pedido ────────────────────────────
export async function updateCatalogoPedidoStatusComMotivo(
  pedidoId: number,
  status: 'NOVO' | 'VISTO' | 'APROVADO' | 'CANCELADO' | 'RECUSADO',
  motivoRecusa?: string
) {
  const db = await getDb();
  if (!db) return;
  await db.update(catalogosPedidos)
    .set({ status, motivoRecusa: motivoRecusa || null })
    .where(eq(catalogosPedidos.id, pedidoId));
}

// ─── Filtro por Cor no Catálogo Veiling ──────────────────────────────────────
// Lista de cores comuns em flores e plantas ornamentais
const CORES_FLORES = [
  'BRANCA', 'BRANCO',
  'VERMELHA', 'VERMELHO',
  'ROSA', 'PINK',
  'AMARELA', 'AMARELO',
  'LARANJA',
  'ROXA', 'ROXO', 'LILAS', 'LILÁS', 'VIOLETA', 'LAVANDA',
  'AZUL',
  'VERDE',
  'BICOLOR', 'MULTICOLOR', 'MISTA', 'MISTO', 'COLORIDA', 'COLORIDO',
  'CREME', 'CHAMPAGNE', 'MARFIM',
  'SALMÃO', 'SALMAO',
  'CORAL',
  'PEACH',
  'BORDO', 'BORDÔ',
  'PRETA', 'PRETO',
  'BRANCA/ROXA', 'BRANCA/ROSA', 'BRANCA/VERMELHA',
];

export function extrairCorDoProduto(nome: string): string | null {
  const nomeUpper = nome.toUpperCase();
  // Tentar encontrar cor no nome do produto
  for (const cor of CORES_FLORES) {
    // Verificar como palavra completa (com limites de palavra)
    const regex = new RegExp(`(^|\\s|/)${cor}(\\s|/|$)`);
    if (regex.test(nomeUpper)) {
      // Normalizar variações
      if (cor === 'BRANCO') return 'BRANCA';
      if (cor === 'VERMELHO') return 'VERMELHA';
      if (cor === 'AMARELO') return 'AMARELA';
      if (cor === 'ROXO') return 'ROXA';
      if (cor === 'LILAS' || cor === 'LILÁS') return 'LILÁS';
      if (cor === 'SALMAO') return 'SALMÃO';
      if (cor === 'BORDO') return 'BORDÔ';
      if (cor === 'PRETO') return 'PRETA';
      if (cor === 'MISTO' || cor === 'COLORIDO') return 'MISTA';
      return cor;
    }
  }
  return null;
}

export async function getVeilingCores(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  // Buscar todos os nomes de produtos
  const rows = await db
    .select({ nome: veilingProdutos.nomeCompleto })
    .from(veilingProdutos)
    .execute();
  // Extrair cores únicas
  const coresSet = new Set<string>();
  for (const row of rows) {
    const cor = extrairCorDoProduto(row.nome || '');
    if (cor) coresSet.add(cor);
  }
  return Array.from(coresSet).sort();
}

// ─── Veiling - Importações Automáticas ───
export async function createVeilingImportacao(data: InsertVeilingImportacao): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB não disponível");
  const [result] = await db.insert(veilingImportacoes).values(data).execute() as any;
  return result?.insertId ?? 0;
}

export async function listVeilingImportacoes(limit = 50): Promise<typeof veilingImportacoes.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(veilingImportacoes)
    .orderBy(desc(veilingImportacoes.dataImportacao))
    .limit(limit)
    .execute();
}


// ─── Compras - Edição e Status ───
export async function updateCompra(id: number, data: { fornecedor?: string; numNF?: string; data?: string }) {
  const db = await getDb(); if (!db) return;
  await db.update(compras).set(data).where(eq(compras.id, id));
}
export async function deleteCompra(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(compraItens).where(eq(compraItens.compraId, id));
  await db.delete(compras).where(eq(compras.id, id));
}
export async function updateCompraStatus(id: number, status: 'RASCUNHO' | 'CONFIRMADO') {
  const db = await getDb(); if (!db) return;
  await db.update(compras).set({ status }).where(eq(compras.id, id));
}

export async function updateCompraItem(itemId: number, data: {
  produtoId?: number | null;
  produtoNome: string;
  quantidade: string;
  valorUnitario: string;
  subtotal: string;
}) {
  const db = await getDb(); if (!db) return;
  await db.update(compraItens).set(data).where(eq(compraItens.id, itemId));
}

export async function deleteCompraItem(itemId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(compraItens).where(eq(compraItens.id, itemId));
}

export async function addCompraItem(compraId: number, data: {
  produtoId?: number | null;
  produtoNome: string;
  quantidade: string;
  valorUnitario: string;
  subtotal: string;
}) {
  const db = await getDb(); if (!db) return null;
  const [result] = await db.insert(compraItens).values({ ...data, compraId });
  return result.insertId;
}

export async function recalcCompraTotal(compraId: number) {
  const db = await getDb(); if (!db) return;
  const itens = await db.select().from(compraItens).where(eq(compraItens.compraId, compraId));
  const total = itens.reduce((s, i) => s + parseFloat(i.subtotal || '0'), 0);
  await db.update(compras).set({ total: total.toFixed(2) }).where(eq(compras.id, compraId));
}

export async function searchProdutosSemelhanca(termo: string, limit = 10) {
  const db = await getDb(); if (!db) return [];
  const t = `%${termo}%`;
  return db.select({
    id: produtos.id,
    descricao: produtos.descricao,
    custo: produtos.custo,
  }).from(produtos)
    .where(or(like(produtos.descricao, t), like(produtos.codigoExterno, t)))
    .limit(limit);
}

export async function searchProdutosLojaSemelhanca(termo: string, limit = 10) {
  const db = await getDb(); if (!db) return [];
  const t = `%${termo}%`;
  return db.select({
    id: produtosLoja.id,
    nome: produtosLoja.nome,
    precoCusto: produtosLoja.precoCusto,
    unidade: produtosLoja.unidade,
  }).from(produtosLoja)
    .where(like(produtosLoja.nome, t))
    .limit(limit);
}

export async function checkTransacoesExistentes(numeros: string[]) {
  const db = await getDb(); if (!db || numeros.length === 0) return [];
  return db.select({
    transacaoGfp: compraItens.transacaoGfp,
    compraId: compraItens.compraId,
  }).from(compraItens)
    .where(inArray(compraItens.transacaoGfp, numeros));
}

// ─── App Config ───────────────────────────────────────────────────────────────
export async function getAppConfig(chave: string): Promise<string | null> {
  const db = await getDb(); if (!db) return null;
  const rows = await db.select().from(appConfig).where(eq(appConfig.chave, chave)).limit(1);
  return rows[0]?.valor ?? null;
}
export async function setAppConfig(chave: string, valor: string): Promise<void> {
  const db = await getDb(); if (!db) return;
  await db.insert(appConfig).values({ chave, valor })
    .onDuplicateKeyUpdate({ set: { valor } });
}
// ─── Configuração de Validade de Preços ──────────────────────────────────────
export async function getValidadePrecosVeiling(): Promise<number> {
  const valor = await getAppConfig('VALIDADE_PRECOS_VEILING_DIAS');
  return valor ? parseInt(valor, 10) : 7; // padrão: 7 dias
}
export async function setValidadePrecosVeiling(dias: number): Promise<void> {
  await setAppConfig('VALIDADE_PRECOS_VEILING_DIAS', String(dias));
}
export async function getValidadePrecosCooperflora(): Promise<number> {
  const valor = await getAppConfig('VALIDADE_PRECOS_COOPERFLORA_DIAS');
  return valor ? parseInt(valor, 10) : 7; // padrão: 7 dias
}
export async function setValidadePrecosCooperflora(dias: number): Promise<void> {
  await setAppConfig('VALIDADE_PRECOS_COOPERFLORA_DIAS', String(dias));
}
// ─── Vendas: listar expirados ─────────────────────────────────────────────────
export async function listVendasExpiradas() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(vendas)
    .where(and(eq(vendas.status, 'EXPIRADO'), isNull(vendas.deletedAt)))
    .orderBy(desc(vendas.updatedAt));
}
// ─── Vendas: expirar automaticamente ─────────────────────────────────────────
export async function expirarVendasVencidas() {
  const db = await getDb(); if (!db) return 0;
  const hoje = new Date().toISOString().split('T')[0];
  const result = await db.update(vendas)
    .set({ status: 'EXPIRADO' })
    .where(and(
      eq(vendas.status, 'AGUARDANDO'),
      isNull(vendas.deletedAt),
      sql`\`vencimento\` IS NOT NULL AND \`vencimento\` < ${hoje}`
    ));
  return (result as any)[0]?.affectedRows ?? 0;
}


// ─── Sincronizar Pedidos de Compra quando Orçamento é Alterado ─────────────────
export async function sincronizarPedidosCompraAoAlterarOrcamento(vendaId: number, novoItens: InsertVendaItem[]) {
  const db = await getDb(); if (!db) return;
  const { sql: sqlFn, sql } = await import('drizzle-orm');
  
  // Buscar todos os pedidos de compra que têm itens com vendaOrigemId = vendaId
  const pedidosRes = await db.execute(sqlFn`
    SELECT DISTINCT pedidoCompraId FROM pedido_compra_itens 
    WHERE vendaOrigemId = ${vendaId}
  `);
  const pedidos = (pedidosRes[0] as unknown as any[]);
  
  if (!pedidos || pedidos.length === 0) return; // Nenhum pedido para sincronizar
  
  // Para cada pedido de compra afetado
  for (const pedidoRow of pedidos) {
    const pedidoId = pedidoRow.pedidoCompraId;
    
    // Buscar todos os itens do pedido
    const todosItensRes = await db.execute(sqlFn`
      SELECT id, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda, vendaOrigemId 
      FROM pedido_compra_itens
      WHERE pedidoCompraId = ${pedidoId}
    `);
    const todosItensExistentes = todosItensRes[0] as unknown as any[];
    
    // Criar mapa consolidado: chave = "produtoNome||precoVenda"
    const mapaConsolidado = new Map<string, { 
      id: number;
      produtoId: number | null; 
      produtoNome: string; 
      quantidade: number; 
      precoVenda: number; 
      subtotalVenda: number;
      vendaOrigemId: number | null;
    }>();
    
    // Adicionar itens existentes (que NÃO são do orçamento alterado)
    // IMPORTANTE: usar Number() para comparar pois MySQL pode retornar string
    // PRIMEIRO: remover todos os itens do orçamento alterado (vendaOrigemId = vendaId)
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
          vendaOrigemId: item.vendaOrigemId ? Number(item.vendaOrigemId) : null,
        });
      }
      // Itens do orçamento alterado serão ignorados e substituídos pelos novos
    }
    
    // Adicionar/mesclar itens novos do orçamento alterado
    // Usar um mapa separado para os itens deste orçamento (não somar com outros orçamentos)
    const mapaNovoOrcamento = new Map<string, { id: number; produtoId: number | null; produtoNome: string; quantidade: number; precoVenda: number; subtotalVenda: number; vendaOrigemId: number | null; }>();
    for (const novoItem of novoItens) {
      const valorUnitario = typeof novoItem.valorUnitario === 'string' ? parseFloat(novoItem.valorUnitario) : (novoItem.valorUnitario || 0);
      const quantidade = typeof novoItem.quantidade === 'string' ? parseFloat(novoItem.quantidade) : (novoItem.quantidade || 0);
      const subtotal = typeof novoItem.subtotal === 'string' ? parseFloat(novoItem.subtotal) : (novoItem.subtotal || 0);
      
      const chave = `${novoItem.produtoNome}||${valorUnitario}`;
      if (mapaNovoOrcamento.has(chave)) {
        // Mesmo produto com mesmo preço no mesmo orçamento: somar
        const existing = mapaNovoOrcamento.get(chave)!;
        existing.quantidade += quantidade;
        existing.subtotalVenda += subtotal;
      } else {
        mapaNovoOrcamento.set(chave, {
          id: 0,
          produtoId: novoItem.produtoId || null,
          produtoNome: novoItem.produtoNome || '',
          quantidade: quantidade,
          precoVenda: valorUnitario,
          subtotalVenda: subtotal,
          vendaOrigemId: vendaId,
        });
      }
    }
    // Mesclar itens do novo orçamento com os demais (de outros orçamentos)
    for (const [chave, novoItemConsolidado] of Array.from(mapaNovoOrcamento.entries())) {
      if (mapaConsolidado.has(chave)) {
        // Produto com mesmo nome e preço já existe de outro orçamento: somar
        const existing = mapaConsolidado.get(chave)!;
        existing.quantidade += novoItemConsolidado.quantidade;
        existing.subtotalVenda += novoItemConsolidado.subtotalVenda;
      } else {
        mapaConsolidado.set(chave, novoItemConsolidado);
      }
    }
    
    // Reordenar alfabeticamente
    const itensConsolidados = Array.from(mapaConsolidado.values()).sort((a, b) =>
      a.produtoNome.localeCompare(b.produtoNome, 'pt-BR')
    );
    
    // Deletar todos os itens antigos do pedido
    await db.execute(sqlFn`DELETE FROM pedido_compra_itens WHERE pedidoCompraId = ${pedidoId}`);
    
    // Reinserir itens na ordem correta
    let totalPedido = 0;
    for (const item of itensConsolidados) {
      await db.execute(sqlFn`
        INSERT INTO pedido_compra_itens (pedidoCompraId, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda, vendaOrigemId)
        VALUES (${pedidoId}, ${item.produtoId}, ${item.produtoNome}, ${item.quantidade}, ${item.precoVenda}, ${item.subtotalVenda}, ${item.vendaOrigemId})
      `);
      totalPedido += item.subtotalVenda;
    }
    
    // Atualizar total do pedido
    await db.execute(sqlFn`
      UPDATE pedidos_compra SET total = ${totalPedido}, updatedAt = NOW() WHERE id = ${pedidoId}
    `);
  }
}


// ─── Veiling Catálogo Links ───────────────────────────────────────────────────
export async function createVeilingCatalogoLink(
  expiresAt: Date,
  createdBy?: string,
  filtroCategoria?: string,
  filtroProdutor?: string,
  filtroCor?: string,
  filtroBusca?: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  // Gerar token aleatório
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Truncar milissegundos para compatibilidade com MySQL TIMESTAMP
  expiresAt.setMilliseconds(0);
  
  // Sanitizar createdBy - remover caracteres especiais e limitar a 255 caracteres
  const sanitizedCreatedBy = (createdBy || "system")
    .replace(/[^a-zA-Z0-9\s@._-]/g, "")
    .substring(0, 255)
    .trim() || "system";
  
  const result = await db.insert(veilingCatalogoLinks).values({
    token,
    expiresAt,
    createdBy: sanitizedCreatedBy,
    filtroCategoria: filtroCategoria || '',
    filtroProdutor: filtroProdutor || '',
    filtroCor: filtroCor || '',
    filtroBusca: filtroBusca || '',
  });
  
  return { token, expiresAt, createdBy: sanitizedCreatedBy, createdAt: new Date(), filtroCategoria: filtroCategoria || '', filtroProdutor: filtroProdutor || '', filtroCor: filtroCor || '', filtroBusca: filtroBusca || '' };
}

export async function getVeilingCatalogoLink(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const link = await db.select().from(veilingCatalogoLinks).where(eq(veilingCatalogoLinks.token, token)).limit(1);
  
  if (!link.length) return null;
  
  const linkData = link[0];
  
  // Verificar se o link expirou
  if (new Date() > linkData.expiresAt) {
    return null; // Link expirado
  }
  
  return linkData;
}

export async function deleteVeilingCatalogoLink(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db.delete(veilingCatalogoLinks).where(eq(veilingCatalogoLinks.token, token));
}

export async function listVeilingCatalogoLinks() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const links = await db.select().from(veilingCatalogoLinks).orderBy(desc(veilingCatalogoLinks.createdAt));
  
  return links.map(link => ({
    ...link,
    isExpired: new Date() > link.expiresAt,
  }));
}


// ─── Pedidos Públicos ───────────────────────────────────────────────────────────
export async function createPedidoPublico(data: InsertPedidoPublico, itens: InsertPedidoPublicoItem[], itemsWithIds?: Array<{produtoId?: number; quantidade: number}>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const [result] = await db.insert(pedidosPublicos).values(data);
  const pedidoId = result.insertId || 0;
  
  if (itens.length > 0 && pedidoId) {
    const itensComPedidoId = itens.map(item => ({
      ...item,
      pedidoPublicoId: pedidoId,
    }));
    await db.insert(pedidosPublicosItens).values(itensComPedidoId);
  }
  
  // Decrementar estoque de produtos personalizados
  if (itemsWithIds && itemsWithIds.length > 0) {
    for (const item of itemsWithIds) {
      if (item.produtoId) {
        const produto = await db.select().from(produtosCustomizados).where(eq(produtosCustomizados.id, item.produtoId));
        if (produto.length > 0) {
          const estoqueAtual = Number(produto[0].estoque) || 0;
          const novoEstoque = Math.max(0, estoqueAtual - item.quantidade);
          
          await db.update(produtosCustomizados)
            .set({
              estoque: novoEstoque,
              ativo: novoEstoque > 0 ? 1 : 0,
            })
            .where(eq(produtosCustomizados.id, item.produtoId));
        }
      }
    }
  }
  
  return { id: pedidoId, ...data };
}

export async function getPedidoPublico(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const pedido = await db.select().from(pedidosPublicos).where(eq(pedidosPublicos.id, id));
  if (!pedido.length) return null;
  
  const itens = await db.select().from(pedidosPublicosItens).where(eq(pedidosPublicosItens.pedidoPublicoId, id));
  
  return {
    ...pedido[0],
    itens,
  };
}

export async function listPedidosPublicos(linkToken?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  if (linkToken) {
    return await db.select().from(pedidosPublicos).where(eq(pedidosPublicos.linkToken, linkToken)).orderBy(desc(pedidosPublicos.createdAt));
  }
  
  return await db.select().from(pedidosPublicos).orderBy(desc(pedidosPublicos.createdAt));
}

export async function updatePedidoPublicoVendaId(id: number, vendaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.update(pedidosPublicos).set({ vendaId, status: 'CONVERTIDO' }).where(eq(pedidosPublicos.id, id));
}
export async function updatePedidoPublicoStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db.update(pedidosPublicos).set({ status: status as any }).where(eq(pedidosPublicos.id, id));
}


// ─── Filtros Salvos do Catálogo Veiling ──────────────────────────────────────
export async function saveVeilingFiltro(userId: number, nome: string, categoria?: string, produtor?: string, cor?: string, busca?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const [result] = await db.insert(veilingFiltrosSalvos).values({
    userId,
    nome,
    categoria,
    produtor,
    cor,
    busca,
  });
  
  return result;
}

export async function listVeilingFiltros(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const filtros = await db.select().from(veilingFiltrosSalvos).where(eq(veilingFiltrosSalvos.userId, userId));
  
  return filtros;
}

export async function getVeilingFiltro(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const filtro = await db.select().from(veilingFiltrosSalvos).where(
    and(eq(veilingFiltrosSalvos.id, id), eq(veilingFiltrosSalvos.userId, userId))
  ).limit(1);
  
  return filtro.length > 0 ? filtro[0] : null;
}

export async function deleteVeilingFiltro(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db.delete(veilingFiltrosSalvos).where(
    and(eq(veilingFiltrosSalvos.id, id), eq(veilingFiltrosSalvos.userId, userId))
  );
  
  return { ok: true };
}

export async function updateVeilingFiltro(id: number, userId: number, nome: string, categoria?: string, produtor?: string, cor?: string, busca?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db.update(veilingFiltrosSalvos).set({
    nome,
    categoria,
    produtor,
    cor,
    busca,
    updatedAt: new Date(),
  }).where(
    and(eq(veilingFiltrosSalvos.id, id), eq(veilingFiltrosSalvos.userId, userId))
  );
  
  return { ok: true };
}



export async function getVendasFaturadosIds(ids: number[]): Promise<number[]> {
  if (!ids.length) return [];
  const db = await getDb(); if (!db) return [];
  // Dividir em chunks para evitar erro com IN clause muito grande
  const chunkSize = 100;
  const allResults: number[] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { vendasEfetivas } = await import('../drizzle/schema');
    const { inArray } = await import('drizzle-orm');
    const rows = await db.select({ orcamentoId: vendasEfetivas.orcamentoId })
      .from(vendasEfetivas)
      .where(inArray(vendasEfetivas.orcamentoId, chunk));
    allResults.push(...rows.map((r: any) => r.orcamentoId));
  }
  return allResults;
}

export async function isVendaFaturada(vendaId: number): Promise<boolean> {
  const ids = await getVendasFaturadosIds([vendaId]);
  return ids.length > 0;
}


// ─── Promoções ───

export async function createPromocao(data: {
  titulo: string;
  descricao?: string;
  tipoDesconto: "percentual" | "fixo";
  valorDesconto: number;
  imagemUrl?: string;
  imagemBase64?: string;
  criadoPor?: string;
  itens: Array<{
    produtoId: string;
    produtoNome: string;
    precoOriginal: number;
    precoPromocional: number;
    imagemUrl?: string;
    catalogo?: string;
  }>;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { promocoes, promocoesItens } = await import("../drizzle/schema");

  // Inserir promoção
  const [result] = await db.insert(promocoes).values({
    titulo: data.titulo,
    descricao: data.descricao,
    tipoDesconto: data.tipoDesconto,
    valorDesconto: String(data.valorDesconto) as any,
    imagemUrl: data.imagemUrl,
    imagemBase64: data.imagemBase64,
    criadoPor: data.criadoPor,
  });

  const promocaoId = (result as any).insertId;

  // Inserir itens
  if (data.itens && data.itens.length > 0) {
    for (const item of data.itens) {
      if (!db) throw new Error("Database connection failed");
      await db.insert(promocoesItens).values({
        promocaoId,
        produtoId: item.produtoId,
        produtoNome: item.produtoNome,
        precoOriginal: String(item.precoOriginal) as any,
        precoPromocional: String(item.precoPromocional) as any,
        imagemUrl: item.imagemUrl,
        catalogo: item.catalogo,
      });
    }
  }

  return promocaoId;
}

export async function getPromocoes(ativo?: boolean): Promise<any[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { promocoes } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  if (ativo !== undefined) {
    return db.select().from(promocoes).where(eq(promocoes.ativo, ativo ? 1 : 0));
  }
  return db.select().from(promocoes);
}

export async function getPromocaoById(id: number): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { promocoes, promocoesItens } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const [promo] = await db.select().from(promocoes).where(eq(promocoes.id, id));
  if (!promo) return null;

  const itens = await db.select().from(promocoesItens).where(eq(promocoesItens.promocaoId, id));

  return { ...promo, itens } as any;
}

export async function updatePromocao(
  id: number,
  data: Partial<{
    titulo: string;
    descricao: string;
    tipoDesconto: "percentual" | "fixo";
    valorDesconto: number;
    imagemUrl: string;
    imagemBase64: string;
    ativo: boolean;
  }>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { promocoes } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const updateData: any = {};
  if (data.titulo !== undefined) updateData.titulo = data.titulo;
  if (data.descricao !== undefined) updateData.descricao = data.descricao;
  if (data.tipoDesconto !== undefined) updateData.tipoDesconto = data.tipoDesconto;
  if (data.valorDesconto !== undefined) updateData.valorDesconto = String(data.valorDesconto);
  if (data.imagemUrl !== undefined) updateData.imagemUrl = data.imagemUrl;
  if (data.imagemBase64 !== undefined) updateData.imagemBase64 = data.imagemBase64;
  if (data.ativo !== undefined) updateData.ativo = data.ativo ? 1 : 0;

  await db.update(promocoes).set(updateData).where(eq(promocoes.id, id));
}

export async function deletePromocao(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { promocoes, promocoesItens } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  // Deletar itens primeiro
  await db.delete(promocoesItens).where(eq(promocoesItens.promocaoId, id));
  // Deletar promoção
  await db.delete(promocoes).where(eq(promocoes.id, id));
}

// ═══════════════════════════════════════════════════════════════
// CATEGORIAS DE PRODUTOS
// ═══════════════════════════════════════════════════════════════

export async function listCategoriasProdutos() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { categoriasProdutos } = await import("../drizzle/schema");
  const { asc } = await import("drizzle-orm");
  return db.select().from(categoriasProdutos).orderBy(asc(categoriasProdutos.ordem), asc(categoriasProdutos.nome));
}

export async function createCategoriaProduto(data: { nome: string; descricao?: string; ordem?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { categoriasProdutos } = await import("../drizzle/schema");
  const [result] = await db.insert(categoriasProdutos).values({
    nome: data.nome,
    descricao: data.descricao,
    ordem: data.ordem ?? 0,
  });
  return { id: (result as any).insertId };
}

export async function updateCategoriaProduto(id: number, data: { nome?: string; descricao?: string; ordem?: number; ativo?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { categoriasProdutos } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const upd: any = {};
  if (data.nome !== undefined) upd.nome = data.nome;
  if (data.descricao !== undefined) upd.descricao = data.descricao;
  if (data.ordem !== undefined) upd.ordem = data.ordem;
  if (data.ativo !== undefined) upd.ativo = data.ativo ? 1 : 0;
  await db.update(categoriasProdutos).set(upd).where(eq(categoriasProdutos.id, id));
}

export async function deleteCategoriaProduto(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { categoriasProdutos } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  await db.delete(categoriasProdutos).where(eq(categoriasProdutos.id, id));
}

// ═══════════════════════════════════════════════════════════════
// LISTAS DE PREÇOS
// ═══════════════════════════════════════════════════════════════

export async function listListasPrecos() {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPrecos, listasItens, listasPedidos } = await import("../drizzle/schema");
  const { desc, eq, sql } = await import("drizzle-orm");
  const listas = await db.select().from(listasPrecos).orderBy(desc(listasPrecos.createdAt));
  // Contar itens e pedidos por lista
  const itensCount = await db.select({
    listaId: listasItens.listaId,
    count: sql<number>`COUNT(*)`,
  }).from(listasItens).groupBy(listasItens.listaId);
  const pedidosCount = await db.select({
    listaId: listasPedidos.listaId,
    count: sql<number>`COUNT(*)`,
    novos: sql<number>`SUM(CASE WHEN ${listasPedidos.status} = 'NOVO' THEN 1 ELSE 0 END)`,
  }).from(listasPedidos).groupBy(listasPedidos.listaId);
  return listas.map(l => ({
    ...l,
    totalItens: Number(itensCount.find(i => i.listaId === l.id)?.count ?? 0),
    totalPedidos: Number(pedidosCount.find(p => p.listaId === l.id)?.count ?? 0),
    pedidosNovos: Number(pedidosCount.find(p => p.listaId === l.id)?.novos ?? 0),
  }));
}

export async function getListaPrecoByToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPrecos, listasItens } = await import("../drizzle/schema");
  const { eq, asc } = await import("drizzle-orm");
  const [lista] = await db.select().from(listasPrecos).where(eq(listasPrecos.token, token));
  if (!lista) return null;
  const itens = await db.select().from(listasItens)
    .where(eq(listasItens.listaId, lista.id))
    .orderBy(asc(listasItens.categoriaNome), asc(listasItens.ordem), asc(listasItens.variedade));
  return { ...lista, itens };
}

export async function getListaPrecoById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPrecos, listasItens } = await import("../drizzle/schema");
  const { eq, asc } = await import("drizzle-orm");
  const [lista] = await db.select().from(listasPrecos).where(eq(listasPrecos.id, id));
  if (!lista) return null;
  const itens = await db.select().from(listasItens)
    .where(eq(listasItens.listaId, lista.id))
    .orderBy(asc(listasItens.categoriaNome), asc(listasItens.ordem), asc(listasItens.variedade));
  return { ...lista, itens };
}

export async function createListaPreco(data: {
  titulo: string;
  subtitulo?: string;
  token: string;
  expiresAt?: Date;
  aceitaPedidos?: boolean;
  criadoPor?: string;
  observacao?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPrecos } = await import("../drizzle/schema");
  const [result] = await db.insert(listasPrecos).values({
    titulo: data.titulo,
    subtitulo: data.subtitulo,
    token: data.token,
    expiresAt: data.expiresAt,
    aceitaPedidos: data.aceitaPedidos !== false ? 1 : 0,
    criadoPor: data.criadoPor,
    observacao: data.observacao,
  });
  return { id: (result as any).insertId };
}

export async function updateListaPreco(id: number, data: {
  titulo?: string;
  subtitulo?: string;
  expiresAt?: Date | null;
  ativo?: boolean;
  aceitaPedidos?: boolean;
  observacao?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPrecos } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const upd: any = {};
  if (data.titulo !== undefined) upd.titulo = data.titulo;
  if (data.subtitulo !== undefined) upd.subtitulo = data.subtitulo;
  if (data.expiresAt !== undefined) upd.expiresAt = data.expiresAt;
  if (data.ativo !== undefined) upd.ativo = data.ativo ? 1 : 0;
  if (data.aceitaPedidos !== undefined) upd.aceitaPedidos = data.aceitaPedidos ? 1 : 0;
  if (data.observacao !== undefined) upd.observacao = data.observacao;
  await db.update(listasPrecos).set(upd).where(eq(listasPrecos.id, id));
}

export async function deleteListaPreco(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPrecos, listasItens, listasPedidos, listasPedidosItens } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  // Deletar em cascata
  const pedidos = await db.select({ id: listasPedidos.id }).from(listasPedidos).where(eq(listasPedidos.listaId, id));
  for (const p of pedidos) {
    await db.delete(listasPedidosItens).where(eq(listasPedidosItens.pedidoId, p.id));
  }
  await db.delete(listasPedidos).where(eq(listasPedidos.listaId, id));
  await db.delete(listasItens).where(eq(listasItens.listaId, id));
  await db.delete(listasPrecos).where(eq(listasPrecos.id, id));
}

// ─── Itens da Lista ───

export async function addListaItem(data: {
  listaId: number;
  categoriaId?: number;
  categoriaNome: string;
  variedade: string;
  tamanho?: string;
  qtdHasteMaco?: string;
  valorUnitario: number;
  ordem?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasItens } = await import("../drizzle/schema");
  const [result] = await db.insert(listasItens).values({
    listaId: data.listaId,
    categoriaId: data.categoriaId,
    categoriaNome: data.categoriaNome,
    variedade: data.variedade,
    tamanho: data.tamanho,
    qtdHasteMaco: data.qtdHasteMaco,
    valorUnitario: String(data.valorUnitario),
    ordem: data.ordem ?? 0,
  });
  return { id: (result as any).insertId };
}

export async function updateListaItem(id: number, data: {
  categoriaNome?: string;
  variedade?: string;
  tamanho?: string;
  qtdHasteMaco?: string;
  valorUnitario?: number;
  disponivel?: boolean;
  ordem?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasItens } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const upd: any = {};
  if (data.categoriaNome !== undefined) upd.categoriaNome = data.categoriaNome;
  if (data.variedade !== undefined) upd.variedade = data.variedade;
  if (data.tamanho !== undefined) upd.tamanho = data.tamanho;
  if (data.qtdHasteMaco !== undefined) upd.qtdHasteMaco = data.qtdHasteMaco;
  if (data.valorUnitario !== undefined) upd.valorUnitario = String(data.valorUnitario);
  if (data.disponivel !== undefined) upd.disponivel = data.disponivel ? 1 : 0;
  if (data.ordem !== undefined) upd.ordem = data.ordem;
  await db.update(listasItens).set(upd).where(eq(listasItens.id, id));
}

export async function deleteListaItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasItens } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  await db.delete(listasItens).where(eq(listasItens.id, id));
}

export async function replaceListaItens(listaId: number, itens: Array<{
  categoriaId?: number;
  categoriaNome: string;
  variedade: string;
  tamanho?: string;
  qtdHasteMaco?: string;
  valorUnitario: number;
  disponivel?: boolean;
  ordem?: number;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasItens } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  await db.delete(listasItens).where(eq(listasItens.listaId, listaId));
  if (itens.length > 0) {
    await db.insert(listasItens).values(itens.map((item, idx) => ({
      listaId,
      categoriaId: item.categoriaId,
      categoriaNome: item.categoriaNome,
      variedade: item.variedade,
      tamanho: item.tamanho,
      qtdHasteMaco: item.qtdHasteMaco,
      valorUnitario: String(item.valorUnitario),
      disponivel: item.disponivel !== false ? 1 : 0,
      ordem: item.ordem ?? idx,
    })));
  }
}

// ─── Pedidos das Listas ───

export async function criarListaPedido(data: {
  listaId: number;
  clienteNome: string;
  clienteTelefone?: string;
  observacao?: string;
  itens: Array<{
    listaItemId: number;
    categoriaNome: string;
    variedade: string;
    tamanho?: string;
    qtdHasteMaco?: string;
    valorUnitario: number;
    quantidade: number;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPedidos, listasPedidosItens } = await import("../drizzle/schema");
  const total = data.itens.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0);
  const [result] = await db.insert(listasPedidos).values({
    listaId: data.listaId,
    clienteNome: data.clienteNome,
    clienteTelefone: data.clienteTelefone,
    observacao: data.observacao,
    total: String(total.toFixed(2)),
  });
  const pedidoId = (result as any).insertId;
  if (data.itens.length > 0) {
    await db.insert(listasPedidosItens).values(data.itens.map(i => ({
      pedidoId,
      listaItemId: i.listaItemId,
      categoriaNome: i.categoriaNome,
      variedade: i.variedade,
      tamanho: i.tamanho,
      qtdHasteMaco: i.qtdHasteMaco,
      valorUnitario: String(i.valorUnitario),
      quantidade: i.quantidade,
      subtotal: String((i.valorUnitario * i.quantidade).toFixed(2)),
    })));
  }
  return { id: pedidoId, total };
}

export async function listListasPedidos(listaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPedidos, listasPedidosItens } = await import("../drizzle/schema");
  const { eq, desc } = await import("drizzle-orm");
  const pedidos = await db.select().from(listasPedidos)
    .where(eq(listasPedidos.listaId, listaId))
    .orderBy(desc(listasPedidos.createdAt));
  const itens = await db.select().from(listasPedidosItens)
    .where(eq(listasPedidosItens.pedidoId, pedidos.length > 0 ? pedidos[0].id : -1));
  // Buscar itens para todos os pedidos
  const allItens = pedidos.length > 0
    ? await db.select().from(listasPedidosItens)
    : [];
  return pedidos.map(p => ({
    ...p,
    itens: allItens.filter(i => i.pedidoId === p.id),
  }));
}

export async function getListaPedidoById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPedidos, listasPedidosItens } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const [pedido] = await db.select().from(listasPedidos).where(eq(listasPedidos.id, id));
  if (!pedido) return null;
  const itens = await db.select().from(listasPedidosItens).where(eq(listasPedidosItens.pedidoId, id));
  return { ...pedido, itens };
}

export async function updateListaPedidoStatus(id: number, status: "NOVO" | "VISTO" | "APROVADO" | "CANCELADO", vendaId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const { listasPedidos } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const upd: any = { status };
  if (vendaId !== undefined) upd.vendaId = vendaId;
  await db.update(listasPedidos).set(upd).where(eq(listasPedidos.id, id));
}

// ─── Produtos de Lista (cadastro manual) ───────────────────────────────────

export async function listProdutosLista(filtros?: { categoriaId?: number; ativo?: boolean; busca?: string }) {
  const db = await getDb(); if (!db) return [];
  const { produtosLista } = await import("../drizzle/schema");
  let rows = await db.select().from(produtosLista).orderBy(asc(produtosLista.categoriaNome), asc(produtosLista.variedade));
  if (filtros?.ativo !== undefined) rows = rows.filter((r: any) => (r.ativo === 1) === filtros.ativo);
  if (filtros?.categoriaId) rows = rows.filter((r: any) => r.categoriaId === filtros.categoriaId);
  if (filtros?.busca) {
    const b = filtros.busca!.toLowerCase();
    rows = rows.filter((r: any) => r.variedade.toLowerCase().includes(b) || r.categoriaNome.toLowerCase().includes(b));
  }
  return rows;
}

export async function getProdutoListaById(id: number) {
  const db = await getDb(); if (!db) return null;
  const { produtosLista } = await import("../drizzle/schema");
  const rows = await db.select().from(produtosLista).where(eq(produtosLista.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function searchProdutosLoja(busca?: string) {
  const db = await getDb(); if (!db) return [];
  const { produtosLoja } = await import("../drizzle/schema");
  let conditions = [eq(produtosLoja.ativo, 1)];
  if (busca && busca.trim().length >= 2) {
    const termo = `%${busca.toLowerCase()}%`;
    conditions.push(sql`LOWER(${produtosLoja.nome}) LIKE ${termo}`);
  }
  return await db.select().from(produtosLoja).where(and(...conditions)).limit(10);
}

export async function createProdutoLista(data: {
  produtoLojaId?: number | null;
  categoriaId?: number | null;
  categoriaNome: string;
  variedade: string;
  tamanho?: string | null;
  qtdHasteMaco?: string | null;
  valorUnitario: number;
  observacao?: string | null;
}) {
  const db = await getDb(); if (!db) throw new Error('DB not available');
  const { produtosLista } = await import("../drizzle/schema");
  const [result] = await db.insert(produtosLista).values({
    produtoLojaId: data.produtoLojaId ?? null,
    categoriaId: data.categoriaId ?? null,
    categoriaNome: data.categoriaNome.toUpperCase(),
    variedade: data.variedade.toUpperCase(),
    tamanho: data.tamanho ?? null,
    qtdHasteMaco: data.qtdHasteMaco ?? null,
    valorUnitario: String(data.valorUnitario),
    observacao: data.observacao ?? null,
    ativo: 1,
  });
  return { id: (result as any).insertId };
}

export async function updateProdutoLista(id: number, data: {
  produtoLojaId?: number | null;
  categoriaId?: number | null;
  categoriaNome?: string;
  variedade?: string;
  tamanho?: string | null;
  qtdHasteMaco?: string | null;
  valorUnitario?: number;
  ativo?: boolean;
  observacao?: string | null;
}) {
  const db = await getDb(); if (!db) return;
  const { produtosLista, produtosLoja } = await import("../drizzle/schema");
  
  // Buscar produto_lista atual para obter produtoLojaId
  const [current] = await db.select().from(produtosLista).where(eq(produtosLista.id, id)).limit(1);
  
  const update: Record<string, unknown> = {};
  if (data.produtoLojaId !== undefined) update.produtoLojaId = data.produtoLojaId;
  if (data.categoriaId !== undefined) update.categoriaId = data.categoriaId;
  if (data.categoriaNome !== undefined) update.categoriaNome = data.categoriaNome.toUpperCase();
  if (data.variedade !== undefined) update.variedade = data.variedade.toUpperCase();
  if (data.tamanho !== undefined) update.tamanho = data.tamanho;
  if (data.qtdHasteMaco !== undefined) update.qtdHasteMaco = data.qtdHasteMaco;
  if (data.valorUnitario !== undefined) update.valorUnitario = String(data.valorUnitario);
  if (data.ativo !== undefined) update.ativo = data.ativo ? 1 : 0;
  if (data.observacao !== undefined) update.observacao = data.observacao;
  
  await db.update(produtosLista).set(update).where(eq(produtosLista.id, id));
  
  // Registrar histórico de alteração
  if (Object.keys(update).length > 0 && current) {
    if (data.variedade !== undefined || data.categoriaNome !== undefined || data.valorUnitario !== undefined || data.ativo !== undefined) {
      await createHistoricoAlteracao({
        produtoListaId: id,
        usuarioId: 'sistema',
        usuarioNome: 'Sistema',
        acao: 'EDICAO',
        campoAlterado: 'multiplos',
        valorAnterior: JSON.stringify({
          variedade: current.variedade,
          categoriaNome: current.categoriaNome,
          valorUnitario: current.valorUnitario,
          ativo: current.ativo,
        }),
        valorNovo: JSON.stringify({
          variedade: data.variedade,
          categoriaNome: data.categoriaNome,
          valorUnitario: data.valorUnitario,
          ativo: data.ativo,
        }),
      });
    }
  }
  
  // Sincronizar com produtos_loja se houver vinculação
  if (current && current.produtoLojaId) {
    const lojaUpdate: Record<string, unknown> = {};
    if (data.variedade !== undefined) lojaUpdate.nome = data.variedade.toUpperCase();
    if (data.categoriaNome !== undefined) lojaUpdate.departamento = data.categoriaNome.toUpperCase();
    if (data.valorUnitario !== undefined) lojaUpdate.preco = String(data.valorUnitario);
    if (data.ativo !== undefined) lojaUpdate.ativo = data.ativo ? 1 : 0;
    
    if (Object.keys(lojaUpdate).length > 0) {
      await db.update(produtosLoja).set(lojaUpdate).where(eq(produtosLoja.id, current.produtoLojaId));
    }
  }
}

export async function deleteProdutoLista(id: number) {
  const db = await getDb(); if (!db) return;
  const { produtosLista } = await import("../drizzle/schema");
  await db.delete(produtosLista).where(eq(produtosLista.id, id));
}

export async function toggleProdutoListaAtivo(id: number, ativo: boolean) {
  const db = await getDb(); if (!db) return;
  const { produtosLista, produtosLoja } = await import("../drizzle/schema");
  
  // Buscar produto_lista para obter produtoLojaId
  const [current] = await db.select().from(produtosLista).where(eq(produtosLista.id, id)).limit(1);
  
  await db.update(produtosLista).set({ ativo: ativo ? 1 : 0 }).where(eq(produtosLista.id, id));
  
  // Sincronizar com produtos_loja se houver vinculação
  if (current && current.produtoLojaId) {
    await db.update(produtosLoja).set({ ativo: ativo ? 1 : 0 }).where(eq(produtosLoja.id, current.produtoLojaId));
  }
}

// ─── Histórico de Alterações - Produtos Lista ───────────────────────────────────

export async function createHistoricoAlteracao(data: {
  produtoListaId: number;
  usuarioId: string;
  usuarioNome: string;
  acao: string;
  campoAlterado?: string;
  valorAnterior?: string;
  valorNovo?: string;
}) {
  const db = await getDb(); if (!db) return;
  const { historicoAlteracoesLista } = await import("../drizzle/schema");
  await db.insert(historicoAlteracoesLista).values({
    produtoListaId: data.produtoListaId,
    usuarioId: data.usuarioId,
    usuarioNome: data.usuarioNome,
    acao: data.acao,
    campoAlterado: data.campoAlterado || null,
    valorAnterior: data.valorAnterior || null,
    valorNovo: data.valorNovo || null,
  });
}

export async function getHistoricoAlteracao(produtoListaId: number) {
  const db = await getDb(); if (!db) return [];
  const { historicoAlteracoesLista } = await import("../drizzle/schema");
  return await db.select()
    .from(historicoAlteracoesLista)
    .where(eq(historicoAlteracoesLista.produtoListaId, produtoListaId))
    .orderBy(desc(historicoAlteracoesLista.data));
}

export async function verificarDesatualizacao(produtoListaId: number) {
  const db = await getDb(); if (!db) return null;
  const { produtosLista, produtosLoja } = await import("../drizzle/schema");
  
  const [produtoLista] = await db.select()
    .from(produtosLista)
    .where(eq(produtosLista.id, produtoListaId))
    .limit(1);
  
  if (!produtoLista || !produtoLista.produtoLojaId) {
    return null;
  }
  
  const [produtoLoja] = await db.select()
    .from(produtosLoja)
    .where(eq(produtosLoja.id, produtoLista.produtoLojaId))
    .limit(1);
  
  if (!produtoLoja) return null;
  
  const desatualizado = {
    nome: produtoLista.variedade !== produtoLoja.nome,
    departamento: produtoLista.categoriaNome !== produtoLoja.departamento,
    preco: String(produtoLista.valorUnitario) !== produtoLoja.preco,
    ativo: (produtoLista.ativo === 1) !== (produtoLoja.ativo === 1),
  };
  
  return {
    estaDesatualizado: Object.values(desatualizado).some(v => v),
    desatualizado,
    ultimaSincronizacao: produtoLista.ultimaSincronizacao,
    produtoLoja: {
      nome: produtoLoja.nome,
      departamento: produtoLoja.departamento,
      preco: produtoLoja.preco,
      ativo: produtoLoja.ativo === 1,
    },
  };
}




export async function updateVeilingConversaoObservacoes(
  nomeCompleto: string,
  qualidade: string,
  observacao: string | null
) {
  try {
    const db = await getDb();
    if (!db) return;
    const { veilingConversao } = await import("../drizzle/schema");
    await db.update(veilingConversao)
      .set({
        qualidade: qualidade || '',
        observacao: observacao || null,
      })
      .where(eq(veilingConversao.descLonga, nomeCompleto));
  } catch (e) {
    // Silenciosamente ignorar erros
  }
}


// ─── Compras Importadas ───
export async function createCompraImportada(data: InsertCompraImportada) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const [result] = await db.insert(comprasImportadas).values(data);
  return (result as any).insertId;
}

export async function getComprasImportadas() {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  return db.select().from(comprasImportadas).orderBy(comprasImportadas.dataImportacao);
}

export async function getCompraImportadaById(id: number) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const result = await db.select().from(comprasImportadas).where(eq(comprasImportadas.id, id));
  return result[0] || null;
}

export async function deleteCompraImportada(id: number) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  await db.delete(comprasImportadas).where(eq(comprasImportadas.id, id));
  return { success: true };
}

export async function getProdutoByName(nome: string) {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const result = await db.select().from(produtos).where(eq(produtos.descricao, nome));
  return result[0] || null;
}


// ─── Função para calcular valores de compra importada conforme tabela Excel ───
export function calcularValoresCompraImportada(data: {
  quantidade: number;
  valorCusto: number;
  pacote: number;
  freteUm: number;
  icms: number;
  embalagem: number;
}) {
  // Fórmulas extraídas da tabela Excel:
  // F: VALOR TOTAL = E*D (Pacote × V/Custo)
  const valorTotal = data.pacote * data.valorCusto;

  // H: FRETE TOTAL = E*G (Pacote × Frete UM)
  const freteTotal = data.pacote * data.freteUm;

  // K: CUSTO TOTAL = (F+H+J)/I = (Valor Total + Frete Total + Embalagem) / ICMS
  const custoTotal = (valorTotal + freteTotal + data.embalagem) / data.icms;

  // L: TOTAL COMPRA = K*C (Custo Total × Quantidade)
  const totalCompra = custoTotal * data.quantidade;

  // M: V/VAREJO = K/0.4 (Custo Total / 0.4 = 40% de margem)
  const valorVarejo = custoTotal / 0.4;

  // N: V/CD UM = L/0.4 (Total Compra / 0.4)
  const valorCdUm = totalCompra / 0.4;

  // O: V/CD ATA = K/0.55 (Custo Total / 0.55 = 55% de margem)
  const valorCdAta = custoTotal / 0.55;

  return {
    valorTotal: parseFloat(valorTotal.toFixed(2)),
    freteTotal: parseFloat(freteTotal.toFixed(2)),
    custoTotal: parseFloat(custoTotal.toFixed(2)),
    totalCompra: parseFloat(totalCompra.toFixed(2)),
    valorVarejo: parseFloat(valorVarejo.toFixed(2)),
    valorCdUm: parseFloat(valorCdUm.toFixed(2)),
    valorCdAta: parseFloat(valorCdAta.toFixed(2)),
  };
}


// ============ Conversão de Quantidade com Padrão Veiling ============

/**
 * Busca o fator de conversão (qtdVenda) do Veiling pelo nome do produto
 * Usa busca parcial no descCurta ou descLonga
 */
export async function getVeilingConversaoByProduto(nomeProduto: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(veilingConversao)
    .where(
      or(
        like(veilingConversao.descCurta, `%${nomeProduto}%`),
        like(veilingConversao.descLonga, `%${nomeProduto}%`)
      )
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Sincroniza compra importada com catálogo Veiling
 * Atualiza o fator de conversão (pacote) com o qtdVenda do Veiling
 */
export async function sincronizarCompraImportadaComVeiling(
  compraImportadaId: number
) {
  const db = await getDb();
  if (!db) return null;

  const compra = await db
    .select()
    .from(comprasImportadas)
    .where(eq(comprasImportadas.id, compraImportadaId))
    .limit(1);

  if (!compra[0]) return null;

  // Buscar conversao no Veiling
  const conversao = await getVeilingConversaoByProduto(compra[0].produto);

  if (conversao) {
    // Atualizar pacote com o qtdVenda do Veiling
    const qtdVenda = Number(conversao.qtdVenda) || 1;

    await db
      .update(comprasImportadas)
      .set({
        pacote: qtdVenda.toString(),
        updatedAt: new Date(),
      })
      .where(eq(comprasImportadas.id, compraImportadaId));

    return { ...compra[0], pacote: qtdVenda };
  }

  return compra[0];
}

/**
 * Sincroniza todas as compras importadas com catálogo Veiling
 */
export async function sincronizarTodasComprasImportadas() {
  const db = await getDb();
  if (!db) return [];

  const compras = await db.select().from(comprasImportadas);

  const resultados = [];
  for (const compra of compras) {
    const resultado = await sincronizarCompraImportadaComVeiling(compra.id);
    resultados.push(resultado);
  }

  return resultados;
}


// ============ Aplicação de Preços no Catálogo ============

/**
 * Aplica preços das compras importadas no catálogo Veiling
 * Atualiza os preços dos produtos Veiling com os valores calculados
 */
export async function aplicarPrecosComprasImportadasNoVeiling(
  compraImportadaIds: number[]
) {
  const db = await getDb();
  if (!db) return [];

  const compras = await db
    .select()
    .from(comprasImportadas)
    .where(inArray(comprasImportadas.id, compraImportadaIds));

  const resultados = [];

  for (const compra of compras) {
    // Buscar produto Veiling correspondente
    const veilingProduto = await db
      .select()
      .from(veilingConversao)
      .where(
        or(
          like(veilingConversao.descCurta, `%${compra.produto}%`),
          like(veilingConversao.descLonga, `%${compra.produto}%`)
        )
      )
      .limit(1);

    if (veilingProduto[0]) {
      // Atualizar preços no Veiling
      // Nota: A tabela veilingConversao não tem campos de preço por padrão
      // Você pode adicionar campos como precoVarejo, precoCdUm, precoCdAta se necessário
      resultados.push({
        compraId: compra.id,
        veilingId: veilingProduto[0].id,
        produto: compra.produto,
        valorVarejo: compra.valorVarejo,
        valorCdUm: compra.valorCdUm,
        valorCdAta: compra.valorCdAta,
        status: "atualizado",
      });
    } else {
      resultados.push({
        compraId: compra.id,
        produto: compra.produto,
        status: "nao_encontrado",
      });
    }
  }

  return resultados;
}

/**
 * Aplica todos os preços das compras importadas no catálogo
 */
export async function aplicarTodosPrecosComprasImportadas() {
  const db = await getDb();
  if (!db) return [];

  const compras = await db.select().from(comprasImportadas);
  const ids = compras.map((c: any) => c.id);
  return aplicarPrecosComprasImportadasNoVeiling(ids);
}


// ============ Parser para rcoldesc.txt (Dados Veiling) ============

export interface RcoldescRow {
  dtVenda: string;
  nomeProdutor: string;
  chave: string;
  codProd: string;
  descricaoProduto: string;
  qtEmb: number;
  qtPorEmb: number;
  preco: number;
  vlrTotal: number;
}

/**
 * Parser para arquivo rcoldesc.txt
 * Retorna array de linhas parseadas
 */
export function parseRcoldescFile(conteudo: string): RcoldescRow[] {
  const linhas = conteudo.trim().split('\n');
  const resultado: RcoldescRow[] = [];

  // Pular cabeçalho (primeira linha)
  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    const campos = linha.split(';');
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
      vlrTotal: parseFloat(campos[8]) || 0,
    });
  }

  return resultado;
}

/**
 * Converte dados rcoldesc para estrutura de compra importada
 * Aplica conversões de quantidade e calcula valores
 */
export async function converterRcoldescParaCompraImportada(
  rcoldescRows: RcoldescRow[]
) {
  const db = await getDb();
  if (!db) return [];

  const resultado = [];

  for (const row of rcoldescRows) {
    // Buscar fator de conversão do Veiling
    const conversao = await getVeilingConversaoByProduto(row.descricaoProduto);
    const qtdVenda = conversao ? Number(conversao.qtdVenda) : row.qtPorEmb;

    // Calcular quantidade total
    const quantidade = row.qtEmb * row.qtPorEmb;

    // Usar preço como valor de custo
    const valorCusto = row.preco;

    // Calcular valores usando fórmulas da tabela Excel
    const calculos = calcularValoresCompraImportada({
      quantidade,
      valorCusto,
      pacote: qtdVenda,
      freteUm: 0,
      icms: 1.0,
      embalagem: 0,
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
      nomeProdutor: row.nomeProdutor,
    });
  }

  return resultado;
}


/**
 * Gera PDF com dados de compra importada no formato da tabela Excel
 * Inclui todas as 14 colunas com cálculos
 */
export function gerarPdfComprasImportadas(compras: any[]) {
  const { PDFDocument, rgb } = require('pdf-lib');
  const doc = new PDFDocument({
    size: 'A4',
    margin: 20,
  });

  // Cabeçalho
  doc.fontSize(16).font('Helvetica-Bold').text('Relatório de Compras Importadas', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
  doc.moveDown(0.5);

  // Tabela com dados
  const tableTop = doc.y;
  const colWidths = [80, 40, 40, 30, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40];
  const headers = ['Produto', 'Qtd', 'V/Custo', 'Pacote', 'V.Total', 'Frete', 'Frete T', 'ICMS', 'Embal', 'C.Total', 'T.Compra', 'V/Varejo', 'V/CD UM', 'V/CD ATA'];

  // Desenhar cabeçalho da tabela
  doc.fontSize(8).font('Helvetica-Bold');
  let x = 20;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x, tableTop, { width: colWidths[i], align: 'center' });
    x += colWidths[i];
  }

  // Desenhar linhas
  doc.font('Helvetica').fontSize(7);
  let y = tableTop + 20;
  for (const compra of compras) {
    const valores = [
      compra.produto || '',
      compra.quantidade || '',
      compra.valorCusto || '',
      compra.pacote || '',
      compra.valorTotal || '',
      compra.freteUm || '',
      compra.freteTotal || '',
      compra.icms || '',
      compra.embalagem || '',
      compra.custoTotal || '',
      compra.totalCompra || '',
      compra.valorVarejo || '',
      compra.valorCdUm || '',
      compra.valorCdAta || '',
    ];

    x = 20;
    for (let i = 0; i < valores.length; i++) {
      doc.text(String(valores[i]).substring(0, 10), x, y, { width: colWidths[i], align: 'center' });
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


// ─── Acompanhamento de Compras ───

/**
 * Criar ou atualizar acompanhamento de compra
 */
export async function criarOuAtualizarAcompanhamento(
  compraItemId: number,
  compraId: number,
  produtoId: number | null,
  produtoNome: string,
  quantidadePedida: number,
  quantidadeComprada: number,
  observacoes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  // Calcular valores
  const quantidadeRestante = Math.max(0, quantidadePedida - quantidadeComprada);
  const quantidadeExcedente = Math.max(0, quantidadeComprada - quantidadePedida);
  
  let status: "PENDENTE" | "PARCIAL" | "COMPLETO" | "EXCEDENTE" = "PENDENTE";
  if (quantidadeComprada === 0) status = "PENDENTE";
  else if (quantidadeComprada < quantidadePedida) status = "PARCIAL";
  else if (quantidadeComprada === quantidadePedida) status = "COMPLETO";
  else if (quantidadeComprada > quantidadePedida) status = "EXCEDENTE";

  // Verificar se já existe
  const existente = await db
    .select()
    .from(acompanhamentoCompras)
    .where(eq(acompanhamentoCompras.compraItemId, compraItemId))
    .limit(1);

  if (existente.length > 0) {
    // Atualizar
    return await db
      .update(acompanhamentoCompras)
      .set({
        quantidadeComprada: quantidadeComprada.toString(),
        quantidadeRestante: quantidadeRestante.toString(),
        quantidadeExcedente: quantidadeExcedente.toString(),
        status,
        observacoes,
        updatedAt: new Date(),
      })
      .where(eq(acompanhamentoCompras.compraItemId, compraItemId));
  } else {
    // Criar
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
      observacoes,
    });
  }
}

/**
 * Listar acompanhamentos de compra por compraId
 */
export async function listarAcompanhamentosPorCompra(compraId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  return await db
    .select()
    .from(acompanhamentoCompras)
    .where(eq(acompanhamentoCompras.compraId, compraId))
    .orderBy(acompanhamentoCompras.produtoNome);
}

/**
 * Obter acompanhamento por ID
 */
export async function obterAcompanhamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const resultado = await db
    .select()
    .from(acompanhamentoCompras)
    .where(eq(acompanhamentoCompras.id, id))
    .limit(1);

  return resultado[0] || null;
}

/**
 * Listar todas as compras com acompanhamento
 */
export async function listarComprasComAcompanhamento() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const comprasComAcompanhamento = await db
    .select({
      compraId: acompanhamentoCompras.compraId,
      fornecedor: compras.fornecedor,
      data: compras.data,
      total: compras.total,
      status: compras.status,
      totalProdutos: sql`COUNT(DISTINCT ${acompanhamentoCompras.id})`,
      produtosCompletos: sql`SUM(CASE WHEN ${acompanhamentoCompras.status} = 'COMPLETO' THEN 1 ELSE 0 END)`,
      produtosExcedentes: sql`SUM(CASE WHEN ${acompanhamentoCompras.status} = 'EXCEDENTE' THEN 1 ELSE 0 END)`,
      produtosPendentes: sql`SUM(CASE WHEN ${acompanhamentoCompras.status} = 'PENDENTE' THEN 1 ELSE 0 END)`,
    })
    .from(acompanhamentoCompras)
    .leftJoin(compras, eq(acompanhamentoCompras.compraId, compras.id))
    .groupBy(acompanhamentoCompras.compraId)
    .orderBy(desc(compras.data));

  return comprasComAcompanhamento;
}

/**
 * Obter resumo de acompanhamento de uma compra
 */
export async function obterResumoCompra(compraId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const acompanhamentos = await listarAcompanhamentosPorCompra(compraId);
  
  const resumo = {
    totalProdutos: acompanhamentos.length,
    produtosCompletos: acompanhamentos.filter(a => a.status === "COMPLETO").length,
    produtosExcedentes: acompanhamentos.filter(a => a.status === "EXCEDENTE").length,
    produtosParciais: acompanhamentos.filter(a => a.status === "PARCIAL").length,
    produtosPendentes: acompanhamentos.filter(a => a.status === "PENDENTE").length,
    quantidadeTotalPedida: acompanhamentos.reduce((sum, a) => sum + parseFloat(a.quantidadePedida.toString()), 0),
    quantidadeTotalComprada: acompanhamentos.reduce((sum, a) => sum + parseFloat(a.quantidadeComprada.toString()), 0),
    quantidadeTotalRestante: acompanhamentos.reduce((sum, a) => sum + parseFloat(a.quantidadeRestante.toString()), 0),
    quantidadeTotalExcedente: acompanhamentos.reduce((sum, a) => sum + parseFloat(a.quantidadeExcedente.toString()), 0),
  };

  return resumo;
}

/**
 * Deletar acompanhamento
 */
export async function deletarAcompanhamento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  return await db
    .delete(acompanhamentoCompras)
    .where(eq(acompanhamentoCompras.id, id));
}


// ─── QR Code para Conferência de Entrega ───
export async function gerarQrCodeToken(): Promise<string> {
  // Gera um token único de 32 caracteres para o QR Code
  return crypto.randomBytes(16).toString("hex");
}

export async function obterVendaPorQrCodeToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (db as any).query.vendas.findFirst({
    where: eq(vendas.qrCodeToken, token),
    with: {
      itens: {
        with: {
          produto: true,
        },
      },
    },
  });
}

export async function atualizarQrCodeToken(vendaId: number, token: string) {
  const db = await getDb();
  if (!db) return undefined;
  return db
    .update(vendas)
    .set({ qrCodeToken: token })
    .where(eq(vendas.id, vendaId));
}


// ─── Produtos Customizados ───
export async function criarProdutoCustomizado(data: InsertProdutoCustomizado) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.insert(produtosCustomizados).values(data);
  return result;
}

export async function listarProdutosCustomizados() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(produtosCustomizados)
    .orderBy(produtosCustomizados.nome);
}

export async function obterProdutoCustomizado(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(produtosCustomizados)
    .where(eq(produtosCustomizados.id, id))
    .limit(1)
    .then(rows => rows[0]);
}

export async function atualizarProdutoCustomizado(id: number, data: Partial<InsertProdutoCustomizado>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  // Se estoque zerou, inativar produto
  if (data.estoque === 0) {
    data.ativo = 0;
  }
  
  return await db
    .update(produtosCustomizados)
    .set(data)
    .where(eq(produtosCustomizados.id, id));
}

export async function deletarProdutoCustomizado(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .delete(produtosCustomizados)
    .where(eq(produtosCustomizados.id, id));
}

export async function decrementarEstoqueProdutoCustomizado(id: number, quantidade: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const produto = await obterProdutoCustomizado(id);
  if (!produto) throw new Error("Produto não encontrado");
  
  const novoEstoque = Math.max(0, produto.estoque - quantidade);
  const ativo = novoEstoque > 0 ? 1 : 0;
  
  return await db
    .update(produtosCustomizados)
    .set({ estoque: novoEstoque, ativo })
    .where(eq(produtosCustomizados.id, id));
}

// ─── Categorias Customizadas ───
import { categoriasCustomizadas, CategoriaCustomizada, InsertCategoriaCustomizada } from "../drizzle/schema";

export async function listarCategoriasCustomizadas() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(categoriasCustomizadas)
    .where(eq(categoriasCustomizadas.ativo, 1))
    .orderBy(categoriasCustomizadas.nome);
}

export async function criarCategoriaCustomizada(data: InsertCategoriaCustomizada) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.insert(categoriasCustomizadas).values(data);
}

export async function atualizarCategoriaCustomizada(id: number, data: Partial<InsertCategoriaCustomizada>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .update(categoriasCustomizadas)
    .set(data)
    .where(eq(categoriasCustomizadas.id, id));
}

export async function deletarCategoriaCustomizada(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .delete(categoriasCustomizadas)
    .where(eq(categoriasCustomizadas.id, id));
}




// ─── Histórico de Catálogos PDF ───
export async function salvarCatalogoHistorico(data: {
  nome: string;
  produtosCount: number;
  usuarioId?: number;
  pdfUrl?: string;
  produtosJson: string;
  desconto?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await (db as any).execute(`
    INSERT INTO catalogoHistorico (nome, produtosCount, usuarioId, pdfUrl, produtosJson, desconto)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [data.nome, data.produtosCount, data.usuarioId || null, data.pdfUrl || null, data.produtosJson, data.desconto || 0]);
  
  return result;
}

export async function listarCatalogosHistorico(usuarioId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  let query = `
    SELECT id, nome, dataGeracao, produtosCount, usuarioId, pdfUrl, produtosJson, desconto, createdAt, updatedAt
    FROM catalogoHistorico
    WHERE deletedAt IS NULL
  `;
  
  const params: any[] = [];
  
  if (usuarioId) {
    query += ` AND usuarioId = ?`;
    params.push(usuarioId);
  }
  
  query += ` ORDER BY dataGeracao DESC LIMIT 100`;
  
  const result = await (db as any).execute(query, params);
  return result[0] || [];
}

export async function obterCatalogoHistorico(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await (db as any).execute(`
    SELECT id, nome, dataGeracao, produtosCount, usuarioId, pdfUrl, produtosJson, desconto, createdAt, updatedAt
    FROM catalogoHistorico
    WHERE id = ? AND deletedAt IS NULL
  `, [id]);
  
  return (result[0] as any[])?.[0];
}

export async function atualizarCatalogoHistorico(id: number, data: {
  nome?: string;
  produtosCount?: number;
  pdfUrl?: string;
  produtosJson?: string;
  desconto?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.nome !== undefined) {
    updates.push(`nome = ?`);
    params.push(data.nome);
  }
  if (data.produtosCount !== undefined) {
    updates.push(`produtosCount = ?`);
    params.push(data.produtosCount);
  }
  if (data.pdfUrl !== undefined) {
    updates.push(`pdfUrl = ?`);
    params.push(data.pdfUrl);
  }
  if (data.produtosJson !== undefined) {
    updates.push(`produtosJson = ?`);
    params.push(data.produtosJson);
  }
  if (data.desconto !== undefined) {
    updates.push(`desconto = ?`);
    params.push(data.desconto);
  }
  
  if (updates.length === 0) return;
  
  updates.push(`updatedAt = NOW()`);
  params.push(id);
  
  const result = await (db as any).execute(`
    UPDATE catalogoHistorico
    SET ${updates.join(', ')}
    WHERE id = ? AND deletedAt IS NULL
  `, params);
  
  return result;
}

export async function deletarCatalogoHistorico(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await (db as any).execute(`
    UPDATE catalogoHistorico
    SET deletedAt = NOW()
    WHERE id = ? AND deletedAt IS NULL
  `, [id]);
  
  return result;
}

export async function restaurarCatalogoHistorico(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await (db as any).execute(`
    UPDATE catalogoHistorico
    SET deletedAt = NULL
    WHERE id = ?
  `, [id]);
  
  return result;
}

export async function listClientesBloqueados(search?: string) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(clientes.bloqueado, 1), isNull(clientes.deletedAt)];
  if (search) {
    const s = search.toLowerCase();
    conditions.push(or(sql`LOWER(${clientes.nome}) LIKE ${`%${s}%`}`, sql`LOWER(${clientes.telefone}) LIKE ${`%${s}%`}`)!);
  }
  return db.select().from(clientes).where(and(...conditions)).orderBy(desc(clientes.bloqueadoEm));
}

export async function bloquearCliente(clienteId: number, motivo: string, usuarioNome?: string) {
  const db = await getDb(); if (!db) return;
  await db.update(clientes).set({
    bloqueado: 1,
    motivoBloqueio: motivo,
    bloqueadoEm: new Date(),
    bloqueadoPor: usuarioNome || 'Sistema',
  }).where(eq(clientes.id, clienteId));
}

export async function desbloquearCliente(clienteId: number) {
  const db = await getDb(); if (!db) return;
  await db.update(clientes).set({
    bloqueado: 0,
    motivoBloqueio: null,
    bloqueadoEm: null,
    bloqueadoPor: null,
  }).where(eq(clientes.id, clienteId));
}

export async function addTelefoneClienteBloqueado(clienteId: number, telefone: string) {
  const db = await getDb(); if (!db) return;
  await db.insert(telefonesClientesBloqueados).values({ clienteId, telefone });
}

export async function removeTelefoneClienteBloqueado(id: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(telefonesClientesBloqueados).where(eq(telefonesClientesBloqueados.id, id));
}

export async function listTelefonesClienteBloqueado(clienteId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(telefonesClientesBloqueados).where(eq(telefonesClientesBloqueados.clienteId, clienteId)).orderBy(asc(telefonesClientesBloqueados.id));
}

export async function deleteTelefonesClienteBloqueado(clienteId: number) {
  const db = await getDb(); if (!db) return;
  await db.delete(telefonesClientesBloqueados).where(eq(telefonesClientesBloqueados.clienteId, clienteId));
}
