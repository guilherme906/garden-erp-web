import { trpc } from "@/lib/trpc";
import { Loader2, FileText, CheckCircle2, Clock, XCircle, CalendarClock } from "lucide-react";

interface Props {
  token: string;
}

export default function OrcamentoPublico({ token }: Props) {
  const { data, isLoading } = trpc.vendas.getPublico.useQuery({ token });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7f2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#8cbb1f]">
          <Loader2 className="h-10 w-10 animate-spin" />
          <span className="text-sm text-gray-500">Carregando orçamento...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f5f7f2] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Link inválido ou expirado</h2>
          <p className="text-gray-500 text-sm">Este link de orçamento não é válido ou já expirou. Entre em contato com a loja para obter um novo link.</p>
        </div>
      </div>
    );
  }

  const v = data;
  const itens = (data as any).itens || [];
  const total = itens.reduce((s: number, i: any) => s + Number(i.quantidade) * Number(i.valorUnitario), 0);

  const statusColor: Record<string, string> = {
    AGUARDANDO: "bg-amber-100 text-amber-800 border-amber-200",
    APROVADO: "bg-green-100 text-green-800 border-green-200",
    CANCELADO: "bg-red-100 text-red-800 border-red-200",
    EXPIRADO: "bg-gray-100 text-gray-600 border-gray-200",
  };

  const statusIcon: Record<string, React.ReactNode> = {
    AGUARDANDO: <Clock className="h-3.5 w-3.5" />,
    APROVADO: <CheckCircle2 className="h-3.5 w-3.5" />,
    CANCELADO: <XCircle className="h-3.5 w-3.5" />,
    EXPIRADO: <CalendarClock className="h-3.5 w-3.5" />,
  };

  return (
    <div className="min-h-screen bg-[#f5f7f2] py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e0e8d0] overflow-hidden mb-4">
          <div className="bg-[#8cbb1f] px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="h-5 w-5 text-[#8cbb1f]" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">Garden Primavera</h1>
              <p className="text-white/80 text-xs">Orçamento #{String(v.numeroSequencial || v.id).padStart(3, '0')}</p>
            </div>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-0.5">Cliente</span>
              <span className="font-medium text-gray-800">{v.clienteNome || "Não informado"}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-0.5">Data</span>
              <span className="font-medium text-gray-800">{v.data}</span>
            </div>
            {v.telefoneCliente && (
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-0.5">Telefone</span>
                <span className="font-medium text-gray-800">{v.telefoneCliente}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-0.5">Situação</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColor[v.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                {statusIcon[v.status]}
                {v.status}
              </span>
            </div>
            {v.vencimento && (
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-0.5">Válido até</span>
                <span className="font-medium text-amber-700 flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {v.vencimento}
                </span>
              </div>
            )}
            {v.dataEntrega && (
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-0.5">Entrega / Retirada</span>
                <span className="font-medium text-gray-800">{v.dataEntrega}{v.horaEntrega ? ` às ${v.horaEntrega}` : ""}</span>
              </div>
            )}
            {v.logistica && v.logistica !== "RETIRADA" && (
              <div className="col-span-2">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide block mb-0.5">Endereço de Entrega</span>
                <span className="font-medium text-gray-800">{v.logistica.replace("ENTREGA - ", "")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e0e8d0] overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-100 bg-[#f9fbf5]">
            <h2 className="font-bold text-sm text-gray-700 uppercase tracking-wide">Itens do Orçamento</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] uppercase tracking-wide text-gray-400">
                  <th className="text-left px-4 py-2.5 font-semibold">Produto</th>
                  <th className="text-center px-3 py-2.5 font-semibold w-16">Qtd</th>
                  <th className="text-right px-3 py-2.5 font-semibold w-24">Unit.</th>
                  <th className="text-right px-4 py-2.5 font-semibold w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{item.produtoNome}</div>
                      {item.observacao && <div className="text-xs text-gray-400 mt-0.5">{item.observacao}</div>}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-600">{item.quantidade}</td>
                    <td className="px-3 py-3 text-right text-gray-600">R$ {Number(item.valorUnitario).toFixed(2).replace(".", ",")}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      R$ {(Number(item.quantidade) * Number(item.valorUnitario)).toFixed(2).replace(".", ",")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e0e8d0] px-6 py-4 flex items-center justify-between mb-4">
          <span className="text-gray-500 font-medium">Total do Orçamento</span>
          <span className="text-2xl font-bold text-[#8cbb1f]">R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>

        {v.observacaoPedido && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Observações</p>
            <p className="text-sm text-amber-800">{v.observacaoPedido}</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Garden Primavera · Este orçamento foi gerado digitalmente e é válido conforme a data indicada acima.
        </p>
      </div>
    </div>
  );
}
