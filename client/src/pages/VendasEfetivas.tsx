import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CheckCircle, Truck, XCircle, RefreshCw, TrendingUp, Search,
  FileText, Loader2, Package, Printer, AlertCircle,
} from "lucide-react";
import { useErpAuth } from "@/contexts/ErpAuthContext";

type StatusFilter = "todos" | "PENDENTE" | "ENTREGUE" | "CANCELADA";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDENTE: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <RefreshCw className="h-3 w-3" /> },
  ENTREGUE: { label: "Entregue", color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle className="h-3 w-3" /> },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-3 w-3" /> },
};

function formatCurrency(val: string | number | null | undefined) {
  const n = Number(val ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/// ─── Modal somente leitura do pedido original ───
function ModalVerPedido({ orcamentoId, orcamentoNum, vendaEfetiva, onClose }: {
  orcamentoId: number;
  orcamentoNum: string;
  vendaEfetiva?: any; // dados da venda efetiva para fallback quando orçamento original foi deletado
  onClose: () => void;
}) {
  const { data: venda, isLoading } = trpc.vendas.get.useQuery({ id: orcamentoId });

  // Usar dados do orçamento original ou fallback para venda efetiva
  const dadosExibir = venda || (vendaEfetiva ? {
    clienteNome: vendaEfetiva.clienteNome,
    vendedorNome: vendaEfetiva.vendedorNome,
    data: vendaEfetiva.dataVenda,
    status: 'FATURADO',
    total: Number(vendaEfetiva.total),
    dataEntrega: vendaEfetiva.dataEntrega,
    observacaoPedido: vendaEfetiva.observacao,
    itens: vendaEfetiva.itensSnapshot || [],
  } : null);

  function imprimirSegundaVia() {
    if (!dadosExibir) return;
    const itens = dadosExibir.itens || [];
    const linhasItens = itens.map((item: any, i: number) => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:6px 8px">${i + 1}</td>
        <td style="padding:6px 8px">${item.produtoNome}${item.observacao ? `<br><small style="color:#666">${item.observacao}</small>` : ''}</td>
        <td style="padding:6px 8px;text-align:right">${Number(item.quantidade).toLocaleString('pt-BR')}</td>
        <td style="padding:6px 8px;text-align:right">${Number(item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:600">${Number(item.subtotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      </tr>`).join('');
    const total = Number(dadosExibir.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Pedido ${orcamentoNum}</title>
      <style>body{font-family:Arial,sans-serif;font-size:13px;margin:20px}h2{margin-bottom:4px}table{width:100%;border-collapse:collapse}th{background:#f5f5f5;padding:6px 8px;text-align:left;font-size:12px}@media print{body{margin:10px}}</style>
      </head><body>
      <h2>Garden Primavera — Segunda Via</h2>
      <p style="margin:2px 0"><strong>Pedido:</strong> ${orcamentoNum} &nbsp;&nbsp; <strong>Data:</strong> ${dadosExibir.data || vendaEfetiva?.dataVenda || '—'}</p>
      <p style="margin:2px 0"><strong>Cliente:</strong> ${dadosExibir.clienteNome || '—'} &nbsp;&nbsp; <strong>Vendedor:</strong> ${dadosExibir.vendedorNome || '—'}</p>
      ${dadosExibir.dataEntrega ? `<p style="margin:2px 0"><strong>Entrega:</strong> ${dadosExibir.dataEntrega}</p>` : ''}
      ${dadosExibir.observacaoPedido ? `<p style="margin:2px 0"><strong>Obs:</strong> ${dadosExibir.observacaoPedido}</p>` : ''}
      <br>
      <table><thead><tr><th>#</th><th>Produto</th><th style="text-align:right">Qtd</th><th style="text-align:right">Unit.</th><th style="text-align:right">Subtotal</th></tr></thead>
      <tbody>${linhasItens}</tbody>
      <tfoot><tr><td colspan="4" style="text-align:right;padding:8px;font-weight:600">Total:</td><td style="padding:8px;text-align:right;font-size:15px;font-weight:700;color:#e65c00">${total}</td></tr></tfoot>
      </table>
      ${itens.length === 0 ? '<p style="color:#999;text-align:center;padding:20px">Itens não disponíveis (orçamento original foi excluído)</p>' : ''}
      </body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            Pedido {orcamentoNum} — Somente Leitura
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando pedido...
          </div>
        ) : !dadosExibir ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
            <Package className="h-8 w-8 opacity-30 mb-2" />
            <p>Pedido não encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Aviso quando usando dados de fallback (orçamento original deletado) */}
            {!venda && vendaEfetiva && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Orçamento original não encontrado</p>
                  <p className="text-xs text-amber-700 mt-0.5">Exibindo dados registrados no momento da conversão.{(dadosExibir as any)?.itens?.length === 0 ? ' Os itens não estão disponíveis pois o orçamento foi excluído antes de ser salvo com snapshot.' : ''}</p>
                </div>
              </div>
            )}
            {/* Cabeçalho do pedido */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-muted/30 border text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium">{dadosExibir.clienteNome || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendedor</p>
                <p className="font-medium">{dadosExibir.vendedorNome || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="font-medium">{dadosExibir.data || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant="outline" className="text-xs mt-0.5">
                  {dadosExibir.status}
                </Badge>
              </div>
              {(dadosExibir as any).logistica && (
                <div>
                  <p className="text-xs text-muted-foreground">Logística</p>
                  <p className="font-medium">{(dadosExibir as any).logistica}</p>
                </div>
              )}
              {dadosExibir.dataEntrega && (
                <div>
                  <p className="text-xs text-muted-foreground">Data de Entrega</p>
                  <p className="font-medium">{dadosExibir.dataEntrega}</p>
                </div>
              )}
              {(dadosExibir as any).telefoneCliente && (
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-medium">{(dadosExibir as any).telefoneCliente}</p>
                </div>
              )}
              {dadosExibir.observacaoPedido && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Observação</p>
                  <p className="font-medium">{dadosExibir.observacaoPedido}</p>
                </div>
              )}
            </div>

            {/* Itens do pedido */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Itens do Pedido ({(dadosExibir.itens || []).length})
              </h3>
              {(dadosExibir.itens || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Itens não disponíveis (orçamento original foi excluído antes do registro do snapshot).</p>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Produto</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Qtd</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Valor Unit.</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(dadosExibir.itens || []).map((item: any, idx: number) => (
                        <tr key={item.id ?? idx} className="hover:bg-muted/20">
                          <td className="px-3 py-2">
                            <p className="font-medium text-sm">{item.produtoNome}</p>
                            {item.observacao && (
                              <p className="text-xs text-muted-foreground">{item.observacao}</p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-sm">{item.quantidade}</td>
                          <td className="px-3 py-2 text-right text-sm">{formatCurrency(item.valorUnitario)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-sm">{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t bg-muted/20">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right text-sm font-semibold">Total do Pedido:</td>
                        <td className="px-3 py-2 text-right text-base font-bold text-orange-600">
                          {formatCurrency(dadosExibir.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Rodapé — fechar e imprimir segunda via */}
            <div className="flex justify-end items-center pt-2 border-t gap-2">
              <p className="text-xs text-muted-foreground italic mr-auto">
                Este pedido foi convertido em venda efetiva e não pode ser alterado.
              </p>
              <Button variant="outline" className="gap-1.5" onClick={imprimirSegundaVia}>
                <Printer className="h-4 w-4" /> Imprimir 2ª Via
              </Button>
              <Button variant="outline" onClick={onClose}>Fechar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function VendasEfetivas() {
  const { erpUser } = useErpAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [search, setSearch] = useState("");
  const [pedidoModal, setPedidoModal] = useState<{ id: number; num: string; vendaEfetiva?: any } | null>(null);

  const { data: vendas = [], isLoading, refetch } = trpc.vendasEfetivas.list.useQuery(
    { status: statusFilter, search },
    { refetchInterval: 60000 }
  );

  const updateStatus = trpc.vendasEfetivas.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Status atualizado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const sincronizarMut = trpc.vendasEfetivas.sincronizarFaturados.useMutation({
    onSuccess: (data: any) => {
      refetch();
      if (data.sincronizados === 0) {
        toast.info(data.mensagem);
      } else {
        toast.success(data.mensagem);
      }
    },
    onError: (e: any) => toast.error("Erro ao sincronizar: " + e.message),
  });

  const filtered = vendas.filter(v => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (v.clienteNome ?? "").toLowerCase().includes(s) ||
      (v.orcamentoNum ?? "").toLowerCase().includes(s) ||
      (v.vendedorNome ?? "").toLowerCase().includes(s)
    );
  });

  const totalEntregue = vendas.filter(v => v.status === "ENTREGUE").reduce((s, v) => s + Number(v.total), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Vendas Efetivas</h1>
            <p className="text-sm text-muted-foreground">Orçamentos convertidos em vendas</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-blue-400 text-blue-700 hover:bg-blue-50"
          onClick={() => sincronizarMut.mutate()}
          disabled={sincronizarMut.isPending}
          title="Adicionar à lista todos os pedidos faturados que ainda não aparecem aqui"
        >
          {sincronizarMut.isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
          Sincronizar Faturados
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total de Vendas</p>
          <p className="text-2xl font-bold mt-1">{vendas.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{vendas.filter(v => v.status === "PENDENTE").length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Entregues</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{vendas.filter(v => v.status === "ENTREGUE").length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Entregue</p>
          <p className="text-lg font-bold mt-1 text-green-600">{formatCurrency(totalEntregue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, orçamento ou vendedor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="ENTREGUE">Entregue</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <TrendingUp className="h-8 w-8 opacity-30" />
            <p className="text-sm">Nenhuma venda efetiva encontrada</p>
            <p className="text-xs">Converta orçamentos aprovados na tela de Orçamentos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Orçamento</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Vendedor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Data Venda</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Entrega</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Forma Pgto</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(v => {
                  const st = STATUS_LABELS[v.status] ?? STATUS_LABELS.PENDENTE;
                  return (
                    <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-primary">{v.orcamentoNum ?? `#${v.orcamentoId}`}</td>
                      <td className="px-4 py-3 font-medium">{v.clienteNome ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{v.vendedorNome ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{v.dataVenda}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{v.dataEntrega ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{v.formaPagamento ?? "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(v.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${st.color}`}>
                          {st.icon}{st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {/* Botão Ver Pedido — somente leitura */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-blue-700 border-blue-300 hover:bg-blue-50"
                            onClick={() => setPedidoModal({ id: v.orcamentoId, num: v.orcamentoNum ?? `#${v.orcamentoId}`, vendaEfetiva: v })}
                          >
                            <FileText className="h-3 w-3" /> Ver Pedido
                          </Button>

                          {v.status === "PENDENTE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                              onClick={() => updateStatus.mutate({ id: v.id, status: "ENTREGUE" })}
                              disabled={updateStatus.isPending}
                            >
                              <Truck className="h-3 w-3" /> Entregue
                            </Button>
                          )}
                          {v.status !== "CANCELADA" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-red-700 border-red-300 hover:bg-red-50"
                              onClick={() => updateStatus.mutate({ id: v.id, status: "CANCELADA" })}
                              disabled={updateStatus.isPending}
                            >
                              <XCircle className="h-3 w-3" /> Cancelar
                            </Button>
                          )}
                          {v.status === "CANCELADA" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => updateStatus.mutate({ id: v.id, status: "PENDENTE" })}
                              disabled={updateStatus.isPending}
                            >
                              <RefreshCw className="h-3 w-3" /> Reativar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal somente leitura do pedido */}
      {pedidoModal && (
        <ModalVerPedido
          orcamentoId={pedidoModal.id}
          orcamentoNum={pedidoModal.num}
          vendaEfetiva={pedidoModal.vendaEfetiva}
          onClose={() => setPedidoModal(null)}
        />
      )}
    </div>
  );
}
