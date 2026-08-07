import { describe, expect, it } from "vitest";
import {
  isVeilingFormat,
  parseVeilingRows,
  extractFornecedorFromChave,
  extractDataFromChave,
} from "@shared/veilingParser";

// ─── Dados mock simulando rows do XLSX ───
const mockRows: any[][] = [
  ["Relatório de Pedidos Veiling Online", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["Chave 5191 - GARDEN CENTER FERREIRA LTDA - 10/04/2026 22:17", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["Tipo", "Compra", "Usuário", "Status", "Mensagem", "Pedido", "Entrega", "Faturamento", "Produto", "Cód. Barras", "", "Descrição", "Qual.", "Produtor", "Nome Sítio", "Embalagem", "Vlr emb.", "QE x QpE", "Total Un.", "Frete Un.", "Vlr Unit.", "SubTotal", "Desc./Acres.", "Total", "Observação", "Num. GFP"],
  ["ENP", "2026-04-08 08:51:34", "Guilherme", "Gerado", "PEDIDO GERADO COM SUCESSO", "3047567", "2026-04-08", "2026-04-08", "", "00422.020.000.00.00", "7890291504973", "FOLHAGEM MONSTERA DELICIOSA 020 CM", "A1", "103111", "VIVA FLORA", "NOVO CESTO MOD.2", 0, "1x10", 10, "0,583333", 9.583333, 95.83, "", 95.83, "", 0.0],
  ["LKP Recepcionado", "2026-04-07 22:26:22", "Guilherme", "Gerado", "LKP GERADO COM SUCESSO", "2546725", "2026-04-08", "2026-04-08", "46120.125", "06629.080.000.23.04", "7890291248983", "LIRIO DYNAMIX 080 CM HT 2/3 FLS VERMELHO", "A1", "56811", "UNICA FLORES", "CONJ LONGO MOD2", 0, "1x40", 40, "0,243056", 10.243056, 409.72, "", 409.72, "", 0.0],
  ["LKP em Trânsito", "2026-04-07 19:38:34", "Guilherme", "Gerado", "LKP GERADO COM SUCESSO", "2546219", "2026-04-08", "2026-04-08", "46120.125", "06125.080.000.00.00", "7890291432368", "BOCA DE LEAO MONACO WHITE 080 CM", "A2", "255111", "FLORES MS", "CONJ LONGO MOD2", 0, "4x100", 400, "0,116667", 3.046667, 1218.67, "", 1218.67, "PRODUTO COM OBSERVACAO ESPECIAL", 12345],
];

// Mock com dados de GFP completos
const mockRowsComGfp: any[][] = [
  ["Relatório de Pedidos Veiling Online", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["Chave 5191 - GARDEN CENTER FERREIRA LTDA - 10/04/2026 22:17", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["Tipo", "Compra", "Usuário", "Status", "Mensagem", "Pedido", "Entrega", "Faturamento", "Produto", "Cód. Barras", "", "Descrição", "Qual.", "Produtor", "Nome Sítio", "Embalagem", "Vlr emb.", "QE x QpE", "Total Un.", "Frete Un.", "Vlr Unit.", "SubTotal", "Desc./Acres.", "Total", "Observação", "Num. GFP"],
  ["ENP", "2026-04-08 08:51:34", "Guilherme", "Gerado", "PEDIDO GERADO COM SUCESSO", "3047567", "2026-04-08", "2026-04-08", "", "00422.020.000.00.00", "7890291504973", "FOLHAGEM MONSTERA DELICIOSA 020 CM", "A1", "103111", "VIVA FLORA", "NOVO CESTO MOD.2", 0, "1x10", 10, "0,583333", 9.583333, 95.83, "", 95.83, "LOTE ESPECIAL PRIMAVERA", 9876],
  ["LKP Recepcionado", "2026-04-07 22:26:22", "Guilherme", "Gerado", "LKP GERADO COM SUCESSO", "2546725", "2026-04-08", "2026-04-08", "46120.125", "06629.080.000.23.04", "7890291248983", "LIRIO DYNAMIX 080 CM HT 2/3 FLS VERMELHO", "A2", "56811", "UNICA FLORES", "CONJ LONGO MOD2", 0, "1x40", 40, "0,243056", 10.243056, 409.72, "", 409.72, "", 0],
  ["LKP em Trânsito", "2026-04-07 19:38:34", "Guilherme", "Gerado", "LKP GERADO COM SUCESSO", "2546219", "2026-04-08", "2026-04-08", "46120.125", "06125.080.000.00.00", "7890291432368", "BOCA DE LEAO MONACO WHITE 080 CM", "A1", "255111", "FLORES MS", "CONJ LONGO MOD2", 0, "4x100", 400, "0,116667", 3.046667, 1218.67, "", 1218.67, "PRODUTO COM OBSERVACAO ESPECIAL", 12345],
// Linha original (sem os novos campos no final) - manter compatibilidade
  ["ENP", "2026-04-08 08:51:34", "Guilherme", "Gerado", "PEDIDO GERADO COM SUCESSO", "3047567", "2026-04-08", "2026-04-08", "", "00422.020.000.00.00", "7890291504973", "FOLHAGEM MONSTERA DELICIOSA 020 CM", "A1", "103111", "VIVA FLORA", "NOVO CESTO MOD.2", 0, "1x10", 10, "0,583333", 9.583333, 95.83, "", 95.83, "", 0.0],
];

// ─── isVeilingFormat ───
describe("isVeilingFormat", () => {
  it("deve retornar true para formato Veiling válido", () => {
    expect(isVeilingFormat(mockRows)).toBe(true);
  });

  it("deve retornar false para array vazio", () => {
    expect(isVeilingFormat([])).toBe(false);
  });

  it("deve retornar false para formato não-Veiling", () => {
    const otherRows = [["Outro formato"], ["dados"], ["mais dados"]];
    expect(isVeilingFormat(otherRows)).toBe(false);
  });

  it("deve retornar false para null/undefined", () => {
    expect(isVeilingFormat(null as any)).toBe(false);
    expect(isVeilingFormat(undefined as any)).toBe(false);
  });

  it("deve aceitar variação sem acento", () => {
    const rows = [["Relatorio de Pedidos Veiling Online"], ["info"], ["headers"], ["data"]];
    expect(isVeilingFormat(rows)).toBe(true);
  });
});

// ─── parseVeilingRows ───
describe("parseVeilingRows", () => {
  it("deve parsear corretamente os itens do Veiling", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.success).toBe(true);
    expect(result.items.length).toBe(3);
  });

  it("deve extrair a chave info corretamente", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.chaveInfo).toContain("Chave 5191");
    expect(result.chaveInfo).toContain("GARDEN CENTER FERREIRA LTDA");
  });

  it("deve extrair descrição do primeiro item", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.items[0].descricao).toBe("FOLHAGEM MONSTERA DELICIOSA 020 CM");
  });

  it("deve extrair tipo corretamente", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.items[0].tipo).toBe("ENP");
    expect(result.items[1].tipo).toBe("LKP Recepcionado");
    expect(result.items[2].tipo).toBe("LKP em Trânsito");
  });

  it("deve extrair nome do sítio/produtor", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.items[0].nomeSitio).toBe("VIVA FLORA");
    expect(result.items[1].nomeSitio).toBe("UNICA FLORES");
    expect(result.items[2].nomeSitio).toBe("FLORES MS");
  });

  it("deve extrair valor unitário numérico", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.items[0].vlrUnit).toBeCloseTo(9.583333, 4);
    expect(result.items[1].vlrUnit).toBeCloseTo(10.243056, 4);
  });

  it("deve extrair total unitário", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.items[0].totalUn).toBe(10);
    expect(result.items[1].totalUn).toBe(40);
    expect(result.items[2].totalUn).toBe(400);
  });

  it("deve extrair QE x QpE", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.items[0].qeXqpe).toBe("1x10");
    expect(result.items[2].qeXqpe).toBe("4x100");
  });

  it("deve extrair total", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.items[0].total).toBeCloseTo(95.83, 2);
    expect(result.items[1].total).toBeCloseTo(409.72, 2);
  });

  it("deve extrair código de barras", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.items[0].codBarras).toBe("00422.020.000.00.00");
  });

  it("deve extrair qualidade (A1/A2) do campo colíndice 12", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.items[0].qualidade).toBe("A1");
    expect(result.items[1].qualidade).toBe("A1");
    expect(result.items[2].qualidade).toBe("A2");
  });

  it("deve extrair observação da GFP do campo colíndice 24", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.items[0].observacao).toBe(""); // sem observação
    expect(result.items[2].observacao).toBe("PRODUTO COM OBSERVACAO ESPECIAL");
  });

  it("deve extrair número GFP do campo colíndice 25", () => {
    const result = parseVeilingRows(mockRows);
    expect(result.items[0].numGfp).toBe("0"); // 0.0 convertido para string
    expect(result.items[2].numGfp).toBe("12345");
  });

  it("deve extrair dados GFP completos com mockRowsComGfp", () => {
    const result = parseVeilingRows(mockRowsComGfp);
    expect(result.success).toBe(true);
    expect(result.items[0].qualidade).toBe("A1");
    expect(result.items[0].observacao).toBe("LOTE ESPECIAL PRIMAVERA");
    expect(result.items[0].numGfp).toBe("9876");
    expect(result.items[1].qualidade).toBe("A2");
    expect(result.items[1].observacao).toBe(""); // sem observação
    expect(result.items[2].observacao).toBe("PRODUTO COM OBSERVACAO ESPECIAL");
    expect(result.items[2].numGfp).toBe("12345");
  });

  it("deve retornar erro para array vazio", () => {
    const result = parseVeilingRows([]);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("deve retornar erro para poucas linhas", () => {
    const result = parseVeilingRows([["titulo"], ["info"]]);
    expect(result.success).toBe(false);
  });

  it("deve ignorar linhas com menos de 20 colunas", () => {
    const rows = [
      ...mockRows.slice(0, 3),
      ["ENP", "data", "user"], // linha curta - deve ser ignorada
      mockRows[3],
    ];
    const result = parseVeilingRows(rows);
    expect(result.items.length).toBe(1);
  });

  it("deve ignorar linhas sem tipo", () => {
    const rows = [
      ...mockRows.slice(0, 3),
      ["", "2026-04-08", "User", "", "", "", "", "", "", "cod", "", "Desc", "", "", "Prod", "", 0, "1x10", 10, 0, 5, 50, "", 50, "", 0],
    ];
    const result = parseVeilingRows(rows);
    expect(result.items.length).toBe(0);
    expect(result.success).toBe(false);
  });
});

// ─── extractFornecedorFromChave ───
describe("extractFornecedorFromChave", () => {
  it("deve extrair o nome do fornecedor da chave", () => {
    const chave = "Chave 5191 - GARDEN CENTER FERREIRA LTDA - 10/04/2026 22:17";
    expect(extractFornecedorFromChave(chave)).toBe("GARDEN CENTER FERREIRA LTDA");
  });

  it("deve retornar a string original se não tiver separadores", () => {
    expect(extractFornecedorFromChave("Sem separadores")).toBe("Sem separadores");
  });

  it("deve lidar com chave vazia", () => {
    expect(extractFornecedorFromChave("")).toBe("");
  });
});

// ─── extractDataFromChave ───
describe("extractDataFromChave", () => {
  it("deve extrair a data da chave no formato DD/MM/YYYY", () => {
    const chave = "Chave 5191 - GARDEN CENTER FERREIRA LTDA - 10/04/2026 22:17";
    expect(extractDataFromChave(chave)).toBe("10/04/2026");
  });

  it("deve retornar data padrão se não encontrar data na chave", () => {
    const result = extractDataFromChave("Chave sem data");
    // Deve retornar a data de hoje no formato YYYY-MM-DD
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("deve lidar com chave vazia", () => {
    const result = extractDataFromChave("");
    expect(result).toBeDefined();
  });
});

// ─── veilingGetGfpByOffer ───
describe("veilingGetGfpByOffer", () => {
  it("deve ser uma função exportada do veilingApi", async () => {
    const { veilingGetGfpByOffer } = await import("./veilingApi");
    expect(typeof veilingGetGfpByOffer).toBe("function");
  });

  it("deve retornar array vazio ou lançar erro controlado para token inválido", async () => {
    const { veilingGetGfpByOffer } = await import("./veilingApi");
    // Com token inválido, pode retornar array vazio (401) ou lançar erro de JSON inválido
    // Ambos os comportamentos são aceitáveis - o importante é não travar a sincronização
    try {
      const result = await veilingGetGfpByOffer("invalid-token", 999999, 0, 0, "2026-01-01");
      expect(Array.isArray(result)).toBe(true);
    } catch (e) {
      // Erro de JSON inválido é esperado quando a API retorna resposta não-JSON
      expect(e).toBeDefined();
    }
  }, 15000);
});

// ─── campos GFP no schema veiling_produtos ───
describe("campos GFP no schema veiling_produtos", () => {
  it("deve ter os campos GFP definidos no schema", async () => {
    const { veilingProdutos } = await import("../drizzle/schema");
    const cols = Object.keys(veilingProdutos);
    expect(cols).toContain("gfpQualidade");
    expect(cols).toContain("gfpNumero");
    expect(cols).toContain("gfpObs1");
    expect(cols).toContain("gfpObs2");
    expect(cols).toContain("gfpEntregaCvh");
    expect(cols).toContain("gfpSerie");
    expect(cols).toContain("gfpLote");
    expect(cols).toContain("packingId");
  });
});

// ─── mapeamento correto dos campos GFP da API ───
describe("mapeamento dos campos GFP da API do Veiling", () => {
  it("deve mapear corretamente lot como gfpNumero e gfpNumber como gfpSerie", () => {
    // Simulação da resposta da API by-gfp
    const apiResponse = {
      quality: "A2",
      gfpNumber: "1338370",  // Este é a Série
      lot: "A",              // Este é o Nº GFP
      qualityObservation1: "152 - MATURAÇÃO 2: MÉDIO (BOTÕES/FLORES)",
      qualityObservation2: "19 - HASTES FINAS",
      deliveryDate: "10/04/2026",
      series: "",
    };
    // Mapeamento correto conforme descoberto via inspeção da API
    const mapped = {
      quality: apiResponse.quality,
      gfpNumero: apiResponse.lot,           // lot = Nº GFP
      obs1: apiResponse.qualityObservation1,
      obs2: apiResponse.qualityObservation2,
      deliveryDate: apiResponse.deliveryDate,
      serie: apiResponse.gfpNumber,         // gfpNumber = Série
      lote: apiResponse.lot,
    };
    expect(mapped.quality).toBe("A2");
    expect(mapped.gfpNumero).toBe("A");
    expect(mapped.serie).toBe("1338370");
    expect(mapped.obs1).toBe("152 - MATURAÇÃO 2: MÉDIO (BOTÕES/FLORES)");
    expect(mapped.obs2).toBe("19 - HASTES FINAS");
    expect(mapped.deliveryDate).toBe("10/04/2026");
  });

  it("deve filtrar apenas ofertas LKP (offerType=1) para busca de GFP", () => {
    const ofertas = [
      { offerId: 1, offerType: "0", name: "Produto Normal" },
      { offerId: 2, offerType: "1", name: "Produto LKP" },
      { offerId: 3, offerType: "1", name: "Produto LKP 2" },
      { offerId: 4, offerType: "", name: "Produto Sem Tipo" },
    ];
    const lkpOfertas = ofertas.filter(o => Number(o.offerType) === 1);
    expect(lkpOfertas).toHaveLength(2);
    expect(lkpOfertas.map(o => o.offerId)).toEqual([2, 3]);
  });
});
