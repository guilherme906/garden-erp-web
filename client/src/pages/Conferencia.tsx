import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Search,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Package,
  User,
  Phone,
  Calendar,
  Hash,
  Loader2,
  ChevronDown,
  ChevronUp,
  Truck,
} from "lucide-react";

type ConferenciaTipo = "separacao" | "entrega";

export default function Conferencia() {
  const { erpUser } = useErpAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [expandedPedido, setExpandedPedido] = useState<number | null>(null);
  const [conferenciaTipo, setConferenciaTipo] = useState<ConferenciaTipo>("separacao");
  const [qtdConferidas, setQtdConferidas] = useState<Record<number, string>>({});
  const [salvando, setSalvando] = useState(false);

  const { data: pedidos, isLoading, refetch } = trpc.conferencia.buscar.useQuery(
    { search: searchKey },
    { enabled: !!searchKey }
  );

  const salvarMut = trpc.conferencia.salvar.useMutation();
  const salvarMut2 = trpc.conferencia.salvar2.useMutation();

  const handleSearch = useCallback(() => {
    if (!searchTerm.trim()) {
      toast.error("Digite algo para buscar");
      return;
    }
    setSearchKey(searchTerm.trim());
    setExpandedPedido(null);
    setQtdConferidas({});
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const togglePedido = (pedidoId: number, tipo: ConferenciaTipo) => {
    if (expandedPedido === pedidoId && conferenciaTipo === tipo) {
      setExpandedPedido(null);
      return;
    }
    setExpandedPedido(pedidoId);
    setConferenciaTipo(tipo);
    setQtdConferidas({});
  };

  const handleSalvarConferencia = async (pedidoId: number, itens: any[]) => {
    if (!erpUser) return;
    setSalvando(true);
    try {
      const itensConferidos = itens.map((item) => ({
        itemId: item.id,
        qtdConferida: qtdConferidas[item.id] || "0",
      }));
      if (conferenciaTipo === "separacao") {
        await salvarMut.mutateAsync({
          vendaId: pedidoId,
          itens: itensConferidos,
          conferidoPor: erpUser.nome,
        });
      } else {
        await salvarMut2.mutateAsync({
          vendaId: pedidoId,
          itens: itensConferidos,
          conferidoPor: erpUser.nome,
        });
      }
      const label = conferenciaTipo === "separacao" ? "Separação" : "Entrega";
      toast.success(`${label} do pedido #${pedidoId} conferida por ${erpUser.nome}`);
      refetch();
      setExpandedPedido(null);
    } catch (err: any) {
      toast.error(`Erro ao salvar conferência: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const algumItemPreenchido = Object.values(qtdConferidas).some((v) => v !== "" && v !== undefined);

  const getDivergencia = (qtdOriginal: string, qtdConf: string) => {
    const orig = parseFloat(qtdOriginal || "0");
    const conf = parseFloat(qtdConf || "0");
    if (conf === orig) return null;
    return conf - orig;
  };

  return (
    <div className="p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <ClipboardCheck className="h-6 sm:h-7 w-6 sm:w-7 text-green-700" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Conferência de Pedidos</h1>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <ClipboardCheck className="h-4 w-4 text-green-600" />
          <span>1ª Conf. = Separação</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Truck className="h-4 w-4 text-blue-600" />
          <span>2ª Conf. = Entrega</span>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="bg-white border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
        <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
          Busque pelo <strong>número do pedido</strong>, <strong>nome do cliente</strong> ou <strong>telefone</strong>
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: 123, João Silva, 11999..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-base sm:text-lg h-11 sm:h-12"
          />
          <Button onClick={handleSearch} className="h-11 sm:h-12 px-4 sm:px-6 bg-green-700 hover:bg-green-800" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            <span className="ml-2 hidden sm:inline">Buscar</span>
          </Button>
        </div>
      </div>

      {/* Resultados */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Buscando pedidos...
        </div>
      )}

      {pedidos && pedidos.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">Nenhum pedido encontrado</p>
          <p className="text-sm">Tente buscar por outro termo</p>
        </div>
      )}

      {pedidos && pedidos.length > 0 && (
        <div className="space-y-3">
          {pedidos.map((pedido: any) => {
            const isExpanded = expandedPedido === pedido.id;
            const conf1Ok = pedido.conferido === 1;
            const conf2Ok = pedido.conferido2 === 1;
            return (
              <div key={pedido.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                {/* Cabeçalho do pedido */}
                <div className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap flex-1">
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className="font-bold text-base sm:text-lg">#{pedido.id}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{pedido.clienteNome || "—"}</span>
                      </div>
                      <span className="font-semibold text-green-700 text-sm sm:text-base">
                        R$ {parseFloat(pedido.total).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500 hidden sm:inline">{pedido.data}</span>
                      <span className="text-xs text-gray-500 hidden sm:inline">{pedido.itens.length} itens</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full border ${conf1Ok ? "text-green-600 bg-green-50 border-green-200" : "text-amber-600 bg-amber-50 border-amber-200"}`}>
                        {conf1Ok ? "SEP ✓" : "SEP ✗"}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full border ${conf2Ok ? "text-blue-600 bg-blue-50 border-blue-200" : "text-amber-600 bg-amber-50 border-amber-200"}`}>
                        {conf2Ok ? "ENT ✓" : "ENT ✗"}
                      </span>
                    </div>
                  </div>

                  {/* Botões de conferência */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant={isExpanded && conferenciaTipo === "separacao" ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 h-9 text-xs sm:text-sm ${isExpanded && conferenciaTipo === "separacao" ? "bg-green-700 hover:bg-green-800" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                      onClick={() => togglePedido(pedido.id, "separacao")}
                    >
                      <ClipboardCheck className="h-4 w-4 mr-1" />
                      {conf1Ok ? "Reconferir Sep." : "1ª Conf. (Separação)"}
                      {isExpanded && conferenciaTipo === "separacao" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                    </Button>
                    <Button
                      variant={isExpanded && conferenciaTipo === "entrega" ? "default" : "outline"}
                      size="sm"
                      className={`flex-1 h-9 text-xs sm:text-sm ${isExpanded && conferenciaTipo === "entrega" ? "bg-blue-700 hover:bg-blue-800" : "border-blue-300 text-blue-700 hover:bg-blue-50"}`}
                      onClick={() => togglePedido(pedido.id, "entrega")}
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      {conf2Ok ? "Reconferir Ent." : "2ª Conf. (Entrega)"}
                      {isExpanded && conferenciaTipo === "entrega" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                    </Button>
                  </div>

                  {/* Info de conferências anteriores */}
                  <div className="flex flex-col gap-1 mt-2">
                    {conf1Ok && pedido.conferidoPor && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-green-700">
                          Separação por <strong>{pedido.conferidoPor}</strong>
                          {pedido.conferidoEm && ` em ${new Date(pedido.conferidoEm).toLocaleString("pt-BR")}`}
                        </span>
                      </div>
                    )}
                    {conf2Ok && pedido.conferidoPor2 && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="text-blue-700">
                          Entrega por <strong>{pedido.conferidoPor2}</strong>
                          {pedido.conferidoEm2 && ` em ${new Date(pedido.conferidoEm2).toLocaleString("pt-BR")}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detalhes expandidos */}
                {isExpanded && (
                  <div className="border-t px-4 pb-4">
                    <div className={`mt-3 mb-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${conferenciaTipo === "separacao" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {conferenciaTipo === "separacao" ? "1ª Conferência - Separação" : "2ª Conferência - Entrega"}
                    </div>

                    {/* Tabela de itens */}
                    <div className="overflow-x-auto mt-3 -mx-2 sm:mx-0">
                      <table className="w-full text-sm min-w-[480px]">
                        <thead>
                          <tr className="bg-gray-100 text-left">
                            <th className="px-3 py-2 font-semibold">#</th>
                            <th className="px-3 py-2 font-semibold">Produto</th>
                            {algumItemPreenchido && <th className="px-3 py-2 font-semibold text-center">Qtd Esperada</th>}
                            <th className="px-3 py-2 font-semibold text-center">Qtd Contada</th>
                            {algumItemPreenchido && <th className="px-3 py-2 font-semibold text-center">Status</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {pedido.itens.map((item: any, idx: number) => {
                            const qtdConf = qtdConferidas[item.id] || "";
                            const itemPreenchido = qtdConf !== "" && qtdConf !== undefined;
                            const div = itemPreenchido ? getDivergencia(item.quantidade, qtdConf) : null;
                            return (
                              <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                                <td className="px-3 py-2 font-medium">{item.produtoNome}</td>
                                {algumItemPreenchido && (
                                  <td className="px-3 py-2 text-center font-mono">{parseFloat(item.quantidade).toFixed(0)}</td>
                                )}
                                <td className="px-3 py-2 text-center">
                                  <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    placeholder="—"
                                    value={qtdConferidas[item.id] ?? ""}
                                    onChange={(e) => setQtdConferidas((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                    className="w-24 mx-auto text-center font-mono h-9"
                                  />
                                </td>
                                {algumItemPreenchido && (
                                  <td className="px-3 py-2 text-center">
                                    {!itemPreenchido ? (
                                      <span className="text-gray-400">—</span>
                                    ) : div === null ? (
                                      <span className="text-green-600 font-medium flex items-center justify-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" /> OK
                                      </span>
                                    ) : (
                                      <span className={`font-bold flex items-center justify-center gap-1 ${div > 0 ? "text-blue-600" : "text-red-600"}`}>
                                        <AlertTriangle className="h-4 w-4" />
                                        {div > 0 ? `+${div}` : div}
                                      </span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex flex-col sm:flex-row justify-end mt-4 gap-2 sm:gap-3">
                      <Button
                        variant="outline"
                        className="h-10 sm:h-9 text-sm"
                        onClick={() => setQtdConferidas({})}
                      >
                        Limpar Contagem
                      </Button>
                      <Button
                        onClick={() => handleSalvarConferencia(pedido.id, pedido.itens)}
                        disabled={salvando}
                        className={`px-6 sm:px-8 h-10 sm:h-9 text-sm ${conferenciaTipo === "separacao" ? "bg-green-700 hover:bg-green-800" : "bg-blue-700 hover:bg-blue-800"}`}
                      >
                        {salvando ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : conferenciaTipo === "separacao" ? (
                          <ClipboardCheck className="h-4 w-4 mr-2" />
                        ) : (
                          <Truck className="h-4 w-4 mr-2" />
                        )}
                        {conferenciaTipo === "separacao"
                          ? (conf1Ok ? "Reconferir Separação" : "Confirmar Separação")
                          : (conf2Ok ? "Reconferir Entrega" : "Confirmar Entrega")
                        }
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
