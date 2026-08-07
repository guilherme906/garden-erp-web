import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search, Eye, CheckCircle, X, AlertCircle, Clock, TrendingUp,
  Trash2, Download, Filter, ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_CONFIG = {
  PENDENTE: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  CONFIRMADO: { label: "Confirmado", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  CONVERTIDO: { label: "Convertido", color: "bg-green-100 text-green-800", icon: TrendingUp },
  CANCELADO: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: X },
};

export default function PedidosPublicos() {
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const PAGE_SIZE = 20;

  // Listar pedidos públicos
  const { data: pedidosData, isLoading, refetch } = trpc.veiling.listarPedidosPublicos.useQuery({
    status: statusFiltro as any || undefined,
    busca: busca || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  // Atualizar status
  const { mutate: atualizarStatus, isPending: isUpdating } = trpc.veiling.atualizarStatusPedido.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      refetch();
      setShowDetails(false);
    },
    onError: (err) => {
      toast.error("Erro ao atualizar status: " + (err.message || "Tente novamente"));
    },
  });

  const pedidos = pedidosData?.items || [];
  const total = pedidosData?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleStatusChange = (pedidoId: number, novoStatus: string) => {
    atualizarStatus({ id: pedidoId, status: novoStatus as any });
  };

  const handleViewDetails = (pedido: any) => {
    setSelectedPedido(pedido);
    setShowDetails(true);
  };

  const handleExport = () => {
    if (!pedidos.length) {
      toast.error("Nenhum pedido para exportar");
      return;
    }

    const csv = [
      ["ID", "Cliente", "Email", "Telefone", "Status", "Total", "Data", "Itens"],
      ...pedidos.map((p: any) => [
        p.id,
        p.clienteNome,
        p.clienteEmail,
        p.clienteTelefone,
        p.status,
        `R$ ${Number(p.total).toFixed(2)}`,
        format(new Date(p.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        p.itens?.length || 0,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `pedidos-publicos-${format(new Date(), "dd-MM-yyyy")}.csv`;
    link.click();
    toast.success("Pedidos exportados com sucesso");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Pedidos Públicos</h1>
          <p className="text-slate-600">Gerencie todos os pedidos recebidos do catálogo público</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="text-sm text-slate-600">Pendentes</div>
            <div className="text-2xl font-bold text-yellow-600">
              {pedidos.filter((p: any) => p.status === "PENDENTE").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="text-sm text-slate-600">Confirmados</div>
            <div className="text-2xl font-bold text-blue-600">
              {pedidos.filter((p: any) => p.status === "CONFIRMADO").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="text-sm text-slate-600">Convertidos</div>
            <div className="text-2xl font-bold text-green-600">
              {pedidos.filter((p: any) => p.status === "CONVERTIDO").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="text-sm text-slate-600">Total</div>
            <div className="text-2xl font-bold text-red-600">{total}</div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Search className="inline w-4 h-4 mr-2" />
                Buscar por cliente, email ou telefone
              </label>
              <Input
                placeholder="Digite para buscar..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPage(0);
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Filter className="inline w-4 h-4 mr-2" />
                Status
              </label>
              <select
                value={statusFiltro}
                onChange={(e) => {
                  setStatusFiltro(e.target.value);
                  setPage(0);
                }}
                className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
              >
                <option value="">Todos os status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="CONVERTIDO">Convertido</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Carregando pedidos...</div>
          ) : pedidos.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Nenhum pedido encontrado</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pedidos.map((pedido: any) => (
                      <tr key={pedido.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">#{pedido.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{pedido.clienteNome}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{pedido.clienteEmail}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          R$ {Number(pedido.total).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge className={STATUS_CONFIG[pedido.status as keyof typeof STATUS_CONFIG]?.color}>
                            {STATUS_CONFIG[pedido.status as keyof typeof STATUS_CONFIG]?.label || pedido.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {format(new Date(pedido.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Button
                            onClick={() => handleViewDetails(pedido)}
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Mostrando {page * PAGE_SIZE + 1} a {Math.min((page + 1) * PAGE_SIZE, total)} de {total}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    variant="outline"
                    size="sm"
                  >
                    Anterior
                  </Button>
                  <Button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    variant="outline"
                    size="sm"
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedPedido?.id}</DialogTitle>
          </DialogHeader>

          {selectedPedido && (
            <div className="space-y-6">
              {/* Informações do Cliente */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Informações do Cliente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-600">Nome</div>
                    <div className="font-medium text-slate-900">{selectedPedido.clienteNome}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Email</div>
                    <div className="font-medium text-slate-900">{selectedPedido.clienteEmail}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Telefone</div>
                    <div className="font-medium text-slate-900">{selectedPedido.clienteTelefone}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">Status</div>
                    <Badge className={STATUS_CONFIG[selectedPedido.status as keyof typeof STATUS_CONFIG]?.color}>
                      {STATUS_CONFIG[selectedPedido.status as keyof typeof STATUS_CONFIG]?.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Itens do Pedido</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedPedido.itens?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-slate-900">{item.produtoNome}</div>
                          <div className="text-slate-600">
                            {Number(item.quantidade).toFixed(2)} x R$ {Number(item.valorUnitario).toFixed(2)}
                          </div>
                        </div>
                        <div className="font-semibold text-slate-900">
                          R$ {Number(item.subtotal).toFixed(2)}
                        </div>
                      </div>
                      {item.observacao && (
                        <div className="text-xs text-slate-700 border-t border-slate-200 pt-2 mt-2">
                          <span className="font-medium">Observação:</span> {item.observacao}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-900">Total do Pedido</span>
                  <span className="text-2xl font-bold text-green-600">R$ {Number(selectedPedido.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Observações */}
              {selectedPedido.observacoes && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm font-medium text-slate-900 mb-2">Observações</div>
                  <div className="text-sm text-slate-700">{selectedPedido.observacoes}</div>
                </div>
              )}

              {/* Ações de Status */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Alterar Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <Button
                      key={status}
                      onClick={() => handleStatusChange(selectedPedido.id, status)}
                      disabled={isUpdating || selectedPedido.status === status}
                      variant={selectedPedido.status === status ? "default" : "outline"}
                      className="w-full text-xs"
                    >
                      {config.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowDetails(false)} variant="outline">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
