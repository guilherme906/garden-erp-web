import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Loader2, CloudDownload, History, CheckCircle, Calendar
} from "lucide-react";
import { useState } from "react";


export default function ImportarPedidosVeiling() {
  const utils = trpc.useUtils();
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  });

  const importarMut = trpc.veiling.importarPedidosDia.useMutation({
    onSuccess: (data) => {
      utils.veiling.listarImportacoes.invalidate();
      if (data.totalItens > 0) {
        toast.success(`✅ ${data.mensagem}`);
      } else {
        toast.info(`ℹ️ ${data.mensagem}`);
      }
    },
    onError: (e) => {
      toast.error("Erro ao importar pedidos: " + e.message);
    },
  });

  const { data: historico, isLoading } = trpc.veiling.listarImportacoes.useQuery();

  function handleImportar() {
    importarMut.mutate({ data: dataSelecionada, origem: "MANUAL", forcarImportacao: true });
  }

  const dataLabel = dataSelecionada === new Date().toISOString().split("T")[0]
    ? "Hoje"
    : dataSelecionada.split("-").reverse().join("/");

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CloudDownload className="h-5 w-5 text-orange-500" />
            Importar Pedidos Veiling
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importe os pedidos do dia diretamente do Veiling Online para o módulo de Compras.
          </p>
        </div>

        {/* Card de importação */}
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-3">
            <CloudDownload className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Importação de Pedidos do Veiling Online</p>
              <p className="text-xs text-orange-600/80 dark:text-orange-500/80">
                O sistema faz login automaticamente com as credenciais configuradas no Catálogo Veiling
                e busca os pedidos da data selecionada, criando uma entrada em <strong>Compras</strong>.
              </p>
              <p className="text-xs text-orange-600/80 dark:text-orange-500/80">
                <History className="h-3 w-3 inline mr-1" />
                <strong>Automático:</strong> todos os dias às 18h o sistema importa os pedidos do dia automaticamente.
              </p>
            </div>
          </div>

          {/* Seletor de data */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-1.5 shrink-0">
              <Calendar className="h-4 w-4" />
              Data:
            </label>
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="border border-orange-300 dark:border-orange-700 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-orange-950/30 text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Botão de importar */}
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleImportar}
            disabled={importarMut.isPending}
          >
            {importarMut.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Importando pedidos...</>
              : <><CloudDownload className="h-4 w-4 mr-2" />Importar Pedidos de {dataLabel}</>
            }
          </Button>
        </div>

        {/* Histórico de importações */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5 text-foreground">
            <History className="h-4 w-4 text-muted-foreground" />
            Histórico de Importações
          </h2>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Data/Hora</th>
                    <th className="px-3 py-2 text-left font-medium">Data Pedidos</th>
                    <th className="px-3 py-2 text-right font-medium">Pedidos</th>
                    <th className="px-3 py-2 text-right font-medium">Itens</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Mensagem</th>
                    <th className="px-3 py-2 text-left font-medium">Origem</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Carregando...
                      </td>
                    </tr>
                  )}
                  {!isLoading && (historico || []).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                        Nenhuma importação registrada ainda.
                      </td>
                    </tr>
                  )}
                  {(historico || []).map((row) => (
                    <tr key={row.id} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                        {new Date(row.dataImportacao).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                        {row.dataPedidos ? row.dataPedidos.split("-").reverse().join("/") : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.totalPedidos ?? 0}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.totalItens ?? 0}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          row.status === 'SUCESSO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : row.status === 'PARCIAL' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {row.status === 'SUCESSO' ? <CheckCircle className="h-3 w-3" /> : null}
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate" title={row.mensagem ?? undefined}>
                        {row.mensagem || '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          row.origem === 'AUTOMATICO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {row.origem === 'AUTOMATICO' ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
