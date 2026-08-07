import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import * as XLSX from 'xlsx';

interface CompraRow {
  produto: string;
  quantidade: string;
  valorCusto: string;
  pacote: string;
  valorTotal: string;
  freteUm: string;
  freteTotal: string;
  icms: string;
  embalagem: string;
  custoTotal: string;
  totalCompra: string;
  valorVarejo: string;
  valorCdUm: string;
  valorCdAta: string;
}

interface ImportadorComprasProps {
  onImportSuccess?: () => void;
}

export function ImportadorCompras({ onImportSuccess }: ImportadorComprasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [compras, setCompras] = useState<CompraRow[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState('');

  const createMutation = trpc.comprasImportadas.create.useMutation({
    onSuccess: () => {
      toast.success('Compra importada com sucesso!');
      onImportSuccess?.();
    },
    onError: (e) => toast.error('Erro ao importar: ' + e.message),
  });

  const getProdutoFatorMutation = trpc.comprasImportadas.getProdutoFatorConversao.useQuery(
    { nomeProduto: '' },
    { enabled: false }
  );

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Encontrar a linha de cabeçalho (linha 3 no arquivo)
      const headerRowIndex = (data as any[]).findIndex((row: any) =>
        (row as any[]).some((cell: any) => String(cell).toLowerCase().includes('produto'))
      );

      if (headerRowIndex === -1) {
        toast.error('Não foi encontrada a linha de cabeçalho com "PRODUTO"');
        setIsLoading(false);
        return;
      }

      const headers = data[headerRowIndex] as string[];
      const dataRows = data.slice(headerRowIndex + 2) as any[][];

      // Mapear colunas
      const comprasProcessadas: CompraRow[] = [];

      for (const row of dataRows) {
        if (!row[1]) break; // Parar quando não houver mais dados

        const compra: CompraRow = {
          produto: String(row[1] || '').trim(),
          quantidade: String(row[2] || '0'),
          valorCusto: String(row[3] || '0'),
          pacote: String(row[4] || '0'),
          valorTotal: String(row[5] || '0'),
          freteUm: String(row[6] || '0'),
          freteTotal: String(row[7] || '0'),
          icms: String(row[8] || '0'),
          embalagem: String(row[9] || '0'),
          custoTotal: String(row[10] || '0'),
          totalCompra: String(row[11] || '0'),
          valorVarejo: String(row[12] || '0'),
          valorCdUm: String(row[15] || '0'),
          valorCdAta: String(row[16] || '0'),
        };

        if (compra.produto) {
          comprasProcessadas.push(compra);
        }
      }

      setCompras(comprasProcessadas);
      setNomeArquivo(file.name);
      toast.success(`${comprasProcessadas.length} compras carregadas do arquivo`);
    } catch (error) {
      toast.error('Erro ao processar arquivo: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSalvarCompras() {
    if (compras.length === 0) {
      toast.error('Nenhuma compra para salvar');
      return;
    }

    setIsLoading(true);
    try {
      for (const compra of compras) {
        await createMutation.mutateAsync({
          ...compra,
          nomeArquivo,
        });
      }
      setCompras([]);
      setNomeArquivo('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          disabled={isLoading}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex flex-col items-center gap-2 w-full"
        >
          {isLoading ? (
            <>
              <Loader2 size={32} className="text-orange-500 animate-spin" />
              <p className="text-sm text-muted-foreground">Processando arquivo...</p>
            </>
          ) : (
            <>
              <Upload size={32} className="text-orange-500" />
              <p className="font-medium text-foreground">Clique para selecionar arquivo</p>
              <p className="text-xs text-muted-foreground">ou arraste um arquivo Excel/CSV</p>
            </>
          )}
        </button>
      </div>

      {/* Preview de Compras */}
      {compras.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 size={18} />
              {compras.length} compras carregadas
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCompras([]);
                setNomeArquivo('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              <X size={16} />
            </Button>
          </div>

          {/* Tabela de Preview */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-orange-50 dark:bg-orange-950/20">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Produto</th>
                  <th className="px-3 py-2 text-right font-semibold">Qtd</th>
                  <th className="px-3 py-2 text-right font-semibold">V/Custo</th>
                  <th className="px-3 py-2 text-right font-semibold">Pacote</th>
                  <th className="px-3 py-2 text-right font-semibold">V/Total</th>
                  <th className="px-3 py-2 text-right font-semibold">Frete</th>
                </tr>
              </thead>
              <tbody>
                {compras.slice(0, 5).map((compra, idx) => (
                  <tr key={idx} className="border-t hover:bg-muted/50">
                    <td className="px-3 py-2 truncate">{compra.produto}</td>
                    <td className="px-3 py-2 text-right">{parseFloat(compra.quantidade).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">R$ {parseFloat(compra.valorCusto).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{parseFloat(compra.pacote).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">R$ {parseFloat(compra.valorTotal).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">R$ {parseFloat(compra.freteTotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {compras.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              ... e mais {compras.length - 5} compras
            </p>
          )}

          {/* Botão Salvar */}
          <Button
            onClick={handleSalvarCompras}
            disabled={isLoading || createMutation.isPending}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isLoading || createMutation.isPending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="mr-2" />
                Salvar {compras.length} Compras
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
