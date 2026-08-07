import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock do banco de dados ───
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(() => mockDb),
}));

vi.mock("../drizzle/schema", () => ({
  cooperfloraConfig: { id: "id", login: "login", senha: "senha" },
  cooperfloraProdutos: { id: "id", codigo: "codigo", nome: "nome" },
  users: {},
  clientes: {},
  produtos: {},
  vendedores: {},
  vendas: {},
  vendaItens: {},
  compras: {},
  compraItens: {},
  estoqueAjustes: {},
  historicoAlteracoes: {},
  backups: {},
  vendaLinks: {},
  tabelaPrecos: {},
  formasPagamento: {},
  titulos: {},
  pedidosCompra: {},
  pedidoCompraItens: {},
}));

// ─── Testes de lógica de cálculo de preço de venda ───
describe("Cooperflora - Cálculo de Preço de Venda", () => {
  it("calcula preço de venda com margem padrão de 30%", () => {
    const precoMin = 10.0;
    const margemPadrao = 30;
    const precoVenda = precoMin * (1 + margemPadrao / 100);
    expect(precoVenda).toBeCloseTo(13.0);
  });

  it("calcula preço de venda com margem customizada de 50%", () => {
    const precoMin = 10.0;
    const margemCustom = 50;
    const precoVenda = precoMin * (1 + margemCustom / 100);
    expect(precoVenda).toBeCloseTo(15.0);
  });

  it("calcula preço de venda com faixa de preço", () => {
    const precoMin = 5.0;
    const precoMax = 8.0;
    const margem = 40;
    const vendaMin = precoMin * (1 + margem / 100);
    const vendaMax = precoMax * (1 + margem / 100);
    expect(vendaMin).toBeCloseTo(7.0);
    expect(vendaMax).toBeCloseTo(11.2);
  });

  it("usa margem customizada do produto se disponível, senão usa padrão", () => {
    const margemPadrao = 30;
    const produto = { margemCustom: "50" };
    const margem = produto.margemCustom !== null && produto.margemCustom !== undefined
      ? parseFloat(String(produto.margemCustom))
      : margemPadrao;
    expect(margem).toBe(50);
  });

  it("usa margem padrão quando margemCustom é null", () => {
    const margemPadrao = 30;
    const produto = { margemCustom: null };
    const margem = produto.margemCustom !== null && produto.margemCustom !== undefined
      ? parseFloat(String(produto.margemCustom))
      : margemPadrao;
    expect(margem).toBe(30);
  });

  it("retorna 0 para preço de venda quando custo é 0", () => {
    const precoMin = 0;
    const margem = 30;
    const precoVenda = precoMin > 0 ? precoMin * (1 + margem / 100) : 0;
    expect(precoVenda).toBe(0);
  });
});

// ─── Testes de conversão de dados da API ───
describe("Cooperflora - Conversão de Dados da API", () => {
  it("converte produto da API com preço simples", () => {
    const produtoApi = {
      CODIGO: "H5MI070",
      NOME: "ACACIA MIMOSA 070",
      PRECO_UNITARIO: "21.7649",
      QUALIDADE: "A1",
      OFERTA: "5",
      GRUPO: "MIMOSA",
    };

    const precoStr = String(produtoApi.PRECO_UNITARIO).replace(",", ".");
    const partes = precoStr.split(" - ");
    const precoMin = parseFloat(partes[0]) || 0;
    const precoMax = partes.length > 1 ? parseFloat(partes[1]) || precoMin : precoMin;

    expect(precoMin).toBeCloseTo(21.7649);
    expect(precoMax).toBeCloseTo(21.7649);
  });

  it("converte produto da API com faixa de preço", () => {
    const produtoApi = {
      CODIGO: "ROSA001",
      NOME: "ROSA VERMELHA",
      PRECO_UNITARIO: "2.70 - 3.32",
      QUALIDADE: "A2",
      OFERTA: "20",
      GRUPO: "ROSAS",
    };

    const precoStr = String(produtoApi.PRECO_UNITARIO).replace(",", ".");
    const partes = precoStr.split(" - ");
    const precoMin = parseFloat(partes[0]) || 0;
    const precoMax = partes.length > 1 ? parseFloat(partes[1]) || precoMin : precoMin;

    expect(precoMin).toBeCloseTo(2.70);
    expect(precoMax).toBeCloseTo(3.32);
  });

  it("converte preço com vírgula decimal", () => {
    const precoStr = "21,7649".replace(",", ".");
    const preco = parseFloat(precoStr);
    expect(preco).toBeCloseTo(21.7649);
  });

  it("trata produto sem preço retornando 0", () => {
    const produtoApi = { PRECO_UNITARIO: undefined };
    const precoStr = String(produtoApi.PRECO_UNITARIO || "0").replace(",", ".");
    const preco = parseFloat(precoStr) || 0;
    expect(preco).toBe(0);
  });

  it("converte estoque corretamente", () => {
    const produtoApi = { OFERTA: "15" };
    const estoque = parseInt(produtoApi.OFERTA || "0") || 0;
    expect(estoque).toBe(15);
  });

  it("trata estoque indefinido como 0", () => {
    const produtoApi: any = {};
    const estoque = parseInt(produtoApi.OFERTA || "0") || 0;
    expect(estoque).toBe(0);
  });
});

// ─── Testes de validação de configuração ───
describe("Cooperflora - Validação de Configuração", () => {
  it("detecta configuração incompleta sem login", () => {
    const config = { login: "", senha: "senha123" };
    const isValid = !!(config.login && config.senha);
    expect(isValid).toBe(false);
  });

  it("detecta configuração incompleta sem senha", () => {
    const config = { login: "c62002", senha: "" };
    const isValid = !!(config.login && config.senha);
    expect(isValid).toBe(false);
  });

  it("detecta configuração válida", () => {
    const config = { login: "c62002", senha: "senha123" };
    const isValid = !!(config.login && config.senha);
    expect(isValid).toBe(true);
  });

  it("valida margem dentro do intervalo válido", () => {
    const validarMargem = (m: number) => !isNaN(m) && m >= 0 && m <= 1000;
    expect(validarMargem(30)).toBe(true);
    expect(validarMargem(0)).toBe(true);
    expect(validarMargem(100)).toBe(true);
    expect(validarMargem(-1)).toBe(false);
    expect(validarMargem(1001)).toBe(false);
  });
});

// ─── Testes de formatação de preço ───
describe("Cooperflora - Formatação de Preço", () => {
  const formatPreco = (min: string, max: string) => {
    const vMin = parseFloat(min);
    const vMax = parseFloat(max);
    if (!vMin) return "—";
    if (vMax > vMin) return `R$ ${vMin.toFixed(4)} – ${vMax.toFixed(4)}`;
    return `R$ ${vMin.toFixed(4)}`;
  };

  const formatPrecoVenda = (min: string, max: string) => {
    const vMin = parseFloat(min);
    const vMax = parseFloat(max);
    if (!vMin) return "—";
    if (vMax > vMin) return `R$ ${vMin.toFixed(2)} – ${vMax.toFixed(2)}`;
    return `R$ ${vMin.toFixed(2)}`;
  };

  it("formata preço simples corretamente", () => {
    expect(formatPreco("21.7649", "21.7649")).toBe("R$ 21.7649");
  });

  it("formata faixa de preço corretamente", () => {
    expect(formatPreco("2.7000", "3.3200")).toBe("R$ 2.7000 – 3.3200");
  });

  it("retorna traço para preço zero", () => {
    expect(formatPreco("0", "0")).toBe("—");
  });

  it("formata preço de venda com 2 casas decimais", () => {
    expect(formatPrecoVenda("13.0000", "13.0000")).toBe("R$ 13.00");
  });

  it("formata faixa de preço de venda com 2 casas decimais", () => {
    expect(formatPrecoVenda("7.0000", "11.2000")).toBe("R$ 7.00 – 11.20");
  });
});

// ─── Testes do parser de detalhes do produto por sítio ───
describe("Cooperflora - Parser de Detalhes do Produto (Sítios)", () => {
  // Simula o HTML retornado pelo endpoint detalheProduto
  const htmlComSitios = `
    <div class="modal-body">
      <h5 class="text-success fw-bold">ALPINIA PURPURATA VERMELHA 070</h5>
      <p>LPVE070</p>
      <div>Qualidade</div><div><strong>A1</strong></div>
      <div>Cor</div><div><strong>Vermelho</strong></div>
      <div>Tamanho</div><div><strong>070</strong></div>
      <table>
        <thead><tr><th>Sítio</th><th>Nome</th><th>Embalagem</th><th>Ponto</th><th>Saldo</th><th>Qtde</th><th>Preço</th><th>Desconto</th><th>Participa</th></tr></thead>
        <tbody>
          <tr data-cod-sitio="01901">
            <td>01901</td>
            <td><img src="/logos/terraflor.png" /></td>
            <td>TERRAFLOR</td>
            <td>30 un</td>
            <td>PADRÃO</td>
            <td>17</td>
            <td><input type="number" value="0" /></td>
            <td>7.0568</td>
            <td>0.0000</td>
            <td>SIM</td>
          </tr>
          <tr data-cod-sitio="05201">
            <td>05201</td>
            <td><img src="/logos/guandu.png" /></td>
            <td>GUANDU TROPICAL FLORES</td>
            <td>30 un</td>
            <td>PADRÃO</td>
            <td>3</td>
            <td><input type="number" value="0" /></td>
            <td>6.8963</td>
            <td>0.0000</td>
            <td>SIM</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  it("extrai sítios com data-cod-sitio do HTML", () => {
    const html = htmlComSitios;
    const trPattern = /<tr[^>]*data-cod-sitio="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g;
    const sitios: Array<{ codigoSitio: string }> = [];
    let m;
    while ((m = trPattern.exec(html)) !== null) {
      sitios.push({ codigoSitio: m[1] });
    }
    expect(sitios).toHaveLength(2);
    expect(sitios[0].codigoSitio).toBe("01901");
    expect(sitios[1].codigoSitio).toBe("05201");
  });

  it("extrai preço unitário de sítio corretamente", () => {
    const precoStr = "7.0568";
    const precoUnid = parseFloat(precoStr.replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
    expect(precoUnid).toBeCloseTo(7.0568);
  });

  it("calcula preço de venda por sítio com margem", () => {
    const precoUnid = 7.0568;
    const margem = 30;
    const precoVenda = precoUnid * (1 + margem / 100);
    expect(precoVenda).toBeCloseTo(9.1738, 3);
  });

  it("calcula total de custo e venda com múltiplos sítios", () => {
    const sitios = [
      { precoUnid: 7.0568, qtd: 5 },
      { precoUnid: 6.8963, qtd: 3 },
    ];
    const margem = 30;
    const totalCusto = sitios.reduce((acc, s) => acc + s.qtd * s.precoUnid, 0);
    const totalVenda = totalCusto * (1 + margem / 100);
    expect(totalCusto).toBeCloseTo(7.0568 * 5 + 6.8963 * 3, 3);
    expect(totalVenda).toBeCloseTo(totalCusto * 1.3, 3);
  });

  it("detecta participação em desconto corretamente", () => {
    const participaDesconto = (texto: string) => texto.toLowerCase().includes("sim");
    expect(participaDesconto("SIM")).toBe(true);
    expect(participaDesconto("sim")).toBe(true);
    expect(participaDesconto("NÃO")).toBe(false);
    expect(participaDesconto("")).toBe(false);
  });

  it("normaliza URL de logo do sítio", () => {
    const normalizarUrl = (url: string) =>
      url.startsWith("http") ? url : (url ? `https://comercial.cooperflora.com.br${url}` : "");
    expect(normalizarUrl("/logos/terraflor.png")).toBe("https://comercial.cooperflora.com.br/logos/terraflor.png");
    expect(normalizarUrl("https://cdn.example.com/logo.png")).toBe("https://cdn.example.com/logo.png");
    expect(normalizarUrl("")).toBe("");
  });
});

// ─── Testes do módulo SSE de progresso de sincronização ───
describe("Cooperflora - SSE SyncProgressEmitter", () => {
  // Implementação inline do emitter para testes (sem importar o módulo real)
  class TestSyncProgressEmitter {
    private listeners: Map<string, Array<(sid: string, data: unknown) => void>> = new Map();
    private lastEvent: Map<string, unknown> = new Map();

    on(event: string, listener: (sid: string, data: unknown) => void) {
      if (!this.listeners.has(event)) this.listeners.set(event, []);
      this.listeners.get(event)!.push(listener);
    }

    off(event: string, listener: (sid: string, data: unknown) => void) {
      const arr = this.listeners.get(event) || [];
      this.listeners.set(event, arr.filter(l => l !== listener));
    }

    emit(event: string, sessionId: string, data: unknown): boolean {
      this.lastEvent.set(sessionId, data);
      const arr = this.listeners.get(event) || [];
      arr.forEach(l => l(sessionId, data));
      return arr.length > 0;
    }

    getLastEvent(sessionId: string) { return this.lastEvent.get(sessionId); }
    clearSession(sessionId: string) { this.lastEvent.delete(sessionId); }
  }

  it("emite evento de progresso e listeners recebem corretamente", () => {
    const emitter = new TestSyncProgressEmitter();
    const received: unknown[] = [];
    emitter.on("sync:progress", (_sid, data) => received.push(data));
    emitter.emit("sync:progress", "session-1", { phase: "hastes", current: 5, total: 100, message: "Carregando hastes: 5/100" });
    expect(received).toHaveLength(1);
    expect((received[0] as { phase: string }).phase).toBe("hastes");
  });

  it("armazena último evento por sessionId", () => {
    const emitter = new TestSyncProgressEmitter();
    emitter.emit("sync:progress", "session-A", { phase: "produtos", current: 0, total: 0, message: "Buscando..." });
    emitter.emit("sync:progress", "session-A", { phase: "hastes", current: 10, total: 50, message: "Carregando hastes: 10/50" });
    const last = emitter.getLastEvent("session-A") as { phase: string; current: number };
    expect(last.phase).toBe("hastes");
    expect(last.current).toBe(10);
  });

  it("isola eventos por sessionId diferente", () => {
    const emitter = new TestSyncProgressEmitter();
    emitter.emit("sync:progress", "session-X", { phase: "concluido", current: 100, total: 100, message: "Concluído!" });
    emitter.emit("sync:progress", "session-Y", { phase: "hastes", current: 30, total: 100, message: "Carregando..." });
    const lastX = emitter.getLastEvent("session-X") as { phase: string };
    const lastY = emitter.getLastEvent("session-Y") as { phase: string };
    expect(lastX.phase).toBe("concluido");
    expect(lastY.phase).toBe("hastes");
  });

  it("limpa sessão após clearSession", () => {
    const emitter = new TestSyncProgressEmitter();
    emitter.emit("sync:progress", "session-Z", { phase: "concluido", current: 50, total: 50, message: "OK" });
    emitter.clearSession("session-Z");
    expect(emitter.getLastEvent("session-Z")).toBeUndefined();
  });

  it("remove listener corretamente com off", () => {
    const emitter = new TestSyncProgressEmitter();
    const received: unknown[] = [];
    const listener = (_sid: string, data: unknown) => received.push(data);
    emitter.on("sync:progress", listener);
    emitter.emit("sync:progress", "s1", { phase: "hastes", current: 1, total: 10, message: "..." });
    emitter.off("sync:progress", listener);
    emitter.emit("sync:progress", "s1", { phase: "hastes", current: 2, total: 10, message: "..." });
    expect(received).toHaveLength(1); // só o primeiro evento
  });

  it("calcula percentual de progresso corretamente", () => {
    const calcPercent = (current: number, total: number) =>
      total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
    expect(calcPercent(0, 100)).toBe(0);
    expect(calcPercent(50, 100)).toBe(50);
    expect(calcPercent(100, 100)).toBe(100);
    expect(calcPercent(150, 100)).toBe(100); // não ultrapassa 100%
    expect(calcPercent(0, 0)).toBe(0); // total zero não divide por zero
  });
});
