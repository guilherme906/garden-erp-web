/**
 * OrcamentoSidePanel
 * Painel lateral deslizante que exibe o orçamento ativo com resumo de itens,
 * valores unitários, quantidades e total acumulado. Permite selecionar o
 * orçamento ativo e adicionar o produto do catálogo com um clique.
 * Suporta drag-and-drop para reordenar itens e menu de ações para finalizar.
 *
 * Melhorias:
 * - WhatsApp ao finalizar: abre link wa.me com mensagem pronta
 * - Remover item diretamente pelo painel (botão lixeira por item)
 * - Tecla Esc fecha o modal de confirmação
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShoppingCart, ChevronRight, ChevronLeft, Plus, Minus,
  Trash2, ExternalLink, Loader2, ClipboardList, X, Check,
  RefreshCw, GripVertical, MoreVertical, CheckCircle2, Ban,
  MessageCircle, Bell, Save,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

// ─── Modal rápido de lembrete vinculado ao orçamento ───
function LembreteRapidoModal({
  orcamentoId, orcamentoNum, clienteNome, onClose,
}: {
  orcamentoId: number;
  orcamentoNum: string;
  clienteNome: string;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const pad = (n: number) => String(n).padStart(2, "0");
  const daqui1h = new Date(Date.now() + 3_600_000);
  const dtDefault = `${daqui1h.getFullYear()}-${pad(daqui1h.getMonth() + 1)}-${pad(daqui1h.getDate())}T${pad(daqui1h.getHours())}:${pad(daqui1h.getMinutes())}`;

  const [titulo, setTitulo] = useState(`Orçamento ${orcamentoNum}${clienteNome ? ` — ${clienteNome}` : ""}`);
  const [descricao, setDescricao] = useState("");
  const [dataHora, setDataHora] = useState(dtDefault);
  const [prioridade, setPrioridade] = useState<"BAIXA" | "MEDIA" | "ALTA">("MEDIA");

  const createMut = trpc.lembretes.create.useMutation({
    onSuccess: () => {
      toast.success("Lembrete criado e vinculado ao orçamento!");
      utils.lembretes.list.invalidate();
      onClose();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  function salvar() {
    if (!titulo.trim()) { toast.error("Informe o título."); return; }
    if (!dataHora) { toast.error("Informe a data e hora."); return; }
    createMut.mutate({
      titulo,
      descricao: descricao || undefined,
      dataHora: new Date(dataHora).getTime(),
      prioridade,
      recorrencia: "NENHUMA",
      vinculoOrcamentoId: orcamentoId,
      vinculoOrcamentoNum: orcamentoNum,
      vinculoClienteNome: clienteNome || undefined,
    });
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Criar Lembrete
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-md px-3 py-1.5">
            <ShoppingCart className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="text-xs font-mono font-semibold text-orange-600">{orcamentoNum}</span>
            {clienteNome && <span className="text-xs text-muted-foreground truncate">— {clienteNome}</span>}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Título *</label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={255} autoFocus />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Descrição (opcional)</label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="resize-none" placeholder="Detalhes..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Data e Hora *</label>
              <Input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} className="text-xs" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Prioridade</label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as any)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIXA">🟢 Baixa</SelectItem>
                  <SelectItem value="MEDIA">🟡 Média</SelectItem>
                  <SelectItem value="ALTA">🔴 Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={createMut.isPending}>Cancelar</Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5" onClick={salvar} disabled={createMut.isPending}>
            {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Criar lembrete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ProdutoParaAdicionar {
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

interface Props {
  /** Produto que está sendo visualizado no catálogo (clicado pelo usuário) */
  produtoPendente: ProdutoParaAdicionar | null;
  /** Callback para limpar o produto pendente após adicionar */
  onProdutoPendenteConsumed: () => void;
  /** Fonte do catálogo para exibição no badge */
  origem?: string;
}

export default function OrcamentoSidePanel({ produtoPendente, onProdutoPendenteConsumed, origem = "CATÁLOGO" }: Props) {
  const [aberto, setAberto] = useState(false);
  const [orcamentoId, setOrcamentoId] = useState<number | null>(null);
  const [qtdPendente, setQtdPendente] = useState(1);

  // Modal de confirmação de finalização
  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [acaoFinalizar, setAcaoFinalizar] = useState<"APROVADO" | "CANCELADO" | null>(null);
  // Após finalizar como aprovado: mostrar botão WhatsApp
  const [mostrarWhatsApp, setMostrarWhatsApp] = useState(false);
  const [orcamentoFinalizadoId, setOrcamentoFinalizadoId] = useState<number | null>(null);

  // Confirmação de remoção de item
  const [itemParaRemover, setItemParaRemover] = useState<{ id: number; nome: string } | null>(null);

  // Modal de criar lembrete vinculado ao orçamento
  const [modalLembrete, setModalLembrete] = useState(false);

  // Modal de confirmação de limpeza de orçamento
  const [modalLimpar, setModalLimpar] = useState(false);
  
  // Indicador visual de novo orçamento criado
  const [novoOrcamentoCriado, setNovoOrcamentoCriado] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [clientes, setClientes] = useState<any[]>([]);

  // Carregar clientes
  const { data: clientesData } = trpc.clientes.list.useQuery();
  useEffect(() => {
    if (clientesData) {
      setClientes(clientesData);
    }
  }, [clientesData]);
  
  // ─── Drag-and-drop state ───
  const [itensOrdenados, setItensOrdenados] = useState<any[]>([]);
  const dragItemIdx = useRef<number | null>(null);
  
  // Atalho de teclado: N para novo orçamento (quando painel aberto) e Ctrl+N para novo orçamento (global)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Atalho global: Ctrl+N para criar novo orçamento de qualquer tela
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setAberto(true);
        handleNovoOrcamento();
        // Notificação diferenciada para atalho de teclado
        setTimeout(() => {
          toast.success("⌨️ Atalho Ctrl+N acionado! Novo orçamento criado.", { duration: 2000 });
        }, 100);
        return;
      }
      
      // Atalho local: N para novo orçamento (apenas quando painel aberto e sem orçamento selecionado)
      if ((e.key === 'n' || e.key === 'N') && aberto && !orcamentoId && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleNovoOrcamento();
      }
      
      // Atalho global: Ctrl+S para salvar orçamento
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (orcamentoId && itensOrdenados.length > 0) {
          handleSalvarRascunho();
          // Notificação diferenciada para atalho de teclado
          setTimeout(() => {
            toast.success("💾 Atalho Ctrl+S acionado! Orçamento salvo.", { duration: 2000 });
          }, 100);
        } else if (!orcamentoId) {
          toast.warning("⚠️ Nenhum orçamento selecionado para salvar.");
        } else {
          toast.warning("⚠️ Adicione produtos antes de salvar.");
        }
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aberto, orcamentoId, itensOrdenados]);
  const dragOverIdx = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverVisual, setDragOverVisual] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Ref para acessar orcamentoId atual dentro de useEffects sem causar re-execução
  const orcamentoIdRef = useRef<number | null>(null);
  useEffect(() => { orcamentoIdRef.current = orcamentoId; }, [orcamentoId]);

  // Ref para acessar orcamentosAbertos dentro de useEffects
  const orcamentosAbertosRef = useRef<any[]>([]);

  // Listar orçamentos abertos
  const { data: orcamentosAbertos = [], isLoading: loadingAbertos, refetch: refetchAbertos } =
    trpc.vendas.listAbertos.useQuery(undefined, { refetchInterval: 30000 });

  // Buscar itens do orçamento selecionado
  const { data: orcamentoDetalhe, isLoading: loadingDetalhe, refetch: refetchDetalhe } =
    trpc.vendas.get.useQuery(
      { id: orcamentoId! },
      { enabled: !!orcamentoId, refetchInterval: 15000 }
    );

  // Mutation para adicionar item
  const addItemMut = trpc.vendas.addItemToOrcamento.useMutation({
    onSuccess: () => {
      refetchDetalhe();
      utils.vendas.listAbertos.invalidate();
      toast.success("Produto adicionado ao orçamento!");
      onProdutoPendenteConsumed();
    },
    onError: (e) => toast.error("Erro ao adicionar: " + e.message),
  });

  // Mutation para criar novo orçamento com item
  const createComItemMut = trpc.vendas.createComItem.useMutation({
    onSuccess: (data) => {
      // Limpar itens antes de atualizar o ID
      setItensOrdenados([]);
      setOrcamentoId(data.id);
      // Usar setTimeout para garantir que o estado foi atualizado
      setTimeout(() => {
        refetchDetalhe();
        refetchAbertos();
        utils.vendas.listAbertos.invalidate();
      }, 50);
      toast.success(`Orçamento #${data.id} criado com sucesso!`);
      onProdutoPendenteConsumed();
    },
    onError: (e) => toast.error("Erro ao criar orçamento: " + e.message),
  });

  // Mutation para reordenar itens
  const reordenarMut = trpc.vendas.reordenarItens.useMutation({
    onError: (e) => {
      toast.error("Erro ao salvar ordem: " + e.message);
      refetchDetalhe();
    },
  });

  // Mutation para atualizar status (finalizar / cancelar)
  const updateMut = trpc.vendas.update.useMutation({
    onSuccess: () => {
      const idFinalizado = orcamentoId;
      refetchAbertos();
      utils.vendas.listAbertos.invalidate();
      setModalFinalizar(false);

      if (acaoFinalizar === "APROVADO") {
        toast.success(`Orçamento #${idFinalizado} aprovado com sucesso!`);
        // Mostrar modal WhatsApp se tiver telefone
        const tel = orcamentoDetalhe?.telefoneCliente;
        if (tel) {
          setOrcamentoFinalizadoId(idFinalizado);
          setMostrarWhatsApp(true);
        }
      } else {
        toast.success(`Orçamento #${idFinalizado} cancelado.`);
      }
      setOrcamentoId(null);
    },
    onError: (e) => toast.error("Erro ao atualizar orçamento: " + e.message),
  });

  // Mutation para remover item individual
  const removeItemMut = trpc.vendas.removeItemOrcamento.useMutation({
    onSuccess: () => {
      refetchDetalhe();
      utils.vendas.listAbertos.invalidate();
      toast.success("Item removido do orçamento.");
      setItemParaRemover(null);
    },
    onError: (e) => toast.error("Erro ao remover item: " + e.message),
  });

  // ─── Tecla Esc fecha modais ───
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (itemParaRemover) {
          setItemParaRemover(null);
        } else if (modalFinalizar) {
          setModalFinalizar(false);
        } else if (mostrarWhatsApp) {
          setMostrarWhatsApp(false);
        } else if (modalLimpar) {
          setModalLimpar(false);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalFinalizar, itemParaRemover, mostrarWhatsApp, modalLimpar]);

  // Manter ref atualizada com orcamentosAbertos
  useEffect(() => { orcamentosAbertosRef.current = orcamentosAbertos; }, [orcamentosAbertos]);

  // Flag para evitar auto-seleção logo após salvar
  const skipAutoSelectRef = useRef(false);

  // NÃO auto-selecionar orçamento - deixar o usuário escolher manualmente
  // Isso evita que o painel puxe o primeiro orçamento salvo quando abre
  useEffect(() => {
    // Apenas manter ref atualizada, sem auto-seleção
    if (skipAutoSelectRef.current) {
      skipAutoSelectRef.current = false;
    }
  }, [orcamentosAbertos, orcamentoId]);

  // Quando chega um produto pendente:
  // Usa refs para evitar race condition entre seleção automática e chegada do produto
  useEffect(() => {
    if (!produtoPendente) return;
    setQtdPendente(produtoPendente.quantidade);

    // Pegar o orcamentoId mais atual (via ref) para evitar race condition
    const currentOrcamentoId = orcamentoIdRef.current;
    const currentAbertos = orcamentosAbertosRef.current;

    if (currentOrcamentoId) {
      // Já há orçamento selecionado: adicionar diretamente SEM abrir o painel
      const subtotal = (produtoPendente.precoUnitario * produtoPendente.quantidade).toFixed(2);
      addItemMut.mutate({
        orcamentoId: currentOrcamentoId,
        produtoNome: produtoPendente.nome,
        quantidade: String(produtoPendente.quantidade),
        valorUnitario: produtoPendente.precoUnitario.toFixed(2),
        subtotal,
      });
    } else if (currentAbertos.length > 0) {
      // Há orçamentos abertos mas nenhum selecionado ainda: selecionar o primeiro e adicionar
      const primeiroId = currentAbertos[0].id;
      setOrcamentoId(primeiroId);
      const subtotal = (produtoPendente.precoUnitario * produtoPendente.quantidade).toFixed(2);
      addItemMut.mutate({
        orcamentoId: primeiroId,
        produtoNome: produtoPendente.nome,
        quantidade: String(produtoPendente.quantidade),
        valorUnitario: produtoPendente.precoUnitario.toFixed(2),
        subtotal,
      });
    } else {
      // Nenhum orçamento disponível: abrir painel para criar um novo
      setAberto(true);
    }
  }, [produtoPendente]); // eslint-disable-line react-hooks/exhaustive-deps

  // Limpar itens quando orcamentoId é null (novo orçamento)
  useEffect(() => {
    if (orcamentoId === null) {
      setItensOrdenados([]);
    }
  }, [orcamentoId]);

  // Sincronizar itens ordenados com os dados do servidor
  useEffect(() => {
    // Validar que orcamentoDetalhe pertence ao orcamentoId selecionado
    if (orcamentoDetalhe && orcamentoDetalhe.id === orcamentoId && orcamentoDetalhe.itens) {
      const sorted = [...orcamentoDetalhe.itens].sort(
        (a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0)
      );
      setItensOrdenados(sorted);
    } else if (!orcamentoId) {
      // Se nao ha orcamento selecionado, limpar itens
      setItensOrdenados([]);
    }
    // Nota: Se orcamentoDetalhe.id !== orcamentoId, significa que os dados ainda nao foram atualizados
    // e devemos manter os itens atuais (ja limpos pelo useEffect anterior)
  }, [orcamentoDetalhe, orcamentoId]);

  const totalOrcamento = Number(orcamentoDetalhe?.total || 0);
  const clienteNome = orcamentoDetalhe?.clienteNome || "(sem cliente)";
  const telefoneCliente = orcamentoDetalhe?.telefoneCliente || "";

  function handleAdicionar() {
    if (!produtoPendente) return;
    // Validação de quantidade mínima
    if (qtdPendente < 1) {
      toast.error("⚠️ Quantidade deve ser no mínimo 1 unidade.");
      return;
    }
    // Validação de quantidade máxima (opcional)
    if (qtdPendente > 999) {
      toast.error("⚠️ Quantidade não pode exceder 999 unidades.");
      return;
    }
    const subtotal = (produtoPendente.precoUnitario * qtdPendente).toFixed(2);
    if (orcamentoId) {
      addItemMut.mutate({
        orcamentoId,
        produtoNome: produtoPendente.nome,
        quantidade: String(qtdPendente),
        valorUnitario: produtoPendente.precoUnitario.toFixed(2),
        subtotal,
      });
    } else {
      createComItemMut.mutate({
        produtoNome: produtoPendente.nome,
        quantidade: String(qtdPendente),
        valorUnitario: produtoPendente.precoUnitario.toFixed(2),
        subtotal,
      });
    }
  }

  function handleFinalizarClick(acao: "APROVADO" | "CANCELADO") {
    setAcaoFinalizar(acao);
    setModalFinalizar(true);
  }

  function handleSalvarRascunho() {
    if (!orcamentoId) return;
    const idSalvo = orcamentoId;
    // Marcar para evitar auto-seleção após limpar orcamentoId
    skipAutoSelectRef.current = true;
    updateMut.mutate({ id: orcamentoId, status: "AGUARDANDO" }, {
      onSuccess: () => {
        // Limpar itens do painel
        setItensOrdenados([]);
        setOrcamentoId(null);
        // Chamar callback para limpar produto pendente
        onProdutoPendenteConsumed();
        // Fechar painel
        setAberto(false);
        // Abrir aba de Orçamentos
        window.dispatchEvent(new CustomEvent("erp-open-tab", { detail: "vendas" }));
        toast.success(`Orçamento #${idSalvo} salvo como rascunho! Abra a aba de Orçamentos para editar.`);
      },
    });
  }

  function confirmarFinalizacao() {
    if (!orcamentoId || !acaoFinalizar) return;
    updateMut.mutate({ id: orcamentoId, status: acaoFinalizar });
  }

  function gerarLinkWhatsApp(idOrc: number | null) {
    const tel = telefoneCliente.replace(/\D/g, "");
    const numero = tel.startsWith("55") ? tel : `55${tel}`;
    const total = totalOrcamento.toFixed(2).replace(".", ",");
    const msg = encodeURIComponent(
      `Olá ${clienteNome}! Seu orçamento #${idOrc} foi aprovado. ✅\n` +
      `Total: R$ ${total}\n` +
      `Qualquer dúvida, estamos à disposição. 🌿`
    );
    return `https://wa.me/${numero}?text=${msg}`;
  }

  function handleRemoverItem(item: any) {
    setItemParaRemover({ id: item.id, nome: item.produtoNome });
  }

  function confirmarRemocaoItem() {
    if (!itemParaRemover || !orcamentoId) return;
    removeItemMut.mutate({ itemId: itemParaRemover.id, vendaId: orcamentoId });
  }

  function handleLimparOrcamento() {
    // Limpar o orçamento selecionado sem salvar
    setItensOrdenados([]);
    setOrcamentoId(null);
    setAberto(false);
    onProdutoPendenteConsumed();
    setModalLimpar(false);
    refetchAbertos();
    toast.success("Orçamento descartado. Pronto para criar um novo.");
  }

  function handleNovoOrcamento() {
    // Limpar o orçamento atual e preparar para criar um novo
    setItensOrdenados([]);
    // Marcar para evitar auto-seleção após limpar orcamentoId
    skipAutoSelectRef.current = true;
    setOrcamentoId(null);
    setAberto(true); // Abrir painel automaticamente
    onProdutoPendenteConsumed();
    refetchAbertos();
    // Mostrar indicador visual de novo orçamento criado
    setNovoOrcamentoCriado(true);
    setTimeout(() => setNovoOrcamentoCriado(false), 3000); // Remover indicador após 3 segundos
    // NÃO navegar para aba de Vendas - manter no catálogo
    // Disparar evento para focar no campo de busca de produtos
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("novo-orcamento-criado"));
    }, 200);
    toast.success("✨ Novo orçamento criado! Selecione o cliente e adicione produtos.");
  }

  // ─── Drag-and-drop handlers ───
  const handleDragStart = useCallback((idx: number) => {
    dragItemIdx.current = idx;
    setDraggingIdx(idx);
  }, []);

  const handleDragEnter = useCallback((idx: number) => {
    dragOverIdx.current = idx;
    setDragOverVisual(idx);
  }, []);

  const handleDragEnd = useCallback(() => {
    const from = dragItemIdx.current;
    const to = dragOverIdx.current;

    if (from === null || to === null || from === to) {
      dragItemIdx.current = null;
      dragOverIdx.current = null;
      setDraggingIdx(null);
      setDragOverVisual(null);
      return;
    }

    const novaOrdem = [...itensOrdenados];
    const [moved] = novaOrdem.splice(from, 1);
    novaOrdem.splice(to, 0, moved);
    setItensOrdenados(novaOrdem);

    if (orcamentoId) {
      const payload = novaOrdem.map((item, idx) => ({ id: item.id, ordem: idx }));
      reordenarMut.mutate({ vendaId: orcamentoId, itens: payload });
    }

    dragItemIdx.current = null;
    dragOverIdx.current = null;
    setDraggingIdx(null);
    setDragOverVisual(null);
  }, [itensOrdenados, orcamentoId, reordenarMut]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const isPending = addItemMut.isPending || createComItemMut.isPending;

  return (
    <>
      {/* Botão flutuante para abrir/fechar */}
      <button
        onClick={() => setAberto(!aberto)}
        style={{ top: 'calc(var(--erp-header-height, 88px) + 40%)' }}
        className={`fixed right-0 z-40 flex items-center gap-1.5 px-2 py-3 rounded-l-lg shadow-lg transition-all duration-200 ${
          aberto
            ? "bg-orange-600 text-white"
            : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}
        title={aberto ? "Fechar painel" : "Abrir painel do orçamento"}
      >
        {aberto ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        <ShoppingCart className="h-4 w-4" />
        {itensOrdenados.length > 0 && (
          <span className="absolute -top-1.5 -left-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {itensOrdenados.length}
          </span>
        )}
      </button>

      {/* Painel lateral */}
      <div
        className={`fixed right-0 z-30 flex flex-col bg-white dark:bg-[#1a1a2e] border-l shadow-2xl transition-all duration-500 ease-in-out ${
          aberto ? "w-80 sm:w-96 opacity-100" : "w-0 overflow-hidden opacity-0 pointer-events-none"
        }`}
        style={{ top: 'var(--erp-header-height, 88px)', height: 'calc(100dvh - var(--erp-header-height, 88px))' }}
      >
        {aberto && (
          <>
            {/* Header */}
            <div className={`flex items-center gap-2 px-4 py-3 border-b text-white shrink-0 transition-all ${
              novoOrcamentoCriado ? "bg-green-500 animate-pulse" : "bg-orange-500"
            }`}>
              <ShoppingCart className="h-5 w-5" />
              <span className="font-semibold text-sm flex-1">
                {novoOrcamentoCriado ? "✨ Novo Orçamento" : "Orçamento Ativo"}
              </span>

              {/* Menu de ações — só exibe quando há orçamento selecionado */}
              {orcamentoId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="hover:bg-orange-600 rounded p-1 flex items-center gap-0.5 text-white text-xs font-medium"
                      title="Ações do orçamento"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                      Orçamento #{orcamentoId}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-blue-700 dark:text-blue-400 focus:text-blue-700 focus:bg-blue-50 dark:focus:bg-blue-900/20 cursor-pointer"
                      onClick={() => handleSalvarRascunho()}
                    >
                      <Save className="h-4 w-4" />
                      <div>
                        <p className="font-semibold">Salvar Orçamento</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">Salva como rascunho para finalizar depois</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-emerald-700 dark:text-emerald-400 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-900/20 cursor-pointer"
                      onClick={() => handleFinalizarClick("APROVADO")}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <div>
                        <p className="font-semibold">Finalizar como Aprovado</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">Marca o orçamento como aprovado pelo cliente</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                      onClick={() => handleFinalizarClick("CANCELADO")}
                    >
                      <Ban className="h-4 w-4" />
                      <div>
                        <p className="font-semibold">Cancelar Orçamento</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">Cancela este orçamento sem excluir</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-amber-600 dark:text-amber-400 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-900/20 cursor-pointer"
                      onClick={() => setModalLimpar(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <div>
                        <p className="font-semibold">Limpar Orçamento</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">Descarta as alterações atuais</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent("erp-open-tab", { detail: "vendas" }));
                        setAberto(false);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Abrir aba de Orçamentos</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <button onClick={() => setAberto(false)} className="hover:bg-orange-600 rounded p-0.5">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Seletor de orçamento */}
            <div className="px-3 py-2 border-b bg-orange-50 dark:bg-orange-900/10 shrink-0">
              {loadingAbertos ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando orçamentos...
                </div>
              ) : orcamentosAbertos.length === 0 ? (
                <div className="text-xs text-muted-foreground py-1 flex items-center gap-1">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Nenhum orçamento aberto. Adicione um produto para criar.
                </div>
              ) : (
                <Select
                  value={orcamentoId ? String(orcamentoId) : ""}
                  onValueChange={(v) => setOrcamentoId(Number(v))}
                >
                  <SelectTrigger className="h-8 text-xs bg-white dark:bg-background">
                    <SelectValue placeholder="Selecionar orçamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {orcamentosAbertos.map((o: any) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        <span className="font-mono font-semibold">#{o.id}</span>
                        <span className="ml-1.5 text-muted-foreground">{o.clienteNome}</span>
                        <span className="ml-1.5 text-orange-600 font-medium">
                          R$ {Number(o.total || 0).toFixed(2).replace(".", ",")}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {orcamentoId ? (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-muted-foreground">Cliente: <strong>{clienteNome}</strong></span>
                  <div className="flex-1" />
                  <button
                    onClick={() => refetchDetalhe()}
                    className="text-[10px] text-orange-600 hover:underline flex items-center gap-0.5"
                  >
                    <RefreshCw className="h-2.5 w-2.5" /> atualizar
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center mt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 font-semibold gap-1"
                    onClick={() => handleNovoOrcamento()}
                    disabled={updateMut.isPending}
                  >
                    <Plus className="h-3 w-3" />
                    Novo Orçamento
                  </Button>
                </div>
              )}
            </div>

            {/* Produto pendente para adicionar */}
            {produtoPendente && (
              <div className="px-3 py-2 border-b bg-blue-50 dark:bg-blue-900/10 shrink-0">
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="text-[9px] mb-1 border-orange-400 text-orange-700">
                      {origem}
                    </Badge>
                    <p className="text-xs font-semibold leading-tight line-clamp-2">{produtoPendente.nome}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      R$ {produtoPendente.precoUnitario.toFixed(2).replace(".", ",")} / un
                    </p>
                  </div>
                  <button
                    onClick={onProdutoPendenteConsumed}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {/* Controle de quantidade */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] text-muted-foreground">Qtd:</span>
                  <button
                    onClick={() => setQtdPendente(q => Math.max(1, q - 1))}
                    className="w-6 h-6 rounded border flex items-center justify-center hover:bg-orange-100"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{qtdPendente}</span>
                  <button
                    onClick={() => setQtdPendente(q => q + 1)}
                    className="w-6 h-6 rounded border flex items-center justify-center hover:bg-orange-100"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <div className="flex-1" />
                  <span className="text-sm font-bold text-orange-600">
                    R$ {(produtoPendente.precoUnitario * qtdPendente).toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="w-full h-8 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold"
                  onClick={handleAdicionar}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {orcamentoId ? `Adicionar ao #${orcamentoId}` : "Criar orçamento e adicionar"}
                </Button>
              </div>
            )}

            {/* Lista de itens do orçamento com drag-and-drop */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {loadingDetalhe ? (
                <div className="flex items-center justify-center h-20 gap-2 text-muted-foreground text-xs">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando itens...
                </div>
              ) : !orcamentoId ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground text-xs text-center">
                  <ClipboardList className="h-8 w-8 opacity-30" />
                  <p>Selecione um orçamento acima.</p>
                </div>
              ) : itensOrdenados.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground text-xs text-center">
                  <ShoppingCart className="h-8 w-8 opacity-30" />
                  <p>Nenhum item neste orçamento ainda.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-2 flex items-center gap-1">
                    {itensOrdenados.length} item{itensOrdenados.length !== 1 ? "s" : ""}
                    <span className="ml-auto text-[9px] opacity-60 flex items-center gap-0.5">
                      <GripVertical className="h-3 w-3" /> arraste para reordenar
                    </span>
                  </p>
                  {itensOrdenados.map((item: any, idx: number) => (
                    <div
                      key={item.id ?? idx}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      className={`group flex items-start gap-2 p-2 rounded-md border text-xs transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                        draggingIdx === idx
                          ? "opacity-40 bg-orange-50 border-orange-300 dark:bg-orange-900/20 scale-95"
                          : dragOverVisual === idx && draggingIdx !== null && draggingIdx !== idx
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 shadow-md ring-1 ring-orange-400"
                          : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20"
                      }`}
                    >
                      {/* Handle de arrasto */}
                      <div className="shrink-0 mt-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                        <GripVertical className="h-3.5 w-3.5" />
                      </div>
                      {/* Número de ordem */}
                      <span className="shrink-0 w-4 text-center text-[9px] text-muted-foreground/50 font-mono mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-tight line-clamp-2 text-[11px]">{item.produtoNome}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          <span>{item.quantidade} un</span>
                          <span>×</span>
                          <span>R$ {Number(item.valorUnitario).toFixed(2).replace(".", ",")}</span>
                        </div>
                        {item.observacao && (
                          <p className="text-[10px] text-muted-foreground italic mt-0.5 line-clamp-1">{item.observacao}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-bold text-orange-600 text-[11px] whitespace-nowrap">
                          R$ {Number(item.subtotal).toFixed(2).replace(".", ",")}
                        </span>
                        {/* Menu de ações - sempre visível em mobile */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                              title="Ações"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem
                              onClick={() => handleRemoverItem(item)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  {reordenarMut.isPending && (
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground py-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Salvando ordem...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rodapé com total e botões de ação */}
            {orcamentoId ? (
              <div className="border-t px-4 py-3 bg-gray-50 dark:bg-white/5 shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{itensOrdenados.length} item{itensOrdenados.length !== 1 ? "s" : ""}</span>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Total do orçamento</p>
                    <p className="text-lg font-bold text-orange-600 leading-tight">
                      R$ {totalOrcamento.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>

                {/* Botão criar lembrete */}
                <button
                  type="button"
                  onClick={() => setModalLembrete(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded-md py-1 transition-colors border border-dashed border-gray-200 dark:border-white/10 hover:border-orange-300"
                >
                  <Bell className="h-3.5 w-3.5" />
                  Criar lembrete para este orçamento
                </button>

                {/* Botões de ação rápida */}
                         <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 font-semibold gap-1"
                    onClick={() => handleSalvarRascunho()}
                    disabled={updateMut.isPending}
                  >
                    <Save className="h-3.5 w-3.5" />
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                    onClick={() => handleFinalizarClick("APROVADO")}
                    disabled={updateMut.isPending}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Finalizar
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 font-semibold gap-1"
                    onClick={() => setModalLimpar(true)}
                    disabled={updateMut.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 font-semibold gap-1"
                    onClick={() => handleNovoOrcamento()}
                    disabled={updateMut.isPending}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Novo
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-semibold gap-1 w-full"
                  onClick={() => handleFinalizarClick("CANCELADO")}
                  disabled={updateMut.isPending}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Cancelar Orçamento
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 font-semibold gap-1 w-full"
                  onClick={() => {
                    const mensagem = `Olá! Segue orçamento #${orcamentoId}\n\nCliente: ${clienteNome}\nTotal: R$ ${totalOrcamento.toFixed(2).replace(".", ",")}\n\nItens:\n${itensOrdenados.map((item: any) => `- ${item.nomeProduto}: ${item.quantidade}x R$ ${item.valorUnitario}`).join("\n")}\n\nData: ${new Date().toLocaleDateString("pt-BR")}\n\nPara mais detalhes, acesse o sistema.`;
                    const numeroWhatsApp = telefoneCliente.replace(/\D/g, "");
                    if (numeroWhatsApp) {
                      window.open(`https://wa.me/55${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`, "_blank");
                      toast.success("Abrindo WhatsApp...");
                    } else {
                      toast.error("Telefone do cliente não disponível.");
                    }
                  }}
                  disabled={updateMut.isPending}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Compartilhar WhatsApp
                </Button>

                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("erp-open-tab", { detail: "vendas" }));
                    setAberto(false);
                  }}
                  className="flex items-center justify-center gap-1.5 w-full text-xs text-orange-600 hover:text-orange-700 hover:underline py-0.5"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ir para Orçamentos
                </button>
              </div>
            ) : (
              <div className="border-t px-4 py-3 bg-gray-50 dark:bg-white/5 shrink-0 space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 font-semibold gap-1"
                    onClick={() => setModalLimpar(true)}
                    disabled={updateMut.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 font-semibold gap-1"
                    onClick={() => handleNovoOrcamento()}
                    disabled={updateMut.isPending}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Novo
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Overlay escuro quando painel aberto em mobile */}
      {aberto && (
        <div
          className="fixed inset-0 z-20 bg-black/20 sm:hidden"
          onClick={() => setAberto(false)}
        />
      )}

      {/* ─── Modal de confirmação de finalização ─── */}
      {modalFinalizar && acaoFinalizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 w-80 mx-4">
            <div className="flex flex-col items-center gap-3 mb-5">
              {acaoFinalizar === "APROVADO" ? (
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Ban className="h-6 w-6 text-red-600" />
                </div>
              )}
              <div className="text-center">
                <h3 className="font-bold text-base">
                  {acaoFinalizar === "APROVADO" ? "Finalizar Orçamento" : "Cancelar Orçamento"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {acaoFinalizar === "APROVADO"
                    ? `Marcar o orçamento #${orcamentoId} como aprovado?`
                    : `Cancelar o orçamento #${orcamentoId}?`}
                </p>
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{clienteNome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Itens</span>
                <span className="font-medium">{itensOrdenados.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-orange-600">
                  R$ {totalOrcamento.toFixed(2).replace(".", ",")}
                </span>
              </div>
              {telefoneCliente && acaoFinalizar === "APROVADO" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <span className="font-medium text-emerald-600">{telefoneCliente}</span>
                </div>
              )}
            </div>

            {acaoFinalizar === "APROVADO" && (
              <p className="text-[11px] text-muted-foreground bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-2 mb-4">
                O orçamento será marcado como <strong>Aprovado</strong> e sairá da lista de abertos.
                {telefoneCliente && " Você poderá enviar confirmação via WhatsApp."}
              </p>
            )}
            {acaoFinalizar === "CANCELADO" && (
              <p className="text-[11px] text-muted-foreground bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md px-3 py-2 mb-4">
                O orçamento será <strong>cancelado</strong>. Use a tela de Orçamentos para restaurá-lo.
              </p>
            )}

            <p className="text-[10px] text-muted-foreground text-center mb-3 opacity-60">Pressione Esc para voltar</p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setModalFinalizar(false)}
                disabled={updateMut.isPending}
              >
                Voltar
              </Button>
              <Button
                size="sm"
                className={`flex-1 font-semibold ${
                  acaoFinalizar === "APROVADO"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
                onClick={confirmarFinalizacao}
                disabled={updateMut.isPending}
              >
                {updateMut.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : acaoFinalizar === "APROVADO" ? (
                  "Confirmar Aprovação"
                ) : (
                  "Confirmar Cancelamento"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal WhatsApp pós-aprovação ─── */}
      {mostrarWhatsApp && orcamentoFinalizadoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 w-80 mx-4">
            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-base">Notificar Cliente</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Deseja enviar a confirmação de aprovação para o cliente via WhatsApp?
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{clienteNome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone</span>
                <span className="font-medium">{telefoneCliente}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orçamento</span>
                <span className="font-medium">#{orcamentoFinalizadoId}</span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mb-3 opacity-60">Pressione Esc para fechar</p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setMostrarWhatsApp(false)}
              >
                Agora não
              </Button>
              <a
                href={gerarLinkWhatsApp(orcamentoFinalizadoId)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMostrarWhatsApp(false)}
                className="flex-1"
              >
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold gap-1.5"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Enviar WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal de criar lembrete vinculado ao orçamento ─── */}
      {modalLembrete && orcamentoId && (
        <LembreteRapidoModal
          orcamentoId={orcamentoId}
          orcamentoNum={`#${orcamentoId}`}
          clienteNome={orcamentoDetalhe?.clienteNome || ""}
          onClose={() => setModalLembrete(false)}
        />
      )}

      {/* ─── Modal de confirmação de limpeza de orçamento ─── */}
      {modalLimpar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 w-80 mx-4">
            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-amber-600" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-base">Limpar Orçamento</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Descartar todas as alterações do orçamento #{orcamentoId}?
                </p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 mb-4 text-xs">
              <p className="text-muted-foreground">
                Os itens não salvos serão perdidos. Você poderá criar um novo orçamento em seguida.
              </p>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mb-3 opacity-60">Pressione Esc para cancelar</p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setModalLimpar(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                onClick={handleLimparOrcamento}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Limpar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal de confirmação de remoção de item ─── */}
      {itemParaRemover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-5 w-72 mx-4">
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-sm">Remover Item</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  Remover <strong>{itemParaRemover.nome}</strong> do orçamento?
                </p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mb-3 opacity-60">Pressione Esc para cancelar</p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setItemParaRemover(null)}
                disabled={removeItemMut.isPending}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={confirmarRemocaoItem}
                disabled={removeItemMut.isPending}
              >
                {removeItemMut.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Remover"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
