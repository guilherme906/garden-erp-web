import { trpc } from "@/lib/trpc";
import { Loader2, AlertTriangle, Clock, Package, MapPin, User, Calendar, Hash } from "lucide-react";

export default function PedidoPublico({ token }: { token: string }) {
  const { data, isLoading, error } = trpc.vendaLinks.viewByToken.useQuery({ token });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.found) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Link Inválido</h1>
          <p className="text-gray-600">Este link de pedido não existe ou já foi removido.</p>
        </div>
      </div>
    );
  }

  if (data.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <Clock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Link Expirado</h1>
          <p className="text-gray-600">O prazo de validade deste link já passou. Solicite um novo link ao responsável.</p>
        </div>
      </div>
    );
  }

  const v = data.venda;
  if (!v) return null;

  const statusColor = v.status === "APROVADO" ? "bg-green-100 text-green-800" : v.status === "CANCELADO" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800";

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663539257200/nE9aRDyk9G49cwSdfYmqny/LOGOPRINCIPAL-POSITIVA-HORIZONTAL_21b11a41.webp" alt="Garden Center Primavera" className="h-10 object-contain" />
              <div>
                <p className="text-xs text-gray-500">Pedido de Venda</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>{v.status}</span>
          </div>
        </div>

        {/* Dados do pedido */}
        <div className="bg-white border-x border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-2">
              <Hash className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-medium">Pedido</p>
                <p className="text-sm font-bold text-gray-800">#{v.id}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-medium">Cliente</p>
                <p className="text-sm font-semibold text-gray-800">{v.clienteNome || "-"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-medium">Data</p>
                <p className="text-sm text-gray-800">{v.data}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-medium">Logística</p>
                <p className="text-sm text-gray-800">{v.logistica || "RETIRADA"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de itens */}
        <div className="bg-white border-x border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="text-left px-4 py-2 font-medium">Produto</th>
                <th className="text-right px-4 py-2 font-medium">Qtd</th>
                <th className="text-right px-4 py-2 font-medium">Vlr Unit.</th>
                <th className="text-right px-4 py-2 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {v.itens?.map((item: any, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 text-gray-800">
                    <div className="font-medium">{item.produtoNome}</div>
                    {item.observacao && <div className="text-xs text-gray-500 mt-1">Qualidade: {item.observacao}</div>}
                  </td>
                  <td className="text-right px-4 py-2 text-gray-700">{Number(item.quantidade).toFixed(2)}</td>
                  <td className="text-right px-4 py-2 text-gray-700">R$ {Number(item.valorUnitario).toFixed(2)}</td>
                  <td className="text-right px-4 py-2 font-medium text-gray-800">R$ {Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="bg-green-600 rounded-b-xl shadow-sm p-4 flex items-center justify-between">
          <span className="text-white font-medium text-sm">TOTAL DO PEDIDO</span>
          <span className="text-white font-bold text-xl">R$ {Number(v.total).toFixed(2)}</span>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Este é um link de visualização temporário gerado pelo sistema Garden Primavera ERP.
        </p>
      </div>
    </div>
  );
}
