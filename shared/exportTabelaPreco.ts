/**
 * Helpers de exportação da Tabela de Preço.
 * Extraídos para módulo compartilhado para facilitar testes unitários.
 */

export type MargemExportItem = {
  produtoNome: string;
  custoUnitario: string;
  margem1: string;
  preco1: string;
  margem2: string;
  preco2: string;
  margem3: string;
  preco3: string;
};

export type CompraExportInfo = {
  id: number;
  tipo: string;
  fornecedor: string;
  nf: string;
  data: string;
};

/** Gera as linhas de dados formatadas para o PDF */
export function buildPdfRows(margens: MargemExportItem[]): string[][] {
  return margens.map(m => [
    m.produtoNome,
    `R$ ${Number(m.custoUnitario).toFixed(2)}`,
    `${Number(m.margem1).toFixed(2)}%`,
    `R$ ${Number(m.preco1).toFixed(2)}`,
    `${Number(m.margem2).toFixed(2)}%`,
    `R$ ${Number(m.preco2).toFixed(2)}`,
    `${Number(m.margem3).toFixed(2)}%`,
    `R$ ${Number(m.preco3).toFixed(2)}`,
  ]);
}

/** Gera os dados da planilha Excel como array de arrays */
export function buildExcelData(info: CompraExportInfo, margens: MargemExportItem[]): any[][] {
  const wsData: any[][] = [
    ["GARDEN PRIMAVERA - TABELA DE PREÇO"],
    [`Entrada #${info.id} • ${info.tipo}`],
    [`Fornecedor: ${info.fornecedor}  |  NF: ${info.nf}  |  Data: ${info.data}`],
    [`Gerado em: ${new Date().toLocaleString("pt-BR")}`],
    [],
    ["Produto", "Custo (R$)", "Margem 1 (%)", "Preço 1 (R$)", "Margem 2 (%)", "Preço 2 (R$)", "Margem 3 (%)", "Preço 3 (R$)"],
  ];

  for (const m of margens) {
    wsData.push([
      m.produtoNome,
      Number(m.custoUnitario),
      Number(m.margem1),
      Number(m.preco1),
      Number(m.margem2),
      Number(m.preco2),
      Number(m.margem3),
      Number(m.preco3),
    ]);
  }

  wsData.push([]);
  wsData.push([`Total de ${margens.length} produto(s)`]);

  return wsData;
}

/** Cabeçalhos da tabela */
export const TABLE_HEADERS = [
  "Produto", "Custo (R$)", "Margem 1 (%)", "Preço 1 (R$)",
  "Margem 2 (%)", "Preço 2 (R$)", "Margem 3 (%)", "Preço 3 (R$)",
];

/** Calcula preço a partir de custo e margem */
export function calcPreco(custo: number, margem: number): number {
  return custo * (1 + margem / 100);
}

/** Calcula margem a partir de custo e preço */
export function calcMargem(custo: number, preco: number): number {
  if (custo <= 0) return 0;
  return ((preco / custo) - 1) * 100;
}
