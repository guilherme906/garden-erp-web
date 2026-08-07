import { trpc } from "@/lib/trpc";

export function TitulosPagos() {
  const { data: titulos = [] } = trpc.financeiro.titulos.listPagos.useQuery();

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold">Títulos Pagos</h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm md:text-base">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="border p-2 text-left">Cliente</th>
              <th className="border p-2 text-left">Forma Pagamento</th>
              <th className="border p-2 text-right">Valor</th>
              <th className="border p-2 text-left">Data Vencimento</th>
              <th className="border p-2 text-left">Data Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {titulos.map((titulo: any) => (
              <tr key={titulo.id} className="hover:bg-gray-100">
                <td className="border p-2">{titulo.clienteNome}</td>
                <td className="border p-2">{titulo.formaPagamentoNome}</td>
                <td className="border p-2 text-right font-semibold">R$ {titulo.valor}</td>
                <td className="border p-2">{new Date(titulo.dataVencimento).toLocaleDateString()}</td>
                <td className="border p-2">{titulo.dataPagamento ? new Date(titulo.dataPagamento).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {titulos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum título pago encontrado
        </div>
      )}
    </div>
  );
}
