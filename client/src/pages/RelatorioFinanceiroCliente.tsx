/**
 * RelatorioFinanceiroCliente.tsx
 * Relatório financeiro completo por cliente com filtros, PDF e compartilhamento.
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Download, Share2, Search, User, Calendar, CreditCard,
  TrendingUp, AlertCircle, CheckCircle2, Clock, XCircle, Copy, Loader2,
  ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";

const fmt = (v: number | string) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtData = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("pt-BR");
};

const STATUS_TITULO_BADGE: Record<string, { label: string; cls: string }> = {
  PAGO:      { label: "Pago",      cls: "bg-green-100 text-green-700 border-green-200" },
  PENDENTE:  { label: "Pendente",  cls: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  VENCIDO:   { label: "Vencido",   cls: "bg-red-100 text-red-700 border-red-200" },
  CANCELADO: { label: "Cancelado", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

const STATUS_PEDIDO_BADGE: Record<string, { label: string; cls: string }> = {
  AGUARDANDO: { label: "Em aberto",  cls: "bg-yellow-100 text-yellow-700" },
  APROVADO:   { label: "Aprovado",   cls: "bg-green-100 text-green-700" },
  CANCELADO:  { label: "Cancelado",  cls: "bg-red-100 text-red-700" },
  EXPIRADO:   { label: "Expirado",   cls: "bg-gray-100 text-gray-500" },
};

export default function RelatorioFinanceiroCliente() {
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [statusTitulo, setStatusTitulo] = useState<"TODOS" | "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO">("TODOS");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [secaoAberta, setSecaoAberta] = useState<"pedidos" | "titulos" | "vendas" | null>("titulos");
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [expiresHours, setExpiresHours] = useState(72);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: clientes = [] } = trpc.relatorioFinanceiro.listarClientes.useQuery();

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase())
  );

  const { data: relatorio, isLoading, refetch } = trpc.relatorioFinanceiro.getRelatorio.useQuery(
    { clienteId: clienteId!, dataInicio: dataInicio || undefined, dataFim: dataFim || undefined, statusTitulo },
    { enabled: !!clienteId, refetchOnWindowFocus: false }
  );

  const compartilharMut = trpc.relatorioFinanceiro.gerarTokenCompartilhamento.useMutation({
    onSuccess: async (data) => {
      const url = `${window.location.origin}/relatorio/${data.token}`;
      await navigator.clipboard.writeText(url);
      setLinkCopiado(true);
      toast.success("Link copiado! Válido por " + expiresHours + "h");
      setTimeout(() => setLinkCopiado(false), 3000);
    },
    onError: (e) => toast.error("Erro ao gerar link: " + e.message),
  });

  function gerarPDF() {
    if (!printRef.current) return;
    const conteudo = printRef.current.innerHTML;
    const janela = window.open("", "_blank");
    if (!janela) return;
    janela.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Financeiro - ${relatorio?.cliente?.nome || ""}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 20px; }
          h1 { font-size: 18px; color: #166534; margin-bottom: 4px; }
          h2 { font-size: 13px; color: #374151; margin: 16px 0 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
          .logo { font-size: 20px; font-weight: bold; color: #166534; }
          .meta { text-align: right; color: #6b7280; font-size: 10px; }
          .cards { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
          .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; flex: 1; min-width: 120px; }
          .card-label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .card-value { font-size: 15px; font-weight: bold; margin-top: 2px; }
          .card-value.green { color: #166534; }
          .card-value.yellow { color: #92400e; }
          .card-value.red { color: #991b1b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th { background: #f9fafb; text-align: left; padding: 6px 8px; font-size: 10px; color: #374151; border-bottom: 1px solid #e5e7eb; }
          td { padding: 5px 8px; font-size: 10px; border-bottom: 1px solid #f3f4f6; }
          tr:last-child td { border-bottom: none; }
          .badge { display: inline-block; padding: 1px 6px; border-radius: 9999px; font-size: 9px; font-weight: 600; }
          .badge-green { background: #dcfce7; color: #166534; }
          .badge-yellow { background: #fef9c3; color: #92400e; }
          .badge-red { background: #fee2e2; color: #991b1b; }
          .badge-gray { background: #f3f4f6; color: #6b7280; }
          .footer { margin-top: 20px; text-align: center; color: #9ca3af; font-size: 9px; border-top: 1px solid #e5e7eb; padding-top: 8px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>${conteudo}</body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    setTimeout(() => { janela.print(); }, 400);
  }

  const r = relatorio?.resumo;

  return (
    <div className="flex h-full gap-0">
      {/* Sidebar de seleção de cliente */}
      <div className="w-64 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
        <div className="p-3 border-b border-gray-200">
          <h2 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1.5">
            <User className="h-4 w-4 text-green-600" /> Selecionar Cliente
          </h2>
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Buscar cliente..."
              value={buscaCliente}
              onChange={e => setBuscaCliente(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {clientesFiltrados.map(c => (
            <button
              key={c.id}
              onClick={() => setClienteId(c.id)}
              className={`w-full text-left px-3 py-2.5 text-xs border-b border-gray-100 hover:bg-green-50 transition-colors ${
                clienteId === c.id ? "bg-green-100 text-green-800 font-semibold" : "text-gray-700"
              }`}
            >
              <div className="font-medium truncate">{c.nome}</div>
              {c.telefone && <div className="text-gray-400 text-[10px]">{c.telefone}</div>}
            </button>
          ))}
          {clientesFiltrados.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6">Nenhum cliente encontrado</p>
          )}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {!clienteId ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <FileText className="h-12 w-12 opacity-30" />
            <p className="text-sm">Selecione um cliente para ver o relatório financeiro</p>
          </div>
        ) : (
          <>
            {/* Barra de filtros */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2.5 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>Período:</span>
              </div>
              <Input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="h-7 text-xs w-36"
              />
              <span className="text-xs text-gray-400">até</span>
              <Input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="h-7 text-xs w-36"
              />
              <Select value={statusTitulo} onValueChange={v => setStatusTitulo(v as any)}>
                <SelectTrigger className="h-7 text-xs w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os status</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                  <SelectItem value="VENCIDO">Vencido</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => refetch()}>
                <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
              </Button>
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => compartilharMut.mutate({ clienteId: clienteId!, dataInicio: dataInicio || undefined, dataFim: dataFim || undefined, statusTitulo, expiresHours })}
                  disabled={compartilharMut.isPending}
                >
                  {compartilharMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : linkCopiado ? <Copy className="h-3 w-3 text-green-600" /> : <Share2 className="h-3 w-3" />}
                  {linkCopiado ? "Copiado!" : "Compartilhar"}
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
                  onClick={gerarPDF}
                  disabled={!relatorio}
                >
                  <Download className="h-3 w-3" /> PDF
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center flex-1 gap-2 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Carregando relatório...</span>
              </div>
            ) : relatorio ? (
              <div ref={printRef} className="p-4 space-y-4">
                {/* Cabeçalho do relatório (visível no PDF) */}
                <div className="header">
                  <div>
                    <div className="logo">Garden Center Primavera</div>
                    <div className="text-xs text-gray-500 mt-0.5">Sistema de Gestão Comercial</div>
                  </div>
                  <div className="meta text-right text-xs text-gray-400">
                    <div>Relatório gerado em {new Date().toLocaleDateString("pt-BR")} {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                    {(dataInicio || dataFim) && (
                      <div>Período: {dataInicio ? fmtData(dataInicio) : "início"} — {dataFim ? fmtData(dataFim) : "hoje"}</div>
                    )}
                  </div>
                </div>

                {/* Dados do cliente */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h1 className="text-lg font-bold text-green-800">{relatorio.cliente.nome}</h1>
                  <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-600">
                    {relatorio.cliente.telefone && <span>📞 {relatorio.cliente.telefone}</span>}
                    {relatorio.cliente.email && <span>✉ {relatorio.cliente.email}</span>}
                  </div>
                </div>

                {/* Cards de resumo */}
                <div className="cards grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="card bg-white border border-gray-200 rounded-lg p-3">
                    <div className="card-label text-xs text-gray-500 uppercase tracking-wide">Total Pedidos</div>
                    <div className="card-value text-lg font-bold text-gray-800">{fmt(r?.totalPedidos || 0)}</div>
                    <div className="text-xs text-gray-400">{r?.qtdPedidos} pedido(s)</div>
                  </div>
                  <div className="card bg-white border border-green-200 rounded-lg p-3">
                    <div className="card-label text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> Pago</div>
                    <div className="card-value text-lg font-bold text-green-700">{fmt(r?.totalTitulosPago || 0)}</div>
                  </div>
                  <div className="card bg-white border border-yellow-200 rounded-lg p-3">
                    <div className="card-label text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Clock className="h-3 w-3 text-yellow-600" /> Pendente</div>
                    <div className="card-value text-lg font-bold text-yellow-700">{fmt(r?.totalTitulosPendente || 0)}</div>
                  </div>
                  <div className="card bg-white border border-red-200 rounded-lg p-3">
                    <div className="card-label text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><AlertCircle className="h-3 w-3 text-red-600" /> Vencido</div>
                    <div className="card-value text-lg font-bold text-red-700">{fmt(r?.totalTitulosVencido || 0)}</div>
                  </div>
                </div>

                {/* Formas de pagamento */}
                {Object.keys(r?.porFormaPagamento || {}).length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-blue-500" /> Recebido por Forma de Pagamento
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(r!.porFormaPagamento).map(([fp, val]) => (
                        <div key={fp} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-1.5">
                          <span className="text-xs font-medium text-blue-800">{fp}</span>
                          <span className="text-xs font-bold text-blue-900">{fmt(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seção: Títulos Financeiros */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setSecaoAberta(secaoAberta === "titulos" ? null : "titulos")}
                  >
                    <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-purple-500" />
                      Títulos Financeiros
                      <span className="ml-1 text-xs font-normal text-gray-400">({relatorio.titulos.length})</span>
                    </h2>
                    {secaoAberta === "titulos" ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                  {secaoAberta === "titulos" && (
                    <div className="overflow-x-auto">
                      {relatorio.titulos.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">Nenhum título encontrado</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Pedido</th>
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Emissão</th>
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Vencimento</th>
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Pagamento</th>
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Forma Pgto</th>
                              <th className="text-right px-3 py-2 text-gray-600 font-medium">Valor</th>
                              <th className="text-center px-3 py-2 text-gray-600 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relatorio.titulos.map(t => {
                              const cfg = STATUS_TITULO_BADGE[t.status] || STATUS_TITULO_BADGE.PENDENTE;
                              return (
                                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="px-3 py-2 text-blue-600 font-mono">#{t.vendaId}</td>
                                  <td className="px-3 py-2 text-gray-600">{fmtData(t.dataEmissao)}</td>
                                  <td className="px-3 py-2 text-gray-600">{fmtData(t.dataVencimento)}</td>
                                  <td className="px-3 py-2 text-gray-600">{fmtData(t.dataPagamento)}</td>
                                  <td className="px-3 py-2 text-gray-600">{t.formaPagamentoNome || "—"}</td>
                                  <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmt(t.valor)}</td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}>
                                      {cfg.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 border-t border-gray-200 font-semibold">
                              <td colSpan={5} className="px-3 py-2 text-gray-700 text-right">Total:</td>
                              <td className="px-3 py-2 text-right text-gray-800">
                                {fmt(relatorio.titulos.reduce((s, t) => s + parseFloat(t.valor || "0"), 0))}
                              </td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      )}
                    </div>
                  )}
                </div>

                {/* Seção: Pedidos / Orçamentos */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setSecaoAberta(secaoAberta === "pedidos" ? null : "pedidos")}
                  >
                    <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-orange-500" />
                      Pedidos / Orçamentos
                      <span className="ml-1 text-xs font-normal text-gray-400">({relatorio.pedidos.length})</span>
                    </h2>
                    {secaoAberta === "pedidos" ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                  {secaoAberta === "pedidos" && (
                    <div className="overflow-x-auto">
                      {relatorio.pedidos.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">Nenhum pedido encontrado</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Nº Pedido</th>
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Data</th>
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Vendedor</th>
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Entrega</th>
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Logística</th>
                              <th className="text-right px-3 py-2 text-gray-600 font-medium">Frete</th>
                              <th className="text-right px-3 py-2 text-gray-600 font-medium">Total</th>
                              <th className="text-center px-3 py-2 text-gray-600 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relatorio.pedidos.map(p => {
                              const cfg = STATUS_PEDIDO_BADGE[p.status] || STATUS_PEDIDO_BADGE.AGUARDANDO;
                              return (
                                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="px-3 py-2 text-blue-600 font-mono font-semibold">#{p.id}</td>
                                  <td className="px-3 py-2 text-gray-600">{p.data}</td>
                                  <td className="px-3 py-2 text-gray-600">{p.vendedorNome || "—"}</td>
                                  <td className="px-3 py-2 text-gray-600">{p.dataEntrega || "—"}</td>
                                  <td className="px-3 py-2 text-gray-600">{p.logistica || "—"}</td>
                                  <td className="px-3 py-2 text-right text-gray-600">{parseFloat(p.frete || "0") > 0 ? fmt(p.frete) : "—"}</td>
                                  <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmt(p.total)}</td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>
                                      {cfg.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 border-t border-gray-200 font-semibold">
                              <td colSpan={6} className="px-3 py-2 text-gray-700 text-right">Total:</td>
                              <td className="px-3 py-2 text-right text-gray-800">{fmt(r?.totalPedidos || 0)}</td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      )}
                    </div>
                  )}
                </div>

                {/* Seção: Vendas Efetivas */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => setSecaoAberta(secaoAberta === "vendas" ? null : "vendas")}
                  >
                    <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Vendas Efetivas
                      <span className="ml-1 text-xs font-normal text-gray-400">({relatorio.vendasEfetivas.length})</span>
                    </h2>
                    {secaoAberta === "vendas" ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                  {secaoAberta === "vendas" && (
                    <div className="overflow-x-auto">
                      {relatorio.vendasEfetivas.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">Nenhuma venda efetiva encontrada</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Orçamento</th>
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Data Venda</th>
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Data Entrega</th>
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Vendedor</th>
                              <th className="text-left px-3 py-2 text-gray-600 font-medium">Forma Pgto</th>
                              <th className="text-right px-3 py-2 text-gray-600 font-medium">Total</th>
                              <th className="text-center px-3 py-2 text-gray-600 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relatorio.vendasEfetivas.map(v => (
                              <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-3 py-2 text-blue-600 font-mono">{v.orcamentoNum || `#${v.orcamentoId}`}</td>
                                <td className="px-3 py-2 text-gray-600">{v.dataVenda}</td>
                                <td className="px-3 py-2 text-gray-600">{v.dataEntrega || "—"}</td>
                                <td className="px-3 py-2 text-gray-600">{v.vendedorNome || "—"}</td>
                                <td className="px-3 py-2 text-gray-600">{v.formaPagamento || "—"}</td>
                                <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmt(v.total)}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    v.status === "ENTREGUE" ? "bg-green-100 text-green-700" :
                                    v.status === "CANCELADA" ? "bg-red-100 text-red-700" :
                                    "bg-yellow-100 text-yellow-700"
                                  }`}>
                                    {v.status === "ENTREGUE" ? "Entregue" : v.status === "CANCELADA" ? "Cancelada" : "Pendente"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 border-t border-gray-200 font-semibold">
                              <td colSpan={5} className="px-3 py-2 text-gray-700 text-right">Total:</td>
                              <td className="px-3 py-2 text-right text-gray-800">{fmt(r?.totalVendasEfetivas || 0)}</td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      )}
                    </div>
                  )}
                </div>

                {/* Rodapé do PDF */}
                <div className="footer text-center text-xs text-gray-400 pt-3 border-t border-gray-200">
                  Garden Center Primavera — Relatório Financeiro gerado em {new Date().toLocaleDateString("pt-BR")}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
