import React, { useState } from 'react';
import { Trash2, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { ImportadorCompras } from '@/components/ImportadorCompras';
import * as XLSX from 'xlsx';

export default function ComprasImportadas() {
  const [showImportador, setShowImportador] = useState(false);

  const { data: compras, isLoading, refetch } = trpc.comprasImportadas.list.useQuery();
  const deleteMutation = trpc.comprasImportadas.delete.useMutation({
    onSuccess: () => {
      toast.success('Compra removida');
      refetch();
    },
    onError: (e) => toast.error('Erro ao remover: ' + e.message),
  });

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja remover esta compra?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleExportarExcel = () => {
    if (!compras || compras.length === 0) {
      toast.error('Nenhuma compra para exportar');
      return;
    }

    const dados = compras.map((c: any) => ({
      'PRODUTO': c.produto,
      'QUANTIDADE': parseFloat(c.quantidade),
      'V/CUSTO': parseFloat(c.valorCusto),
      'PACOTE': parseFloat(c.pacote),
      'VALOR TOTAL': parseFloat(c.valorTotal),
      'FRETE UM': parseFloat(c.freteUm),
      'FRETE TOTAL': parseFloat(c.freteTotal),
      'ICMS': parseFloat(c.icms),
      'EMBALAGEM': parseFloat(c.embalagem),
      'CUSTO TOTAL': parseFloat(c.custoTotal),
      'TOTAL COMPRA': parseFloat(c.totalCompra),
      'V/VAREJO': parseFloat(c.valorVarejo),
      'V/CD UM': parseFloat(c.valorCdUm),
      'V/CD ATA': parseFloat(c.valorCdAta),
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compras');
    XLSX.writeFile(wb, 'compras-importadas.xlsx');
    toast.success('Arquivo exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compras Importadas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie arquivos de compra importados</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
          >
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={() => setShowImportador(!showImportador)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            + Importar Arquivo
          </Button>
        </div>
      </div>

      {/* Importador */}
      {showImportador && (
        <div className="bg-orange-50 dark:bg-orange-950/10 border border-orange-200 dark:border-orange-900/30 rounded-lg p-4">
          <ImportadorCompras onImportSuccess={() => {
            setShowImportador(false);
            refetch();
          }} />
        </div>
      )}

      {/* Tabela de Compras */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando compras...
        </div>
      ) : !compras || compras.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground mb-4">Nenhuma compra importada</p>
          <Button
            onClick={() => setShowImportador(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Importar Primeira Compra
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Total: {compras.length} compras
            </p>
            <Button
              onClick={handleExportarExcel}
              variant="outline"
              size="sm"
            >
              <Download size={16} className="mr-2" />
              Exportar Excel
            </Button>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-orange-50 dark:bg-orange-950/20 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Produto</th>
                  <th className="px-4 py-3 text-right font-semibold">Qtd</th>
                  <th className="px-4 py-3 text-right font-semibold">V/Custo</th>
                  <th className="px-4 py-3 text-right font-semibold">Pacote</th>
                  <th className="px-4 py-3 text-right font-semibold">V/Total</th>
                  <th className="px-4 py-3 text-right font-semibold">Frete</th>
                  <th className="px-4 py-3 text-right font-semibold">ICMS</th>
                  <th className="px-4 py-3 text-right font-semibold">Custo Total</th>
                  <th className="px-4 py-3 text-right font-semibold">Total Compra</th>
                  <th className="px-4 py-3 text-right font-semibold">V/Varejo</th>
                  <th className="px-4 py-3 text-right font-semibold">V/CD Um</th>
                  <th className="px-4 py-3 text-right font-semibold">V/CD Ata</th>
                  <th className="px-4 py-3 text-center font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((compra: any) => (
                  <tr key={compra.id} className="border-t hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium truncate max-w-xs">{compra.produto}</td>
                    <td className="px-4 py-3 text-right">{parseFloat(compra.quantidade).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">R$ {parseFloat(compra.valorCusto).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{parseFloat(compra.pacote).toFixed(4)}</td>
                    <td className="px-4 py-3 text-right">R$ {parseFloat(compra.valorTotal).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">R$ {parseFloat(compra.freteTotal).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">R$ {parseFloat(compra.icms).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold">R$ {parseFloat(compra.custoTotal).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600 dark:text-orange-400">
                      R$ {parseFloat(compra.totalCompra).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">R$ {parseFloat(compra.valorVarejo).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">R$ {parseFloat(compra.valorCdUm).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">R$ {parseFloat(compra.valorCdAta).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        onClick={() => handleDelete(compra.id)}
                        disabled={deleteMutation.isPending}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900/30">
              <p className="text-xs text-muted-foreground mb-1">Total Quantidade</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {compras.reduce((sum: number, c: any) => sum + parseFloat(c.quantidade), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-900/30">
              <p className="text-xs text-muted-foreground mb-1">Total Compra</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                R$ {compras.reduce((sum: number, c: any) => sum + parseFloat(c.totalCompra), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-900/30">
              <p className="text-xs text-muted-foreground mb-1">Total Frete</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                R$ {compras.reduce((sum: number, c: any) => sum + parseFloat(c.freteTotal), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-900/30">
              <p className="text-xs text-muted-foreground mb-1">Total ICMS</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                R$ {compras.reduce((sum: number, c: any) => sum + parseFloat(c.icms), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
