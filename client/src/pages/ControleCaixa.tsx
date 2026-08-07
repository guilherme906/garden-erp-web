/**
 * ControleCaixa.tsx
 * Módulo de Controle de Caixa do ERP Garden Primavera.
 * - Estado "sem caixa aberto": tela de abertura com saldo inicial
 * - Estado "caixa aberto": resumo (entradas, saídas, saldo), tabela de movimentos, modal de lançamento, botão fechar
 * - Aba de relatório por período com gráfico de barras (Recharts) e exportação PDF
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet, TrendingUp, TrendingDown, DollarSign, Plus, Minus,
  Lock, Unlock, Trash2, BarChart3, Loader2, RefreshCw, FileText,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const CATEGORIAS_ENTRADA = ["Venda", "Suprimento de Caixa", "Troco Devolvido", "Outros"];
const CATEGORIAS_SAIDA = ["Sangria", "Despesa Operacional", "Pagamento Fornecedor", "Troco", "Outros"];
const FORMAS_PAGAMENTO = ["Dinheiro", "Cartão Débito", "Cartão Crédito", "PIX", "Transferência", "Cheque", "Outros"];

function fmt(v: number | string | null | undefined) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(s: string) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Modal de Lançamento ───
function ModalLancamento({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [tipo, setTipo] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");

  const lancarMut = trpc.caixa.lancar.useMutation({
    onSuccess: () => {
      toast.success("Movimento lançado com sucesso!");
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const categorias = tipo === "ENTRADA" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  function handleSubmit() {
    const v = parseFloat(valor.replace(",", "."));
    if (!categoria) return toast.error("Selecione uma categoria.");
    if (!v || v <= 0) return toast.error("Informe um valor válido.");
    lancarMut.mutate({ tipo, categoria, descricao: descricao || undefined, valor: v, formaPagamento: formaPagamento || undefined });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-500" />
            Lançar Movimento
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setTipo("ENTRADA"); setCategoria(""); }}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                tipo === "ENTRADA"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20"
                  : "border-border text-muted-foreground hover:border-emerald-300"
              }`}
            >
              <TrendingUp className="h-4 w-4" /> Entrada
            </button>
            <button
              onClick={() => { setTipo("SAIDA"); setCategoria(""); }}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                tipo === "SAIDA"
                  ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20"
                  : "border-border text-muted-foreground hover:border-red-300"
              }`}
            >
              <TrendingDown className="h-4 w-4" /> Saída
            </button>
          </div>
          {/* Categoria */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria *</label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger><SelectValue placeholder="Selecionar categoria..." /></SelectTrigger>
              <SelectContent>
                {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Valor */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Valor (R$) *</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={valor}
              onChange={e => setValor(e.target.value)}
              className="text-lg font-bold"
            />
          </div>
          {/* Forma de Pagamento */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Forma de Pagamento</label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {FORMAS_PAGAMENTO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Descrição */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
            <Input
              placeholder="Observação opcional..."
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={lancarMut.isPending}
            className={tipo === "ENTRADA" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
          >
            {lancarMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar {tipo === "ENTRADA" ? "Entrada" : "Saída"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal de Fechar Caixa ───
function ModalFecharCaixa({ saldoAtual, onClose, onSuccess }: { saldoAtual: number; onClose: () => void; onSuccess: () => void }) {
  const [observacao, setObservacao] = useState("");
  const fecharMut = trpc.caixa.fechar.useMutation({
    onSuccess: (data) => {
      toast.success(`Caixa fechado! Saldo final: ${fmt(data.saldoFinal)}`);
      onSuccess();
      onClose();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-500" />
            Fechar Caixa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Saldo calculado</p>
            <p className="text-2xl font-bold text-orange-600">{fmt(saldoAtual)}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Observação de fechamento</label>
            <Input placeholder="Opcional..." value={observacao} onChange={e => setObservacao(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => fecharMut.mutate({ observacao: observacao || undefined })}
            disabled={fecharMut.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {fecharMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Fechar Caixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tela de Abertura de Caixa ───
function AberturaCaixa({ onSuccess }: { onSuccess: () => void }) {
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [observacao, setObservacao] = useState("");
  const abrirMut = trpc.caixa.abrir.useMutation({
    onSuccess: () => {
      toast.success("Caixa aberto com sucesso!");
      onSuccess();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 mb-4">
            <Wallet className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold">Abrir Caixa</h2>
          <p className="text-sm text-muted-foreground mt-1">Nenhum caixa aberto no momento. Informe o saldo inicial para começar.</p>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Saldo Inicial (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={saldoInicial}
                onChange={e => setSaldoInicial(e.target.value)}
                className="text-xl font-bold text-center h-12"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Observação</label>
              <Input placeholder="Opcional..." value={observacao} onChange={e => setObservacao(e.target.value)} />
            </div>
            <Button
              className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => abrirMut.mutate({ saldoInicial: parseFloat(saldoInicial.replace(",", ".")) || 0, observacao: observacao || undefined })}
              disabled={abrirMut.isPending}
            >
              {abrirMut.isPending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Unlock className="h-5 w-5 mr-2" />}
              Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Caixa Aberto ───
function CaixaAberto({ caixa, onRefetch }: { caixa: any; onRefetch: () => void }) {
  const [modalLancamento, setModalLancamento] = useState(false);
  const [modalFechar, setModalFechar] = useState(false);
  const utils = trpc.useUtils();

  const excluirMut = trpc.caixa.excluirMovimento.useMutation({
    onSuccess: () => {
      toast.success("Movimento excluído.");
      utils.caixa.getAtual.invalidate();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const sincronizarMut = trpc.caixa.sincronizarFaturados.useMutation({
    onSuccess: (data: any) => {
      utils.caixa.getAtual.invalidate();
      if (data.sincronizados === 0) {
        toast.info(data.mensagem);
      } else {
        toast.success(`${data.mensagem} Total: R$ ${Number(data.totalValor || 0).toFixed(2).replace('.', ',')}`);
      }
    },
    onError: (e) => toast.error("Erro ao sincronizar: " + e.message),
  });

  const saldoInicial = Number(caixa.saldoInicial);
  const totalEntradas = Number(caixa.totalEntradas);
  const totalSaidas = Number(caixa.totalSaidas);
  const saldoAtual = saldoInicial + totalEntradas - totalSaidas;

  const movimentos = [...(caixa.movimentos || [])].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500 text-white text-xs px-2 py-1">ABERTO</Badge>
          <span className="text-sm text-muted-foreground">Data: {fmtDate(caixa.data)}</span>
          {caixa.abertoPor && <span className="text-xs text-muted-foreground">Aberto por: {caixa.abertoPor}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => utils.caixa.getAtual.invalidate()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-blue-400 text-blue-700 hover:bg-blue-50"
            onClick={() => sincronizarMut.mutate()}
            disabled={sincronizarMut.isPending}
            title="Lançar no caixa os pedidos faturados que ainda não aparecem aqui"
          >
            {sincronizarMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
            Sincronizar Faturados
          </Button>
          <Button size="sm" onClick={() => setModalLancamento(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-3.5 w-3.5 mr-1" /> Lançar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setModalFechar(true)}>
            <Lock className="h-3.5 w-3.5 mr-1" /> Fechar Caixa
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Saldo Inicial</p>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{fmt(saldoInicial)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" /> Entradas
            </p>
            <p className="text-lg font-bold text-emerald-600">{fmt(totalEntradas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" /> Saídas
            </p>
            <p className="text-lg font-bold text-red-600">{fmt(totalSaidas)}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Wallet className="h-3 w-3 text-orange-500" /> Saldo Atual
            </p>
            <p className={`text-lg font-bold ${saldoAtual >= 0 ? "text-orange-600" : "text-red-600"}`}>{fmt(saldoAtual)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de movimentos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Movimentos ({movimentos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movimentos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
              <DollarSign className="h-8 w-8 opacity-30 mb-2" />
              <p>Nenhum movimento lançado ainda.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setModalLancamento(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Lançar primeiro movimento
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Hora</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Tipo</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Categoria</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Descrição</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Forma Pgto</th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Valor</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {movimentos.map((m: any) => (
                    <tr key={m.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant="outline"
                          className={m.tipo === "ENTRADA"
                            ? "border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 text-xs"
                            : "border-red-400 text-red-700 bg-red-50 dark:bg-red-900/10 text-xs"
                          }
                        >
                          {m.tipo === "ENTRADA" ? <TrendingUp className="h-2.5 w-2.5 mr-1" /> : <TrendingDown className="h-2.5 w-2.5 mr-1" />}
                          {m.tipo}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs">{m.categoria}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">{m.descricao || "—"}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{m.formaPagamento || "—"}</td>
                      <td className={`px-4 py-2 text-right font-semibold text-sm ${m.tipo === "ENTRADA" ? "text-emerald-600" : "text-red-600"}`}>
                        {m.tipo === "ENTRADA" ? "+" : "-"}{fmt(m.valor)}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => {
                            if (confirm(`Excluir movimento de ${fmt(m.valor)}?`)) {
                              excluirMut.mutate({ id: m.id });
                            }
                          }}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          title="Excluir movimento"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      {modalLancamento && (
        <ModalLancamento
          onClose={() => setModalLancamento(false)}
          onSuccess={() => utils.caixa.getAtual.invalidate()}
        />
      )}
      {modalFechar && (
        <ModalFecharCaixa
          saldoAtual={saldoAtual}
          onClose={() => setModalFechar(false)}
          onSuccess={() => utils.caixa.getAtual.invalidate()}
        />
      )}
    </div>
  );
}

// ─── Aba de Relatório por Período ───
function RelatorioTab() {
  const hoje = new Date().toISOString().slice(0, 10);
  const primeiroDiaMes = hoje.slice(0, 8) + "01";
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
  const [dataFim, setDataFim] = useState(hoje);

  const { data, isLoading, refetch } = trpc.caixa.relatorio.useQuery(
    { dataInicio, dataFim },
    { enabled: true }
  );

  const chartData = useMemo(() => {
    if (!data?.caixas) return [];
    return data.caixas.map((c: any) => ({
      data: fmtDate(c.data),
      Entradas: Number(c.totalEntradas),
      Saídas: Number(c.totalSaidas),
      Saldo: Number(c.saldoInicial) + Number(c.totalEntradas) - Number(c.totalSaidas),
    }));
  }, [data]);

  function exportarPDF() {
    if (!data) return;
    const linhas = data.caixas.flatMap((c: any) =>
      (c.movimentos || []).map((m: any) => `${fmtDate(c.data)} | ${m.tipo} | ${m.categoria} | ${m.descricao || ""} | ${m.formaPagamento || ""} | ${fmt(m.valor)}`)
    );
    const conteudo = [
      `Relatório de Caixa — ${fmtDate(dataInicio)} a ${fmtDate(dataFim)}`,
      `Total Entradas: ${fmt(data.totalEntradas)}`,
      `Total Saídas: ${fmt(data.totalSaidas)}`,
      `Saldo Final: ${fmt(data.saldoFinal)}`,
      "",
      "Data | Tipo | Categoria | Descrição | Forma Pgto | Valor",
      ...linhas,
    ].join("\n");
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-caixa-${dataInicio}-${dataFim}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Início</label>
          <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Data Fim</label>
          <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-40" />
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Atualizar
        </Button>
        <Button size="sm" variant="outline" onClick={exportarPDF} disabled={!data}>
          <FileText className="h-3.5 w-3.5 mr-1" /> Exportar TXT
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando...
        </div>
      ) : !data || data.caixas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
          <BarChart3 className="h-8 w-8 opacity-30 mb-2" />
          <p>Nenhum dado encontrado para o período selecionado.</p>
        </div>
      ) : (
        <>
          {/* KPIs do período */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" /> Total Entradas
                </p>
                <p className="text-xl font-bold text-emerald-600">{fmt(data.totalEntradas)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" /> Total Saídas
                </p>
                <p className="text-xl font-bold text-red-600">{fmt(data.totalSaidas)}</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Wallet className="h-3 w-3 text-orange-500" /> Saldo do Período
                </p>
                <p className={`text-xl font-bold ${data.saldoFinal >= 0 ? "text-orange-600" : "text-red-600"}`}>{fmt(data.saldoFinal)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Entradas e Saídas por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                    <Tooltip formatter={(v: any) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="Entradas" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Saídas" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Histórico de caixas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Caixas no Período ({data.caixas.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Data</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Saldo Inicial</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Entradas</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Saídas</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Saldo Final</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Movimentos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.caixas.map((c: any) => {
                      const sf = c.saldoFinal ?? (Number(c.saldoInicial) + Number(c.totalEntradas) - Number(c.totalSaidas));
                      return (
                        <tr key={c.id} className="border-b hover:bg-muted/20">
                          <td className="px-4 py-2 text-xs font-medium">{fmtDate(c.data)}</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline" className={c.status === "ABERTO" ? "border-emerald-400 text-emerald-700 text-xs" : "border-gray-400 text-gray-600 text-xs"}>
                              {c.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-right text-xs">{fmt(c.saldoInicial)}</td>
                          <td className="px-4 py-2 text-right text-xs text-emerald-600 font-medium">{fmt(c.totalEntradas)}</td>
                          <td className="px-4 py-2 text-right text-xs text-red-600 font-medium">{fmt(c.totalSaidas)}</td>
                          <td className={`px-4 py-2 text-right text-xs font-bold ${Number(sf) >= 0 ? "text-orange-600" : "text-red-600"}`}>{fmt(sf)}</td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">{(c.movimentos || []).length} mov.</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Componente Principal ───
export default function ControleCaixa() {
  const { data: caixaAtual, isLoading, refetch } = trpc.caixa.getAtual.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
            <Wallet className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Controle de Caixa</h1>
            <p className="text-xs text-muted-foreground">Abertura, lançamentos e fechamento do caixa diário</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando...
        </div>
      ) : (
        <Tabs defaultValue={caixaAtual ? "caixa" : "abrir"}>
          <TabsList className="mb-4">
            <TabsTrigger value="caixa" className="gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              {caixaAtual ? "Caixa Aberto" : "Abrir Caixa"}
            </TabsTrigger>
            <TabsTrigger value="relatorio" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Relatório por Período
            </TabsTrigger>
          </TabsList>

          <TabsContent value="caixa">
            {caixaAtual ? (
              <CaixaAberto caixa={caixaAtual} onRefetch={refetch} />
            ) : (
              <AberturaCaixa onSuccess={refetch} />
            )}
          </TabsContent>

          <TabsContent value="relatorio">
            <RelatorioTab />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
