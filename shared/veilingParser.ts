/**
 * Parser para o formato "Relatório de Pedidos Veiling Online" (.xlsx)
 * 
 * Estrutura do arquivo:
 * - Linha 1: Título "Relatório de Pedidos Veiling Online" (merged)
 * - Linha 2: Info da chave "Chave XXXX - EMPRESA - DD/MM/YYYY HH:MM" (merged)
 * - Linha 3: Headers das colunas
 * - Linha 4+: Dados
 * 
 * Colunas relevantes (índice 0-based):
 * 0: Tipo (ENP, LKP Recepcionado, LKP em Trânsito)
 * 1: Compra (data/hora)
 * 2: Usuário
 * 3: Status
 * 4: Mensagem
 * 5: Pedido (número do pedido/transação GFP - chave de deduplicação)
 * 6: Entrega
 * 7: Faturamento
 * 8: Produto
 * 9: Cód. Barras (código principal)
 * 10: (campo extra / código de barras secundário)
 * 11: Descrição
 * 12: Qual. (Qualidade: A1, A2)
 * 13: Produtor (código)
 * 14: Nome Sítio (nome do produtor)
 * 15: Embalagem
 * 16: Vlr emb.
 * 17: QE x QpE (ex: "1x10")
 * 18: Total Un.
 * 19: Frete Un.
 * 20: Vlr Unit.
 * 21: SubTotal
 * 22: Desc./Acres.
 * 23: Total
 * 24: Observação
 * 25: Num. GFP
 */

export type VeilingItem = {
  tipo: string;
  dataCompra: string;
  pedido: string;        // Número do pedido/transação GFP (col 5) - chave de deduplicação
  codBarras: string;
  descricao: string;
  qualidade: string;
  nomeSitio: string;
  vlrEmb: number;
  qeXqpe: string;
  totalUn: number;
  freteUn: number;
  vlrUnit: number;
  subTotal: number;
  total: number;
  observacao: string;
  numGfp: string;
};

export type VeilingParseResult = {
  success: boolean;
  chaveInfo: string;
  items: VeilingItem[];
  error?: string;
};

/**
 * Detecta se um array de linhas (rows) corresponde ao formato Veiling Online.
 * Cada row é um array de valores de célula.
 */
export function isVeilingFormat(rows: any[][]): boolean {
  if (!rows || rows.length < 4) return false;
  const firstCell = String(rows[0]?.[0] ?? "").toLowerCase();
  return firstCell.includes("relatório de pedidos veiling") || firstCell.includes("relatorio de pedidos veiling");
}

/**
 * Parseia um número que pode estar no formato brasileiro "1,234" ou padrão "1.234"
 */
function parseNumber(val: any): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  const str = String(val).trim();
  // Se tem vírgula como decimal (formato BR): "0,583333"
  const cleaned = str.replace(/"/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

/**
 * Parseia as linhas do arquivo Veiling Online em itens estruturados.
 */
export function parseVeilingRows(rows: any[][]): VeilingParseResult {
  if (!rows || rows.length < 4) {
    return { success: false, chaveInfo: "", items: [], error: "Arquivo vazio ou com poucas linhas" };
  }

  // Linha 2 (index 1): Info da chave
  const chaveInfo = String(rows[1]?.[0] ?? "");

  // Linha 3 (index 2): Headers - pular
  // Linhas 4+ (index 3+): Dados
  const items: VeilingItem[] = [];

  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 20) continue;

    const tipo = String(row[0] ?? "").trim();
    if (!tipo) continue;

    // Descrição está na coluna 11 (há um campo extra na coluna 10)
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
      numGfp: String(row[25] ?? "").trim(),
    });
  }

  if (items.length === 0) {
    return { success: false, chaveInfo, items: [], error: "Nenhum item válido encontrado no arquivo" };
  }

  return { success: true, chaveInfo, items };
}

/**
 * Extrai o fornecedor da chave info.
 * Ex: "Chave 5191 - GARDEN CENTER FERREIRA LTDA - 10/04/2026 22:17"
 * Retorna: "GARDEN CENTER FERREIRA LTDA"
 */
export function extractFornecedorFromChave(chaveInfo: string): string {
  const parts = chaveInfo.split(" - ");
  if (parts.length >= 2) return parts[1].trim();
  return chaveInfo;
}

/**
 * Extrai a data da chave info.
 * Ex: "Chave 5191 - GARDEN CENTER FERREIRA LTDA - 10/04/2026 22:17"
 * Retorna: "10/04/2026"
 */
export function extractDataFromChave(chaveInfo: string): string {
  const parts = chaveInfo.split(" - ");
  if (parts.length >= 3) {
    const dataPart = parts[2].trim();
    // Pegar só a data, sem hora
    const dateMatch = dataPart.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch) return dateMatch[1];
  }
  return new Date().toISOString().split("T")[0];
}
