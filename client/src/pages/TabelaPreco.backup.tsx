import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Save, Loader2, Search, DollarSign, Percent, Package,
  FileText, FileSpreadsheet, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { buildPdfRows, buildExcelData, calcPreco, calcMargem, TABLE_HEADERS } from "@shared/exportTabelaPreco";
import type { MargemExportItem, CompraExportInfo } from "@shared/exportTabelaPreco";

// ─── Tipos locais ───
type MargemItem = {
  compraItemId: number;
  produtoId: number | null;
  produtoNome: string;
  custoUnitario: string;
  margem1: string;
  preco1: string;
  margem2: string;
  preco2: string;
  margem3: string;
  preco3: string;
};

export default function TabelaPreco() {
  const { erpUser } = useErpAuth();
  const [search, setSearch] = useState("");
  const [selectedCompra, setSelectedCompra] = useState<any>(null);
  const [margens, setMargens] = useState<MargemItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [margensInitialized, setMargensInitialized] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [confirmAplicar, setConfirmAplicar] = useState<"1" | "2" | "3" | null>(null);

  // Buscar todas as compras (entradas NF + importações)
  const comprasQuery = trpc.compras.list.useQuery({});
  const compras = comprasQuery.data ?? [];

  // Buscar compras importadas
  const comprasImportadasQuery = trpc.comprasImportadas.list.useQuery();
  const comprasImportadas = comprasImportadasQuery.data ?? [];

  // Buscar margens salvas para a compra selecionada
  const margensQuery = trpc.tabelaPrecos.getByCompra.useQuery(
    { compraId: selectedCompra?.id ?? 0 },
    { enabled: !!selectedCompra }
  );

  // Mutation para aplicar preço ao cadastro
  const aplicarPrecoMut = trpc.tabelaPrecos.aplicarPreco.useMutation({
    onSuccess: (data) => {
      toast.success(`Preços aplicados! ${data.atualizados} atualizado(s), ${data.criados} criado(s).`);
      setAplicando(false);
      setConfirmAplicar(null);
    },
    onError: (err) => {
      toast.error("Erro ao aplicar preços: " + err.message);
      setAplicando(false);
    },
  });

  // Mutation para salvar
  const salvarMut = trpc.tabelaPrecos.salvar.useMutation({
    onSuccess: (data) => {
      const atualizados = (data as any)?.atualizados ?? 0;
      if (atualizados > 0) {
        toast.success(`Tabela de preços salva! Preço de venda (Tabela 3) aplicado a ${atualizados} produto(s).`);
      } else {
        toast.success("Tabela de preços salva com sucesso!");
      }
      margensQuery.refetch();
      setSaving(false);
    },
    onError: (err) => {
      toast.error("Erro ao salvar: " + err.message);
      setSaving(false);
    },
  });

  // Filtrar compras pela busca
  const comprasFiltradas = useMemo(() => {
    if (!search.trim()) return compras;
    const s = search.toLowerCase();
    return compras.filter((c: any) =>
      String(c.id).includes(s) ||
      (c.fornecedor || "").toLowerCase().includes(s) ||
      (c.numNF || "").toLowerCase().includes(s) ||
      (c.origem || "").toLowerCase().includes(s)
    );
  }, [compras, search]);

  // Filtrar compras importadas pela busca
  const comprasImportadasFiltradas = useMemo(() => {
    if (!search.trim()) return comprasImportadas;
    const s = search.toLowerCase();
    return comprasImportadas.filter((c: any) =>
      (c.produto || "").toLowerCase().includes(s) ||
      (c.nomeArquivo || "").toLowerCase().includes(s)
    );
  }, [comprasImportadas, search]);

  // Inicializar margens quando selectedCompra e margensQuery.data estiverem prontos
  useEffect(() => {
    if (!selectedCompra || margensQuery.isLoading || margensQuery.isFetching) return;
    if (margensInitialized) return;

    const savedMargens = margensQuery.data ?? [];
    const items: MargemItem[] = (selectedCompra.itens || []).map((item: any) => {
      const saved = savedMargens.find((m: any) => m.compraItemId === item.id);
      if (saved) {
        return {
          compraItemId: item.id,
          produtoId: item.produtoId ?? null,
          produtoNome: item.produtoNome,
          custoUnitario: String(saved.custoUnitario),
          margem1: String(saved.margem1),
          preco1: String(saved.preco1),
          margem2: String(saved.margem2),
          preco2: String(saved.preco2),
          margem3: String(saved.margem3),
          preco3: String(saved.preco3),
        };
      }
      return {
        compraItemId: item.id,
        produtoId: item.produtoId ?? null,
        produtoNome: item.produtoNome,
        custoUnitario: String(item.valorUnitario),
        margem1: "0",
        preco1: String(item.valorUnitario),
        margem2: "0",
        preco2: String(item.valorUnitario),
        margem3: "0",
        preco3: String(item.valorUnitario),
      };
    });
    setMargens(items);
    setMargensInitialized(true);
  }, [selectedCompra, margensQuery.data, margensQuery.isLoading, margensQuery.isFetching, margensInitialized]);

  // Recalcular preço quando margem muda
  const updateMargem = (index: number, tabela: 1 | 2 | 3, novaMargemStr: string) => {
    setMargens(prev => {
      const next = [...prev];
      const item = { ...next[index] };
      const custo = Number(item.custoUnitario) || 0;
      const novaMargem = Number(novaMargemStr) || 0;
      const novoPreco = custo * (1 + novaMargem / 100);

      if (tabela === 1) {
        item.margem1 = novaMargemStr;
        item.preco1 = novoPreco.toFixed(2);
      } else if (tabela === 2) {
        item.margem2 = novaMargemStr;
        item.preco2 = novoPreco.toFixed(2);
      } else {
        item.margem3 = novaMargemStr;
        item.preco3 = novoPreco.toFixed(2);
      }
      next[index] = item;
      return next;
    });
  };

  // Recalcular margem quando preço muda
  const updatePreco = (index: number, tabela: 1 | 2 | 3, novoPrecoStr: string) => {
    setMargens(prev => {
      const next = [...prev];
      const item = { ...next[index] };
      const custo = Number(item.custoUnitario) || 0;
      const novoPreco = Number(novoPrecoStr) || 0;
      const novaMargem = custo > 0 ? ((novoPreco / custo) - 1) * 100 : 0;

      if (tabela === 1) {
        item.preco1 = novoPrecoStr;
        item.margem1 = novaMargem.toFixed(2);
      } else if (tabela === 2) {
        item.preco2 = novoPrecoStr;
        item.margem2 = novaMargem.toFixed(2);
      } else {
        item.preco3 = novoPrecoStr;
        item.margem3 = novaMargem.toFixed(2);
      }
      next[index] = item;
      return next;
    });
  };

  // Salvar margens
  const handleSalvar = () => {
    if (!selectedCompra || margens.length === 0) return;
    setSaving(true);
    salvarMut.mutate({
      compraId: selectedCompra.id,
      items: margens.map(m => ({
        compraItemId: m.compraItemId,
        produtoId: m.produtoId ?? undefined,
        produtoNome: m.produtoNome,
        custoUnitario: m.custoUnitario,
        margem1: m.margem1,
        preco1: m.preco1,
        margem2: m.margem2,
        preco2: m.preco2,
        margem3: m.margem3,
        preco3: m.preco3,
      })),
    });
  };

  // Abrir editor de margens para uma compra (duplo clique)
  const handleCompraDoubleClick = (compra: any) => {
    setMargensInitialized(false);
    setMargens([]);
    setSelectedCompra(compra);
  };

  // Aplicar preço de uma tabela ao cadastro do produto
  const handleAplicarPreco = (tabela: "1" | "2" | "3") => {
    if (margens.length === 0) return;
    setAplicando(true);
    const items = margens.map(m => ({
      produtoId: m.produtoId ?? undefined,
      produtoNome: m.produtoNome,
      preco: tabela === "1" ? m.preco1 : tabela === "2" ? m.preco2 : m.preco3,
    }));
    aplicarPrecoMut.mutate({
      tabela,
      items,
      usuarioNome: erpUser?.nome || "SISTEMA",
    });
  };

  // Voltar para listagem
  const handleVoltar = () => {
    setSelectedCompra(null);
    setMargens([]);
    setMargensInitialized(false);
  };

  // ─── Helpers de cabeçalho para exportação ───
  const getCompraInfo = (): CompraExportInfo => {
    if (!selectedCompra) return { id: 0, tipo: "", fornecedor: "", nf: "", data: "" };
    return {
      id: selectedCompra.id,
      tipo: selectedCompra.origem === "IMPORTACAO" ? "Importação de Arquivo" : "Entrada NF",
      fornecedor: selectedCompra.fornecedor || "—",
      nf: selectedCompra.numNF || "—",
      data: selectedCompra.data || "",
    };
  };

  // ─── EXPORTAR PDF ───
  const exportarPDF = async () => {
    if (margens.length === 0) return;
    const info = getCompraInfo();

    const doc = new jsPDF({ orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();

    // Logo
    const logoUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663539257200/nE9aRDyk9G49cwSdfYmqny/logo-garden_de682faf.png";
    try {
      const logoImg = new window.Image();
      logoImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject(new Error("Logo não carregou"));
        logoImg.src = logoUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = logoImg.naturalWidth;
      canvas.height = logoImg.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(logoImg, 0, 0);
      const logoDataUrl = canvas.toDataURL("image/png");
      const logoW = 50;
      const logoH = logoW * (1065 / 2048);
      doc.addImage(logoDataUrl, "PNG", 14, 4, logoW, logoH);
    } catch (e) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("GARDEN CENTER PRIMAVERA", 14, 12);
    }

    // Cabeçalho
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TABELA DE PREÇO", pageW / 2, 32, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Entrada #${info.id} • ${info.tipo}`, 14, 39);
    doc.text(`Fornecedor: ${info.fornecedor}  |  NF: ${info.nf}  |  Data: ${info.data}`, 14, 44);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 49);

    // Tabela de dados usando helper compartilhado
    const rows = buildPdfRows(margens as MargemExportItem[]);

    autoTable(doc, {
      startY: 55,
      head: [TABLE_HEADERS],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [22, 163, 74], fontSize: 8, halign: "center" },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: "right" },
        2: { halign: "center", fillColor: [239, 246, 255] },
        3: { halign: "right", fillColor: [239, 246, 255] },
        4: { halign: "center", fillColor: [255, 251, 235] },
        5: { halign: "right", fillColor: [255, 251, 235] },
        6: { halign: "center", fillColor: [236, 253, 245] },
        7: { halign: "right", fillColor: [236, 253, 245] },
      },
      margin: { left: 14 },
    });

    // Rodapé
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(`Total de ${margens.length} produto(s)`, 14, finalY);

    // Abrir em nova janela
    const blobUrl = doc.output("bloburl");
    window.open(blobUrl as unknown as string, "_blank");
    toast.success("PDF gerado com sucesso!");
  };

  // ─── EXPORTAR EXCEL ───
  const exportarExcel = () => {
    if (margens.length === 0) return;
    const info = getCompraInfo();

    // Construir dados da planilha usando helper compartilhado
    const wsData = buildExcelData(info, margens as MargemExportItem[]);

    // Criar workbook e worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Definir larguras de coluna
    ws["!cols"] = [
      { wch: 35 }, // Produto
      { wch: 14 }, // Custo
      { wch: 14 }, // Margem 1
      { wch: 14 }, // Preço 1
      { wch: 14 }, // Margem 2
      { wch: 14 }, // Preço 2
      { wch: 14 }, // Margem 3
      { wch: 14 }, // Preço 3
    ];

    // Merge do título
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tabela de Preço");

    // Gerar e baixar
    const fileName = `tabela-preco-entrada-${selectedCompra.id}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel gerado com sucesso!");
  };

  // ═══ RENDERIZAÇÃO ═══

  // Se estiver no editor de margens
  if (selectedCompra) {
    const isLoading = margensQuery.isLoading || margensQuery.isFetching || !margensInitialized;

    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-10 sm:h-8" onClick={handleVoltar}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Entrada #{selectedCompra.id}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {selectedCompra.origem === "IMPORTACAO" ? "Importação" : "NF"}
                {selectedCompra.fornecedor && ` • ${selectedCompra.fornecedor}`}
                {selectedCompra.numNF && ` • NF: ${selectedCompra.numNF}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={exportarPDF}
              disabled={isLoading || margens.length === 0}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportarExcel}
              disabled={isLoading || margens.length === 0}
              className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={saving || isLoading || margens.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              SALVAR
            </Button>
          </div>
        </div>

        {/* Barra de Aplicar Preço */}
        {!isLoading && margens.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-blue-50 via-amber-50 to-emerald-50 dark:from-blue-950/30 dark:via-amber-950/30 dark:to-emerald-950/30 rounded-lg border border-dashed border-muted-foreground/30">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs sm:text-sm text-muted-foreground mr-2">Aplicar preços:</span>
            {confirmAplicar === null ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmAplicar("1")}
                  disabled={aplicando}
                  className="text-blue-600 border-blue-300 hover:bg-blue-100"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span> Tabela 1
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmAplicar("2")}
                  disabled={aplicando}
                  className="text-amber-600 border-amber-300 hover:bg-amber-100"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span> Tabela 2
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmAplicar("3")}
                  disabled={aplicando}
                  className="text-emerald-600 border-emerald-300 hover:bg-emerald-100"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span> Tabela 3
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-orange-600">
                  Confirma aplicar Tabela {confirmAplicar} a {margens.length} produto(s)?
                </span>
                <Button
                  size="sm"
                  onClick={() => handleAplicarPreco(confirmAplicar)}
                  disabled={aplicando}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {aplicando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  Confirmar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmAplicar(null)}
                  disabled={aplicando}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-3 text-muted-foreground">Carregando dados...</span>
          </div>
        ) : margens.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Esta entrada não possui itens para editar margens.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border rounded-lg -mx-1 sm:mx-0">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-2 font-semibold border-b min-w-[200px]">Produto</th>
                    <th className="text-right px-3 py-2 font-semibold border-b min-w-[100px]">Custo (R$)</th>
                    <th colSpan={2} className="text-center px-3 py-2 font-semibold border-b bg-blue-50 dark:bg-blue-950 min-w-[200px]">
                      <div className="flex items-center justify-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                        Tabela 1
                      </div>
                    </th>
                    <th colSpan={2} className="text-center px-3 py-2 font-semibold border-b bg-amber-50 dark:bg-amber-950 min-w-[200px]">
                      <div className="flex items-center justify-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-amber-500"></span>
                        Tabela 2
                      </div>
                    </th>
                    <th colSpan={2} className="text-center px-3 py-2 font-semibold border-b bg-emerald-50 dark:bg-emerald-950 min-w-[200px]">
                      <div className="flex items-center justify-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
                        Tabela 3
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-muted/30">
                    <th className="border-b"></th>
                    <th className="border-b"></th>
                    <th className="text-center px-2 py-1 text-xs border-b bg-blue-50 dark:bg-blue-950">Margem %</th>
                    <th className="text-center px-2 py-1 text-xs border-b bg-blue-50 dark:bg-blue-950">Preço R$</th>
                    <th className="text-center px-2 py-1 text-xs border-b bg-amber-50 dark:bg-amber-950">Margem %</th>
                    <th className="text-center px-2 py-1 text-xs border-b bg-amber-50 dark:bg-amber-950">Preço R$</th>
                    <th className="text-center px-2 py-1 text-xs border-b bg-emerald-50 dark:bg-emerald-950">Margem %</th>
                    <th className="text-center px-2 py-1 text-xs border-b bg-emerald-50 dark:bg-emerald-950">Preço R$</th>
                  </tr>
                </thead>
                <tbody>
                  {margens.map((item, idx) => (
                    <tr key={item.compraItemId} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2 font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{item.produtoNome}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-sm">
                        R$ {Number(item.custoUnitario).toFixed(2)}
                      </td>
                      {/* Tabela 1 */}
                      <td className="px-2 py-1 bg-blue-50/50 dark:bg-blue-950/30">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.margem1}
                            onChange={e => updateMargem(idx, 1, e.target.value)}
                            className="h-8 text-center text-sm w-20 mx-auto"
                          />
                          <Percent className="h-3 w-3 text-muted-foreground shrink-0" />
                        </div>
                      </td>
                      <td className="px-2 py-1 bg-blue-50/50 dark:bg-blue-950/30">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.preco1}
                          onChange={e => updatePreco(idx, 1, e.target.value)}
                          className="h-8 text-center text-sm w-24 mx-auto"
                        />
                      </td>
                      {/* Tabela 2 */}
                      <td className="px-2 py-1 bg-amber-50/50 dark:bg-amber-950/30">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.margem2}
                            onChange={e => updateMargem(idx, 2, e.target.value)}
                            className="h-8 text-center text-sm w-20 mx-auto"
                          />
                          <Percent className="h-3 w-3 text-muted-foreground shrink-0" />
                        </div>
                      </td>
                      <td className="px-2 py-1 bg-amber-50/50 dark:bg-amber-950/30">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.preco2}
                          onChange={e => updatePreco(idx, 2, e.target.value)}
                          className="h-8 text-center text-sm w-24 mx-auto"
                        />
                      </td>
                      {/* Tabela 3 */}
                      <td className="px-2 py-1 bg-emerald-50/50 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.margem3}
                            onChange={e => updateMargem(idx, 3, e.target.value)}
                            className="h-8 text-center text-sm w-20 mx-auto"
                          />
                          <Percent className="h-3 w-3 text-muted-foreground shrink-0" />
                        </div>
                      </td>
                      <td className="px-2 py-1 bg-emerald-50/50 dark:bg-emerald-950/30">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.preco3}
                          onChange={e => updatePreco(idx, 3, e.target.value)}
                          className="h-8 text-center text-sm w-24 mx-auto"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodapé com resumo */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">
                {margens.length} produto(s) na entrada
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarPDF}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <FileText className="h-4 w-4 mr-1" /> PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportarExcel}
                  className="text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                </Button>
                <Button
                  onClick={handleSalvar}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  SALVAR
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ═══ LISTAGEM DE ENTRADAS ═══
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Tabela de Preço
        </h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, fornecedor, NF..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-64 h-10 sm:h-9"
            />
          </div>
          <Button variant="outline" size="sm" className="h-10 sm:h-8 shrink-0" onClick={() => comprasQuery.refetch()}>
            Atualizar
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Selecione uma entrada (NF ou Importação) e clique duas vezes para editar as margens de venda.
      </p>

      {comprasQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-3 text-muted-foreground">Carregando entradas...</span>
        </div>
      ) : comprasFiltradas.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma entrada encontrada.</p>
          <p className="text-xs mt-1">Cadastre entradas via Entrada NF ou Importação de Arquivo.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-3 py-2 font-semibold border-b w-16">#</th>
                <th className="text-left px-3 py-2 font-semibold border-b">Data</th>
                <th className="text-left px-3 py-2 font-semibold border-b">Tipo</th>
                <th className="text-left px-3 py-2 font-semibold border-b">Fornecedor</th>
                <th className="text-left px-3 py-2 font-semibold border-b">NF</th>
                <th className="text-right px-3 py-2 font-semibold border-b">Itens</th>
                <th className="text-right px-3 py-2 font-semibold border-b">Total (R$)</th>
              </tr>
            </thead>
            <tbody>
              {comprasFiltradas.map((c: any) => (
                <tr
                  key={c.id}
                  className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                  onDoubleClick={() => handleCompraDoubleClick(c)}
                >
                  <td className="px-3 py-2 font-mono text-xs">{c.id}</td>
                  <td className="px-3 py-2">{c.data}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.origem === "IMPORTACAO"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    }`}>
                      {c.origem === "IMPORTACAO" ? "Arquivo" : "NF"}
                    </span>
                  </td>
                  <td className="px-3 py-2">{c.fornecedor || "—"}</td>
                  <td className="px-3 py-2">{c.numNF || "—"}</td>
                  <td className="px-3 py-2 text-right">{c.itens?.length ?? 0}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    R$ {Number(c.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Seção de Compras Importadas */}
      {comprasImportadas.length > 0 && (
          <div className="border rounded-lg p-4 bg-card mt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Compras Importadas - Valores Calculados
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-3 py-2 font-semibold">Produto</th>
                    <th className="text-right px-3 py-2 font-semibold">Qtd</th>
                    <th className="text-right px-3 py-2 font-semibold">V/Custo</th>
                    <th className="text-right px-3 py-2 font-semibold">Custo Total</th>
                    <th className="text-right px-3 py-2 font-semibold">V/Varejo</th>
                    <th className="text-right px-3 py-2 font-semibold">V/CD UM</th>
                    <th className="text-right px-3 py-2 font-semibold">V/CD ATA</th>
                  </tr>
                </thead>
                <tbody>
                  {comprasImportadasFiltradas.slice(0, 10).map((item: any) => (
                    <tr key={item.id} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2">{item.produto}</td>
                      <td className="text-right px-3 py-2 font-mono">{Number(item.quantidade).toFixed(0)}</td>
                      <td className="text-right px-3 py-2 font-mono">R$ {Number(item.valorCusto).toFixed(2)}</td>
                      <td className="text-right px-3 py-2 font-mono text-blue-600 font-semibold">R$ {Number(item.custoTotal).toFixed(2)}</td>
                      <td className="text-right px-3 py-2 font-mono text-green-600 font-semibold">R$ {Number(item.valorVarejo).toFixed(2)}</td>
                      <td className="text-right px-3 py-2 font-mono text-orange-600 font-semibold">R$ {Number(item.valorCdUm).toFixed(2)}</td>
                      <td className="text-right px-3 py-2 font-mono text-purple-600 font-semibold">R$ {Number(item.valorCdAta).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {comprasImportadas.length > 10 && (
              <p className="text-xs text-muted-foreground mt-2">Mostrando 10 de {comprasImportadas.length} itens importados</p>
            )}
          </div>
        )}
    </div>
  );
}
