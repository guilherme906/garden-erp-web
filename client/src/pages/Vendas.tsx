import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, ArrowLeft, Search, X, Loader2, Download, Trash2, FileText, RefreshCw, Share2, Copy, Link2, Clock, CheckCircle2, Printer, ShoppingBag, Leaf, MoreVertical, CalendarClock, MessageCircle, Lock, AlertTriangle, PrinterCheck, TrendingUp, ShoppingCart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type ItemForm = { id?: number; produtoNome: string; quantidade: string; valorUnitario: string; observacao: string; produtoId?: number; imagemUrl?: string; produtor?: string; qualidade?: string; qualidadeConversao?: string; estoque?: string | number; };

export default function Vendas() {
  const { erpUser, isAdmin } = useErpAuth();
  const utils = trpc.useUtils();

  // Painéis de catálogo (declarados antes das queries que dependem deles)
  const [showCooperfloraPanel, setShowCooperfloraPanel] = useState(false);
  const [showVeilingPanel, setShowVeilingPanel] = useState(false);
  
  // Ref para o campo de busca de produtos (para foco automático)
  const prodInputRef = useRef<HTMLInputElement>(null);
  
  // Listener para evento de novo orçamento criado
  useEffect(() => {
    const handleNovoOrcamento = () => {
      // Focar no campo de busca de produtos após um pequeno delay
      setTimeout(() => {
        if (prodInputRef.current) {
          prodInputRef.current.focus();
          prodInputRef.current.select();
        }
      }, 100);
    };
    
    window.addEventListener('novo-orcamento-criado', handleNovoOrcamento);
    return () => window.removeEventListener('novo-orcamento-criado', handleNovoOrcamento);
  }, []);
  const [catalogBusca, setCatalogBusca] = useState("");
  const [catalogQtd, setCatalogQtd] = useState("1");
  const [catalogObs, setCatalogObs] = useState("");

  // Queries
  const { data: vendas, isLoading } = trpc.vendas.list.useQuery({ search: undefined });
  const { data: clientes } = trpc.clientes.list.useQuery({});
  const { data: produtosLoja } = trpc.loja.listar.useQuery({ limit: 500 });
  // Catálogos para painéis laterais
  const { data: cooperfloraData } = trpc.cooperflora.listar.useQuery(
    { nome: catalogBusca || undefined },
    { enabled: showCooperfloraPanel }
  );
  const { data: veilingData } = trpc.veiling.listProdutos.useQuery(
    { busca: catalogBusca || undefined, limit: 200, offset: 0 },
    { enabled: showVeilingPanel }
  );

  // View mode: "list" or "form"
  const [view, setView] = useState<"list" | "form">("list");
  const [search, setSearch] = useState("");

  // Form state
  const [editId, setEditId] = useState<number | null>(null);
  const [clienteNome, setClienteNome] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("AGUARDANDO");
  const [logTipo, setLogTipo] = useState("RETIRADA");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [horaEntrega, setHoraEntrega] = useState("");
  const [observacaoPedido, setObservacaoPedido] = useState("");
  const [frete, setFrete] = useState("0");
  const [itens, setItens] = useState<ItemForm[]>([]);

  // Item input
  const [prodInput, setProdInput] = useState("");
  const [qtdInput, setQtdInput] = useState("1");
  const [vlrInput, setVlrInput] = useState("");
  const [obsInput, setObsInput] = useState("");
  const [selectedProdId, setSelectedProdId] = useState<number | undefined>();

  // Edição inline de item (duplo clique) — usa produtoNome como chave (não índice)
  const [editingItemName, setEditingItemName] = useState<string | null>(null);
  const [editItemQtd, setEditItemQtd] = useState("");
  const [editItemVlr, setEditItemVlr] = useState("");
  const [editItemObs, setEditItemObs] = useState("");

  // Share link state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareHours, setShareHours] = useState(24);
  const [generatedLink, setGeneratedLink] = useState("");
  // Vencimento do orçamento
  const [vencimento, setVencimento] = useState("");
  // Aba ativa: ativos ou expirados
  const [abaAtiva, setAbaAtiva] = useState<"ativos" | "expirados">("ativos");
  // Filtro por data
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  // Filtro de faturamento: nao-faturados (padrão), todos, faturados
  const [faturamentoFiltro, setFaturamentoFiltro] = useState<"nao-faturados" | "todos" | "faturados">("nao-faturados");
  // Desbloqueio de orçamento expirado
  const [showDesbloquearModal, setShowDesbloquearModal] = useState(false);
  const [desbloquearId, setDesbloquearId] = useState<number | null>(null);
  const [senhaDesbloqueio, setSenhaDesbloqueio] = useState("");
  // WhatsApp do orçamento
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [whatsappOrcId, setWhatsappOrcId] = useState<number | null>(null);
  const [whatsappToken, setWhatsappToken] = useState("");
  const [prorrogarId, setProrrogarId] = useState<number | null>(null);
  const [prorrogarData, setProrrogarData] = useState("");
  const [showProrrogarModal, setShowProrrogarModal] = useState(false);

  // Suggestions
  const [showCliSug, setShowCliSug] = useState(false);
  const [showProdSug, setShowProdSug] = useState(false);
  const cliRef = useRef<HTMLDivElement>(null);
  const prodRef = useRef<HTMLDivElement>(null);

  const createMut = trpc.vendas.create.useMutation({
    onSuccess: () => { utils.vendas.list.invalidate(); toast.success("Venda salva!"); voltarLista(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.vendas.update.useMutation({
    onSuccess: () => { utils.vendas.list.invalidate(); toast.success("Venda atualizada!"); voltarLista(); },
    onError: (e) => toast.error(e.message),
  });
  // Mutation silenciosa para auto-save sem fechar o formulário
  const [isSilentSaving, setIsSilentSaving] = useState(false);
  const silentUpdateMut = trpc.vendas.update.useMutation({
    onSuccess: () => { utils.vendas.list.invalidate(); setIsSilentSaving(false); },
    onError: (e) => { setIsSilentSaving(false); toast.error("Erro ao salvar: " + e.message); },
  });
  const shareMut = trpc.vendaLinks.create.useMutation({
    onSuccess: (data) => {
      const link = `${window.location.origin}/pedido/${data.token}`;
      setGeneratedLink(link);
      toast.success("Link gerado com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });
  const createClienteMut = trpc.clientes.create.useMutation({
    onSuccess: (result) => {
      utils.clientes.list.invalidate();
      toast.success(`Cliente cadastrado com sucesso!`);
    },
    onError: (e) => toast.error("Erro ao cadastrar cliente: " + e.message),
  });
  const createProdutoMut = trpc.produtos.create.useMutation({
    onSuccess: () => { utils.produtos.list.invalidate(); },
    onError: (e) => toast.error("Erro ao cadastrar produto: " + e.message),
  });
  const deleteMut = trpc.vendas.delete.useMutation({
    onSuccess: () => { utils.vendas.list.invalidate(); toast.success("Venda movida para lixeira!"); setDeleteConfirm(null); },
    onError: (e) => toast.error("Erro ao excluir: " + e.message),
  });
  // Expirados
  const { data: vendasExpiradas, isLoading: isLoadingExp } = trpc.vendas.listExpirados.useQuery();
  // Desbloqueio
  const desbloquearMut = trpc.vendas.desbloquear.useMutation({
    onSuccess: () => { utils.vendas.listExpirados.invalidate(); utils.vendas.list.invalidate(); toast.success("Orçamento desbloqueado com sucesso!"); setShowDesbloquearModal(false); setSenhaDesbloqueio(""); },
    onError: (e) => toast.error(e.message),
  });
  // Prorrogar
  const prorrogarMut = trpc.vendas.prorrogar.useMutation({
    onSuccess: () => { utils.vendas.listExpirados.invalidate(); utils.vendas.list.invalidate(); toast.success("Vencimento prorrogado!"); setShowProrrogarModal(false); },
    onError: (e) => toast.error(e.message),
  });
  // Gerar link WhatsApp
  const gerarLinkMut = trpc.vendas.gerarLink.useMutation({
    onSuccess: (data) => { setWhatsappToken(data.token); },
    onError: (e) => toast.error(e.message),
  });

  // Delete confirmation (orçamento inteiro)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; clienteNome: string } | null>(null);
  // Confirmação de exclusão de item individual do orçamento
  const [removeItemConfirm, setRemoveItemConfirm] = useState<{ item: ItemForm; idx: number } | null>(null);
  // Seleção em massa
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteManyConfirm, setShowDeleteManyConfirm] = useState(false);
  const [showImpressaoLote, setShowImpressaoLote] = useState(false);
  const [imprimindoLote, setImprimindoLote] = useState(false);
  // Query para buscar orçamentos selecionados com itens (só ativa quando modal está aberto)
  const idsParaImprimir = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const { data: orcamentosParaImprimir, isLoading: loadingOrcamentosImprimir } = trpc.vendas.getByIds.useQuery(
    { ids: idsParaImprimir },
    { enabled: showImpressaoLote && idsParaImprimir.length > 0 }
  );
  // Mesclagem de pedidos
  const [showMesclarModal, setShowMesclarModal] = useState(false);
  const [mesclarAgrupar, setMesclarAgrupar] = useState(true);
  const [mesclarMoverLixeira, setMesclarMoverLixeira] = useState(true);
  const [mesclarClienteNome, setMesclarClienteNome] = useState('');
  const [mesclarObs, setMesclarObs] = useState('');
  const [mesclarVencimento, setMesclarVencimento] = useState('');
  const idsParaMesclar = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const { data: orcamentosParaMesclar, isLoading: loadingMesclar } = trpc.vendas.getByIds.useQuery(
    { ids: idsParaMesclar },
    { enabled: showMesclarModal && idsParaMesclar.length >= 2 }
  );
  const mesclarMut = trpc.vendas.mesclar.useMutation({
    onSuccess: (data) => {
      utils.vendas.list.invalidate();
      toast.success(`Orçamentos mesclados! Novo orçamento #${data.novoId} criado com ${data.totalItens} item(s).`);
      setSelectedIds(new Set());
      setShowMesclarModal(false);
    },
    onError: (e) => toast.error('Erro ao mesclar: ' + e.message),
  });
  // Mutation para remover item diretamente do banco (exclusão imediata)
  const removeItemMut = trpc.vendas.removeItemOrcamento.useMutation({
    onSuccess: () => {
      utils.vendas.list.invalidate();
      toast.success("Item removido!");
      // Recarregar itens do orçamento atual
      if (editId) {
        const vAtual = (vendas as any[])?.find((v: any) => v.id === editId);
        if (vAtual) {
          // Refetch para obter itens atualizados
          utils.vendas.list.invalidate().then(() => {
            const vAtualizado = (vendas as any[])?.find((v: any) => v.id === editId);
            if (vAtualizado) {
              setItens((vAtualizado.itens || [])
                .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
                .map((i: any) => ({
                  id: i.id,
                  produtoNome: i.produtoNome,
                  quantidade: String(i.quantidade),
                  valorUnitario: String(i.valorUnitario),
                  observacao: i.observacao || "",
                  produtoId: i.produtoId,
                })));
            }
          });
        }
      }
    },
    onError: (e) => toast.error("Erro ao remover item: " + e.message),
  });

  const deleteManyMut = trpc.vendas.deleteMany.useMutation({
    onSuccess: (data) => {
      utils.vendas.list.invalidate();
      toast.success(`${data.deleted} orçamento(s) movido(s) para a lixeira!`);
      setSelectedIds(new Set());
      setShowDeleteManyConfirm(false);
    },
    onError: (e) => toast.error('Erro ao excluir: ' + e.message),
  });
  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredVendas.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVendas.map((v: any) => v.id)));
    }
  };

  // Faturamento
  const [showFaturarDialog, setShowFaturarDialog] = useState(false);
  const [formaPagamentoId, setFormaPagamentoId] = useState<number | undefined>();
  const [dataVencimento, setDataVencimento] = useState(new Date().toISOString().split("T")[0]);
  const { data: formasPagamento } = trpc.financeiro.formasPagamento.list.useQuery();
  const faturarMut = trpc.financeiro.titulos.faturar.useMutation({
    onSuccess: (data: any) => {
      utils.vendas.list.invalidate();
      utils.financeiro.titulos.listPendentes.invalidate();
      utils.vendasEfetivas.list.invalidate();
      if (data?.caixaLancado) {
        toast.success("Pedido faturado! Entrada lançada no caixa e Venda Efetiva criada.");
      } else if (data?.caixaAviso) {
        toast.success("Pedido faturado e Venda Efetiva criada!");
        toast.warning(data.caixaAviso, { duration: 6000 });
      } else {
        toast.success("Pedido faturado com sucesso!");
      }
      setShowFaturarDialog(false);
      voltarLista();
    },
    onError: (e: any) => toast.error("Erro ao faturar: " + e.message),
  });

  const subtotalItens = useMemo(() => itens.reduce((s, i) => s + Number(i.quantidade) * Number(i.valorUnitario), 0), [itens]);
  const totalVenda = useMemo(() => subtotalItens + (parseFloat(frete) || 0), [subtotalItens, frete]);

  // Converter em Venda Efetiva
  const [showConverterModal, setShowConverterModal] = useState(false);
  const [converterOrcId, setConverterOrcId] = useState<number | null>(null);
  const [converterObs, setConverterObs] = useState('');

  // Enviar para Pedido de Compra
  const [showEnviarPedidoModal, setShowEnviarPedidoModal] = useState(false);
  const [enviarVendaId, setEnviarVendaId] = useState<number | null>(null);
  const [enviarPedidoCompraId, setEnviarPedidoCompraId] = useState<string>('novo');
  // Enviar em lote para Pedido de Compra
  const [showEnviarLoteModal, setShowEnviarLoteModal] = useState(false);
  const [enviarLoteVendaIds, setEnviarLoteVendaIds] = useState<number[]>([]);
  const [enviarLotePedidoCompraId, setEnviarLotePedidoCompraId] = useState<string>('novo');
  const { data: previewPedido, isLoading: previewLoading } = trpc.enviarPedidoCompra.preview.useQuery(
    { vendaId: enviarVendaId! },
    { enabled: !!enviarVendaId && showEnviarPedidoModal }
  );
  const { data: pedidosCompraAbertos } = trpc.enviarPedidoCompra.listarPedidosCompra.useQuery(
    undefined,
    { enabled: showEnviarPedidoModal || showEnviarLoteModal }
  );
  const enviarPedidoMut = trpc.enviarPedidoCompra.enviar.useMutation({
    onSuccess: (data: any) => {
      toast.success(`${data.qtdItens} produto(s) enviado(s) ao Pedido de Compra #${data.pedidoId}!`);
      setShowEnviarPedidoModal(false);
      setEnviarVendaId(null);
      setEnviarPedidoCompraId('novo');
      // Navegar para a aba de Pedidos de Compra
      window.dispatchEvent(new CustomEvent('erp-open-tab', { detail: { tabId: 'pedidos-compra' } }));
    },
    onError: (e: any) => toast.error('Erro ao enviar: ' + e.message),
  });
  const enviarLoteMut = trpc.enviarPedidoCompra.enviarLote.useMutation({
    onSuccess: (data: any) => {
      toast.success(`${data.qtdOrcamentos} orcamento(s) com ${data.qtdItens} produto(s) enviado(s) ao Pedido de Compra #${data.pedidoId}!`);
      setShowEnviarLoteModal(false);
      setEnviarLoteVendaIds([]);
      setEnviarLotePedidoCompraId('novo');
      setSelectedIds(new Set());
      utils.vendas.list.invalidate();
      window.dispatchEvent(new CustomEvent('erp-open-tab', { detail: { tabId: 'pedidos-compra' } }));
    },
    onError: (e: any) => toast.error('Erro ao enviar em lote: ' + e.message),
  });
  const { data: jaConvertido } = trpc.vendasEfetivas.verificarConversao.useQuery(
    { orcamentoId: converterOrcId! },
    { enabled: !!converterOrcId }
  );
  const converterMut = trpc.vendasEfetivas.converter.useMutation({
    onSuccess: () => {
      utils.vendas.list.invalidate();
      toast.success('Orçamento convertido em venda efetiva!');
      setShowConverterModal(false);
      setConverterOrcId(null);
      setConverterObs('');
    },
    onError: (e) => toast.error('Erro ao converter: ' + e.message),
  });

  // Estoque dos itens do orçamento em edição
  const { data: estoqueItens, isLoading: loadingEstoque } = trpc.vendas.getEstoqueItens.useQuery(
    { vendaId: editId! },
    { enabled: !!editId && view === 'form', refetchInterval: 60000 }
  );
  // Mapa itemId → estoque para lookup rápido
  const estoqueMap = useMemo(() => {
    if (!estoqueItens) return new Map<string, { estoque: number | null; fonte: string }>();
    const m = new Map<string, { estoque: number | null; fonte: string }>();
    estoqueItens.forEach((e: any) => m.set(e.produtoNome.toLowerCase().trim(), { estoque: e.estoque, fonte: e.fonte }));
    return m;
  }, [estoqueItens]);

  // IDs dos orçamentos APROVADOS para verificar indicador de envio
  // Usa apenas os IDs visíveis na tela (filteredVendas) para evitar query com lista enorme
  // Nota: filteredVendas é calculado abaixo, mas como useMemo é lazy, não há problema de ordem
  const aprovadosIds = useMemo(() => {
    if (!vendas) return [];
    // Limitar a 200 IDs para evitar SQL muito longo
    return vendas
      .filter((v: any) => v.status === 'APROVADO' && !v.deletedAt)
      .map((v: any) => v.id)
      .slice(0, 200);
  }, [vendas]);
  const { data: enviadosMap } = trpc.enviarPedidoCompra.verificarEnviadoLote.useQuery(
    { vendaIds: aprovadosIds },
    { enabled: aprovadosIds.length > 0 }
  );

  // Filtered vendas (AGUARDANDO e APROVADO — exclui apenas CANCELADO e EXPIRADO)
  const filteredVendas = useMemo(() => {
    if (!vendas) return [];
    let lista = vendas.filter((v: any) => v.status !== 'EXPIRADO' && v.status !== 'CANCELADO' && !v.deletedAt);
    
    // Aplicar filtro de faturamento
    if (faturamentoFiltro === 'nao-faturados') {
      lista = lista.filter((v: any) => !v.faturado);
    } else if (faturamentoFiltro === 'faturados') {
      lista = lista.filter((v: any) => v.faturado);
    }
    // 'todos' nao filtra
    
    // Filtro por data
    if (filtroDataInicio) {
      lista = lista.filter((v: any) => v.data >= filtroDataInicio);
    }
    if (filtroDataFim) {
      lista = lista.filter((v: any) => v.data <= filtroDataFim);
    }
    
    if (!search) return lista;
    const s = search.toLowerCase();
    return lista.filter((v: any) =>
      (v.clienteNome || "").toLowerCase().includes(s) ||
      (v.vendedorNome || "").toLowerCase().includes(s) ||
      String(v.id).includes(s)
    );
  }, [vendas, search, faturamentoFiltro, filtroDataInicio, filtroDataFim]);
  
  // Contador de orçamentos em rascunho (AGUARDANDO)
  const rascunhoCount = useMemo(() => {
    if (!vendas) return 0;
    return vendas.filter((v: any) => v.status === 'AGUARDANDO' && !v.deletedAt).length;
  }, [vendas]);

  // Filtered expirados
  const filteredExpirados = useMemo(() => {
    if (!vendasExpiradas) return [];
    if (!search) return vendasExpiradas;
    const s = search.toLowerCase();
    return vendasExpiradas.filter((v: any) =>
      (v.clienteNome || "").toLowerCase().includes(s) ||
      String(v.id).includes(s)
    );
  }, [vendasExpiradas, search]);

  // Client suggestions
  const cliSuggestions = useMemo(() => {
    if (!clienteNome || clienteNome.length < 1) return [];
    return (clientes || []).filter((c: any) => c.nome.toLowerCase().includes(clienteNome.toLowerCase())).slice(0, 8);
  }, [clienteNome, clientes]);

  // Product suggestions - usa apenas Produtos da Loja (cadastro manual)
  const prodSuggestions = useMemo(() => {
    if (!prodInput || prodInput.length < 1) return [];
    const lista = produtosLoja?.items || [];
    return lista.filter((p: any) => p.nome.toLowerCase().includes(prodInput.toLowerCase())).slice(0, 8);
  }, [prodInput, produtosLoja]);

  function novoRegistro() {
    setEditId(null);
    setClienteNome("");
    setData(new Date().toISOString().split("T")[0]);
    setStatus("AGUARDANDO");
    setLogTipo("RETIRADA");
    setRua(""); setNumero(""); setBairro("");
    setTelefoneCliente("");
    setDataEntrega("");
    setHoraEntrega("");
    setObservacaoPedido("");
    setFrete("0");
    setVencimento("");
    setItens([]);
    clearItemInputs();
    setView("form");
  }

  function voltarLista() {
    setView("list");
    setEditId(null);
  }

  function clearItemInputs() {
    setProdInput(""); setQtdInput("1"); setVlrInput(""); setObsInput(""); setSelectedProdId(undefined); setSelectedProdProdutor(undefined);
  }

  function addItem() {
    if (!prodInput.trim()) { toast.error("Informe o produto"); return; }
    const vlr = parseFloat(vlrInput) || 0;
    const novoItem = { produtoNome: prodInput, quantidade: qtdInput, valorUnitario: String(vlr), observacao: obsInput, produtoId: selectedProdId, imagemUrl: selectedProdImagem, produtor: selectedProdProdutor };
    const itensAtualizados = [...itens, novoItem];
    setItens(itensAtualizados);
    setSelectedProdImagem(undefined);
    setSelectedProdProdutor(undefined);
    clearItemInputs();
    // Auto-save imediato no banco quando editando orçamento existente
    if (editId && clienteNome.trim()) {
      setIsSilentSaving(true);
      const payload = buildPayload(itensAtualizados);
      silentUpdateMut.mutate(
        { id: editId, ...payload },
        {
          onSuccess: () => {
            utils.vendas.list.invalidate();
            setIsSilentSaving(false);
            toast.success(`"${novoItem.produtoNome}" adicionado e salvo!`);
          },
          onError: (e) => {
            setIsSilentSaving(false);
            toast.error("Erro ao salvar item: " + e.message);
          },
        }
      );
    }
  }

  function removeItem(produtoNome: string) {
    // Remover apenas do estado local (usado quando o orçamento ainda não foi salvo)
    setItens(itens.filter((item) => item.produtoNome !== produtoNome));
    setEditingItemName(null);
  }

  // Verificar se o pedido atual está faturado (campo faturado=1 OU convertido em venda efetiva via isFaturado)
  const pedidoFaturado = editId ? (() => { const v = vendas?.find((v: any) => v.id === editId); return !!(v?.faturado || v?.isFaturado); })() : false;

  function startEditItem(produtoNome: string) {
    if (pedidoFaturado) { toast.error("Pedido faturado não pode ser alterado"); return; }
    // Encontrar item pelo nome (chave única)
    const item = itens.find(i => i.produtoNome === produtoNome);
    if (!item) return;
    setEditingItemName(produtoNome);
    setEditItemQtd(item.quantidade);
    setEditItemVlr(item.valorUnitario);
    setEditItemObs(item.observacao || "");
  }

  function saveEditItem() {
    if (editingItemName === null) return;
    // Atualizar item pelo nome (chave única)
    const updated = itens.map(item =>
      item.produtoNome === editingItemName
        ? { ...item, quantidade: editItemQtd, valorUnitario: editItemVlr, observacao: editItemObs }
        : item
    );
    setItens(updated);
    setEditingItemName(null);
    // Auto-save no banco se estiver editando um orçamento existente
    if (editId && clienteNome.trim() && updated.length > 0) {
      setIsSilentSaving(true);
      const payload = buildPayload(updated);
      silentUpdateMut.mutate({ id: editId, ...payload });
      toast.success("Item atualizado e salvo!");
    } else {
      toast.success("Item atualizado!");
    }
  }

  function cancelEditItem() {
    setEditingItemName(null);
  }

  function selectCliente(nome: string) {
    setClienteNome(nome);
    setShowCliSug(false);
  }

  async function cadastrarClienteRapido() {
    const nome = clienteNome.trim().toUpperCase();
    if (!nome) { toast.error("Digite o nome do cliente"); return; }
    try {
      await createClienteMut.mutateAsync({ nome });
      setClienteNome(nome);
      setShowCliSug(false);
    } catch { /* erro já tratado no onError */ }
  }

  async function cadastrarProdutoRapido() {
    const desc = prodInput.trim().toUpperCase();
    if (!desc) { toast.error("Digite o nome do produto"); return; }
    try {
      const result = await createProdutoMut.mutateAsync({ descricao: desc, preco: vlrInput || "0" });
      const prodId = typeof result?.id === 'number' ? result.id : undefined;
      setProdInput(desc);
      setSelectedProdId(prodId);
      setShowProdSug(false);
      toast.success(`Produto "${desc}" cadastrado!`);
    } catch { /* erro já tratado no onError */ }
  }

  const [selectedProdImagem, setSelectedProdImagem] = useState<string | undefined>(undefined);
  const [selectedProdProdutor, setSelectedProdProdutor] = useState<string | undefined>(undefined);
  function selectProduto(p: any) {
    // Produtos da Loja usam p.nome; produtos antigos usam p.descricao
    setProdInput(p.nome ?? p.descricao);
    setVlrInput(String(p.preco));
    setSelectedProdId(p.id);
    setSelectedProdImagem(p.imagemUrl ?? undefined);
    setSelectedProdProdutor(p.produtor ?? undefined);
    setShowProdSug(false);
  }

  function buildPayload(itensOverride?: ItemForm[]) {
    const itensUsados = itensOverride ?? itens;
    const subtotal = itensUsados.reduce((s, i) => s + Number(i.quantidade) * Number(i.valorUnitario), 0);
    const totalComFrete = subtotal + (parseFloat(frete) || 0);
    const logistica = logTipo === "ENTREGA" ? `ENTREGA - ${rua} ${numero} ${bairro}`.trim() : "RETIRADA";
    return {
      clienteNome,
      vendedorId: erpUser?.id,
      vendedorNome: erpUser?.nome,
      data,
      status: status as any,
      logistica,
      total: totalComFrete.toFixed(2),
      frete: (parseFloat(frete) || 0).toFixed(2),
      telefoneCliente: telefoneCliente || undefined,
      dataEntrega: dataEntrega || undefined,
      horaEntrega: horaEntrega || undefined,
      vencimento: vencimento || undefined,
      observacaoPedido: observacaoPedido || undefined,
      itens: itensUsados.map(i => ({
        produtoNome: i.produtoNome,
        produtoId: i.produtoId ?? undefined,
        quantidade: i.quantidade,
        valorUnitario: i.valorUnitario,
        subtotal: (Number(i.quantidade) * Number(i.valorUnitario)).toFixed(2),
        observacao: i.observacao || undefined,
      })),
    };
  }

  function handleSave() {
    if (pedidoFaturado) { toast.error("Pedido faturado não pode ser alterado!"); return; }
    if (!clienteNome.trim()) { toast.error("Preencha o cliente!"); return; }
    if (itens.length === 0) { toast.error("Adicione pelo menos um item!"); return; }
    const payload = buildPayload();
    if (editId) {
      updateMut.mutate({ id: editId, ...payload });
    } else {
      createMut.mutate(payload);
    }
  }

  // Remove item do orçamento: salva o orçamento inteiro sem o item excluído
  // Isso garante que o item não seja reinserido pela sincronização do pedido de compra
  function removeItemAndSave(item: ItemForm) {
    if (pedidoFaturado) { toast.error("Pedido faturado não pode ser alterado!"); return; }
    if (!clienteNome.trim()) { toast.error("Preencha o cliente!"); return; }
    
    // Remover o item do estado local (filtra por id se disponível, senão por nome)
    const itensAtualizados = item.id
      ? itens.filter(i => i.id !== item.id)
      : itens.filter(i => i.produtoNome !== item.produtoNome);
    
    setItens(itensAtualizados);
    setEditingItemName(null);
    
    if (editId) {
      // Salvar o orçamento inteiro sem o item excluído usando silentUpdateMut
      // para não fechar o formulário após salvar
      const payload = buildPayload(itensAtualizados);
      setIsSilentSaving(true);
      silentUpdateMut.mutate(
        { id: editId, ...payload },
        {
          onSuccess: () => {
            utils.vendas.list.invalidate();
            setIsSilentSaving(false);
            toast.success(`"${item.produtoNome}" removido!`);
          },
          onError: (e) => {
            // Reverter o estado local em caso de erro
            setItens(itens);
            setIsSilentSaving(false);
            toast.error("Erro ao remover item: " + e.message);
          },
        }
      );
    } else {
      toast.success(`"${item.produtoNome}" removido.`);
    }
  }

  function openEdit(v: any) {
    setClienteNome(v.clienteNome || "");
    setData(v.data);
    setStatus(v.status);
    const log = v.logistica || "";
    if (log.startsWith("ENTREGA")) {
      setLogTipo("ENTREGA");
      const parts = log.replace("ENTREGA - ", "").split(" ");
      setRua(parts[0] || ""); setNumero(parts[1] || ""); setBairro(parts[2] || "");
    } else {
      setLogTipo("RETIRADA");
      setRua(""); setNumero(""); setBairro("");
    }
    setTelefoneCliente(v.telefoneCliente || "");
    setDataEntrega(v.dataEntrega || "");
    setHoraEntrega(v.horaEntrega || "");
    setObservacaoPedido(v.observacaoPedido || "");
    setFrete(v.frete != null ? String(Number(v.frete).toFixed(2)) : "0");
    setVencimento(v.vencimento || "");
    setItens((v.itens || [])
      .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map((i: any) => ({
        id: i.id,
        produtoNome: i.produtoNome,
        quantidade: String(i.quantidade),
        valorUnitario: String(i.valorUnitario),
        observacao: i.observacao || "",
        produtoId: i.produtoId,
      })));
    setEditId(v.id);
    clearItemInputs();
    setView("form");
  }

  // Imprimir PDF da venda atual
  async function imprimirPDF() {
    if (itens.length === 0) { toast.error("Adicione itens antes de gerar o PDF"); return; }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 20; // margem inferior para numeração de páginas
    let yPos = 10;

    // ===== FUNÇÃO AUXILIAR: Cabeçalho compacto para páginas de continuação =====
    const drawPageHeader = (pageNum: number, isFirst: boolean) => {
      if (isFirst) return; // primeira página já tem cabeçalho completo
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Pedido ${editId || "Novo"} - GARDEN CENTER PRIMAVERA`, 14, 8);
      doc.text(`${clienteNome || "-"}`, 14, 12);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(14, 14, pageWidth - 14, 14);
      doc.setTextColor(0, 0, 0);
    };

    // ===== FUNÇÃO AUXILIAR: Verificar se precisa nova página =====
    const checkPageBreak = (requiredSpace: number): boolean => {
      if (yPos + requiredSpace > pageHeight - marginBottom) {
        doc.addPage();
        drawPageHeader(doc.getNumberOfPages(), false);
        yPos = 18;
        return true;
      }
      return false;
    };

    // ===== CABEÇALHO COM LOGO E DADOS DA EMPRESA (primeira página) =====
    // Carregar logo
    const logoUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663539257200/nE9aRDyk9G49cwSdfYmqny/logo-garden_de682faf.png";
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject(new Error("Logo não carregou"));
        logoImg.src = logoUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = logoImg.naturalWidth;
      canvas.height = logoImg.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(logoImg, 0, 0);
      const logoDataUrl = canvas.toDataURL("image/png");
      // Logo proporcional: original 2048x1065, escalar para ~50mm largura
      const logoW = 50;
      const logoH = logoW * (1065 / 2048);
      doc.addImage(logoDataUrl, "PNG", 14, yPos - 2, logoW, logoH);
    } catch (e) {
      // Fallback: texto se logo não carregar
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("GARDEN CENTER PRIMAVERA", 14, yPos + 5);
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`${new Date().toLocaleString("pt-BR")}`, pageWidth - 14, yPos, { align: "right" });
    
    // Dados da empresa à direita
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Avenida João Naves de Ávila, Nº 5420", pageWidth - 14, yPos + 5, { align: "right" });
    doc.text("38408680 - Uberlândia, MG", pageWidth - 14, yPos + 10, { align: "right" });
    doc.text("CNPJ: 24.069.959/0001-41, IE: 0026958700040", pageWidth - 14, yPos + 15, { align: "right" });
    
    yPos += 25;

    // ===== TÍTULO PRINCIPAL =====
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const numeroSequencial = vendas?.find((v: any) => v.id === editId)?.numeroSequencial || editId;
    const numeroFormatado = numeroSequencial ? String(numeroSequencial).padStart(3, '0') : "Novo";
    doc.text(`Pedido ${numeroFormatado}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 12;

    // ===== SEÇÃO CLIENTE =====
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Cliente", 14, yPos);
    yPos += 6;
    
    // Box do cliente
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(14, yPos - 4, pageWidth - 28, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const clienteInfo = clientes?.find((c: any) => c.nome === clienteNome);
    doc.text(`${clienteNome || "-"}`, 16, yPos + 2);
    if (clienteInfo?.telefone) doc.text(`Telefone: ${clienteInfo.telefone}`, 16, yPos + 7);
    
    // Box com dados do pedido à direita
    doc.rect(pageWidth - 60, yPos - 4, 46, 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Número do pedido", pageWidth - 58, yPos);
    doc.text("Data", pageWidth - 58, yPos + 6);
    doc.text("Vendedor", pageWidth - 58, yPos + 12);
    doc.setFont("helvetica", "normal");
    doc.text(String(editId || "-"), pageWidth - 28, yPos);
    doc.text(data, pageWidth - 28, yPos + 6);
    const vendedorNome = (erpUser?.nome || "-").substring(0, 15);
    doc.text(vendedorNome, pageWidth - 28, yPos + 12);
    
    yPos += 22;

    // ===== TABELA DE ITENS (com quebra de página automática) =====
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Itens do pedido de venda", 14, yPos);
    yPos += 6;

    const tableData = itens.map(i => {
      const itemAny = i as any;
      // Montar descrição completa como na tela de orçamento
      let descricao = i.produtoNome || "";
      let detalhes = [];
      
      if (itemAny.qualidade || itemAny.qualidadeConversao) {
        detalhes.push(`Qualidade: ${itemAny.qualidade || itemAny.qualidadeConversao}`);
      }
      if (itemAny.produtor) {
        detalhes.push(itemAny.produtor);
      }
      if (itemAny.estoque) {
        detalhes.push(`Estoque: ${itemAny.estoque}`);
      }
      
      if (detalhes.length > 0) {
        descricao += `\n${detalhes.join(" • ")}`;
      }
      
      return [
        descricao,
        "", // Código
        "", // Un.
        i.quantidade,
        `R$ ${Number(i.valorUnitario).toFixed(2)}`,
        `R$ ${(Number(i.quantidade) * Number(i.valorUnitario)).toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [["Descrição do produto/serviço", "Código", "Un.", "Qtd.", "Valor unitário", "Valor total"]],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold", valign: "middle" },
      columnStyles: {
        0: { cellWidth: 80, valign: "top" },
        1: { cellWidth: 20 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15, halign: "right" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 25, halign: "right" }
      },
      // Quebra de página automática com cabeçalho repetido
      pageBreak: "auto",
      showHead: "everyPage",
      margin: { top: 18, bottom: marginBottom, left: 14, right: 14 },
      didDrawPage: (data: any) => {
        // Cabeçalho compacto nas páginas de continuação
        if (data.pageNumber > 1) {
          drawPageHeader(data.pageNumber, false);
        }
      },
      didParseCell: (data: any) => {
        // Aumentar altura das linhas para acomodar múltiplas linhas de texto
        if (data.row.index >= 0 && data.column.index === 0) {
          data.cell.height = 18;
        }
      }
    });

    yPos = (doc as any).lastAutoTable?.finalY || yPos + 30;
    yPos += 4;

    // ===== RESUMO DE TOTAIS (verificar se cabe na página) =====
    checkPageBreak(25);
    const totalQtd = itens.reduce((s, i) => s + Number(i.quantidade), 0);
    const freteVal = parseFloat(frete) || 0;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Nº de itens: ${itens.length.toFixed(2)}`, pageWidth - 50, yPos);
    doc.text(`Soma das Qtdes: ${totalQtd.toFixed(2)}`, pageWidth - 50, yPos + 5);
    doc.setFont("helvetica", "bold");
    doc.text(`Subtotal dos itens: R$ ${subtotalItens.toFixed(2)}`, pageWidth - 50, yPos + 10);
    if (freteVal > 0) {
      doc.setFont("helvetica", "normal");
      doc.text(`Frete: R$ ${freteVal.toFixed(2)}`, pageWidth - 50, yPos + 15);
      doc.setFont("helvetica", "bold");
      doc.text(`Total do pedido: R$ ${totalVenda.toFixed(2)}`, pageWidth - 50, yPos + 20);
    } else {
      doc.text(`Total do pedido: R$ ${totalVenda.toFixed(2)}`, pageWidth - 50, yPos + 15);
    }

    yPos += 22;

    // ===== SEÇÃO OBSERVAÇÕES (verificar se cabe na página) =====
    checkPageBreak(45); // espaço para observações + QR code
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Observações", 14, yPos);
    yPos += 4;
    doc.setDrawColor(0, 0, 0);
    doc.rect(14, yPos, pageWidth - 28, 15);

    // Info de conferência (se o pedido foi conferido)
    if (editId && vendas) {
      const vendaAtual = vendas.find((v: any) => v.id === editId);
      if (vendaAtual?.conferido) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(34, 139, 34);
        doc.text(`\u2713 CONFERIDO por ${vendaAtual.conferidoPor || "-"}`, 16, yPos + 3);
        if (vendaAtual.conferidoEm) {
          doc.text(`em ${new Date(vendaAtual.conferidoEm).toLocaleString("pt-BR")}`, 16, yPos + 8);
        }
        const itensComDiv = (vendaAtual.itens || []).filter((i: any) => i.qtdConferida != null && String(i.qtdConferida) !== String(i.quantidade));
        if (itensComDiv.length > 0) {
          doc.setTextColor(200, 0, 0);
          doc.text("Divergências encontradas:", 16, yPos + 13);
        }
        doc.setTextColor(0, 0, 0);
      }
    }

    // ===== QR CODE - abaixo das observações =====
    if (editId) {
      // Verificar se o QR Code cabe na página atual
      checkPageBreak(42);
      const rastreamentoUrl = `${window.location.origin}/rastreamento?id=${editId}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(rastreamentoUrl)}`;
      const qrY = yPos + 20;
      doc.addImage(qrImageUrl, "PNG", pageWidth - 32, qrY, 18, 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text("Rastreamento", pageWidth - 23, qrY + 20, { align: "center" });
      doc.setTextColor(0, 0, 0);
    }

    // ===== NUMERAÇÃO DE PÁGINAS =====
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
      // Linha separadora do rodapé
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    }
    doc.setTextColor(0, 0, 0);

    // Abrir em nova aba
    window.open(doc.output("bloburl"), "_blank");
  }

  function imprimirCupomVenda() {
    if (itens.length === 0) { toast.error("Adicione itens antes de imprimir"); return; }
    const win = window.open("", "_blank");
    if (!win) { toast.error("Popup bloqueado"); return; }
    
    const linhaLarga = "=".repeat(40);
    const linhaFina = "-".repeat(40);
    let cupom = "\n\n";
    cupom += "         GARDEN CENTER PRIMAVERA\n";
    cupom += "         PEDIDO DE VENDA\n";
    cupom += linhaLarga + "\n\n";
    cupom += `Pedido: ${editId || "Novo"}\n`;
    cupom += `Data: ${data}\n`;
    cupom += `Cliente: ${clienteNome || "-"}\n`;
    cupom += linhaFina + "\n\n";
    cupom += "PRODUTO                      QTD    VALOR\n";
    cupom += linhaFina + "\n";
    
    const totalVenda = itens.reduce((s, i) => s + Number(i.quantidade) * Number(i.valorUnitario), 0);
    itens.forEach((i, idx) => {
      const prodName = i.produtoNome.substring(0, 24).padEnd(24);
      const qtd = String(i.quantidade).padStart(4);
      const total = `R$ ${(Number(i.quantidade) * Number(i.valorUnitario)).toFixed(2)}`.padStart(10);
      cupom += `${prodName} ${qtd}  ${total}\n`;
    });
    
    cupom += linhaFina + "\n";
    cupom += `TOTAL: R$ ${totalVenda.toFixed(2)}`.padStart(40) + "\n";
    cupom += linhaLarga + "\n\n";
    cupom += new Date().toLocaleString("pt-BR") + "\n";
    cupom += "\nEscaneie para rastrear:\n";
    cupom += "[QR CODE ABAIXO]\n";
    cupom += "\n\n\n";
    
    const rastreamentoUrl = `${window.location.origin}/rastreamento?id=${editId}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(rastreamentoUrl)}`;
    
    const qrHtml = `<html><head><title>Cupom - Pedido ${editId}</title><style>
      body { font-family: 'Courier New', monospace; padding: 10px; font-size: 11px; line-height: 1.2; }
      pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; }
      .qr-container { text-align: center; margin: 10px 0; }
      .qr-container img { width: 100px; height: 100px; }
      @media print { body { margin: 0; padding: 0; } }
    </style></head><body><pre>${cupom}</pre>
    <div class="qr-container">
      <img src="${qrImageUrl}" alt="QR Code" />
    </div>
    </body></html>`;
    
    win.document.write(qrHtml);
    win.document.close();
    win.print();
  }

  // Export CSV
  const exportCSV = () => {
    if (!vendas || vendas.length === 0) { toast.error("Nenhuma venda para exportar"); return; }
    let csv = "DT_VENDA;NOME_PRODUTOR;CHAVE;COD_PROD;DESCRICAO_PRODUTO;QT_EMB;QT_POR_EMB;PRECO;VLR_TOTAL\n";
    vendas.forEach((v: any) => {
      v.itens?.forEach((i: any) => {
        csv += `${v.data};${v.clienteNome || ""};${v.id};${i.produtoId || ""};${i.produtoNome};${i.quantidade};1;${Number(i.valorUnitario).toFixed(2).replace(".", ",")};${Number(i.subtotal).toFixed(2).replace(".", ",")}\n`;
      });
    });
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vendas_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const statusBadge = (s: string) => {
    if (s === "APROVADO") return <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-100 text-green-800">APROVADO</span>;
    if (s === "CANCELADO") return <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-800">CANCELADO</span>;
    return <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-yellow-100 text-yellow-800">AGUARDANDO</span>;
  };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="flex flex-col h-full -m-3 sm:-m-4 md:-m-6">
      {/* ═══ TOOLBAR ═══ */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-[#eee] border-b border-[#ccc] flex-wrap">
        {view === "list" ? (
          <>
            <Button size="sm" variant="outline" onClick={novoRegistro} className="h-9 sm:h-7 text-sm sm:text-[11px] gap-1.5 bg-white border-[#ccc] text-[#333] px-3">
              <Plus className="h-4 w-4 sm:h-3 sm:w-3" /> Novo
            </Button>
            <Button size="sm" variant="outline" onClick={() => utils.vendas.list.invalidate()} className="h-9 sm:h-7 text-sm sm:text-[11px] gap-1.5 bg-white border-[#ccc] text-[#333] px-3">
              <RefreshCw className="h-4 w-4 sm:h-3 sm:w-3" /> <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV} className="h-9 sm:h-7 text-sm sm:text-[11px] gap-1.5 bg-white border-[#ccc] text-[#333] px-3">
              <Download className="h-4 w-4 sm:h-3 sm:w-3" /> <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
            {abaAtiva === "ativos" && (
              <Select value={faturamentoFiltro} onValueChange={(value: any) => setFaturamentoFiltro(value)}>
                <SelectTrigger className="h-9 sm:h-7 w-40 text-sm sm:text-[11px] bg-white border-[#ccc] text-[#333]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao-faturados">Nao Faturados</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="faturados">Faturados</SelectItem>
                </SelectContent>
              </Select>
            )}
            {/* Filtro por data */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[#666] hidden sm:inline">De</span>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={e => setFiltroDataInicio(e.target.value)}
                className="h-9 sm:h-7 px-2 text-sm sm:text-[11px] border border-[#ccc] rounded-sm bg-white focus:outline-none focus:border-[#8cbb1f] w-36 sm:w-32"
                title="Data inicial"
              />
              <span className="text-[11px] text-[#666]">até</span>
              <input
                type="date"
                value={filtroDataFim}
                onChange={e => setFiltroDataFim(e.target.value)}
                className="h-9 sm:h-7 px-2 text-sm sm:text-[11px] border border-[#ccc] rounded-sm bg-white focus:outline-none focus:border-[#8cbb1f] w-36 sm:w-32"
                title="Data final"
              />
              {(filtroDataInicio || filtroDataFim) && (
                <button
                  onClick={() => { setFiltroDataInicio(""); setFiltroDataFim(""); }}
                  className="h-9 sm:h-7 px-2 text-[#888] hover:text-[#333] border border-[#ccc] rounded-sm bg-white hover:bg-[#eee] transition-colors"
                  title="Limpar filtro de data"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex-1" />
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#888]" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 sm:h-7 pl-8 sm:pl-7 pr-2 text-sm sm:text-[11px] border border-[#ccc] rounded-sm w-full sm:w-48 focus:outline-none focus:border-[#8cbb1f]"
              />
            </div>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={voltarLista} className="h-9 sm:h-7 text-sm sm:text-[11px] gap-1.5 bg-white border-[#ccc] text-[#333] px-3">
              <ArrowLeft className="h-4 w-4 sm:h-3 sm:w-3" /> Voltar
            </Button>
            {editId && (
              <Button
                size="sm"
                variant="outline"
                onClick={imprimirPDF}
                className="h-9 sm:h-7 text-sm sm:text-[11px] gap-1.5 bg-white border-[#ccc] text-[#c0392b] hover:bg-red-50 hover:border-[#c0392b] px-3"
                title="Exportar pedido como PDF"
              >
                <FileText className="h-4 w-4 sm:h-3 sm:w-3" /> Exportar PDF
              </Button>
            )}
            {editId && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { if (pedidoFaturado) { toast.error("Orçamento faturado não pode ser excluído."); return; } setDeleteConfirm({ id: editId, clienteNome: clienteNome.trim() || `#${editId}` }); }}
                className={pedidoFaturado ? "h-9 sm:h-7 text-sm sm:text-[11px] gap-1.5 bg-white border-gray-300 text-gray-400 cursor-not-allowed opacity-60 px-3" : "h-9 sm:h-7 text-sm sm:text-[11px] gap-1.5 bg-white border-red-300 text-red-600 hover:bg-red-50 hover:border-red-500 px-3"}
                title={pedidoFaturado ? "Orçamento faturado — não pode ser excluído" : "Mover orçamento para a lixeira"}
              >
                {pedidoFaturado ? <Lock className="h-4 w-4 sm:h-3 sm:w-3" /> : <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />} {pedidoFaturado ? "Protegido" : "Lixeira"}
              </Button>
            )}
            <div className="flex-1" />
            {isSilentSaving && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                <span>Salvando...</span>
              </div>
            )}
            {!pedidoFaturado && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={createMut.isPending || updateMut.isPending || isSilentSaving}
                className="h-9 sm:h-7 text-sm sm:text-[11px] gap-1.5 bg-[#28a745] hover:bg-[#218838] text-white border-none px-4"
              >
                {(createMut.isPending || updateMut.isPending) ? <Loader2 className="h-4 w-4 sm:h-3 sm:w-3 animate-spin" /> : <Save className="h-4 w-4 sm:h-3 sm:w-3" />}
                SALVAR
              </Button>
            )}
            {pedidoFaturado && (
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-3 py-1.5 rounded border border-amber-200">Pedido faturado - somente leitura</span>
            )}
          </>
        )}
      </div>

      {/* ═══ ABAS Ativos / Expirados ═══ */}
      {view === "list" && (
        <div className="flex border-b border-[#ccc] bg-white">
          <button
            onClick={() => setAbaAtiva("ativos")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              abaAtiva === "ativos"
                ? "border-[#8cbb1f] text-[#8cbb1f]"
                : "border-transparent text-[#666] hover:text-[#333]"
            }`}
          >
            Orçamentos Ativos
            {filteredVendas.length > 0 && (
              <span className="bg-[#8cbb1f] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{filteredVendas.length}</span>
            )}
            {rascunhoCount > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5" title="Orçamentos em rascunho">
                <ShoppingCart className="h-2.5 w-2.5" />
                {rascunhoCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setAbaAtiva("expirados")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              abaAtiva === "expirados"
                ? "border-red-500 text-red-600"
                : "border-transparent text-[#666] hover:text-[#333]"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Expirados
            {(vendasExpiradas?.length || 0) > 0 && (
              <span className="ml-0.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{vendasExpiradas?.length}</span>
            )}
          </button>
        </div>
      )}

      {/* ═══ LIST VIEW ═══ */}
      <div className={view === "list" ? "flex-1 overflow-y-auto overflow-x-auto flex flex-col" : "hidden"}>
        {/* Barra de ações em massa - FORA da tabela para HTML válido */}
        {selectedIds.size > 0 && (
          <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-2.5 bg-[#1a1a2e] text-white shadow-lg shrink-0">
            <span className="text-sm font-medium">{selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}</span>
            <div className="flex-1" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-300 hover:text-white px-3 py-1 rounded border border-gray-500 hover:border-gray-300 transition-colors"
            >Limpar seleção</button>
            {selectedIds.size >= 2 && (
              <button
                onClick={() => {
                  const primeiro = filteredVendas.find((v: any) => selectedIds.has(v.id));
                  setMesclarClienteNome(primeiro?.clienteNome || '');
                  setMesclarObs('');
                  setMesclarVencimento('');
                  setMesclarAgrupar(true);
                  setMesclarMoverLixeira(true);
                  setShowMesclarModal(true);
                }}
                className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded font-semibold transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Mesclar {selectedIds.size}
              </button>
            )}
            <button
              onClick={() => setShowImpressaoLote(true)}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-semibold transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir {selectedIds.size}
            </button>
            {Array.from(selectedIds).every(id => {
              const v = filteredVendas.find((v: any) => v.id === id);
              return v?.status === 'APROVADO';
            }) && (
              <button
                onClick={() => {
                  const convertidos = Array.from(selectedIds).filter(id => {
                    const v = filteredVendas.find((v: any) => v.id === id);
                    return v?.faturado === 1;
                  });
                  if (convertidos.length > 0) {
                    toast.error(`${convertidos.length} orçamento(s) já foi/foram convertido(s). Não é possível enviar para compra.`);
                    return;
                  }
                  setEnviarLoteVendaIds(Array.from(selectedIds));
                  setEnviarLotePedidoCompraId('novo');
                  setShowEnviarLoteModal(true);
                }}
                className="flex items-center gap-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded font-semibold transition-colors"
              >
                <ShoppingCart className="h-3.5 w-3.5" /> Enviar {selectedIds.size} para Compra
              </button>
            )}
            <button
              onClick={() => setShowDeleteManyConfirm(true)}
              className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded font-semibold transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Mover {selectedIds.size} para Lixeira
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm sm:text-[11px] min-w-[500px]">
          <thead>
            <tr className="bg-white border-b-2 border-[#e0e0e0]">
              <th className="w-8 p-3 sm:p-2.5">
                <input
                  type="checkbox"
                  className="rounded cursor-pointer"
                  checked={filteredVendas.length > 0 && selectedIds.size === filteredVendas.length}
                  onChange={toggleSelectAll}
                  title="Selecionar todos"
                />
              </th>
              <th className="text-left p-3 sm:p-2.5 font-semibold text-[#555] text-xs uppercase tracking-wide">Número</th>
              <th className="text-left p-3 sm:p-2.5 font-semibold text-[#555] text-xs uppercase tracking-wide">Data</th>
              <th className="text-left p-3 sm:p-2.5 font-semibold text-[#555] text-xs uppercase tracking-wide">Cliente</th>
              <th className="text-right p-3 sm:p-2.5 font-semibold text-[#555] text-xs uppercase tracking-wide">Total (R$)</th>
              <th className="text-left p-3 sm:p-2.5 font-semibold text-[#555] text-xs uppercase tracking-wide">Situação</th>
              <th className="text-left p-3 sm:p-2.5 font-semibold text-[#555] text-xs uppercase tracking-wide hidden sm:table-cell">Vencimento</th>
              <th className="w-10 p-3 sm:p-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {abaAtiva === "expirados" ? (
              isLoadingExp ? (
                <tr><td colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-red-400" /></td></tr>
              ) : filteredExpirados.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-[#888]">Nenhum orçamento expirado</td></tr>
              ) : filteredExpirados.map((v: any) => (
                <tr key={v.id} className="border-b border-[#f0f0f0] hover:bg-red-50 group">
                  <td className="p-3 sm:p-2.5 text-center"><AlertTriangle className="h-4 w-4 text-red-400 mx-auto" /></td>
                  <td className="p-3 sm:p-2.5 font-mono font-semibold text-[#333]">{v.id}</td>
                  <td className="p-3 sm:p-2.5 text-[#555]">{v.data}</td>
                  <td className="p-3 sm:p-2.5 font-medium text-[#222]">{v.clienteNome || "-"}</td>
                  <td className="p-3 sm:p-2.5 text-right font-mono">{v.total ? Number(v.total).toFixed(2).replace('.', ',') : "-"}</td>
                  <td className="p-3 sm:p-2.5">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Expirado</span>
                  </td>
                  <td className="p-3 sm:p-2.5 hidden sm:table-cell">
                    {v.vencimento ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border bg-red-100 text-red-700 border-red-200">
                        <CalendarClock className="h-3 w-3" />
                        Venceu {new Date(v.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    ) : <span className="text-xs text-[#aaa]">-</span>}
                  </td>
                  <td className="p-2.5 text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-center">
                      <button
                        title="Prorrogar vencimento"
                        onClick={() => { setProrrogarId(v.id); setProrrogarData(""); setShowProrrogarModal(true); }}
                        className="p-1.5 rounded hover:bg-amber-100 text-amber-600"
                      >
                        <CalendarClock className="h-4 w-4" />
                      </button>
                      <button
                        title="Desbloquear orçamento"
                        onClick={() => { setDesbloquearId(v.id); setSenhaDesbloqueio(""); setShowDesbloquearModal(true); }}
                        className="p-1.5 rounded hover:bg-green-100 text-green-600"
                      >
                        <Lock className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              isLoading ? (
              <tr><td colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-[#8cbb1f]" /></td></tr>
            ) : filteredVendas.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-[#888]">Nenhum orçamento encontrado</td></tr>
            ) : filteredVendas.map((v: any) => (
              <tr
                key={v.id}
                className={`border-b border-[#f0f0f0] cursor-pointer group ${
                  v.faturado === 1
                    ? 'bg-purple-50 hover:bg-purple-100'
                    : 'hover:bg-[#fafafa]'
                }`}
                onClick={() => openEdit(v)}
              >
                <td className="p-3 sm:p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="checkbox"
                      className={`rounded cursor-pointer ${
                        v.faturado === 1 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={v.faturado === 1}
                      checked={selectedIds.has(v.id)}
                      onClick={e => {
                        if (v.faturado === 1) {
                          e.stopPropagation();
                          return;
                        }
                        toggleSelect(v.id, e);
                      }}
                      onChange={() => {}}
                    />
                    {v.faturado === 1 && (
                      <div
                        title="Orçamento já foi convertido em venda. Não pode ser enviado para pedido de compra."
                        className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 border border-purple-300 cursor-help"
                      >
                        <Lock className="h-3 w-3 text-purple-600" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3 sm:p-2.5 font-mono font-semibold text-[#333]">{v.id}</td>
                <td className="p-3 sm:p-2.5 text-[#555]">{v.data}</td>
                <td className="p-3 sm:p-2.5 font-medium text-[#222]">{v.clienteNome || "-"}</td>
                <td className="p-3 sm:p-2.5 text-right font-mono">{v.total ? Number(v.total).toFixed(2).replace('.', ',') : "-"}</td>
                <td className="p-3 sm:p-2.5">
                  <div className="flex flex-wrap items-center gap-1">
                    {v.status === "APROVADO" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-green-500 text-white shadow-sm">
                        <CheckCircle2 className="h-3 w-3" /> Aprovado
                      </span>
                    ) : v.status === "CANCELADO" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-red-500 text-white shadow-sm">
                        <X className="h-3 w-3" /> Cancelado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-400 text-amber-900 shadow-sm">
                        <Clock className="h-3 w-3" /> Em aberto
                      </span>
                    )}
                    {v.conferido && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200" title={`Conferido por ${v.conferidoPor || '-'}`}>
                        <CheckCircle2 className="h-3 w-3" /> Conferido
                      </span>
                    )}
                    {v.faturado && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                        <FileText className="h-3 w-3" /> Faturado
                      </span>
                    )}
                    {v.status === 'APROVADO' && enviadosMap && (enviadosMap as any)[v.id] && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700 border border-orange-200 cursor-pointer hover:bg-orange-200 transition-colors"
                        title={`Enviado para Pedido de Compra ${(enviadosMap as any)[v.id]?.numero || ''}`}
                        onClick={e => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('erp-open-tab', { detail: { tabId: 'pedidos-compra' } })); }}
                      >
                        <ShoppingCart className="h-3 w-3" /> Ped. Compra
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 sm:p-2.5 hidden sm:table-cell" onClick={e => e.stopPropagation()}>
                  {v.vencimento ? (() => {
                    const hoje = new Date();
                    hoje.setHours(0,0,0,0);
                    const venc = new Date(v.vencimento + 'T00:00:00');
                    const diff = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000);
                    const expirado = diff < 0;
                    const urgente = diff >= 0 && diff <= 2;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${
                        expirado ? 'bg-red-100 text-red-700 border-red-200' :
                        urgente ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-green-100 text-green-700 border-green-200'
                      }`}>
                        <CalendarClock className="h-3 w-3" />
                        {expirado ? `Expirado ${new Date(v.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}` :
                         urgente ? `Vence em ${diff === 0 ? 'hoje' : diff === 1 ? 'amanhã' : `${diff}d`}` :
                         `Válido até ${new Date(v.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                      </span>
                    );
                  })() : <span className="text-xs text-[#aaa]">-</span>}
                </td>
                <td className="p-2.5 text-center" onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded hover:bg-[#e8e8e8] text-[#666] opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => openEdit(v)}>
                        <FileText className="h-4 w-4 mr-2" /> Abrir orçamento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { openEdit(v); toast.info("Pedido aberto. Clique em \"PDF\" na barra superior para imprimir."); }}>
                        <Printer className="h-4 w-4 mr-2" /> Imprimir PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditId(v.id); setGeneratedLink(""); setShareHours(24); setShowShareDialog(true); }}>
                        <Share2 className="h-4 w-4 mr-2" /> Compartilhar
                      </DropdownMenuItem>
                      {v.status === 'APROVADO' && (
                        <DropdownMenuItem onClick={() => { setEnviarVendaId(v.id); setShowEnviarPedidoModal(true); }}>
                          <ShoppingCart className="h-4 w-4 mr-2 text-orange-500" /> Enviar para Pedido de Compra
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className={(v.faturado || v.isFaturado) ? "text-gray-400 cursor-not-allowed opacity-60" : "text-red-600 focus:text-red-600"}
                        onClick={() => { if (v.faturado || v.isFaturado) { toast.error("Orçamento faturado não pode ser excluído. Desfature a venda primeiro."); return; } setDeleteConfirm({ id: v.id, clienteNome: v.clienteNome || `#${v.id}` }); }}
                        title={(v.faturado || v.isFaturado) ? "Orçamento faturado — não pode ser excluído" : "Mover para lixeira"}
                      >
                        {(v.faturado || v.isFaturado) ? <Lock className="h-4 w-4 mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        {(v.faturado || v.isFaturado) ? "Protegido (Faturado)" : "Mover para Lixeira"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )))
            }
          </tbody>
          {/* Rodapé com soma total dos orçamentos listados */}
          {abaAtiva === "ativos" && filteredVendas.length > 0 && (
            <tfoot>
              <tr className="bg-[#f0f7e0] border-t-2 border-[#8cbb1f]">
                <td colSpan={3} className="p-3 sm:p-2.5 text-xs font-semibold text-[#555]">
                  {filteredVendas.length} orçamento{filteredVendas.length !== 1 ? 's' : ''}
                  {(filtroDataInicio || filtroDataFim) && (
                    <span className="ml-2 text-[#8cbb1f]">
                      {filtroDataInicio && filtroDataFim
                        ? `(${new Date(filtroDataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(filtroDataFim + 'T00:00:00').toLocaleDateString('pt-BR')})`
                        : filtroDataInicio
                        ? `(a partir de ${new Date(filtroDataInicio + 'T00:00:00').toLocaleDateString('pt-BR')})`
                        : `(até ${new Date(filtroDataFim + 'T00:00:00').toLocaleDateString('pt-BR')})`
                      }
                    </span>
                  )}
                </td>
                <td className="p-3 sm:p-2.5 text-right font-bold text-[#333] font-mono">
                  R$ {filteredVendas.reduce((s: number, v: any) => s + Number(v.total || 0), 0).toFixed(2).replace('.', ',')}
                </td>
                <td colSpan={4} className="p-3 sm:p-2.5 text-xs text-[#666]">Total dos orçamentos listados</td>
              </tr>
            </tfoot>
          )}
        </table>
        </div>
      </div>

      {/* ═══ FORM VIEW ═══ */}
      <div className={view === "form" ? "flex-1 overflow-y-auto p-3 sm:p-4" : "hidden"}>
        {/* ═══ DADOS DO CLIENTE ═══ */}
        <div className="border border-[#dee2e6] rounded mb-2.5 bg-white shadow-sm">
          <div className="bg-[#e9ecef] px-3 py-2 font-bold text-xs border-b border-[#dee2e6] text-[#495057] uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#8cbb1f] rounded-sm inline-block"></span>
            Dados do Cliente
          </div>
          <div className="p-3 grid grid-cols-12 gap-3">
            {editId && (
              <div className="col-span-3 sm:col-span-1 flex flex-col">
                <label className="text-[10px] text-[#888] font-semibold mb-1">Nº Pedido</label>
                <input type="text" value={editId} readOnly className="px-2 py-2 border border-[#ccc] rounded text-sm bg-[#f4f6f9] font-mono text-center font-bold text-[#495057]" />
              </div>
            )}
            <div className={`${editId ? "col-span-9 sm:col-span-5" : "col-span-12 sm:col-span-6"} flex flex-col relative`} ref={cliRef}>
              <label className="text-[10px] text-[#888] font-semibold mb-1">Cliente *</label>
              <input
                type="text"
                value={clienteNome}
                onChange={e => { setClienteNome(e.target.value); setShowCliSug(true); }}
                onFocus={() => setShowCliSug(true)}
                onBlur={() => setTimeout(() => setShowCliSug(false), 350)}
                placeholder="Nome do cliente"
                autoComplete="off"
                className="px-2 py-2 border border-[#ccc] rounded text-sm w-full focus:outline-none focus:border-[#8cbb1f] focus:ring-1 focus:ring-[#8cbb1f]/20"
              />
              {showCliSug && clienteNome && (
                <div className="absolute top-[52px] left-0 w-full bg-white border border-[#8cbb1f] z-[9999] shadow-lg max-h-[250px] overflow-y-auto rounded">
                  {cliSuggestions.map((c: any) => (
                    <div key={c.id} className="px-3 py-2.5 cursor-pointer border-b border-[#eee] hover:bg-[#f0f7ff] text-sm flex flex-col" onMouseDown={() => { selectCliente(c.nome); if (c.telefone) setTelefoneCliente(c.telefone); }}>
                      <span className="font-medium">{c.nome}</span>
                      {c.telefone && <span className="text-xs text-[#888]">{c.telefone}</span>}
                    </div>
                  ))}
                  <div className="px-3 py-2.5 cursor-pointer bg-[#e8f5e9] text-[#2e7d32] font-bold border-t-2 border-[#8cbb1f] text-sm" onMouseDown={(e) => { e.preventDefault(); cadastrarClienteRapido(); }}>
                    {createClienteMut.isPending ? "Cadastrando..." : `+ CADASTRAR: "${clienteNome.toUpperCase()}"`}
                  </div>
                </div>
              )}
            </div>
            <div className="col-span-6 sm:col-span-3 flex flex-col">
              <label className="text-[10px] text-[#888] font-semibold mb-1">Telefone</label>
              <input
                type="tel"
                value={telefoneCliente}
                onChange={e => setTelefoneCliente(e.target.value)}
                placeholder="(00) 00000-0000"
                className="px-2 py-2 border border-[#ccc] rounded text-sm w-full focus:outline-none focus:border-[#8cbb1f] focus:ring-1 focus:ring-[#8cbb1f]/20"
              />
            </div>
            <div className="col-span-6 sm:col-span-3 flex flex-col">
              <label className="text-[10px] text-[#888] font-semibold mb-1">Vendedor</label>
              <input
                type="text"
                value={erpUser?.nome || ""}
                readOnly
                className="px-2 py-2 border border-[#ccc] rounded text-sm bg-[#f4f6f9] text-[#495057]"
              />
            </div>
          </div>
        </div>

        {/* ═══ DETALHES DO PEDIDO ═══ */}
        <div className="border border-[#dee2e6] rounded mb-2.5 bg-white shadow-sm">
          <div className="bg-[#e9ecef] px-3 py-2 font-bold text-xs border-b border-[#dee2e6] text-[#495057] uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#1565c0] rounded-sm inline-block"></span>
            Detalhes do Pedido
          </div>
          <div className="p-3 grid grid-cols-12 gap-3">
            <div className="col-span-6 sm:col-span-3 flex flex-col">
              <label className="text-[10px] text-[#888] font-semibold mb-1">Data do Pedido</label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className="px-2 py-2 border border-[#ccc] rounded text-sm w-full focus:outline-none focus:border-[#8cbb1f]"
              />
            </div>
            <div className="col-span-6 sm:col-span-3 flex flex-col">
              <label className="text-[10px] text-[#888] font-semibold mb-1">Status do Pedido</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="px-2 py-2 border border-[#ccc] rounded text-sm w-full focus:outline-none focus:border-[#8cbb1f]"
              >
                <option value="APROVADO">APROVADO</option>
                <option value="AGUARDANDO">AGUARDANDO</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>
            <div className="col-span-6 sm:col-span-3 flex flex-col">
              <label className="text-[10px] text-[#888] font-semibold mb-1">Data de Entrega / Retirada</label>
              <input
                type="date"
                value={dataEntrega}
                onChange={e => setDataEntrega(e.target.value)}
                className="px-2 py-2 border border-[#ccc] rounded text-sm w-full focus:outline-none focus:border-[#8cbb1f]"
              />
            </div>
            <div className="col-span-6 sm:col-span-3 flex flex-col">
              <label className="text-[10px] text-[#888] font-semibold mb-1">Hora de Entrega / Retirada</label>
              <input
                type="time"
                value={horaEntrega}
                onChange={e => setHoraEntrega(e.target.value)}
                className="px-2 py-2 border border-[#ccc] rounded text-sm w-full focus:outline-none focus:border-[#8cbb1f]"
              />
            </div>
            <div className="col-span-6 sm:col-span-3 flex flex-col">
              <label className="text-[10px] text-[#888] font-semibold mb-1 flex items-center gap-1">
                <CalendarClock className="h-3 w-3 text-amber-500" /> Vencimento do Orçamento
              </label>
              <input
                type="date"
                value={vencimento}
                onChange={e => setVencimento(e.target.value)}
                className="px-2 py-2 border border-[#ccc] rounded text-sm w-full focus:outline-none focus:border-amber-400"
              />
              {vencimento && (
                <span className="text-[10px] text-amber-600 mt-0.5">Orçamento expira em {vencimento}</span>
              )}
            </div>
          </div>
        </div>

        {/* Seção ITENS */}
        <div className="border border-[#dee2e6] rounded mb-2.5">
          <div className="bg-[#e9ecef] px-3 py-2 sm:py-1.5 font-bold text-xs sm:text-[10px] border-b border-[#dee2e6] text-[#495057] uppercase tracking-wider flex items-center justify-between">
            <span>ITENS</span>
            {!pedidoFaturado && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setShowCooperfloraPanel(true); setCatalogBusca(""); }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-green-600 text-white hover:bg-green-700 border border-green-700 transition-colors shadow-sm"
                  title="Abrir Catálogo Cooperflora"
                >
                  <Leaf className="h-3.5 w-3.5" /> COOPERFLORA
                </button>
                <button
                  onClick={() => { setShowVeilingPanel(true); setCatalogBusca(""); }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 border border-orange-600 transition-colors shadow-sm"
                  title="Abrir Catálogo Veiling"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> VEILING
                </button>
              </div>
            )}
          </div>
          {pedidoFaturado ? (
            <div className="p-3 text-center text-amber-600 text-sm font-medium bg-amber-50 rounded">
              Pedido faturado - itens não podem ser adicionados ou removidos
            </div>
          ) : (<>
          <div className="p-3 grid grid-cols-12 gap-3 sm:gap-2.5">
            <div className="col-span-12 md:col-span-5 flex flex-col relative" ref={prodRef}>
              <label className="text-xs sm:text-[10px] text-[#888] font-bold mb-1 sm:mb-0.5">Produto</label>
              <input
                ref={prodInputRef}
                type="text"
                value={prodInput}
                onChange={e => { setProdInput(e.target.value); setShowProdSug(true); setSelectedProdId(undefined); }}
                onFocus={() => setShowProdSug(true)}
                onBlur={() => setTimeout(() => setShowProdSug(false), 350)}
                placeholder="Buscar produto..."
                autoComplete="off"
                className="px-2 py-2 sm:px-1.5 sm:py-1 border border-[#ccc] rounded-sm text-sm sm:text-[11px] w-full focus:outline-none focus:border-[#8cbb1f]"
              />
              {showProdSug && prodInput && (
                <div className="absolute top-[52px] sm:top-[42px] left-0 w-full bg-white border border-[#8cbb1f] z-[9999] shadow-lg max-h-[250px] sm:max-h-[200px] overflow-y-auto">
                  {prodSuggestions.map((p: any) => (
                    <div key={p.id} className="px-3 py-3 sm:py-2 cursor-pointer border-b border-[#eee] hover:bg-[#f0f7ff] text-sm sm:text-[11px] flex items-center gap-2 active:bg-[#e0eeff]" onMouseDown={() => selectProduto(p)}>
                      {p.imagemUrl ? (
                        <img src={p.imagemUrl} alt={p.nome ?? p.descricao} className="w-8 h-8 sm:w-6 sm:h-6 object-cover rounded flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 sm:w-6 sm:h-6 bg-[#e8f5e9] rounded flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="h-4 w-4 sm:h-3 sm:w-3 text-[#8cbb1f]" />
                        </div>
                      )}
                      <span className="flex-1 truncate">{p.nome ?? p.descricao}</span>
                      <span className="text-[#888] flex-shrink-0">R$ {Number(p.preco).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="px-3 py-3 sm:py-2 cursor-pointer bg-[#e8f5e9] text-[#2e7d32] font-bold border-t-2 border-[#8cbb1f] text-sm sm:text-[11px] active:bg-[#c8e6c9]" onMouseDown={(e) => { e.preventDefault(); cadastrarProdutoRapido(); }}>
                    {createProdutoMut.isPending ? "Cadastrando..." : `+ CADASTRAR PRODUTO: "${prodInput.toUpperCase()}"`}
                  </div>
                </div>
              )}
            </div>
            <div className="col-span-4 md:col-span-2 flex flex-col">
              <label className="text-xs sm:text-[10px] text-[#888] font-bold mb-1 sm:mb-0.5">Qtd</label>
              <input
                type="number"
                value={qtdInput}
                onChange={e => setQtdInput(e.target.value)}
                className="px-2 py-2 sm:px-1.5 sm:py-1 border border-[#ccc] rounded-sm text-sm sm:text-[11px] w-full focus:outline-none focus:border-[#8cbb1f]"
              />
            </div>
            <div className="col-span-4 md:col-span-2 flex flex-col">
              <label className="text-xs sm:text-[10px] text-[#888] font-bold mb-1 sm:mb-0.5">Valor</label>
              <input
                type="number"
                step="0.01"
                value={vlrInput}
                onChange={e => setVlrInput(e.target.value)}
                className="px-2 py-2 sm:px-1.5 sm:py-1 border border-[#ccc] rounded-sm text-sm sm:text-[11px] w-full focus:outline-none focus:border-[#8cbb1f]"
              />
            </div>
            <div className="col-span-4 md:col-span-2 flex flex-col">
              <label className="text-xs sm:text-[10px] text-[#888] font-bold mb-1 sm:mb-0.5">Obs</label>
              <input
                type="text"
                value={obsInput}
                onChange={e => setObsInput(e.target.value)}
                placeholder="Opcional"
                className="px-2 py-2 sm:px-1.5 sm:py-1 border border-[#ccc] rounded-sm text-sm sm:text-[11px] w-full focus:outline-none focus:border-[#8cbb1f]"
              />
            </div>
            <div className="col-span-12 md:col-span-1 flex flex-col justify-end">
              <button
                onClick={addItem}
                className="px-4 py-2.5 sm:px-2 sm:py-1 bg-[#8cbb1f] hover:bg-[#7aa61a] text-white border-none rounded-sm text-sm sm:text-[11px] font-bold cursor-pointer w-full active:bg-[#6b9516]"
              >
                ADD
              </button>
            </div>
          </div>
          {!isAdmin && (
            <p className="text-xs sm:text-[10px] text-amber-600 px-3 pb-2">Preço bloqueado para perfil Vendedor</p>
          )}
          </>)}
        </div>

        {/* Grid de Itens */}
        {itens.length > 0 && (
          <div className="overflow-x-auto border border-[#dee2e6] rounded mb-2.5 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm mb-0 min-w-[480px]">
            <thead>
              <tr className="bg-[#f8f9fa] border-b-2 border-[#dee2e6]">
                <th className="text-center p-2.5 font-semibold text-[#495057] w-10">#</th>
                <th className="text-left p-2.5 font-semibold text-[#495057]">Descrição</th>
                <th className="text-right p-2.5 font-semibold text-[#495057] w-20">Qtd</th>
                <th className="text-right p-2.5 font-semibold text-[#495057] w-28">Preço Unit.</th>
                <th className="text-right p-2.5 font-semibold text-[#495057] w-28">Preço Total</th>
                <th className="text-center p-2.5 font-semibold text-[#495057] w-24">Estoque</th>
                <th className="text-left p-2.5 font-semibold text-[#495057]">Obs</th>
                <th className="w-10 p-2.5 border-b-0"></th>
              </tr>
            </thead>
            <tbody>
              {[...itens].sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0)).map((item, idx) => (
                editingItemName === item.produtoNome ? (
                  <tr key={`${item.produtoNome}_${idx}_edit`} className="border-b border-[#eee] bg-yellow-50">
                    <td className="p-2.5 text-center text-[#888] font-mono text-xs">{idx + 1}</td>
                    <td className="p-2.5 font-medium">
                      <div>
                        <span className="block">{item.produtoNome}</span>
                        {item.observacao && <span className="text-xs text-gray-500">Qualidade: {item.observacao}</span>}
                        {item.produtor && <span className="text-xs text-gray-500 block">{item.produtor}</span>}
                      </div>
                    </td>
                    <td className="p-2 sm:p-1.5 text-right">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={editItemQtd}
                        onChange={e => setEditItemQtd(e.target.value)}
                        className="w-20 px-2 py-1 border border-[#8cbb1f] rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#8cbb1f]"
                        autoFocus
                        onKeyDown={e => { if (e.key === "Enter") saveEditItem(); if (e.key === "Escape") cancelEditItem(); }}
                      />
                    </td>
                    <td className="p-2 sm:p-1.5 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editItemVlr}
                        onChange={e => setEditItemVlr(e.target.value)}
                        className="w-24 px-2 py-1 border border-[#8cbb1f] rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#8cbb1f]"
                        onKeyDown={e => { if (e.key === "Enter") saveEditItem(); if (e.key === "Escape") cancelEditItem(); }}
                      />
                    </td>
                    <td className="p-3 sm:p-2.5 text-right font-mono">R$ {(Number(editItemQtd) * Number(editItemVlr)).toFixed(2)}</td>
                    <td className="p-2.5 text-center">
                      {(() => {
                        const est = estoqueMap.get(item.produtoNome.toLowerCase().trim());
                        if (!est || est.estoque === null) return <span className="text-xs text-gray-400">—</span>;
                        const qtd = Number(editItemQtd);
                        const cor = est.estoque === 0 ? 'bg-red-100 text-red-700' : est.estoque < qtd ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
                        return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cor}`} title={`Fonte: ${est.fonte}`}>{est.estoque}</span>;
                      })()}
                    </td>
                    <td className="p-2 sm:p-1.5">
                      <input
                        type="text"
                        value={editItemObs}
                        onChange={e => setEditItemObs(e.target.value)}
                        className="w-full px-2 py-1 border border-[#8cbb1f] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#8cbb1f]"
                        onKeyDown={e => { if (e.key === "Enter") saveEditItem(); if (e.key === "Escape") cancelEditItem(); }}
                      />
                    </td>
                    <td className="p-2 sm:p-1 flex gap-1">
                      <button onClick={saveEditItem} className="text-green-600 hover:text-green-800 p-1" title="Salvar">
                        <Save className="h-4 w-4 sm:h-3 sm:w-3" />
                      </button>
                      <button onClick={cancelEditItem} className="text-gray-500 hover:text-gray-700 p-1" title="Cancelar">
                        <X className="h-4 w-4 sm:h-3 sm:w-3" />
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={`${item.produtoNome}_${idx}`}
                    className={`border-b border-[#eee] ${!pedidoFaturado ? "hover:bg-[#f0f7ff] cursor-pointer" : ""}`}
                    onDoubleClick={() => startEditItem(item.produtoNome)}
                    title={pedidoFaturado ? "Pedido faturado - edição bloqueada" : "Duplo clique para editar"}
                  >
                    <td className="p-2.5 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#e9ecef] text-[#495057] text-xs font-bold">{idx + 1}</span>
                    </td>
                    <td className="p-2.5 font-medium">
                      <div className="flex items-center gap-2">
                        {item.imagemUrl ? (
                          <img src={item.imagemUrl} alt={item.produtoNome} className="w-7 h-7 object-cover rounded flex-shrink-0" />
                        ) : null}
                        <div>
                          <span className="block">{item.produtoNome}</span>
                          {item.observacao && <span className="text-xs text-gray-500">Qualidade: {item.observacao}</span>}
                          {item.produtor && <span className="text-xs text-gray-500 block">{item.produtor}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-2.5 text-right">{item.quantidade}</td>
                    <td className="p-2.5 text-right">R$ {Number(item.valorUnitario).toFixed(2)}</td>
                    <td className="p-2.5 text-right font-mono font-semibold">R$ {(Number(item.quantidade) * Number(item.valorUnitario)).toFixed(2)}</td>
                    <td className="p-2.5 text-center">
                      {(() => {
                        const est = estoqueMap.get(item.produtoNome.toLowerCase().trim());
                        if (!est || est.estoque === null) {
                          return loadingEstoque
                            ? <span className="text-xs text-gray-300 animate-pulse">⋯</span>
                            : <span className="text-xs text-gray-400">—</span>;
                        }
                        const qtd = Number(item.quantidade);
                        const cor = est.estoque === 0 ? 'bg-red-100 text-red-700 border border-red-200' : est.estoque < qtd ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-green-100 text-green-700 border border-green-200';
                        const label = est.estoque === 0 ? '0' : est.estoque < qtd ? `Baixo (${est.estoque})` : String(est.estoque);
                        return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cor}`} title={`Estoque ${est.fonte}: ${est.estoque}`}>{label}</span>;
                      })()}
                    </td>
                    <td className="p-2.5 text-xs text-[#666] max-w-[120px] truncate">{item.observacao || "-"}</td>
                    <td className="p-2">
                      {!pedidoFaturado && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setRemoveItemConfirm({ item, idx }); }}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                          disabled={removeItemMut.isPending}
                          title="Remover item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          </div>
        )}

        {/* ═══ LOGÍSTICA ═══ */}
        <div className="border border-[#dee2e6] rounded mb-2.5 bg-white shadow-sm">
          <div className="bg-[#e9ecef] px-3 py-2 font-bold text-xs border-b border-[#dee2e6] text-[#495057] uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#e65100] rounded-sm inline-block"></span>
            Logística
          </div>
          <div className="p-3 grid grid-cols-12 gap-3">
            <div className="col-span-6 sm:col-span-3 flex flex-col">
              <label className="text-[10px] text-[#888] font-semibold mb-1">Tipo de Entrega</label>
              <select
                value={logTipo}
                onChange={e => setLogTipo(e.target.value)}
                className="px-2 py-2 border border-[#ccc] rounded text-sm w-full focus:outline-none focus:border-[#8cbb1f]"
              >
                <option value="RETIRADA">RETIRADA</option>
                <option value="ENTREGA">ENTREGA</option>
              </select>
            </div>
            {logTipo === "ENTREGA" && (
              <>
                <div className="col-span-12 sm:col-span-5 flex flex-col">
                  <label className="text-[10px] text-[#888] font-semibold mb-1">Rua / Logradouro</label>
                  <input type="text" value={rua} onChange={e => setRua(e.target.value)} placeholder="Nome da rua" className="px-2 py-2 border border-[#ccc] rounded text-sm w-full focus:outline-none focus:border-[#8cbb1f]" />
                </div>
                <div className="col-span-4 sm:col-span-2 flex flex-col">
                  <label className="text-[10px] text-[#888] font-semibold mb-1">N.º</label>
                  <input type="text" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Nº" className="px-2 py-2 border border-[#ccc] rounded text-sm w-full focus:outline-none focus:border-[#8cbb1f]" />
                </div>
                <div className="col-span-8 sm:col-span-4 flex flex-col">
                  <label className="text-[10px] text-[#888] font-semibold mb-1">Bairro</label>
                  <input type="text" value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Bairro" className="px-2 py-2 border border-[#ccc] rounded text-sm w-full focus:outline-none focus:border-[#8cbb1f]" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ═══ OBSERVAÇÕES ═══ */}
        <div className="border border-[#dee2e6] rounded mb-2.5 bg-white shadow-sm">
          <div className="bg-[#e9ecef] px-3 py-2 font-bold text-xs border-b border-[#dee2e6] text-[#495057] uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#6c757d] rounded-sm inline-block"></span>
            Observações do Pedido
          </div>
          <div className="p-3">
            <textarea
              value={observacaoPedido}
              onChange={e => setObservacaoPedido(e.target.value)}
              placeholder="Informações adicionais, instruções de entrega, preferências do cliente..."
              rows={3}
              className="px-2 py-2 border border-[#ccc] rounded text-sm w-full focus:outline-none focus:border-[#8cbb1f] resize-none"
            />
          </div>
        </div>

        {/* ═══ TOTAIS ═══ */}
        {itens.length > 0 && (
          <div className="border border-[#dee2e6] rounded mb-2.5 bg-white shadow-sm">
            <div className="bg-[#e9ecef] px-3 py-2 font-bold text-xs border-b border-[#dee2e6] text-[#495057] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[#2e7d32] rounded-sm inline-block"></span>
              Totais
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col">
                <label className="text-[10px] text-[#888] font-semibold mb-1">Nº de Itens</label>
                <input type="text" value={itens.length} readOnly className="px-2 py-2 border border-[#ccc] rounded text-sm bg-[#f4f6f9] text-center font-mono" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-[#888] font-semibold mb-1">Soma das Quantidades</label>
                <input type="text" value={itens.reduce((s, i) => s + Number(i.quantidade), 0)} readOnly className="px-2 py-2 border border-[#ccc] rounded text-sm bg-[#f4f6f9] text-center font-mono" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-[#888] font-semibold mb-1">Subtotal dos Itens</label>
                <input type="text" value={`R$ ${subtotalItens.toFixed(2).replace(".", ",")}`} readOnly className="px-2 py-2 border border-[#ccc] rounded text-sm bg-[#f4f6f9] text-center font-mono font-bold text-[#2e7d32]" />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-[#888] font-semibold mb-1">Frete (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={frete}
                  onChange={e => setFrete(e.target.value)}
                  disabled={!!pedidoFaturado}
                  placeholder="0,00"
                  className="px-2 py-2 border border-[#ccc] rounded text-sm text-center font-mono focus:outline-none focus:border-[#8cbb1f] focus:ring-1 focus:ring-[#8cbb1f]/20 disabled:bg-[#f4f6f9]"
                />
              </div>
            </div>
            {/* Linha separadora + Total da Venda com frete */}
            {(parseFloat(frete) || 0) > 0 && (
              <div className="px-3 pb-3 flex justify-end">
                <div className="flex items-center gap-4 bg-[#f0f7e6] border-2 border-[#8cbb1f] rounded px-4 py-2">
                  <span className="text-xs text-[#666] font-semibold">Subtotal:</span>
                  <span className="font-mono text-sm text-[#2e7d32]">R$ {subtotalItens.toFixed(2).replace(".", ",")}</span>
                  <span className="text-xs text-[#666] font-semibold">+ Frete:</span>
                  <span className="font-mono text-sm text-[#e65100]">R$ {(parseFloat(frete) || 0).toFixed(2).replace(".", ",")}</span>
                  <span className="text-xs text-[#333] font-bold">=</span>
                  <span className="font-mono text-base font-bold text-[#2e7d32]">R$ {totalVenda.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer com PDF, Compartilhar e Total */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-2 bg-[#f8f9fa] border-t border-[#ddd] p-3 rounded">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs sm:text-sm"
              onClick={imprimirPDF}
            >
              <FileText className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs sm:text-sm"
              onClick={imprimirCupomVenda}
            >
              <Printer className="h-4 w-4 mr-2" /> Cupom
            </Button>
            {editId && (
              <>
                <button
                  onClick={() => { setGeneratedLink(""); setShareHours(24); setShowShareDialog(true); }}
                  className="px-4 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white border-none rounded text-sm font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="h-4 w-4" /> Compartilhar
                </button>
                <button
                  onClick={() => { setWhatsappOrcId(editId); setWhatsappToken(""); setShowWhatsappModal(true); gerarLinkMut.mutate({ id: editId! }); }}
                  className="px-4 py-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white border-none rounded text-sm font-bold cursor-pointer flex items-center gap-1.5"
                  title="Compartilhar via WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </button>
                {!vendas?.find((v: any) => v.id === editId)?.faturado && (
                  <button
                    onClick={() => setShowFaturarDialog(true)}
                    className="px-4 py-2 bg-[#28a745] hover:bg-[#218838] text-white border-none rounded text-sm font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" /> Faturar
                  </button>
                )}
                {(() => {
                  const vAtual = vendas?.find((v: any) => v.id === editId);
                  if (!vAtual) return null;
                  if (vAtual.status !== 'APROVADO') return null;
                  return (
                    <button
                      onClick={() => { setConverterOrcId(editId!); setShowConverterModal(true); }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white border-none rounded text-sm font-bold cursor-pointer flex items-center gap-1.5"
                      title="Converter este orçamento em Venda Efetiva"
                    >
                      <TrendingUp className="h-4 w-4" /> Converter em Venda
                    </button>
                  );
                })()}
              </>
            )}
          </div>
          <div className="font-bold text-2xl text-[#2e7d32] text-right">
            R$ {totalVenda.toFixed(2).replace(".", ",")}
          </div>
        </div>

        {/* Dialog de Compartilhamento */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-blue-600" />
                Compartilhar Pedido #{editId}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {!generatedLink ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Prazo de Validade do Link</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "1 hora", value: 1 },
                        { label: "6 horas", value: 6 },
                        { label: "12 horas", value: 12 },
                        { label: "24 horas", value: 24 },
                        { label: "3 dias", value: 72 },
                        { label: "7 dias", value: 168 },
                        { label: "15 dias", value: 360 },
                        { label: "30 dias", value: 720 },
                        { label: "90 dias", value: 2160 },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setShareHours(opt.value)}
                          className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                            shareHours === opt.value
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-md p-2.5">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>O link expira em <strong>{shareHours < 24 ? `${shareHours} hora${shareHours > 1 ? "s" : ""}` : `${Math.round(shareHours / 24)} dia${Math.round(shareHours / 24) > 1 ? "s" : ""}`}</strong> após a geração.</span>
                  </div>
                  <Button
                    onClick={() => editId && shareMut.mutate({ vendaId: editId, expiresInHours: shareHours })}
                    disabled={shareMut.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {shareMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                    Gerar Link
                  </Button>
                </>
              ) : (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-green-600 font-bold text-sm mb-2">Link gerado com sucesso!</div>
                    <div className="bg-white border rounded-md p-2.5 text-xs font-mono break-all text-gray-700">
                      {generatedLink}
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(generatedLink);
                        toast.success("Link copiado para a área de transferência!");
                      } catch {
                        // Fallback: selecionar texto manualmente
                        const el = document.createElement("textarea");
                        el.value = generatedLink;
                        document.body.appendChild(el);
                        el.select();
                        document.execCommand("copy");
                        document.body.removeChild(el);
                        toast.success("Link copiado!");
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Copy className="h-4 w-4 mr-2" /> Copiar Link
                  </Button>
                  <Button
                    onClick={() => {
                      const msg = `Olá! Segue o link do pedido #${editId}:\n${generatedLink}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                    className="w-full bg-[#25D366] hover:bg-[#1da851] text-white"
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Enviar por WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setGeneratedLink("")}
                    className="w-full"
                  >
                    Gerar Novo Link
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      {/* Diálogo de Confirmação de Exclusão de Item */}
      {removeItemConfirm && (
        <Dialog open={!!removeItemConfirm} onOpenChange={v => { if (!v) setRemoveItemConfirm(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Remover Item
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja remover o item{" "}
              <strong className="text-foreground">{removeItemConfirm.item.produtoNome}</strong>?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Qtd: <strong>{removeItemConfirm.item.quantidade}</strong> &nbsp;&bull;&nbsp;
              Valor unit.: <strong>R$ {Number(removeItemConfirm.item.valorUnitario).toFixed(2)}</strong> &nbsp;&bull;&nbsp;
              Total: <strong>R$ {(Number(removeItemConfirm.item.quantidade) * Number(removeItemConfirm.item.valorUnitario)).toFixed(2)}</strong>
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setRemoveItemConfirm(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  removeItemAndSave(removeItemConfirm.item);
                  setRemoveItemConfirm(null);
                }}
                disabled={removeItemMut.isPending}
              >
                {removeItemMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Remover Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={v => { if (!v) setDeleteConfirm(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-600">Mover para Lixeira</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              A venda <strong>#{deleteConfirm.id}</strong> ({deleteConfirm.clienteNome}) será movida para a lixeira. Você poderá restaurá-la depois em Configurações &gt; Lixeira.
            </p>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={() => deleteMut.mutate({ id: deleteConfirm.id })}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Mover para Lixeira
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Dialog de Exclusão em Massa */}
      <Dialog open={showDeleteManyConfirm} onOpenChange={v => { if (!v) setShowDeleteManyConfirm(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Excluir em Massa
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{selectedIds.size} orçamento{selectedIds.size !== 1 ? 's' : ''}</strong> serão movidos para a lixeira. Você poderá restaurá-los depois em Configurações &gt; Lixeira.
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDeleteManyConfirm(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteManyMut.mutate({ ids: Array.from(selectedIds) })}
              disabled={deleteManyMut.isPending}
            >
              {deleteManyMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Mover {selectedIds.size} para Lixeira
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog de Faturamento */}
      {/* Modal Converter em Venda Efetiva */}
      <Dialog open={showConverterModal} onOpenChange={(open) => { setShowConverterModal(open); if (!open) { setConverterOrcId(null); setConverterObs(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Converter em Venda Efetiva
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {jaConvertido ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                Este orçamento já foi convertido em <strong>Venda Efetiva #{(jaConvertido as any).id}</strong> por {(jaConvertido as any).convertidoPor}.
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">O orçamento <strong>#{converterOrcId}</strong> será registrado como venda efetiva. O campo <em>faturado</em> será marcado automaticamente.</p>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Observação (opcional)</label>
                  <textarea
                    value={converterObs}
                    onChange={e => setConverterObs(e.target.value)}
                    placeholder="Ex: Entregue em 16/04/2026..."
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowConverterModal(false); setConverterOrcId(null); setConverterObs(''); }}>Cancelar</Button>
            {!jaConvertido && (
              <Button
                onClick={() => converterMut.mutate({ orcamentoId: converterOrcId!, observacao: converterObs || undefined })}
                disabled={converterMut.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {converterMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirmar Conversão
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFaturarDialog} onOpenChange={setShowFaturarDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Faturar Pedido #{editId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">Forma de Pagamento</label>
              <select
                value={formaPagamentoId || ""}
                onChange={(e) => setFormaPagamentoId(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-green-500"
              >
                <option value="">Selecione uma forma de pagamento</option>
                {formasPagamento?.map((fp: any) => (
                  <option key={fp.id} value={fp.id}>{fp.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-2">Data de Vencimento</label>
              <input
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-green-500"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
              <strong>Total do pedido:</strong> R$ {totalVenda.toFixed(2).replace(".", ",")}
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowFaturarDialog(false)}>Cancelar</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (!formaPagamentoId || !dataVencimento) {
                  toast.error("Preencha todos os campos");
                  return;
                }
                const fpNome = formasPagamento?.find((fp: any) => fp.id === formaPagamentoId)?.nome;
                editId && faturarMut.mutate({
                  vendaId: editId,
                  formaPagamentoId,
                  dataVencimento: new Date(dataVencimento),
                  faturadoPor: erpUser?.nome || "Sistema",
                  formaPagamentoNome: fpNome,
                });
              }}
              disabled={faturarMut.isPending}
            >
              {faturarMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Faturar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Mesclagem de Orçamentos */}
      <Dialog open={showMesclarModal} onOpenChange={v => { if (!v) setShowMesclarModal(false); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Mesclar {selectedIds.size} Orçamentos
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Orçamentos que serão mesclados */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Orçamentos selecionados</p>
              {loadingMesclar ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-purple-50 border-b">
                      <tr>
                        <th className="text-left p-2 font-semibold text-purple-700">#</th>
                        <th className="text-left p-2 font-semibold text-purple-700">Cliente</th>
                        <th className="text-right p-2 font-semibold text-purple-700">Itens</th>
                        <th className="text-right p-2 font-semibold text-purple-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(orcamentosParaMesclar || []).map((v: any) => (
                        <tr key={v.id}>
                          <td className="p-2 font-mono font-semibold text-purple-700">#{v.id}</td>
                          <td className="p-2">{v.clienteNome || '-'}</td>
                          <td className="p-2 text-right text-gray-500">{(v.itens || []).length}</td>
                          <td className="p-2 text-right font-semibold">R$ {Number(v.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    {orcamentosParaMesclar && orcamentosParaMesclar.length > 0 && (
                      <tfoot className="bg-gray-50 border-t">
                        <tr>
                          <td colSpan={2} className="p-2 text-xs font-semibold text-gray-600">Total geral</td>
                          <td className="p-2 text-right text-xs text-gray-500">
                            {(orcamentosParaMesclar || []).reduce((s: number, v: any) => s + (v.itens || []).length, 0)} itens
                          </td>
                          <td className="p-2 text-right text-xs font-bold text-green-700">
                            R$ {(orcamentosParaMesclar || []).reduce((s: number, v: any) => s + Number(v.total || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>

            {/* Dados do novo orçamento */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Cliente do orçamento mesclado</label>
                <input
                  type="text"
                  value={mesclarClienteNome}
                  onChange={e => setMesclarClienteNome(e.target.value)}
                  placeholder="Nome do cliente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Vencimento (opcional)</label>
                <input
                  type="date"
                  value={mesclarVencimento}
                  onChange={e => setMesclarVencimento(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Observação (opcional)</label>
                <input
                  type="text"
                  value={mesclarObs}
                  onChange={e => setMesclarObs(e.target.value)}
                  placeholder="Observação..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Opções */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Opções</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mesclarAgrupar}
                  onChange={e => setMesclarAgrupar(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">
                  <strong>Agrupar itens iguais</strong> — somar quantidades de produtos repetidos
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mesclarMoverLixeira}
                  onChange={e => setMesclarMoverLixeira(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">
                  <strong>Mover originais para lixeira</strong> — os {selectedIds.size} orçamentos originais serão arquivados
                </span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowMesclarModal(false)}>Cancelar</Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={mesclarMut.isPending || loadingMesclar || !mesclarClienteNome.trim()}
              onClick={() => {
                mesclarMut.mutate({
                  ids: idsParaMesclar,
                  clienteNome: mesclarClienteNome.trim(),
                  observacaoPedido: mesclarObs.trim() || undefined,
                  vencimento: mesclarVencimento || undefined,
                  agruparItensIguais: mesclarAgrupar,
                  moverOriginaisParaLixeira: mesclarMoverLixeira,
                });
              }}
            >
              {mesclarMut.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Mesclando...</>
                : <><svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Mesclar {selectedIds.size} orçamentos</>
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Impressão em Lote */}
      <Dialog open={showImpressaoLote} onOpenChange={v => { if (!v) setShowImpressaoLote(false); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <Printer className="h-5 w-5" /> Impressão em Lote
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {loadingOrcamentosImprimir ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                <span className="text-sm text-muted-foreground">Carregando orçamentos...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  {orcamentosParaImprimir?.length || 0} orçamento{(orcamentosParaImprimir?.length || 0) !== 1 ? 's' : ''} serão impressos em um único PDF, um por página.
                </p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-2.5 font-semibold text-gray-600">Número</th>
                        <th className="text-left p-2.5 font-semibold text-gray-600">Cliente</th>
                        <th className="text-left p-2.5 font-semibold text-gray-600">Data</th>
                        <th className="text-right p-2.5 font-semibold text-gray-600">Itens</th>
                        <th className="text-right p-2.5 font-semibold text-gray-600">Total</th>
                        <th className="text-left p-2.5 font-semibold text-gray-600">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(orcamentosParaImprimir || []).map((v: any) => (
                        <tr key={v.id} className="hover:bg-gray-50">
                          <td className="p-2.5 font-mono font-semibold text-blue-700">#{v.id}</td>
                          <td className="p-2.5">{v.clienteNome || "-"}</td>
                          <td className="p-2.5 text-gray-500">{v.data || "-"}</td>
                          <td className="p-2.5 text-right text-gray-500">{(v.itens || []).length}</td>
                          <td className="p-2.5 text-right font-semibold">R$ {Number(v.total || 0).toFixed(2)}</td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              v.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                              v.status === 'CANCELADO' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>{v.status || 'AGUARDANDO'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {orcamentosParaImprimir && orcamentosParaImprimir.length > 0 && (
                      <tfoot className="bg-gray-50 border-t">
                        <tr>
                          <td colSpan={4} className="p-2.5 text-xs font-semibold text-gray-600">Total geral</td>
                          <td className="p-2.5 text-right text-xs font-bold text-green-700">
                            R$ {(orcamentosParaImprimir || []).reduce((s: number, v: any) => s + Number(v.total || 0), 0).toFixed(2)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowImpressaoLote(false)}>Cancelar</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={imprimindoLote || loadingOrcamentosImprimir || !orcamentosParaImprimir?.length}
              onClick={async () => {
                if (!orcamentosParaImprimir?.length) return;
                setImprimindoLote(true);
                try {
                  const doc = new jsPDF();
                  const pageWidth = doc.internal.pageSize.getWidth();
                  const pageHeight = doc.internal.pageSize.getHeight();
                  const logoUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663539257200/nE9aRDyk9G49cwSdfYmqny/logo-garden_de682faf.png";
                  // Carregar logo uma vez
                  let logoDataUrl: string | null = null;
                  try {
                    const logoImg = new Image();
                    logoImg.crossOrigin = "anonymous";
                    await new Promise<void>((res, rej) => { logoImg.onload = () => res(); logoImg.onerror = () => rej(); logoImg.src = logoUrl; });
                    const canvas = document.createElement("canvas");
                    canvas.width = logoImg.naturalWidth; canvas.height = logoImg.naturalHeight;
                    canvas.getContext("2d")!.drawImage(logoImg, 0, 0);
                    logoDataUrl = canvas.toDataURL("image/png");
                  } catch {}

                  for (let idx = 0; idx < orcamentosParaImprimir.length; idx++) {
                    const v: any = orcamentosParaImprimir[idx];
                    if (idx > 0) doc.addPage();
                    let y = 10;

                    // Logo
                    if (logoDataUrl) {
                      const logoW = 50; const logoH = logoW * (1065 / 2048);
                      doc.addImage(logoDataUrl, "PNG", 14, y - 2, logoW, logoH);
                    } else {
                      doc.setFontSize(9); doc.setFont("helvetica", "bold");
                      doc.text("GARDEN CENTER PRIMAVERA", 14, y + 5);
                    }
                    // Dados empresa
                    doc.setFontSize(8); doc.setFont("helvetica", "normal");
                    doc.text(new Date().toLocaleString("pt-BR"), pageWidth - 14, y, { align: "right" });
                    doc.text("Avenida João Naves de Ávila, Nº 5420", pageWidth - 14, y + 5, { align: "right" });
                    doc.text("38408680 - Uberlândia, MG", pageWidth - 14, y + 10, { align: "right" });
                    doc.text("CNPJ: 24.069.959/0001-41, IE: 0026958700040", pageWidth - 14, y + 15, { align: "right" });
                    y += 25;

                    // Título
                    doc.setFontSize(16); doc.setFont("helvetica", "bold");
                    doc.text(`Orçamento #${v.id}`, pageWidth / 2, y, { align: "center" });
                    y += 10;

                    // Cliente
                    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("Cliente", 14, y); y += 5;
                    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.5);
                    doc.rect(14, y - 3, pageWidth - 28, 12);
                    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
                    doc.text(v.clienteNome || "-", 16, y + 2);
                    if (v.telefoneCliente) doc.text(`Tel: ${v.telefoneCliente}`, 16, y + 7);
                    // Box pedido
                    doc.rect(pageWidth - 60, y - 3, 46, 16);
                    doc.setFont("helvetica", "bold"); doc.setFontSize(8);
                    doc.text("Número", pageWidth - 58, y + 1);
                    doc.text("Data", pageWidth - 58, y + 6);
                    doc.text("Vendedor", pageWidth - 58, y + 11);
                    doc.setFont("helvetica", "normal");
                    doc.text(String(v.id), pageWidth - 28, y + 1);
                    doc.text(v.data || "-", pageWidth - 28, y + 6);
                    doc.text(v.vendedorNome || "-", pageWidth - 28, y + 11);
                    y += 20;

                    // Tabela de itens
                    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("Itens do orçamento", 14, y); y += 5;
                    const tableData = (v.itens || []).map((i: any) => [
                      i.produtoNome, "", "",
                      i.quantidade,
                      `R$ ${Number(i.valorUnitario).toFixed(2)}`,
                      `R$ ${(Number(i.quantidade) * Number(i.valorUnitario)).toFixed(2)}`
                    ]);
                    autoTable(doc, {
                      startY: y,
                      head: [["Descrição", "Código", "Un.", "Qtd.", "Valor unit.", "Total"]],
                      body: tableData,
                      styles: { fontSize: 8, cellPadding: 2 },
                      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
                      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 20 }, 2: { cellWidth: 15 }, 3: { cellWidth: 15, halign: "right" }, 4: { cellWidth: 25, halign: "right" }, 5: { cellWidth: 25, halign: "right" } },
                      pageBreak: "auto", showHead: "everyPage",
                      margin: { top: 18, bottom: 20, left: 14, right: 14 },
                      didDrawPage: (data: any) => {
                        if (data.pageNumber > 1) {
                          doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
                          doc.text(`Orçamento #${v.id} - ${v.clienteNome || "-"} - GARDEN CENTER PRIMAVERA`, 14, 8);
                          doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3); doc.line(14, 10, pageWidth - 14, 10);
                          doc.setTextColor(0, 0, 0);
                        }
                      }
                    });
                    y = (doc as any).lastAutoTable?.finalY || y + 30;
                    y += 4;

                    // Totais
                    const totalQtd = (v.itens || []).reduce((s: number, i: any) => s + Number(i.quantidade), 0);
                    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
                    doc.text(`Nº de itens: ${(v.itens || []).length}`, pageWidth - 50, y);
                    doc.text(`Qtde total: ${totalQtd.toFixed(2)}`, pageWidth - 50, y + 5);
                    doc.setFont("helvetica", "bold");
                    doc.text(`Total: R$ ${Number(v.total || 0).toFixed(2)}`, pageWidth - 50, y + 10);
                  }

                  // Numeração de páginas
                  const totalPages = doc.getNumberOfPages();
                  for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(150, 150, 150);
                    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
                    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2);
                    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
                  }
                  doc.setTextColor(0, 0, 0);

                  window.open(doc.output("bloburl"), "_blank");
                  toast.success(`PDF com ${orcamentosParaImprimir.length} orçamento(s) gerado com sucesso!`);
                  setShowImpressaoLote(false);
                } catch (e) {
                  toast.error("Erro ao gerar PDF: " + (e as Error).message);
                } finally {
                  setImprimindoLote(false);
                }
              }}
            >
              {imprimindoLote ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando PDF...</> : <><Printer className="h-4 w-4 mr-2" /> Gerar PDF com {orcamentosParaImprimir?.length || selectedIds.size} orçamento(s)</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Painel lateral - Catálogo Cooperflora */}
      <Sheet open={showCooperfloraPanel} onOpenChange={setShowCooperfloraPanel}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-2 border-b border-green-200 bg-green-50">
            <SheetTitle className="flex items-center gap-2 text-green-800">
              <Leaf className="h-5 w-5" /> Catálogo Cooperflora
            </SheetTitle>
          </SheetHeader>
          <div className="px-3 py-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Buscar produto..."
              value={catalogBusca}
              onChange={e => setCatalogBusca(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {!cooperfloraData ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
            ) : cooperfloraData.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Nenhum produto encontrado</div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-green-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b">Produto</th>
                    <th className="text-right px-2 py-2 font-semibold text-gray-600 border-b">Venda</th>
                    <th className="text-center px-2 py-2 font-semibold text-gray-600 border-b w-16">Qtd</th>
                    <th className="text-center px-2 py-2 border-b w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {cooperfloraData.map((p: any, idx: number) => (
                    <tr key={`${p.codigo}-${idx}`} className="border-b border-gray-100 hover:bg-green-50">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800 leading-tight">{p.nome} {p.qualidade} {p.grupo}</div>
                        <div className="text-gray-400 text-[10px]">{p.codigo}</div>
                      </td>
                      <td className="px-2 py-2 text-right text-green-700 font-bold whitespace-nowrap">
                        {Number(p.precoVendaMin) > 0 ? `R$ ${Number(p.precoVendaMin).toFixed(2)}` : "-"}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          defaultValue="1"
                          min="1"
                          id={`coop-qtd-${idx}`}
                          className="w-14 px-1 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:border-green-500"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold"
                          onClick={() => {
                            const qtdEl = document.getElementById(`coop-qtd-${idx}`) as HTMLInputElement;
                            const qtd = qtdEl ? qtdEl.value : "1";
                            const vlr = Number(p.precoVendaMin) > 0 ? Number(p.precoVendaMin).toFixed(2) : "0";
                            // Montar nome completo: nome + qualidade + grupo
                            let nomeCompleto = p.nome || "";
                            if (p.qualidade) nomeCompleto += ` ${p.qualidade}`;
                            if (p.grupo) nomeCompleto += ` ${p.grupo}`;
                            setItens(prev => [...prev, { produtoNome: nomeCompleto, quantidade: qtd, valorUnitario: vlr, observacao: `Cooperflora ${p.codigo}`, produtoId: undefined, qualidade: p.qualidade, produtor: p.produtor }]);
                            toast.success(`${nomeCompleto} adicionado ao pedido`);
                          }}
                        >ADD</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-500">
            {cooperfloraData ? `${cooperfloraData.length} produtos` : ""}
          </div>
        </SheetContent>
      </Sheet>

      {/* Painel lateral - Catálogo Veiling */}
      <Sheet open={showVeilingPanel} onOpenChange={setShowVeilingPanel}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-2 border-b border-orange-200 bg-orange-50">
            <SheetTitle className="flex items-center gap-2 text-orange-800">
              <ShoppingBag className="h-5 w-5" /> Catálogo Veiling
            </SheetTitle>
          </SheetHeader>
          <div className="px-3 py-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Buscar produto..."
              value={catalogBusca}
              onChange={e => setCatalogBusca(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-orange-500"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {!veilingData ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
            ) : (veilingData.items || []).length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Nenhum produto encontrado</div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-orange-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b">Produto</th>
                    <th className="text-right px-2 py-2 font-semibold text-gray-600 border-b">Venda</th>
                    <th className="text-center px-2 py-2 font-semibold text-gray-600 border-b w-16">Qtd</th>
                    <th className="text-center px-2 py-2 border-b w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {(veilingData.items || []).map((p: any, idx: number) => (
                    <tr key={`${p.ofertaId || p.id}-${idx}`} className="border-b border-gray-100 hover:bg-orange-50">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800 leading-tight">{p.nomeCompleto || p.nomeProduto || p.nome}</div>
                        <div className="text-gray-400 text-[10px]">{p.categoria} {p.produtor ? `• ${p.produtor}` : ""}</div>
                      </td>
                      <td className="px-2 py-2 text-right text-orange-700 font-bold whitespace-nowrap">
                        {Number(p.precoVenda) > 0 ? `R$ ${Number(p.precoVenda).toFixed(2)}` : "-"}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="number"
                          defaultValue="1"
                          min="1"
                          id={`veil-qtd-${idx}`}
                          className="w-14 px-1 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:border-orange-500"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[10px] font-bold"
                          onClick={() => {
                            const qtdEl = document.getElementById(`veil-qtd-${idx}`) as HTMLInputElement;
                            const qtd = qtdEl ? qtdEl.value : "1";
                            const vlr = Number(p.precoVenda) > 0 ? Number(p.precoVenda).toFixed(2) : "0";
                            const nome = p.nomeCompleto || p.nomeProduto || p.nome || "Produto Veiling";
                            setItens(prev => [...prev, { produtoNome: nome, quantidade: qtd, valorUnitario: vlr, observacao: `Veiling ${p.categoria || ""}`.trim(), produtoId: undefined, qualidade: p.qualidade, produtor: p.produtor }]);
                            toast.success(`${nome} adicionado ao pedido`);
                          }}
                        >ADD</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-500">
            {veilingData ? `${(veilingData.items || []).length} de ${veilingData.total} produtos` : ""}
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal WhatsApp */}
      <Dialog open={showWhatsappModal} onOpenChange={setShowWhatsappModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
              Compartilhar Orçamento #{whatsappOrcId} via WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {gerarLinkMut.isPending ? (
              <div className="flex items-center justify-center py-6 gap-2 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" /> Gerando link...
              </div>
            ) : whatsappToken ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-green-700 font-semibold text-sm mb-2">Link gerado com sucesso!</div>
                  <div className="bg-white border rounded-md p-2.5 text-xs font-mono break-all text-gray-700">
                    {`${window.location.origin}/orcamento/${whatsappToken}`}
                  </div>
                </div>
                <Button
                  className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                  onClick={() => {
                    const link = `${window.location.origin}/orcamento/${whatsappToken}`;
                    const msg = `Olá! Segue o orçamento #${whatsappOrcId} da Garden Primavera:\n${link}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" /> Abrir WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    const link = `${window.location.origin}/orcamento/${whatsappToken}`;
                    try { await navigator.clipboard.writeText(link); } catch { const el = document.createElement("textarea"); el.value = link; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
                    toast.success("Link copiado!");
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copiar Link
                </Button>
              </>
            ) : (
              <div className="text-center text-red-500 py-4">Erro ao gerar link. Tente novamente.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Prorrogar Vencimento */}
      <Dialog open={showProrrogarModal} onOpenChange={setShowProrrogarModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-amber-500" />
              Prorrogar Vencimento #{prorrogarId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nova Data de Vencimento</label>
              <input
                type="date"
                value={prorrogarData}
                onChange={e => setProrrogarData(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowProrrogarModal(false)}>Cancelar</Button>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-white"
                disabled={!prorrogarData || prorrogarMut.isPending}
                onClick={() => prorrogarId && prorrogarMut.mutate({ id: prorrogarId, vencimento: prorrogarData })}
              >
                {prorrogarMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Prorrogar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Desbloquear Orçamento Expirado */}
      <Dialog open={showDesbloquearModal} onOpenChange={setShowDesbloquearModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-600" />
              Desbloquear Orçamento #{desbloquearId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
              Este orçamento foi expirado automaticamente. Informe a senha de desbloqueio para reativá-lo.
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Senha de Desbloqueio</label>
              <input
                type="password"
                value={senhaDesbloqueio}
                onChange={e => setSenhaDesbloqueio(e.target.value)}
                placeholder="Digite a senha..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500"
                onKeyDown={e => e.key === "Enter" && desbloquearId && desbloquearMut.mutate({ id: desbloquearId, senha: senhaDesbloqueio })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDesbloquearModal(false)}>Cancelar</Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={!senhaDesbloqueio || desbloquearMut.isPending}
                onClick={() => desbloquearId && desbloquearMut.mutate({ id: desbloquearId, senha: senhaDesbloqueio })}
              >
                {desbloquearMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Desbloquear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: Enviar para Pedido de Compra ═══ */}
      <Dialog open={showEnviarPedidoModal} onOpenChange={(open) => { setShowEnviarPedidoModal(open); if (!open) { setEnviarVendaId(null); setEnviarPedidoCompraId('novo'); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <ShoppingCart className="h-5 w-5" />
              Enviar Orçamento #{enviarVendaId} para Pedido de Compra
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Seleção de pedido de compra */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Destino</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={enviarPedidoCompraId}
                onChange={e => setEnviarPedidoCompraId(e.target.value)}
              >
                <option value="novo">+ Criar novo Pedido de Compra</option>
                {(pedidosCompraAbertos || []).map((p: any) => (
                  <option key={p.id} value={String(p.id)}>
                    #{p.numero} — {new Date(p.data).toLocaleDateString('pt-BR')} — {p.status} — R$ {Number(p.total).toFixed(2).replace('.', ',')}
                  </option>
                ))}
              </select>
            </div>

            {/* Prévia dos produtos mesclados */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Produtos que serão enviados
                {previewPedido && (
                  <span className="ml-2 text-orange-600 font-normal normal-case">
                    ({previewPedido.itens.length} produto(s) após mesclagem de {previewPedido.qtdOriginal} itens)
                  </span>
                )}
              </p>
              {previewLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando prévia...
                </div>
              ) : previewPedido?.itens.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">Nenhum item encontrado neste orçamento.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-orange-50 border-b">
                      <tr>
                        <th className="text-left p-2 font-semibold text-orange-700">Produto</th>
                        <th className="text-right p-2 font-semibold text-orange-700">Qtd</th>
                        <th className="text-right p-2 font-semibold text-orange-700">Preço Venda</th>
                        <th className="text-right p-2 font-semibold text-orange-700">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const itens = previewPedido?.itens || [];
                        // Agrupar por fornecedor
                        const grupos: Record<string, typeof itens> = {};
                        for (const item of itens) {
                          const prod = (item as any).produtor || 'Outros';
                          if (!grupos[prod]) grupos[prod] = [];
                          grupos[prod].push(item);
                        }
                        const fornecedores = Object.keys(grupos).sort((a, b) => a === 'Outros' ? 1 : b === 'Outros' ? -1 : a.localeCompare(b, 'pt-BR'));
                        let rowIdx = 0;
                        return fornecedores.map(fornecedor => (
                          <>
                            <tr key={`h-${fornecedor}`} className="bg-orange-100">
                              <td colSpan={4} className="p-1.5 px-2 font-bold text-orange-800 text-[10px] uppercase tracking-wide">
                                🏭 {fornecedor} <span className="font-normal text-orange-600">({grupos[fornecedor].length} produto(s))</span>
                              </td>
                            </tr>
                            {grupos[fornecedor].map((item: any, idx: number) => {
                              const bg = rowIdx++ % 2 === 0 ? 'bg-white' : 'bg-orange-50/30';
                              return (
                                <tr key={`${fornecedor}-${idx}`} className={bg}>
                                  <td className="p-2 font-medium pl-4">{item.produtoNome}</td>
                                  <td className="p-2 text-right font-mono">{Number(item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                                  <td className="p-2 text-right font-mono">R$ {Number(item.precoVenda).toFixed(2).replace('.', ',')}</td>
                                  <td className="p-2 text-right font-mono font-semibold">R$ {Number(item.subtotalVenda).toFixed(2).replace('.', ',')}</td>
                                </tr>
                              );
                            })}
                          </>
                        ));
                      })()}
                    </tbody>
                    <tfoot className="bg-orange-100 border-t">
                      <tr>
                        <td colSpan={3} className="p-2 text-right font-bold text-orange-800">Total</td>
                        <td className="p-2 text-right font-bold font-mono text-orange-800">
                          R$ {(previewPedido?.itens || []).reduce((s: number, i: any) => s + Number(i.subtotalVenda), 0).toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                * Produtos com mesmo nome e mesmo valor são mesclados em uma linha. Produtos com valores diferentes aparecem em linhas separadas.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => { setShowEnviarPedidoModal(false); setEnviarVendaId(null); setEnviarPedidoCompraId('novo'); }}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
              disabled={previewLoading || !previewPedido?.itens.length}
              onClick={() => {
                if (!previewPedido?.itens.length) return;
                const doc = new jsPDF();
                doc.setFontSize(14);
                doc.setTextColor(180, 80, 0);
                doc.text(`Prévia do Pedido de Compra`, 14, 18);
                doc.setFontSize(10);
                doc.setTextColor(80, 80, 80);
                doc.text(`Orçamento #${enviarVendaId} — Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
                autoTable(doc, {
                  startY: 32,
                  head: [['Produto', 'Qtd', 'Preço Venda', 'Subtotal']],
                  body: previewPedido.itens.map((item: any) => [
                    item.produtoNome,
                    Number(item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
                    `R$ ${Number(item.precoVenda).toFixed(2).replace('.', ',')}`,
                    `R$ ${Number(item.subtotalVenda).toFixed(2).replace('.', ',')}`,
                  ]),
                  foot: [['', '', 'Total', `R$ ${previewPedido.itens.reduce((s: number, i: any) => s + Number(i.subtotalVenda), 0).toFixed(2).replace('.', ',')}`]],
                  headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
                  footStyles: { fillColor: [254, 215, 170], textColor: [120, 50, 0], fontStyle: 'bold' },
                  alternateRowStyles: { fillColor: [255, 247, 237] },
                  styles: { fontSize: 9 },
                  columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
                });
                doc.save(`previa-pedido-compra-orc${enviarVendaId}.pdf`);
              }}
            >
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={enviarPedidoMut.isPending || previewLoading || !previewPedido?.itens.length}
              onClick={() => {
                if (!enviarVendaId) return;
                enviarPedidoMut.mutate({
                  vendaId: enviarVendaId,
                  pedidoCompraId: enviarPedidoCompraId !== 'novo' ? Number(enviarPedidoCompraId) : undefined,
                });
              }}
            >
              {enviarPedidoMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <ShoppingCart className="h-4 w-4 mr-2" />
              Enviar para Pedido de Compra
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ MODAL: Enviar em Lote para Pedido de Compra ═══ */}
      <Dialog open={showEnviarLoteModal} onOpenChange={(open) => { setShowEnviarLoteModal(open); if (!open) { setEnviarLoteVendaIds([]); setEnviarLotePedidoCompraId('novo'); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <ShoppingCart className="h-5 w-5" />
              Enviar {enviarLoteVendaIds.length} Orçamento(s) para Pedido de Compra
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Seleção de pedido de compra */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 block">Destino</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={enviarLotePedidoCompraId}
                onChange={e => setEnviarLotePedidoCompraId(e.target.value)}
              >
                <option value="novo">+ Criar novo Pedido de Compra</option>
                {(pedidosCompraAbertos || []).map((p: any) => (
                  <option key={p.id} value={String(p.id)}>
                    #{p.numero} — {new Date(p.data).toLocaleDateString('pt-BR')} — {p.status} — R$ {Number(p.total).toFixed(2).replace('.', ',')}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de orçamentos selecionados */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Orçamentos a enviar</p>
              <div className="border rounded-lg bg-gray-50 p-3 space-y-2 max-h-48 overflow-y-auto">
                {enviarLoteVendaIds.map(id => {
                  const venda = filteredVendas.find((v: any) => v.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                      <div>
                        <p className="font-medium text-sm">#{id} — {venda?.clienteNome || 'Cliente'}</p>
                        <p className="text-xs text-gray-500">R$ {Number(venda?.total || 0).toFixed(2).replace('.', ',')}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Aprovado</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => { setShowEnviarLoteModal(false); setEnviarLoteVendaIds([]); setEnviarLotePedidoCompraId('novo'); }}>
              Cancelar
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              disabled={enviarLoteMut.isPending || enviarLoteVendaIds.length === 0}
              onClick={() => {
                if (enviarLoteVendaIds.length === 0) return;
                enviarLoteMut.mutate({
                  vendaIds: enviarLoteVendaIds,
                  pedidoCompraId: enviarLotePedidoCompraId !== 'novo' ? Number(enviarLotePedidoCompraId) : undefined,
                });
              }}
            >
              {enviarLoteMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <ShoppingCart className="h-4 w-4 mr-2" />
              Enviar {enviarLoteVendaIds.length} para Pedido de Compra
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
