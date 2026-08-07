import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, X, Loader2, ShoppingBag, ExternalLink, RefreshCw,
  CheckCircle2, Clock, XCircle, ArrowRight, ChevronLeft, ChevronRight,
  Phone, Mail, MessageCircle, Package,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDENTE: { label: "Pendente", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400", icon: Clock },
  CONFIRMADO: { label: "Confirmado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", icon: CheckCircle2 },
  CONVERTIDO: { label: "Convertido", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", icon: ArrowRight },
  CANCELADO: { label: "Cancelado", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-muted text-muted-foreground", icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

const PAGE_SIZE = 25;

export default function PedidosRecebidos() {
  const [busca, setBusca] = useState("");
  const [buscaInput, setBuscaInput] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);

  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.veiling.listarPedidosPublicos.useQuery({
    status: statusFiltro as any || undefined,
    busca: busca || undefined,
    limit: PAGE_SIZE,
    offset: currentPage * PAGE_SIZE,
  }, {
    refetchOnWindowFocus: false,
    refetchInterval: 30000, // Atualiza a cada 30s automaticamente
  });

  const [convertendoId, setConvertendoId] = useState<number | null>(null);

  const converterMutation = trpc.veiling.converterEmOrcamento.useMutation({
    onSuccess: (data, variables) => {
      utils.veiling.listarPedidosPublicos.invalidate();
      // Atualizar o pedido selecionado localmente para refletir o vendaId
      setPedidoSelecionado((prev: any) => prev ? { ...prev, vendaId: data.vendaId, status: 'CONVERTIDO' } : prev);
      toast.success(`Orçamento #${data.vendaId} criado com sucesso!`, {
        action: {
          label: 'Ver Orçamento',
          onClick: () => window.dispatchEvent(new CustomEvent('erp-open-tab', { detail: 'vendas' })),
        },
      });
    },
    onError: (err) => toast.error(err.message || 'Erro ao converter pedido'),
    onSettled: () => setConvertendoId(null),
  });

  const handleConverter = async (pedidoId: number) => {
    setConvertendoId(pedidoId);
    converterMutation.mutate({ id: pedidoId });
  };

  const atualizarStatusMutation = trpc.veiling.atualizarStatusPedido.useMutation({
    onSuccess: () => {
      utils.veiling.listarPedidosPublicos.invalidate();
      toast.success("Status atualizado com sucesso!");
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar status"),
  });

  const pedidos = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleAtualizarStatus = async (id: number, novoStatus: string) => {
    setAtualizandoStatus(true);
    try {
      await atualizarStatusMutation.mutateAsync({ id, status: novoStatus as any });
      // Atualizar pedido selecionado se estiver aberto
      if (pedidoSelecionado?.id === id) {
        setPedidoSelecionado((prev: any) => prev ? { ...prev, status: novoStatus } : prev);
      }
    } finally {
      setAtualizandoStatus(false);
    }
  };

  const abrirDetalhes = (pedido: any) => {
    setPedidoSelecionado(pedido);
    setShowDetalhes(true);
  };

  const formatarData = (ts: any) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatarMoeda = (val: any) => {
    const n = Number(val);
    if (isNaN(n)) return "—";
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b bg-card shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingBag className="h-5 w-5 text-orange-500 shrink-0" />
          <div>
            <div className="font-semibold text-sm">Pedidos Recebidos</div>
            <div className="text-xs text-muted-foreground">Pedidos do catálogo público Veiling</div>
          </div>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b bg-muted/30">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-8 pl-8 pr-8 text-xs" placeholder="Buscar por cliente, e-mail ou telefone..."
            value={buscaInput}
            onChange={(e) => {
              const v = e.target.value;
              setBuscaInput(v);
              clearTimeout((window as any).__pedidosBuscaTimer);
              (window as any).__pedidosBuscaTimer = setTimeout(() => {
                setBusca(v);
                setCurrentPage(0);
              }, 350);
            }}
          />
          {buscaInput && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => {
              setBuscaInput(""); setBusca(""); setCurrentPage(0);
            }}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filtro de status */}
        <div className="flex gap-1 flex-wrap">
          {["", "PENDENTE", "CONFIRMADO", "CONVERTIDO", "CANCELADO"].map((s) => (
            <button
              key={s || "todos"}
              className={`px-2 py-1 rounded text-xs border transition-colors ${statusFiltro === s ? "bg-orange-500 text-white border-orange-500" : "bg-background hover:bg-muted border-border"}`}
              onClick={() => { setStatusFiltro(s); setCurrentPage(0); }}
            >
              {s ? (STATUS_CONFIG[s]?.label ?? s) : "Todos"}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          {isLoading ? "Carregando..." : `${total} pedidos`}
        </span>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <ShoppingBag className="h-12 w-12 opacity-20" />
            <p className="text-sm">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <tr className="border-b">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Cliente</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Contato</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Data</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Total</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Orçamento</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido: any) => (
                <tr
                  key={pedido.id}
                  className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => abrirDetalhes(pedido)}
                >
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">#{pedido.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{pedido.clienteNome}</div>
                    <div className="text-xs text-muted-foreground md:hidden">{pedido.clienteTelefone}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-xs text-muted-foreground">{pedido.clienteEmail}</div>
                    <div className="text-xs text-muted-foreground">{pedido.clienteTelefone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {formatarData(pedido.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                    {formatarMoeda(pedido.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={pedido.status} />
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    {pedido.vendaId ? (
                      <button
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.dispatchEvent(new CustomEvent("erp-open-tab", { detail: "vendas" }));
                        }}
                        title={`Orçamento #${pedido.vendaId} gerado`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Orç. #{pedido.vendaId}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      {pedido.status === "PENDENTE" && (
                        <>
                          <button
                            className="px-2 py-1 rounded text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400 font-medium transition-colors"
                            onClick={() => handleAtualizarStatus(pedido.id, "CONFIRMADO")}
                            disabled={atualizandoStatus}
                          >
                            Confirmar
                          </button>
                          <button
                            className="px-2 py-1 rounded text-[10px] bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 font-medium transition-colors"
                            onClick={() => handleAtualizarStatus(pedido.id, "CANCELADO")}
                            disabled={atualizandoStatus}
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {pedido.status === "CONFIRMADO" && (
                        <button
                          className="px-2 py-1 rounded text-[10px] bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 font-medium transition-colors"
                          onClick={() => handleAtualizarStatus(pedido.id, "CANCELADO")}
                          disabled={atualizandoStatus}
                        >
                          Cancelar
                        </button>
                      )}
                      {(pedido.status === "CONVERTIDO" || pedido.status === "CANCELADO") && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-3 border-t bg-card">
          <Button
            variant="outline" size="sm"
            disabled={currentPage === 0 || isLoading}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Página {currentPage + 1} de {totalPages}
          </span>
          <Button
            variant="outline" size="sm"
            disabled={currentPage >= totalPages - 1 || isLoading}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-500" />
              Pedido #{pedidoSelecionado?.id}
            </DialogTitle>
            <DialogDescription>
              Recebido em {formatarData(pedidoSelecionado?.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {pedidoSelecionado && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <StatusBadge status={pedidoSelecionado.status} />
                {pedidoSelecionado.vendaId && (
                  <button
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("erp-open-tab", { detail: "vendas" }));
                      setShowDetalhes(false);
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver Orçamento #{pedidoSelecionado.vendaId}
                  </button>
                )}
              </div>

              {/* Dados do cliente */}
              <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                <div className="font-semibold text-sm">{pedidoSelecionado.clienteNome}</div>
                <div className="flex flex-col gap-1">
                  {pedidoSelecionado.clienteEmail && (
                    <a
                      href={`mailto:${pedidoSelecionado.clienteEmail}`}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {pedidoSelecionado.clienteEmail}
                    </a>
                  )}
                  {pedidoSelecionado.clienteTelefone && (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${pedidoSelecionado.clienteTelefone}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {pedidoSelecionado.clienteTelefone}
                      </a>
                      <a
                        href={`https://wa.me/55${pedidoSelecionado.clienteTelefone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              {pedidoSelecionado.observacoes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Observações</div>
                  <div className="text-xs text-yellow-800 dark:text-yellow-300">{pedidoSelecionado.observacoes}</div>
                </div>
              )}

              {/* Itens do pedido */}
              {Array.isArray(pedidoSelecionado.itens) && pedidoSelecionado.itens.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    Itens do Pedido ({pedidoSelecionado.itens.length})
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-auto">
                    {pedidoSelecionado.itens.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-muted/30 rounded px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.produtoNome}</div>
                          <div className="text-muted-foreground">{item.quantidade}x {formatarMoeda(item.valorUnitario)}</div>
                        </div>
                        <div className="font-semibold text-green-600 dark:text-green-400 ml-2">
                          {formatarMoeda(item.subtotalVenda ?? item.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center pt-2 border-t font-bold">
                <span>Total do Pedido</span>
                <span className="text-green-600 dark:text-green-400 text-lg">{formatarMoeda(pedidoSelecionado.total)}</span>
              </div>

              {/* Ações de status */}
              {pedidoSelecionado.status === "PENDENTE" && (
                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                    disabled={atualizandoStatus}
                    onClick={() => handleAtualizarStatus(pedidoSelecionado.id, "CONFIRMADO")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Confirmar Pedido
                  </Button>
                  <Button
                    variant="destructive" size="sm"
                    disabled={atualizandoStatus}
                    onClick={() => handleAtualizarStatus(pedidoSelecionado.id, "CANCELADO")}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              )}
              {pedidoSelecionado.status === "CONFIRMADO" && !pedidoSelecionado.vendaId && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                    disabled={convertendoId === pedidoSelecionado.id}
                    onClick={() => handleConverter(pedidoSelecionado.id)}
                  >
                    {convertendoId === pedidoSelecionado.id ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Convertendo...</>
                    ) : (
                      <><ArrowRight className="h-4 w-4 mr-1" />Converter em Orçamento</>
                    )}
                  </Button>
                  <Button
                    variant="destructive" size="sm"
                    disabled={atualizandoStatus}
                    onClick={() => handleAtualizarStatus(pedidoSelecionado.id, "CANCELADO")}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {/* Aviso de já convertido */}
              {pedidoSelecionado.vendaId && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-green-700 dark:text-green-400">Pedido já convertido</div>
                    <div className="text-xs text-green-600 dark:text-green-500">Orçamento #{pedidoSelecionado.vendaId} foi gerado</div>
                  </div>
                  <button
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold whitespace-nowrap"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('erp-open-tab', { detail: 'vendas' }));
                      setShowDetalhes(false);
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver Orçamento #{pedidoSelecionado.vendaId}
                  </button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetalhes(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
