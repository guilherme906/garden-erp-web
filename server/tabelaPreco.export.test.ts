import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  buildPdfRows,
  buildExcelData,
  calcPreco,
  calcMargem,
  TABLE_HEADERS,
} from "@shared/exportTabelaPreco";
import type { MargemExportItem, CompraExportInfo } from "@shared/exportTabelaPreco";

// ─── Dados de teste ───
const mockMargens: MargemExportItem[] = [
  {
    produtoNome: "Rosa Vermelha",
    custoUnitario: "10.00",
    margem1: "20.00",
    preco1: "12.00",
    margem2: "30.00",
    preco2: "13.00",
    margem3: "50.00",
    preco3: "15.00",
  },
  {
    produtoNome: "Girassol",
    custoUnitario: "5.00",
    margem1: "40.00",
    preco1: "7.00",
    margem2: "60.00",
    preco2: "8.00",
    margem3: "100.00",
    preco3: "10.00",
  },
];

const mockInfo: CompraExportInfo = {
  id: 1,
  tipo: "Entrada NF",
  fornecedor: "Fornecedor Teste",
  nf: "12345",
  data: "2026-04-10",
};

// ─── buildPdfRows ───
describe("buildPdfRows", () => {
  it("deve gerar linhas formatadas corretamente para o PDF", () => {
    const rows = buildPdfRows(mockMargens);
    expect(rows.length).toBe(2);
    expect(rows[0][0]).toBe("Rosa Vermelha");
    expect(rows[0][1]).toBe("R$ 10.00");
    expect(rows[0][2]).toBe("20.00%");
    expect(rows[0][3]).toBe("R$ 12.00");
    expect(rows[0][4]).toBe("30.00%");
    expect(rows[0][5]).toBe("R$ 13.00");
    expect(rows[0][6]).toBe("50.00%");
    expect(rows[0][7]).toBe("R$ 15.00");
  });

  it("deve formatar segundo produto corretamente", () => {
    const rows = buildPdfRows(mockMargens);
    expect(rows[1][0]).toBe("Girassol");
    expect(rows[1][1]).toBe("R$ 5.00");
    expect(rows[1][6]).toBe("100.00%");
    expect(rows[1][7]).toBe("R$ 10.00");
  });

  it("deve retornar array vazio para lista vazia", () => {
    const rows = buildPdfRows([]);
    expect(rows).toEqual([]);
  });

  it("cada linha deve ter exatamente 8 colunas", () => {
    const rows = buildPdfRows(mockMargens);
    for (const row of rows) {
      expect(row.length).toBe(8);
    }
  });
});

// ─── buildExcelData ───
describe("buildExcelData", () => {
  it("deve gerar dados da planilha com cabeçalho e linhas de dados", () => {
    const data = buildExcelData(mockInfo, mockMargens);
    expect(data[0][0]).toBe("GARDEN PRIMAVERA - TABELA DE PREÇO");
    expect(data[1][0]).toContain("Entrada #1");
    expect(data[1][0]).toContain("Entrada NF");
    expect(data[2][0]).toContain("Fornecedor Teste");
    expect(data[2][0]).toContain("12345");
    expect(data[4].length).toBe(0);
    expect(data[5]).toEqual(TABLE_HEADERS);
    expect(data[6][0]).toBe("Rosa Vermelha");
    expect(data[6][1]).toBe(10);
    expect(data[6][2]).toBe(20);
    expect(data[6][3]).toBe(12);
    expect(data[7][0]).toBe("Girassol");
    expect(data[7][1]).toBe(5);
  });

  it("deve incluir linha de total no final", () => {
    const data = buildExcelData(mockInfo, mockMargens);
    const lastRow = data[data.length - 1];
    expect(lastRow[0]).toBe("Total de 2 produto(s)");
  });

  it("deve ter o número correto de linhas (4 header + 1 vazia + 1 headers + 2 dados + 1 vazia + 1 total = 10)", () => {
    const data = buildExcelData(mockInfo, mockMargens);
    expect(data.length).toBe(10);
  });
});

// ─── TABLE_HEADERS ───
describe("TABLE_HEADERS", () => {
  it("deve ter 8 colunas", () => {
    expect(TABLE_HEADERS.length).toBe(8);
  });

  it("deve começar com Produto e terminar com Preço 3 (R$)", () => {
    expect(TABLE_HEADERS[0]).toBe("Produto");
    expect(TABLE_HEADERS[7]).toBe("Preço 3 (R$)");
  });
});

// ─── calcPreco ───
describe("calcPreco", () => {
  it("deve calcular preço corretamente a partir da margem", () => {
    expect(calcPreco(10, 20)).toBe(12);
  });

  it("margem 0 deve retornar o próprio custo", () => {
    expect(calcPreco(10, 0)).toBe(10);
  });

  it("margem 100% deve retornar o dobro do custo", () => {
    expect(calcPreco(10, 100)).toBe(20);
  });

  it("custo 0 deve retornar 0 independente da margem", () => {
    expect(calcPreco(0, 50)).toBe(0);
  });

  it("deve funcionar com valores decimais", () => {
    expect(calcPreco(7.50, 33.33)).toBeCloseTo(10.00, 1);
  });
});

// ─── calcMargem ───
describe("calcMargem", () => {
  it("deve calcular margem corretamente a partir do preço", () => {
    expect(calcMargem(10, 12)).toBeCloseTo(20, 2);
  });

  it("preço igual ao custo deve retornar margem 0", () => {
    expect(calcMargem(10, 10)).toBe(0);
  });

  it("preço dobro do custo deve retornar margem 100", () => {
    expect(calcMargem(10, 20)).toBe(100);
  });

  it("custo 0 deve retornar margem 0", () => {
    expect(calcMargem(0, 12)).toBe(0);
  });

  it("custo negativo deve retornar margem 0", () => {
    expect(calcMargem(-5, 12)).toBe(0);
  });
});

// ─── Integração PDF com jsPDF ───
describe("Integração PDF com jsPDF + helpers compartilhados", () => {
  it("deve gerar um PDF válido usando buildPdfRows e TABLE_HEADERS", () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("GARDEN PRIMAVERA - TABELA DE PREÇO", 14, 15);

    const rows = buildPdfRows(mockMargens);
    autoTable(doc, {
      startY: 38,
      head: [TABLE_HEADERS],
      body: rows,
      theme: "grid",
    });

    const output = doc.output("arraybuffer");
    expect(output).toBeDefined();
    expect(output.byteLength).toBeGreaterThan(0);
    expect((doc as any).lastAutoTable.finalY).toBeGreaterThan(38);
  });
});

// ─── Integração Excel com xlsx ───
describe("Integração Excel com xlsx + helpers compartilhados", () => {
  it("deve gerar um workbook Excel válido usando buildExcelData", () => {
    const wsData = buildExcelData(mockInfo, mockMargens);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tabela de Preço");

    expect(wb.SheetNames).toContain("Tabela de Preço");
    expect(ws["A1"]?.v).toBe("GARDEN PRIMAVERA - TABELA DE PREÇO");
    expect(ws["A6"]?.v).toBe("Produto");
    expect(ws["A7"]?.v).toBe("Rosa Vermelha");
    expect(ws["B7"]?.v).toBe(10);

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);
  });
});
