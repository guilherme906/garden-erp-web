import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

interface ProdutoConferencia {
  id: number;
  nomeCompleto?: string;
  nome: string;
  categoria?: string;
  cor?: string;
  precoVenda?: number;
  estoqueDisponivel?: number;
  fotoConversao?: string;
  offerId?: number;
}

interface ModalConferenciaCatalogoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtos: ProdutoConferencia[];
  descontoPercentualPadrao: number;
  onConfirm: (produtosAjustados: ProdutoConferencia[], descontos: Record<number, number>) => void;
  onGerarPdf: (produtosAjustados: ProdutoConferencia[], descontos: Record<number, number>) => Promise<void>;
  isGeneratingPdf: boolean;
}

export default function ModalConferenciaCatalogo({
  open,
  onOpenChange,
  produtos,
  descontoPercentualPadrao,
  onConfirm,
  onGerarPdf,
  isGeneratingPdf,
}: ModalConferenciaCatalogoProps) {
  // Inicializar descontos com 5% como padrão
  const [descontos, setDescontos] = useState<Record<number, number>>(
    produtos.reduce((acc, p) => ({ ...acc, [p.id]: 5 }), {})
  );

  // Estado para valores de venda customizados
  const [valoresVenda, setValoresVenda] = useState<Record<number, number>>(() => {
    const initialValores: Record<number, number> = {};
    produtos.forEach(p => {
      initialValores[p.id] = p.precoVenda || 0;
    });
    return initialValores;
  });

  const handleDescontoChange = (produtoId: number, desconto: number) => {
    setDescontos(prev => ({
      ...prev,
      [produtoId]: Math.max(0, Math.min(100, desconto))
    }));
  };

  const handleValorVendaChange = (produtoId: number, valor: number) => {
    setValoresVenda(prev => ({
      ...prev,
      [produtoId]: Math.max(0, valor)
    }));
  };

  const calcularValorComDesconto = (precoOriginal: number, desconto: number): number => {
    const fatorDesconto = 1 - (desconto / 100);
    return precoOriginal * fatorDesconto;
  };

  const handleGerarPdf = async () => {
    const produtosAjustados = produtos.map(p => ({
      ...p,
      precoVenda: valoresVenda[p.id] || p.precoVenda || 0
    }));
    await onGerarPdf(produtosAjustados, descontos);
  };

  const handleResetarValores = () => {
    setDescontos(produtos.reduce((acc, p) => ({ ...acc, [p.id]: 5 }), {}));
    setValoresVenda(
      produtos.reduce((acc, p) => ({ ...acc, [p.id]: p.precoVenda || 0 }), {})
    );
    toast.success('Valores resetados para padrão');
  };

  // Cálculos totais
  const totalProdutos = produtos.length;
  const totalValorOriginal = produtos.reduce((sum, p) => sum + (p.precoVenda || 0), 0);
  const totalValorComDesconto = produtos.reduce((sum, p) => {
    const valor = valoresVenda[p.id] || p.precoVenda || 0;
    const desconto = descontos[p.id] || 0;
    return sum + calcularValorComDesconto(valor, desconto);
  }, 0);
  const totalEconomia = totalValorOriginal - totalValorComDesconto;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0">
      <div className="bg-white dark:bg-slate-950 w-screen h-screen flex flex-col gap-0 p-0 overflow-hidden rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-white dark:bg-slate-950">
          <h2 className="text-lg font-semibold">Conferência de Produtos - Ajuste de Valores e Descontos ({produtos.length})</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-4 gap-3 px-6 py-3 bg-muted/50 text-sm shrink-0">
          <div>
            <p className="text-xs text-muted-foreground">Total de Produtos</p>
            <p className="font-bold text-lg">{totalProdutos}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor Original</p>
            <p className="font-bold text-lg">R$ {totalValorOriginal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor com Desconto</p>
            <p className="font-bold text-lg text-green-600">R$ {totalValorComDesconto.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Economia Total</p>
            <p className="font-bold text-lg text-blue-600">R$ {totalEconomia.toFixed(2)}</p>
          </div>
        </div>

        {/* Tabela com Scroll */}
        {produtos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Nenhum produto selecionado</p>
              <p className="text-xs text-muted-foreground">Selecione produtos na tabela e tente novamente</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto border-y">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
                <tr className="border-b-2 border-border">
                  <th className="px-4 py-3 text-left font-semibold min-w-[250px]">Produto</th>
                  <th className="px-4 py-3 text-left font-semibold min-w-[150px]">Categoria</th>
                  <th className="px-4 py-3 text-right font-semibold min-w-[120px]">Valor Venda</th>
                  <th className="px-4 py-3 text-center font-semibold min-w-[120px]">Desconto %</th>
                  <th className="px-4 py-3 text-right font-semibold min-w-[120px]">Valor Final</th>
                  <th className="px-4 py-3 text-right font-semibold min-w-[120px]">Economia</th>
                  <th className="px-4 py-3 text-right font-semibold min-w-[100px]">Estoque</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto, idx) => {
                  const valorVenda = valoresVenda[produto.id] || produto.precoVenda || 0;
                  const desconto = descontos[produto.id] || 0;
                  const valorComDesconto = calcularValorComDesconto(valorVenda, desconto);
                  const economia = valorVenda - valorComDesconto;

                  return (
                    <tr
                      key={produto.id}
                      className={`border-b hover:bg-muted/50 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-muted/20 dark:bg-slate-900/30'}`}
                    >
                      <td className="px-4 py-3 text-left">
                        <div className="font-medium leading-tight text-foreground">{produto.nomeCompleto || produto.nome}</div>
                        {produto.nomeCompleto && produto.nomeCompleto !== produto.nome && (
                          <div className="text-muted-foreground text-[10px] leading-tight truncate max-w-[220px]">{produto.nome}</div>
                        )}
                        {produto.cor && <div className="text-[10px] text-muted-foreground">{produto.cor}</div>}
                      </td>
                      <td className="px-4 py-3 text-left">{produto.categoria || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span>R$</span>
                          <Input
                            type="number"
                            value={valorVenda}
                            onChange={(e) => handleValorVendaChange(produto.id, parseFloat(e.target.value) || 0)}
                            className="w-24 h-8 text-right"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            value={desconto}
                            onChange={(e) => handleDescontoChange(produto.id, parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-center"
                            step="0.1"
                            min="0"
                            max="100"
                          />
                          <span>%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        R$ {valorComDesconto.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        R$ {economia.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {produto.estoqueDisponivel || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé */}
        <div className="flex gap-2 justify-between px-6 py-4 border-t shrink-0 bg-muted/30">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={handleResetarValores}
            >
              Resetar Valores
            </Button>
          </div>
          <Button
            onClick={handleGerarPdf}
            disabled={isGeneratingPdf}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Gerando PDF...
              </>
            ) : (
              'Gerar PDF'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
