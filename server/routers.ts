import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { syncProgressEmitter, SYNC_EVENT, SyncProgressEvent } from "./syncProgress";
import { veilingLogin, veilingGetAllOffers, veilingGetCategories, veilingGetGfpByOffer } from "./veilingApi";
import { storagePut, storageGet } from "./storage";
import * as db from "./db";
import { schedulerStatus, cacheVeilingImages } from "./autoSync";
import { pedidoPublicoEmitter } from "./pedidoPublicoEmitter";
import { notifyOwner } from "./_core/notification";
import { eq, and, isNull, sql, inArray } from "drizzle-orm";
import * as XLSX from "xlsx";
import { parseVeilingRows, extractFornecedorFromChave, extractDataFromChave } from "../shared/veilingParser";
import * as cloudscraper from "cloudscraper";
import { vendas, catalogosPedidos, catalogosVenda, veilingImportacoes, vendasEfetivas, pedidosPublicos, pedidosPublicosItens, listasPrecos, listasItens, listasPedidos, listasPedidosItens, categoriasProdutos, produtosLista } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Vendedores (Login interno ERP) ───
  vendedores: router({
    login: publicProcedure.input(z.object({ nome: z.string(), senha: z.string() })).mutation(async ({ input }) => {
      const v = await db.getVendedorByLogin(input.nome, input.senha);
      if (!v) return { success: false, error: "Usuário ou senha inválidos" };
      return { success: true, vendedor: { id: v.id, nome: v.nome, email: v.email, telefone: v.telefone, perfil: v.perfil } };
    }),
    list: protectedProcedure.query(async () => {
      return db.listVendedores();
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getVendedor(input.id);
    }),
    create: protectedProcedure.input(z.object({
      nome: z.string().min(1),
      email: z.string().optional(),
      telefone: z.string().optional(),
      senha: z.string().min(1),
      perfil: z.enum(["ADMIN", "VENDEDOR"]),
    })).mutation(async ({ input }) => {
      const id = await db.createVendedor(input);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      nome: z.string().optional(),
      email: z.string().optional(),
      telefone: z.string().optional(),
      senha: z.string().optional(),
      perfil: z.enum(["ADMIN", "VENDEDOR"]).optional(),
      usuarioNome: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, usuarioNome, ...data } = input;
      const old = await db.getVendedor(id);
      if (old && usuarioNome) {
        const fields = ["nome", "email", "telefone", "perfil"] as const;
        for (const f of fields) {
          if (data[f] !== undefined && data[f] !== (old as any)[f]) {
            await db.createHistorico({ tabela: "vendedores", registroId: id, campo: f, valorAntigo: String((old as any)[f] ?? ""), valorNovo: String(data[f]), usuarioNome });
          }
        }
        if (data.senha && data.senha !== old.senha) {
          await db.createHistorico({ tabela: "vendedores", registroId: id, campo: "senha", valorAntigo: "***", valorNovo: "***", usuarioNome });
        }
      }
      await db.updateVendedor(id, data);
      return { success: true };
    }),
  }),

  // ─── Clientes ───
  clientes: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(async ({ input }) => {
      return db.listClientes(input?.search);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getCliente(input.id);
    }),
    create: protectedProcedure.input(z.object({
      nome: z.string().min(1),
      telefone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().optional(),
      endereco: z.string().optional(),
    })).mutation(async ({ input }) => {
      const id = await db.createCliente(input);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      nome: z.string().optional(),
      telefone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().optional(),
      endereco: z.string().optional(),
      usuarioNome: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, usuarioNome, ...data } = input;
      const old = await db.getCliente(id);
      if (old && usuarioNome) {
        const fields = ["nome", "telefone", "whatsapp", "email", "endereco"] as const;
        for (const f of fields) {
          if (data[f] !== undefined && data[f] !== (old as any)[f]) {
            await db.createHistorico({ tabela: "clientes", registroId: id, campo: f, valorAntigo: String((old as any)[f] ?? ""), valorNovo: String(data[f]), usuarioNome });
          }
        }
      }
      await db.updateCliente(id, data);
      return { success: true };
    }),
    historico: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.listHistorico("clientes", input.id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCliente(input.id);
      return { success: true };
    }),
    lixeira: protectedProcedure.query(async () => {
      return db.listClientesLixeira();
    }),
    restore: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.restoreCliente(input.id);
      return { success: true };
    }),
    deletePermanente: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteClientePermanente(input.id);
      return { success: true };
    }),
    listBloqueados: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(async ({ input }) => {
      return db.listClientesBloqueados(input?.search);
    }),
    bloquear: protectedProcedure.input(z.object({
      clienteId: z.number(),
      motivo: z.string().min(1),
      usuarioNome: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.bloquearCliente(input.clienteId, input.motivo, input.usuarioNome);
      return { success: true };
    }),
    desbloquear: protectedProcedure.input(z.object({ clienteId: z.number() })).mutation(async ({ input }) => {
      await db.desbloquearCliente(input.clienteId);
      return { success: true };
    }),
    listTelefones: protectedProcedure.input(z.object({ clienteId: z.number() })).query(async ({ input }) => {
      return db.listTelefonesClienteBloqueado(input.clienteId);
    }),
    addTelefone: protectedProcedure.input(z.object({
      clienteId: z.number(),
      telefone: z.string().min(1),
    })).mutation(async ({ input }) => {
      await db.addTelefoneClienteBloqueado(input.clienteId, input.telefone);
      return { success: true };
    }),
    removeTelefone: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.removeTelefoneClienteBloqueado(input.id);
      return { success: true };
    }),
  }),

  // ─── Produtos ───
  produtos: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(async ({ input }) => {
      return db.calcularEstoqueTodos();
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const p = await db.getProduto(input.id);
      if (!p) return undefined;
      const estoque = await db.calcularEstoqueProduto(p.id);
      return { ...p, estoque };
    }),
    getByDescricao: protectedProcedure.input(z.object({ descricao: z.string() })).query(async ({ input }) => {
      return db.getProdutoByDescricao(input.descricao);
    }),
    create: protectedProcedure.input(z.object({
      descricao: z.string().min(1),
      preco: z.string().optional(),
      custo: z.string().optional(),
      fatorConversao: z.string().optional(),
      codigoExterno: z.string().optional(),
    })).mutation(async ({ input }) => {
      const custo = Number(input.custo || 0);
      const fator = Number(input.fatorConversao || 1);
      const precoCalc = input.preco || String((custo * fator).toFixed(2));
      const id = await db.createProduto({ ...input, preco: precoCalc, custo: String(custo), fatorConversao: String(fator) });
      // Sincronizar automaticamente com produtos_loja
      await db.upsertProdutoLojaFromCompra({
        nome: input.descricao,
        precoCusto: custo || undefined,
        codigoExterno: input.codigoExterno,
      });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      descricao: z.string().optional(),
      preco: z.string().optional(),
      custo: z.string().optional(),
      fatorConversao: z.string().optional(),
      codigoExterno: z.string().optional(),
      usuarioNome: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, usuarioNome, ...data } = input;
      // Recalcular preço se custo ou fator mudaram
      if (data.custo !== undefined || data.fatorConversao !== undefined) {
        const old = await db.getProduto(id);
        const custo = Number(data.custo ?? old?.custo ?? 0);
        const fator = Number(data.fatorConversao ?? old?.fatorConversao ?? 1);
        data.preco = String((custo * fator).toFixed(2));
      }
      const old = await db.getProduto(id);
      if (old && usuarioNome) {
        const fields = ["descricao", "preco", "custo", "fatorConversao", "codigoExterno"] as const;
        for (const f of fields) {
          if (data[f] !== undefined && String(data[f]) !== String((old as any)[f] ?? "")) {
            await db.createHistorico({ tabela: "produtos", registroId: id, campo: f, valorAntigo: String((old as any)[f] ?? ""), valorNovo: String(data[f]), usuarioNome });
          }
        }
      }
      await db.updateProduto(id, data);
      return { success: true };
    }),
    aplicarPrecosImportados: protectedProcedure.input(z.object({
      precos: z.array(z.object({
        produtoNome: z.string(),
        preco1: z.number(),
        preco2: z.number(),
        preco3: z.number(),
      })),
    })).mutation(async ({ input }) => {
      let atualizados = 0;
      let erros: string[] = [];
      for (const item of input.precos) {
        try {
          const produto = await db.getProdutoByDescricao(item.produtoNome);
          if (!produto) {
            erros.push(`Produto "${item.produtoNome}" não encontrado`);
            continue;
          }
          // Salvar preço1 como preço principal
          await db.updateProduto(produto.id, { preco: String(item.preco1.toFixed(2)) });
          atualizados++;
        } catch (e) {
          erros.push(`Erro ao atualizar "${item.produtoNome}": ${(e as Error).message}`);
        }
      }
      return { atualizados, erros, total: input.precos.length };
    }),
    historico: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.listHistorico("produtos", input.id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteProduto(input.id);
      return { success: true };
    }),
    // Lixeira
    lixeira: protectedProcedure.query(async () => {
      return db.listProdutosLixeira();
    }),
    restore: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.restoreProduto(input.id);
      return { success: true };
    }),
    deletePermanente: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteProdutoPermanente(input.id);
      return { success: true };
    }),
  }),

  // ─── Estoque ───
  estoque: router({
    list: protectedProcedure.query(async () => {
      return db.calcularEstoqueTodos();
    }),
    kardex: protectedProcedure.input(z.object({ produtoId: z.number() })).query(async ({ input }) => {
      return db.getKardex(input.produtoId);
    }),
    ajustar: protectedProcedure.input(z.object({
      produtoId: z.number(),
      produtoNome: z.string(),
      quantidade: z.string(),
      motivo: z.string().optional(),
      usuarioNome: z.string().optional(),
    })).mutation(async ({ input }) => {
      const id = await db.createAjusteEstoque(input);
      return { id };
    }),
  }),

  // ─── Vendas ───
  vendas: router({
    list: protectedProcedure.input(z.object({ search: z.string().optional() }).optional()).query(async ({ input }) => {
      const vendasList = await db.listVendas(input?.search);
      // Buscar quais orçamentos já foram faturados (em lote para evitar N queries)
      const ids = vendasList.map((v: any) => v.id);
      const faturadosIds = await db.getVendasFaturadosIds(ids);
      const faturadosSet = new Set<number>(faturadosIds);
      const result = [];
      for (const v of vendasList) {
        const itens = await db.getVendaItens(v.id);
        result.push({ ...v, itens, isFaturado: faturadosSet.has(v.id) });
      }
      return result;
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const v = await db.getVenda(input.id);
      if (!v) return undefined;
      const itens = await db.getVendaItens(v.id);
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
            { produtoNome: "ASTER MARIANA", quantidade: "40", valorUnitario: "16.90", subtotal: "676.00" },
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
            { produtoNome: "FOLHAGEM PAULISTINHA", quantidade: "6", valorUnitario: "25.00", subtotal: "150.00" },
          ]
        }
      ];
      
      const createdIds = [];
      for (const orc of orcamentos) {
        const id = await db.createVenda({
          clienteNome: orc.cliente,
          vendedorNome: orc.vendedor,
          data: orc.data,
          status: orc.status,
          total: orc.total,
        } as any, orc.itens as any);
        createdIds.push(id);
      }
      
      return { success: true, message: `${createdIds.length} orçamentos recriados com sucesso!`, ids: createdIds };
    }),
    create: protectedProcedure.input(z.object({
      clienteId: z.number().optional(),
      clienteNome: z.string().optional(),
      vendedorId: z.number().optional(),
      vendedorNome: z.string().optional(),
      data: z.string(),
      status: z.enum(["AGUARDANDO", "APROVADO", "CANCELADO"]).optional(),
      logistica: z.string().optional(),
      total: z.string(),
      frete: z.string().optional(),
      vencimento: z.string().optional(),
      telefoneCliente: z.string().optional(),
      dataEntrega: z.string().optional(),
      horaEntrega: z.string().optional(),
      observacaoPedido: z.string().optional(),
      itens: z.array(z.object({
        produtoId: z.number().nullish(),
        produtoNome: z.string(),
        quantidade: z.string(),
        valorUnitario: z.string(),
        subtotal: z.string(),
        observacao: z.string().nullish(),
      })),
    })).mutation(async ({ input }) => {
      // Permitir que o valor unitário digitado manualmente seja mantido
      // Recalcular subtotais com base no valor digitado
      for (const item of input.itens) {
        item.subtotal = (Number(item.quantidade) * Number(item.valorUnitario)).toFixed(2);
      }
      // Recalcular total
      input.total = input.itens.reduce((s, i) => s + Number(i.subtotal), 0).toFixed(2);
      const { itens, ...vendaData } = input;
      const id = await db.createVenda(vendaData as any, itens as any);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      clienteNome: z.string().optional(),
      data: z.string().optional(),
      status: z.enum(["AGUARDANDO", "APROVADO", "CANCELADO", "EXPIRADO"]).optional(),
      logistica: z.string().optional(),
      total: z.string().optional(),
      frete: z.string().optional(),
      vencimento: z.string().optional().nullable(),
      telefoneCliente: z.string().optional(),
      dataEntrega: z.string().optional(),
      horaEntrega: z.string().optional(),
      observacaoPedido: z.string().optional(),
      itens: z.array(z.object({
        produtoId: z.number().nullish(),
        produtoNome: z.string(),
        quantidade: z.string(),
        valorUnitario: z.string(),
        subtotal: z.string(),
        observacao: z.string().nullish(),
      })).optional(),
    })).mutation(async ({ input }) => {
      const { id, itens, ...data } = input;
      await db.updateVenda(id, data as any, itens as any);
      // Sincronizar pedidos de compra se itens foram alterados
      if (itens && itens.length > 0) {
        await db.sincronizarPedidosCompraAoAlterarOrcamento(id, itens as any);
      }
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      // Bloquear exclusão de orçamentos já faturados (convertidos em venda efetiva)
      const faturado = await db.isVendaFaturada(input.id);
      if (faturado) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Este orçamento já foi faturado e não pode ser excluído. Para excluí-lo, desfature a venda primeiro.`,
        });
      }
      await db.deleteVenda(input.id);
      return { success: true };
    }),
    deleteMany: protectedProcedure.input(z.object({ ids: z.array(z.number()).min(1) })).mutation(async ({ input }) => {
      // Verificar se algum dos orçamentos já foi faturado
      const faturadosIds = await db.getVendasFaturadosIds(input.ids);
      if (faturadosIds.length > 0) {
        const nums = faturadosIds.map(id => `#${id}`).join(', ');
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `${faturadosIds.length === 1 ? 'O orçamento' : 'Os orçamentos'} ${nums} já ${faturadosIds.length === 1 ? 'foi faturado' : 'foram faturados'} e não pode${faturadosIds.length === 1 ? '' : 'm'} ser excluído${faturadosIds.length === 1 ? '' : 's'}.`,
        });
      }
      // Excluir os orçamentos não faturados
      const { getDb } = await import('./db');
      const { vendas: vendasTable } = await import('../drizzle/schema');
      const { inArray: inArr } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      await dbConn.update(vendasTable)
        .set({ deletedAt: new Date() })
        .where(inArr(vendasTable.id, input.ids));
      return { deleted: input.ids.length };
    }),
    lixeira: protectedProcedure.query(async () => {
      return db.listVendasLixeira();
    }),
    restore: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.restoreVenda(input.id);
      return { success: true };
    }),
    deletePermanente: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteVendaPermanente(input.id);
      return { success: true };
    }),
    // ─── Endpoints para o modal "Adicionar ao Orçamento" nos catálogos ───
    listAbertos: protectedProcedure.query(async () => {
      const todos = await db.listVendas();
      return todos
        .filter((v: any) => v.status === 'AGUARDANDO' && !v.deletedAt)
        .map((v: any) => ({
          id: v.id,
          numero: v.id,
          clienteNome: v.clienteNome || '(sem cliente)',
          data: v.data,
          total: v.total,
          status: v.status,
        }));
    }),
    addItemToOrcamento: protectedProcedure.input(z.object({
      orcamentoId: z.number(),
      produtoNome: z.string(),
      quantidade: z.string(),
      valorUnitario: z.string(),
      subtotal: z.string(),
      obs: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { getDb } = await import('./db');
      const { vendaItens: vendaItensTable, vendas: vendasTable } = await import('../drizzle/schema');
      const { eq: eqFn, sql: sqlFn } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      // Inserir item diretamente (sem buscar todos os itens existentes)
      await dbConn.insert(vendaItensTable).values({
        vendaId: input.orcamentoId,
        produtoNome: input.produtoNome,
        quantidade: input.quantidade,
        valorUnitario: input.valorUnitario,
        subtotal: input.subtotal,
        observacao: input.obs || '',
      });
      // Atualizar total com SQL incremental (sem buscar orçamento)
      await dbConn.update(vendasTable)
        .set({ total: sqlFn`CAST(COALESCE(total, 0) AS DECIMAL(10,2)) + ${parseFloat(input.subtotal)}` })
        .where(eqFn(vendasTable.id, input.orcamentoId));
      return { success: true };
    }),

    // ─── Adicionar múltiplos itens de uma vez (lote) ───
    addItensLote: protectedProcedure.input(z.object({
      orcamentoId: z.number(),
      itens: z.array(z.object({
        produtoNome: z.string(),
        quantidade: z.string(),
        valorUnitario: z.string(),
        subtotal: z.string(),
        obs: z.string().optional(),
      })),
    })).mutation(async ({ input }) => {
      // Verificar bloqueio de terça 20:00 até quinta 07:00
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = domingo, 2 = terça, 4 = quinta
      const hour = now.getHours();
      const isBlockedTime = (dayOfWeek === 2 && hour >= 20) || (dayOfWeek === 3) || (dayOfWeek === 4 && hour < 7);
      if (isBlockedTime) {
        throw new Error('Pedidos bloqueados de terça às 20:00 até quinta às 07:00. Em caso de dúvidas, chamar no WhatsApp.');
      }
      if (input.itens.length === 0) return { success: true, count: 0 };
      const { getDb } = await import('./db');
      const { vendaItens: vendaItensTable, vendas: vendasTable } = await import('../drizzle/schema');
      const { eq: eqFn, sql: sqlFn } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      // Inserir todos os itens de uma vez (bulk insert)
      await dbConn.insert(vendaItensTable).values(
        input.itens.map(item => ({
          vendaId: input.orcamentoId,
          produtoNome: item.produtoNome,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          subtotal: item.subtotal,
          observacao: item.obs || '',
        }))
      );
      // Atualizar total com soma dos subtotais dos novos itens
      const totalAdicional = input.itens.reduce((s, i) => s + parseFloat(i.subtotal), 0);
      await dbConn.update(vendasTable)
        .set({ total: sqlFn`CAST(COALESCE(total, 0) AS DECIMAL(10,2)) + ${totalAdicional}` })
        .where(eqFn(vendasTable.id, input.orcamentoId));
      return { success: true, count: input.itens.length };
    }),

    // ─── Criar orçamento com múltiplos itens (lote) ───
    createComItensLote: protectedProcedure.input(z.object({
      clienteNome: z.string().optional(),
      clienteId: z.number().optional(),
      origem: z.enum(["catalogo-publico", "interno"]).optional(),
      itens: z.array(z.object({
        produtoNome: z.string(),
        quantidade: z.string(),
        valorUnitario: z.string(),
        subtotal: z.string(),
        obs: z.string().optional(),
      })),
    })).mutation(async ({ input }) => {
      // Verificar bloqueio de terça 20:00 até quinta 07:00
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = domingo, 2 = terça, 4 = quinta
      const hour = now.getHours();
      const isBlockedTime = (dayOfWeek === 2 && hour >= 20) || (dayOfWeek === 3) || (dayOfWeek === 4 && hour < 7);
      if (isBlockedTime) {
        throw new Error('Pedidos bloqueados de terça às 20:00 até quinta às 07:00. Em caso de dúvidas, chamar no WhatsApp.');
      }
      if (input.itens.length === 0) throw new Error('Nenhum item informado');
      const { getDb } = await import('./db');
      const { vendas: vendasTable, vendaItens: vendaItensTable } = await import('../drizzle/schema');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      const hoje = new Date().toISOString().split('T')[0];
      const totalGeral = input.itens.reduce((s, i) => s + parseFloat(i.subtotal), 0).toFixed(2);
      // Criar venda
      const [result] = await dbConn.insert(vendasTable).values({
        clienteNome: input.clienteNome || '',
        clienteId: input.clienteId || null,
        data: hoje,
        status: input.origem === 'catalogo-publico' ? 'APROVADO' : 'AGUARDANDO',
        total: totalGeral,
        origem: input.origem || 'interno',
      } as any);
      const vendaId = (result as any).insertId;
      // Inserir todos os itens de uma vez
      await dbConn.insert(vendaItensTable).values(
        input.itens.map(item => ({
          vendaId,
          produtoNome: item.produtoNome,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          subtotal: item.subtotal,
          observacao: item.obs || '',
        }))
      );
      return { id: vendaId };
    }),
    createComItem: protectedProcedure.input(z.object({
      clienteNome: z.string().optional(),
      clienteId: z.number().optional(),
      produtoNome: z.string(),
      quantidade: z.string(),
      valorUnitario: z.string(),
      subtotal: z.string(),
    })).mutation(async ({ input }) => {
      const hoje = new Date().toISOString().split('T')[0];
      const id = await db.createVenda({
        clienteNome: input.clienteNome || '',
        clienteId: input.clienteId || null,
        data: hoje,
        status: 'AGUARDANDO',
        total: input.subtotal,
      } as any, [{
        produtoNome: input.produtoNome,
        quantidade: input.quantidade,
        valorUnitario: input.valorUnitario,
        subtotal: input.subtotal,
      } as any]);
      return { id };
    }),
    // ─── Prorrogar vencimento ───
    prorrogar: protectedProcedure.input(z.object({
      id: z.number(),
      vencimento: z.string(), // YYYY-MM-DD
    })).mutation(async ({ input }) => {
      await db.updateVenda(input.id, { vencimento: input.vencimento } as any);
      // Se estava expirado, volta para AGUARDANDO
      const v = await db.getVenda(input.id);
      if (v && v.status === 'EXPIRADO') {
        await db.updateVenda(input.id, { status: 'AGUARDANDO' } as any);
      }
      return { success: true };
    }),
    // ─── Gerar link de compartilhamento (shareToken) ───
    gerarLink: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const { randomBytes } = await import('crypto');
      const token = randomBytes(24).toString('hex');
      await db.updateVenda(input.id, { shareToken: token } as any);
      return { token };
    }),
    // ─── Visualizar orçamento público pelo shareToken ───
    getPublico: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const { getDb } = await import('./db');
      const { vendas: vendasTable, vendaItens: vendaItensTable } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) return null;
      const rows = await dbConn.select().from(vendasTable).where(eq(vendasTable.shareToken, input.token)).limit(1);
      if (!rows[0]) return null;
      const v = rows[0];
      const itens = await db.getVendaItens(v.id);
      return { ...v, itens };
    }),
    // ─── Listar expirados ───
    listExpirados: protectedProcedure.query(async () => {
      const lista = await db.listVendasExpiradas();
      const result = [];
      for (const v of lista) {
        const itens = await db.getVendaItens(v.id);
        result.push({ ...v, itens });
      }
      return result;
    }),
    // ─── Desbloquear orçamento expirado (com senha) ───
    desbloquear: protectedProcedure.input(z.object({
      id: z.number(),
      senha: z.string(),
    })).mutation(async ({ input }) => {
      const senhaConfig = await db.getAppConfig('senha_desbloqueio_orcamento');
      const senhaCorreta = senhaConfig || '1234'; // padrão se não configurado
      if (input.senha !== senhaCorreta) throw new Error('Senha incorreta');
      await db.updateVenda(input.id, { status: 'AGUARDANDO', vencimento: null } as any);
      return { success: true };
    }),
    // ─── Expirar vendas vencidas (chamado pelo job) ───
    expirarVencidos: protectedProcedure.mutation(async () => {
      const count = await db.expirarVendasVencidas();
      return { count };
    }),
    // ─── Salvar senha de desbloqueio ───
    setSenhaDesbloqueio: protectedProcedure.input(z.object({ senha: z.string().min(4) })).mutation(async ({ input }) => {
      await db.setAppConfig('senha_desbloqueio_orcamento', input.senha);
      return { success: true };
    }),
    getSenhaDesbloqueio: protectedProcedure.query(async () => {
      const v = await db.getAppConfig('senha_desbloqueio_orcamento');
      return { configurada: !!v };
    }),
    // ─── Remover item individual do orçamento ───
    removeItemOrcamento: protectedProcedure.input(z.object({
      itemId: z.number(),
      vendaId: z.number(),
    })).mutation(async ({ input }) => {
      const { getDb } = await import('./db');
      const { vendaItens: vendaItensTable, vendas: vendasTable } = await import('../drizzle/schema');
      const { eq: eqFn } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      // Remover o item
      await dbConn.delete(vendaItensTable).where(eqFn(vendaItensTable.id, input.itemId));
      // Recalcular total da venda
      const itensRestantes = await dbConn.select().from(vendaItensTable).where(eqFn(vendaItensTable.vendaId, input.vendaId));
      const novoTotal = itensRestantes.reduce((s: number, i: any) => s + Number(i.subtotal || 0), 0).toFixed(2);
      await dbConn.update(vendasTable).set({ total: novoTotal }).where(eqFn(vendasTable.id, input.vendaId));
      return { success: true, novoTotal };
    }),
    // ─── Reordenar itens do orçamento (drag-and-drop) ───
    reordenarItens: protectedProcedure.input(z.object({
      vendaId: z.number(),
      itens: z.array(z.object({ id: z.number(), ordem: z.number() })),
    })).mutation(async ({ input }) => {
      const { getDb } = await import('./db');
      const { vendaItens: vendaItensTable } = await import('../drizzle/schema');
      const { eq: eqFn } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      for (const item of input.itens) {
        await dbConn.update(vendaItensTable).set({ ordem: item.ordem }).where(eqFn(vendaItensTable.id, item.id));
      }
      return { success: true };
    }),
    // ─── Buscar múltiplos orçamentos com itens (para impressão em lote) ───
    getByIds: protectedProcedure.input(z.object({
      ids: z.array(z.number()).min(1).max(100),
    })).query(async ({ input }) => {
      const result = [];
      for (const id of input.ids) {
        const v = await db.getVenda(id);
        if (!v) continue;
        const itens = await db.getVendaItens(id);
        result.push({ ...v, itens });
      }
      // Ordenar por número do orçamento
      result.sort((a: any, b: any) => a.id - b.id);
      return result;
    }),
    // ─── Mesclar múltiplos orçamentos em um único ───
    mesclar: protectedProcedure.input(z.object({
      ids: z.array(z.number()).min(2).max(50),
      clienteNome: z.string().optional(),
      clienteId: z.number().optional(),
      vendedorNome: z.string().optional(),
      vendedorId: z.number().optional(),
      telefoneCliente: z.string().optional(),
      observacaoPedido: z.string().optional(),
      vencimento: z.string().optional(),
      agruparItensIguais: z.boolean().default(true),
      moverOriginaisParaLixeira: z.boolean().default(true),
    })).mutation(async ({ input, ctx }) => {
      // Buscar todos os orçamentos e seus itens
      const orcamentos: any[] = [];
      for (const id of input.ids) {
        const v = await db.getVenda(id);
        if (!v) throw new Error(`Orçamento #${id} não encontrado`);
        const itens = await db.getVendaItens(id);
        orcamentos.push({ ...v, itens });
      }

      // Usar dados do primeiro orçamento como base se não fornecidos
      const base = orcamentos[0];
      const clienteNome = input.clienteNome ?? base.clienteNome ?? '';
      const clienteId = input.clienteId ?? base.clienteId ?? undefined;
      const vendedorNome = input.vendedorNome ?? base.vendedorNome ?? '';
      const vendedorId = input.vendedorId ?? base.vendedorId ?? undefined;
      const telefoneCliente = input.telefoneCliente ?? base.telefoneCliente ?? '';
      const vencimento = input.vencimento ?? base.vencimento ?? '';

      // Montar lista de itens
      let todosItens: any[] = [];
      for (const orc of orcamentos) {
        for (const item of orc.itens) {
          todosItens.push({
            produtoId: item.produtoId ?? null,
            produtoNome: item.produtoNome,
            quantidade: String(item.quantidade),
            valorUnitario: String(item.valorUnitario),
            subtotal: String(Number(item.quantidade) * Number(item.valorUnitario)),
            observacao: item.observacao ?? null,
          });
        }
      }

      // Agrupar itens com mesmo produto (mesmo produtoId ou mesmo nome)
      if (input.agruparItensIguais) {
        const mapa = new Map<string, any>();
        for (const item of todosItens) {
          const chave = item.produtoId ? `id:${item.produtoId}` : `nome:${item.produtoNome.toLowerCase().trim()}`;
          if (mapa.has(chave)) {
            const existente = mapa.get(chave)!;
            const novaQtd = Number(existente.quantidade) + Number(item.quantidade);
            existente.quantidade = String(novaQtd);
            existente.subtotal = String(novaQtd * Number(existente.valorUnitario));
            // Concatenar observações se diferentes
            if (item.observacao && item.observacao !== existente.observacao) {
              existente.observacao = [existente.observacao, item.observacao].filter(Boolean).join('; ');
            }
          } else {
            mapa.set(chave, { ...item });
          }
        }
        todosItens = Array.from(mapa.values());
      }

      // Calcular total
      const total = todosItens.reduce((s, i) => s + Number(i.subtotal), 0).toFixed(2);

      // Montar observação com referência aos orçamentos originais
      const refIds = input.ids.map(id => `#${id}`).join(', ');
      const obsBase = input.observacaoPedido ?? '';
      const observacaoPedido = obsBase
        ? `${obsBase}\n[Mesclado de: ${refIds}]`
        : `[Mesclado de: ${refIds}]`;

      // Criar novo orçamento mesclado
      const hoje = new Date().toISOString().split('T')[0];
      const novoId = await db.createVenda({
        clienteNome,
        clienteId,
        vendedorNome,
        vendedorId,
        telefoneCliente,
        vencimento,
        data: hoje,
        status: 'AGUARDANDO',
        total,
        observacaoPedido,
      }, todosItens.map((item, idx) => ({ ...item, vendaId: 0, ordem: idx })));

      // Mover orçamentos originais para lixeira
      if (input.moverOriginaisParaLixeira) {
        for (const id of input.ids) {
          await db.deleteVenda(id);
        }
      }

      return { novoId, totalItens: todosItens.length, idsOriginais: input.ids };
    }),

    // ─── Buscar estoque dos itens de um orçamento ───
    getEstoqueItens: protectedProcedure.input(z.object({
      vendaId: z.number(),
    })).query(async ({ input }) => {
      const { getDb } = await import('./db');
      const {
        vendaItens: vendaItensTable,
        veilingProdutos,
        cooperfloraProdutos,
        produtosLoja,
      } = await import('../drizzle/schema');
      const { eq, like, sql } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) return [];

      // Buscar itens do orçamento
      const itens = await dbConn.select().from(vendaItensTable).where(eq(vendaItensTable.vendaId, input.vendaId));
      if (!itens.length) return [];

      // Para cada item, buscar estoque nas três fontes por nome
      const result = await Promise.all(itens.map(async (item) => {
        const nome = item.produtoNome.trim();

        // 1. Tentar produtos_loja (por produtoId se disponível, senão por nome)
        if (item.produtoId) {
          const [pl] = await dbConn.select({ estoque: produtosLoja.estoque })
            .from(produtosLoja).where(eq(produtosLoja.id, item.produtoId)).limit(1);
          if (pl) return { itemId: item.id, produtoNome: nome, estoque: Number(pl.estoque), fonte: 'loja' as const };
        }

        // 2. Tentar veiling_produtos por nome (busca exata ou parcial)
        const [vp] = await dbConn.select({ estoqueDisponivel: veilingProdutos.estoqueDisponivel, nomeCompleto: veilingProdutos.nomeCompleto })
          .from(veilingProdutos)
          .where(sql`LOWER(${veilingProdutos.nomeCompleto}) LIKE LOWER(${`%${nome.substring(0, 30)}%`})`)
          .limit(1);
        if (vp) return { itemId: item.id, produtoNome: nome, estoque: vp.estoqueDisponivel, fonte: 'veiling' as const };

        // 3. Tentar cooperflora_produtos por nome
        const [cp] = await dbConn.select({ estoque: cooperfloraProdutos.estoque })
          .from(cooperfloraProdutos)
          .where(sql`LOWER(${cooperfloraProdutos.nome}) LIKE LOWER(${`%${nome.substring(0, 30)}%`})`)
          .limit(1);
        if (cp) return { itemId: item.id, produtoNome: nome, estoque: cp.estoque, fonte: 'cooperflora' as const };

        // 4. Tentar produtos_loja por nome
        const [plNome] = await dbConn.select({ estoque: produtosLoja.estoque })
          .from(produtosLoja)
          .where(sql`LOWER(${produtosLoja.nome}) LIKE LOWER(${`%${nome.substring(0, 30)}%`})`)
          .limit(1);
        if (plNome) return { itemId: item.id, produtoNome: nome, estoque: Number(plNome.estoque), fonte: 'loja' as const };

        return { itemId: item.id, produtoNome: nome, estoque: null, fonte: 'desconhecido' as const };
      }));

      return result;
    }),
    gerarQrCode: protectedProcedure.input(z.object({
      vendaId: z.number(),
    })).mutation(async ({ input }) => {
      const token = await db.gerarQrCodeToken();
      await db.atualizarQrCodeToken(input.vendaId, token);
      return { token, vendaId: input.vendaId };
    }),
  }),
  // ─── Venda Linkss (Compartilhamento) ───
  vendaLinks: router({
    create: protectedProcedure.input(z.object({
      vendaId: z.number(),
      expiresInHours: z.number().min(1).max(8760), // 1h a 365 dias
    })).mutation(async ({ input }) => {
      const { randomBytes } = await import('crypto');
      const token = randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);
      const id = await db.createVendaLink({ vendaId: input.vendaId, token, expiresAt });
      return { id, token, expiresAt };
    }),
    list: protectedProcedure.input(z.object({ vendaId: z.number() })).query(async ({ input }) => {
      return db.listVendaLinks(input.vendaId);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteVendaLink(input.id);
      return { success: true };
    }),
    // Endpoint público - visualizar pedido via token
    viewByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const result = await db.getVendaByToken(input.token);
      if (!result) return { found: false, expired: false, venda: null };
      if (result.expired) return { found: true, expired: true, venda: null };
      return { found: true, expired: false, venda: result.venda };
    }),
  }),

  // ─── Compras ───
  compras: router({
    list: protectedProcedure.input(z.object({}).optional()).query(async () => {
      const comprasList = await db.listCompras();
      const result = [];
      for (const c of comprasList) {
        const itens = await db.getCompraItens(c.id);
        result.push({ ...c, itens });
      }
      return result;
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const c = await db.getCompra(input.id);
      if (!c) return undefined;
      const itens = await db.getCompraItens(c.id);
      return { ...c, itens };
    }),
    create: protectedProcedure.input(z.object({
      fornecedor: z.string().optional(),
      numNF: z.string().optional(),
      data: z.string(),
      total: z.string(),
      origem: z.string().optional(),
      itens: z.array(z.object({
        produtoId: z.number().optional(),
        produtoNome: z.string(),
        quantidade: z.string(),
        valorUnitario: z.string(),
        subtotal: z.string(),
      })),
    })).mutation(async ({ input }) => {
      const { itens, ...compraData } = input;
      const id = await db.createCompra(compraData, itens as any);
      // Sincronizar automaticamente cada item com produtos_loja
      for (const item of itens) {
        if (item.produtoNome?.trim()) {
          await db.upsertProdutoLojaFromCompra({
            nome: item.produtoNome.trim(),
            precoCusto: parseFloat(item.valorUnitario) || 0,
            quantidade: parseFloat(item.quantidade) || 0,
          });
        }
      }
      return { id };
    }),
    updateItem: protectedProcedure.input(z.object({
      itemId: z.number(),
      compraId: z.number(),
      produtoId: z.number().optional().nullable(),
      produtoNome: z.string(),
      quantidade: z.string(),
      valorUnitario: z.string(),
      subtotal: z.string(),
    })).mutation(async ({ input }) => {
      const { itemId, compraId, ...data } = input;
      await db.updateCompraItem(itemId, data);
      await db.recalcCompraTotal(compraId);
      return { ok: true };
    }),
    deleteItem: protectedProcedure.input(z.object({
      itemId: z.number(),
      compraId: z.number(),
    })).mutation(async ({ input }) => {
      await db.deleteCompraItem(input.itemId);
      await db.recalcCompraTotal(input.compraId);
      return { ok: true };
    }),
    addItem: protectedProcedure.input(z.object({
      compraId: z.number(),
      produtoId: z.number().optional().nullable(),
      produtoNome: z.string(),
      quantidade: z.string(),
      valorUnitario: z.string(),
      subtotal: z.string(),
    })).mutation(async ({ input }) => {
      const { compraId, ...data } = input;
      const id = await db.addCompraItem(compraId, data);
      await db.recalcCompraTotal(compraId);
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      fornecedor: z.string().optional(),
      numNF: z.string().optional(),
      data: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCompra(id, data);
      return { ok: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCompra(input.id);
      return { ok: true };
    }),
    confirmar: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.updateCompraStatus(input.id, 'CONFIRMADO');
      // Sincronizar produtos loja ao confirmar
      const itens = await db.getCompraItens(input.id);
      for (const item of itens) {
        if (item.produtoNome?.trim()) {
          await db.upsertProdutoLojaFromCompra({
            nome: item.produtoNome.trim(),
            precoCusto: parseFloat(item.valorUnitario) || 0,
            quantidade: parseFloat(item.quantidade) || 0,
          });
        }
      }
      return { ok: true };
    }),
    searchProdutos: protectedProcedure.input(z.object({ termo: z.string() })).query(async ({ input }) => {
      const [loja, geral] = await Promise.all([
        db.searchProdutosLojaSemelhanca(input.termo, 8),
        db.searchProdutosSemelhanca(input.termo, 8),
      ]);
      return { loja, geral };
    }),
  }),
  // ─── Acompanhamento de Compras ────
  acompanhamentoCompras: router({
    listarPorCompra: protectedProcedure.input(z.object({ compraId: z.number() })).query(async ({ input }) => {
      return await db.listarAcompanhamentosPorCompra(input.compraId);
    }),
    listarTodas: protectedProcedure.query(async () => {
      return await db.listarComprasComAcompanhamento();
    }),
    obter: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.obterAcompanhamento(input.id);
    }),
    obterResumo: protectedProcedure.input(z.object({ compraId: z.number() })).query(async ({ input }) => {
      return await db.obterResumoCompra(input.compraId);
    }),
    criar: protectedProcedure.input(z.object({
      compraItemId: z.number(),
      compraId: z.number(),
      produtoId: z.number().optional().nullable(),
      produtoNome: z.string(),
      quantidadePedida: z.number(),
      quantidadeComprada: z.number(),
      observacoes: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.criarOuAtualizarAcompanhamento(
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
    atualizar: protectedProcedure.input(z.object({
      compraItemId: z.number(),
      compraId: z.number(),
      produtoId: z.number().optional().nullable(),
      produtoNome: z.string(),
      quantidadePedida: z.number(),
      quantidadeComprada: z.number(),
      observacoes: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.criarOuAtualizarAcompanhamento(
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
    deletar: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deletarAcompanhamento(input.id);
      return { ok: true };
    }),
  }),
  // ─── Relatórios ────
  relatorios: router({
    vendas: protectedProcedure.input(z.object({
      dataInicio: z.string(),
      dataFim: z.string(),
      status: z.string().optional(),
    })).query(async ({ input }) => {
      const vendasList = await db.getRelatorioVendas(input.dataInicio, input.dataFim, input.status);
      const result = [];
      for (const v of vendasList) {
        const itens = await db.getVendaItens(v.id);
        result.push({ ...v, itens });
      }
      return result;
    }),
    ranking: protectedProcedure.input(z.object({
      dataInicio: z.string(),
      dataFim: z.string(),
      status: z.string().optional(),
    })).query(async ({ input }) => {
      return db.getRankingProdutos(input.dataInicio, input.dataFim, input.status);
    }),
  }),

  // ─── Configurações ───
  config: router({
    exportBackup: protectedProcedure.input(z.object({ usuarioNome: z.string().optional() })).mutation(async ({ input }) => {
      const allData = await db.getAllDataForBackup();
      if (!allData) return { success: false, error: "Sem dados" };
      const json = JSON.stringify({ data: new Date().toISOString(), usuario: input.usuarioNome || "SISTEMA", db: allData }, null, 2);
      const buffer = Buffer.from(json, "utf-8");
      const fileName = `backup_garden_erp_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      const fileKey = `backups/${fileName}`;
      const { url } = await storagePut(fileKey, buffer, "application/json");
      await db.createBackupRecord({ nomeArquivo: fileName, s3Key: fileKey, s3Url: url, tamanho: buffer.length, usuarioNome: input.usuarioNome });
      return { success: true, url, fileName };
    }),
    importBackup: protectedProcedure.input(z.object({ data: z.any() })).mutation(async ({ input }) => {
      await db.importBackupData(input.data);
      return { success: true };
    }),
    listBackups: protectedProcedure.query(async () => {
      return db.listBackups();
    }),
    getBackupUrl: protectedProcedure.input(z.object({ s3Key: z.string() })).query(async ({ input }) => {
      const { url } = await storageGet(input.s3Key);
      return { url };
    }),
    zerarEstoque: protectedProcedure.input(z.object({ confirmacao: z.literal("CONFIRMAR") })).mutation(async ({ input }) => {
      await db.zerarEstoque();
      return { success: true };
    }),
    stats: protectedProcedure.query(async () => {
      const allData = await db.getAllDataForBackup();
      if (!allData) return null;
      return {
        clientes: allData.clientes.length,
        produtos: allData.produtos.length,
        vendas: allData.vendas.length,
        compras: allData.compras.length,
        vendedores: allData.vendedores.length,
      };
    }),
    // ─── Senha de desbloqueio de orçamentos expirados ───
    getSenhaDesbloqueio: protectedProcedure.query(async () => {
      const val = await db.getAppConfig('senha_desbloqueio_orcamento');
      return { configurada: !!val };
    }),
    setSenhaDesbloqueio: protectedProcedure.input(z.object({
      senhaAtual: z.string().optional(),
      novaSenha: z.string().min(4, 'Mínimo 4 caracteres'),
    })).mutation(async ({ input }) => {
      const atual = await db.getAppConfig('senha_desbloqueio_orcamento');
      if (atual && input.senhaAtual !== atual) {
        throw new Error('Senha atual incorreta');
      }
      await db.setAppConfig('senha_desbloqueio_orcamento', input.novaSenha);
      return { ok: true };
    }),
    getValidadePrecos: protectedProcedure.query(async () => {
      const [veiling, cooperflora] = await Promise.all([
        db.getValidadePrecosVeiling(),
        db.getValidadePrecosCooperflora(),
      ]);
      return { veiling, cooperflora };
    }),
    setValidadePrecosVeiling: protectedProcedure.input(z.object({
      dias: z.number().min(1).max(365),
    })).mutation(async ({ input }) => {
      await db.setValidadePrecosVeiling(input.dias);
      return { ok: true };
    }),
    setValidadePrecosCooperflora: protectedProcedure.input(z.object({
      dias: z.number().min(1).max(365),
    })).mutation(async ({ input }) => {
      await db.setValidadePrecosCooperflora(input.dias);
      return { ok: true };
    }),
    // ─── Saúde do AutoSync ───
    syncHealth: protectedProcedure.query(async () => {
      const [historicoVeiling, historicoCooperflora, historicoImport] = await Promise.all([
        db.listarSyncHistorico('VEILING', 10),
        db.listarSyncHistorico('COOPERFLORA', 10),
        db.listarSyncHistorico('VEILING_IMPORT' as any, 10),
      ]);
      // Buscar histórico de importações de pedidos Veiling
      const historicoImportacoes = await db.listVeilingImportacoes(10);
      return {
        jobs: {
          veilingCatalogo: {
            ...schedulerStatus.veiling,
            historico: historicoVeiling,
          },
          cooperfloraCatalogo: {
            ...schedulerStatus.cooperflora,
            historico: historicoCooperflora,
          },
          veilingImportacaoPedidos: {
            ...schedulerStatus.importacaoPedidos,
            ultimaSync: schedulerStatus.importacaoPedidos.ultimaSync ?? historicoImportacoes[0]?.dataImportacao ?? null,
            ultimoStatus: schedulerStatus.importacaoPedidos.ultimoStatus
              ?? (historicoImportacoes[0]?.status === 'SUCESSO' ? 'SUCESSO' as const
              : historicoImportacoes[0]?.status === 'ERRO' ? 'FALHA' as const
              : historicoImportacoes[0] ? 'SUCESSO' as const : null),
            historico: historicoImportacoes,
          },
        },
      };
    }),
  }),

  // ─── Tabela de Preços ───
  tabelaPrecos: router({
    // Listar margens salvas para uma compra específica
    getByCompra: protectedProcedure.input(z.object({ compraId: z.number() })).query(async ({ input }) => {
      return db.listTabelaPrecosByCompra(input.compraId);
    }),
    // Salvar margens em lote para uma compra
    salvar: protectedProcedure.input(z.object({
      compraId: z.number(),
      items: z.array(z.object({
        compraItemId: z.number(),
        produtoId: z.number().nullish(),
        produtoNome: z.string(),
        custoUnitario: z.string(),
        margem1: z.string(),
        preco1: z.string(),
        margem2: z.string(),
        preco2: z.string(),
        margem3: z.string(),
        preco3: z.string(),
      })),
    })).mutation(async ({ input, ctx }) => {
      // 1. Salvar margens na tabela_precos
      await db.saveTabelaPrecosBatch(input.compraId, input.items as any);
      // 2. Aplicar automaticamente o preço da Tabela 3 como preço de venda
      const usuarioNome = (ctx.user as any)?.name || (ctx.user as any)?.email || 'SISTEMA';
      const applyResult = await db.applyTabela3ToProducts(
        input.items.map(i => ({
          produtoId: i.produtoId ?? null,
          produtoNome: i.produtoNome,
          preco3: i.preco3,
          custoUnitario: i.custoUnitario,
        })),
        usuarioNome
      );
      return { success: true, atualizados: applyResult.atualizados };
    }),
    // Aplicar preço de uma tabela selecionada ao cadastro do produto
    aplicarPreco: protectedProcedure.input(z.object({
      tabela: z.enum(["1", "2", "3"]),
      items: z.array(z.object({
        produtoId: z.number().nullish(),
        produtoNome: z.string(),
        preco: z.string(),
      })),
      usuarioNome: z.string().optional(),
    })).mutation(async ({ input }) => {
      let atualizados = 0;
      let criados = 0;
      for (const item of input.items) {
        if (item.produtoId) {
          // Atualizar preço do produto existente
          const old = await db.getProduto(item.produtoId);
          if (old) {
            await db.createHistorico({
              tabela: "produtos", registroId: item.produtoId,
              campo: "preco", valorAntigo: String(old.preco ?? "0"),
              valorNovo: item.preco, usuarioNome: input.usuarioNome || "SISTEMA",
            });
          }
          await db.updateProduto(item.produtoId, { preco: item.preco });
          atualizados++;
        } else {
          // Criar produto novo com o preço da tabela
          await db.createProduto({
            descricao: item.produtoNome.trim().toUpperCase(),
            preco: item.preco,
            custo: "0",
          });
          criados++;
        }
      }
      return { success: true, atualizados, criados };
    }),
  }),

  // ─── Rastreamento Público (QR Code) ───
  rastreamento: router({
    getVenda: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const v = await db.getVenda(input.id);
      if (!v) return { found: false, venda: null };
      const itens = await db.getVendaItens(v.id);
      return { found: true, venda: { ...v, itens } };
    }),
    salvarConferencia: publicProcedure.input(z.object({
      vendaId: z.number(),
      itens: z.array(z.object({
        itemId: z.number(),
        qtdConferida: z.string(),
      })),
      conferidoPor: z.string(),
    })).mutation(async ({ input }) => {
      await db.salvarConferencia(input.vendaId, input.itens, input.conferidoPor);
      await db.createHistorico({
        tabela: "vendas",
        registroId: input.vendaId,
        campo: "conferencia_separacao",
        valorAntigo: "N\u00e3o conferido",
        valorNovo: `Separa\u00e7\u00e3o conferida por ${input.conferidoPor} (via QR)`,
        usuarioNome: input.conferidoPor,
      });
      return { success: true };
    }),
    salvarConferencia2: publicProcedure.input(z.object({
      vendaId: z.number(),
      itens: z.array(z.object({
        itemId: z.number(),
        qtdConferida: z.string(),
      })),
      conferidoPor: z.string(),
    })).mutation(async ({ input }) => {
      await db.salvarConferencia2(input.vendaId, input.itens, input.conferidoPor);
      await db.createHistorico({
        tabela: "vendas",
        registroId: input.vendaId,
        campo: "conferencia_entrega",
        valorAntigo: "N\u00e3o conferido",
        valorNovo: `Entrega conferida por ${input.conferidoPor} (via QR)`,
        usuarioNome: input.conferidoPor,
      });
      return { success: true };
    }),
  }),

  // ─── Conferência de Pedidos ───
  conferencia: router({
    buscar: protectedProcedure.input(z.object({ search: z.string().min(1) })).query(async ({ input }) => {
      const vendas = await db.buscarPedidosConferencia(input.search);
      // Para cada venda, buscar itens
      const results = [];
      for (const v of vendas) {
        const itens = await db.getVendaItens(v.id);
        // Buscar telefone do cliente se tiver clienteId
        let clienteTelefone = null;
        if (v.clienteId) {
          const cliente = await db.getCliente(v.clienteId);
          if (cliente) clienteTelefone = cliente.telefone;
        }
        results.push({ ...v, itens, clienteTelefone });
      }
      return results;
    }),
    salvar: protectedProcedure.input(z.object({
      vendaId: z.number(),
      itens: z.array(z.object({
        itemId: z.number(),
        qtdConferida: z.string(),
      })),
      conferidoPor: z.string(),
    })).mutation(async ({ input }) => {
      await db.salvarConferencia(input.vendaId, input.itens, input.conferidoPor);
      await db.createHistorico({
        tabela: "vendas",
        registroId: input.vendaId,
        campo: "conferencia_separacao",
        valorAntigo: "Não conferido",
        valorNovo: `Separação conferida por ${input.conferidoPor}`,
        usuarioNome: input.conferidoPor,
      });
      return { success: true };
    }),
    salvar2: protectedProcedure.input(z.object({
      vendaId: z.number(),
      itens: z.array(z.object({
        itemId: z.number(),
        qtdConferida: z.string(),
      })),
      conferidoPor: z.string(),
    })).mutation(async ({ input }) => {
      await db.salvarConferencia2(input.vendaId, input.itens, input.conferidoPor);
      await db.createHistorico({
        tabela: "vendas",
        registroId: input.vendaId,
        campo: "conferencia_entrega",
        valorAntigo: "Não conferido",
        valorNovo: `Entrega conferida por ${input.conferidoPor}`,
        usuarioNome: input.conferidoPor,
      });
      return { success: true };
    }),
    divergencias: protectedProcedure.query(async () => {
      return await db.listarDivergenciasConferencia();
    }),
    obterPorQrCode: publicProcedure.input(z.object({
      token: z.string().min(1),
    })).query(async ({ input }) => {
      const venda = await db.obterVendaPorQrCodeToken(input.token);
      if (!venda) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      return venda;
    }),
    confirmarPorQrCode: publicProcedure.input(z.object({
      token: z.string().min(1),
      conferidoPor: z.string().min(1),
      itens: z.array(z.object({
        itemId: z.number(),
        quantidadeContada: z.number(),
      })),
    })).mutation(async ({ input }) => {
      const venda = await db.obterVendaPorQrCodeToken(input.token);
      if (!venda) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      
      // Validar se todas as quantidades estão corretas
      const itensIncorretos = [];
      for (const itemContado of input.itens) {
        const itemOriginal = venda.itens.find((i: any) => i.id === itemContado.itemId);
        if (itemOriginal && itemContado.quantidadeContada !== itemOriginal.quantidade) {
          itensIncorretos.push({
            produtoNome: itemOriginal.produtoNome,
            quantidadePedida: itemOriginal.quantidade,
            quantidadeContada: itemContado.quantidadeContada,
            diferenca: Math.abs(itemContado.quantidadeContada - itemOriginal.quantidade),
          });
        }
      }
      
      // Se houver itens incorretos, rejeitar a confirmação
      if (itensIncorretos.length > 0) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: `${itensIncorretos.length} produto(s) com quantidade incorreta. Corrija antes de confirmar.`,
          cause: itensIncorretos,
        });
      }
      
      // Atualizar conferência de entrega (2ª conferência) com as quantidades contadas
      await db.salvarConferencia2(venda.id, 
        input.itens.map((item) => ({
          itemId: item.itemId,
          qtdConferida: item.quantidadeContada.toString(),
        })),
        input.conferidoPor
      );
      
      await db.createHistorico({
        tabela: "vendas",
        registroId: venda.id,
        campo: "conferencia_entrega_qrcode",
        valorAntigo: "Não conferido",
        valorNovo: `Entrega conferida por ${input.conferidoPor} via QR Code`,
        usuarioNome: input.conferidoPor,
      });
      
      return { success: true, vendaId: venda.id };
    }),
  }),

  financeiro: router({
    formasPagamento: router({
      list: protectedProcedure.query(async () => {
        return await db.listFormasPagamento();
      }),
      create: protectedProcedure.input(z.object({
        nome: z.string().min(1),
        descricao: z.string().optional(),
      })).mutation(async ({ input }) => {
        return await db.createFormaPagamento(input.nome, input.descricao);
      }),
      update: protectedProcedure.input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        descricao: z.string().optional(),
        ativo: z.number().optional(),
      })).mutation(async ({ input }) => {
        await db.updateFormaPagamento(input.id, input.nome, input.descricao, input.ativo);
        return { success: true };
      }),
      delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteFormaPagamento(input.id);
        return { success: true };
      }),
    }),
    titulos: router({
      listPendentes: protectedProcedure.query(async () => {
        return await db.listTitulosPendentes();
      }),
      listPagos: protectedProcedure.query(async () => {
        return await db.listTitulosPagos();
      }),
      getByVenda: protectedProcedure.input(z.object({ vendaId: z.number() })).query(async ({ input }) => {
        return await db.getTitulosByVenda(input.vendaId);
      }),
      create: protectedProcedure.input(z.object({
        vendaId: z.number(),
        clienteId: z.number(),
        clienteNome: z.string(),
        formaPagamentoId: z.number().optional(),
        formaPagamentoNome: z.string().optional(),
        valor: z.string(),
        dataVencimento: z.date(),
        observacoes: z.string().optional(),
      })).mutation(async ({ input }) => {
        return await db.createTitulo({
          vendaId: input.vendaId,
          clienteId: input.clienteId,
          clienteNome: input.clienteNome,
          formaPagamentoId: input.formaPagamentoId,
          formaPagamentoNome: input.formaPagamentoNome,
          valor: input.valor,
          dataVencimento: input.dataVencimento,
          observacoes: input.observacoes,
          status: "PENDENTE",
        });
      }),
      updateStatus: protectedProcedure.input(z.object({
        id: z.number(),
        status: z.enum(["PENDENTE", "PAGO", "VENCIDO", "CANCELADO"]),
        dataPagamento: z.date().optional(),
      })).mutation(async ({ input }) => {
        await db.updateTituloStatus(input.id, input.status, input.dataPagamento);
        return { success: true };
      }),
      faturar: protectedProcedure.input(z.object({
        vendaId: z.number(),
        formaPagamentoId: z.number(),
        dataVencimento: z.date(),
        faturadoPor: z.string(),
        formaPagamentoNome: z.string().optional(),
      })).mutation(async ({ input, ctx }) => {
        // 1. Faturar a venda (cria título a receber)
        const resultado = await db.faturarVenda(input.vendaId, input.formaPagamentoId, input.faturadoPor, input.dataVencimento);

        // Buscar dados da venda para usar nas etapas seguintes
        const venda = await db.getVenda(input.vendaId);
        const { getDb } = await import('./db');
        const { caixas, caixaMovimentos, vendasEfetivas } = await import('../drizzle/schema');
        const { eq: eqFn, sql: sqlFn } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) return { ...resultado, caixaLancado: false, vendaEfetivaId: null };

        let caixaLancado = false;
        let caixaAviso: string | null = null;

        // 2. Lançar entrada no caixa aberto (se houver)
        if (venda) {
          const [caixaAberto] = await dbConn.select().from(caixas).where(eqFn(caixas.status, 'ABERTO')).limit(1);
          if (caixaAberto) {
            const valorTotal = Number(venda.total) || 0;
            if (valorTotal > 0) {
              await dbConn.insert(caixaMovimentos).values({
                caixaId: caixaAberto.id,
                tipo: 'ENTRADA',
                categoria: 'VENDA',
                descricao: `Venda #${String(input.vendaId).padStart(6, '0')} - ${venda.clienteNome || 'Cliente'}`,
                valor: String(valorTotal.toFixed(2)),
                formaPagamento: input.formaPagamentoNome ?? 'Não informado',
                vendaId: input.vendaId,
                vendaNum: `#${String(input.vendaId).padStart(6, '0')}`,
                lancadoPor: ctx.user.name || ctx.user.openId,
              });
              await dbConn.update(caixas)
                .set({ totalEntradas: sqlFn`totalEntradas + ${valorTotal}` })
                .where(eqFn(caixas.id, caixaAberto.id));
              caixaLancado = true;
            }
          } else {
            caixaAviso = 'Não há caixa aberto. O faturamento foi registrado, mas nenhum lançamento foi feito no caixa.';
          }
        }

        // 3. Converter em Venda Efetiva automaticamente (se ainda não convertido)
        let vendaEfetivaId: number | null = null;
        if (venda) {
          const jaConvertido = await dbConn.select().from(vendasEfetivas)
            .where(eqFn(vendasEfetivas.orcamentoId, input.vendaId))
            .limit(1);
          if (jaConvertido.length === 0) {
            const hoje = new Date();
            const dataVenda = hoje.toLocaleDateString('pt-BR');
            // Snapshot dos itens para preservar histórico mesmo se o orçamento for deletado
            const vendaItensParaSnapshot = await db.getVendaItens(input.vendaId);
            const itensSnapshotFaturar = (vendaItensParaSnapshot || []).map((item: any) => ({
              produtoNome: item.produtoNome,
              quantidade: Number(item.quantidade),
              valorUnitario: Number(item.valorUnitario),
              subtotal: Number(item.subtotal),
              observacao: item.observacao || undefined,
            }));
            const [veResult] = await dbConn.insert(vendasEfetivas).values({
              orcamentoId: input.vendaId,
              orcamentoNum: `#${String(input.vendaId).padStart(6, '0')}`,
              clienteId: venda.clienteId ?? undefined,
              clienteNome: venda.clienteNome ?? '',
              vendedorId: venda.vendedorId ?? undefined,
              vendedorNome: venda.vendedorNome ?? '',
              total: venda.total,
              dataVenda,
              dataEntrega: venda.dataEntrega ?? undefined,
              formaPagamento: input.formaPagamentoNome ?? undefined,
              status: 'PENDENTE',
              convertidoPor: ctx.user.name ?? ctx.user.openId,
              itensSnapshot: itensSnapshotFaturar.length > 0 ? itensSnapshotFaturar : undefined,
            });
            vendaEfetivaId = (veResult as any).insertId ?? null;
          } else {
            vendaEfetivaId = jaConvertido[0].id;
          }
        }

        return { ...resultado, caixaLancado, caixaAviso, vendaEfetivaId };
      }),
      getNaoFaturadas: protectedProcedure.query(async () => {
        return await db.getVendasNaoFaturadas();
      }),
    }),
  }),

  // ─── Pedidos de Compra ───
  pedidosCompra: router({
    list: protectedProcedure.query(async () => {
      return await db.listPedidosCompra();
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return await db.getPedidoCompra(input.id);
    }),
    nextNumero: protectedProcedure.query(async () => {
      return await db.getNextNumeroPedidoCompra();
    }),
    create: protectedProcedure.input(z.object({
      numero: z.number(),
      data: z.string(),
      solicitante: z.string(),
      observacoes: z.string().optional(),
      total: z.string(),
      itens: z.array(z.object({
        produtoId: z.number().optional(),
        produtoNome: z.string(),
        quantidade: z.string(),
        precoVenda: z.string(),
        subtotalVenda: z.string(),
      })),
    })).mutation(async ({ input }) => {
      return await db.createPedidoCompra(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      data: z.string(),
      solicitante: z.string(),
      observacoes: z.string().optional(),
      total: z.string(),
      status: z.string().optional(),
      itens: z.array(z.object({
        produtoId: z.number().optional(),
        produtoNome: z.string(),
        quantidade: z.string(),
        precoVenda: z.string(),
        subtotalVenda: z.string(),
      })),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updatePedidoCompra(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deletePedidoCompra(input.id);
    }),
     updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.string(),
    })).mutation(async ({ input }) => {
      await db.updateStatusPedidoCompra(input.id, input.status);
    }),
    addItemToPedido: protectedProcedure.input(z.object({
      pedidoId: z.number(),
      produtoNome: z.string(),
      quantidade: z.string(),
      precoVenda: z.string(),
      subtotalVenda: z.string(),
    })).mutation(async ({ input }) => {
      const { pedidoId, ...item } = input;
      await db.addItemToPedidoCompra(pedidoId, item);
    }),
    listAbertos: protectedProcedure.query(async () => {
      const todos = await db.listPedidosCompra();
      return todos.filter((p: any) => p.status === 'ABERTO' || p.status === 'APROVADO');
    }),
    createComItem: protectedProcedure.input(z.object({
      solicitante: z.string(),
      produtoNome: z.string(),
      quantidade: z.string(),
      precoVenda: z.string(),
      subtotalVenda: z.string(),
    })).mutation(async ({ input }) => {
      const numero = await db.getNextNumeroPedidoCompra();
      const hoje = new Date().toISOString().split('T')[0];
      const pedidoId = await db.createPedidoCompra({
        numero,
        data: hoje,
        solicitante: input.solicitante,
        total: input.subtotalVenda,
        itens: [{ produtoNome: input.produtoNome, quantidade: input.quantidade, precoVenda: input.precoVenda, subtotalVenda: input.subtotalVenda }],
      });
      return pedidoId;
    }),
  }),
  // ─── Cooperflora ────
  cooperflora: router({
    getConfig: protectedProcedure.query(async () => {
      return db.getCooperfloraConfig();
    }),

    setDataCarregamento: protectedProcedure.input(z.object({
      dataCarregamento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato dd/MM/yyyy'),
    })).mutation(async ({ input }) => {
      await db.upsertCooperfloraConfig({ dataCarregamento: input.dataCarregamento });
      return { ok: true };
    }),
    salvarConfig: protectedProcedure.input(z.object({
      login: z.string(),
      senha: z.string(),
      chave: z.string().optional(),
      rota: z.string().optional(),
      localEntrega: z.string().optional(),
      margemPadrao: z.number().optional(),
      dataCarregamento: z.string().optional(),
    })).mutation(async ({ input }) => {
      return db.upsertCooperfloraConfig({
        login: input.login,
        senha: input.senha,
        chave: input.chave || '62002',
        rota: input.rota || '463',
        localEntrega: input.localEntrega || 'TRIANGULO MINEIRO - MG - BROKER',
        margemPadrao: input.margemPadrao !== undefined ? String(input.margemPadrao) as any : undefined,
        dataCarregamento: input.dataCarregamento || '',
      });
    }),

    sincronizar: protectedProcedure.input(z.object({
      dataCarregamento: z.string().optional(),
      sessionId: z.string().optional(),
    })).mutation(async ({ input }) => {
      const syncSessionId = input.sessionId || "default";
      const syncInicioMs = Date.now();
      const emitProgress = (phase: "produtos" | "hastes" | "concluido" | "erro", current: number, total: number, message: string) => {
        syncProgressEmitter.emit(SYNC_EVENT, syncSessionId, { phase, current, total, message });
      };
      const config = await db.getCooperfloraConfig();
      if (!config || !config.login || !config.senha) {
        await db.registrarSyncHistorico({ fonte: 'COOPERFLORA', status: 'FALHA', total: 0, mensagem: 'Credenciais não configuradas', duracaoMs: Date.now() - syncInicioMs });
        throw new Error('Configure as credenciais da Cooperflora primeiro');
      }

      const https = await import('https');
      const http = await import('http');
      const dataCarregamento = input.dataCarregamento || config.dataCarregamento;
      if (!dataCarregamento) throw new Error('Informe a data de carregamento');

      // Helper para fazer requisições HTTP/HTTPS retornando {status, headers, body}
      const fetchRaw = (url: string, options: any, timeoutMs = 15000): Promise<{status: number, headers: any, body: string}> => {
        return new Promise((resolve, reject) => {
          const urlObj = new URL(url);
          const lib = urlObj.protocol === 'https:' ? https : http;
          const reqOptions: any = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
          };
          const req = lib.request(reqOptions, (res: any) => {
            let data = '';
            res.on('data', (chunk: any) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
          });
          req.on('error', reject);
          // Timeout para evitar que requisições fiquem penduradas indefinidamente
          req.setTimeout(timeoutMs, () => {
            req.destroy();
            reject(new Error(`Timeout após ${timeoutMs}ms para ${url}`));
          });
          if (options.body) req.write(options.body);
          req.end();
        });
      };

      // 1. GET /index.jsp para obter cookies iniciais (comercial_cookie, JSESSIONID)
      const indexResp = await fetchRaw('https://comercial.cooperflora.com.br/index.jsp', {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
      });

      // Coletar cookies iniciais
      const cookieJar: Record<string, string> = {};
      const extractCookies = (headers: any) => {
        const setCookies = headers['set-cookie'] || [];
        const arr = Array.isArray(setCookies) ? setCookies : [setCookies];
        arr.forEach((c: string) => {
          if (!c) return;
          const [pair] = c.split(';');
          const [name, ...valParts] = pair.split('=');
          if (name && valParts.length) cookieJar[name.trim()] = valParts.join('=').trim();
        });
      };
      extractCookies(indexResp.headers);

      // 2. POST /api/v1/login para obter TOKEN e USUARIO
      const loginApiResp = await fetchRaw('https://apinovo.cooperflora.com.br/api/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://comercial.cooperflora.com.br',
          'Referer': 'https://comercial.cooperflora.com.br/index.jsp',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({ login: config.login, senha: config.senha }),
      });

      let cooperToken = '';
      let usuario: any = {};
      let menu: any[] = [];
      try {
        const loginData = JSON.parse(loginApiResp.body);
        if (loginData?.CODERR !== 0 && loginData?.CODERR !== undefined) {
          throw new Error(`Login Cooperflora falhou: ${loginData?.MSG || 'Credenciais inválidas'}`);
        }
        cooperToken = loginData?.TOKEN || '';
        usuario = loginData?.USUARIO || {};
        menu = loginData?.MENU || [];
      } catch (e: any) {
        throw new Error(`Falha no login da Cooperflora: ${e.message}`);
      }

      if (!cooperToken) {
        throw new Error('Falha no login da Cooperflora. Verifique login e senha.');
      }

      // 3. POST /session/update para criar sessão no servidor legado
      const cookieHeader = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
      const sessionBody = new URLSearchParams({
        TOKEN: cooperToken,
        USUARIO: JSON.stringify(usuario),
        BASE_URL: 'https://apinovo.cooperflora.com.br',
        MENU: JSON.stringify(menu),
        CHAVE_PAGINA: '0',
      }).toString();

      const sessionResp = await fetchRaw('https://comercial.cooperflora.com.br/session/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieHeader,
          'Origin': 'https://comercial.cooperflora.com.br',
          'Referer': 'https://comercial.cooperflora.com.br/index.jsp',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: sessionBody,
      });
      extractCookies(sessionResp.headers);

      // Cookie string final com todos os cookies acumulados
      const cookieStr = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');

      if (!cookieStr) {
        throw new Error('Falha ao obter sessão do site Cooperflora.');
      }

      emitProgress("produtos", 0, 0, "Buscando lista de produtos...");
      // 3. Buscar lista de produtos via endpoint legado com HTML scraping
      const chave = config.chave || '62002';
      const rota = config.rota || '463';
      const produtosBody = new URLSearchParams({
        chave,
        rota,
        enderecoEntrega: '0',
        dataCarregamento,
        filial: '',
        indexTr: '-1',
        utilizarCredito: 'false',
        utilizarCreditoDisponivel: 'false',
        utilizarCaixaSeca: 'false',
        grupos: '16,17,18,6,2,21,8,11',
        agencias: '',
        especies: '',
        tamanhos: '',
        cores: '',
        qualidades: '',
        produtores: '',
        temas: '',
        recepcionado: '',
        variedades: '',
      }).toString();

      const produtosResp = await fetchRaw('https://comercial.cooperflora.com.br/pedido/comprar/listarProdutos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'text/html, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': cookieStr,
          'Referer': 'https://comercial.cooperflora.com.br/pedido/comprar/principal',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: produtosBody,
      });

      // 4. Parsear HTML com regex (sem DOM no Node.js)
      // Estrutura: cada produto tem onclick abrirModalComprarProduto('62002', 'DD/MM/YYYY', 'CODIGO','QUALIDADE',...)
      // O nome, preço e estoque estão nos 2000 chars ANTES do onclick
      // Preço pode ser: R$21.7649 (simples) ou R$6.8961 - 7.0568 (faixa)
      const html = produtosResp.body;
      const allProdutos: Array<{codigo: string, nome: string, preco: string, qualidade: string, estoque: number}> = [];

      // Encontrar todos os onclicks de compra (cada produto aparece 2x no HTML)
      const onclickPattern = /abrirModalComprarProduto\('(\d+)', '([^']+)', '([A-Z0-9]+)','([^']+)'/g;
      const seen = new Set<string>();
      let onclickMatch;

      while ((onclickMatch = onclickPattern.exec(html)) !== null) {
        const [, , , codigo, qualidade] = onclickMatch;
        const key = `${codigo}_${qualidade}`;
        if (seen.has(key)) continue; // pular duplicata (card/modal)
        seen.add(key);

        // Contexto de 2000 chars antes do onclick (contém nome, preço, estoque)
        const idx = onclickMatch.index;
        const ctx = html.substring(Math.max(0, idx - 2000), idx);

        // Extrair nome: span class="fw-semibold p-3" (com possível espaço antes do >)
        const nomeMatches = ctx.match(/<span class="fw-semibold[^"]*"\s*>\s*([^<]+?)\s*<\/span>/g);
        const nomeMatch = nomeMatches ? nomeMatches[nomeMatches.length - 1].match(/>\s*([^<]+?)\s*<\/span>/) : null;
        const nome = nomeMatch ? nomeMatch[1].trim().substring(0, 100) : '';
        if (!nome) continue;

        // Extrair preço: td class="w-20" com R$XX.XX ou R$XX.XX - YY.YY (faixa)
        const precoMatches = ctx.match(/<td class="w-20">\s*(R\$[\d.,]+(?:\s*-\s*[\d.,]+)?)\s*<\/td>/g);
        const precoMatch = precoMatches ? precoMatches[precoMatches.length - 1].match(/(R\$[\d.,]+(?:\s*-\s*[\d.,]+)?)/) : null;
        const preco = precoMatch ? precoMatch[1].trim() : 'R$0';

        // Extrair estoque: último <td>\d+</td> no contexto final
        const estoqueMatches = ctx.substring(ctx.length - 500).match(/<td>\s*(\d+)\s*<\/td>/g);
        const estoqueStr = estoqueMatches ? estoqueMatches[estoqueMatches.length - 1].replace(/<[^>]+>/g, '').trim() : '0';
        const estoque = parseInt(estoqueStr) || 0;

        allProdutos.push({ codigo, nome, preco, qualidade, estoque });
      }

      // 5. Converter e salvar no banco
      const produtosParaSalvar = allProdutos.map((p) => {
        const precoStr = p.preco.replace('R$', '').trim();
        const partes = precoStr.split(/\s*-\s*/);
        const precoMin = parseFloat(partes[0].replace(',', '.')) || 0;
        const precoMax = partes.length > 1 ? parseFloat(partes[1].replace(',', '.')) || precoMin : precoMin;
        return {
          codigo: p.codigo,
          nome: p.nome,
          precoMin: String(precoMin) as any,
          precoMax: String(precoMax) as any,
          qualidade: p.qualidade,
          estoque: p.estoque,
          grupo: '',
          imagemUrl: `https://apinovo.cooperflora.com.br/api/v1/imagem?codigo=${p.codigo}`,
          dataCarregamento,
          atualizadoEm: new Date(),
        };
      });

      await db.upsertCooperfloraProdutos(produtosParaSalvar);
      await db.upsertCooperfloraConfig({ ultimaAtualizacao: new Date(), dataCarregamento });
      emitProgress("produtos", produtosParaSalvar.length, produtosParaSalvar.length, `${produtosParaSalvar.length} produtos salvos. Carregando hastes...`);
      // 6. Carga em lote de hastes: processar em lotes paralelos de 5 para maior velocidade
      const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
      const chaveConf = config.chave || '62002';
      const rotaConf = config.rota || '463';
      let hastesCarregados = 0;
      const totalProdutos = produtosParaSalvar.length;

      // Função para buscar hastes de um produto individual
      const buscarHastesProduto = async (prod: { codigo: string; qualidade: string }) => {
        const detBody = new URLSearchParams({
          chave: chaveConf,
          dataCarregamento,
          produto: prod.codigo,
          qualidade: prod.qualidade,
          rota: rotaConf,
          endereco: '0',
          compraRapida: 'false',
          filial: '',
          indexTr: '-1',
          utilizaCredito: 'false',
          utilizarCreditoDisponivel: 'false',
          valorCreditoDisponivel: '0',
          utilizarCaixaSeca: 'false',
        }).toString();
        const detResp = await fetchRaw('https://comercial.cooperflora.com.br/pedido/comprar/detalheProduto', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'text/html, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'Cookie': cookieStr,
            'Referer': 'https://comercial.cooperflora.com.br/pedido/comprar/principal',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          body: detBody,
        }, 10000); // timeout de 10s por produto
        const detHtml = detResp.body;
        // Extrair hastes por maço
        const hMatch = detHtml.match(/Hastes[^<]*<\/[^>]+>\s*<[^>]+>\s*(\d+)/);
        const hastesNum = hMatch ? parseInt(hMatch[1]) : 1;
        // Extrair hastes da embalagem do primeiro sítio
        const trPat = /<tr[^>]*data-cod-sitio="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/;
        const trM = trPat.exec(detHtml);
        let hastesEmbNum = 1;
        if (trM) {
          const tds = trM[2].match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
          const embTd = tds[3] || '';
          const embText = embTd.replace(/<[^>]+>/g, '').trim();
          const embM = embText.match(/(\d+)/);
          if (embM) hastesEmbNum = parseInt(embM[1]);
        }
        await db.updateCooperfloraHastes(prod.codigo, hastesNum > 0 ? hastesNum : 1, hastesEmbNum);
      };

      // Processar em lotes de 5 produtos em paralelo
      const BATCH_SIZE = 5;
      for (let i = 0; i < produtosParaSalvar.length; i += BATCH_SIZE) {
        const lote = produtosParaSalvar.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(lote.map(prod => buscarHastesProduto(prod)));
        hastesCarregados = Math.min(i + BATCH_SIZE, totalProdutos);
        emitProgress("hastes", hastesCarregados, totalProdutos, `Carregando hastes: ${hastesCarregados}/${totalProdutos}`);
        // Pequena pausa entre lotes para não sobrecarregar o servidor
        if (i + BATCH_SIZE < produtosParaSalvar.length) await sleep(300);
      }
      // 7. Sincronizar produtos de venda (tabela produtos do ERP) com base no catálogo Cooperflora
      emitProgress("concluido", totalProdutos, totalProdutos, `Sincronizando catálogo de vendas...`);
      const margemSync = parseFloat(String(config.margemPadrao || '30'));
      const syncResult = await db.syncProdutosVendaFromCooperflora(margemSync);
      const syncMsg = `Concluído! ${totalProdutos} produtos. Vendas: +${syncResult.criados} novos, ${syncResult.atualizados} atualizados, ${syncResult.removidos} removidos.`;
      emitProgress("concluido", totalProdutos, totalProdutos, syncMsg);
      await db.registrarSyncHistorico({ fonte: 'COOPERFLORA', status: 'SUCESSO', total: totalProdutos, mensagem: syncMsg, duracaoMs: Date.now() - syncInicioMs });
      return { total: produtosParaSalvar.length, dataCarregamento, hastesCarregados: totalProdutos, syncVendas: syncResult };
    }),

    listar: protectedProcedure.input(z.object({
      nome: z.string().optional(),
      qualidade: z.string().optional(),
      grupo: z.string().optional(),
    })).query(async ({ input }) => {
      const [produtos, config] = await Promise.all([
        db.listCooperfloraProdutos(input),
        db.getCooperfloraConfig(),
      ]);
      const margemPadrao = parseFloat(String(config?.margemPadrao || '30'));
      return produtos.map(p => {
        const margem = p.margemCustom !== null && p.margemCustom !== undefined
          ? parseFloat(String(p.margemCustom))
          : margemPadrao;
        const precoMin = parseFloat(String(p.precoMin));
        const precoMax = parseFloat(String(p.precoMax));
        const precoVendaMin = precoMin > 0 ? precoMin * (1 + margem / 100) : 0;
        const precoVendaMax = precoMax > 0 ? precoMax * (1 + margem / 100) : 0;
        return {
          ...p,
          margem,
          precoVendaMin: precoVendaMin.toFixed(4),
          precoVendaMax: precoVendaMax.toFixed(4),
        };
      });
    }),

    atualizarMargem: protectedProcedure.input(z.object({
      codigo: z.string(),
      margemCustom: z.number().nullable(),
    })).mutation(async ({ input }) => {
      await db.updateCooperfloraMargem(input.codigo, input.margemCustom);
    }),

    atualizarMargemGlobal: protectedProcedure.input(z.object({
      margemPadrao: z.number(),
    })).mutation(async ({ input }) => {
      await db.upsertCooperfloraConfig({ margemPadrao: String(input.margemPadrao) as any });
    }),

    buscarDetalhesProduto: protectedProcedure.input(z.object({
      codigo: z.string(),
      qualidade: z.string(),
      dataCarregamento: z.string(),
    })).query(async ({ input }) => {
      const config = await db.getCooperfloraConfig();
      if (!config || !config.login || !config.senha) {
        throw new Error('Configure as credenciais da Cooperflora primeiro');
      }

      const https = await import('https');
      const http = await import('http');

      const fetchRaw = (url: string, options: any): Promise<{status: number, headers: any, body: string}> => {
        return new Promise((resolve, reject) => {
          const urlObj = new URL(url);
          const lib = urlObj.protocol === 'https:' ? https : http;
          const reqOptions: any = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
          };
          const req = lib.request(reqOptions, (res: any) => {
            let data = '';
            res.on('data', (chunk: any) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
          });
          req.on('error', reject);
          if (options.body) req.write(options.body);
          req.end();
        });
      };

      const cookieJar: Record<string, string> = {};
      const extractCookies = (headers: any) => {
        const setCookies = headers['set-cookie'] || [];
        const arr = Array.isArray(setCookies) ? setCookies : [setCookies];
        arr.forEach((c: string) => {
          if (!c) return;
          const [pair] = c.split(';');
          const [name, ...valParts] = pair.split('=');
          if (name && valParts.length) cookieJar[name.trim()] = valParts.join('=').trim();
        });
      };

      // 1. GET index.jsp
      const indexResp = await fetchRaw('https://comercial.cooperflora.com.br/index.jsp', {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      extractCookies(indexResp.headers);

      // 2. POST login API
      const loginApiResp = await fetchRaw('https://apinovo.cooperflora.com.br/api/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://comercial.cooperflora.com.br',
          'Referer': 'https://comercial.cooperflora.com.br/index.jsp',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        },
        body: JSON.stringify({ login: config.login, senha: config.senha }),
      });

      let cooperToken = '';
      let usuario: any = {};
      let menu: any[] = [];
      try {
        const loginData = JSON.parse(loginApiResp.body);
        if (loginData?.CODERR !== 0 && loginData?.CODERR !== undefined) {
          throw new Error(`Login Cooperflora falhou: ${loginData?.MSG || 'Credenciais inválidas'}`);
        }
        cooperToken = loginData?.TOKEN || '';
        usuario = loginData?.USUARIO || {};
        menu = loginData?.MENU || [];
      } catch (e: any) {
        throw new Error(`Falha no login da Cooperflora: ${e.message}`);
      }

      if (!cooperToken) throw new Error('Falha no login da Cooperflora.');

      // 3. POST session/update
      const cookieHeader = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
      const sessionBody = new URLSearchParams({
        TOKEN: cooperToken,
        USUARIO: JSON.stringify(usuario),
        BASE_URL: 'https://apinovo.cooperflora.com.br',
        MENU: JSON.stringify(menu),
        CHAVE_PAGINA: '0',
      }).toString();

      const sessionResp = await fetchRaw('https://comercial.cooperflora.com.br/session/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieHeader,
          'Origin': 'https://comercial.cooperflora.com.br',
          'Referer': 'https://comercial.cooperflora.com.br/index.jsp',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        },
        body: sessionBody,
      });
      extractCookies(sessionResp.headers);
      const cookieStr = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');

      // 4. POST detalheProduto
      const detalheBody = new URLSearchParams({
        chave: config.chave || '62002',
        dataCarregamento: input.dataCarregamento,
        produto: input.codigo,
        qualidade: input.qualidade,
        rota: config.rota || '463',
        endereco: '0',
        compraRapida: 'false',
        filial: '',
        indexTr: '-1',
        utilizaCredito: 'false',
        utilizarCreditoDisponivel: 'false',
        valorCreditoDisponivel: '0',
        utilizarCaixaSeca: 'false',
      }).toString();

      const detalheResp = await fetchRaw('https://comercial.cooperflora.com.br/pedido/comprar/detalheProduto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'text/html, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': cookieStr,
          'Referer': 'https://comercial.cooperflora.com.br/pedido/comprar/principal',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: detalheBody,
      });

      // 5. Parsear HTML do detalhe para extrair sítios
      const html = detalheResp.body;

      // ── Estratégia primária: extrair JSON postOfertasBody embutido no HTML ──
      // O Cooperflora embute um JSON completo com todas as ofertas na variável JS postOfertasBody
      const sitios: Array<{
        codigoSitio: string;
        nomeSitio: string;
        logoUrl: string;
        embalagem: string;
        pontoAbertura: string;
        saldo: number;
        precoUnid: number;
        desconto: number;
        participaDesconto: boolean;
      }> = [];

      let nomeProduto = input.codigo;
      let codigoProduto = input.codigo;
      let qualidadeInfo = input.qualidade;
      let corInfo = '';
      let tamanhoInfo = '';
      let hastesNum: number | null = null;
      let imagemUrl = `https://apinovo.cooperflora.com.br/api/v1/imagem?codigo=${input.codigo}`;

      // Tentar extrair JSON postOfertasBody
      const jsonMatch = html.match(/var postOfertasBody\s*=\s*(\{[\s\S]*?\});/);
      if (jsonMatch) {
        try {
          const postData = JSON.parse(jsonMatch[1]);
          const produto = postData.PRODUTO || {};
          const ofertas: any[] = postData.OFERTAS || [];

          nomeProduto = produto.descricao || input.codigo;
          codigoProduto = produto.produto || input.codigo;
          qualidadeInfo = produto.qualidade || input.qualidade;
          corInfo = produto.corProduto || '';
          tamanhoInfo = produto.tamanho || '';
          hastesNum = produto.qtdeHasteMaco ? parseInt(String(produto.qtdeHasteMaco)) : null;
          if (produto.urlProduto) {
            imagemUrl = produto.urlProduto.startsWith('http')
              ? produto.urlProduto
              : `https://apinovo.cooperflora.com.br${produto.urlProduto}`;
          }

          for (const oferta of ofertas) {
            const codigoSitio = String(oferta.sitio || '');
            const nomeSitio = oferta.nomePropriedade || oferta.nomeProdutor || codigoSitio;
            const logoRaw = oferta.urlSitio || '';
            const logoUrl = logoRaw.startsWith('http')
              ? logoRaw
              : (logoRaw ? `https://apinovo.cooperflora.com.br${logoRaw}` : '');
            const qtdEmb = oferta.qtdPorEmbalagem || 1;
            const embalagem = `${qtdEmb} un`;
            const pontoAbertura = oferta.moqDescricao || 'PADRÃO';
            const saldo = parseInt(String(oferta.saldo || 0)) || 0;
            const precoUnid = parseFloat(String(oferta.preco || 0)) || 0;
            const desconto = 0;
            const participaDesconto = oferta.participaLMPM === 'S';

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
                participaDesconto,
              });
            }
          }
        } catch (_e) {
          // fallback para scraping HTML abaixo
        }
      }

      // ── Fallback: scraping HTML se JSON não encontrado ──
      if (sitios.length === 0) {
        const nomeMatchHtml = html.match(/<h5[^>]*class="[^"]*text-success[^"]*"[^>]*>\s*([^<]+?)\s*<\/h5>/i)
          || html.match(/<strong[^>]*>\s*([A-Z][A-Z0-9 ]+)\s*<\/strong>/);
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

        // Tentar extrair por data-cod-sitio
        const trPattern = /<tr[^>]*data-cod-sitio="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g;
        let trMatch;
        while ((trMatch = trPattern.exec(html)) !== null) {
          const [, codigoSitio, trContent] = trMatch;
          const tds: string[] = [];
          const tdPattern = /<td[^>]*>([\s\S]*?)<\/td>/g;
          let tdMatch;
          while ((tdMatch = tdPattern.exec(trContent)) !== null) {
            tds.push(tdMatch[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());
          }
          const logoMatch = trContent.match(/<img[^>]+src="([^"]+)"/);
          const logoUrl = logoMatch ? (logoMatch[1].startsWith('http') ? logoMatch[1] : `https://comercial.cooperflora.com.br${logoMatch[1]}`) : '';
          const nomeSitio = tds[2] || tds[1] || '';
          const embalagem = tds[3] || '';
          const pontoAbertura = tds[4] || 'PADRÃO';
          const saldo = parseInt((tds[5] || '0').replace(/[^0-9]/g, '')) || 0;
          const precoUnid = parseFloat((tds[7] || '0').replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
          const desconto = parseFloat((tds[8] || '0').replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
          const participaDesconto = (tds[9] || '').toLowerCase().includes('sim');
          if (nomeSitio) {
            sitios.push({ codigoSitio, nomeSitio: nomeSitio.trim(), logoUrl, embalagem: embalagem.trim(), pontoAbertura: pontoAbertura.trim(), saldo, precoUnid, desconto, participaDesconto });
          }
        }

        // Tentar por data-row-index
        if (sitios.length === 0) {
          const trPattern2 = /<tr[^>]*data-row-index="[^"]+"[^>]*>([\s\S]*?)<\/tr>/g;
          let trMatch2;
          while ((trMatch2 = trPattern2.exec(html)) !== null) {
            const trContent = trMatch2[1];
            if (!trContent.includes('<td')) continue;
            const tds: string[] = [];
            const tdPattern2 = /<td[^>]*>([\s\S]*?)<\/td>/g;
            let tdMatch2;
            while ((tdMatch2 = tdPattern2.exec(trContent)) !== null) {
              tds.push(tdMatch2[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim());
            }
            if (tds.length < 5) continue;
            const codigoSitio = tds[0].replace(/\D/g, '') || '';
            if (!codigoSitio) continue;
            const logoMatch2 = trContent.match(/<img[^>]+src="([^"]+)"/);
            const logoUrl = logoMatch2 ? (logoMatch2[1].startsWith('http') ? logoMatch2[1] : `https://apinovo.cooperflora.com.br${logoMatch2[1]}`) : '';
            const nomeSitio = tds[2] || tds[1] || '';
            const embalagem = tds[3] || '';
            const pontoAbertura = tds[4] || 'PADRÃO';
            const saldo = parseInt((tds[5] || '0').replace(/[^0-9]/g, '')) || 0;
            const precoUnid = parseFloat((tds[7] || '0').replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
            const desconto = parseFloat((tds[8] || '0').replace(',', '.').replace(/[^0-9.]/g, '')) || 0;
            const participaDesconto = (tds[9] || '').toLowerCase().includes('sim');
            if (nomeSitio && precoUnid > 0) {
              sitios.push({ codigoSitio, nomeSitio: nomeSitio.trim(), logoUrl, embalagem: embalagem.trim(), pontoAbertura: pontoAbertura.trim(), saldo, precoUnid, desconto, participaDesconto });
            }
          }
        }
      }

      // Extrair hastesEmbalagem do primeiro sítio (ex: "100 un" -> 100)
      const primeiroSitio = sitios[0];
      const hastesEmbNum = primeiroSitio
        ? (() => { const m = primeiroSitio.embalagem.match(/(\d+)/); return m ? parseInt(m[1]) : 1; })()
        : 1;
      // Salvar hastes e hastesEmbalagem no banco para uso na tabela do catálogo
      if (hastesNum && hastesNum > 1) {
        await db.updateCooperfloraHastes(input.codigo, hastesNum, hastesEmbNum).catch(() => {});
      } else if (hastesEmbNum > 1) {
        await db.updateCooperfloraHastes(input.codigo, 1, hastesEmbNum).catch(() => {});
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
        htmlRaw: html.length > 100 ? 'ok' : 'empty',
      };
    }),

    // ─── Margens por Departamento ───
    listarMargensDepartamento: protectedProcedure.query(async () => {
      return db.listMargensDepartamento();
    }),

    salvarMargemDepartamento: protectedProcedure.input(z.object({
      grupo: z.string().min(1),
      margem: z.number().min(0).max(500),
    })).mutation(async ({ input }) => {
      await db.upsertMargemDepartamento(input.grupo, input.margem);
      return { ok: true };
    }),

    deletarMargemDepartamento: protectedProcedure.input(z.object({
      grupo: z.string().min(1),
    })).mutation(async ({ input }) => {
      await db.deleteMargemDepartamento(input.grupo);
      return { ok: true };
    }),

    // ─── Preview de Sincronização (dry-run) ───
    previewSync: protectedProcedure.query(async () => {
      const config = await db.getCooperfloraConfig();
      const margemPadrao = parseFloat(String(config?.margemPadrao || '30'));
      return db.previewSyncVendas(margemPadrao);
    }),

    // ─── Confirmar Sincronização (aplica itens aprovados) ───
    confirmarSync: protectedProcedure.input(z.object({
      codigosAprovados: z.array(z.string()),
    })).mutation(async ({ input }) => {
      const config = await db.getCooperfloraConfig();
      const margemPadrao = parseFloat(String(config?.margemPadrao || '30'));
      return db.aplicarSyncVendas(input.codigosAprovados, margemPadrao);
    }),
    // ─── Histórico de Sincronizações ───
    getHistoricoSync: protectedProcedure.query(async () => {
      return db.listarSyncHistorico('COOPERFLORA', 50);
    }),
    // ─── Status do Auto-Sync ───
    getAutoSyncStatus: protectedProcedure.query(() => {
      return schedulerStatus.cooperflora;
    }),
  }),
  // ─── Veiling ───
  veiling: router({
    getConfig: protectedProcedure.query(async () => {
      const cfg = await db.getVeilingConfig();
      return cfg ? { ...cfg, senha: cfg.senha ? '••••••' : '' } : null;
    }),
    saveConfig: protectedProcedure.input(z.object({
      usuario: z.string().min(1),
      senha: z.string().min(1),
      customerId: z.string().default('987'),
      customerIdPedidos: z.string().default('5191'),
      margemGlobal: z.number().min(0).max(200).default(30),
    })).mutation(async ({ input }) => {
      await db.saveVeilingConfig({
        usuario: input.usuario,
        senha: input.senha,
        customerId: input.customerId,
        customerIdPedidos: input.customerIdPedidos,
        margemGlobal: String(input.margemGlobal),
      });
      return { ok: true };
    }),
    setDataCarregamento: protectedProcedure.input(z.object({
      dataCarregamento: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato dd/MM/yyyy'),
    })).mutation(async ({ input }) => {
      await db.saveVeilingConfig({ dataCarregamento: input.dataCarregamento });
      return { ok: true };
    }),
    listProdutos: protectedProcedure.input(z.object({
      categoria: z.string().optional(),
      produtor: z.string().optional(),
      busca: z.string().optional(),
      cor: z.string().optional(),
      cores: z.array(z.string()).optional(),
      limit: z.number().default(48),
      offset: z.number().default(0),
    })).query(async ({ input }) => {
      // Buscar dados em paralelo: produtos, config e TODAS as margens de uma vez (evita N queries)
      const [result, cfg, todasMargens] = await Promise.all([
        db.listVeilingProdutos(input),
        db.getVeilingConfig(),
        db.listVeilingMargens(),
      ]);
      const margemGlobal = parseFloat(String(cfg?.margemGlobal || '30'));
      // Montar mapa de margens por categoria normalizada (1 query em vez de N)
      const margemMap = new Map<string, number>();
      for (const m of todasMargens) {
        const key = m.categoria.toLowerCase().trim();
        margemMap.set(key, Number(m.margem));
      }
      function getMargemPorCategoria(categoria: string): number {
        const c = (categoria || '').toLowerCase().trim();
        if (c.includes('corte')) return margemMap.get('produto de corte') ?? margemMap.get('flores de corte') ?? margemGlobal;
        if (c.includes('envasada')) return margemMap.get('flor envasada') ?? margemGlobal;
        if (c.includes('ornamental') || c.includes('planta')) return margemMap.get('planta ornamental') ?? margemGlobal;
        if (c.includes('decorado') || c.includes('decorada')) return margemMap.get('produto decorado') ?? margemGlobal;
        return margemMap.get(c) ?? margemGlobal;
      }
      // Enriquecer produtos com preço de venda (sem queries adicionais)
      const enriched = result.items.map((item) => {
        const margem = getMargemPorCategoria(item.categoria || '');
        // Custo base: prioridade precoEmbalagem > precoCamada > precoCarrinho
        const _emb1 = item.precoEmbalagem != null ? Number(item.precoEmbalagem) : 0;
        const _cam1 = item.precoCamada != null ? Number(item.precoCamada) : 0;
        const _car1 = item.precoCarrinho != null ? Number(item.precoCarrinho) : 0;
        const custoBaseVal = (_emb1 > 0 ? _emb1 : (_cam1 > 0 ? _cam1 : _car1));
        // Frete: valor por unidade (já salvo no banco)
        const freteUnit = item.frete != null ? Number(item.frete) : 0;
        // Custo com frete
        const custoComFrete = custoBaseVal + freteUnit;
        // ICMS: se o produto tem icms (ex: 0.82), dividir pelo fator para embutir o imposto
        const icmsFator = (item as any).icms != null ? Number((item as any).icms) : null;
        const custoFinal = icmsFator && icmsFator > 0 && icmsFator < 1
          ? custoComFrete / icmsFator
          : custoComFrete;
        // Valor do ICMS pago a mais (por unidade)
        const valorIcmsUnit = icmsFator && icmsFator > 0 && icmsFator < 1
          ? Math.round((custoFinal - custoComFrete) * 100) / 100
          : 0;
        const qtdVenda = Number((item as any).qtdVenda) || Number(item.multiplo) || 1;
        const precoVenda = custoFinal > 0 ? Math.round(custoFinal * (1 + margem / 100) * qtdVenda * 100) / 100 : 0;
        return { ...item, margem, precoVenda, custoFinal: Math.round(custoFinal * 100) / 100, freteUnit, valorIcmsUnit };
      });
      return { ...result, items: enriched };
    }),

    // Versão pública de listProdutos (sem autenticação)
    listProdutosPublico: publicProcedure.input(z.object({
      categoria: z.string().optional(),
      produtor: z.string().optional(),
      busca: z.string().optional(),
      cor: z.string().optional(),
      cores: z.array(z.string()).optional(),
      letra: z.string().optional(),
      limit: z.number().default(48),
      offset: z.number().default(0),
    })).query(async ({ input }) => {
      // Buscar dados em paralelo: produtos, config e TODAS as margens de uma vez (evita N queries)
      const [result, cfg, todasMargens] = await Promise.all([
        db.listVeilingProdutos(input),
        db.getVeilingConfig(),
        db.listVeilingMargens(),
      ]);
      const margemGlobal = parseFloat(String(cfg?.margemGlobal || '30'));
      // Montar mapa de margens por categoria normalizada (1 query em vez de N)
      const margemMap = new Map<string, number>();
      for (const m of todasMargens) {
        const key = m.categoria.toLowerCase().trim();
        margemMap.set(key, Number(m.margem));
      }
      function getMargemPorCategoria(categoria: string): number {
        const c = (categoria || '').toLowerCase().trim();
        if (c.includes('corte')) return margemMap.get('produto de corte') ?? margemMap.get('flores de corte') ?? margemGlobal;
        if (c.includes('envasada')) return margemMap.get('flor envasada') ?? margemGlobal;
        if (c.includes('ornamental') || c.includes('planta')) return margemMap.get('planta ornamental') ?? margemGlobal;
        if (c.includes('decorado') || c.includes('decorada')) return margemMap.get('produto decorado') ?? margemGlobal;
        return margemMap.get(c) ?? margemGlobal;
      }
      // Enriquecer produtos com preço de venda (sem queries adicionais)
      const enriched = result.items.map((item) => {
        const margem = getMargemPorCategoria(item.categoria || '');
        // Custo base: prioridade precoEmbalagem > precoCamada > precoCarrinho
        const _emb1 = item.precoEmbalagem != null ? Number(item.precoEmbalagem) : 0;
        const _cam1 = item.precoCamada != null ? Number(item.precoCamada) : 0;
        const _car1 = item.precoCarrinho != null ? Number(item.precoCarrinho) : 0;
        const custoBaseVal = (_emb1 > 0 ? _emb1 : (_cam1 > 0 ? _cam1 : _car1));
        // Frete: valor por unidade (já salvo no banco)
        const freteUnit = item.frete != null ? Number(item.frete) : 0;
        // Custo com frete
        const custoComFrete = custoBaseVal + freteUnit;
        // ICMS: se o produto tem icms (ex: 0.82), dividir pelo fator para embutir o imposto
        const icmsFator = (item as any).icms != null ? Number((item as any).icms) : null;
        const custoFinal = icmsFator && icmsFator > 0 && icmsFator < 1
          ? custoComFrete / icmsFator
          : custoComFrete;
        // Valor do ICMS pago a mais (por unidade)
        const valorIcmsUnit = icmsFator && icmsFator > 0 && icmsFator < 1
          ? Math.round((custoFinal - custoComFrete) * 100) / 100
          : 0;
        const qtdVenda = Number((item as any).qtdVenda) || Number(item.multiplo) || 1;
        const precoVenda = custoFinal > 0 ? Math.round(custoFinal * (1 + margem / 100) * qtdVenda * 100) / 100 : 0;
        return { ...item, margem, precoVenda, custoFinal: Math.round(custoFinal * 100) / 100, freteUnit, valorIcmsUnit };
      });
      return { ...result, items: enriched };
    }),

    sincronizar: protectedProcedure.input(z.object({
      sessionId: z.string().optional(),
    })).mutation(async ({ input }) => {
      // Iniciar sincronização em background para evitar timeout do proxy (504)
      // O progresso é enviado via SSE (endpoint /api/cooperflora/sync-stream)
      const sid = input.sessionId || `veiling-${Date.now()}`;
      const veilingSyncInicioMs = Date.now();
      const emit = (fase: string, atual: number, total: number, msg?: string) => {
        syncProgressEmitter.emit(SYNC_EVENT, sid, { phase: fase, current: atual, total, message: msg ?? fase });
      };
      // Verificar credenciais antes de iniciar background job
      const cfgCheck = await db.getVeilingConfig();
      if (!cfgCheck || !cfgCheck.usuario || !cfgCheck.senha) {
        throw new Error('Configure o usuário e senha do Veiling em Configurações antes de sincronizar.');
      }
      // Lançar processo em background (não aguarda conclusão)
      (async () => {
        try {
      const cfg = await db.getVeilingConfig();
      if (!cfg || !cfg.usuario || !cfg.senha) {
        await db.registrarSyncHistorico({ fonte: 'VEILING', status: 'FALHA', total: 0, mensagem: 'Credenciais não configuradas', duracaoMs: Date.now() - veilingSyncInicioMs });
        emit('erro', 0, 0, 'Credenciais não configuradas');
        return;
      }
      emit('login', 0, 1, 'Autenticando no Veiling Online...');
      const tokenData = await veilingLogin(cfg.usuario, cfg.senha);
      const token = tokenData.access_token;
      emit('categorias', 0, 1, 'Buscando categorias...');
      const categorias = await veilingGetCategories(token);
      emit('produtos', 0, 1, 'Buscando ofertas...');
      const todasOfertas = await veilingGetAllOffers(
        token,
        cfg.customerId,
        undefined,
        (atual, total) => emit('produtos', atual, total, `Carregando ofertas: ${atual}/${total}`)
      );
      emit('salvando', 0, todasOfertas.length, 'Salvando no banco de dados...');
      // Mapa de categoriaId → descrição para resolver nomes ausentes
      // Suporta lookup por ID numérico, código string ("01") e código sem zero ("1")
      const catMapById = new Map<number, string>(categorias.map(c => [c.id, c.description]));
      const catMapByCode = new Map<string, string>(categorias.map(c => [c.code, c.description]));
      const catMapByCodeTrimmed = new Map<string, string>(categorias.map(c => [String(parseInt(c.code, 10)), c.description]));
      // Buscar dados de GFP para cada oferta (com limite de concorrência)
      emit('gfp', 0, todasOfertas.length, 'Buscando dados de GFP das ofertas...');
      // GFP só existe para ofertas LKP (offerType=1). A data deve ser o próximo dia de leilão.
      // A API retorna 204 para hoje e 200 para amanhã, então usamos amanhã como padrão.
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const auctionDate = tomorrow.toISOString().substring(0, 10);
      // Filtrar apenas ofertas LKP (offerType=1) para não desperdiçar chamadas
      const lkpOfertas = todasOfertas.filter(o => Number(o.offerType) === 1);
      // Mapa offerId → dados GFP
      const gfpMap = new Map<number, { quality: string; gfpNumero: string; obs1: string; obs2: string; deliveryDate: string; serie: string; lote: string; packingId: number }>();
      // Processar em lotes de 30 para reduzir o número de iterações e tempo total
      const BATCH_GFP = 30;
      for (let i = 0; i < lkpOfertas.length; i += BATCH_GFP) {
        const lote = lkpOfertas.slice(i, i + BATCH_GFP);
        await Promise.all(lote.map(async (o) => {
          try {
            const packingId = o.packings?.[0]?.id || 0;
            // LKP sempre usa offerType=1
            const gfps = await veilingGetGfpByOffer(token, o.offerId, 1, packingId, auctionDate);
            if (gfps && gfps.length > 0) {
              const g = gfps[0];
              // ATENÇÃO: Na API do Veiling, os campos são:
              // gfpNumber = Série do lote
              // lot = Número da GFP (ex: "A", "B")
              // series = vazio (não usado)
              // qualityObservation1/2 = Observações da GFP
              gfpMap.set(o.offerId, {
                quality: g.quality || '',
                gfpNumero: g.lot || '',           // lot = Nº GFP (ex: "A")
                obs1: g.qualityObservation1 || '',
                obs2: g.qualityObservation2 || '',
                deliveryDate: g.deliveryDate || '',
                serie: g.gfpNumber || '',         // gfpNumber = Série
                lote: g.lot || '',
                packingId,
              });
            }
          } catch { /* ignora erros individuais */ }
        }));
        emit('gfp', Math.min(i + BATCH_GFP, lkpOfertas.length), lkpOfertas.length, `GFP: ${Math.min(i + BATCH_GFP, lkpOfertas.length)}/${lkpOfertas.length}`);
        await new Promise(r => setTimeout(r, 50)); // pequena pausa entre lotes
      }
      const inseridos: import('../drizzle/schema').InsertVeilingProduto[] = todasOfertas.map(o => {
        const catId = Number(o.productCategory) || 0;
        const catNome = o.productCategoryDescription
          || catMapById.get(catId)
          || catMapByCode.get(o.productCategory)
          || catMapByCodeTrimmed.get(o.productCategory)
          || '';
        const gfp = gfpMap.get(o.offerId);
        return {
        offerId: o.offerId,
        nome: o.name,
        nomeCompleto: o.longName || o.name,
        categoria: catNome,
        categoriaId: catId,
        produtor: o.siteName || o.producerName || '',
        qualidade: o.quality || '',
        dimensao: o.dimension || '',
        embalagem: o.packagingName || '',
        precoCarrinho: o.trolleyPrice != null ? String(o.trolleyPrice) : null,
        precoCamada: o.layerPrice != null ? String(o.layerPrice) : null,
        precoEmbalagem: o.packagingPrice != null ? String(o.packagingPrice) : null,
        estoqueDisponivel: o.availableStock || 0,
        tipoOferta: o.offerType || '',
        dataValidade: o.endDate ? o.endDate.substring(0, 10) : null,
        imagemUrl: o.defaultImage || null,
        frete: (() => {
          // Tentar shippingFeeFilials primeiro (frete por unidade por filial)
          const filialFrete = o.shippingFeeFilials?.[0]?.productShippingValue;
          if (filialFrete != null && filialFrete > 0) return String(filialFrete);
          // Fallback: siteDeliveryPatterns
          const patternFrete = o.siteDeliveryPatterns?.[0]?.freightValue;
          if (patternFrete != null && patternFrete > 0) return String(patternFrete);
          // Fallback: shippingFee
          if (o.shippingFee != null && o.shippingFee > 0) return String(o.shippingFee);
          return null;
        })(),
        multiplo: o.packings?.[0]?.minimumQuantity || 1,
        compraMinima: 1,
        packingId: gfp?.packingId ?? (o.packings?.[0]?.id || 0),
        gfpQualidade: gfp?.quality ?? '',
        gfpNumero: gfp?.gfpNumero ?? '',
        gfpObs1: gfp?.obs1 ?? null,
        gfpObs2: gfp?.obs2 ?? null,
        gfpEntregaCvh: gfp?.deliveryDate ?? '',
        gfpSerie: gfp?.serie ?? '',
        gfpLote: gfp?.lote ?? '',
        // Cor do produto: vem do campo colors da API do Veiling
        cor: o.colors ? String(o.colors).toUpperCase().trim() : '',
        // Status do produto: derivado do offerType e dados GFP
        // offerType=1 (LKP): se tem GFP com entrega → RECEPCIONADO LKP; senão → NO SITIO LKP
        // offerType=2 (ENP): ESTQ NO PROD. ENP
        statusProduto: (() => {
          const tipoStr = String(o.offerType || '').trim();
          // offerType=2 → ENP (estoque no produtor)
          if (tipoStr === '2') return 'ENP';
          // offerType=1 (ou vazio/3) → LKP: verificar se tem GFP com entrega CVH
          const g = gfpMap.get(o.offerId);
          if (g && g.deliveryDate) return 'LKP_RECEPCIONADO';
          return 'LKP_SITIO';
        })(),
        };
      });
      const total = await db.upsertVeilingProdutos(inseridos);
      await db.saveVeilingConfig({ ultimaAtualizacao: new Date() });
      const veilingMsg = `Sincronização concluída! ${total} ofertas carregadas.`;
      emit('concluido', total, total, veilingMsg);
      await db.registrarSyncHistorico({ fonte: 'VEILING', status: 'SUCESSO', total, mensagem: veilingMsg, duracaoMs: Date.now() - veilingSyncInicioMs });
      // Cache de imagens em background: re-hospedar fotos temporárias do Veiling no S3 permanente
      cacheVeilingImages(inseridos.map(p => ({ offerId: p.offerId, imagemUrl: p.imagemUrl ?? null })))
        .catch(e => console.warn('[Sync Manual] Erro ao cachear imagens Veiling:', e instanceof Error ? e.message : String(e)));
        } catch (bgErr: unknown) {
          const msg = bgErr instanceof Error ? bgErr.message : String(bgErr);
          emit('erro', 0, 0, `Erro na sincronização: ${msg}`);
          await db.registrarSyncHistorico({ fonte: 'VEILING', status: 'FALHA', total: 0, mensagem: msg, duracaoMs: Date.now() - veilingSyncInicioMs });
        }
      })(); // fim do background job
      // Retornar imediatamente para evitar timeout do proxy
      return { total: 0, categorias: [], sessionId: sid, iniciado: true };
    }),
    // Alias para compatibilidade retroativa
    sincronizarStatus: protectedProcedure.input(z.object({
      sessionId: z.string(),
    })).query(({ input }) => {
      const last = syncProgressEmitter.getLastEvent(input.sessionId);
      return last || { phase: 'aguardando', current: 0, total: 0, message: 'Aguardando início...' };
    }),

    listarMargens: protectedProcedure.query(async () => db.listVeilingMargens()),
    salvarMargem: protectedProcedure.input(z.object({
      categoria: z.string().min(1),
      margem: z.number().min(0).max(200),
    })).mutation(async ({ input }) => {
      await db.upsertVeilingMargem(input.categoria, input.margem);
      return { ok: true };
    }),
    deletarMargem: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteVeilingMargem(input.id);
      return { ok: true };
    }),
    recategorizarProdutos: protectedProcedure.mutation(async () => {
      // Busca as categorias da API e corrige produtos com categoria vazia no banco
      const cfg = await db.getVeilingConfig();
      if (!cfg || !cfg.usuario || !cfg.senha) throw new Error('Configure o usuário e senha do Veiling.');
      const tokenData = await veilingLogin(cfg.usuario, cfg.senha);
      const categorias = await veilingGetCategories(tokenData.access_token);
      const catMapById = new Map<number, string>(categorias.map(c => [c.id, c.description]));
      const catMapByCode = new Map<string, string>(categorias.map(c => [c.code, c.description]));
      const catMapByCodeTrimmed = new Map<string, string>(categorias.map(c => [String(parseInt(c.code, 10)), c.description]));
       const corrigidos = await db.recategorizarVeilingProdutos(catMapById, catMapByCode, catMapByCodeTrimmed);
      return { corrigidos };
    }),
    getConversaoInfo: protectedProcedure.query(async () => {
      const count = await db.countVeilingConversao();
      return { count };
    }),
    // ─── Histórico de Sincronizações ───
    getHistoricoSync: protectedProcedure.query(async () => {
      return db.listarSyncHistorico('VEILING', 50);
    }),
    // ─── Status do Auto-Sync ───
    getAutoSyncStatus: protectedProcedure.query(() => {
      return schedulerStatus.veiling;
    }),
    cachearImagens: protectedProcedure.mutation(async () => {
      // Busca todos os produtos com imagemUrl mas sem imagemUrlCache e dispara o cache em background
      const { ENV } = await import('./_core/env');
      const mysql = await import('mysql2/promise');
      const conn = await (mysql as any).createConnection(ENV.databaseUrl);
      let total = 0;
      try {
        const [rows] = await conn.execute(
          'SELECT offerId, imagemUrl FROM veiling_produtos WHERE imagemUrl IS NOT NULL AND imagemUrl != "" AND (imagemUrlCache IS NULL OR imagemUrlCache = "") LIMIT 500'
        ) as any;
        total = (rows as any[]).length;
        if (total > 0) {
          cacheVeilingImages((rows as any[]).map((r: any) => ({ offerId: r.offerId, imagemUrl: r.imagemUrl })))
            .catch(e => console.warn('[cachearImagens] Erro:', e instanceof Error ? e.message : String(e)));
        }
      } finally {
        await conn.end();
      }
      return { iniciado: true, total };
    }),
    importarConversao: protectedProcedure.input(z.object({
      rows: z.array(z.object({
        codItem: z.string(),
        descCurta: z.string(),
        descLonga: z.string().default(''),
        qtdVenda: z.number().int().min(1),
        fotoUrl: z.string().nullable().optional(),
        qualidade: z.string().optional(),
        observacao: z.string().nullable().optional(),
        numGfp: z.string().optional(),
        icms: z.number().nullable().optional(), // fator ICMS ex: 0.82 = 18% ICMS
      })),
    })).mutation(async ({ input }) => {
      const total = await db.importVeilingConversao(input.rows);
      return { total };
    }),
    // ─── Veiling - Importação Automática de Pedidos ──────────────────────────────
    checkDuplicatasPedidos: protectedProcedure.input(z.object({
      data: z.string().optional(), // YYYY-MM-DD, default = hoje
    })).mutation(async ({ input }) => {
      // Verifica quais números de pedido já foram importados
      const dateStr = input.data || new Date().toISOString().split('T')[0];
      const config = await db.getVeilingConfig();
      if (!config?.usuario || !config?.senha) throw new Error("Credenciais não configuradas");
      const tokenData = await veilingLogin(config.usuario, config.senha);
      const token = tokenData.access_token;
      const accountCodePedidos = (config as any).customerIdPedidos || config.customerId || "5191";
      let customerId = accountCodePedidos;
      try {
        const meResp = await fetch('https://backend.veilingonline.com.br/ecommerce/api/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const meData = await meResp.json();
        const customers = meData.customers || meData.data?.customers || meData;
        if (Array.isArray(customers)) {
          const found = customers.find((c: any) => String(c.accountCode) === String(accountCodePedidos) || String(c.code) === String(accountCodePedidos));
          if (found) customerId = String(found.id);
        }
      } catch { /* usa accountCode */ }
      const exportUrl = `https://backend.veilingonline.com.br/ecommerce/api/sale/export?Data.CustomerId=${customerId}&Data.SaleDate=${dateStr}&Data.IsDirected=true&Data.IsVol=true&Data.IsTransit=true&Data.IsReceived=true`;
      const exportResp = await fetch(exportUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!exportResp.ok) return { duplicatas: [], totalNovos: 0 };
      const exportData = await exportResp.json();
      const base64 = exportData.data || exportData;
      if (!base64 || typeof base64 !== 'string') return { duplicatas: [], totalNovos: 0 };
      const buffer = Buffer.from(base64, 'base64');
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const parseResult = parseVeilingRows(rows);
      if (!parseResult.success || parseResult.items.length === 0) return { duplicatas: [], totalNovos: 0 };
      // Verificar quais números de pedido já existem no banco
      const numerosNovos = parseResult.items.map(i => i.pedido).filter(Boolean);
      if (numerosNovos.length === 0) return { duplicatas: [], totalNovos: parseResult.items.length };
      // Buscar itens com esses números de pedido já no banco
      const existentes = await db.checkTransacoesExistentes(numerosNovos);
      const numerosExistentes = new Set(existentes.map((e: any) => e.transacaoGfp));
      const duplicatas = parseResult.items
        .filter(i => i.pedido && numerosExistentes.has(i.pedido))
        .map(i => ({ pedido: i.pedido, descricao: i.descricao }));
      const totalNovos = parseResult.items.filter(i => !i.pedido || !numerosExistentes.has(i.pedido)).length;
      return { duplicatas, totalNovos };
    }),
    importarPedidosDia: protectedProcedure.input(z.object({
    data: z.string().optional(), // YYYY-MM-DD, default = hoje
    origem: z.enum(["AUTOMATICO", "MANUAL"]).default("MANUAL"),
    forcarImportacao: z.boolean().default(false), // true = importar mesmo com duplicatas
  })).mutation(async ({ input }) => {
    const config = await db.getVeilingConfig();
    if (!config?.usuario || !config?.senha) {
      throw new Error("Credenciais do Veiling não configuradas. Configure usuário e senha na aba Veiling.");
    }
    // Login na API do Veiling
    const tokenData = await veilingLogin(config.usuario, config.senha);
    const token = tokenData.access_token;
    // Resolver o ID interno do cliente a partir do accountCode configurado
    // O customerIdPedidos é o código externo (ex: 5191), mas a API precisa do ID interno
    const accountCodePedidos = (config as any).customerIdPedidos || config.customerId || "5191";
    let customerId = accountCodePedidos;
    try {
      const meResp = await fetch('https://backend.veilingonline.com.br/ecommerce/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (meResp.ok) {
        const meData = await meResp.json() as any;
        const customers: any[] = meData?.customers || [];
        // Buscar pelo accountCode (código externo) ou pelo id
        const found = customers.find((c: any) => 
          String(c.accountCode) === String(accountCodePedidos) ||
          String(c.id) === String(accountCodePedidos)
        );
        if (found) {
          customerId = String(found.id); // Usar o ID interno
        }
      }
    } catch (e) {
      // Se falhar, usar o valor configurado diretamente
    }
    // Data do pedido (parâmetro ou hoje)
    const dateStr = input.data || new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const dataBR = dateStr.split("-").reverse().join("/"); // DD/MM/YYYY
    // Buscar pedidos via API /ecommerce/api/sale/export (endpoint correto do Veiling)
    const exportParams = new URLSearchParams({
      'Data.CustomerId': customerId,
      'Data.Status': '',
      'Data.IsDirected': 'true',
      'Data.IsVol': 'true',
      'Data.IsTransit': 'true',
      'Data.IsReceived': 'true',
      'Data.SaleDate': dateStr,
    });
    const exportUrl = `https://backend.veilingonline.com.br/ecommerce/api/sale/export?${exportParams.toString()}`;
    const exportResp = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!exportResp.ok) {
      const errText = await exportResp.text();
      throw new Error(`Erro ao baixar pedidos do Veiling (${exportResp.status}): ${errText.substring(0, 200)}`);
    }
    // A API retorna JSON com campo "data" contendo o XLSX em base64
    let buffer: Buffer;
    const contentType = exportResp.headers.get("content-type") || "";
    if (contentType.includes("json")) {
      const jsonResp = await exportResp.json() as any;
      if (jsonResp?.data) {
        // XLSX em base64
        buffer = Buffer.from(jsonResp.data, 'base64');
      } else if (Array.isArray(jsonResp) && jsonResp.length === 0) {
        await db.createVeilingImportacao({
          dataPedidos: dateStr,
          totalItens: 0,
          totalPedidos: 0,
          status: "SUCESSO",
          mensagem: `Nenhum pedido encontrado para ${dataBR}`,
          origem: input.origem,
        });
        return { success: true, totalItens: 0, totalPedidos: 0, mensagem: `Nenhum pedido encontrado para ${dataBR}`, compraId: null };
      } else {
        // JSON com array de pedidos — converter para xlsx
        const jsonData = Array.isArray(jsonResp) ? jsonResp : [];
        const ws = XLSX.utils.json_to_sheet(jsonData);
        const wb2 = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb2, ws, "Pedidos");
        buffer = Buffer.from(XLSX.write(wb2, { type: "buffer", bookType: "xlsx" }));
      }
    } else {
      const arrayBuffer = await exportResp.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }
    // Parsear o arquivo xlsx
    const wb = XLSX.read(buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) throw new Error("Planilha vazia no arquivo de pedidos");
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    const parseResult = parseVeilingRows(rows);
    if (!parseResult.success || parseResult.items.length === 0) {
      await db.createVeilingImportacao({
        dataPedidos: dateStr,
        totalItens: 0,
        totalPedidos: 0,
        status: "PARCIAL",
        mensagem: parseResult.error || `Nenhum item válido para ${dataBR}`,
        origem: input.origem,
      });
      return { success: true, totalItens: 0, totalPedidos: 0, mensagem: parseResult.error || "Nenhum item", compraId: null };
    }
    const items = parseResult.items;
    const fornecedor = extractFornecedorFromChave(parseResult.chaveInfo) || config.usuario;
    // Buscar produtos cadastrados para vincular
    const produtosResult = await db.listProdutosLoja({ limit: 1000 });
    const produtosList = produtosResult.items || [];
    // Verificar quais números de pedido já existem (para marcar como duplicados)
    const numerosNovos = items.map(i => i.pedido).filter(Boolean);
    const existentesSet = new Set<string>();
    if (numerosNovos.length > 0) {
      const existentes = await db.checkTransacoesExistentes(numerosNovos);
      existentes.forEach((e: any) => { if (e.transacaoGfp) existentesSet.add(String(e.transacaoGfp)); });
    }
    const itensPayload = items.map(item => {
      const existing = produtosList.find((p: any) =>
        p.nome?.toLowerCase() === item.descricao?.toLowerCase()
      );
      const qtdTotal = item.totalUn || 1;
      const isDuplicado = item.pedido ? existentesSet.has(item.pedido) : false;
      return {
        produtoId: existing?.id ?? undefined,
        produtoNome: item.descricao,
        quantidade: String(qtdTotal),
        valorUnitario: String(item.vlrUnit || 0),
        subtotal: String(qtdTotal * (item.vlrUnit || 0)),
        transacaoGfp: item.pedido || null,
        isDuplicado: isDuplicado ? 1 : 0,
      };
    });
    const total = itensPayload.reduce((s, i) => s + parseFloat(i.subtotal), 0);
    // Criar a compra no sistema
    const compraResult = await db.createCompra(
      { fornecedor, data: dateStr, total: total.toFixed(2), origem: "IMPORTACAO", status: "RASCUNHO" },
      itensPayload as any
    );
    // Sincronizar produtos loja
    for (const item of itensPayload) {
      if (item.produtoNome?.trim()) {
        await db.upsertProdutoLojaFromCompra({
          nome: item.produtoNome.trim(),
          precoCusto: parseFloat(item.valorUnitario) || 0,
          quantidade: parseFloat(item.quantidade) || 0,
        });
      }
    }
    // Registrar no histórico
    await db.createVeilingImportacao({
      dataPedidos: dateStr,
      totalItens: items.length,
      totalPedidos: 1,
      compraId: compraResult,
      status: "SUCESSO",
      mensagem: `${items.length} itens importados de ${dataBR}`,
      origem: input.origem,
    });
    return { success: true, totalItens: items.length, totalPedidos: 1, mensagem: `${items.length} itens importados`, compraId: compraResult };
  }),
    listarImportacoes: protectedProcedure.query(async () => {
      return db.listVeilingImportacoes(30);
    }),
    criarPedidoPublico: publicProcedure.input(z.object({
      linkToken: z.string(),
      clienteNome: z.string().min(1),
      clienteEmail: z.string().email(),
      clienteTelefone: z.string().min(1),
      itens: z.array(z.object({
        produtoNome: z.string(),
        quantidade: z.number().min(0.01),
        valorUnitario: z.number().min(0),
        qualidade: z.string().optional(),
        produtor: z.string().optional(),
        produtoId: z.number().optional(),
      })),
    })).mutation(async ({ input }) => {
      try {
        // Verificar bloqueio de terça 20:00 até quinta 07:00
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = domingo, 2 = terça, 4 = quinta
        const hour = now.getHours();
        const isBlockedTime = (dayOfWeek === 2 && hour >= 20) || (dayOfWeek === 3) || (dayOfWeek === 4 && hour < 7);
        if (isBlockedTime) {
          throw new Error('Pedidos bloqueados de terça às 20:00 até quinta às 07:00. Em caso de dúvidas, chamar no WhatsApp.');
        }
        const total = input.itens.reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0);
        const pedido = await db.createPedidoPublico(
          {
            linkToken: input.linkToken,
            clienteNome: input.clienteNome,
            clienteEmail: input.clienteEmail,
            clienteTelefone: input.clienteTelefone,
            total: String(total),
            status: 'PENDENTE',
          } as any,
          input.itens.map(item => ({
            produtoNome: item.produtoNome,
            quantidade: String(item.quantidade),
            valorUnitario: String(item.valorUnitario),
            subtotal: String(item.quantidade * item.valorUnitario),
            observacao: item.qualidade ? `Qualidade: ${item.qualidade}${item.produtor ? ` - ${item.produtor}` : ''}` : (item.produtor ? item.produtor : undefined),
          } as any)),
          input.itens.map(item => ({
            produtoId: (item as any).produtoId,
            quantidade: item.quantidade,
          }))
        );

        // Criar orçamento automaticamente na tabela vendas com origem CATALOGO_VEILING
        let vendaId: number | null = null;
        try {
          const hoje = new Date().toISOString().substring(0, 10);
          vendaId = await db.createVenda(
            {
              clienteNome: input.clienteNome,
              telefoneCliente: input.clienteTelefone,
              data: hoje,
              status: 'AGUARDANDO',
              total: String(total),
              frete: '0.00',
              origem: 'CATALOGO_VEILING',
              observacaoPedido: `Pedido via catálogo público Veiling\nEmail: ${input.clienteEmail}\nTelefone: ${input.clienteTelefone}`,
            } as any,
            input.itens.map((item, idx) => ({
              produtoNome: item.produtoNome,
              quantidade: String(item.quantidade),
              valorUnitario: String(item.valorUnitario),
              subtotal: String(item.quantidade * item.valorUnitario),
              observacao: item.qualidade ? `Qualidade: ${item.qualidade}${item.produtor ? ` - ${item.produtor}` : ''}` : (item.produtor ? item.produtor : undefined),
              ordem: idx,
            } as any))
          );
          // Salvar vendaId no pedido público para rastrear conversão
          if (vendaId && pedido?.id) {
            try {
              await db.updatePedidoPublicoVendaId(pedido.id, vendaId);
            } catch (e) {
              console.error('[criarPedidoPublico] Erro ao salvar vendaId:', e);
            }
          }
        } catch (err) {
          console.error('[criarPedidoPublico] Erro ao criar orçamento:', err);
        }
        // Emitir evento SSE para notificar todos os usuários logados
        try {
          pedidoPublicoEmitter.emit('novo-pedido', {
            id: pedido?.id,
            vendaId,
            clienteNome: input.clienteNome,
            total,
            itens: input.itens.length,
          });
        } catch (err) {
          console.error('[criarPedidoPublico] Erro ao emitir evento SSE:', err);
        }

        // Notificar proprietário sobre novo pedido público
        try {
          const itemsText = input.itens.map(i => `${i.produtoNome} x ${i.quantidade} @ R$ ${i.valorUnitario.toFixed(2)}`).join('\n');
          await notifyOwner({
            title: `📦 Novo Pedido Público - ${input.clienteNome}`,
            content: `Cliente: ${input.clienteNome}\nEmail: ${input.clienteEmail}\nTelefone: ${input.clienteTelefone}\n\nItens:\n${itemsText}\n\nTotal: R$ ${total.toFixed(2)}`,
          });
        } catch (err) {
          console.error('Erro ao notificar proprietário:', err);
        }

        return { ...pedido, vendaId };
      } catch (err) {
        console.error('[criarPedidoPublico] Erro geral:', err);
        throw new Error(`Erro ao criar pedido: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),
    getPedidoPublico: publicProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      return db.getPedidoPublico(input.id);
    }),
    // ─── Procedures públicas para catálogo público ───
    listar: publicProcedure.input(z.object({
      pagina: z.number().default(0),
      limite: z.number().default(50),
      busca: z.string().optional(),
      cor: z.string().optional(),
      cores: z.array(z.string()).optional(),
      categoria: z.string().optional(),
      produtor: z.string().optional(),
    })).query(async ({ input }) => {
      const offset = input.pagina * input.limite;
      const [result, cfg] = await Promise.all([
        db.listVeilingProdutos({
          categoria: input.categoria,
          produtor: input.produtor,
          busca: input.busca,
          cor: input.cor,
          cores: input.cores,
          limit: input.limite + 1,
          offset,
        }),
        db.getVeilingConfig(),
      ]);
      const margemGlobal = parseFloat(String(cfg?.margemGlobal || '30'));
      const enriched = await Promise.all(result.items.slice(0, input.limite).map(async (item) => {
        const margem = await db.getVeilingMargemEfetiva(item.categoria || '', margemGlobal);
        const _emb1 = item.precoEmbalagem != null ? Number(item.precoEmbalagem) : 0;
        const _cam1 = item.precoCamada != null ? Number(item.precoCamada) : 0;
        const _car1 = item.precoCarrinho != null ? Number(item.precoCarrinho) : 0;
        const custoBaseVal = (_emb1 > 0 ? _emb1 : (_cam1 > 0 ? _cam1 : _car1));
        const freteUnit = item.frete != null ? Number(item.frete) : 0;
        const custoComFrete = custoBaseVal + freteUnit;
        const icmsFator = (item as any).icms != null ? Number((item as any).icms) : null;
        const custoFinal = icmsFator && icmsFator > 0 && icmsFator < 1
          ? custoComFrete / icmsFator
          : custoComFrete;
        const qtdVenda = Number((item as any).qtdVenda) || Number(item.multiplo) || 1;
        const precoVenda = custoFinal > 0 ? Math.round(custoFinal * (1 + margem / 100) * qtdVenda * 100) / 100 : 0;
        return {
          id: item.id,
          offerId: (item as any).offerId || null,
          nome: item.nome,
          nomeCompleto: (item as any).nomeCompleto || item.nome,
          categoria: item.categoria,
          produtor: item.produtor,
          cor: item.cor,
          qualidade: item.qualidade,
          qtdVenda,
          precoVenda: String(precoVenda),
          imagemUrl: (item as any).imagemUrl || null,
          estoqueDisponivel: (item as any).estoqueDisponivel ?? null,
        };
      }));
      return {
        produtos: enriched,
        hasMore: result.items.length > input.limite,
        total: result.total,
      };
    }),
    getInfoLink: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const link = await db.getVeilingCatalogoLink(input.token);
      if (!link) return null;
      const filtroCor = (link as any).filtroCor || '';
      return {
        filtroCategoria: (link as any).filtroCategoria || '',
        filtroProdutor: (link as any).filtroProdutor || '',
        filtroCores: filtroCor ? filtroCor.split(',').filter((c: string) => c.trim()) : [],
        filtroBusca: (link as any).filtroBusca || '',
      };
    }),
    getCategorias: publicProcedure.query(async () => {
      const result = await db.getVeilingCategorias();
      return Array.isArray(result) ? result : [];
    }),
    getCores: publicProcedure.query(async () => {
      const result = await db.getCoresVeiling();
      return Array.isArray(result) ? result : [];
    }),
    getProdutores: publicProcedure.input(z.object({
      categoria: z.string().optional(),
    })).query(async ({ input }) => {
      const result = await db.getVeilingProdutores(input.categoria);
      return Array.isArray(result) ? result : [];
    }),
    gerarLinkCatalogo: protectedProcedure.input(z.object({
      diasValidade: z.number().min(1).max(365).default(7),
      filtroCategoria: z.string().optional().default(''),
      filtroProdutor: z.string().optional().default(''),
      filtroCores: z.array(z.string()).optional().default([]),
      filtroBusca: z.string().optional().default(''),
    })).mutation(async ({ input, ctx }) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.diasValidade);
      const link = await db.createVeilingCatalogoLink(
        expiresAt,
        ctx.user.name || ctx.user.openId,
        input.filtroCategoria || '',
        input.filtroProdutor || '',
        (input.filtroCores || []).join(','),
        input.filtroBusca || '',
      );
      return link;
    }),
    listarLinksPublicos: protectedProcedure.query(async () => {
      return db.listVeilingCatalogoLinks();
    }),
    deletarLinkPublico: protectedProcedure.input(z.object({ token: z.string() })).mutation(async ({ input }) => {
      await db.deleteVeilingCatalogoLink(input.token);
      return { ok: true };
    }),
    // ─── Gerenciamento de Pedidos Públicos ───
    listarPedidosPublicos: protectedProcedure.input(z.object({
      status: z.enum(['PENDENTE', 'CONFIRMADO', 'CONVERTIDO', 'CANCELADO']).optional(),
      busca: z.string().optional(),
      limit: z.number().min(1).max(500).default(50),
      offset: z.number().min(0).default(0),
    })).query(async ({ input }) => {
      const allPedidos = await db.listPedidosPublicos();
      let filtered = allPedidos;
      
      if (input.status) {
        filtered = filtered.filter((p: any) => p.status === input.status);
      }
      
      if (input.busca) {
        const searchLower = input.busca.toLowerCase();
        filtered = filtered.filter((p: any) => 
          p.clienteNome.toLowerCase().includes(searchLower) ||
          p.clienteEmail.toLowerCase().includes(searchLower) ||
          p.clienteTelefone.includes(input.busca)
        );
      }
      
      const total = filtered.length;
      const items = filtered.slice(input.offset, input.offset + input.limit);
      
      // Carregar itens para cada pedido
      const itemsWithDetails = await Promise.all(
        items.map(async (pedido: any) => {
          const detalhes = await db.getPedidoPublico(pedido.id);
          return detalhes;
        })
      );
      
      return { items: itemsWithDetails, total };
    }),
    obterPedidoPublico: protectedProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      return db.getPedidoPublico(input.id);
    }),
    atualizarStatusPedido: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(['PENDENTE', 'CONFIRMADO', 'CONVERTIDO', 'CANCELADO']),
    })).mutation(async ({ input, ctx }) => {
      await db.updatePedidoPublicoStatus(input.id, input.status);
      
      // Notificar cliente sobre mudança de status
      const pedido = await db.getPedidoPublico(input.id);
      if (pedido) {
        try {
          const statusTexto = {
            'PENDENTE': 'Pendente',
            'CONFIRMADO': 'Confirmado',
            'CONVERTIDO': 'Convertido em Venda',
            'CANCELADO': 'Cancelado',
          }[input.status] || input.status;
          
          // Aqui você pode adicionar envio de email ao cliente
          console.log(`Pedido ${input.id} atualizado para ${input.status}`);
        } catch (err) {
          console.error('Erro ao notificar cliente:', err);
        }
      }
      
      return { ok: true };
    }),
    converterEmOrcamento: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input, ctx }) => {
      // Verificar se já foi convertido
      const pedido = await db.getPedidoPublico(input.id);
      if (!pedido) throw new TRPCError({ code: 'NOT_FOUND', message: 'Pedido não encontrado' });
      if (pedido.vendaId) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Este pedido já foi convertido no Orçamento #${pedido.vendaId}`,
        });
      }
      // Criar orçamento a partir do pedido público
      const hoje = new Date().toISOString().slice(0, 10);
      const itens = Array.isArray(pedido.itens) ? pedido.itens : [];
      const totalVenda = itens.reduce((s: number, i: any) => s + parseFloat(i.subtotalVenda ?? i.subtotal ?? 0), 0);
      const vendaId = await db.createVenda(
        {
          clienteNome: pedido.clienteNome,
          telefoneCliente: pedido.clienteTelefone ?? undefined,
          data: hoje,
          status: 'AGUARDANDO',
          total: String(totalVenda.toFixed(2)),
          frete: '0.00',
          observacaoPedido: pedido.observacoes ?? undefined,
          origem: 'CATALOGO_VEILING',
        },
        itens.map((item: any, idx: number) => ({
          vendaId: 0, // será sobrescrito pelo createVenda
          produtoId: item.produtoId ?? undefined,
          produtoNome: item.produtoNome,
          quantidade: String(item.quantidade),
          valorUnitario: String(parseFloat(item.valorUnitario ?? item.precoVenda ?? 0).toFixed(2)),
          subtotal: String(parseFloat(item.subtotalVenda ?? item.subtotal ?? 0).toFixed(2)),
          ordem: idx,
        }))
      );
      if (!vendaId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao criar orçamento' });
      // Vincular vendaId ao pedido e marcar como CONVERTIDO
      await db.updatePedidoPublicoVendaId(input.id, vendaId);
      return { vendaId };
    }),
    // ─── Filtros Salvos ───
    salvarFiltro: protectedProcedure.input(z.object({
      nome: z.string().min(1).max(255),
      categoria: z.string().optional(),
      produtor: z.string().optional(),
      cor: z.string().optional(),
      busca: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      return db.saveVeilingFiltro(ctx.user.id, input.nome, input.categoria, input.produtor, input.cor, input.busca);
    }),
    listarFiltrosSalvos: protectedProcedure.query(async ({ ctx }) => {
      return db.listVeilingFiltros(ctx.user.id);
    }),
    obterFiltroSalvo: protectedProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input, ctx }) => {
      return db.getVeilingFiltro(input.id, ctx.user.id);
    }),
    deletarFiltroSalvo: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input, ctx }) => {
      return db.deleteVeilingFiltro(input.id, ctx.user.id);
    }),
    atualizarFiltroSalvo: protectedProcedure.input(z.object({
      id: z.number(),
      nome: z.string().min(1).max(255),
      categoria: z.string().optional(),
      produtor: z.string().optional(),
      cor: z.string().optional(),
      busca: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      return db.updateVeilingFiltro(input.id, ctx.user.id, input.nome, input.categoria, input.produtor, input.cor, input.busca);
    }),

    // ─── Criar Orçamento a partir do Carrinho Veiling ────────────────────────
    criarOrcamentoDoCarrinho: protectedProcedure.input(z.object({
      clienteId: z.number().optional(),
      clienteNome: z.string().min(1, 'Nome do cliente é obrigatório'),
      telefoneCliente: z.string().optional(),
      dataEntrega: z.string().optional(),
      observacaoPedido: z.string().optional(),
      itens: z.array(z.object({
        produtoId: z.number().optional(),
        produtoNome: z.string(),
        quantidade: z.number().min(1),
        valorUnitario: z.number().min(0),
        subtotal: z.number().min(0),
      })).min(1, 'O carrinho não pode estar vazio'),
    })).mutation(async ({ input, ctx }) => {
      const hoje = new Date().toISOString().split('T')[0];
      const total = input.itens.reduce((s, i) => s + i.subtotal, 0);
      const vendaId = await db.createVenda({
        clienteId: input.clienteId ?? null,
        clienteNome: input.clienteNome,
        telefoneCliente: input.telefoneCliente ?? null,
        data: hoje,
        dataEntrega: input.dataEntrega ?? null,
        observacaoPedido: input.observacaoPedido ?? null,
        status: 'AGUARDANDO',
        total: total.toFixed(2),
        vendedorNome: ctx.user.name ?? null,
      } as any, input.itens.map((item, idx) => ({
        produtoId: item.produtoId ?? null,
        produtoNome: item.produtoNome,
        quantidade: String(item.quantidade),
        valorUnitario: item.valorUnitario.toFixed(2),
        subtotal: item.subtotal.toFixed(2),
        ordem: idx,
      } as any)));
      if (!vendaId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro ao criar orçamento' });
      return { id: vendaId, numero: `#${String(vendaId).padStart(6, '0')}` };
    }),
  }),
  // ─── Cadastro de Produtos da Loja ────────────────────────────────────────────
  loja: router({
    listar: protectedProcedure.input(z.object({
      busca: z.string().optional(),
      departamento: z.string().optional(),
      ativo: z.number().optional(),
      limit: z.number().min(1).max(500).default(100),
      offset: z.number().min(0).default(0),
    })).query(async ({ input }) => {
      return db.listProdutosLoja(input);
    }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getProdutoLoja(input.id);
    }),

    criar: protectedProcedure.input(z.object({
      codigo: z.string().optional(),
      nome: z.string().min(1),
      descricao: z.string().optional(),
      unidade: z.string().default("UN"),
      departamento: z.string().default(""),
      preco: z.number().min(0).default(0),
      precoCusto: z.number().min(0).optional(),
      estoque: z.number().default(0),
      ativo: z.number().default(1),
      imagemUrl: z.string().optional(),
    })).mutation(async ({ input }) => {
      return db.createProdutoLoja({
        ...input,
        preco: String(input.preco),
        precoCusto: input.precoCusto != null ? String(input.precoCusto) : null,
        estoque: String(input.estoque),
      });
    }),

    atualizar: protectedProcedure.input(z.object({
      id: z.number(),
      codigo: z.string().optional(),
      nome: z.string().min(1).optional(),
      descricao: z.string().optional(),
      unidade: z.string().optional(),
      departamento: z.string().optional(),
      preco: z.number().min(0).optional(),
      precoCusto: z.number().min(0).optional().nullable(),
      estoque: z.number().optional(),
      ativo: z.number().optional(),
      imagemUrl: z.string().optional().nullable(),
    })).mutation(async ({ input }) => {
      const { id, preco, precoCusto, estoque, ...rest } = input;
      return db.updateProdutoLoja(id, {
        ...rest,
        ...(preco !== undefined ? { preco: String(preco) } : {}),
        ...(precoCusto !== undefined ? { precoCusto: precoCusto != null ? String(precoCusto) : null } : {}),
        ...(estoque !== undefined ? { estoque: String(estoque) } : {}),
      });
    }),

    deletar: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteProdutoLoja(input.id);
      return { ok: true };
    }),

    listDepartamentos: protectedProcedure.query(async () => {
      return db.listDepartamentosLoja();
    }),
    // ─── Ajuste de Estoque ───
    ajustarEstoque: protectedProcedure.input(z.object({
      produtoId: z.number(),
      tipo: z.enum(["ENTRADA", "SAIDA", "AJUSTE"]),
      quantidade: z.number().positive(),
      justificativa: z.string().min(3),
    })).mutation(async ({ input, ctx }) => {
      const usuarioNome = (ctx.user as any)?.name || (ctx.user as any)?.username || "Usuário";
      const usuarioId = String((ctx.user as any)?.id || "");
      return db.criarMovimentacaoEstoque({
        produtoId: input.produtoId,
        tipo: input.tipo,
        quantidade: input.quantidade,
        justificativa: input.justificativa,
        usuarioNome,
        usuarioId,
      });
    }),
    listarMovimentacoes: protectedProcedure.input(z.object({
      produtoId: z.number().optional(),
      tipo: z.enum(["ENTRADA", "SAIDA", "AJUSTE"]).optional(),
      usuarioNome: z.string().optional(),
      limit: z.number().min(1).max(500).default(100),
      offset: z.number().min(0).default(0),
    })).query(async ({ input }) => {
      return db.listarMovimentacoesEstoque(input);
    }),
    relatorioEstoque: protectedProcedure.query(async () => {
      return db.relatorioEstoqueProdutos();
    }),
  }),
  // ─── Catálogos de Venda ────
  catalogosVenda: router({
    // Listar todos os catálogos
    list: protectedProcedure.query(async () => {
      return db.listCatalogosVenda();
    }),

    // Buscar catálogo por ID com itens
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const catalogo = await db.getCatalogoVenda(input.id);
      if (!catalogo) return null;
      const itens = await db.listCatalogoItens(input.id);
      return { ...catalogo, itens };
    }),

    // Criar novo catálogo
    criar: protectedProcedure.input(z.object({
      titulo: z.string().min(1),
      descricao: z.string().optional(),
      expiresInHours: z.number().min(1).max(8760).default(168), // 7 dias default
      criadoPor: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { randomBytes } = await import('crypto');
      const token = randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);
      const id = await db.createCatalogoVenda({
        titulo: input.titulo,
        descricao: input.descricao || null,
        token,
        expiresAt,
        criadoPor: input.criadoPor || null,
      });
      return { id, token };
    }),

    // Atualizar catálogo
    atualizar: protectedProcedure.input(z.object({
      id: z.number(),
      titulo: z.string().min(1).optional(),
      descricao: z.string().optional(),
      ativo: z.number().optional(),
      expiresInHours: z.number().min(1).max(8760).optional(),
    })).mutation(async ({ input }) => {
      const { id, expiresInHours, ...rest } = input;
      const updateData: any = { ...rest };
      if (expiresInHours) {
        updateData.expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
      }
      await db.updateCatalogoVenda(id, updateData);
      return { ok: true };
    }),

     // Deletar catálogo
    deletar: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCatalogoVenda(input.id);
      return { ok: true };
    }),
    // Prorrogar validade do catálogo
    prorrogar: protectedProcedure.input(z.object({
      id: z.number(),
      horasAdicionais: z.number().min(1).max(8760),
    })).mutation(async ({ input }) => {
      const catalogo = await db.getCatalogoVenda(input.id);
      if (!catalogo) throw new Error('Catálogo não encontrado');
      const base = new Date(catalogo.expiresAt) < new Date()
        ? new Date()  // se expirado, conta de agora
        : new Date(catalogo.expiresAt); // senão, estende a partir da data atual
      const novaExpiracao = new Date(base.getTime() + input.horasAdicionais * 60 * 60 * 1000);
      await db.updateCatalogoVenda(input.id, { expiresAt: novaExpiracao, ativo: 1 });
      return { ok: true, novaExpiracao };
    }),
    // Adicionar item ao catálogo
    addItem: protectedProcedure.input(z.object({
      catalogoId: z.number(),
      origem: z.enum(['cooperflora', 'veiling', 'loja']),
      produtoId: z.string(),
      nome: z.string(),
      descricao: z.string().optional(),
      preco: z.number().optional(),
      imagemUrl: z.string().optional(),
      unidade: z.string().optional(),
      ordem: z.number().optional(),
    })).mutation(async ({ input }) => {
      const id = await db.addCatalogoItem({
        catalogoId: input.catalogoId,
        origem: input.origem,
        produtoId: input.produtoId,
        nome: input.nome,
        descricao: input.descricao || null,
        preco: input.preco != null ? String(input.preco) as any : null,
        imagemUrl: input.imagemUrl || null,
        unidade: input.unidade || null,
        ordem: input.ordem || 0,
      });
      return { id };
    }),

    // Remover item do catálogo
    removeItem: protectedProcedure.input(z.object({ itemId: z.number() })).mutation(async ({ input }) => {
      await db.removeCatalogoItem(input.itemId);
      return { ok: true };
    }),

    // Listar itens do catálogo
    listItens: protectedProcedure.input(z.object({ catalogoId: z.number() })).query(async ({ input }) => {
      return db.listCatalogoItens(input.catalogoId);
    }),

    // Limpar todos os itens do catálogo
    clearItens: protectedProcedure.input(z.object({ catalogoId: z.number() })).mutation(async ({ input }) => {
      await db.clearCatalogoItens(input.catalogoId);
      return { ok: true };
    }),

    // Listar pedidos de um catálogo
    listPedidos: protectedProcedure.input(z.object({ catalogoId: z.number() })).query(async ({ input }) => {
      return db.listCatalogoPedidos(input.catalogoId);
    }),

    // Listar todos os pedidos
    listAllPedidos: protectedProcedure.query(async () => {
      return db.listAllCatalogoPedidos();
    }),

    // Atualizar status de pedido
    updatePedidoStatus: protectedProcedure.input(z.object({
      pedidoId: z.number(),
      status: z.enum(['NOVO', 'VISTO', 'APROVADO', 'CANCELADO', 'RECUSADO']),
      motivoRecusa: z.string().optional(),
    })).mutation(async ({ input }) => {
      await db.updateCatalogoPedidoStatusComMotivo(input.pedidoId, input.status, input.motivoRecusa);
      return { ok: true };
    }),

    // ─── Pública: visualizar catálogo por token (sem auth) ───
    viewByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const catalogo = await db.getCatalogoVendaByToken(input.token);
      if (!catalogo) return { found: false, expired: false, catalogo: null };
      const expired = catalogo.expiresAt < new Date() || catalogo.ativo === 0;
      if (expired) return { found: true, expired: true, catalogo: null };
      const itens = await db.listCatalogoItens(catalogo.id);
      return { found: true, expired: false, catalogo: { ...catalogo, itens } };
    }),

    // ─── Pública: enviar pedido pelo link do catálogo (sem auth) ───
    converterEmVenda: protectedProcedure.input(z.object({
      pedidoId: z.number(),
    })).mutation(async ({ input }) => {
      // Buscar o pedido do catálogo com seus itens
      const pedido = await db.getCatalogoPedidoById(input.pedidoId);
      if (!pedido) throw new Error('Pedido não encontrado');
      // Bloquear reconversão
      if (pedido.vendaId) throw new Error(`Este pedido já foi convertido na Venda #${pedido.vendaId}`);
      // Formatar data para YYYY-MM-DD (mesmo padrão das vendas normais)
      const hoje = new Date();
      const dataFormatada = hoje.toISOString().split('T')[0];
      // Calcular total
      const total = pedido.itens.reduce((s: number, i: any) => s + Number(i.subtotal || 0), 0);
      // Criar venda
      const vendaId = await db.createVenda({
        clienteNome: pedido.clienteNome,
        data: dataFormatada,
        status: 'AGUARDANDO' as any,
        total: total.toFixed(2),
      } as any, pedido.itens.map((i: any) => ({
        produtoId: null,
        produtoNome: i.nome,
        quantidade: String(i.quantidade),
        valorUnitario: i.preco ? String(i.preco) : '0',
        subtotal: i.subtotal ? String(i.subtotal) : '0',
        observacao: `Tel: ${pedido.clienteTelefone} | Entrega: ${pedido.dataEntrega}`,
      })) as any);
      // Marcar pedido como convertido, salvando o vendaId
      await db.updateCatalogoPedidoStatus(input.pedidoId, 'APROVADO', vendaId ?? undefined);
      return { vendaId };
    }),
    enviarPedido: publicProcedure.input(z.object({
      token: z.string(),
      clienteNome: z.string().min(1),
      clienteTelefone: z.string().min(1),
      dataEntrega: z.string().min(1),
      observacao: z.string().optional(),
      itens: z.array(z.object({
        catalogoItemId: z.number(),
        nome: z.string(),
        preco: z.number().optional(),
        quantidade: z.number().min(1),
        subtotal: z.number().optional(),
      })),
    })).mutation(async ({ input }) => {
      const catalogo = await db.getCatalogoVendaByToken(input.token);
      if (!catalogo) throw new Error('Catálogo não encontrado');
      if (catalogo.expiresAt < new Date() || catalogo.ativo === 0) throw new Error('Catálogo expirado ou inativo');
      if (!input.itens.length) throw new Error('Selecione ao menos um produto');
      const pedidoId = await db.createCatalogoPedido(
        {
          catalogoId: catalogo.id,
          clienteNome: input.clienteNome,
          clienteTelefone: input.clienteTelefone,
          dataEntrega: input.dataEntrega,
          observacao: input.observacao || null,
        },
        input.itens.map(i => ({
          pedidoId: 0, // será sobrescrito no helper
          catalogoItemId: i.catalogoItemId,
          nome: i.nome,
          preco: i.preco != null ? String(i.preco) as any : null,
          quantidade: i.quantidade,
          subtotal: i.subtotal != null ? String(i.subtotal) as any : null,
        }))
      );
      // Marcar pedido como recebido (status inicial)
      // Notificar o proprietário sobre o novo pedido
      const totalItens = input.itens.reduce((s, i) => s + i.quantidade, 0);
      const totalValor = input.itens.reduce((s, i) => s + (i.preco || 0) * i.quantidade, 0);
      const listaItens = input.itens.map(i => `• ${i.quantidade}x ${i.nome}${i.preco ? ` (R$ ${(i.preco * i.quantidade).toFixed(2)})` : ''}`).join('\n');
      notifyOwner({
        title: `🛒 Novo pedido do catálogo: ${catalogo.titulo}`,
        content: `Cliente: ${input.clienteNome}\nTelefone: ${input.clienteTelefone}\nEntrega: ${input.dataEntrega}\n\nItens (${totalItens}):\n${listaItens}\n\nTotal: R$ ${totalValor.toFixed(2)}${input.observacao ? `\n\nObs: ${input.observacao}` : ''}`,
      }).catch(() => {}); // fire-and-forget
      return { ok: true, pedidoId };
    }),
  }),

  // ─── Catálogo Unificado ───
  catalogoUnificado: router({
    listGrupos: protectedProcedure.input(z.object({
      origem: z.enum(['todos', 'veiling', 'cooperflora']).default('todos'),
    })).query(async ({ input }) => {
      const grupos = new Set<string>();
      if (input.origem === 'todos' || input.origem === 'cooperflora') {
        const cfProdutos = await db.listCooperfloraProdutos({});
        for (const p of cfProdutos) {
          if (p.grupo) grupos.add(p.grupo.trim());
        }
      }
      if (input.origem === 'todos' || input.origem === 'veiling') {
        const veilResult = await db.listVeilingProdutos({ limit: 5000, offset: 0 });
        for (const p of veilResult.items) {
          if (p.categoria) grupos.add(p.categoria.trim());
        }
      }
      return Array.from(grupos).sort((a, b) => a.localeCompare(b));
    }),

    listProdutos: protectedProcedure.input(z.object({
      busca: z.string().optional(),
      origem: z.enum(['todos', 'veiling', 'cooperflora']).default('todos'),
      qualidade: z.string().optional(),
      grupo: z.string().optional(),
      limit: z.number().default(200),
      offset: z.number().default(0),
    })).query(async ({ input }) => {
      const [cfConfig, veilConfig] = await Promise.all([
        db.getCooperfloraConfig(),
        db.getVeilingConfig(),
      ]);
      const cfMargemPadrao = parseFloat(String(cfConfig?.margemPadrao || '30'));
      const veilMargemGlobal = parseFloat(String(veilConfig?.margemGlobal || '30'));
      const resultados: Array<{
        id: string;
        origem: 'Veiling' | 'Cooperflora';
        nome: string;
        qualidade: string;
        estoque: number;
        precoCompra: number;
        precoVenda: number;
        margem: number;
        imagemUrl: string | null;
        grupo: string;
        dimensao: string;
        hastes: number;
        hastesEmbalagem: number;
        codigo: string;
        // Campos extras para Veiling (frete + ICMS)
        freteUnit?: number;
        valorIcmsUnit?: number;
        custoFinal?: number;
      }> = [];
      if (input.origem === 'todos' || input.origem === 'cooperflora') {
        const cfProdutos = await db.listCooperfloraProdutos({
          nome: input.busca,
          qualidade: input.qualidade,
        });
        for (const p of cfProdutos) {
          if (input.grupo && (p.grupo || '').trim() !== input.grupo) continue;
          // Usa margem efetiva: customizada > por departamento > global
          const margem = await db.getMargemEfetiva(p.grupo || '', p.margemCustom, cfMargemPadrao);
          const precoMin = parseFloat(String(p.precoMin)) || 0;
          const hastes = p.hastes || 1;
          const hastesEmb = p.hastesEmbalagem || hastes;
          const precoVenda = precoMin > 0 ? Math.round(precoMin * (1 + margem / 100) * hastesEmb * 100) / 100 : 0;
          resultados.push({
            id: `cf-${p.id}`,
            origem: 'Cooperflora',
            nome: p.nome,
            qualidade: p.qualidade || '',
            estoque: p.estoque,
            precoCompra: precoMin,
            precoVenda,
            margem,
            imagemUrl: p.imagemUrl || null,
            grupo: p.grupo || '',
            dimensao: '',
            hastes,
            hastesEmbalagem: hastesEmb,
            codigo: p.codigo,
          });
        }
      }
        if (input.origem === 'todos' || input.origem === 'veiling') {
        const veilResult = await db.listVeilingProdutos({
          busca: input.busca,
          limit: 5000,
          offset: 0,
        });
        const veilProdutos = veilResult.items;
        for (const p of veilProdutos) {
          if (input.qualidade && p.qualidade !== input.qualidade) continue;
          if (input.grupo && (p.categoria || '').trim() !== input.grupo) continue;
          // Usa margem efetiva por categoria do Veiling
          const margem = await db.getVeilingMargemEfetiva(p.categoria || '', veilMargemGlobal);
          // Custo base: prioridade precoEmbalagem > precoCamada > precoCarrinho
          const _emb2 = p.precoEmbalagem != null ? Number(p.precoEmbalagem) : 0;
          const _cam2 = p.precoCamada != null ? Number(p.precoCamada) : 0;
          const _car2 = p.precoCarrinho != null ? Number(p.precoCarrinho) : 0;
          const custoBaseVal = (_emb2 > 0 ? _emb2 : (_cam2 > 0 ? _cam2 : _car2));
          // Frete por unidade (salvo no banco)
          const freteUnit = p.frete != null ? Number(p.frete) : 0;
          // Custo com frete
          const custoComFrete = custoBaseVal + freteUnit;
          // ICMS: se o produto tem icms (ex: 0.82), dividir pelo fator para embutir o imposto
          const icmsFator = (p as any).icms != null ? Number((p as any).icms) : null;
          const custoFinal = icmsFator && icmsFator > 0 && icmsFator < 1
            ? custoComFrete / icmsFator
            : custoComFrete;
          // Valor do ICMS pago a mais (por unidade)
          const valorIcmsUnit = icmsFator && icmsFator > 0 && icmsFator < 1
            ? Math.round((custoFinal - custoComFrete) * 100) / 100
            : 0;
          const qtdVenda = Number((p as any).qtdVenda) || Number(p.multiplo) || 1;
          const precoVenda = custoFinal > 0 ? Math.round(custoFinal * (1 + margem / 100) * qtdVenda * 100) / 100 : 0;
          resultados.push({
            id: `vl-${p.id}`,
            origem: 'Veiling',
            nome: p.nome,
            qualidade: p.qualidade || '',
            estoque: p.estoqueDisponivel,
            precoCompra: Math.round(custoFinal * 100) / 100,
            precoVenda,
            margem,
            imagemUrl: p.imagemUrl || null,
            grupo: p.categoria || '',
            dimensao: p.dimensao || '',
            hastes: qtdVenda,
            hastesEmbalagem: qtdVenda,
            codigo: String((p as any).offerId || p.id),
            freteUnit,
            valorIcmsUnit,
            custoFinal: Math.round(custoFinal * 100) / 100,
          });
        }
      }
      // Ordenar por nome
      resultados.sort((a, b) => a.nome.localeCompare(b.nome));
      // Paginação
      const total = resultados.length;
      const paginated = resultados.slice(input.offset, input.offset + input.limit);
      return { items: paginated, total };
    }),
  }),

  // ─── Dashboard ────────────────────────────────────────────────────────────
  dashboard: router({
    resumo: protectedProcedure.query(async () => {
      const dbConn = await (db as any).getDb();
      if (!dbConn) return null;

      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const inicioMesStr = `${String(inicioMes.getDate()).padStart(2,'0')}/${String(inicioMes.getMonth()+1).padStart(2,'0')}/${inicioMes.getFullYear()}`;
      const fimMesStr = `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`;

      // ── KPIs ──
      // Total de vendas do mês (não deletadas)
      const vendasMes = await dbConn.select().from(vendas).where(
        and(isNull(vendas.deletedAt), sql`${vendas.data} >= ${inicioMesStr}`, sql`${vendas.data} <= ${fimMesStr}`)
      );
      const faturamentoMes = vendasMes.reduce((s: number, v: any) => s + Number(v.total || 0), 0);

      // Pedidos de catálogo novos (não vistos)
      const pedidosNovos = await dbConn.select({ count: sql`COUNT(*)` }).from(catalogosPedidos).where(eq(catalogosPedidos.status, 'NOVO'));
      const qtdPedidosNovos = Number(pedidosNovos[0]?.count || 0);

      // Catálogos ativos
      const catalogosAtivos = await dbConn.select({ count: sql`COUNT(*)` }).from(catalogosVenda).where(
        and(eq(catalogosVenda.ativo, 1), sql`${catalogosVenda.expiresAt} > NOW()`)
      );
      const qtdCatalogosAtivos = Number(catalogosAtivos[0]?.count || 0);

      // Produtos em estoque (com saldo > 0)
      const todosProdutos = await db.calcularEstoqueTodos();
      const qtdProdutosEstoque = todosProdutos.filter((p: any) => Number(p.saldo) > 0).length;

      // Títulos pendentes
      const titulosPendentes = await db.listTitulosPendentes();
      const valorPendente = titulosPendentes.reduce((s: number, t: any) => s + Number(t.valor || 0), 0);

      // Clientes ativos
      const todosClientes = await db.listClientes();
      const qtdClientes = todosClientes.length;

      // ── Gráfico: vendas por dia (últimos 30 dias) ──
      const inicio30 = new Date(hoje);
      inicio30.setDate(hoje.getDate() - 29);
      const toDateStr = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      const toShortStr = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
      const toDateStrISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

      const todasVendas = await dbConn.select().from(vendas).where(isNull(vendas.deletedAt));
      const vendasPorDia: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(inicio30);
        d.setDate(inicio30.getDate() + i);
        vendasPorDia[toDateStr(d)] = 0;
      }
      for (const v of todasVendas) {
        if (v.data && vendasPorDia[v.data] !== undefined) {
          vendasPorDia[v.data] = (vendasPorDia[v.data] || 0) + Number(v.total || 0);
        }
      }
      const graficoVendasDia = Object.entries(vendasPorDia).map(([data, total]) => {
        const [d, m] = data.split('/');
        return { data: `${d}/${m}`, total: Math.round(Number(total) * 100) / 100 };
      });

      // ── Gráfico: faturamento mensal (últimos 6 meses) ──
      const meses: { label: string; inicio: string; fim: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        meses.push({
          label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          inicio: toDateStr(d),
          fim: toDateStr(fim),
        });
      }
      const graficoFaturamentoMensal = meses.map(m => {
        const total = todasVendas
          .filter((v: any) => v.data >= m.inicio && v.data <= m.fim)
          .reduce((s: number, v: any) => s + Number(v.total || 0), 0);
        return { mes: m.label, total: Math.round(total * 100) / 100 };
      });

      // ── Gráfico: pedidos por status ──
      const todosPedidos = await dbConn.select().from(catalogosPedidos);
      const statusCount: Record<string, number> = { NOVO: 0, VISTO: 0, APROVADO: 0, CANCELADO: 0, RECUSADO: 0 };
      for (const p of todosPedidos) { statusCount[p.status] = (statusCount[p.status] || 0) + 1; }
      const graficoPedidosStatus = Object.entries(statusCount)
        .filter(([, v]) => v > 0)
        .map(([status, count]) => ({
          status,
          label: status === 'NOVO' ? 'Novo' : status === 'VISTO' ? 'Visto' : status === 'APROVADO' ? 'Convertido' : status === 'CANCELADO' ? 'Cancelado' : 'Recusado',
          count,
        }));

      // ── Gráfico: status das vendas do mês ──
      const vendasStatusMes = { AGUARDANDO: 0, APROVADO: 0, CANCELADO: 0 };
      for (const v of vendasMes) { vendasStatusMes[v.status as keyof typeof vendasStatusMes] = (vendasStatusMes[v.status as keyof typeof vendasStatusMes] || 0) + 1; }

      // ── KPIs do dia ──
      const hojeStr = toDateStr(hoje);
      const vendasHoje = todasVendas.filter((v: any) => v.data === hojeStr);
      const faturamentoHoje = vendasHoje.reduce((s: number, v: any) => s + Number(v.total || 0), 0);
      const ticketMedioHoje = vendasHoje.length > 0 ? faturamentoHoje / vendasHoje.length : 0;
      const vendasAbertasHoje = vendasHoje.filter((v: any) => v.status === 'AGUARDANDO').length;
      const vendasAprovadasHoje = vendasHoje.filter((v: any) => v.status === 'APROVADO').length;

      // ── Top 5 clientes (últimos 30 dias) ──
      const vendasUlt30 = todasVendas.filter((v: any) => {
        const [d, m, y] = (v.data || '').split('/');
        if (!d || !m || !y) return false;
        const dt = new Date(Number(y), Number(m) - 1, Number(d));
        return dt >= inicio30 && dt <= hoje;
      });
      const clienteMap: Record<string, number> = {};
      for (const v of vendasUlt30) {
        const nome = v.clienteNome || 'Sem nome';
        clienteMap[nome] = (clienteMap[nome] || 0) + Number(v.total || 0);
      }
      const topClientes = Object.entries(clienteMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nome, total]) => ({ nome, total: Math.round(total * 100) / 100 }));

      // ── Top 5 produtos (últimos 30 dias) ──
      const { vendaItens: vendaItensTable2 } = await import('../drizzle/schema');
      const idsUlt30 = vendasUlt30.map((v: any) => v.id);
      let topProdutos: { nome: string; qtd: number; total: number }[] = [];
      if (idsUlt30.length > 0) {
        const itensUlt30 = await dbConn.select().from(vendaItensTable2).where(
          sql`${vendaItensTable2.vendaId} IN (${sql.join(idsUlt30.map((id: number) => sql`${id}`), sql`, `)})`
        );
        const prodMap: Record<string, { qtd: number; total: number }> = {};
        for (const it of itensUlt30) {
          const nome = it.produto || 'Produto';
          if (!prodMap[nome]) prodMap[nome] = { qtd: 0, total: 0 };
          prodMap[nome].qtd += Number(it.qtd || 0);
          prodMap[nome].total += Number(it.qtd || 0) * Number(it.precoUnit || 0);
        }
        topProdutos = Object.entries(prodMap)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5)
          .map(([nome, v]) => ({ nome, qtd: Math.round(v.qtd * 10) / 10, total: Math.round(v.total * 100) / 100 }));
      }

      // ── Últimos orçamentos do dia ──
      const ultimosHoje = vendasHoje
        .sort((a: any, b: any) => b.id - a.id)
        .slice(0, 8)
        .map((v: any) => ({ id: v.id, clienteNome: v.clienteNome || '-', total: Number(v.total || 0), status: v.status }));

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
          vendasAprovadasHoje,
        },
        graficoVendasDia,
        graficoFaturamentoMensal,
        graficoPedidosStatus,
        vendasStatusMes,
        topClientes,
        topProdutos,
        ultimosHoje,
      };
    }),
  }),

  // ─── Vendas Efetivas ───
  vendasEfetivas: router({
    // Listar todas as vendas efetivas
    list: protectedProcedure.input(z.object({
      status: z.enum(['PENDENTE', 'ENTREGUE', 'CANCELADA', 'todos']).default('todos'),
      search: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      const { getDb } = await import('./db');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      let query = dbConn.select().from(vendasEfetivas).$dynamic();
      const conditions = [];
      if (input?.status && input.status !== 'todos') {
        conditions.push(eq(vendasEfetivas.status, input.status as any));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      const rows = await query.orderBy(sql`${vendasEfetivas.createdAt} DESC`);
      return rows;
    }),

    // Converter orçamento em venda efetiva
    converter: protectedProcedure.input(z.object({
      orcamentoId: z.number(),
      dataEntrega: z.string().optional(),
      formaPagamento: z.string().optional(),
      observacao: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { getDb } = await import('./db');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      // Buscar o orçamento
      const orcamento = await db.getVenda(input.orcamentoId);
      if (!orcamento) throw new Error('Orçamento não encontrado');
      if (orcamento.status !== 'APROVADO') throw new Error('Apenas orçamentos com status APROVADO podem ser convertidos em venda efetiva');
      // Verificar se já foi convertido
      const jaConvertido = await dbConn.select().from(vendasEfetivas)
        .where(eq(vendasEfetivas.orcamentoId, input.orcamentoId))
        .limit(1);
      if (jaConvertido.length > 0) throw new Error(`Este orçamento já foi convertido em Venda Efetiva #${jaConvertido[0].id}`);
      // Criar venda efetiva
      const hoje = new Date();
      const dataVenda = hoje.toLocaleDateString('pt-BR');
      // Montar snapshot dos itens para preservar histórico mesmo se o orçamento for deletado
      const orcamentoItens = await db.getVendaItens(input.orcamentoId);
      const itensSnapshot = (orcamentoItens || []).map((item: any) => ({
        produtoNome: item.produtoNome,
        quantidade: Number(item.quantidade),
        valorUnitario: Number(item.valorUnitario),
        subtotal: Number(item.subtotal),
        observacao: item.observacao || undefined,
      }));
      const [result] = await dbConn.insert(vendasEfetivas).values({
        orcamentoId: input.orcamentoId,
        orcamentoNum: `#${String(input.orcamentoId).padStart(6, '0')}`,
        clienteId: orcamento.clienteId ?? undefined,
        clienteNome: orcamento.clienteNome ?? '',
        vendedorId: orcamento.vendedorId ?? undefined,
        vendedorNome: orcamento.vendedorNome ?? '',
        total: orcamento.total,
        dataVenda,
        dataEntrega: input.dataEntrega ?? orcamento.dataEntrega ?? undefined,
        formaPagamento: input.formaPagamento ?? undefined,
        observacao: input.observacao ?? undefined,
        status: 'PENDENTE',
        convertidoPor: ctx.user.name ?? ctx.user.openId,
        itensSnapshot: itensSnapshot.length > 0 ? itensSnapshot : undefined,
      });
      // Marcar orçamento como faturado
      await dbConn.update(vendas)
        .set({ faturado: 1, faturadoPor: ctx.user.name ?? ctx.user.openId, faturadoEm: new Date() })
        .where(eq(vendas.id, input.orcamentoId));
      return { ok: true, vendaEfetivaId: (result as any).insertId };
    }),

    // Atualizar status da venda efetiva
    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(['PENDENTE', 'ENTREGUE', 'CANCELADA']),
    })).mutation(async ({ input }) => {
      const { getDb } = await import('./db');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      await dbConn.update(vendasEfetivas)
        .set({ status: input.status })
        .where(eq(vendasEfetivas.id, input.id));
      return { ok: true };
    }),

    // Verificar se orçamento já foi convertido
    verificarConversao: protectedProcedure.input(z.object({
      orcamentoId: z.number(),
    })).query(async ({ input }) => {
      const { getDb } = await import('./db');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      const rows = await dbConn.select().from(vendasEfetivas)
        .where(eq(vendasEfetivas.orcamentoId, input.orcamentoId))
        .limit(1);
      return rows.length > 0 ? rows[0] : null;
    }),

    // Sincronizar pedidos faturados que ainda não foram convertidos em Venda Efetiva
    sincronizarFaturados: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { vendasEfetivas: veTable, vendas: vendasTable } = await import('../drizzle/schema');
        const { eq: eqFn, isNotNull } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) throw new Error('DB not available');

        // Buscar orcamentoIds já convertidos
        const jaConvertidos = await dbConn.select({ orcamentoId: veTable.orcamentoId }).from(veTable);
        const idsConvertidos = jaConvertidos.map((r: any) => r.orcamentoId).filter(Boolean);

        // Buscar pedidos faturados ainda não convertidos
        const faturados = await dbConn.select().from(vendasTable)
          .where(eqFn(vendasTable.faturado, 1));
        const semConversao = faturados.filter((v: any) => !idsConvertidos.includes(v.id) && !v.deletedAt);

        if (semConversao.length === 0) {
          return { sincronizados: 0, mensagem: 'Todos os pedidos faturados já estão em Vendas Efetivas.' };
        }

        const hoje = new Date();
        const dataVenda = hoje.toLocaleDateString('pt-BR');
        let sincronizados = 0;

        for (const venda of semConversao) {
          await dbConn.insert(veTable).values({
            orcamentoId: venda.id,
            orcamentoNum: `#${String(venda.id).padStart(6, '0')}`,
            clienteId: venda.clienteId ?? undefined,
            clienteNome: venda.clienteNome ?? '',
            vendedorId: venda.vendedorId ?? undefined,
            vendedorNome: venda.vendedorNome ?? '',
            total: venda.total,
            dataVenda,
            dataEntrega: venda.dataEntrega ?? undefined,
            status: 'PENDENTE',
            convertidoPor: ctx.user.name ?? ctx.user.openId,
          });
          sincronizados++;
        }

        return { sincronizados, mensagem: `${sincronizados} pedido(s) adicionado(s) em Vendas Efetivas.` };
      }),
  }),

  // ─── Lembretes ───
  lembretes: router({
    // Listar lembretes do usuário logado
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import('./db');
      const { lembretes: lembretesTable } = await import('../drizzle/schema');
      const { eq: eqFn, and: andFn, ne } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) return [];
      return dbConn
        .select()
        .from(lembretesTable)
        .where(andFn(eqFn(lembretesTable.userId, ctx.user.openId), ne(lembretesTable.status, 'CANCELADO')))
        .orderBy(lembretesTable.dataHora);
    }),

    // Criar novo lembrete
    create: protectedProcedure.input(z.object({
      titulo: z.string().min(1).max(255),
      descricao: z.string().optional(),
      dataHora: z.number(), // UTC ms
      recorrencia: z.enum(['NENHUMA', 'DIARIA', 'SEMANAL', 'MENSAL']).default('NENHUMA'),
      prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA']).default('MEDIA'),
      vinculoOrcamentoId: z.number().optional(),
      vinculoOrcamentoNum: z.string().optional(),
      vinculoClienteNome: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { getDb } = await import('./db');
      const { lembretes: lembretesTable } = await import('../drizzle/schema');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      const [result] = await dbConn.insert(lembretesTable).values({
        userId: ctx.user.openId,
        userName: ctx.user.name || ctx.user.email || 'Usuário',
        titulo: input.titulo,
        descricao: input.descricao,
        dataHora: input.dataHora,
        recorrencia: input.recorrencia,
        prioridade: input.prioridade,
        status: 'PENDENTE',
        vinculoOrcamentoId: input.vinculoOrcamentoId,
        vinculoOrcamentoNum: input.vinculoOrcamentoNum,
        vinculoClienteNome: input.vinculoClienteNome,
      });
      return { id: (result as any).insertId };
    }),

    // Atualizar lembrete
    update: protectedProcedure.input(z.object({
      id: z.number(),
      titulo: z.string().min(1).max(255).optional(),
      descricao: z.string().optional().nullable(),
      dataHora: z.number().optional(),
      recorrencia: z.enum(['NENHUMA', 'DIARIA', 'SEMANAL', 'MENSAL']).optional(),
      prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA']).optional(),
      status: z.enum(['PENDENTE', 'DISPARADO', 'LIDO', 'CANCELADO']).optional(),
      vinculoOrcamentoId: z.number().optional().nullable(),
      vinculoOrcamentoNum: z.string().optional().nullable(),
      vinculoClienteNome: z.string().optional().nullable(),
    })).mutation(async ({ ctx, input }) => {
      const { getDb } = await import('./db');
      const { lembretes: lembretesTable } = await import('../drizzle/schema');
      const { eq: eqFn, and: andFn } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      const { id, ...data } = input;
      await dbConn.update(lembretesTable)
        .set(data as any)
        .where(andFn(eqFn(lembretesTable.id, id), eqFn(lembretesTable.userId, ctx.user.openId)));
      return { ok: true };
    }),

    // Deletar (cancelar) lembrete
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const { getDb } = await import('./db');
      const { lembretes: lembretesTable } = await import('../drizzle/schema');
      const { eq: eqFn, and: andFn } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      await dbConn.update(lembretesTable)
        .set({ status: 'CANCELADO' })
        .where(andFn(eqFn(lembretesTable.id, input.id), eqFn(lembretesTable.userId, ctx.user.openId)));
      return { ok: true };
    }),

    // Marcar como lido
    marcarLido: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const { getDb } = await import('./db');
      const { lembretes: lembretesTable } = await import('../drizzle/schema');
      const { eq: eqFn, and: andFn } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) throw new Error('DB not available');
      await dbConn.update(lembretesTable)
        .set({ status: 'LIDO' })
        .where(andFn(eqFn(lembretesTable.id, input.id), eqFn(lembretesTable.userId, ctx.user.openId)));
      return { ok: true };
    }),

    // Polling: buscar lembretes que devem ser disparados agora (para o agente frontend)
    // Retorna lembretes PENDENTES cujo dataHora <= agora + 1 min de margem
    // Após retornar, marca como DISPARADO e agenda próxima ocorrência se recorrente
    pollPendentes: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import('./db');
      const { lembretes: lembretesTable } = await import('../drizzle/schema');
      const { eq: eqFn, and: andFn, lte } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) return [];
      const agora = Date.now();
      const margem = agora + 60_000; // 1 minuto de margem
      const pendentes = await dbConn
        .select()
        .from(lembretesTable)
        .where(andFn(
          eqFn(lembretesTable.userId, ctx.user.openId),
          eqFn(lembretesTable.status, 'PENDENTE'),
          lte(lembretesTable.dataHora, margem),
        ));
      // Marcar como DISPARADO e agendar próxima se recorrente
      for (const l of pendentes) {
        let proxDataHora: number | null = null;
        if (l.recorrencia !== 'NENHUMA') {
          const base = l.dataHora;
          if (l.recorrencia === 'DIARIA') proxDataHora = base + 86_400_000;
          else if (l.recorrencia === 'SEMANAL') proxDataHora = base + 7 * 86_400_000;
          else if (l.recorrencia === 'MENSAL') {
            const d = new Date(base);
            d.setMonth(d.getMonth() + 1);
            proxDataHora = d.getTime();
          }
        }
        await dbConn.update(lembretesTable)
          .set({ status: 'DISPARADO', notificadoEm: agora })
          .where(eqFn(lembretesTable.id, l.id));
        // Criar próxima ocorrência se recorrente
        if (proxDataHora) {
          await dbConn.insert(lembretesTable).values({
            userId: l.userId,
            userName: l.userName,
            titulo: l.titulo,
            descricao: l.descricao,
            dataHora: proxDataHora,
            recorrencia: l.recorrencia,
            prioridade: l.prioridade,
            status: 'PENDENTE',
          });
        }
      }
      return pendentes;
    }),
  }),

  // ─── Controle de Caixa ───
  caixa: router({
    // Retorna o caixa ABERTO do dia (com movimentos)
    getAtual: protectedProcedure.query(async () => {
      const { getDb } = await import('./db');
      const { caixas, caixaMovimentos } = await import('../drizzle/schema');
      const { eq: eqFn } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) return null;
      const [caixaAberto] = await dbConn.select().from(caixas).where(eqFn(caixas.status, 'ABERTO')).limit(1);
      if (!caixaAberto) return null;
      const movimentos = await dbConn.select().from(caixaMovimentos).where(eqFn(caixaMovimentos.caixaId, caixaAberto.id));
      return { ...caixaAberto, movimentos };
    }),

    // Abrir caixa com saldo inicial
    abrir: protectedProcedure
      .input(z.object({
        saldoInicial: z.number().min(0).default(0),
        observacao: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { caixas } = await import('../drizzle/schema');
        const { eq: eqFn } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) throw new Error('DB not available');
        // Verificar se já há caixa aberto
        const [jaAberto] = await dbConn.select().from(caixas).where(eqFn(caixas.status, 'ABERTO')).limit(1);
        if (jaAberto) throw new Error('Já existe um caixa aberto. Feche-o antes de abrir um novo.');
        const hoje = new Date().toISOString().slice(0, 10);
        const [result] = await dbConn.insert(caixas).values({
          data: hoje,
          saldoInicial: String(input.saldoInicial),
          totalEntradas: '0.00',
          totalSaidas: '0.00',
          status: 'ABERTO',
          abertoPor: ctx.user.name || ctx.user.openId,
          observacao: input.observacao,
        });
        return { id: (result as any).insertId, ok: true };
      }),

    // Fechar caixa
    fechar: protectedProcedure
      .input(z.object({
        observacao: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { caixas } = await import('../drizzle/schema');
        const { eq: eqFn } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) throw new Error('DB not available');
        const [caixaAberto] = await dbConn.select().from(caixas).where(eqFn(caixas.status, 'ABERTO')).limit(1);
        if (!caixaAberto) throw new Error('Nenhum caixa aberto encontrado.');
        const saldoInicial = Number(caixaAberto.saldoInicial);
        const totalEntradas = Number(caixaAberto.totalEntradas);
        const totalSaidas = Number(caixaAberto.totalSaidas);
        const saldoFinal = saldoInicial + totalEntradas - totalSaidas;
        await dbConn.update(caixas)
          .set({
            status: 'FECHADO',
            saldoFinal: String(saldoFinal.toFixed(2)),
            fechadoPor: ctx.user.name || ctx.user.openId,
            fechadoEm: new Date(),
            observacao: input.observacao || caixaAberto.observacao,
          })
          .where(eqFn(caixas.id, caixaAberto.id));
        return { ok: true, saldoFinal };
      }),

    // Lançar movimento (entrada ou saída manual)
    lancar: protectedProcedure
      .input(z.object({
        tipo: z.enum(['ENTRADA', 'SAIDA']),
        categoria: z.string().min(1),
        descricao: z.string().optional(),
        valor: z.number().positive(),
        formaPagamento: z.string().optional(),
        vendaId: z.number().optional(),
        vendaNum: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { caixas, caixaMovimentos } = await import('../drizzle/schema');
        const { eq: eqFn, sql: sqlFn } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) throw new Error('DB not available');
        const [caixaAberto] = await dbConn.select().from(caixas).where(eqFn(caixas.status, 'ABERTO')).limit(1);
        if (!caixaAberto) throw new Error('Nenhum caixa aberto. Abra o caixa antes de lançar.');
        // Inserir movimento
        await dbConn.insert(caixaMovimentos).values({
          caixaId: caixaAberto.id,
          tipo: input.tipo,
          categoria: input.categoria,
          descricao: input.descricao,
          valor: String(input.valor.toFixed(2)),
          formaPagamento: input.formaPagamento,
          vendaId: input.vendaId,
          vendaNum: input.vendaNum,
          lancadoPor: ctx.user.name || ctx.user.openId,
        });
        // Atualizar totais do caixa
        if (input.tipo === 'ENTRADA') {
          await dbConn.update(caixas)
            .set({ totalEntradas: sqlFn`totalEntradas + ${input.valor}` })
            .where(eqFn(caixas.id, caixaAberto.id));
        } else {
          await dbConn.update(caixas)
            .set({ totalSaidas: sqlFn`totalSaidas + ${input.valor}` })
            .where(eqFn(caixas.id, caixaAberto.id));
        }
        return { ok: true };
      }),

    // Excluir movimento
    excluirMovimento: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import('./db');
        const { caixas, caixaMovimentos } = await import('../drizzle/schema');
        const { eq: eqFn, sql: sqlFn } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) throw new Error('DB not available');
        // Buscar o movimento
        const [mov] = await dbConn.select().from(caixaMovimentos).where(eqFn(caixaMovimentos.id, input.id)).limit(1);
        if (!mov) throw new Error('Movimento não encontrado.');
        // Reverter totais do caixa
        if (mov.tipo === 'ENTRADA') {
          await dbConn.update(caixas)
            .set({ totalEntradas: sqlFn`GREATEST(0, totalEntradas - ${Number(mov.valor)})` })
            .where(eqFn(caixas.id, mov.caixaId));
        } else {
          await dbConn.update(caixas)
            .set({ totalSaidas: sqlFn`GREATEST(0, totalSaidas - ${Number(mov.valor)})` })
            .where(eqFn(caixas.id, mov.caixaId));
        }
        await dbConn.delete(caixaMovimentos).where(eqFn(caixaMovimentos.id, input.id));
        return { ok: true };
      }),

    // Relatório por período
    relatorio: protectedProcedure
      .input(z.object({
        dataInicio: z.string(), // YYYY-MM-DD
        dataFim: z.string(),    // YYYY-MM-DD
      }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { caixas, caixaMovimentos } = await import('../drizzle/schema');
        const { eq: eqFn, and: andFn, gte, lte, inArray } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) return { caixas: [], totalEntradas: 0, totalSaidas: 0, saldoFinal: 0 };
        const caixasPeriodo = await dbConn.select().from(caixas)
          .where(andFn(gte(caixas.data, input.dataInicio), lte(caixas.data, input.dataFim)))
          .orderBy(caixas.data);
        if (caixasPeriodo.length === 0) return { caixas: [], totalEntradas: 0, totalSaidas: 0, saldoFinal: 0 };
        const caixaIds = caixasPeriodo.map(c => c.id);
        const movimentos = await dbConn.select().from(caixaMovimentos).where(inArray(caixaMovimentos.caixaId, caixaIds));
        const totalEntradas = movimentos.filter(m => m.tipo === 'ENTRADA').reduce((s, m) => s + Number(m.valor), 0);
        const totalSaidas = movimentos.filter(m => m.tipo === 'SAIDA').reduce((s, m) => s + Number(m.valor), 0);
        const saldoInicial = caixasPeriodo.reduce((s, c) => s + Number(c.saldoInicial), 0);
        const saldoFinal = saldoInicial + totalEntradas - totalSaidas;
        return {
          caixas: caixasPeriodo.map(c => ({
            ...c,
            movimentos: movimentos.filter(m => m.caixaId === c.id),
          })),
          totalEntradas,
          totalSaidas,
          saldoFinal,
        };
      }),

    // Histórico de caixas fechados (paginado)
    historico: protectedProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { caixas } = await import('../drizzle/schema');
        const { eq: eqFn, desc } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) return { items: [], total: 0 };
        const offset = (input.page - 1) * input.limit;
        const items = await dbConn.select().from(caixas)
          .where(eqFn(caixas.status, 'FECHADO'))
          .orderBy(desc(caixas.data))
          .limit(input.limit)
          .offset(offset);
        return { items, total: items.length };
      }),

    // Sincronizar pedidos faturados que ainda não têm lançamento no caixa
    sincronizarFaturados: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { getDb } = await import('./db');
        const { caixas, caixaMovimentos, vendas: vendasTable } = await import('../drizzle/schema');
        const { eq: eqFn, isNotNull, sql: sqlFn } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) throw new Error('DB not available');

        // Verificar se há caixa aberto
        const [caixaAberto] = await dbConn.select().from(caixas).where(eqFn(caixas.status, 'ABERTO')).limit(1);
        if (!caixaAberto) throw new Error('Não há caixa aberto. Abra o caixa antes de sincronizar.');

        // Buscar vendaIds que já têm movimento no caixa
        const movExistentes = await dbConn.select({ vendaId: caixaMovimentos.vendaId })
          .from(caixaMovimentos)
          .where(isNotNull(caixaMovimentos.vendaId));
        const idsComMovimento = movExistentes.map((m: any) => m.vendaId).filter(Boolean);

        // Buscar pedidos faturados sem lançamento no caixa
        let query = dbConn.select().from(vendasTable)
          .where(eqFn(vendasTable.faturado, 1));
        const faturados = await query;
        const semLancamento = faturados.filter((v: any) => !idsComMovimento.includes(v.id) && !v.deletedAt);

        if (semLancamento.length === 0) return { sincronizados: 0, mensagem: 'Todos os pedidos faturados já estão no caixa.' };

        let totalSincronizado = 0;
        let totalValor = 0;
        for (const venda of semLancamento) {
          const valor = Number(venda.total) || 0;
          if (valor <= 0) continue;
          await dbConn.insert(caixaMovimentos).values({
            caixaId: caixaAberto.id,
            tipo: 'ENTRADA',
            categoria: 'VENDA',
            descricao: `Venda #${String(venda.id).padStart(6, '0')} - ${venda.clienteNome || 'Cliente'} (sincronizado)`,
            valor: String(valor.toFixed(2)),
            formaPagamento: 'Não informado',
            vendaId: venda.id,
            vendaNum: `#${String(venda.id).padStart(6, '0')}`,
            lancadoPor: ctx.user.name || ctx.user.openId,
          });
          totalValor += valor;
          totalSincronizado++;
        }

        if (totalSincronizado > 0) {
          await dbConn.update(caixas)
            .set({ totalEntradas: sqlFn`totalEntradas + ${totalValor}` })
            .where(eqFn(caixas.id, caixaAberto.id));
        }

        return { sincronizados: totalSincronizado, totalValor, mensagem: `${totalSincronizado} pedido(s) sincronizado(s) no caixa.` };
      }),

  }),

  // ─── Anotações por Usuário ───
  anotacoes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import('./db');
      const { anotacoes } = await import('../drizzle/schema');
      const { eq: eqFn, desc } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) return [];
      return dbConn.select().from(anotacoes)
        .where(eqFn(anotacoes.userId, ctx.user.openId))
        .orderBy(desc(anotacoes.fixada), desc(anotacoes.updatedAt));
    }),

    create: protectedProcedure
      .input(z.object({
        titulo: z.string().min(1).max(255).default('Nova anotação'),
        conteudo: z.string().default(''),
        cor: z.enum(['yellow', 'blue', 'green', 'pink', 'purple']).default('yellow'),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { anotacoes } = await import('../drizzle/schema');
        const dbConn = await getDb();
        if (!dbConn) throw new Error('DB not available');
        const [result] = await dbConn.insert(anotacoes).values({
          userId: ctx.user.openId,
          titulo: input.titulo,
          conteudo: input.conteudo,
          cor: input.cor,
        });
        const [nova] = await dbConn.select().from(anotacoes).where(
          (await import('drizzle-orm')).eq(anotacoes.id, (result as any).insertId)
        );
        return nova;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        titulo: z.string().min(1).max(255).optional(),
        conteudo: z.string().optional(),
        cor: z.enum(['yellow', 'blue', 'green', 'pink', 'purple']).optional(),
        fixada: z.boolean().optional(),
        ativa: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { anotacoes } = await import('../drizzle/schema');
        const { eq: eqFn, and: andFn } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) throw new Error('DB not available');
        const updates: Record<string, any> = {};
        if (input.titulo !== undefined) updates.titulo = input.titulo;
        if (input.conteudo !== undefined) updates.conteudo = input.conteudo;
        if (input.cor !== undefined) updates.cor = input.cor;
        if (input.fixada !== undefined) updates.fixada = input.fixada ? 1 : 0;
        if (input.ativa !== undefined) updates.ativa = input.ativa ? 1 : 0;
        await dbConn.update(anotacoes)
          .set(updates)
          .where(andFn(eqFn(anotacoes.id, input.id), eqFn(anotacoes.userId, ctx.user.openId)));
        return { ok: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import('./db');
        const { anotacoes } = await import('../drizzle/schema');
        const { eq: eqFn, and: andFn } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) throw new Error('DB not available');
        await dbConn.delete(anotacoes)
          .where(andFn(eqFn(anotacoes.id, input.id), eqFn(anotacoes.userId, ctx.user.openId)));
        return { ok: true };
      }),
  }),

  // ─── Relatório Financeiro por Cliente ───
  relatorioFinanceiro: router({

    // Lista clientes com movimento financeiro
    listarClientes: protectedProcedure.query(async () => {
      const { getDb } = await import('./db');
      const { clientes } = await import('../drizzle/schema');
      const { isNull, asc } = await import('drizzle-orm');
      const dbConn = await getDb();
      if (!dbConn) return [];
      return dbConn.select({ id: clientes.id, nome: clientes.nome, telefone: clientes.telefone, email: clientes.email })
        .from(clientes)
        .where(isNull(clientes.deletedAt))
        .orderBy(asc(clientes.nome));
    }),

    // Relatório completo de um cliente com filtros
    getRelatorio: protectedProcedure
      .input(z.object({
        clienteId: z.number(),
        dataInicio: z.string().optional(),   // YYYY-MM-DD
        dataFim: z.string().optional(),      // YYYY-MM-DD
        statusTitulo: z.enum(['TODOS', 'PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']).default('TODOS'),
      }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { clientes, vendas, titulos, vendasEfetivas } = await import('../drizzle/schema');
        const { eq: eqFn, and: andFn, isNull, gte, lte, desc, asc } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) throw new Error('DB not available');

        // Dados do cliente
        const [cliente] = await dbConn.select().from(clientes)
          .where(eqFn(clientes.id, input.clienteId));
        if (!cliente) throw new Error('Cliente não encontrado');

        // Pedidos (vendas/orçamentos) do cliente
        const pedidosWhere: any[] = [eqFn(vendas.clienteId, input.clienteId), isNull(vendas.deletedAt)];
        if (input.dataInicio) pedidosWhere.push(gte(vendas.data, input.dataInicio));
        if (input.dataFim) pedidosWhere.push(lte(vendas.data, input.dataFim));
        const pedidos = await dbConn.select().from(vendas)
          .where(andFn(...pedidosWhere as [any, ...any[]]))
          .orderBy(desc(vendas.data));

        // Títulos financeiros do cliente
        const titulosWhere: any[] = [eqFn(titulos.clienteId, input.clienteId)];
        if (input.statusTitulo !== 'TODOS') titulosWhere.push(eqFn(titulos.status, input.statusTitulo));
        if (input.dataInicio) titulosWhere.push(gte(titulos.dataVencimento, new Date(input.dataInicio)));
        if (input.dataFim) titulosWhere.push(lte(titulos.dataVencimento, new Date(input.dataFim + 'T23:59:59')));
        const titulosList = await dbConn.select().from(titulos)
          .where(andFn(...titulosWhere as [any, ...any[]]))
          .orderBy(desc(titulos.dataVencimento));

        // Vendas efetivas do cliente
        const veWhere: any[] = [eqFn(vendasEfetivas.clienteId, input.clienteId)];
        if (input.dataInicio) veWhere.push(gte(vendasEfetivas.dataVenda, input.dataInicio));
        if (input.dataFim) veWhere.push(lte(vendasEfetivas.dataVenda, input.dataFim));
        const vendasEfetivasList = await dbConn.select().from(vendasEfetivas)
          .where(andFn(...veWhere as [any, ...any[]]))
          .orderBy(desc(vendasEfetivas.dataVenda));

        // Totais
        const totalPedidos = pedidos.reduce((s, p) => s + parseFloat(p.total || '0'), 0);
        const totalTitulosPago = titulosList.filter(t => t.status === 'PAGO').reduce((s, t) => s + parseFloat(t.valor || '0'), 0);
        const totalTitulosPendente = titulosList.filter(t => t.status === 'PENDENTE').reduce((s, t) => s + parseFloat(t.valor || '0'), 0);
        const totalTitulosVencido = titulosList.filter(t => t.status === 'VENCIDO').reduce((s, t) => s + parseFloat(t.valor || '0'), 0);
        const totalVendasEfetivas = vendasEfetivasList.reduce((s, v) => s + parseFloat(v.total || '0'), 0);

        // Agrupamento por forma de pagamento
        const porFormaPagamento: Record<string, number> = {};
        for (const t of titulosList.filter(t => t.status === 'PAGO')) {
          const fp = t.formaPagamentoNome || 'Não informado';
          porFormaPagamento[fp] = (porFormaPagamento[fp] || 0) + parseFloat(t.valor || '0');
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
            qtdTitulos: titulosList.length,
          },
        };
      }),

    // Gerar token de compartilhamento
    gerarTokenCompartilhamento: protectedProcedure
      .input(z.object({
        clienteId: z.number(),
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        statusTitulo: z.enum(['TODOS', 'PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO']).default('TODOS'),
        expiresHours: z.number().min(1).max(720).default(72),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import('./db');
        const { relatoriosCompartilhados } = await import('../drizzle/schema');
        const dbConn = await getDb();
        if (!dbConn) throw new Error('DB not available');
        const { randomBytes } = await import('crypto');
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + input.expiresHours * 3600 * 1000);
        await dbConn.insert(relatoriosCompartilhados).values({
          token,
          clienteId: input.clienteId,
          filtros: JSON.stringify({ dataInicio: input.dataInicio, dataFim: input.dataFim, statusTitulo: input.statusTitulo }),
          expiresAt,
        });
        return { token };
      }),

    // Visualizar relatório via token público
    getRelatorioPublico: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import('./db');
        const { relatoriosCompartilhados, clientes, vendas, titulos, vendasEfetivas } = await import('../drizzle/schema');
        const { eq: eqFn, and: andFn, isNull, gte, lte, desc } = await import('drizzle-orm');
        const dbConn = await getDb();
        if (!dbConn) throw new Error('DB not available');

        const [compartilhado] = await dbConn.select().from(relatoriosCompartilhados)
          .where(eqFn(relatoriosCompartilhados.token, input.token));
        if (!compartilhado) throw new TRPCError({ code: 'NOT_FOUND', message: 'Link inválido ou expirado' });
        if (compartilhado.expiresAt && new Date() > compartilhado.expiresAt) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Link expirado' });
        }

        const filtros = JSON.parse(compartilhado.filtros || '{}');
        const clienteId = compartilhado.clienteId;

        const [cliente] = await dbConn.select().from(clientes).where(eqFn(clientes.id, clienteId));
        if (!cliente) throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente não encontrado' });

        const pedidosWhere: any[] = [eqFn(vendas.clienteId, clienteId), isNull(vendas.deletedAt)];
        if (filtros.dataInicio) pedidosWhere.push(gte(vendas.data, filtros.dataInicio));
        if (filtros.dataFim) pedidosWhere.push(lte(vendas.data, filtros.dataFim));
        const pedidos = await dbConn.select().from(vendas)
          .where(andFn(...pedidosWhere as [any, ...any[]]))
          .orderBy(desc(vendas.data));

        const titulosWhere: any[] = [eqFn(titulos.clienteId, clienteId)];
        if (filtros.statusTitulo && filtros.statusTitulo !== 'TODOS') titulosWhere.push(eqFn(titulos.status, filtros.statusTitulo));
        if (filtros.dataInicio) titulosWhere.push(gte(titulos.dataVencimento, new Date(filtros.dataInicio)));
        if (filtros.dataFim) titulosWhere.push(lte(titulos.dataVencimento, new Date(filtros.dataFim + 'T23:59:59')));
        const titulosList = await dbConn.select().from(titulos)
          .where(andFn(...titulosWhere as [any, ...any[]]))
          .orderBy(desc(titulos.dataVencimento));

        const veWhere: any[] = [eqFn(vendasEfetivas.clienteId, clienteId)];
        if (filtros.dataInicio) veWhere.push(gte(vendasEfetivas.dataVenda, filtros.dataInicio));
        if (filtros.dataFim) veWhere.push(lte(vendasEfetivas.dataVenda, filtros.dataFim));
        const vendasEfetivasList = await dbConn.select().from(vendasEfetivas)
          .where(andFn(...veWhere as [any, ...any[]]))
          .orderBy(desc(vendasEfetivas.dataVenda));

        const totalPedidos = pedidos.reduce((s, p) => s + parseFloat(p.total || '0'), 0);
        const totalTitulosPago = titulosList.filter(t => t.status === 'PAGO').reduce((s, t) => s + parseFloat(t.valor || '0'), 0);
        const totalTitulosPendente = titulosList.filter(t => t.status === 'PENDENTE').reduce((s, t) => s + parseFloat(t.valor || '0'), 0);
        const totalTitulosVencido = titulosList.filter(t => t.status === 'VENCIDO').reduce((s, t) => s + parseFloat(t.valor || '0'), 0);
        const totalVendasEfetivas = vendasEfetivasList.reduce((s, v) => s + parseFloat(v.total || '0'), 0);
        const porFormaPagamento: Record<string, number> = {};
        for (const t of titulosList.filter(t => t.status === 'PAGO')) {
          const fp = t.formaPagamentoNome || 'Não informado';
          porFormaPagamento[fp] = (porFormaPagamento[fp] || 0) + parseFloat(t.valor || '0');
        }

        return {
          cliente,
          pedidos,
          titulos: titulosList,
          vendasEfetivas: vendasEfetivasList,
          resumo: { totalPedidos, totalTitulosPago, totalTitulosPendente, totalTitulosVencido, totalVendasEfetivas, porFormaPagamento, qtdPedidos: pedidos.length, qtdTitulos: titulosList.length },
          filtros,
          expiresAt: compartilhado.expiresAt,
        };
      }),
  }),
  // ─── Enviar Orçamento para Pedido de Compra ───────────────────────────────────
  enviarPedidoCompra: router({
  // Busca prévia dos itens mesclados do orçamento (antes de enviar)
  preview: protectedProcedure
    .input(z.object({ vendaId: z.number() }))
    .query(async ({ input }) => {
      const { vendaId } = input;
      const { getDb } = await import('./db');
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
      const { sql: sqlFn } = await import('drizzle-orm');
      const itens = await dbConn.execute(sqlFn`
        SELECT vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.subtotal,
               COALESCE(vp.produtor, 'Outros') as produtor
        FROM venda_itens vi
        LEFT JOIN veiling_produtos vp ON vp.nome = vi.produtoNome
        WHERE vi.vendaId = ${vendaId}
        ORDER BY vi.ordem ASC
      `);
      const rows = itens[0] as unknown as any[];
      const mapa = new Map<string, { produtoNome: string; quantidade: number; precoVenda: number; subtotalVenda: number; produtor: string }>();
      for (const item of rows) {
        const chave = `${item.produtoNome}||${parseFloat(item.valorUnitario)}`;
        if (mapa.has(chave)) {
          const existing = mapa.get(chave)!;
          existing.quantidade += parseFloat(item.quantidade);
          existing.subtotalVenda += parseFloat(item.subtotal);
        } else {
          mapa.set(chave, {
            produtoNome: item.produtoNome,
            quantidade: parseFloat(item.quantidade),
            precoVenda: parseFloat(item.valorUnitario),
            subtotalVenda: parseFloat(item.subtotal),
            produtor: item.produtor || 'Outros',
          });
        }
      }
      const itensMesclados = Array.from(mapa.values()).sort((a, b) =>
        a.produtoNome.localeCompare(b.produtoNome, 'pt-BR')
      );
      return { itens: itensMesclados, qtdOriginal: rows.length };
    }),

  // Enviar itens do orçamento para um pedido de compra (novo ou existente)
  enviar: protectedProcedure
    .input(z.object({
      vendaId: z.number(),
      pedidoCompraId: z.number().optional(),
      observacoes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { vendaId, pedidoCompraId, observacoes } = input;
      const { getDb } = await import('./db');
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
      const { sql: sqlFn } = await import('drizzle-orm');

      // Buscar dados da venda
      const vendaRes = await dbConn.execute(sqlFn`
        SELECT v.id, c.nome as clienteNome FROM vendas v
        LEFT JOIN clientes c ON v.clienteId = c.id WHERE v.id = ${vendaId}
      `);
      const vendaRows = vendaRes[0] as unknown as any[];
      if (!vendaRows.length) throw new TRPCError({ code: 'NOT_FOUND', message: 'Orçamento não encontrado' });
      const venda = vendaRows[0];

      // Buscar e mesclar itens
      const itensRes = await dbConn.execute(sqlFn`
        SELECT vi.produtoId, vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.subtotal
        FROM venda_itens vi WHERE vi.vendaId = ${vendaId} ORDER BY vi.ordem ASC
      `);
      const itens = itensRes[0] as unknown as any[];

      const mapa = new Map<string, { produtoId: number | null; produtoNome: string; quantidade: number; precoVenda: number; subtotalVenda: number }>();
      for (const item of itens) {
        const chave = `${item.produtoNome}||${parseFloat(item.valorUnitario)}`;
        if (mapa.has(chave)) {
          const existing = mapa.get(chave)!;
          existing.quantidade += parseFloat(item.quantidade);
          existing.subtotalVenda += parseFloat(item.subtotal);
        } else {
          mapa.set(chave, {
            produtoId: item.produtoId || null,
            produtoNome: item.produtoNome,
            quantidade: parseFloat(item.quantidade),
            precoVenda: parseFloat(item.valorUnitario),
            subtotalVenda: parseFloat(item.subtotal),
          });
        }
      }
      const itensMesclados = Array.from(mapa.values()).sort((a, b) =>
        a.produtoNome.localeCompare(b.produtoNome, 'pt-BR')
      );

      const totalVenda = itensMesclados.reduce((s, i) => s + i.subtotalVenda, 0);
      const dataStr = new Date().toISOString().slice(0, 10);

      let pedidoId = pedidoCompraId;

      if (!pedidoId) {
        const obs = observacoes || `Gerado do orçamento #${vendaId} - ${venda.clienteNome || 'Cliente'}`;
        const solicitante = (ctx.user as any).name || (ctx.user as any).openId || 'sistema';
        // Gerar número sequencial para o pedido
        const maxNumRes = await dbConn.execute(sqlFn`SELECT COALESCE(MAX(numero), 0) as maxNum FROM pedidos_compra`);
        const maxNum = (((maxNumRes as unknown as any[])[0] as any[])[0]?.maxNum || 0) + 1;
        const insertRes = await dbConn.execute(sqlFn`
          INSERT INTO pedidos_compra (numero, data, solicitante, observacoes, status, total, createdAt, updatedAt)
          VALUES (${maxNum}, ${dataStr}, ${solicitante}, ${obs}, 'ABERTO', ${totalVenda}, NOW(), NOW())
        `);
        pedidoId = (insertRes[0] as any).insertId;
      } else {
        await dbConn.execute(sqlFn`
          UPDATE pedidos_compra SET total = total + ${totalVenda}, updatedAt = NOW() WHERE id = ${pedidoId}
        `);
      }

      // Buscar itens já existentes para evitar duplicação de chave
      const existentesRes = await dbConn.execute(sqlFn`
        SELECT produtoNome, precoVenda FROM pedido_compra_itens WHERE pedidoCompraId = ${pedidoId}
      `);
      const existentes = new Set(((existentesRes as unknown as any[])[0] as any[]).map(e => `${e.produtoNome}||${e.precoVenda}`));

      for (const item of itensMesclados) {
        const chave = `${item.produtoNome}||${item.precoVenda}`;
        // Se o item já existe com o mesmo nome e preço, atualizar quantidade
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
          // Inserir novo item (mesmo nome com preço diferente é permitido)
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
  enviarLote: protectedProcedure
    .input(z.object({
      vendaIds: z.array(z.number()).min(1),
      pedidoCompraId: z.number().optional(),
      observacoes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { vendaIds, pedidoCompraId, observacoes } = input;
      const { getDb } = await import('./db');
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponível' });
      const { sql: sqlFn, sql } = await import('drizzle-orm');

      // Validar que todos os orçamentos existem e estão aprovados
      const vendasRes = await dbConn.execute(sqlFn`
        SELECT v.id, v.status, v.faturado, c.nome as clienteNome FROM vendas v
        LEFT JOIN clientes c ON v.clienteId = c.id 
        WHERE v.id IN (${sql.raw(vendaIds.join(','))})
      `);
      const vendas = (vendasRes[0] as unknown as any[]);
      if (vendas.length !== vendaIds.length) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Um ou mais orçamentos não encontrados' });
      }
      const naoAprovados = vendas.filter(v => v.status !== 'APROVADO');
      if (naoAprovados.length > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `${naoAprovados.length} orçamento(s) não está(o) aprovado(s)` });
      }
      const convertidos = vendas.filter(v => v.faturado === 1);
      if (convertidos.length > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `${convertidos.length} orçamento(s) já foi/foram convertido(s) em venda` });
      }

      // Buscar e mesclar itens de todos os orçamentos
      const itensRes = await dbConn.execute(sqlFn`
        SELECT vi.produtoId, vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.subtotal, vi.vendaId
        FROM venda_itens vi 
        WHERE vi.vendaId IN (${sql.raw(vendaIds.join(','))})
        ORDER BY vi.vendaId ASC, vi.ordem ASC
      `);
      const itens = itensRes[0] as unknown as any[];

      const mapa = new Map<string, { produtoId: number | null; produtoNome: string; quantidade: number; precoVenda: number; subtotalVenda: number; vendaIds: number[] }>();
      for (const item of itens) {
        const chave = `${item.produtoNome}||${parseFloat(item.valorUnitario)}`;
        if (mapa.has(chave)) {
          const existing = mapa.get(chave)!;
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
            vendaIds: [item.vendaId],
          });
        }
      }
      const itensMesclados = Array.from(mapa.values()).sort((a, b) =>
        a.produtoNome.localeCompare(b.produtoNome, 'pt-BR')
      );

      const totalVenda = itensMesclados.reduce((s, i) => s + i.subtotalVenda, 0);
      const dataStr = new Date().toISOString().slice(0, 10);

      let pedidoId = pedidoCompraId;

      if (!pedidoId) {
        const clientesStr = vendas.map(v => v.clienteNome).join(', ');
        const obs = observacoes || `Gerado dos orçamentos #${vendaIds.join(', #')} - Clientes: ${clientesStr}`;
        const solicitante = (ctx.user as any).name || (ctx.user as any).openId || 'sistema';
        // Gerar número sequencial para o pedido
        const maxNumRes = await dbConn.execute(sqlFn`SELECT COALESCE(MAX(numero), 0) as maxNum FROM pedidos_compra`);
        const maxNum = (((maxNumRes as unknown as any[])[0] as any[])[0]?.maxNum || 0) + 1;
        const insertRes = await dbConn.execute(sqlFn`
          INSERT INTO pedidos_compra (numero, data, solicitante, observacoes, status, total, createdAt, updatedAt)
          VALUES (${maxNum}, ${dataStr}, ${solicitante}, ${obs}, 'ABERTO', ${totalVenda}, NOW(), NOW())
        `);
        pedidoId = (insertRes[0] as any).insertId;
      } else {
        await dbConn.execute(sqlFn`
          UPDATE pedidos_compra SET total = total + ${totalVenda}, updatedAt = NOW() WHERE id = ${pedidoId}
        `);
      }

      // Buscar itens já existentes para evitar duplicação de chave
      const existentesRes = await dbConn.execute(sqlFn`
        SELECT produtoNome, precoVenda FROM pedido_compra_itens WHERE pedidoCompraId = ${pedidoId}
      `);
      const existentes = new Set(((existentesRes as unknown as any[])[0] as any[]).map(e => `${e.produtoNome}||${e.precoVenda}`));

      // Se adicionando a pedido existente, precisamos consolidar e reordenar TODOS os itens
      if (pedidoCompraId) {
        // Buscar todos os itens do pedido (existentes + novos)
        const todosItensRes = await dbConn.execute(sqlFn`
          SELECT produtoId, produtoNome, quantidade, precoVenda, subtotalVenda FROM pedido_compra_itens
          WHERE pedidoCompraId = ${pedidoId}
        `);
        const todosItensExistentes = todosItensRes[0] as unknown as any[];
        
        // Consolidar todos os itens (existentes + novos) em um mapa
        const mapaConsolidado = new Map<string, { produtoId: number | null; produtoNome: string; quantidade: number; precoVenda: number; subtotalVenda: number }>();
        
        // Adicionar itens existentes
        for (const item of todosItensExistentes) {
          const chave = `${item.produtoNome}||${item.precoVenda}`;
          mapaConsolidado.set(chave, {
            produtoId: item.produtoId || null,
            produtoNome: item.produtoNome,
            quantidade: parseFloat(item.quantidade),
            precoVenda: parseFloat(item.precoVenda),
            subtotalVenda: parseFloat(item.subtotalVenda),
          });
        }
        
        // Adicionar/mesclar itens novos
        for (const item of itensMesclados) {
          const chave = `${item.produtoNome}||${item.precoVenda}`;
          if (mapaConsolidado.has(chave)) {
            const existing = mapaConsolidado.get(chave)!;
            existing.quantidade += item.quantidade;
            existing.subtotalVenda += item.subtotalVenda;
          } else {
            mapaConsolidado.set(chave, {
              produtoId: item.produtoId,
              produtoNome: item.produtoNome,
              quantidade: item.quantidade,
              precoVenda: item.precoVenda,
              subtotalVenda: item.subtotalVenda,
            });
          }
        }
        
        // Reordenar alfabeticamente
        const itensConsolidados = Array.from(mapaConsolidado.values()).sort((a, b) =>
          a.produtoNome.localeCompare(b.produtoNome, 'pt-BR')
        );
        
        // Deletar todos os itens antigos e reinserir na ordem correta
        await dbConn.execute(sqlFn`DELETE FROM pedido_compra_itens WHERE pedidoCompraId = ${pedidoId}`);
        
        for (const item of itensConsolidados) {
          await dbConn.execute(sqlFn`
            INSERT INTO pedido_compra_itens (pedidoCompraId, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda)
            VALUES (${pedidoId}, ${item.produtoId}, ${item.produtoNome}, ${item.quantidade}, ${item.precoVenda}, ${item.subtotalVenda})
          `);
        }
      } else {
        // Novo pedido: inserir itens já mesclados e ordenados
        for (const item of itensMesclados) {
          const vendaOrigemId = item.vendaIds[0];
          await dbConn.execute(sqlFn`
            INSERT INTO pedido_compra_itens (pedidoCompraId, produtoId, produtoNome, quantidade, precoVenda, subtotalVenda, vendaOrigemId)
            VALUES (${pedidoId}, ${item.produtoId}, ${item.produtoNome}, ${item.quantidade}, ${item.precoVenda}, ${item.subtotalVenda}, ${vendaOrigemId})
          `);
        }
      }

      // Registrar IDs dos orçamentos mesclados no pedido de compra
      const orcamentosOrigemIds = JSON.stringify(vendaIds);
      await dbConn.execute(sqlFn`
        UPDATE pedidos_compra SET orcamentosOrigemIds = ${orcamentosOrigemIds} WHERE id = ${pedidoId}
      `);

      return { pedidoId, qtdOrcamentos: vendaIds.length, qtdItens: itensMesclados.length, total: totalVenda };
    }),

  // Listar pedidos de compra disponíveis para adicionar itens
  listarPedidosCompra: protectedProcedure
    .query(async () => {
      const { getDb } = await import('./db');
      const dbConn = await getDb();
      if (!dbConn) return [];
      const { sql: sqlFn } = await import('drizzle-orm');
      const res = await dbConn.execute(sqlFn`
        SELECT id, numero, data, status, total FROM pedidos_compra
        WHERE deletedAt IS NULL AND status IN ('ABERTO', 'PENDENTE', 'EM_ANDAMENTO')
        ORDER BY createdAt DESC LIMIT 20
      `);
       return res[0] as unknown as any[];
    }),

  // Verificar se uma venda já foi enviada para pedido de compra
  verificarEnviado: protectedProcedure
    .input(z.object({ vendaId: z.number() }))
    .query(async ({ input }) => {
      const { getDb } = await import('./db');
      const dbConn = await getDb();
      if (!dbConn) return { enviado: false, pedidoId: null };
      const { sql: sqlFn } = await import('drizzle-orm');
      const res = await dbConn.execute(sqlFn`
        SELECT pci.pedidoCompraId, pc.numero
        FROM pedido_compra_itens pci
        JOIN pedidos_compra pc ON pc.id = pci.pedidoCompraId
        WHERE pci.vendaOrigemId = ${input.vendaId} AND pc.deletedAt IS NULL
        LIMIT 1
      `);
      const rows = res[0] as unknown as any[];
      if (!rows.length) return { enviado: false, pedidoId: null, numero: null };
      return { enviado: true, pedidoId: rows[0].pedidoCompraId, numero: rows[0].numero };
    }),

  // Verificar múltiplas vendas de uma vez (para a lista)
  verificarEnviadoLote: protectedProcedure
    .input(z.object({ vendaIds: z.array(z.number()) }))
    .query(async ({ input }) => {
      if (!input.vendaIds.length) return {};
      const { getDb } = await import('./db');
      const dbConn = await getDb();
      if (!dbConn) return {};
      const map: Record<number, { pedidoId: number; numero: string }> = {};
      const ids = input.vendaIds.slice(0, 500);
      if (!ids.length) return map;
      
      try {
        const { eq, inArray } = await import('drizzle-orm');
        const { pedidoCompraItens, pedidosCompra } = await import('../drizzle/schema');
        
        const results = await dbConn
          .select({
            vendaOrigemId: pedidoCompraItens.vendaOrigemId,
            pedidoCompraId: pedidoCompraItens.pedidoCompraId,
            numero: pedidosCompra.numero,
          })
          .from(pedidoCompraItens)
          .innerJoin(pedidosCompra, eq(pedidosCompra.id, pedidoCompraItens.pedidoCompraId))
          .where(inArray(pedidoCompraItens.vendaOrigemId, ids))
          .execute();
        
        for (const r of results) {
          if (r.vendaOrigemId) {
            map[r.vendaOrigemId] = { pedidoId: r.pedidoCompraId, numero: String(r.numero || '') };
          }
        }
      } catch (err) {
        console.error('[verificarEnviadoLote] Erro ao buscar pedidos:', err);
      }
      return map;
    }),

  gerarPdfLote: protectedProcedure
    .input(z.object({ vendaIds: z.array(z.number()).min(1) }))
    .mutation(async ({ input }) => {
      const { vendaIds } = input;
      const { getDb } = await import('./db');
      const dbConn = await getDb();
      if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB indisponivel' });
      const { sql: sqlFn } = await import('drizzle-orm');

      const vendasRes = await dbConn.execute(sqlFn`
        SELECT v.id, v.numero, v.data, v.status, v.total, v.clienteNome, v.vencimento
        FROM vendas v
        WHERE v.id IN (${vendaIds.join(',')})
        ORDER BY v.numero ASC
      `);
      const vendas = (vendasRes[0] as unknown as any[]);
      if (vendas.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Nenhum orcamento encontrado' });
      }

      const itensRes = await dbConn.execute(sqlFn`
        SELECT vi.vendaId, vi.produtoNome, vi.quantidade, vi.valorUnitario, vi.subtotal
        FROM venda_itens vi
        WHERE vi.vendaId IN (${vendaIds.join(',')})
        ORDER BY vi.vendaId ASC, vi.ordem ASC
      `);
      const itens = (itensRes[0] as unknown as any[]);

      return {
        vendas,
        itens,
        totalOrcamentos: vendas.length,
        totalItens: itens.length,
      };
    }),
  }),

  // ─── Promoções ───
  promocoes: router({
    create: protectedProcedure.input(z.object({
      titulo: z.string().min(1),
      descricao: z.string().optional(),
      tipoDesconto: z.enum(["percentual", "fixo"]),
      valorDesconto: z.number().positive(),
      imagemUrl: z.string().optional(),
      imagemBase64: z.string().optional(),
      itens: z.array(z.object({
        produtoId: z.string(),
        produtoNome: z.string(),
        precoOriginal: z.number(),
        precoPromocional: z.number(),
        imagemUrl: z.string().optional(),
        catalogo: z.string().optional(),
      })),
    })).mutation(async ({ input, ctx }) => {
      const id = await db.createPromocao({
        ...input,
        criadoPor: ctx.user?.name || "Sistema",
      });
      return { success: true, id };
    }),

    list: protectedProcedure.input(z.object({
      ativo: z.boolean().optional(),
    })).query(async ({ input }) => {
      return db.getPromocoes(input.ativo);
    }),

    getById: protectedProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      return db.getPromocaoById(input.id);
    }),

    update: protectedProcedure.input(z.object({
      id: z.number(),
      titulo: z.string().optional(),
      descricao: z.string().optional(),
      tipoDesconto: z.enum(["percentual", "fixo"]).optional(),
      valorDesconto: z.number().positive().optional(),
      imagemUrl: z.string().optional(),
      imagemBase64: z.string().optional(),
      ativo: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updatePromocao(id, data);
      return { success: true };
    }),

    delete: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input }) => {
      await db.deletePromocao(input.id);
      return { success: true };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // CATEGORIAS DE PRODUTOS
  // ═══════════════════════════════════════════════════════════════
  categoriasProdutos: router({
    list: protectedProcedure.query(async () => {
      return db.listCategoriasProdutos();
    }),
    create: protectedProcedure.input(z.object({
      nome: z.string().min(1),
      descricao: z.string().optional(),
      ordem: z.number().optional(),
    })).mutation(async ({ input }) => {
      return db.createCategoriaProduto(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      nome: z.string().optional(),
      descricao: z.string().optional(),
      ordem: z.number().optional(),
      ativo: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCategoriaProduto(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input }) => {
      await db.deleteCategoriaProduto(input.id);
      return { success: true };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // LISTAS DE PREÇOS
  // ═══════════════════════════════════════════════════════════════
  listasPrecos: router({
    list: protectedProcedure.query(async () => {
      return db.listListasPrecos();
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getListaPrecoById(input.id);
    }),
    getByToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      return db.getListaPrecoByToken(input.token);
    }),
    create: protectedProcedure.input(z.object({
      titulo: z.string().min(1),
      subtitulo: z.string().optional(),
      expiresAt: z.date().optional(),
      aceitaPedidos: z.boolean().optional(),
      observacao: z.string().optional(),
      criadoPor: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const crypto = await import('crypto');
      const token = crypto.randomBytes(24).toString('hex');
      return db.createListaPreco({ ...input, token, criadoPor: input.criadoPor ?? ctx.user?.name ?? 'Sistema' });
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      titulo: z.string().optional(),
      subtitulo: z.string().optional(),
      expiresAt: z.date().nullable().optional(),
      ativo: z.boolean().optional(),
      aceitaPedidos: z.boolean().optional(),
      observacao: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateListaPreco(id, data as any);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteListaPreco(input.id);
      return { success: true };
    }),
    // Salvar todos os itens de uma lista (substituição completa)
    saveItens: protectedProcedure.input(z.object({
      listaId: z.number(),
      itens: z.array(z.object({
        categoriaId: z.number().optional(),
        categoriaNome: z.string(),
        variedade: z.string(),
        tamanho: z.string().optional(),
        qtdHasteMaco: z.string().optional(),
        valorUnitario: z.number(),
        disponivel: z.boolean().optional(),
        ordem: z.number().optional(),
      })),
    })).mutation(async ({ input }) => {
      await db.replaceListaItens(input.listaId, input.itens);
      return { success: true };
    }),
    addItem: protectedProcedure.input(z.object({
      listaId: z.number(),
      categoriaId: z.number().optional(),
      categoriaNome: z.string(),
      variedade: z.string(),
      tamanho: z.string().optional(),
      qtdHasteMaco: z.string().optional(),
      valorUnitario: z.number(),
      ordem: z.number().optional(),
    })).mutation(async ({ input }) => {
      return db.addListaItem(input);
    }),
    updateItem: protectedProcedure.input(z.object({
      id: z.number(),
      categoriaNome: z.string().optional(),
      variedade: z.string().optional(),
      tamanho: z.string().optional(),
      qtdHasteMaco: z.string().optional(),
      valorUnitario: z.number().optional(),
      disponivel: z.boolean().optional(),
      ordem: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateListaItem(id, data);
      return { success: true };
    }),
    deleteItem: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteListaItem(input.id);
      return { success: true };
    }),
    // Receber pedido de cliente (público) — converte automaticamente em orçamento
    fazerPedido: publicProcedure.input(z.object({
      token: z.string(),
      clienteNome: z.string().min(1),
      clienteTelefone: z.string().optional(),
      observacao: z.string().optional(),
      itens: z.array(z.object({
        listaItemId: z.number(),
        categoriaNome: z.string(),
        variedade: z.string(),
        tamanho: z.string().optional(),
        qtdHasteMaco: z.string().optional(),
        valorUnitario: z.number(),
        quantidade: z.number().min(1),
      })),
    })).mutation(async ({ input }) => {
      // Buscar lista
      const lista = await db.getListaPrecoByToken(input.token);
      if (!lista) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lista não encontrada' });
      if (!lista.ativo) throw new TRPCError({ code: 'FORBIDDEN', message: 'Esta lista não está mais ativa' });
      if (lista.expiresAt && new Date(lista.expiresAt) < new Date()) throw new TRPCError({ code: 'FORBIDDEN', message: 'Esta lista expirou' });
      if (!lista.aceitaPedidos) throw new TRPCError({ code: 'FORBIDDEN', message: 'Esta lista não aceita pedidos no momento' });

      // Criar pedido na tabela de listas_pedidos
      const { id: pedidoId, total } = await db.criarListaPedido({
        listaId: lista.id,
        clienteNome: input.clienteNome,
        clienteTelefone: input.clienteTelefone,
        observacao: input.observacao,
        itens: input.itens,
      });

      // Converter automaticamente em orçamento (venda)
      let vendaId: number | undefined;
      try {
        const { getDb } = await import('./db');
        const dbConn = await getDb();
        if (dbConn) {
          const hoje = new Date().toISOString().slice(0, 10);
          const itensVenda = input.itens.map(i => ({
            produtoNome: `${i.categoriaNome} - ${i.variedade}${i.tamanho ? ` ${i.tamanho}` : ''}`,
            quantidade: String(i.quantidade),
            valorUnitario: String(i.valorUnitario),
            subtotal: String((i.valorUnitario * i.quantidade).toFixed(2)),
            observacao: i.qtdHasteMaco ? `Qtd HST/MÇ: ${i.qtdHasteMaco}` : '',
          }));
          const [res] = await dbConn.insert(vendas).values({
            clienteNome: input.clienteNome,
            data: hoje,
            status: 'AGUARDANDO' as any,
            logistica: 'RETIRADA',
            total: String(total.toFixed(2)),
            frete: '0.00',
            telefoneCliente: input.clienteTelefone,
            observacaoPedido: `Pedido via Lista de Preços: ${lista.titulo}${input.observacao ? '\n' + input.observacao : ''}`,
          });
          vendaId = (res as any).insertId;
          // Inserir itens da venda
          if (vendaId && itensVenda.length > 0) {
            const { vendaItens } = await import('../drizzle/schema');
            await dbConn.insert(vendaItens).values(itensVenda.map((item, idx) => ({
              vendaId: vendaId!,
              produtoNome: item.produtoNome,
              quantidade: item.quantidade,
              valorUnitario: item.valorUnitario,
              subtotal: item.subtotal,
              observacao: item.observacao,
              ordem: idx + 1,
            })));
          }
          // Atualizar pedido com vendaId
          await db.updateListaPedidoStatus(pedidoId, 'NOVO', vendaId);
        }
      } catch (err) {
        console.error('[listasPrecos.fazerPedido] Erro ao criar orçamento:', err);
      }

      // Notificar via WhatsApp (link wa.me) e notifyOwner
      const itensTexto = input.itens.map(i =>
        `• ${i.categoriaNome} - ${i.variedade}${i.tamanho ? ` ${i.tamanho}` : ''} x${i.quantidade} = R$ ${(i.valorUnitario * i.quantidade).toFixed(2)}`
      ).join('\n');
      const mensagemWpp = `🌸 *NOVO PEDIDO - ${lista.titulo}*\n\n👤 Cliente: ${input.clienteNome}\n📞 Tel: ${input.clienteTelefone || '-'}\n\n${itensTexto}\n\n💰 *Total: R$ ${total.toFixed(2)}*${input.observacao ? '\n\n📝 Obs: ' + input.observacao : ''}${vendaId ? '\n\n✅ Orçamento #' + vendaId + ' criado automaticamente no ERP' : ''}`;
      const whatsappUrl = `https://wa.me/5534991255878?text=${encodeURIComponent(mensagemWpp)}`;

      // Notificar proprietário via sistema
      try {
        await notifyOwner({
          title: `🌸 Novo Pedido - ${lista.titulo} | ${input.clienteNome}`,
          content: `Cliente: ${input.clienteNome}\nTelefone: ${input.clienteTelefone || '-'}\n\n${itensTexto}\n\nTotal: R$ ${total.toFixed(2)}${vendaId ? '\n\nOrçamento #' + vendaId + ' criado automaticamente.' : ''}`,
        });
      } catch (err) {
        console.error('[listasPrecos.fazerPedido] Erro ao notificar:', err);
      }

      return { pedidoId, vendaId, total, whatsappUrl };
    }),
    // Listar pedidos de uma lista
    listPedidos: protectedProcedure.input(z.object({ listaId: z.number() })).query(async ({ input }) => {
      return db.listListasPedidos(input.listaId);
    }),
    getPedido: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getListaPedidoById(input.id);
    }),
    updatePedidoStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(['NOVO', 'VISTO', 'APROVADO', 'CANCELADO']),
    })).mutation(async ({ input }) => {
      await db.updateListaPedidoStatus(input.id, input.status);
      return { success: true };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════
  // PRODUTOS DE LISTA (cadastro manual)
  // ═══════════════════════════════════════════════════════════════
  produtosLista: router({
    searchLoja: protectedProcedure.input(z.object({
      busca: z.string().optional(),
    })).query(async ({ input }) => {
      return db.searchProdutosLoja(input.busca);
    }),
    list: protectedProcedure.input(z.object({
      categoriaId: z.number().optional(),
      ativo: z.boolean().optional(),
      busca: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      return db.listProdutosLista(input ?? {});
    }),
    create: protectedProcedure.input(z.object({
      produtoLojaId: z.number().optional().nullable(),
      categoriaId: z.number().optional(),
      categoriaNome: z.string().min(1),
      variedade: z.string().min(1),
      tamanho: z.string().optional(),
      qtdHasteMaco: z.string().optional(),
      valorUnitario: z.number().default(0),
      observacao: z.string().optional(),
    })).mutation(async ({ input }) => {
      return db.createProdutoLista(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      produtoLojaId: z.number().optional().nullable(),
      categoriaId: z.number().optional().nullable(),
      categoriaNome: z.string().optional(),
      variedade: z.string().optional(),
      tamanho: z.string().optional().nullable(),
      qtdHasteMaco: z.string().optional().nullable(),
      valorUnitario: z.number().optional(),
      ativo: z.boolean().optional(),
      observacao: z.string().optional().nullable(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateProdutoLista(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteProdutoLista(input.id);
      return { success: true };
    }),
    toggleAtivo: protectedProcedure.input(z.object({ id: z.number(), ativo: z.boolean() })).mutation(async ({ input }) => {
      await db.toggleProdutoListaAtivo(input.id, input.ativo);
      return { success: true };
    }),
    syncFromLoja: protectedProcedure.input(z.object({
      produtoListaId: z.number(),
    })).mutation(async ({ input }) => {
      const produtoLista = await db.getProdutoListaById(input.produtoListaId);
      if (!produtoLista || !produtoLista.produtoLojaId) {
        throw new Error('Produto nao vinculado');
      }
      const produtoLoja = await db.getProdutoLoja(produtoLista.produtoLojaId);
      if (!produtoLoja) throw new Error('Produto loja nao encontrado');
      await db.updateProdutoLista(input.produtoListaId, {
        variedade: produtoLoja.nome,
        categoriaNome: produtoLoja.departamento,
        valorUnitario: Number(produtoLoja.preco),
        ativo: produtoLoja.ativo === 1,
      });
      return { success: true };
    }),
    syncToLoja: protectedProcedure.input(z.object({
      produtoListaId: z.number(),
    })).mutation(async ({ input }) => {
      const produtoLista = await db.getProdutoListaById(input.produtoListaId);
      if (!produtoLista || !produtoLista.produtoLojaId) {
        throw new Error('Produto nao vinculado');
      }
      await db.updateProdutoLoja(produtoLista.produtoLojaId, {
        nome: produtoLista.variedade,
        departamento: produtoLista.categoriaNome,
        preco: String(produtoLista.valorUnitario),
        ativo: produtoLista.ativo,
      });
      return { success: true };
    }),
    getHistorico: protectedProcedure.input(z.object({
      produtoListaId: z.number(),
    })).query(async ({ input }) => {
      return db.getHistoricoAlteracao(input.produtoListaId);
    }),
    verificarDesatualizado: protectedProcedure.input(z.object({
      produtoListaId: z.number(),
    })).query(async ({ input }) => {
      return db.verificarDesatualizacao(input.produtoListaId);
    }),
  }),

  // ─── Compras Importadas ───
  comprasImportadas: router({
    list: protectedProcedure.query(async () => {
      return db.getComprasImportadas();
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.getCompraImportadaById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      produto: z.string(),
      quantidade: z.string(),
      valorCusto: z.string(),
      pacote: z.string(),
      freteUm: z.string().optional(),
      icms: z.string().optional(),
      embalagem: z.string().optional(),
      nomeArquivo: z.string(),
      // Campos opcionais para cálculos manuais
      valorTotal: z.string().optional(),
      freteTotal: z.string().optional(),
      custoTotal: z.string().optional(),
      totalCompra: z.string().optional(),
      valorVarejo: z.string().optional(),
      valorCdUm: z.string().optional(),
      valorCdAta: z.string().optional(),
    })).mutation(async ({ input }) => {
      // Usar valores fornecidos ou padrões
      const freteUm = parseFloat(input.freteUm || "0");
      const icms = parseFloat(input.icms || "1.0");
      const embalagem = parseFloat(input.embalagem || "0");
      const quantidade = parseFloat(input.quantidade);
      const valorCusto = parseFloat(input.valorCusto);
      const pacote = parseFloat(input.pacote);

      // Calcular valores usando as fórmulas da tabela Excel
      const calculos = db.calcularValoresCompraImportada({
        quantidade,
        valorCusto,
        pacote,
        freteUm,
        icms,
        embalagem,
      });

      const id = await db.createCompraImportada({
        produto: input.produto,
        quantidade: quantidade as any,
        valorCusto: valorCusto.toString() as any,
        pacote: pacote as any,
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
        nomeArquivo: input.nomeArquivo,
      });
      return { id };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      return db.deleteCompraImportada(input.id);
    }),
    getProdutoFatorConversao: protectedProcedure.input(z.object({ nomeProduto: z.string() })).query(async ({ input }) => {
      const produto = await db.getProdutoByName(input.nomeProduto);
      if (!produto) return { fatorConversao: 0, encontrado: false };
      return { fatorConversao: produto.fatorConversao, encontrado: true, produtoId: produto.id };
    }),
    sincronizarComVeiling: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      return db.sincronizarCompraImportadaComVeiling(input.id);
    }),
    sincronizarTodas: protectedProcedure.mutation(async () => {
      return db.sincronizarTodasComprasImportadas();
    }),
    aplicarPrecosNoVeiling: protectedProcedure.input(z.object({ ids: z.array(z.number()) })).mutation(async ({ input }) => {
      return db.aplicarPrecosComprasImportadasNoVeiling(input.ids);
    }),
    aplicarTodosPrecosNoVeiling: protectedProcedure.mutation(async () => {
      return db.aplicarTodosPrecosComprasImportadas();
    }),
    processarRcoldesc: protectedProcedure.input(z.object({ conteudo: z.string() })).mutation(async ({ input }) => {
      const rcoldescRows = db.parseRcoldescFile(input.conteudo);
      const comprasConvertidas = await db.converterRcoldescParaCompraImportada(rcoldescRows);
      return { total: comprasConvertidas.length, compras: comprasConvertidas };
    }),
  }),
  // ─── Produtos Customizados ───
  categoriasCustomizadas: router({
    listar: publicProcedure.query(async () => {
      return db.listarCategoriasCustomizadas();
    }),
    criar: protectedProcedure.input(z.object({
      nome: z.string().min(1),
      descricao: z.string().optional(),
      cor: z.string().optional(),
      icone: z.string().optional(),
    })).mutation(async ({ input }) => {
      return db.criarCategoriaCustomizada(input);
    }),
    atualizar: protectedProcedure.input(z.object({
      id: z.number(),
      nome: z.string().optional(),
      descricao: z.string().optional(),
      cor: z.string().optional(),
      icone: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.atualizarCategoriaCustomizada(id, data);
    }),
    deletar: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      return db.deletarCategoriaCustomizada(input.id);
    }),
  }),

  produtosCustomizados: router({
    listar: publicProcedure.query(async () => {
      return db.listarProdutosCustomizados();
    }),
    obter: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.obterProdutoCustomizado(input.id);
    }),
    criar: protectedProcedure.input(z.object({
      nome: z.string().min(1),
      descricao: z.string().optional(),
      precoUnitario: z.number().positive(),
      estoque: z.number().nonnegative(),
      estoqueMinimo: z.number().nonnegative().optional(),
      fotoUrl: z.string().optional(),
      categoriaId: z.number().optional(),
    })).mutation(async ({ input }) => {
      return db.criarProdutoCustomizado({
        nome: input.nome,
        descricao: input.descricao,
        precoUnitario: input.precoUnitario.toString(),
        estoque: input.estoque,
        estoqueMinimo: input.estoqueMinimo,
        fotoUrl: input.fotoUrl,
        categoriaId: input.categoriaId,
        ativo: input.estoque > 0 ? 1 : 0,
      });
    }),
    atualizar: protectedProcedure.input(z.object({
      id: z.number(),
      nome: z.string().optional(),
      descricao: z.string().optional(),
      precoUnitario: z.number().optional(),
      estoque: z.number().optional(),
      estoqueMinimo: z.number().optional(),
      fotoUrl: z.string().optional(),
      categoriaId: z.number().optional().nullable(),
      ativo: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: any = {};
      if (data.nome !== undefined) updateData.nome = data.nome;
      if (data.descricao !== undefined) updateData.descricao = data.descricao;
      if (data.precoUnitario !== undefined) updateData.precoUnitario = data.precoUnitario.toString();
      if (data.estoque !== undefined) updateData.estoque = data.estoque;
      if (data.estoqueMinimo !== undefined) updateData.estoqueMinimo = data.estoqueMinimo;
      if (data.fotoUrl !== undefined) updateData.fotoUrl = data.fotoUrl;
      if (data.categoriaId !== undefined) updateData.categoriaId = data.categoriaId;
      if (data.ativo !== undefined) updateData.ativo = data.ativo;
      return db.atualizarProdutoCustomizado(id, updateData);
    }),
    deletar: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      return db.deletarProdutoCustomizado(input.id);
    }),
    decrementarEstoque: protectedProcedure.input(z.object({
      id: z.number(),
      quantidade: z.number().positive(),
    })).mutation(async ({ input }) => {
      return db.decrementarEstoqueProdutoCustomizado(input.id, input.quantidade);
    }),
  }),

  // ─── Histórico de Catálogos PDF ───
  catalogoHistorico: router({
    listar: protectedProcedure.query(async ({ ctx }) => {
      return db.listarCatalogosHistorico(ctx.user?.id);
    }),
    obter: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return db.obterCatalogoHistorico(input.id);
    }),
    salvar: protectedProcedure.input(z.object({
      nome: z.string().min(1),
      produtosCount: z.number().positive(),
      pdfUrl: z.string().optional(),
      produtosJson: z.string(),
      desconto: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      return db.salvarCatalogoHistorico({
        nome: input.nome,
        produtosCount: input.produtosCount,
        usuarioId: ctx.user?.id,
        pdfUrl: input.pdfUrl,
        produtosJson: input.produtosJson,
        desconto: input.desconto,
      });
    }),
    atualizar: protectedProcedure.input(z.object({
      id: z.number(),
      nome: z.string().optional(),
      produtosCount: z.number().optional(),
      pdfUrl: z.string().optional(),
      produtosJson: z.string().optional(),
      desconto: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.atualizarCatalogoHistorico(id, data);
    }),
    deletar: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      return db.deletarCatalogoHistorico(input.id);
    }),
    restaurar: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      return db.restaurarCatalogoHistorico(input.id);
    }),
  }),

});
export type AppRouter = typeof appRouter;
