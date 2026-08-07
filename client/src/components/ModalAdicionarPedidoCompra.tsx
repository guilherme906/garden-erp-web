"use client";
import { useState, useRef, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  X, FileText, Plus, Loader2, ClipboardList,
  User, Phone, Search, Package, ShoppingBag, Trash2, ChevronRight,
  MessageSquare, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ItemCarrinho {
  produtoNome?: string;
  nome?: string;
  quantidade: number;
  valorUnitario?: number;
  precoVenda?: number;
  qualidadeConversao?: string;
  qualidade?: string;
  produtor?: string;
  produtoId?: number;
  origem: "catalogo" | "loja" | "catalogo-publico";
  obs: string;
}

interface Props {
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  onClose: () => void;
  forceNovoOrcamento?: boolean;
  origem?: "catalogo-publico" | "interno";
  itensCarrinho?: ItemCarrinho[];
  linkToken?: string;
}

// ─── Subtela: Lançar produtos ─────────────────────────────────────────────────
function SubtelaAdicionarProdutos({
  itensIniciais,
  onConfirmar,
  onVoltar,
  isPending,
}: {
  itensIniciais: ItemCarrinho[];
  onConfirmar: (itens: ItemCarrinho[]) => void;
  onVoltar: () => void;
  isPending: boolean;
}) {
  const [itens, setItens] = useState<ItemCarrinho[]>(itensIniciais);
  const [busca, setBusca] = useState("");
  const [showSug, setShowSug] = useState(false);
  const [obsAberta, setObsAberta] = useState<number | null>(null);

  const { data: produtosLoja, isLoading: loadingLoja } = trpc.loja.listar.useQuery(
    { busca: busca || undefined, ativo: 1, limit: 10, offset: 0 },
    { enabled: busca.length >= 2 }
  );

  const sugestoes = useMemo(() => {
    if (busca.length < 2) return [];
    return (produtosLoja?.items || []).slice(0, 8);
  }, [produtosLoja, busca]);

  function adicionarProdutoLoja(p: any) {
    const preco = parseFloat(p.preco) || 0;
    setItens(prev => {
      const idx = prev.findIndex(i => i.produtoNome === p.nome && i.origem === "loja");
      if (idx >= 0) {
        const novo = [...prev];
        novo[idx] = { ...novo[idx], quantidade: novo[idx].quantidade + 1 };
        return novo;
      }
      return [...prev, { produtoNome: p.nome, quantidade: 1, valorUnitario: preco, origem: "loja", obs: "" }];
    });
    setBusca("");
    setShowSug(false);
  }

  function removerItem(idx: number) {
    setItens(prev => prev.filter((_, i) => i !== idx));
    if (obsAberta === idx) setObsAberta(null);
  }

  function alterarQtd(idx: number, delta: number) {
    setItens(prev => {
      const novo = [...prev];
      const novaQtd = Math.max(1, novo[idx].quantidade + delta);
      novo[idx] = { ...novo[idx], quantidade: novaQtd };
      return novo;
    });
  }

  function setQtdDireto(idx: number, val: string) {
    const n = parseInt(val);
    if (isNaN(n) || n < 1) return;
    setItens(prev => {
      const novo = [...prev];
      novo[idx] = { ...novo[idx], quantidade: n };
      return novo;
    });
  }

  function setObs(idx: number, val: string) {
    setItens(prev => {
      const novo = [...prev];
      novo[idx] = { ...novo[idx], obs: val };
      return novo;
    });
  }

  const totalGeral = itens.reduce((sum, item) => sum + (item.quantidade * (item.valorUnitario || 0)), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Busca de produtos da loja */}
      <div className="px-4 py-3 border-b flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-2.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar produtos da loja..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setShowSug(true); }}
            onFocus={() => setShowSug(true)}
            className="pl-7 h-8 text-sm"
          />
          {showSug && sugestoes.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-background border rounded mt-1 shadow-lg z-10 max-h-40 overflow-y-auto">
              {sugestoes.map((p: any) => (
                <button
                  key={p.id}
                  className="w-full text-left px-3 py-1.5 hover:bg-muted text-xs border-b last:border-0"
                  onClick={() => adicionarProdutoLoja(p)}
                >
                  <div className="font-medium">{p.nome}</div>
                  <div className="text-muted-foreground">R$ {parseFloat(p.preco).toFixed(2)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista de itens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {itens.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Package size={24} className="mx-auto mb-2 opacity-50" />
            Nenhum produto adicionado
          </div>
        ) : (
          itens.map((item, idx) => (
            <div key={idx} className="border rounded-lg bg-muted/20 overflow-hidden">
              <div className="px-3 py-2 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.produtoNome}</p>
                  <p className="text-xs text-muted-foreground">R$ {(item.valorUnitario || 0).toFixed(2)}/un</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => alterarQtd(idx, -1)} className="px-1.5 py-0.5 bg-background rounded text-xs hover:bg-muted">−</button>
                  <input
                    type="number"
                    value={item.quantidade}
                    onChange={(e) => setQtdDireto(idx, e.target.value)}
                    className="w-10 text-center text-xs border rounded py-0.5 bg-background"
                  />
                  <button onClick={() => alterarQtd(idx, 1)} className="px-1.5 py-0.5 bg-background rounded text-xs hover:bg-muted">+</button>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-background/50 flex items-center justify-between text-xs">
                <span className="font-semibold">Subtotal: R$ {(item.quantidade * (item.valorUnitario || 0)).toFixed(2)}</span>
                <div className="flex gap-1">
                  <button
                    className="text-blue-400 hover:text-blue-600 p-0.5"
                    onClick={() => setObsAberta(obsAberta === idx ? null : idx)}
                  >
                    <MessageSquare size={13} />
                  </button>
                  <button
                    className="text-red-400 hover:text-red-600 p-0.5"
                    onClick={() => removerItem(idx)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {obsAberta === idx && (
                <div className="px-3 pb-2 border-t border-border/50 pt-1.5 bg-background/50">
                  <input
                    type="text"
                    value={item.obs}
                    onChange={e => setObs(idx, e.target.value)}
                    placeholder="Observação para este item..."
                    className="w-full text-xs px-2 py-1.5 border border-border rounded focus:outline-none focus:border-orange-400 bg-background"
                    autoFocus
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Total e botões */}
      <div className="px-4 py-3 border-t flex-shrink-0">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-muted-foreground">Total do orçamento:</span>
          <span className="font-bold text-orange-600 dark:text-orange-400 text-base">R$ {totalGeral.toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onVoltar} className="flex-1" disabled={isPending}>
            Voltar
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
            onClick={() => onConfirmar(itens)}
            disabled={itens.length === 0 || isPending}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
            Próximo ({itens.length} {itens.length === 1 ? "item" : "itens"})
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Principal ───────────────────────────────────────────────────────────
export default function ModalAdicionarPedidoCompra({ produtoNome, quantidade, precoUnitario, onClose, forceNovoOrcamento = false, origem = "interno", itensCarrinho: itensCarrinhoInicial, linkToken = "" }: Props) {
  const utils = trpc.useUtils();
  // Se for catálogo público, força novo orçamento
  const isPublico = (origem as string | undefined) === "catalogo-publico";
  const [modo, setModo] = useState<"escolher" | "novo">(forceNovoOrcamento || isPublico ? "novo" : "escolher");
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<number | null>(null);
  const [qtd, setQtd] = useState(String(quantidade));
  const [tela, setTela] = useState<"principal" | "produtos" | "cliente">(forceNovoOrcamento || isPublico ? (itensCarrinhoInicial && itensCarrinhoInicial.length > 0 ? "cliente" : "produtos") : "principal");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [itensCarrinho, setItensCarrinho] = useState<ItemCarrinho[]>(itensCarrinhoInicial || []);

  // ── Campos do novo orçamento ──
  const [clienteNome, setClienteNome] = useState("");
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [telefone, setTelefone] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [showCliSug, setShowCliSug] = useState(false);
  const cliRef = useRef<HTMLDivElement>(null);

  // ── Dados ──
  const { data: orcamentosAbertos, isLoading: loadingOrcamentos } = trpc.vendas.listAbertos.useQuery(undefined, { enabled: !isPublico });
  const { data: clientes } = trpc.clientes.list.useQuery({}, { enabled: !isPublico });

  // ── Filtro de orçamentos ──
  const orcamentosFiltrados = useMemo(() => {
    if (!orcamentosAbertos) return [];
    if (!filtroCliente.trim()) return orcamentosAbertos;
    const f = filtroCliente.toLowerCase();
    return orcamentosAbertos.filter((o: any) =>
      (o.clienteNome || "").toLowerCase().includes(f) ||
      String(o.numero).includes(f)
    );
  }, [orcamentosAbertos, filtroCliente]);

  // ── Sugestões de clientes ──
  const cliSuggestions = useMemo(() => {
    if (!clienteNome || clienteNome.length < 1) return [];
    return (clientes || [])
      .filter((c: any) => c.nome.toLowerCase().includes(clienteNome.toLowerCase()))
      .slice(0, 8);
  }, [clienteNome, clientes]);

  // ── Mutations ──
  const createClienteMut = trpc.clientes.create.useMutation({
    onSuccess: () => utils.clientes.list.invalidate(),
    onError: (e) => toast.error("Erro ao cadastrar cliente: " + e.message),
  });

  const addItensLoteMut = trpc.vendas.addItensLote.useMutation({
    onError: (e) => toast.error("Erro ao adicionar: " + e.message),
  });

  const createComItensLoteMut = trpc.vendas.createComItensLote.useMutation({
    onError: (e) => toast.error("Erro ao criar orçamento: " + e.message),
  });

  const criarPedidoPublicoMut = trpc.veiling.criarPedidoPublico.useMutation({
    onError: (e) => toast.error("Erro ao finalizar pedido: " + e.message),
  });

  const isPending = addItensLoteMut.isPending || createComItensLoteMut.isPending || createClienteMut.isPending || criarPedidoPublicoMut.isPending;

  // Função para gerar link do WhatsApp
  function gerarLinkWhatsApp(itens: ItemCarrinho[], total: number) {
    const tel = telefone.replace(/\D/g, "");
    const numero = tel.startsWith("55") ? tel : `55${tel}`;
    const totalFormatado = total.toFixed(2).replace(".", ",");
    
    let mensagem = `Olá ${clienteNome || "Cliente"}!\n\n`;
    mensagem += `Segue seu orçamento com os seguintes produtos:\n\n`;
    
    itens.forEach((item, idx) => {
      const subtotal = (item.quantidade * (item.valorUnitario || 0)).toFixed(2);
      mensagem += `${idx + 1}. ${item.produtoNome}\n`;
      mensagem += `   Qtd: ${item.quantidade} | R$ ${(item.valorUnitario || 0).toFixed(2)} | Subtotal: R$ ${subtotal}\n`;
      if (item.obs) mensagem += `   Obs: ${item.obs}\n`;
    });
    
    mensagem += `\n💰 Total: R$ ${totalFormatado}\n\n`;
    mensagem += `Qualquer dúvida, estamos à disposição! 🌿`;
    
    const msgEncoded = encodeURIComponent(mensagem);
    return `https://wa.me/${numero}?text=${msgEncoded}`;
  }

  // Função para enviar para WhatsApp após confirmar
  function enviarParaWhatsApp(itens: ItemCarrinho[]) {
    if (!telefone) {
      toast.error("Por favor, informe um telefone para enviar via WhatsApp");
      return;
    }
    
    const total = itens.reduce((sum, item) => sum + (item.quantidade * (item.valorUnitario || 0)), 0);
    const linkWhatsApp = gerarLinkWhatsApp(itens, total);
    window.open(linkWhatsApp, "_blank");
    
    setTimeout(() => {
      toast.success("Orçamento enviado com sucesso!");
      onClose();
    }, 500);
  }

  // ── Selecionar cliente ──
  function selectCliente(c: any) {
    setClienteNome(c.nome);
    setClienteId(c.id);
    if (c.telefone) setTelefone(c.telefone);
    setShowCliSug(false);
  }

  async function cadastrarClienteRapido() {
    const nome = clienteNome.trim().toUpperCase();
    if (!nome) { toast.error("Digite o nome do cliente"); return; }
    try {
      const result = await createClienteMut.mutateAsync({ nome, telefone: telefone.trim() || undefined });
      setClienteNome(nome);
      setClienteId(result.id);
      setShowCliSug(false);
    } catch { /* tratado no onError */ }
  }

  // ── Confirmar adição de múltiplos itens (lote - 1 chamada HTTP) ──
  async function confirmarItensOrcamento(itens: ItemCarrinho[]) {
    if (!orcamentoSelecionado) return;
    try {
      await addItensLoteMut.mutateAsync({
        orcamentoId: orcamentoSelecionado,
        itens: itens.map(item => ({
          produtoNome: item.produtoNome || item.nome || "Produto",
          quantidade: String(item.quantidade),
          valorUnitario: (item.valorUnitario || 0).toFixed(2),
          subtotal: (item.quantidade * (item.valorUnitario || 0)).toFixed(2),
          obs: item.obs || undefined,
        })),
      });
      utils.vendas.list.invalidate();
      toast.success(`${itens.length} ${itens.length === 1 ? "item adicionado" : "itens adicionados"} ao orçamento!`);
      onClose();
    } catch { /* tratado no onError */ }
  }

  // ── Confirmar criação de novo orçamento com MÚLTIPLOS itens ──
  async function confirmarNovoOrcamento() {
    if (itensCarrinho.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }
    if (!clienteNome.trim()) {
      toast.error("Digite o nome do cliente");
      return;
    }
    if (!telefone.trim()) {
      toast.error("Digite o telefone do cliente");
      return;
    }
    if (!clienteEmail.trim()) {
      toast.error("Digite o email do cliente");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clienteEmail)) {
      toast.error("Email inválido");
      return;
    }
    try {
      // Se for catálogo público, usar procedure pública
      if (isPublico) {
        const result = await criarPedidoPublicoMut.mutateAsync({
          linkToken: linkToken || "",
          clienteNome: clienteNome.trim(),
          clienteEmail: clienteEmail.trim(),
          clienteTelefone: telefone.trim(),
          itens: itensCarrinho.map(item => {
            const valorUnitario = Number(item.valorUnitario || item.precoVenda || 0);
            return {
              produtoNome: item.produtoNome || item.nome || "Produto",
              quantidade: item.quantidade,
              valorUnitario: valorUnitario,
              qualidade: item.qualidadeConversao || item.qualidade,
              produtor: item.produtor,
              produtoId: item.produtoId,
            };
          }),
        });
        toast.success(`Pedido criado com sucesso! ID: ${result.id}`);
        // Limpar carrinho do localStorage
        localStorage.removeItem("carrinho_publico");
        onClose();
        return;
      }

      // Caso contrário, usar procedure protegida (para usuários logados)
      const origemFinal = (origem as string | undefined) === "catalogo-publico" ? "catalogo-publico" : undefined;
      const result = await createComItensLoteMut.mutateAsync({
        clienteNome: clienteNome.trim(),
        clienteId: clienteId || undefined,
        origem: origemFinal,
        itens: itensCarrinho.map(item => {
          const valorUnitario = Number(item.valorUnitario || item.precoVenda || 0);
          return {
            produtoNome: item.produtoNome || item.nome || "Produto",
            quantidade: String(item.quantidade),
            valorUnitario: valorUnitario.toFixed(2),
            subtotal: (item.quantidade * valorUnitario).toFixed(2),
            obs: item.obs || undefined,
          };
        }),
      });
      utils.vendas.list.invalidate();
      toast.success(`Orçamento #${result.id} criado com ${itensCarrinho.length} ${itensCarrinho.length === 1 ? "produto" : "produtos"}!`);
      
      // Enviar para WhatsApp automaticamente
      enviarParaWhatsApp(itensCarrinho);
    } catch { /* tratado no onError */ }
  }

  // ── Item inicial do catálogo ──
  const itemInicial: ItemCarrinho = {
    produtoNome,
    quantidade: parseFloat(qtd) || 1,
    valorUnitario: precoUnitario,
    origem: "catalogo",
    obs: "",
  };

  const totalCarrinho = itensCarrinho.reduce((sum, item) => sum + (item.quantidade * (item.valorUnitario || 0)), 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-background border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <FileText size={16} className="text-orange-500" />
            {tela === "produtos" ? "Selecionar Produtos" : tela === "cliente" ? "Dados do Cliente" : "Adicionar ao Orçamento"}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* ── TELA DE PRODUTOS ── */}
        {tela === "produtos" && (
          <SubtelaAdicionarProdutos
            itensIniciais={[itemInicial]}
            onConfirmar={(itens) => {
              setItensCarrinho(itens);
              setTela("cliente");
            }}
            onVoltar={() => {
              if (forceNovoOrcamento) onClose();
              else setTela("principal");
            }}
            isPending={isPending}
          />
        )}

        {/* ── TELA DE CLIENTE ── */}
        {tela === "cliente" && (
          <div className="flex flex-col h-full">
            {/* Resumo dos produtos */}
            <div className="px-5 py-3 bg-orange-50 dark:bg-orange-950/20 border-b flex-shrink-0 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Produtos selecionados:</p>
                <button
                  onClick={() => setTela("produtos")}
                  className="text-xs text-blue-500 hover:text-blue-700 underline"
                >
                  Editar
                </button>
              </div>
              <div className="space-y-2">
                {itensCarrinho.map((item, idx) => (
                  <div key={idx} className="text-xs bg-white dark:bg-background/50 p-2 rounded border flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.produtoNome}</p>
                      <p className="text-muted-foreground">R$ {(item.valorUnitario || 0).toFixed(2)}/un</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          const novoItens = [...itensCarrinho];
                          if (novoItens[idx].quantidade > 1) {
                            novoItens[idx] = { ...novoItens[idx], quantidade: novoItens[idx].quantidade - 1 };
                            setItensCarrinho(novoItens);
                          }
                        }}
                        className="px-1.5 py-0.5 bg-muted rounded hover:bg-muted/80 text-xs"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-semibold">{item.quantidade}</span>
                      <button
                        onClick={() => {
                          const novoItens = [...itensCarrinho];
                          novoItens[idx] = { ...novoItens[idx], quantidade: novoItens[idx].quantidade + 1 };
                          setItensCarrinho(novoItens);
                        }}
                        className="px-1.5 py-0.5 bg-muted rounded hover:bg-muted/80 text-xs"
                      >
                        +
                      </button>
                      <button
                        onClick={() => {
                          setItensCarrinho(itensCarrinho.filter((_, i) => i !== idx));
                        }}
                        className="px-1.5 py-0.5 bg-red-100 dark:bg-red-950/30 text-red-600 rounded hover:bg-red-200 dark:hover:bg-red-900/50 text-xs ml-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="text-right font-semibold text-xs whitespace-nowrap">
                      R$ {(item.quantidade * (item.valorUnitario || 0)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between font-bold text-sm">
                <span>Total:</span>
                <span className="text-orange-600">R$ {totalCarrinho.toFixed(2)}</span>
              </div>
            </div>

            {/* Formulário de cliente */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5 flex items-center gap-1">
                  <User size={12} /> Nome do Cliente *
                </label>
                <div className="relative" ref={cliRef}>
                  <Input
                    value={clienteNome}
                    onChange={(e) => { setClienteNome(e.target.value); setShowCliSug(true); }}
                    onFocus={() => setShowCliSug(true)}
                    placeholder="Digite o nome..."
                    className="h-9 text-sm"
                  />
                  {showCliSug && cliSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-background border rounded mt-1 shadow-lg z-10 max-h-32 overflow-y-auto">
                      {cliSuggestions.map((c: any) => (
                        <button
                          key={c.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-xs border-b last:border-0"
                          onClick={() => selectCliente(c)}
                        >
                          {c.nome} {c.telefone && `(${c.telefone})`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5 flex items-center gap-1">
                  <Phone size={12} /> Telefone *
                </label>
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5 flex items-center gap-1">
                  📧 Email *
                </label>
                <Input
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-9 text-sm"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Um novo orçamento será criado com os produtos selecionados e enviado via WhatsApp.
              </p>
            </div>

            {/* Botões */}
            <div className="px-5 py-3 border-t flex-shrink-0 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTela("produtos")}
                className="flex-1"
                disabled={isPending}
              >
                Voltar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                onClick={confirmarNovoOrcamento}
                disabled={!clienteNome.trim() || !telefone.trim() || !clienteEmail.trim() || isPending}
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Finalizar e Enviar
              </Button>
            </div>
          </div>
        )}

        {/* ── TELA PRINCIPAL (para modo antigo) ── */}
        {tela === "principal" && !forceNovoOrcamento && (
          <>
            {/* Conteúdo da tela principal original */}
            <div className="flex-1 overflow-y-auto">
              {modo === "escolher" && (
                <div className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Escolha um orçamento aberto ou crie um novo:</p>
                  {loadingOrcamentos ? (
                    <div className="text-center py-8"><Loader2 className="animate-spin mx-auto" size={20} /></div>
                  ) : orcamentosFiltrados.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Nenhum orçamento aberto</p>
                  ) : (
                    orcamentosFiltrados.map((o: any) => (
                      <button
                        key={o.id}
                        onClick={() => { setOrcamentoSelecionado(o.id); setTela("produtos"); }}
                        className="w-full p-3 border rounded-lg hover:bg-muted text-left text-sm"
                      >
                        <div className="font-semibold">Orçamento #{o.numero}</div>
                        <div className="text-xs text-muted-foreground">{o.clienteNome}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Botões da tela principal */}
            <div className="px-4 py-3 border-t flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => { setModo("novo"); setTela("produtos"); }}
              >
                <Plus size={14} /> Novo Orçamento
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
