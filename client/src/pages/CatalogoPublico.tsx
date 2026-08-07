import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Loader2, ShoppingCart, Package, Minus, Plus, Send, CheckCircle2,
  Phone, Calendar, User, AlertCircle, Flower2,
} from "lucide-react";
import { toast } from "sonner";

type CartItem = {
  catalogoItemId: number;
  nome: string;
  preco?: number;
  imagemUrl?: string | null;
  quantidade: number;
  unidade?: string | null;
};

export default function CatalogoPublico() {
  // Extrair token diretamente da URL (o App.tsx renderiza este componente sem rota wouter)
  const token = window.location.pathname.match(/\/catalogo\/([a-f0-9]+)/)?.[1] || "";

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [pedidoId, setPedidoId] = useState<number | null>(null);

  // Formulário do pedido
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [observacao, setObservacao] = useState("");

  const { data, isLoading } = trpc.catalogosVenda.viewByToken.useQuery({ token }, { enabled: !!token });
  const enviarMut = trpc.catalogosVenda.enviarPedido.useMutation({
    onSuccess: (res) => {
      setPedidoId(res.pedidoId);
      setPedidoEnviado(true);
      setShowCheckout(false);
      setCart([]);
    },
    onError: (e) => toast.error(e.message),
  });

  const totalItens = cart.reduce((s, i) => s + i.quantidade, 0);
  const totalValor = cart.reduce((s, i) => s + (i.preco || 0) * i.quantidade, 0);

  const addToCart = (item: { id: number; nome: string; preco?: string | null; imagemUrl?: string | null; unidade?: string | null }) => {
    const preco = item.preco ? Number(item.preco) : undefined;
    setCart(prev => {
      const existing = prev.find(c => c.catalogoItemId === item.id);
      if (existing) {
        return prev.map(c => c.catalogoItemId === item.id ? { ...c, quantidade: c.quantidade + 1 } : c);
      }
      return [...prev, { catalogoItemId: item.id, nome: item.nome, preco, imagemUrl: item.imagemUrl, quantidade: 1, unidade: item.unidade }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.catalogoItemId === itemId);
      if (!existing) return prev;
      if (existing.quantidade <= 1) return prev.filter(c => c.catalogoItemId !== itemId);
      return prev.map(c => c.catalogoItemId === itemId ? { ...c, quantidade: c.quantidade - 1 } : c);
    });
  };

  const getQtd = (itemId: number) => cart.find(c => c.catalogoItemId === itemId)?.quantidade || 0;

  const handleEnviar = () => {
    if (!clienteNome.trim()) { toast.error("Informe seu nome"); return; }
    if (!clienteTelefone.trim()) { toast.error("Informe seu telefone"); return; }
    if (!dataEntrega) { toast.error("Informe a data de entrega desejada"); return; }
    if (cart.length === 0) { toast.error("Adicione ao menos um produto"); return; }

    enviarMut.mutate({
      token,
      clienteNome: clienteNome.trim(),
      clienteTelefone: clienteTelefone.trim(),
      dataEntrega,
      observacao: observacao.trim() || undefined,
      itens: cart.map(i => ({
        catalogoItemId: i.catalogoItemId,
        nome: i.nome,
        preco: i.preco,
        quantidade: i.quantidade,
        subtotal: i.preco ? i.preco * i.quantidade : undefined,
      })),
    });
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto" />
          <p className="text-green-700 font-medium">Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  // ─── Não encontrado / Expirado ─────────────────────────────────────────────
  if (!data || !data.found) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto" />
          <h1 className="text-xl font-bold text-gray-700">Catálogo não encontrado</h1>
          <p className="text-gray-500 text-sm">Este link não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  if (data.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="h-16 w-16 text-amber-400 mx-auto" />
          <h1 className="text-xl font-bold text-amber-700">Catálogo expirado</h1>
          <p className="text-amber-600 text-sm">Este catálogo não está mais disponível. Entre em contato com a loja para mais informações.</p>
        </div>
      </div>
    );
  }

  // ─── Pedido enviado com sucesso ────────────────────────────────────────────
  if (pedidoEnviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-green-700">Pedido enviado!</h1>
          <p className="text-green-600 text-sm">
            Seu pedido foi recebido com sucesso. Em breve entraremos em contato para confirmar.
          </p>
          {pedidoId && (
            <p className="text-xs text-green-500">Pedido #{pedidoId}</p>
          )}
        </div>
      </div>
    );
  }

  const catalogo = data.catalogo!;
  const itens = catalogo.itens || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Flower2 className="h-6 w-6 text-green-600 shrink-0" />
            <div className="min-w-0">
              <h1 className="font-bold text-base text-gray-800 truncate">{catalogo.titulo}</h1>
              {catalogo.descricao && <p className="text-xs text-gray-500 truncate">{catalogo.descricao}</p>}
            </div>
          </div>
          {totalItens > 0 && (
            <button
              onClick={() => setShowCheckout(true)}
              className="relative flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-full transition-colors shrink-0"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{totalItens}</span>
              <span className="hidden sm:inline">· R$ {totalValor.toFixed(2)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista de produtos */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {itens.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum produto disponível neste catálogo.</p>
          </div>
        ) : (
          itens.map((item: any) => {
            const qtd = getQtd(item.id);
            const preco = item.preco ? Number(item.preco) : null;
            return (
              <Card key={item.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-3">
                    {/* Imagem */}
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {item.imagemUrl ? (
                        <img
                          src={item.imagemUrl}
                          alt={item.nome}
                          className="h-full w-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 leading-tight">{item.nome}</p>
                      {item.descricao && <p className="text-xs text-gray-500 mt-0.5">{item.descricao}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {preco !== null && preco > 0 ? (
                          <span className="text-green-700 font-bold text-sm">R$ {preco.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Consulte o preço</span>
                        )}
                        {item.unidade && <Badge variant="outline" className="text-xs h-4 px-1">{item.unidade}</Badge>}
                      </div>
                    </div>

                    {/* Controle de quantidade */}
                    <div className="flex items-center gap-1 shrink-0">
                      {qtd > 0 ? (
                        <>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5 text-gray-600" />
                          </button>
                          <span className="w-6 text-center font-bold text-sm text-gray-800">{qtd}</span>
                          <button
                            onClick={() => addToCart(item)}
                            className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5 text-white" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Botão flutuante de finalizar pedido */}
        {totalItens > 0 && (
          <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-40">
            <button
              onClick={() => setShowCheckout(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              Finalizar Pedido · {totalItens} {totalItens === 1 ? "item" : "itens"} · R$ {totalValor.toFixed(2)}
            </button>
          </div>
        )}
      </div>

      {/* Modal de Checkout */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" /> Finalizar Pedido
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Resumo do carrinho */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Resumo</p>
              {cart.map(item => (
                <div key={item.catalogoItemId} className="flex items-center justify-between text-sm gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded shrink-0">{item.quantidade}x</span>
                    <span className="truncate text-gray-700">{item.nome}</span>
                  </div>
                  <span className="font-mono text-gray-800 shrink-0">
                    {item.preco ? `R$ ${(item.preco * item.quantidade).toFixed(2)}` : "-"}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold text-sm">
                <span>Total</span>
                <span className="text-green-700 font-mono">R$ {totalValor.toFixed(2)}</span>
              </div>
            </div>

            {/* Dados do cliente */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Seus dados</p>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <User className="h-3.5 w-3.5" /> Nome completo *
                </Label>
                <Input
                  value={clienteNome}
                  onChange={e => setClienteNome(e.target.value)}
                  placeholder="Seu nome"
                  className={!clienteNome.trim() && enviarMut.isError ? "border-destructive" : ""}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Phone className="h-3.5 w-3.5" /> Telefone / WhatsApp *
                </Label>
                <Input
                  value={clienteTelefone}
                  onChange={e => setClienteTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  type="tel"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-3.5 w-3.5" /> Data de entrega desejada *
                </Label>
                <Input
                  value={dataEntrega}
                  onChange={e => setDataEntrega(e.target.value)}
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Observações (opcional)</Label>
                <Textarea
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Endereço de entrega, horário preferido, etc."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCheckout(false)}>Voltar</Button>
            <Button
              onClick={handleEnviar}
              disabled={enviarMut.isPending || !clienteNome.trim() || !clienteTelefone.trim() || !dataEntrega}
              className="bg-green-600 hover:bg-green-700 gap-1.5"
            >
              {enviarMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
