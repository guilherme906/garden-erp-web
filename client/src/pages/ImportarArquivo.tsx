import { useState, useMemo, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, Check, AlertTriangle, PackagePlus, FileText, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { isVeilingFormat, parseVeilingRows, extractFornecedorFromChave, extractDataFromChave } from "@shared/veilingParser";

type ImportItem = {
  dtVenda: string; nomeProdutor: string; chave: string; codProd: string;
  descricao: string; qtEmb: number; qtPorEmb: number; preco: number; vlrTotal: number;
  fator: number; nomeParaCadastro: string; vinculadoId?: number; vinculadoNome?: string;
  cadastrado: boolean;
};

type FormatoArquivo = "txt" | "veiling" | "compras-importadas" | null;

export default function ImportarArquivo() {
  const utils = trpc.useUtils();
  const { data: produtos } = trpc.produtos.list.useQuery({});
  const { data: comprasImportadas } = trpc.comprasImportadas.list.useQuery();
  const createProdMut = trpc.produtos.create.useMutation({
    onSuccess: () => utils.produtos.list.invalidate(),
    onError: (e) => toast.error("Erro ao cadastrar produto: " + e.message),
  });
  const createCompraMut = trpc.compras.create.useMutation({ onSuccess: () => { utils.compras.list.invalidate(); utils.produtos.list.invalidate(); } });
  const aplicarPrecosMut = trpc.produtos.aplicarPrecosImportados.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.atualizados} de ${result.total} precos aplicados com sucesso!`);
      if (result.erros.length > 0) {
        toast.error(`Erros: ${result.erros.join(", ")}`);
      }
      utils.produtos.list.invalidate();
    },
    onError: (e) => toast.error("Erro ao aplicar precos: " + e.message),
  });

  const [items, setItems] = useState<ImportItem[]>([]);
  const [fileName, setFileName] = useState("");
  const [formato, setFormato] = useState<FormatoArquivo>(null);
  const [veilingInfo, setVeilingInfo] = useState("");
  const [margemTabela1, setMargemTabela1] = useState(0);
  const [margemTabela2, setMargemTabela2] = useState(0);
  const [margemTabela3, setMargemTabela3] = useState(0);

  // ─── Parser TXT (modelo original) ───
  const parseTxt = (text: string) => {
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) { toast.error("Arquivo vazio ou sem dados"); return; }
    const parsed: ImportItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(";");
      if (cols.length < 9) continue;
      const desc = cols[4]?.trim() || "";
      const qtEmb = parseFloat(cols[5]) || 0;
      const qtPorEmb = parseFloat(cols[6]) || 0;
      const preco = parseFloat(cols[7]) || 0;
      const vlrTotal = parseFloat(cols[8]) || 0;
      const existing = produtos?.find((p: any) => p.descricao.toLowerCase() === desc.toLowerCase() || p.codigoExterno === cols[3]?.trim());
      parsed.push({
        dtVenda: cols[1]?.trim() || "", nomeProdutor: cols[2]?.trim() || "",
        chave: cols[0]?.trim() || "", codProd: cols[3]?.trim() || "",
        descricao: desc, qtEmb, qtPorEmb, preco, vlrTotal,
        fator: 1, nomeParaCadastro: desc,
        vinculadoId: existing?.id ?? undefined, vinculadoNome: existing?.descricao ?? undefined,
        cadastrado: !!existing,
      });
    }
    setItems(parsed);
    setFormato("txt");
    setVeilingInfo("");
    toast.success(`${parsed.length} itens processados (Modelo TXT)`);
  };

  // ─── Parser XLSX Veiling Online ───
  const parseVeiling = (data: ArrayBuffer) => {
    try {
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) { toast.error("Planilha vazia"); return; }

      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      if (!isVeilingFormat(rows)) {
        toast.error("Formato XLSX não reconhecido. Esperado: Relatório de Pedidos Veiling Online");
        return;
      }

      const result = parseVeilingRows(rows);
      if (!result.success) {
        toast.error(result.error || "Erro ao processar arquivo Veiling");
        return;
      }

      const parsed: ImportItem[] = result.items.map(item => {
        const existing = produtos?.find((p: any) =>
          p.descricao.toLowerCase() === item.descricao.toLowerCase() ||
          p.codigoExterno === item.codBarras
        );

        // Extrair QE e QpE do campo "1x10"
        let qtEmb = 1;
        let qtPorEmb = item.totalUn;
        const qeMatch = item.qeXqpe.match(/(\d+)\s*x\s*(\d+)/);
        if (qeMatch) {
          qtEmb = parseInt(qeMatch[1]) || 1;
          qtPorEmb = parseInt(qeMatch[2]) || item.totalUn;
        }

        return {
          dtVenda: item.dataCompra,
          nomeProdutor: item.nomeSitio,
          chave: item.codBarras,
          codProd: item.codBarras,
          descricao: item.descricao,
          qtEmb,
          qtPorEmb,
          preco: item.vlrUnit,
          vlrTotal: item.total,
          fator: 1,
          nomeParaCadastro: item.descricao,
          vinculadoId: existing?.id ?? undefined,
          vinculadoNome: existing?.descricao ?? undefined,
          cadastrado: !!existing,
        };
      });

      setItems(parsed);
      setFormato("veiling");
      setVeilingInfo(result.chaveInfo);
      toast.success(`${parsed.length} itens processados (Veiling Online)`);
    } catch (err: any) {
      toast.error("Erro ao ler arquivo XLSX: " + (err?.message || "erro desconhecido"));
    }
  };

  // ─── Handler de arquivo unificado ───
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const ext = file.name.toLowerCase().split(".").pop();

    if (ext === "xlsx" || ext === "xls") {
      // Tentar como Veiling Online
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result as ArrayBuffer;
        parseVeiling(data);
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Modelo TXT original
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        parseTxt(text);
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  const updateItem = (idx: number, updates: Partial<ImportItem>) => {
    setItems(items.map((item, i) => i === idx ? { ...item, ...updates } : item));
  };

  const [cadastrando, setCadastrando] = useState<number | null>(null);
  const [focusedInput, setFocusedInput] = useState<number | null>(null);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (focusedInput !== null) {
        const ref = dropdownRefs.current[focusedInput];
        if (ref && !ref.contains(e.target as Node)) {
          setFocusedInput(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [focusedInput]);

  const getSugestoes = (texto: string) => {
    if (!texto || texto.length < 2 || !produtos) return [];
    const t = texto.toLowerCase();
    return produtos.filter((p: any) => p.descricao.toLowerCase().includes(t)).slice(0, 8);
  };

  const cadastrarRapido = async (idx: number) => {
    const item = items[idx];
    if (!item.nomeParaCadastro.trim()) { toast.error("Nome do produto não pode ser vazio"); return; }
    setCadastrando(idx);
    try {
      const precoCalc = String(item.preco);
      const result = await createProdMut.mutateAsync({
        descricao: item.nomeParaCadastro.trim().toUpperCase(),
        preco: precoCalc,
        codigoExterno: item.codProd || undefined,
      });
      const newId = result.id ?? result ?? undefined;
      updateItem(idx, { cadastrado: true, vinculadoId: typeof newId === 'number' ? newId : undefined, vinculadoNome: item.nomeParaCadastro });
      toast.success(`Produto "${item.nomeParaCadastro}" cadastrado com ID ${newId}!`);
    } catch (err: any) {
      toast.error("Erro ao cadastrar: " + (err?.message || "erro desconhecido"));
    } finally {
      setCadastrando(null);
    }
  };

  const cadastrarTodosNovos = async () => {
    const novos = items.filter(i => !i.cadastrado && !i.vinculadoId);
    if (novos.length === 0) { toast.info("Todos os produtos já estão cadastrados"); return; }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].cadastrado && !items[i].vinculadoId) await cadastrarRapido(i);
    }
  };

  const vincularProduto = (idx: number, prod: any) => {
    updateItem(idx, { vinculadoId: prod.id, vinculadoNome: prod.descricao, cadastrado: true });
    toast.success(`Vinculado a "${prod.descricao}"`);
  };

  const aplicarPrecosImportados = async () => {
    if (!comprasImportadas || comprasImportadas.length === 0) {
      toast.error("Nenhuma compra importada para aplicar precos");
      return;
    }

    const precos = comprasImportadas.map((compra: any) => {
      const custo = parseFloat(compra.valorCusto);
      const preco1 = custo * (1 + margemTabela1 / 100);
      const preco2 = custo * (1 + margemTabela2 / 100);
      const preco3 = custo * (1 + margemTabela3 / 100);
      return {
        produtoNome: compra.produto,
        preco1,
        preco2,
        preco3,
      };
    });

    try {
      await aplicarPrecosMut.mutateAsync({ precos });
    } catch (e) {
      toast.error("Erro ao aplicar precos: " + (e as Error).message);
    }
  };

  const confirmarImportacao = async () => {
    if (items.length === 0) { toast.error("Nenhum item para importar"); return; }
    try {
      let fornecedor = items[0]?.nomeProdutor || "Importação";
      let data = new Date().toISOString().split("T")[0];

      if (formato === "veiling" && veilingInfo) {
        fornecedor = extractFornecedorFromChave(veilingInfo) || fornecedor;
        const dataVeiling = extractDataFromChave(veilingInfo);
        // Converter DD/MM/YYYY para YYYY-MM-DD
        const parts = dataVeiling.split("/");
        if (parts.length === 3) {
          data = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const itensPayload = items.map(i => {
        const qtdTotal = i.qtEmb * i.qtPorEmb;
        const qtdConv = i.fator > 0 ? qtdTotal / i.fator : qtdTotal;
        const vlrConv = i.preco * (i.fator || 1);
        return {
          produtoId: i.vinculadoId, produtoNome: i.nomeParaCadastro,
          quantidade: String(qtdConv), valorUnitario: String(vlrConv),
          subtotal: String(qtdConv * vlrConv),
        };
      });
      await createCompraMut.mutateAsync({
        fornecedor, data,
        total: itensPayload.reduce((s, i) => s + parseFloat(i.subtotal), 0).toFixed(2),
        origem: "IMPORTACAO", itens: itensPayload,
      });
      toast.success("Importação confirmada com sucesso!");
      setItems([]); setFileName(""); setFormato(null); setVeilingInfo("");
    } catch { toast.error("Erro ao confirmar importação"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Importar Arquivo</h1>
        <div className="flex gap-2 flex-wrap">
          {items.some(i => !i.cadastrado && !i.vinculadoId) && (
            <Button variant="outline" onClick={cadastrarTodosNovos} className="text-orange-600 border-orange-300 h-10 sm:h-9 text-sm">
              <AlertTriangle className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Cadastrar Novos</span><span className="sm:hidden">Cadastrar</span>
            </Button>
          )}
          {items.length > 0 && (
            <Button onClick={confirmarImportacao} disabled={createCompraMut.isPending} className="h-10 sm:h-9 text-sm">
              {createCompraMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Check className="h-4 w-4 mr-2" /> Confirmar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <label className="flex items-center gap-2 px-4 py-3 sm:py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition w-full sm:w-auto active:bg-muted/70">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{fileName || "Selecionar arquivo (.txt, .csv, .xlsx)"}</span>
                <input type="file" accept=".txt,.csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
              </label>
              <div className="flex gap-2 flex-wrap">
                {items.length > 0 && <Badge variant="secondary">{items.length} itens</Badge>}
                {formato && (
                  <Badge variant="outline" className={formato === "veiling" ? "text-blue-600 border-blue-300" : "text-green-600 border-green-300"}>
                    {formato === "veiling" ? (
                      <><FileSpreadsheet className="h-3 w-3 mr-1" /> Veiling Online</>
                    ) : (
                      <><FileText className="h-3 w-3 mr-1" /> Modelo TXT</>
                    )}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> <strong>Modelo 1:</strong> Arquivo .txt/.csv (separado por ;)</span>
              <span className="flex items-center gap-1"><FileSpreadsheet className="h-3 w-3" /> <strong>Modelo 2:</strong> Veiling Online (.xlsx)</span>
            </div>
            {formato === "veiling" && veilingInfo && (
              <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded-md">
                <strong>Veiling:</strong> {veilingInfo}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Nome p/ Cadastro</TableHead>
                  {formato === "veiling" && <TableHead>Produtor</TableHead>}
                  <TableHead className="text-right">Qt Emb</TableHead>
                  <TableHead className="text-right">Qt/Emb</TableHead>
                  <TableHead className="text-right">Qtd Total</TableHead>
                  <TableHead className="text-center">Fator</TableHead>
                  <TableHead className="text-right">Qtd Conv</TableHead>
                  <TableHead className="text-right">Vlr Conv</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => {
                  const qtdTotal = item.qtEmb * item.qtPorEmb;
                  const qtdConv = item.fator > 0 ? qtdTotal / item.fator : qtdTotal;
                  const vlrConv = item.preco * (item.fator || 1);
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-xs">{item.codProd}</TableCell>
                      <TableCell className="text-xs">{item.descricao}</TableCell>
                      <TableCell>
                        <div className="relative" ref={el => { dropdownRefs.current[idx] = el; }}>
                          <Input
                            value={item.nomeParaCadastro}
                            onChange={e => {
                              updateItem(idx, { nomeParaCadastro: e.target.value });
                              setFocusedInput(idx);
                              setHighlightIdx(-1);
                            }}
                            onFocus={() => { setFocusedInput(idx); setHighlightIdx(-1); }}
                            onKeyDown={e => {
                              const sugs = getSugestoes(item.nomeParaCadastro);
                              if (focusedInput !== idx || item.vinculadoId || sugs.length === 0) return;
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setHighlightIdx(prev => (prev < sugs.length - 1 ? prev + 1 : 0));
                              } else if (e.key === "ArrowUp") {
                                e.preventDefault();
                                setHighlightIdx(prev => (prev > 0 ? prev - 1 : sugs.length - 1));
                              } else if (e.key === "Enter" && highlightIdx >= 0 && highlightIdx < sugs.length) {
                                e.preventDefault();
                                const p = sugs[highlightIdx];
                                vincularProduto(idx, p);
                                updateItem(idx, { nomeParaCadastro: p.descricao });
                                setFocusedInput(null);
                                setHighlightIdx(-1);
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                setFocusedInput(null);
                                setHighlightIdx(-1);
                              }
                            }}
                            className="h-8 sm:h-7 text-sm sm:text-xs w-48"
                            placeholder="Digite para buscar..."
                          />
                          {focusedInput === idx && !item.vinculadoId && getSugestoes(item.nomeParaCadastro).length > 0 && (
                            <div className="absolute z-50 top-full left-0 w-64 mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {getSugestoes(item.nomeParaCadastro).map((p: any, sIdx: number) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className={`w-full text-left px-3 py-2 text-xs border-b last:border-b-0 transition-colors ${
                                    sIdx === highlightIdx
                                      ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                                      : "hover:bg-green-50 dark:hover:bg-green-900/30"
                                  }`}
                                  onMouseEnter={() => setHighlightIdx(sIdx)}
                                  onClick={() => {
                                    vincularProduto(idx, p);
                                    updateItem(idx, { nomeParaCadastro: p.descricao });
                                    setFocusedInput(null);
                                    setHighlightIdx(-1);
                                  }}
                                >
                                  <span className="font-medium">{p.descricao}</span>
                                  {p.codigoExterno && <span className="text-muted-foreground ml-2">({p.codigoExterno})</span>}
                                </button>
                              ))}
                            </div>
                          )}
                          {item.vinculadoNome && (
                            <span className="text-xs text-green-600 block mt-0.5">
                              Vinculado: {item.vinculadoNome}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {formato === "veiling" && (
                        <TableCell className="text-xs text-muted-foreground">{item.nomeProdutor}</TableCell>
                      )}
                      <TableCell className="text-right">{item.qtEmb}</TableCell>
                      <TableCell className="text-right">{item.qtPorEmb}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{qtdTotal}</TableCell>
                      <TableCell className="text-center">
                        <Input type="number" min="0.01" step="0.01" value={item.fator} onChange={e => updateItem(idx, { fator: parseFloat(e.target.value) || 1 })} className="h-8 sm:h-7 text-sm sm:text-xs w-16 text-center" />
                      </TableCell>
                      <TableCell className="text-right font-mono">{qtdConv.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">R$ {vlrConv.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">R$ {(qtdConv * vlrConv).toFixed(2)}</TableCell>
                      <TableCell>
                        {item.cadastrado || item.vinculadoId ? (
                          <Badge variant="default" className="text-xs"><Check className="h-3 w-3 mr-1" />OK</Badge>
                        ) : (
                          <div className="flex gap-1 items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 sm:h-7 text-sm sm:text-xs text-orange-600 border-orange-300 hover:bg-orange-50 font-semibold"
                              onClick={() => cadastrarRapido(idx)}
                              disabled={cadastrando === idx}
                            >
                              {cadastrando === idx ? (
                                <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Cadastrando...</>
                              ) : (
                                <><PackagePlus className="h-3 w-3 mr-1" /> Cadastrar</>
                              )}
                            </Button>
                            <select
                              className="h-8 sm:h-7 text-sm sm:text-xs border rounded px-1 bg-white cursor-pointer"
                              onChange={e => { const p = produtos?.find((p: any) => p.id === Number(e.target.value)); if (p) vincularProduto(idx, p); }}
                              defaultValue=""
                            >
                              <option value="" disabled>Vincular a...</option>
                              {produtos?.map((p: any) => <option key={p.id} value={p.id}>{p.descricao}</option>)}
                            </select>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Seção de Compras Importadas */}
      {comprasImportadas && comprasImportadas.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Compras Importadas - Sugestões de Preço</h2>
                <Badge variant="secondary">{comprasImportadas.length} produtos</Badge>
              </div>

              {/* Controles de Margem */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/30 p-3 rounded-lg">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tabela 1 - Margem %</label>
                  <Input type="number" min="0" max="100" step="1" value={margemTabela1} onChange={e => setMargemTabela1(parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tabela 2 - Margem %</label>
                  <Input type="number" min="0" max="100" step="1" value={margemTabela2} onChange={e => setMargemTabela2(parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tabela 3 - Margem %</label>
                  <Input type="number" min="0" max="100" step="1" value={margemTabela3} onChange={e => setMargemTabela3(parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                </div>
              </div>

              {/* Botão de Aplicar Preços */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => aplicarPrecosImportados()} 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={!comprasImportadas || comprasImportadas.length === 0}
                >
                  <Check className="h-4 w-4 mr-2" /> Aplicar Preços (Tabela 1)
                </Button>
              </div>

              {/* Tabela de Compras Importadas */}
              <div className="overflow-x-auto border rounded-lg">
                <Table className="text-xs">
                  <TableHeader className="bg-orange-50 dark:bg-orange-950/20 sticky top-0">
                    <TableRow>
                      <TableHead className="text-left">Produto</TableHead>
                      <TableHead className="text-right">Custo (R$)</TableHead>
                      <TableHead className="text-right">Pacote</TableHead>
                      <TableHead className="text-center bg-blue-50 dark:bg-blue-950/20">Tabela 1</TableHead>
                      <TableHead className="text-center bg-orange-50 dark:bg-orange-950/20">Tabela 2</TableHead>
                      <TableHead className="text-center bg-green-50 dark:bg-green-950/20">Tabela 3</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comprasImportadas.map((compra: any) => {
                      const custo = parseFloat(compra.valorCusto);
                      const pacote = parseFloat(compra.pacote);
                      const preco1 = custo * (1 + margemTabela1 / 100);
                      const preco2 = custo * (1 + margemTabela2 / 100);
                      const preco3 = custo * (1 + margemTabela3 / 100);
                      return (
                        <TableRow key={compra.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium truncate max-w-xs">{compra.produto}</TableCell>
                          <TableCell className="text-right font-mono">R$ {custo.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">{pacote.toFixed(4)}</TableCell>
                          <TableCell className="text-center bg-blue-50/50 dark:bg-blue-950/10">
                            <div className="text-xs">
                              <div className="text-muted-foreground">{margemTabela1}%</div>
                              <div className="font-semibold text-blue-600">R$ {preco1.toFixed(2)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center bg-orange-50/50 dark:bg-orange-950/10">
                            <div className="text-xs">
                              <div className="text-muted-foreground">{margemTabela2}%</div>
                              <div className="font-semibold text-orange-600">R$ {preco2.toFixed(2)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center bg-green-50/50 dark:bg-green-950/10">
                            <div className="text-xs">
                              <div className="text-muted-foreground">{margemTabela3}%</div>
                              <div className="font-semibold text-green-600">R$ {preco3.toFixed(2)}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
