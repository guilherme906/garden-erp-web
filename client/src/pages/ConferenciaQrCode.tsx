import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Package, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ItemConferencia {
  id: string;
  produtoNome: string;
  quantidade: number;
  quantidadeContada?: number;
}

export default function ConferenciaQrCode({ params }: { params?: { token: string } }) {
  const routeParams = useParams();
  const token = (params?.token || routeParams?.token) as string;
  const [conferenciaConcluida, setConferenciaConcluida] = useState(false);
  const [assinatura, setAssinatura] = useState("");
  const [itensConferencia, setItensConferencia] = useState<ItemConferencia[]>([]);
  const [itemAtualEditando, setItemAtualEditando] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const { data: pedido, isLoading, error } = trpc.conferencia.obterPorQrCode.useQuery(
    { token },
    { enabled: !!token }
  );

  const confirmarMut = trpc.conferencia.confirmarPorQrCode.useMutation();

  // Inicializar itens
  useEffect(() => {
    if (pedido?.itens) {
      setItensConferencia(
        pedido.itens.map((item: any) => ({
          id: item.id,
          produtoNome: item.produtoNome,
          quantidade: item.quantidade,
          quantidadeContada: undefined,
        }))
      );
    }
  }, [pedido]);

  const handleConfirmarQuantidade = (itemId: string) => {
    const quantidade = parseInt(inputValue, 10);
    if (isNaN(quantidade) || quantidade < 0) {
      toast.error("Digite uma quantidade válida");
      return;
    }

    setItensConferencia((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, quantidadeContada: quantidade };
        }
        return item;
      })
    );

    setItemAtualEditando(null);
    setInputValue("");
  };

  // Verificar se todos foram conferidos
  const todosConferidos = itensConferencia.every((item) => item.quantidadeContada !== undefined);

  // Verificar se todos estão corretos
  const itensComErro = itensConferencia.filter(
    (item) => item.quantidadeContada !== undefined && item.quantidadeContada !== item.quantidade
  );

  const handleConfirmar = async () => {
    // Se não conferiu todos
    if (!todosConferidos) {
      toast.error("Confira todos os produtos antes de confirmar");
      return;
    }

    // Se tem erros
    if (itensComErro.length > 0) {
      const mensagem = itensComErro
        .map((item) => `${item.produtoNome}: pedido ${item.quantidade}, contou ${item.quantidadeContada}`)
        .join("\n");
      toast.error(`Erros encontrados:\n${mensagem}`);
      return;
    }

    // Se não tem assinatura
    if (!assinatura.trim()) {
      toast.error("Digite seu nome para confirmar");
      return;
    }

    try {
      await confirmarMut.mutateAsync({
        token,
        conferidoPor: assinatura,
        itens: itensConferencia.map((item) => ({
          itemId: parseInt(item.id),
          quantidadeContada: item.quantidadeContada || 0,
        })),
      });
      setConferenciaConcluida(true);
      toast.success("Entrega confirmada com sucesso!");
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-600 mb-4" />
          <p className="text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-red-50 to-white p-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-red-700 mb-2">Pedido não encontrado</h1>
            <p className="text-red-600 mb-4">O código QR pode estar expirado ou inválido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (conferenciaConcluida) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
        <Card className="w-full max-w-md border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-green-700 mb-2">Entrega Confirmada!</h1>
            <p className="text-green-600 mb-2">Pedido #{pedido.id}</p>
            <p className="text-sm text-green-500 mb-6">Confirmado por: {assinatura}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 pb-24">
      {/* Cabeçalho */}
      <div className="text-center mb-6">
        <div className="inline-block p-2 bg-blue-100 rounded-full mb-2">
          <Package className="h-6 w-6 text-blue-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Conferência</h1>
        <p className="text-xs text-gray-500">Pedido #{pedido.id}</p>
      </div>

      {/* Cliente */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-500 mb-1">Cliente</p>
        <p className="font-semibold text-gray-800 text-sm">{pedido.clienteNome}</p>
      </div>

      {/* Itens */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-semibold text-gray-700">Produtos</h2>
          <span className="text-xs text-gray-500">
            {itensConferencia.filter((i) => i.quantidadeContada !== undefined).length}/{itensConferencia.length}
          </span>
        </div>

        {itensConferencia.map((item) => {
          const isCorreto = item.quantidadeContada === item.quantidade;
          const isErro = item.quantidadeContada !== undefined && !isCorreto;
          const isPendente = item.quantidadeContada === undefined;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                isCorreto
                  ? "bg-green-50 border-green-300"
                  : isErro
                    ? "bg-red-50 border-red-300"
                    : "bg-white border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{item.produtoNome}</p>
                  <p className="text-xs text-gray-500">Pedido: {item.quantidade} un</p>
                </div>
                {isCorreto && (
                  <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                    <Check className="h-4 w-4 text-green-700" />
                    <span className="text-xs font-semibold text-green-700">OK</span>
                  </div>
                )}
                {isErro && (
                  <div className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded-full">
                    <X className="h-4 w-4 text-red-700" />
                    <span className="text-xs font-semibold text-red-700">Erro</span>
                  </div>
                )}
              </div>

              {/* Input */}
              {itemAtualEditando === item.id ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleConfirmarQuantidade(item.id);
                      }
                    }}
                  />
                  <Button
                    onClick={() => handleConfirmarQuantidade(item.id)}
                    className="px-4 bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    OK
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setItemAtualEditando(item.id);
                    setInputValue(item.quantidadeContada?.toString() || "");
                  }}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-center font-semibold text-gray-600 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  {item.quantidadeContada !== undefined ? (
                    <span className="text-lg text-gray-800">{item.quantidadeContada} un</span>
                  ) : (
                    <span className="text-gray-400">Toque para contar</span>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Aviso de Erros */}
      {todosConferidos && itensComErro.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex gap-2 items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-700 text-sm">Erros de Conferência</p>
              <div className="text-xs text-red-600 mt-2 space-y-1">
                {itensComErro.map((item) => (
                  <p key={item.id}>
                    {item.produtoNome}: pedido {item.quantidade}, contou {item.quantidadeContada}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assinatura */}
      {todosConferidos && itensComErro.length === 0 && (
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">Seu Nome</label>
          <input
            type="text"
            value={assinatura}
            onChange={(e) => setAssinatura(e.target.value)}
            placeholder="Digite seu nome"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleConfirmar()}
          />
        </div>
      )}

      {/* Botão */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <Button
          onClick={handleConfirmar}
          disabled={confirmarMut.isPending || !todosConferidos || itensComErro.length > 0 || !assinatura.trim()}
          className={`w-full h-12 font-semibold text-lg transition-all ${
            todosConferidos && itensComErro.length === 0 && assinatura.trim()
              ? "bg-green-600 hover:bg-green-700 text-white"
              : itensComErro.length > 0
                ? "bg-red-600 text-white cursor-not-allowed"
                : !todosConferidos
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white cursor-not-allowed"
          }`}
        >
          {confirmarMut.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Confirmando...
            </>
          ) : itensComErro.length > 0 ? (
            <>
              <AlertTriangle className="h-5 w-5 mr-2" />
              {itensComErro.length} Erro(s) - Corrija
            </>
          ) : todosConferidos && itensComErro.length === 0 && assinatura.trim() ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Confirmar Entrega
            </>
          ) : !todosConferidos ? (
            "Confira todos os produtos"
          ) : (
            "Digite seu nome"
          )}
        </Button>
      </div>
    </div>
  );
}
