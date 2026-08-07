import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";

export function TitulosAReceber() {
  const { data: titulos = [], refetch } = trpc.financeiro.titulos.listPendentes.useQuery();
  const updateStatusMutation = trpc.financeiro.titulos.updateStatus.useMutation();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleMarcarPago = async (id: number) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: "PAGO", dataPagamento: new Date() });
      alert("Título marcado como pago");
      refetch();
    } catch (error) {
      alert("Erro ao atualizar título");
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "VENCIDO") return "text-red-600 bg-red-50";
    if (status === "PENDENTE") return "text-yellow-600 bg-yellow-50";
    return "text-gray-600";
  };

  const getStatusIcon = (status: string) => {
    if (status === "VENCIDO") return <AlertCircle className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold">Títulos a Receber</h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm md:text-base">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="border p-2 text-left">Cliente</th>
              <th className="border p-2 text-left">Forma Pagamento</th>
              <th className="border p-2 text-right">Valor</th>
              <th className="border p-2 text-left">Data Vencimento</th>
              <th className="border p-2 text-center">Status</th>
              <th className="border p-2 text-center">Ação</th>
            </tr>
          </thead>
          <tbody>
            {titulos.map((titulo: any) => (
              <tr key={titulo.id} className="hover:bg-gray-100">
                <td className="border p-2">{titulo.clienteNome}</td>
                <td className="border p-2">{titulo.formaPagamentoNome}</td>
                <td className="border p-2 text-right font-semibold">R$ {titulo.valor}</td>
                <td className="border p-2">{new Date(titulo.dataVencimento).toLocaleDateString()}</td>
                <td className={`border p-2 text-center font-semibold ${getStatusColor(titulo.status)}`}>
                  <div className="flex items-center justify-center gap-1">
                    {getStatusIcon(titulo.status)}
                    {titulo.status}
                  </div>
                </td>
                <td className="border p-2 text-center">
                  <Button
                    size="sm"
                    onClick={() => handleMarcarPago(titulo.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Pago
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {titulos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum título pendente encontrado
        </div>
      )}
    </div>
  );
}
