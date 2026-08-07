import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, Trash2, Send, Loader2, CheckCircle2, Phone, User, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  token: string;
}

interface ItemCarrinho {
  listaItemId: number;
  categoriaNome: string;
  variedade: string;
  tamanho?: string;
  qtdHasteMaco?: string;
  valorUnitario: number;
  quantidade: number;
}

export default function ListaPrecoPublica({ token }: Props) {
  const { data: lista, isLoading, error } = trpc.listasPrecos.getByToken.useQuery({ token });
  const fazerPedidoMut = trpc.listasPrecos.fazerPedido.useMutation();

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [etapa, setEtapa] = useState<"lista" | "checkout" | "sucesso">("lista");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [observacao, setObservacao] = useState("");
  const [categoriasAbertas, setCategoriasAbertas] = useState<Record<string, boolean>>({});
  const [pedidoResult, setPedidoResult] = useState<{ pedidoId: number; vendaId?: number; total: number; whatsappUrl: string } | null>(null);

  // Agrupar itens por categoria
  const itensPorCategoria = useMemo(() => {
    if (!lista?.itens) return {};
    const grupos: Record<string, Array<(typeof lista.itens)[0]>> = {};
    for (const item of lista.itens) {
      if (!item.disponivel) continue;
      if (!grupos[item.categoriaNome]) grupos[item.categoriaNome] = [];
      grupos[item.categoriaNome].push(item);
    }
    return grupos;
  }, [lista?.itens]);

  const categorias = Object.keys(itensPorCategoria).sort();

  const totalCarrinho = carrinho.reduce((s, i) => s + i.valorUnitario * i.quantidade, 0);
  const qtdCarrinho = carrinho.reduce((s, i) => s + i.quantidade, 0);

  function toggleCategoria(cat: string) {
    setCategoriasAbertas(prev => ({ ...prev, [cat]: !prev[cat] }));
  }

  function getQtdNoCarrinho(itemId: number) {
    return carrinho.find(c => c.listaItemId === itemId)?.quantidade ?? 0;
  }

  function adicionarItem(item: { id: number; categoriaNome: string; variedade: string; tamanho?: string | null; qtdHasteMaco?: string | null; valorUnitario: string | number }) {
    setCarrinho(prev => {
      const idx = prev.findIndex(c => c.listaItemId === item.id);
      if (idx >= 0) {
        const novo = [...prev];
        novo[idx] = { ...novo[idx], quantidade: novo[idx].quantidade + 1 };
        return novo;
      }
      return [...prev, {
        listaItemId: item.id,
        categoriaNome: item.categoriaNome,
        variedade: item.variedade,
        tamanho: item.tamanho ?? undefined,
        qtdHasteMaco: item.qtdHasteMaco ?? undefined,
        valorUnitario: Number(item.valorUnitario),
        quantidade: 1,
      }];
    });
  }

  function removerItem(itemId: number) {
    setCarrinho(prev => {
      const idx = prev.findIndex(c => c.listaItemId === itemId);
      if (idx < 0) return prev;
      const novo = [...prev];
      if (novo[idx].quantidade > 1) {
        novo[idx] = { ...novo[idx], quantidade: novo[idx].quantidade - 1 };
      } else {
        novo.splice(idx, 1);
      }
      return novo;
    });
  }

  function removerDoCarrinho(itemId: number) {
    setCarrinho(prev => prev.filter(c => c.listaItemId !== itemId));
  }

  async function enviarPedido() {
    if (!clienteNome.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    if (carrinho.length === 0) {
      toast.error("Carrinho vazio — adicione itens antes de enviar.");
      return;
    }
    try {
      const result = await fazerPedidoMut.mutateAsync({
        token,
        clienteNome: clienteNome.trim(),
        clienteTelefone: clienteTelefone.trim() || undefined,
        observacao: observacao.trim() || undefined,
        itens: carrinho,
      });
      setPedidoResult(result);
      setEtapa("sucesso");
    } catch (err: any) {
      toast.error("Erro ao enviar pedido: " + err.message);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-3" />
          <p className="text-green-700 font-medium">Carregando lista de preços...</p>
        </div>
      </div>
    );
  }

  if (error || !lista) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🌸</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Lista não encontrada</h2>
          <p className="text-gray-500">Este link pode ter expirado ou não existe.</p>
        </div>
      </div>
    );
  }

  if (!lista.ativo) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">🌿</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Lista encerrada</h2>
          <p className="text-gray-500">Esta lista de preços não está mais disponível.</p>
        </div>
      </div>
    );
  }

  // Tela de sucesso
  if (etapa === "sucesso" && pedidoResult) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedido enviado!</h2>
          <p className="text-gray-600 mb-1">Seu pedido foi recebido com sucesso.</p>
          {pedidoResult.vendaId && (
            <p className="text-sm text-green-600 font-medium mb-4">
              Orçamento #{pedidoResult.vendaId} criado automaticamente.
            </p>
          )}
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Total do pedido</p>
            <p className="text-3xl font-bold text-green-700">
              R$ {pedidoResult.total.toFixed(2).replace(".", ",")}
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Em breve entraremos em contato para confirmar seu pedido.
          </p>
          <a
            href={pedidoResult.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors w-full justify-center"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Confirmar pelo WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // Tela de checkout
  if (etapa === "checkout") {
    return (
      <div className="min-h-screen bg-green-50">
        {/* Header */}
        <div className="bg-green-700 text-white px-4 py-4 sticky top-0 z-10 shadow">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => setEtapa("lista")} className="text-white/80 hover:text-white">
              ← Voltar
            </button>
            <h1 className="font-bold text-lg flex-1 text-center">Finalizar Pedido</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-4">
          {/* Resumo */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Resumo do Pedido</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {carrinho.map(item => (
                <div key={item.listaItemId} className="flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium">{item.categoriaNome}</span>
                    <span className="text-gray-500"> - {item.variedade}</span>
                    {item.tamanho && <span className="text-gray-400"> {item.tamanho}</span>}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-gray-500">x{item.quantidade}</span>
                    <span className="font-semibold text-green-700 w-20 text-right">
                      R$ {(item.valorUnitario * item.quantidade).toFixed(2).replace(".", ",")}
                    </span>
                    <button onClick={() => removerDoCarrinho(item.listaItemId)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-3 flex justify-between font-bold text-green-700">
              <span>Total</span>
              <span>R$ {totalCarrinho.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>

          {/* Dados do cliente */}
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-gray-700">Seus dados</h3>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Seu nome *"
                value={clienteNome}
                onChange={e => setClienteNome(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Telefone / WhatsApp"
                value={clienteTelefone}
                onChange={e => setClienteTelefone(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Textarea
                placeholder="Observações (opcional)"
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                className="pl-9 resize-none"
                rows={3}
              />
            </div>
          </div>

          <Button
            onClick={enviarPedido}
            disabled={fazerPedidoMut.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg"
          >
            {fazerPedidoMut.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Enviando...</>
            ) : (
              <><Send className="w-5 h-5 mr-2" /> Enviar Pedido</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Tela principal da lista
  return (
    <div className="min-h-screen bg-green-50 pb-32">
      {/* Header */}
      <div className="bg-green-700 text-white px-4 py-5 shadow">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🌸</span>
            <h1 className="font-bold text-xl">{lista.titulo}</h1>
          </div>
          {lista.subtitulo && <p className="text-green-200 text-sm ml-8">{lista.subtitulo}</p>}
          {lista.observacao && (
            <div className="mt-2 bg-green-600/50 rounded-lg px-3 py-2 text-sm text-green-100">
              {lista.observacao}
            </div>
          )}
          {lista.expiresAt && (
            <p className="text-green-300 text-xs mt-1 ml-8">
              Válida até {new Date(lista.expiresAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      </div>

      {/* Tabela de preços por categoria */}
      <div className="max-w-2xl mx-auto p-3 space-y-3">
        {categorias.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
            <p>Nenhum produto disponível nesta lista.</p>
          </div>
        ) : (
          categorias.map(cat => {
            const itens = itensPorCategoria[cat];
            const aberta = categoriasAbertas[cat] !== false; // aberta por padrão
            return (
              <div key={cat} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Cabeçalho da categoria */}
                <button
                  onClick={() => toggleCategoria(cat)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <span className="font-bold text-green-800 uppercase tracking-wide text-sm">{cat}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{itens.length}</Badge>
                    {aberta ? <ChevronUp className="w-4 h-4 text-green-600" /> : <ChevronDown className="w-4 h-4 text-green-600" />}
                  </div>
                </button>

                {aberta && (
                  <>
                    {/* Cabeçalho da tabela */}
                    <div className="grid grid-cols-[1fr_60px_70px_80px_90px] gap-1 px-4 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
                      <span>Variedade</span>
                      <span className="text-center">Tam.</span>
                      <span className="text-center">Qtd HST</span>
                      <span className="text-right">Valor</span>
                      <span className="text-center">Qtd</span>
                    </div>

                    {/* Itens */}
                    {itens.map(item => {
                      const qtd = getQtdNoCarrinho(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`grid grid-cols-[1fr_60px_70px_80px_90px] gap-1 px-4 py-2.5 border-b last:border-0 items-center text-sm ${qtd > 0 ? "bg-green-50" : "hover:bg-gray-50"}`}
                        >
                          <span className="font-medium text-gray-800">{item.variedade}</span>
                          <span className="text-center text-gray-500 text-xs">{item.tamanho || "-"}</span>
                          <span className="text-center text-gray-500 text-xs">{item.qtdHasteMaco || "-"}</span>
                          <span className="text-right font-semibold text-green-700">
                            R$ {Number(item.valorUnitario).toFixed(2).replace(".", ",")}
                          </span>
                          <div className="flex items-center justify-center gap-1">
                            {qtd > 0 ? (
                              <>
                                <button
                                  onClick={() => removerItem(item.id)}
                                  className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center font-bold text-green-700 text-sm">{qtd}</span>
                                <button
                                  onClick={() => adicionarItem(item)}
                                  className="w-6 h-6 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-600"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => adicionarItem(item)}
                                className="w-7 h-7 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center text-white shadow-sm"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Barra do carrinho (fixa na parte inferior) */}
      {lista.aceitaPedidos && carrinho.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 p-3">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setEtapa("checkout")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-between px-5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span>{qtdCarrinho} {qtdCarrinho === 1 ? "item" : "itens"}</span>
              </div>
              <span>Ver Pedido</span>
              <span className="font-bold">R$ {totalCarrinho.toFixed(2).replace(".", ",")}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
