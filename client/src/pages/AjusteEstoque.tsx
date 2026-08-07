import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Minus, RefreshCw, Search, Package, TrendingUp, TrendingDown,
  ClipboardList, AlertCircle, Loader2, ArrowUpCircle, ArrowDownCircle,
  BarChart3, User, Calendar, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type TipoMovimentacao = "ENTRADA" | "SAIDA" | "AJUSTE";

const TIPO_CONFIG: Record<TipoMovimentacao, { label: string; cor: string; icon: React.ReactNode }> = {
  ENTRADA: {
    label: "Entrada",
    cor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <ArrowUpCircle className="h-3.5 w-3.5" />,
  },
  SAIDA: {
    label: "Saída",
    cor: "bg-red-100 text-red-800 border-red-200",
    icon: <ArrowDownCircle className="h-3.5 w-3.5" />,
  },
  AJUSTE: {
    label: "Ajuste",
    cor: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
  },
};

function formatDate(d: Date | string) {
  const dt = new Date(d);
  return dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatQtd(v: string | number) {
  const n = Number(v);
  return n % 1 === 0 ? String(n) : n.toFixed(3).replace(/\.?0+$/, "");
}

// ─── Modal de Ajuste ──────────────────────────────────────────────────────────
function ModalAjuste({
  produto,
  onClose,
  onSuccess,
}: {
  produto: { id: number; nome: string; codigo?: string | null; estoque: string | number; unidade: string };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tipo, setTipo] = useState<TipoMovimentacao>("ENTRADA");
  const [quantidade, setQuantidade] = useState("");
  const [justificativa, setJustificativa] = useState("");

  const utils = trpc.useUtils();
  const ajustar = trpc.loja.ajustarEstoque.useMutation({
    onSuccess: () => {
      toast.success("Ajuste de estoque registrado com sucesso!");
      utils.loja.listarMovimentacoes.invalidate();
      utils.loja.listar.invalidate();
      utils.loja.relatorioEstoque.invalidate();
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const estoqueAtual = Number(produto.estoque || 0);
  const qtd = parseFloat(quantidade) || 0;
  const estoquePreview =
    tipo === "ENTRADA" ? estoqueAtual + qtd :
    tipo === "SAIDA" ? estoqueAtual - qtd :
    qtd;

  const handleSubmit = () => {
    if (!quantidade || qtd <= 0) { toast.error("Informe uma quantidade válida"); return; }
    if (justificativa.trim().length < 3) { toast.error("Informe uma justificativa (mínimo 3 caracteres)"); return; }
    ajustar.mutate({ produtoId: produto.id, tipo, quantidade: qtd, justificativa: justificativa.trim() });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Ajuste de Estoque
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info do produto */}
          <div className="rounded-lg bg-muted/50 border p-3">
            <p className="font-semibold text-sm">{produto.nome}</p>
            {produto.codigo && <p className="text-xs text-muted-foreground">Código: {produto.codigo}</p>}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Estoque atual:</span>
              <span className="text-sm font-bold text-primary">{formatQtd(estoqueAtual)} {produto.unidade}</span>
            </div>
          </div>

          {/* Tipo de movimentação */}
          <div className="space-y-1.5">
            <Label>Tipo de Movimentação</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["ENTRADA", "SAIDA", "AJUSTE"] as TipoMovimentacao[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 text-xs font-medium transition-all",
                    tipo === t
                      ? t === "ENTRADA" ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : t === "SAIDA" ? "border-red-500 bg-red-50 text-red-700"
                        : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-border hover:border-muted-foreground/40"
                  )}
                >
                  {t === "ENTRADA" ? <ArrowUpCircle className="h-4 w-4" /> : t === "SAIDA" ? <ArrowDownCircle className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                  {TIPO_CONFIG[t].label}
                </button>
              ))}
            </div>
            {tipo === "AJUSTE" && (
              <p className="text-xs text-muted-foreground">
                O ajuste define o estoque diretamente para o valor informado.
              </p>
            )}
          </div>

          {/* Quantidade */}
          <div className="space-y-1.5">
            <Label>
              {tipo === "AJUSTE" ? "Novo Estoque" : "Quantidade"} ({produto.unidade})
            </Label>
            <Input
              type="number"
              min="0.001"
              step="0.001"
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
              placeholder="0"
              className="text-lg font-semibold"
            />
          </div>

          {/* Preview */}
          {qtd > 0 && (
            <div className={cn(
              "rounded-lg p-3 border text-sm",
              estoquePreview < 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-muted/50"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estoque após ajuste:</span>
                <span className={cn("font-bold text-base", estoquePreview < 0 ? "text-red-600" : "text-primary")}>
                  {formatQtd(estoquePreview)} {produto.unidade}
                </span>
              </div>
              {estoquePreview < 0 && (
                <p className="text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Atenção: estoque ficará negativo
                </p>
              )}
            </div>
          )}

          {/* Justificativa */}
          <div className="space-y-1.5">
            <Label>
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={justificativa}
              onChange={e => setJustificativa(e.target.value)}
              placeholder={
                tipo === "ENTRADA" ? "Ex: Recebimento de mercadoria, NF 12345..."
                : tipo === "SAIDA" ? "Ex: Quebra/perda, produto vencido, uso interno..."
                : "Ex: Contagem de inventário, correção de estoque..."
              }
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">{justificativa.length}/500 caracteres</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={ajustar.isPending}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={ajustar.isPending || !quantidade || !justificativa.trim()}
            className={cn(
              tipo === "ENTRADA" ? "bg-emerald-600 hover:bg-emerald-700"
              : tipo === "SAIDA" ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {ajustar.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar {TIPO_CONFIG[tipo].label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Aba: Ajuste Manual ───────────────────────────────────────────────────────
function AbaAjusteManual() {
  const [busca, setBusca] = useState("");
  const [departamento, setDepartamento] = useState("TODOS");
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);

  const { data: rawData, isLoading } = trpc.loja.listar.useQuery({
    busca: busca || undefined,
    departamento: departamento !== "TODOS" ? departamento : undefined,
    ativo: 1,
    limit: 200,
    offset: 0,
  });
  const { data: departamentos } = trpc.loja.listDepartamentos.useQuery();

  const produtos = rawData?.items || [];

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="pl-9"
          />
        </div>
        <Select value={departamento} onValueChange={setDepartamento}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os departamentos</SelectItem>
            {(departamentos || []).map((d: string) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de produtos */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Produto</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead className="text-right">Estoque Atual</TableHead>
              <TableHead className="text-center">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : produtos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              produtos.map((p: any) => {
                const estoque = Number(p.estoque || 0);
                return (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.imagemUrl && (
                          <img src={p.imagemUrl} alt={p.nome} className="h-8 w-8 object-cover rounded shrink-0 bg-muted" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <span className="font-medium text-sm">{p.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.codigo || "—"}</TableCell>
                    <TableCell className="text-sm">{p.departamento || "—"}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-semibold text-sm",
                        estoque <= 0 ? "text-red-600" : estoque < 5 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {formatQtd(estoque)} {p.unidade}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setProdutoSelecionado(p)}
                        className="h-7 text-xs gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Ajustar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de ajuste */}
      {produtoSelecionado && (
        <ModalAjuste
          produto={produtoSelecionado}
          onClose={() => setProdutoSelecionado(null)}
          onSuccess={() => setProdutoSelecionado(null)}
        />
      )}
    </div>
  );
}

// ─── Aba: Histórico ───────────────────────────────────────────────────────────
function AbaHistorico() {
  const [filtroProduto, setFiltroProduto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"TODOS" | TipoMovimentacao>("TODOS");
  const [filtroUsuario, setFiltroUsuario] = useState("");

  const { data: rawData, isLoading, refetch } = trpc.loja.listarMovimentacoes.useQuery({
    tipo: filtroTipo !== "TODOS" ? filtroTipo : undefined,
    usuarioNome: filtroUsuario || undefined,
    limit: 200,
    offset: 0,
  });

  const movimentacoes = rawData?.items || [];

  // Filtro local por nome do produto
  const filtradas = useMemo(() => {
    if (!filtroProduto.trim()) return movimentacoes;
    const q = filtroProduto.toLowerCase();
    return movimentacoes.filter((m: any) =>
      (m.produtoNome || "").toLowerCase().includes(q) ||
      (m.produtoCodigo || "").toLowerCase().includes(q)
    );
  }, [movimentacoes, filtroProduto]);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filtroProduto}
            onChange={e => setFiltroProduto(e.target.value)}
            placeholder="Filtrar por produto..."
            className="pl-9"
          />
        </div>
        <Select value={filtroTipo} onValueChange={v => setFiltroTipo(v as any)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os tipos</SelectItem>
            <SelectItem value="ENTRADA">Entrada</SelectItem>
            <SelectItem value="SAIDA">Saída</SelectItem>
            <SelectItem value="AJUSTE">Ajuste</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative min-w-40">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filtroUsuario}
            onChange={e => setFiltroUsuario(e.target.value)}
            placeholder="Filtrar por usuário..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtradas.length} registro{filtradas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabela de histórico */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Data/Hora</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-center">Tipo</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Antes</TableHead>
              <TableHead className="text-right">Depois</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Justificativa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma movimentação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filtradas.map((m: any) => {
                const cfg = TIPO_CONFIG[m.tipo as TipoMovimentacao];
                return (
                  <TableRow key={m.id} className="hover:bg-muted/20">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(m.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{m.produtoNome || `Produto #${m.produtoId}`}</p>
                        {m.produtoCodigo && <p className="text-xs text-muted-foreground">{m.produtoCodigo}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", cfg.cor)}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">
                      {m.tipo === "ENTRADA" ? "+" : m.tipo === "SAIDA" ? "-" : "→"}
                      {formatQtd(m.quantidade)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatQtd(m.estoqueAntes)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "text-sm font-medium",
                        Number(m.estoqueDepois) < 0 ? "text-red-600" : "text-foreground"
                      )}>
                        {formatQtd(m.estoqueDepois)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <User className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-medium">{m.usuarioNome || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48">
                      <p className="text-xs text-muted-foreground line-clamp-2" title={m.justificativa}>
                        {m.justificativa}
                      </p>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Aba: Relatório de Estoque ────────────────────────────────────────────────
function AbaRelatorio() {
  const [busca, setBusca] = useState("");
  const { data: produtos, isLoading, refetch } = trpc.loja.relatorioEstoque.useQuery();

  const filtrados = useMemo(() => {
    if (!produtos) return [];
    if (!busca.trim()) return produtos;
    const q = busca.toLowerCase();
    return produtos.filter((p: any) =>
      (p.nome || "").toLowerCase().includes(q) ||
      (p.codigo || "").toLowerCase().includes(q) ||
      (p.departamento || "").toLowerCase().includes(q)
    );
  }, [produtos, busca]);

  const totais = useMemo(() => {
    if (!filtrados.length) return { produtos: 0, comEstoque: 0, semEstoque: 0, totalEntradas: 0, totalSaidas: 0 };
    return {
      produtos: filtrados.length,
      comEstoque: filtrados.filter((p: any) => Number(p.estoque) > 0).length,
      semEstoque: filtrados.filter((p: any) => Number(p.estoque) <= 0).length,
      totalEntradas: filtrados.reduce((a: number, p: any) => a + Number(p.totalEntradas || 0), 0),
      totalSaidas: filtrados.reduce((a: number, p: any) => a + Number(p.totalSaidas || 0), 0),
    };
  }, [filtrados]);

  return (
    <div className="space-y-4">
      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 bg-muted/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package className="h-4 w-4" />
              <span className="text-xs">Total Produtos</span>
            </div>
            <p className="text-2xl font-bold">{totais.produtos}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Com Estoque</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{totais.comEstoque}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs">Sem Estoque</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{totais.semEstoque}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Movimentações</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {filtrados.reduce((a: number, p: any) => a + Number(p.totalMovimentacoes || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto..." className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Produto</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead className="text-right">Estoque Atual</TableHead>
              <TableHead className="text-right">Entradas</TableHead>
              <TableHead className="text-right">Saídas</TableHead>
              <TableHead className="text-right">Ajustes</TableHead>
              <TableHead className="text-right">Movimentações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((p: any) => {
                const estoque = Number(p.estoque || 0);
                return (
                  <TableRow key={p.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium text-sm">{p.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.codigo || "—"}</TableCell>
                    <TableCell className="text-sm">{p.departamento || "—"}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-bold text-sm",
                        estoque <= 0 ? "text-red-600" : estoque < 5 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {formatQtd(estoque)} {p.unidade}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-emerald-600 font-medium">
                      {Number(p.totalEntradas) > 0 ? `+${formatQtd(p.totalEntradas)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-red-600 font-medium">
                      {Number(p.totalSaidas) > 0 ? `-${formatQtd(p.totalSaidas)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-blue-600">
                      {Number(p.totalAjustes) > 0 ? p.totalAjustes : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {p.totalMovimentacoes || 0}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AjusteEstoque() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Ajuste de Estoque
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Realize ajustes manuais de entrada, saída ou correção de estoque dos produtos da loja
          </p>
        </div>
      </div>

      {/* Abas */}
      <Tabs defaultValue="ajuste">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="ajuste" className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Ajuste Manual
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="relatorio" className="gap-1.5 text-xs">
            <BarChart3 className="h-3.5 w-3.5" />
            Relatório
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ajuste" className="mt-4">
          <AbaAjusteManual />
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <AbaHistorico />
        </TabsContent>

        <TabsContent value="relatorio" className="mt-4">
          <AbaRelatorio />
        </TabsContent>
      </Tabs>
    </div>
  );
}
