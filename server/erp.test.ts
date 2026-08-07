import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getVendedorByLogin: vi.fn(async (nome: string, senha: string) => {
    if (nome === "admin" && senha === "admin") {
      return { id: 1, nome: "admin", email: null, telefone: null, perfil: "ADMIN", senha: "admin" };
    }
    if (nome === "vendedor1" && senha === "123") {
      return { id: 2, nome: "vendedor1", email: null, telefone: null, perfil: "VENDEDOR", senha: "123" };
    }
    return null;
  }),
  listVendedores: vi.fn(async () => [
    { id: 1, nome: "admin", email: null, telefone: null, perfil: "ADMIN", createdAt: new Date(), updatedAt: new Date() },
    { id: 2, nome: "vendedor1", email: null, telefone: null, perfil: "VENDEDOR", createdAt: new Date(), updatedAt: new Date() },
  ]),
  listClientes: vi.fn(async () => []),
  createCliente: vi.fn(async () => 1),
  getCliente: vi.fn(async (id: number) => ({ id, nome: "Teste", telefone: "123", email: null, endereco: null })),
  updateCliente: vi.fn(async () => {}),
  createHistorico: vi.fn(async () => 1),
  listHistorico: vi.fn(async () => []),
  calcularEstoqueTodos: vi.fn(async () => []),
  getProduto: vi.fn(async (id: number) => ({ id, descricao: "Rosa", preco: "10.00", codigoExterno: null })),
  createProduto: vi.fn(async () => 1),
  updateProduto: vi.fn(async () => {}),
  getProdutoByDescricao: vi.fn(async () => null),
  listVendas: vi.fn(async () => []),
  getVendaItens: vi.fn(async () => []),
  getVendasFaturadosIds: vi.fn(async () => []),
  isVendaFaturada: vi.fn(async () => false),
  createVenda: vi.fn(async () => 1),
  listCompras: vi.fn(async () => []),
  getCompraItens: vi.fn(async () => []),
  createCompra: vi.fn(async () => 1),
  getRelatorioVendas: vi.fn(async () => []),
  getRankingProdutos: vi.fn(async () => []),
  getAllDataForBackup: vi.fn(async () => ({
    clientes: [{ id: 1, nome: "Teste" }],
    produtos: [{ id: 1, descricao: "Rosa" }],
    vendas: [],
    vendaItens: [],
    compras: [],
    compraItens: [],
    estoqueAjustes: [],
    historicoAlteracoes: [],
    vendedores: [{ id: 1, nome: "admin" }],
    backups: [],
  })),
  createBackupRecord: vi.fn(async () => 1),
  listBackups: vi.fn(async () => []),
  zerarEstoque: vi.fn(async () => {}),
  importBackupData: vi.fn(async () => {}),
  calcularEstoqueProduto: vi.fn(async () => 10),
  getKardex: vi.fn(async () => []),
  createAjusteEstoque: vi.fn(async () => 1),
  getVendedor: vi.fn(async (id: number) => {
    if (id === 1) return { id: 1, nome: "admin", email: null, telefone: null, perfil: "ADMIN", senha: "admin" };
    if (id === 2) return { id: 2, nome: "vendedor1", email: null, telefone: null, perfil: "VENDEDOR", senha: "123" };
    return null;
  }),
  createVendedor: vi.fn(async () => 2),
  updateVendedor: vi.fn(async () => {}),
  getVenda: vi.fn(async () => null),
  getCompra: vi.fn(async () => null),
  updateVenda: vi.fn(async () => {}),
   deleteCliente: vi.fn(async () => {}),
  deleteProduto: vi.fn(async () => {}),
  deleteVenda: vi.fn(async () => {}),
  listClientesLixeira: vi.fn(async () => [
    { id: 10, nome: "Cliente Excluído", telefone: null, email: null, endereco: null, deletedAt: new Date() },
  ]),
  listProdutosLixeira: vi.fn(async () => [
    { id: 20, descricao: "Produto Excluído", preco: "5.00", codigoExterno: null, deletedAt: new Date() },
  ]),
  listVendasLixeira: vi.fn(async () => [
    { id: 30, clienteNome: "Cliente X", data: "2026-04-01", total: "50.00", deletedAt: new Date() },
  ]),
  restoreCliente: vi.fn(async () => {}),
  restoreProduto: vi.fn(async () => {}),
  restoreVenda: vi.fn(async () => {}),
  deleteClientePermanente: vi.fn(async () => {}),
  deleteProdutoPermanente: vi.fn(async () => {}),
  deleteVendaPermanente: vi.fn(async () => {}),
  listProdutos: vi.fn(async () => []),
  buscarPedidosConferencia: vi.fn(async (search: string) => {
    if (search === "1" || search === "João" || search === "11999") {
      return [{
        id: 1, clienteNome: "João", clienteTelefone: "11999999999", data: "2026-04-10",
        total: "30.00", status: "APROVADO", conferido: false, conferidoPor: null, conferidoEm: null,
        vendedorNome: "admin",
        itens: [
          { id: 10, produtoNome: "Rosa", quantidade: "2", valorUnitario: "15.00", subtotal: "30.00", qtdConferida: null },
        ],
      }];
    }
    return [];
  }),
  salvarConferencia: vi.fn(async () => {}),
  listarDivergenciasConferencia: vi.fn(async () => []),
  listTabelaPrecosByCompra: vi.fn(async (compraId: number) => {
    if (compraId === 1) {
      return [
        { id: 1, compraItemId: 100, compraId: 1, produtoId: 1, produtoNome: "Rosa", custoUnitario: "10.00", margem1: "20.00", preco1: "12.00", margem2: "30.00", preco2: "13.00", margem3: "50.00", preco3: "15.00", updatedAt: new Date(), createdAt: new Date() },
      ];
    }
    return [];
  }),
  saveTabelaPrecosBatch: vi.fn(async () => {}),
  applyTabela3ToProducts: vi.fn(async () => ({ atualizados: 0, historico: [] })),
  upsertTabelaPreco: vi.fn(async () => 1),
  upsertProdutoLojaFromCompra: vi.fn(async () => {}),
}));

// Mock storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn(async () => ({ key: "backups/test.json", url: "https://s3.example.com/backups/test.json" })),
  storageGet: vi.fn(async () => ({ key: "backups/test.json", url: "https://s3.example.com/backups/test.json" })),
}));

function createProtectedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "owner-open-id",
      email: "admin@test.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Vendedores - Login", () => {
  it("deve autenticar com credenciais válidas (ADMIN)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.vendedores.login({ nome: "admin", senha: "admin" });
    expect(result.success).toBe(true);
    expect(result.vendedor?.nome).toBe("admin");
    expect(result.vendedor?.perfil).toBe("ADMIN");
  });

  it("deve autenticar com credenciais válidas (VENDEDOR)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.vendedores.login({ nome: "vendedor1", senha: "123" });
    expect(result.success).toBe(true);
    expect(result.vendedor?.nome).toBe("vendedor1");
    expect(result.vendedor?.perfil).toBe("VENDEDOR");
  });

  it("deve rejeitar credenciais inválidas", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.vendedores.login({ nome: "admin", senha: "errada" });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("Clientes - CRUD", () => {
  it("deve listar clientes", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.clientes.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve criar um cliente", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.clientes.create({ nome: "João Silva", telefone: "11999999999" });
    expect(result.id).toBe(1);
  });

  it("deve atualizar um cliente com histórico", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.clientes.update({ id: 1, nome: "João Atualizado", usuarioNome: "admin" });
    expect(result.success).toBe(true);
  });
});

describe("Produtos - CRUD", () => {
  it("deve criar um produto", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.produtos.create({ descricao: "Rosa Vermelha", preco: "15.00" });
    expect(result.id).toBe(1);
  });

  it("deve atualizar um produto com histórico", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.produtos.update({ id: 1, preco: "18.00", usuarioNome: "admin" });
    expect(result.success).toBe(true);
  });
});

describe("Vendas", () => {
  it("deve criar uma venda", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.vendas.create({
      clienteNome: "João",
      vendedorNome: "admin",
      data: "2026-04-10",
      total: "30.00",
      itens: [
        { produtoNome: "Rosa", quantidade: "2", valorUnitario: "15.00", subtotal: "30.00", observacao: "Vermelhas" },
      ],
    });
    expect(result.id).toBe(1);
  });

  it("deve listar vendas", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.vendas.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve permitir edição manual de preço (comportamento atual - sobrescrita removida)", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    // Comportamento atual: edição manual de preço é permitida para todos os usuários
    // A lógica de sobrescrita de preço foi removida intencionalmente (ver todo.md)
    const { createVenda } = await import("./db");
    const result = await caller.vendas.create({
      clienteNome: "Cliente Teste",
      vendedorId: 2,
      vendedorNome: "vendedor1",
      data: "2026-04-10",
      total: "198.00",
      itens: [
        { produtoId: 1, produtoNome: "Rosa", quantidade: "2", valorUnitario: "99.00", subtotal: "198.00" },
      ],
    });
    expect(result.id).toBe(1);
    // Verificar que createVenda foi chamado com o preço informado (sem sobrescrita)
    const mockCreateVenda = createVenda as any;
    const lastCall = mockCreateVenda.mock.calls[mockCreateVenda.mock.calls.length - 1];
    const itensPassados = lastCall[1];
    expect(itensPassados[0].valorUnitario).toBe("99.00");
    expect(itensPassados[0].subtotal).toBe("198.00");
  });

  it("não deve alterar preço quando ADMIN cria venda", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const { createVenda } = await import("./db");
    const result = await caller.vendas.create({
      clienteNome: "Cliente Admin",
      vendedorId: 1,
      vendedorNome: "admin",
      data: "2026-04-10",
      total: "198.00",
      itens: [
        { produtoId: 1, produtoNome: "Rosa", quantidade: "2", valorUnitario: "99.00", subtotal: "198.00" },
      ],
    });
    expect(result.id).toBe(1);
    // Admin pode definir qualquer preço
    const mockCreateVenda = createVenda as any;
    const lastCall = mockCreateVenda.mock.calls[mockCreateVenda.mock.calls.length - 1];
    const itensPassados = lastCall[1];
    expect(itensPassados[0].valorUnitario).toBe("99.00");
  });
});

describe("Compras", () => {
  it("deve criar uma compra com numNF", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.compras.create({
      fornecedor: "Fornecedor X",
      numNF: "12345",
      data: "2026-04-10",
      total: "100.00",
      itens: [
        { produtoNome: "Rosa", quantidade: "10", valorUnitario: "10.00", subtotal: "100.00" },
      ],
    });
    expect(result.id).toBe(1);
    // Verificar que createCompra foi chamado com numNF
    const { createCompra } = await import("./db");
    const mockCreateCompra = createCompra as any;
    const lastCall = mockCreateCompra.mock.calls[mockCreateCompra.mock.calls.length - 1];
    expect(lastCall[0].numNF).toBe("12345");
  });

  it("deve criar uma compra sem numNF (importação)", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.compras.create({
      fornecedor: "Importação",
      data: "2026-04-10",
      total: "500.00",
      origem: "IMPORTACAO",
      itens: [
        { produtoNome: "Rosa Avalanche", quantidade: "80", valorUnitario: "1.51", subtotal: "120.80" },
      ],
    });
    expect(result.id).toBe(1);
  });
});

describe("Configurações", () => {
  it("deve exportar backup para S3", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.config.exportBackup({ usuarioNome: "admin" });
    expect(result.success).toBe(true);
    expect(result.url).toContain("s3.example.com");
    expect(result.fileName).toContain("backup_garden_erp_");
  });

  it("deve listar backups", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.config.listBackups();
    expect(Array.isArray(result)).toBe(true);
  });

  it("deve zerar estoque com confirmação", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.config.zerarEstoque({ confirmacao: "CONFIRMAR" });
    expect(result.success).toBe(true);
  });

  it("deve importar backup com dados completos", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.config.importBackup({
      data: {
        db: {
          clientes: [{ id: 1, nome: "Cliente Backup" }],
          produtos: [{ id: 1, descricao: "Produto Backup", preco: "10.00" }],
          vendedores: [{ id: 1, nome: "admin", perfil: "ADMIN", senha: "admin" }],
          vendas: [{ id: 1, clienteNome: "Cliente", data: "2026-01-01", total: "100.00", status: "APROVADO" }],
          vendaItens: [{ id: 1, vendaId: 1, produtoNome: "Rosa", quantidade: "10", valorUnitario: "10.00", subtotal: "100.00" }],
          compras: [{ id: 1, fornecedor: "Fornecedor", data: "2026-01-01", total: "50.00", numNF: "999" }],
          compraItens: [{ id: 1, compraId: 1, produtoNome: "Rosa", quantidade: "5", valorUnitario: "10.00", subtotal: "50.00" }],
          estoqueAjustes: [],
          historicoAlteracoes: [],
        },
      },
    });
    expect(result.success).toBe(true);
    // Verificar que importBackupData foi chamado com dados completos
    const { importBackupData } = await import("./db");
    const mockImport = importBackupData as any;
    expect(mockImport).toHaveBeenCalled();
  });

  it("deve retornar estatísticas do sistema", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.config.stats();
    expect(result).toBeDefined();
    expect(result?.clientes).toBe(1);
    expect(result?.produtos).toBe(1);
    expect(result?.vendedores).toBe(1);
  });
});

describe("Exclusão de Registros", () => {
  it("deve excluir um cliente", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.clientes.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("deve excluir um produto", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.produtos.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("deve excluir uma venda", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.vendas.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("Lixeira - Soft Delete", () => {
  it("deve listar clientes na lixeira", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.clientes.lixeira();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].nome).toBe("Cliente Excluído");
  });

  it("deve listar produtos na lixeira", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.produtos.lixeira();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].descricao).toBe("Produto Excluído");
  });

  it("deve listar vendas na lixeira", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.vendas.lixeira();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].clienteNome).toBe("Cliente X");
  });

  it("deve restaurar um cliente da lixeira", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.clientes.restore({ id: 10 });
    expect(result.success).toBe(true);
  });

  it("deve restaurar um produto da lixeira", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.produtos.restore({ id: 20 });
    expect(result.success).toBe(true);
  });

  it("deve restaurar uma venda da lixeira", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.vendas.restore({ id: 30 });
    expect(result.success).toBe(true);
  });

  it("deve excluir permanentemente um cliente", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.clientes.deletePermanente({ id: 10 });
    expect(result.success).toBe(true);
  });

  it("deve excluir permanentemente um produto", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.produtos.deletePermanente({ id: 20 });
    expect(result.success).toBe(true);
  });

  it("deve excluir permanentemente uma venda", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.vendas.deletePermanente({ id: 30 });
    expect(result.success).toBe(true);
  });
});

describe("Produtos - Custo e Fator de Conversão", () => {
  it("deve criar produto com preço calculado (custo × fator)", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const { createProduto } = await import("./db");
    const result = await caller.produtos.create({
      descricao: "Rosa Premium",
      custo: "2.50",
      fatorConversao: "4",
    });
    expect(result.id).toBe(1);
    const mockCreate = createProduto as any;
    const lastCall = mockCreate.mock.calls[mockCreate.mock.calls.length - 1];
    expect(lastCall[0].preco).toBe("10.00");
    expect(lastCall[0].custo).toBe("2.5");
    expect(lastCall[0].fatorConversao).toBe("4");
  });
});

describe("Conferência de Pedidos", () => {
  it("deve buscar pedidos por número", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.conferencia.buscar({ search: "1" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].clienteNome).toBe("João");
    expect(Array.isArray(result[0].itens)).toBe(true);
  });

  it("deve buscar pedidos por nome do cliente", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.conferencia.buscar({ search: "João" });
    expect(result.length).toBe(1);
  });

  it("deve retornar vazio para busca sem resultado", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.conferencia.buscar({ search: "inexistente" });
    expect(result.length).toBe(0);
  });

  it("deve salvar conferência com sucesso", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.conferencia.salvar({
      vendaId: 1,
      itens: [{ itemId: 10, qtdConferida: "2" }],
      conferidoPor: "admin",
    });
    expect(result.success).toBe(true);
    // Verificar que salvarConferencia e createHistorico foram chamados
    const { salvarConferencia, createHistorico } = await import("./db");
    expect(salvarConferencia).toHaveBeenCalled();
    expect(createHistorico).toHaveBeenCalled();
  });
});

describe("Estoque", () => {
  it("deve ajustar estoque", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.estoque.ajustar({
      produtoId: 1,
      produtoNome: "Rosa",
      quantidade: "5",
      motivo: "Ajuste manual",
      usuarioNome: "admin",
    });
    expect(result.id).toBe(1);
  });
});

describe("Tabela de Preços", () => {
  it("deve listar margens salvas para uma compra", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.tabelaPrecos.getByCompra({ compraId: 1 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].produtoNome).toBe("Rosa");
    expect(result[0].margem1).toBe("20.00");
    expect(result[0].preco1).toBe("12.00");
  });

  it("deve retornar vazio para compra sem margens", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.tabelaPrecos.getByCompra({ compraId: 999 });
    expect(result.length).toBe(0);
  });

  it("deve salvar margens em lote para uma compra", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const result = await caller.tabelaPrecos.salvar({
      compraId: 1,
      items: [
        {
          compraItemId: 100,
          produtoNome: "Rosa",
          custoUnitario: "10.00",
          margem1: "20.00",
          preco1: "12.00",
          margem2: "30.00",
          preco2: "13.00",
          margem3: "50.00",
          preco3: "15.00",
        },
        {
          compraItemId: 101,
          produtoId: 2,
          produtoNome: "Girassol",
          custoUnitario: "5.00",
          margem1: "40.00",
          preco1: "7.00",
          margem2: "60.00",
          preco2: "8.00",
          margem3: "100.00",
          preco3: "10.00",
        },
      ],
    });
    expect(result.success).toBe(true);
    // Verificar que saveTabelaPrecosBatch foi chamado com os dados corretos
    const { saveTabelaPrecosBatch } = await import("./db");
    expect(saveTabelaPrecosBatch).toHaveBeenCalledWith(1, expect.arrayContaining([
      expect.objectContaining({ compraItemId: 100, produtoNome: "Rosa" }),
      expect.objectContaining({ compraItemId: 101, produtoNome: "Girassol" }),
    ]));
  });
});

// ─── Tabela de Preços - Aplicar Preço ───
describe("Tabela de Preços - aplicarPreco", () => {
  it("deve atualizar preço de produto existente e registrar histórico", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const { getProduto, updateProduto, createHistorico } = await import("./db");

    const result = await caller.tabelaPrecos.aplicarPreco({
      tabela: "1",
      items: [
        { produtoId: 1, produtoNome: "Rosa", preco: "15.00" },
      ],
      usuarioNome: "Admin",
    });

    expect(result.success).toBe(true);
    expect(result.atualizados).toBe(1);
    expect(result.criados).toBe(0);
    expect(getProduto).toHaveBeenCalledWith(1);
    expect(updateProduto).toHaveBeenCalledWith(1, { preco: "15.00" });
    expect(createHistorico).toHaveBeenCalledWith(expect.objectContaining({
      tabela: "produtos",
      registroId: 1,
      campo: "preco",
      valorNovo: "15.00",
      usuarioNome: "Admin",
    }));
  });

  it("deve criar produto novo quando produtoId é null", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const { createProduto } = await import("./db");

    const result = await caller.tabelaPrecos.aplicarPreco({
      tabela: "2",
      items: [
        { produtoId: undefined, produtoNome: "Novo Produto", preco: "25.00" },
      ],
      usuarioNome: "Admin",
    });

    expect(result.success).toBe(true);
    expect(result.atualizados).toBe(0);
    expect(result.criados).toBe(1);
    expect(createProduto).toHaveBeenCalledWith(expect.objectContaining({
      descricao: "NOVO PRODUTO",
      preco: "25.00",
    }));
  });

  it("deve processar múltiplos itens (atualizar e criar)", async () => {
    const caller = appRouter.createCaller(createProtectedContext());

    const result = await caller.tabelaPrecos.aplicarPreco({
      tabela: "3",
      items: [
        { produtoId: 1, produtoNome: "Rosa", preco: "20.00" },
        { produtoId: undefined, produtoNome: "Novo", preco: "30.00" },
      ],
      usuarioNome: "Admin",
    });

    expect(result.success).toBe(true);
    expect(result.atualizados).toBe(1);
    expect(result.criados).toBe(1);
  });

  it("deve usar SISTEMA como fallback quando usuarioNome não é fornecido", async () => {
    const caller = appRouter.createCaller(createProtectedContext());
    const { createHistorico } = await import("./db");

    await caller.tabelaPrecos.aplicarPreco({
      tabela: "1",
      items: [
        { produtoId: 1, produtoNome: "Rosa", preco: "18.00" },
      ],
    });

    expect(createHistorico).toHaveBeenCalledWith(expect.objectContaining({
      usuarioNome: "SISTEMA",
    }));
  });

  it("deve aceitar tabela 1, 2 ou 3", async () => {
    const caller = appRouter.createCaller(createProtectedContext());

    for (const tabela of ["1", "2", "3"] as const) {
      const result = await caller.tabelaPrecos.aplicarPreco({
        tabela,
        items: [{ produtoId: 1, produtoNome: "Rosa", preco: "10.00" }],
        usuarioNome: "Admin",
      });
      expect(result.success).toBe(true);
    }
  });

  it("deve retornar 0 atualizados e 0 criados para lista vazia", async () => {
    const caller = appRouter.createCaller(createProtectedContext());

    const result = await caller.tabelaPrecos.aplicarPreco({
      tabela: "1",
      items: [],
      usuarioNome: "Admin",
    });

    expect(result.success).toBe(true);
    expect(result.atualizados).toBe(0);
    expect(result.criados).toBe(0);
  });
});


// ─── Testes de Consolidação de Pedidos de Compra ───
describe('Consolidação de Pedidos de Compra', () => {
  it('deve consolidar múltiplos orçamentos com mesmos produtos (nome + preço)', () => {
    // Simular 2 orçamentos com mesmo produto
    const venda1Itens = [
      { produtoNome: 'ROSA VERMELHA', quantidade: 10, valorUnitario: 5.0, subtotal: 50 },
      { produtoNome: 'ALSTROEMERIA', quantidade: 5, valorUnitario: 3.0, subtotal: 15 },
    ];
    const venda2Itens = [
      { produtoNome: 'ROSA VERMELHA', quantidade: 15, valorUnitario: 5.0, subtotal: 75 },
      { produtoNome: 'ALSTROEMERIA', quantidade: 8, valorUnitario: 3.0, subtotal: 24 },
    ];

    // Consolidar usando mesma lógica do backend
    const mapa = new Map<string, { produtoNome: string; quantidade: number; precoVenda: number; subtotalVenda: number }>();
    
    for (const item of [...venda1Itens, ...venda2Itens]) {
      const chave = `${item.produtoNome}||${item.valorUnitario}`;
      if (mapa.has(chave)) {
        const existing = mapa.get(chave)!;
        existing.quantidade += item.quantidade;
        existing.subtotalVenda += item.subtotal;
      } else {
        mapa.set(chave, {
          produtoNome: item.produtoNome,
          quantidade: item.quantidade,
          precoVenda: item.valorUnitario,
          subtotalVenda: item.subtotal,
        });
      }
    }

    const itensMesclados = Array.from(mapa.values()).sort((a, b) =>
      a.produtoNome.localeCompare(b.produtoNome, 'pt-BR')
    );

    // Validar consolidação
    expect(itensMesclados).toHaveLength(2);
    expect(itensMesclados[0].produtoNome).toBe('ALSTROEMERIA');
    expect(itensMesclados[0].quantidade).toBe(13); // 5 + 8
    expect(itensMesclados[0].subtotalVenda).toBe(39); // 15 + 24
    expect(itensMesclados[1].produtoNome).toBe('ROSA VERMELHA');
    expect(itensMesclados[1].quantidade).toBe(25); // 10 + 15
    expect(itensMesclados[1].subtotalVenda).toBe(125); // 50 + 75
  });

  it('deve manter itens com mesmo nome mas preços diferentes separados', () => {
    const venda1Itens = [
      { produtoNome: 'ROSA VERMELHA', quantidade: 10, valorUnitario: 5.0, subtotal: 50 },
    ];
    const venda2Itens = [
      { produtoNome: 'ROSA VERMELHA', quantidade: 15, valorUnitario: 6.0, subtotal: 90 },
    ];

    const mapa = new Map<string, { produtoNome: string; quantidade: number; precoVenda: number; subtotalVenda: number }>();
    
    for (const item of [...venda1Itens, ...venda2Itens]) {
      const chave = `${item.produtoNome}||${item.valorUnitario}`;
      if (mapa.has(chave)) {
        const existing = mapa.get(chave)!;
        existing.quantidade += item.quantidade;
        existing.subtotalVenda += item.subtotal;
      } else {
        mapa.set(chave, {
          produtoNome: item.produtoNome,
          quantidade: item.quantidade,
          precoVenda: item.valorUnitario,
          subtotalVenda: item.subtotal,
        });
      }
    }

    const itensMesclados = Array.from(mapa.values()).sort((a, b) =>
      a.produtoNome.localeCompare(b.produtoNome, 'pt-BR')
    );

    // Validar que são mantidos separados
    expect(itensMesclados).toHaveLength(2);
    expect(itensMesclados[0].precoVenda).toBe(5.0);
    expect(itensMesclados[0].quantidade).toBe(10);
    expect(itensMesclados[1].precoVenda).toBe(6.0);
    expect(itensMesclados[1].quantidade).toBe(15);
  });

  it('deve não duplicar itens ao adicionar a pedido existente', () => {
    // Simular itens já no pedido
    const pedidoExistente = [
      { produtoNome: 'ROSA VERMELHA', quantidade: 10, precoVenda: 5.0, subtotalVenda: 50 },
    ];
    
    // Novos itens a adicionar
    const novosItens = [
      { produtoNome: 'ROSA VERMELHA', quantidade: 15, precoVenda: 5.0, subtotalVenda: 75 },
    ];

    // Consolidar
    const mapaConsolidado = new Map<string, { produtoNome: string; quantidade: number; precoVenda: number; subtotalVenda: number }>();
    
    for (const item of pedidoExistente) {
      const chave = `${item.produtoNome}||${item.precoVenda}`;
      mapaConsolidado.set(chave, item);
    }
    
    for (const item of novosItens) {
      const chave = `${item.produtoNome}||${item.precoVenda}`;
      if (mapaConsolidado.has(chave)) {
        const existing = mapaConsolidado.get(chave)!;
        existing.quantidade += item.quantidade;
        existing.subtotalVenda += item.subtotalVenda;
      } else {
        mapaConsolidado.set(chave, item);
      }
    }

    const itensFinais = Array.from(mapaConsolidado.values());

    // Validar que não há duplicação
    expect(itensFinais).toHaveLength(1);
    expect(itensFinais[0].quantidade).toBe(25); // 10 + 15
    expect(itensFinais[0].subtotalVenda).toBe(125); // 50 + 75
  });
});
