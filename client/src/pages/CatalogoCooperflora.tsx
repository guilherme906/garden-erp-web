import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ptBR } from "date-fns/locale";
import {
  RefreshCw, Settings, Search, Package,
  ChevronDown, ChevronUp, Save, X, Info, ShoppingCart,
  Minus, Plus, AlertCircle, ZoomIn, CalendarIcon,
  Trash2, TrendingUp, PlusCircle, Loader2, FileDown,
} from "lucide-react";
import * as XLSX from "xlsx";

import ModalAdicionarPedidoCompra from "@/components/ModalAdicionarPedidoCompra";
import OrcamentoSidePanel from "@/components/OrcamentoSidePanel";
// ─── Tipos ───
type Produto = {
  id: number;
  codigo: string;
  nome: string;
  precoMin: string;
  precoMax: string;
  qualidade: string;
  estoque: number;
  grupo: string;
  imagemUrl: string | null;
  dataCarregamento: string;
  margemCustom: string | null;
  hastes: number;
  hastesEmbalagem: number;
  atualizadoEm: Date;
  margem: number;
  precoVendaMin: string;
  precoVendaMax: string;
};

type Sitio = {
  codigoSitio: string;
  nomeSitio: string;
  logoUrl: string;
  embalagem: string;
  pontoAbertura: string;
  saldo: number;
  precoUnid: number;
  desconto: number;
  participaDesconto: boolean;
};

// ─── Helpers ───
function formatPreco(min: string, max: string) {
  const vMin = parseFloat(min);
  const vMax = parseFloat(max);
  if (!vMin) return "—";
  if (vMax > vMin) return `R$ ${vMin.toFixed(4)} – ${vMax.toFixed(4)}`;
  return `R$ ${vMin.toFixed(4)}`;
}

const PAGE_SIZE = 80;
const CACHE_KEY = "cooperflora_cache";

// ─── Modal de Detalhes do Produto ───
function ModalDetalhesProduto({
  produto,
  dataCarregamento,
  margemPadrao,
  onClose,
}: {
  produto: Produto;
  dataCarregamento: string;
  margemPadrao: number;
  onClose: () => void;
}) {
  const [qtds, setQtds] = useState<Record<string, number>>({});

  const detalheQuery = trpc.cooperflora.buscarDetalhesProduto.useQuery(
    { codigo: produto.codigo, qualidade: produto.qualidade, dataCarregamento },
    { retry: false, refetchOnWindowFocus: false }
  );

  const sitios: Sitio[] = detalheQuery.data?.sitios || [];
  const margem = produto.margemCustom !== null && produto.margemCustom !== undefined
    ? parseFloat(String(produto.margemCustom))
    : margemPadrao;

  const handleQtd = (codigoSitio: string, delta: number) => {
    setQtds(prev => {
      const cur = prev[codigoSitio] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [codigoSitio]: next };
    });
  };

  const handleQtdInput = (codigoSitio: string, value: string) => {
    const num = parseInt(value) || 0;
    setQtds(prev => ({ ...prev, [codigoSitio]: Math.max(0, num) }));
  };

  // hastes por maço: null/0 significa que o produto não tem esse campo (ex: ACHILLEA)
  // nesse caso, a embalagem já é a unidade de venda (ex: "10 un" = 10 unidades por embalagem)
  const hastesPorMacoRaw = (() => {
    const raw = detalheQuery.data?.hastes;
    if (!raw) return null; // sem campo hastes
    const n = parseInt(String(raw).replace(/\D/g, ""));
    return n > 0 ? n : null;
  })();
  const temHastes = hastesPorMacoRaw !== null;
  const hastesPorMaco = hastesPorMacoRaw ?? 1;

  const qtdDeEmbalagem = (embalagem: string): number => {
    const m = embalagem.match(/(\d+)/);
    return m ? parseInt(m[1]) : 1;
  };

  // Quando TEM hastes: saldo (embalagens) × (qtdEmb ÷ hastesPorMaco) = maços
  // Quando NÃO TEM hastes: saldo (embalagens) × qtdEmb = unidades totais
  const calcSaldoExibido = (embalagem: string, saldo: number): number => {
    const qtdEmb = qtdDeEmbalagem(embalagem);
    if (temHastes) {
      return saldo * (qtdEmb / hastesPorMaco);
    } else {
      return saldo * qtdEmb; // unidades totais
    }
  };

  // Rótulo da coluna de saldo e qtde
  const labelUnidade = temHastes ? "maços" : "unidades";

  // Preço por unidade de pedido:
  // Com hastes: precoUnid × (1+margem%) × hastesPorMaco  (preço por maço)
  // Sem hastes: precoUnid × (1+margem%) × qtdEmb         (preço por embalagem)
  const calcPrecoVenda = (embalagem: string, precoUnid: number): number => {
    if (temHastes) {
      return precoUnid * (1 + margem / 100) * hastesPorMaco;
    } else {
      return precoUnid * (1 + margem / 100) * qtdDeEmbalagem(embalagem);
    }
  };

  const totalQtd = Object.values(qtds).reduce((a, b) => a + b, 0);
  const totalVendaMaco = sitios.reduce((acc, s) => {
    const precoVenda = calcPrecoVenda(s.embalagem, s.precoUnid);
    return acc + (qtds[s.codigoSitio] || 0) * precoVenda;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b bg-gray-50">
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 rounded-lg border overflow-hidden bg-white flex-shrink-0">
              {produto.imagemUrl ? (
                <img src={produto.imagemUrl} alt={produto.nome} className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package size={28} className="text-gray-300" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-green-700 leading-tight">
                {detalheQuery.data?.nomeProduto || produto.nome}
              </h2>
              <p className="text-sm text-gray-500 font-mono">{produto.codigo}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                {(detalheQuery.data?.qualidadeInfo || produto.qualidade) && (
                  <div><span className="text-gray-500 text-xs">Qualidade</span>
                    <p className="font-semibold">{detalheQuery.data?.qualidadeInfo || produto.qualidade}</p></div>
                )}
                {detalheQuery.data?.cor && (
                  <div><span className="text-gray-500 text-xs">Cor</span>
                    <p className="font-semibold">{detalheQuery.data.cor}</p></div>
                )}
                {detalheQuery.data?.tamanho && (
                  <div><span className="text-gray-500 text-xs">Tamanho</span>
                    <p className="font-semibold">{detalheQuery.data.tamanho}</p></div>
                )}
                {detalheQuery.data?.hastes && (
                  <div><span className="text-gray-500 text-xs">Hastes p/ Maço</span>
                    <p className="font-semibold">{detalheQuery.data.hastes}</p></div>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors ml-2 flex-shrink-0">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Aviso ICMS */}
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-700">
          <Info size={14} className="flex-shrink-0" />
          Para produtos com tributação de ICMS, o imposto está incluso no preço apresentado abaixo.
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-auto">
          {detalheQuery.isLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-500">
              <RefreshCw className="animate-spin mr-2" size={18} /> Carregando opções de compra...
            </div>
          ) : detalheQuery.isError ? (
            <div className="flex flex-col items-center justify-center h-40 text-red-500 gap-2">
              <AlertCircle size={32} />
              <p className="text-sm font-medium">Erro ao carregar detalhes</p>
              <p className="text-xs text-gray-500">{detalheQuery.error?.message}</p>
            </div>
          ) : sitios.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
              <Package size={32} className="text-gray-300" />
              <p className="text-sm">Nenhuma opção de compra disponível para este produto.</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-xs sticky top-0">
                  <th className="px-3 py-2 text-left w-16">Sítio</th>
                  <th className="px-3 py-2 text-left w-10"></th>
                  <th className="px-3 py-2 text-left">Nome do Sítio</th>
                  <th className="px-3 py-2 text-center w-24">Embalagem</th>
                  <th className="px-3 py-2 text-center w-28">Ponto de Abertura</th>
                  <th className="px-3 py-2 text-center w-20">Saldo ({labelUnidade})</th>
                  <th className="px-3 py-2 text-center w-36">Qtde. ({labelUnidade}):</th>
                  <th className="px-3 py-2 text-right w-28">Venda {temHastes ? 'Maço' : 'Emb.'} (R$):</th>
                </tr>
              </thead>
              <tbody>
                {sitios.map((s, i) => {
                  const qtd = qtds[s.codigoSitio] || 0;
                  const saldoMacos = calcSaldoExibido(s.embalagem, s.saldo);
                  const precoVendaMaco = calcPrecoVenda(s.embalagem, s.precoUnid);
                  return (
                    <tr key={`${s.codigoSitio}_${i}`}
                      className={`border-b hover:bg-green-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="px-3 py-2 font-mono text-xs text-gray-600">{s.codigoSitio}</td>
                      <td className="px-3 py-2">
                        {s.logoUrl ? (
                          <img src={s.logoUrl} alt={s.nomeSitio} className="w-8 h-8 object-contain rounded"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <Package size={14} className="text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">{s.nomeSitio}</td>
                      <td className="px-3 py-2 text-center text-xs text-gray-600">{s.embalagem}</td>
                      <td className="px-3 py-2 text-center text-xs text-gray-600">{s.pontoAbertura}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-semibold ${saldoMacos > 10 ? "text-green-700" : saldoMacos > 0 ? "text-amber-600" : "text-red-500"}`}>
                          {saldoMacos.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleQtd(s.codigoSitio, -1)}
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors">
                            <Minus size={12} />
                          </button>
                          <input type="number" min="0" value={qtd}
                            onChange={e => handleQtdInput(s.codigoSitio, e.target.value)}
                            className="w-14 text-center border border-gray-300 rounded h-6 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-green-500" />
                          <button onClick={() => handleQtd(s.codigoSitio, 1)}
                            className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors">
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-green-700">
                        {precoVendaMaco > 0 ? `R$ ${precoVendaMaco.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {totalQtd > 0 && (
          <div className="border-t px-4 py-3 bg-green-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-green-700">{totalQtd} {labelUnidade}</span> selecionados
            </div>
            <div className="text-sm font-bold text-green-700">
              Total Venda: R$ {totalVendaMaco.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ───
export default function CatalogoCooperflora() {
  const [filtroNome, setFiltroNome] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}").filtroNome || ""; } catch { return ""; }
  });
  const [filtroQualidade, setFiltroQualidade] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}").filtroQualidade || ""; } catch { return ""; }
  });
  const [showConfig, setShowConfig] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string>("");
  const [editingMargem, setEditingMargem] = useState<{ [codigo: string]: string }>({});
  const [produtoModal, setProdutoModal] = useState<Produto | null>(null);
  const [modalPedidoCompra, setModalPedidoCompra] = useState<{ nome: string; qtd: number; preco: number } | null>(null);
  const [produtoPainel, setProdutoPainel] = useState<{ nome: string; quantidade: number; precoUnitario: number } | null>(null);
  // Auto-sync agora é gerenciado pelo servidor (autoSync.ts)
  const { data: autoSyncStatus } = trpc.cooperflora.getAutoSyncStatus.useQuery(undefined, {
    refetchInterval: 30000, // verificar a cada 30s se o autoSync terminou
    refetchOnWindowFocus: false,
  });

  // ─── Margens por Departamento ───
  const [showMargensDept, setShowMargensDept] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [novoGrupo, setNovoGrupo] = useState("");
  const [novaMargem, setNovaMargem] = useState("");

  // ─── Progresso de sincronização via SSE ───
  const [syncProgress, setSyncProgress] = useState<{
    phase: string;
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const syncSessionId = useRef(`sync-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const sseRef = useRef<EventSource | null>(null);

  // ─── Scroll infinito (paginação frontend) ───
  const [visivelAte, setVisivelAte] = useState(PAGE_SIZE);
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>(() => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      return cache.produtos || [];
    } catch { return []; }
  });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [syncDate, setSyncDate] = useState(() => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      if (cache.syncDate) return cache.syncDate;
    } catch {}
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilWed = (3 - dayOfWeek + 7) % 7 || 7;
    const nextWed = new Date(today);
    nextWed.setDate(today.getDate() + daysUntilWed);
    return nextWed.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  });

  // Config
  const [cfgLogin, setCfgLogin] = useState("");
  const [cfgSenha, setCfgSenha] = useState("");
  const [cfgMargem, setCfgMargem] = useState("30");
  const [cfgDataCarregamento, setCfgDataCarregamento] = useState("");

  // Queries
  const configQuery = trpc.cooperflora.getConfig.useQuery(undefined);
  const configData = configQuery.data;

  const syncDateInicializadoRef = useRef(false);
  useEffect(() => {
    if (configData) {
      setCfgLogin(configData.login || "");
      setCfgSenha(configData.senha || "");
      setCfgMargem(String(configData.margemPadrao || "30"));
      setCfgDataCarregamento(configData.dataCarregamento || "");
      // Sincronizar dataCarregamento do banco (apenas na primeira carga)
      if (!syncDateInicializadoRef.current && configData.dataCarregamento) {
        setSyncDate(configData.dataCarregamento);
        syncDateInicializadoRef.current = true;
      }
    }
  }, [configData?.id]);

  const setDataCarregamentoMut = trpc.cooperflora.setDataCarregamento.useMutation({
    onError: (e) => toast.error("Erro ao salvar data de carregamento: " + e.message),
  });

  // Query: carrega todos de uma vez
  const { data: produtosData, isLoading: loadingProdutos, isFetching } =
    trpc.cooperflora.listar.useQuery({
      nome: filtroNome || undefined,
      qualidade: filtroQualidade || undefined,
    });

  // Atualizar lista completa ao receber dados
  useEffect(() => {
    if (!produtosData) return;
    const items: Produto[] = produtosData as Produto[];
    setTodosProdutos(items);
    setVisivelAte(PAGE_SIZE); // reset ao receber novos dados
  }, [produtosData]);

  // Persistir no localStorage
  useEffect(() => {
    if (todosProdutos.length === 0) return;
    try {
      const cache = {
        produtos: todosProdutos,
        filtroNome,
        filtroQualidade,
        syncDate,
        savedAt: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {}
  }, [todosProdutos, filtroNome, filtroQualidade, syncDate]);

  // Restaurar posição do scroll
  useEffect(() => {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      if (cache.scrollTop && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = cache.scrollTop;
      }
    } catch {}
  }, []);

  // Salvar posição do scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      cache.scrollTop = scrollContainerRef.current.scrollTop;
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {}
  }, []);

  // Reset ao trocar filtros
  const resetFiltro = useCallback(() => {
    setVisivelAte(PAGE_SIZE);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, []);

  // IntersectionObserver para scroll infinito (paginação frontend)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && visivelAte < produtosFiltrados.length) {
          setVisivelAte(prev => Math.min(prev + PAGE_SIZE, produtosFiltrados.length));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visivelAte, todosProdutos.length]);

  const utils = trpc.useUtils();

  // ── Quando o autoSync terminar, recarregar a lista automaticamente
  const prevUltimaSync = useRef<string | null>(null);
  useEffect(() => {
    if (!autoSyncStatus?.ultimaSync) return;
    const ultima = String(autoSyncStatus.ultimaSync);
    if (prevUltimaSync.current !== null && ultima !== prevUltimaSync.current) {
      utils.cooperflora.listar.invalidate();
      utils.cooperflora.getConfig.invalidate();
      utils.catalogoUnificado.listProdutos.invalidate();
    }
    prevUltimaSync.current = ultima;
  }, [autoSyncStatus?.ultimaSync]);

  const conectarSSE = useCallback(() => {
    if (sseRef.current) sseRef.current.close();
    const es = new EventSource(`/api/cooperflora/sync-stream?sessionId=${syncSessionId.current}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setSyncProgress(data);
        if (data.phase === "concluido" || data.phase === "erro") {
          es.close();
          sseRef.current = null;
          setTimeout(() => setSyncProgress(null), 4000);
        }
      } catch {}
    };
    es.onerror = () => { es.close(); sseRef.current = null; };
    sseRef.current = es;
  }, []);

  useEffect(() => () => { sseRef.current?.close(); }, []);

  // Mutations
  const salvarConfigMut = trpc.cooperflora.salvarConfig.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      setShowConfig(false);
      utils.cooperflora.getConfig.invalidate();
    },
    onError: (e) => toast.error("Erro ao salvar: " + e.message),
  });

  const sincronizarMut = trpc.cooperflora.sincronizar.useMutation({
    onSuccess: (data) => {
      toast.success(`Catálogo carregado! ${data.total} produtos sincronizados.`);
      // Limpar cache e recarregar
      try { localStorage.removeItem(CACHE_KEY); } catch {}
      setTodosProdutos([]);
      setVisivelAte(PAGE_SIZE);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      utils.cooperflora.listar.invalidate();
      utils.cooperflora.getConfig.invalidate();
      utils.catalogoUnificado.listProdutos.invalidate();
      utils.catalogoUnificado.listGrupos.invalidate();
      setTimeout(() => setSyncProgress(null), 4000);
    },
    onError: (e) => {
      setSyncProgress({ phase: "erro", current: 0, total: 0, message: e.message });
      setTimeout(() => setSyncProgress(null), 5000);
      toast.error("Erro na sincronização: " + e.message);
    },
  });

  // ─── Margens por Departamento ───
  const margensDeptQuery = trpc.cooperflora.listarMargensDepartamento.useQuery();
  const historicoSyncQuery = trpc.cooperflora.getHistoricoSync.useQuery(undefined, { enabled: showHistorico });
  const salvarMargemDeptMut = trpc.cooperflora.salvarMargemDepartamento.useMutation({
    onSuccess: () => {
      utils.cooperflora.listarMargensDepartamento.invalidate();
      toast.success("Margem salva!");
      setNovoGrupo("");
      setNovaMargem("");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const deletarMargemDeptMut = trpc.cooperflora.deletarMargemDepartamento.useMutation({
    onSuccess: () => { utils.cooperflora.listarMargensDepartamento.invalidate(); toast.success("Margem removida!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const atualizarMargemMut = trpc.cooperflora.atualizarMargem.useMutation({
    onSuccess: () => { utils.cooperflora.listar.invalidate(); },
    onError: (e) => toast.error("Erro ao atualizar margem: " + e.message),
  });

  // Handlers
  const handleSalvarConfig = () => {
    salvarConfigMut.mutate({
      login: cfgLogin,
      senha: cfgSenha,
      margemPadrao: parseFloat(cfgMargem) || 30,
      dataCarregamento: cfgDataCarregamento,
    });
  };

  const handleSincronizar = () => {
    if (!configData?.login || !configData?.senha) {
      setShowConfig(true);
      toast.info("Configure o login e senha da Cooperflora antes de sincronizar.");
      return;
    }
    conectarSSE();
    setSyncProgress({ phase: "produtos", current: 0, total: 0, message: "Iniciando sincronização..." });
    sincronizarMut.mutate({ dataCarregamento: syncDate, sessionId: syncSessionId.current });
  };

  const handleMargemChange = (codigo: string, value: string) => {
    setEditingMargem(prev => ({ ...prev, [codigo]: value }));
  };

  const handleMargemSave = (codigo: string) => {
    const val = editingMargem[codigo];
    const num = val === "" ? null : parseFloat(val);
    atualizarMargemMut.mutate({ codigo, margemCustom: num });
    setEditingMargem(prev => { const next = { ...prev }; delete next[codigo]; return next; });
  };

  const handleMargemKeyDown = (e: React.KeyboardEvent, codigo: string) => {
    if (e.key === "Enter") handleMargemSave(codigo);
    if (e.key === "Escape") {
      setEditingMargem(prev => { const next = { ...prev }; delete next[codigo]; return next; });
    }
  };

  // ─── Auto-sync ───
  const executarAutoSync = useCallback(() => {
    if (!configData?.login || !configData?.senha) return;
    conectarSSE();
    setSyncProgress({ phase: "produtos", current: 0, total: 0, message: "Iniciando sincronização..." });
    sincronizarMut.mutate({ dataCarregamento: syncDate, sessionId: syncSessionId.current });
  }, [configData?.login, configData?.senha, syncDate, conectarSSE]);

  // ── Exportar Excel
  const exportarExcel = useCallback(() => {
    if (todosProdutos.length === 0) { toast.error("Nenhum produto carregado para exportar."); return; }
    const linhas = todosProdutos.map((p: Produto) => ({
      "Código": p.codigo,
      "Nome": p.nome,
      "Grupo": p.grupo,
      "Qualidade": p.qualidade,
      "Estoque": p.estoque,
      "Hastes/Un": p.hastes,
      "Hastes/Embalagem": p.hastesEmbalagem,
      "Preço Mín (R$)": parseFloat(p.precoMin) > 0 ? parseFloat(p.precoMin).toFixed(4) : "",
      "Preço Máx (R$)": parseFloat(p.precoMax) > 0 ? parseFloat(p.precoMax).toFixed(4) : "",
      "Preço Venda Mín (R$)": parseFloat(p.precoVendaMin) > 0 ? parseFloat(p.precoVendaMin).toFixed(4) : "",
      "Preço Venda Máx (R$)": parseFloat(p.precoVendaMax) > 0 ? parseFloat(p.precoVendaMax).toFixed(4) : "",
      "Margem (%)": p.margem.toFixed(1),
      "Data Carregamento": p.dataCarregamento,
    }));
    const ws = XLSX.utils.json_to_sheet(linhas);
    const cols = Object.keys(linhas[0] || {});
    ws['!cols'] = cols.map(k => ({ wch: Math.max(k.length, 12) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catálogo Cooperflora");
    const filtros = [filtroNome, filtroQualidade].filter(Boolean).join("_") || "todos";
    const fileName = `catalogo_cooperflora_${filtros}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`✅ ${linhas.length} produtos exportados para Excel!`);
  }, [todosProdutos, filtroNome, filtroQualidade]);

  // Auto-sync gerenciado pelo servidor
  const config = configQuery.data;
  const margemPadrao = parseFloat(String(config?.margemPadrao || "30"));
  const ultimaAtualizacao = config?.ultimaAtualizacao
    ? new Date(config.ultimaAtualizacao).toLocaleString("pt-BR")
    : null;
  const dataCarregamentoModal = config?.dataCarregamento || syncDate;

  // Filtrar localmente (para filtros rápidos sem nova query)
  const produtosFiltrados: Produto[] = todosProdutos;
  const produtosVisiveis = produtosFiltrados.slice(0, visivelAte);
  const temMais = visivelAte < produtosFiltrados.length;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ─── Cabeçalho ─── */}
      <div className="bg-white border-b px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Package className="text-green-700" size={22} />
          <div>
            <h1 className="text-lg font-bold text-gray-800">Catálogo Cooperflora</h1>
            {ultimaAtualizacao && (
              <p className="text-xs text-gray-500">Última atualização: {ultimaAtualizacao}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 whitespace-nowrap">Data carreg.:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 w-36 text-sm justify-start gap-1 font-normal bg-white">
                  <CalendarIcon size={13} className="text-gray-400" />
                  {syncDate || <span className="text-gray-400">DD/MM/AAAA</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  locale={ptBR}
                  selected={(() => {
                    if (!syncDate) return undefined;
                    const [d, m, y] = syncDate.split("/");
                    const dt = new Date(Number(y), Number(m) - 1, Number(d));
                    return isNaN(dt.getTime()) ? undefined : dt;
                  })()}
                  onSelect={(date) => {
                    if (date) {
                      const novaData = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
                      setSyncDate(novaData);
                      setDataCarregamentoMut.mutate({ dataCarregamento: novaData });
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            onClick={handleSincronizar}
            disabled={sincronizarMut.isPending}
            className="bg-green-700 hover:bg-green-800 text-white h-8 text-sm gap-1"
          >
            <RefreshCw size={14} className={sincronizarMut.isPending ? "animate-spin" : ""} />
            {sincronizarMut.isPending ? "Sincronizando..." : "Atualizar Agora"}
          </Button>

          {autoSyncStatus && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground border rounded px-2 h-8">
              <RefreshCw size={12} className="text-green-500" />
              <span className="hidden sm:inline">
                {autoSyncStatus.rodando ? "Sincronizando..." :
                 autoSyncStatus.proximaSync ? `Próx: ${new Date(autoSyncStatus.proximaSync).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` :
                 "Auto 20min"}
              </span>
              <span className="sm:hidden">Auto</span>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => setShowConfig(!showConfig)}
            className="h-8 text-sm gap-1"
          >
            <Settings size={14} />
            Config
            {showConfig ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </Button>
        </div>
      </div>

      {/* ─── Barra de Progresso ─── */}
      {syncProgress && (() => {
        const isDone = syncProgress.phase === "concluido";
        const isErr = syncProgress.phase === "erro";
        const isSync = !isDone && !isErr;
        const pct = syncProgress.total > 0 ? Math.round((syncProgress.current / syncProgress.total) * 100) : (isDone ? 100 : 0);
        return (
          <div className={`px-4 py-2 border-b text-xs flex items-center gap-3 ${
            isDone ? "bg-green-50 text-green-700" :
            isErr  ? "bg-red-50 text-red-700" :
            "bg-blue-50 text-blue-700"
          }`}>
            {isSync && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
            {isDone && <span className="shrink-0">✓</span>}
            {isErr  && <span className="shrink-0">⚠</span>}
            <span className="flex-1 truncate font-medium">{syncProgress.message}</span>
            {syncProgress.total > 0 && (
              <span className="shrink-0 tabular-nums">{syncProgress.current}/{syncProgress.total}</span>
            )}
            <div className="w-32 shrink-0">
              <Progress
                value={isDone ? 100 : pct}
                className={`h-1.5 ${
                  isDone ? "[&>div]:bg-green-500" :
                  isErr  ? "[&>div]:bg-red-500" :
                  "[&>div]:bg-blue-500"
                }`}
              />
            </div>
          </div>
        );
      })()}

      {/* ─── Banner: sem credenciais ─── */}
      {!configQuery.isLoading && (!configData?.login || !configData?.senha) && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-2 flex items-center gap-2">
          <Info size={16} className="text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800">Credenciais da Cooperflora não configuradas.</span>
          <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}
            className="ml-2 h-7 text-xs border-amber-400 text-amber-700 hover:bg-amber-100">
            Configurar agora
          </Button>
        </div>
      )}

      {/* ─── Painel de Configuração ─── */}
      {showConfig && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-1">
            <Settings size={14} /> Configurações da Cooperflora
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Login Cooperflora</label>
              <Input value={cfgLogin} onChange={e => setCfgLogin(e.target.value)} placeholder="c62002" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Senha</label>
              <Input type="password" value={cfgSenha} onChange={e => setCfgSenha(e.target.value)} placeholder="••••••••" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Margem Padrão (%)</label>
              <Input value={cfgMargem} onChange={e => setCfgMargem(e.target.value)} placeholder="30" type="number" min="0" max="1000" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Data Carregamento Padrão</label>
              <Input value={cfgDataCarregamento} onChange={e => setCfgDataCarregamento(e.target.value)} placeholder="DD/MM/AAAA" className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button onClick={() => setShowMargensDept(v => !v)} variant="outline"
              className="h-8 text-sm gap-1 border-amber-400 text-amber-700 hover:bg-amber-100">
              <TrendingUp size={14} /> Margens por Departamento
            </Button>
            <Button onClick={() => { setShowHistorico(v => !v); setShowMargensDept(false); }} variant="outline"
              className="h-8 text-sm gap-1 border-amber-400 text-amber-700 hover:bg-amber-100">
              <RefreshCw size={14} /> Histórico de Sincronizações
            </Button>
            <Button onClick={handleSalvarConfig} disabled={salvarConfigMut.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-sm gap-1">
              <Save size={14} />
              {salvarConfigMut.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
            <Button
              onClick={() => {
                salvarConfigMut.mutate(
                  { login: cfgLogin, senha: cfgSenha, margemPadrao: parseFloat(cfgMargem) || 30, dataCarregamento: cfgDataCarregamento },
                  {
                    onSuccess: () => {
                      toast.success("Configurações salvas!");
                      setShowConfig(false);
                      utils.cooperflora.getConfig.invalidate();
                      setTimeout(() => sincronizarMut.mutate({ dataCarregamento: syncDate }), 500);
                    },
                  }
                );
              }}
              disabled={salvarConfigMut.isPending || sincronizarMut.isPending || !cfgLogin || !cfgSenha}
              className="bg-green-700 hover:bg-green-800 text-white h-8 text-sm gap-1"
            >
              <RefreshCw size={14} className={sincronizarMut.isPending ? "animate-spin" : ""} />
              Salvar e Sincronizar
            </Button>
            <Button variant="outline" onClick={() => setShowConfig(false)} className="h-8 text-sm gap-1">
              <X size={14} /> Fechar
            </Button>
          </div>
        </div>
      )}

      {/* ─── Painel de Margens por Departamento ─── */}
      {showConfig && showMargensDept && (
        <div className="bg-white border-b border-amber-200 px-4 py-3">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-1">
            <TrendingUp size={14} className="text-amber-600" /> Margens por Departamento
            <span className="text-xs font-normal text-gray-500 ml-1">(sobrepõe a margem padrão para o grupo)</span>
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Grupo / Departamento</TableHead>
                  <TableHead className="w-1/4">Margem (%)</TableHead>
                  <TableHead className="w-1/4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(margensDeptQuery.data || []).map((row) => (
                  <TableRow key={row.grupo}>
                    <TableCell className="font-medium">{row.grupo}</TableCell>
                    <TableCell>{Number(row.margem).toFixed(2)}%</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deletarMargemDeptMut.mutate({ grupo: row.grupo })}
                        disabled={deletarMargemDeptMut.isPending}>
                        <Trash2 size={13} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(margensDeptQuery.data || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-400 text-sm py-4">
                      Nenhuma margem por departamento configurada. Usando margem padrão global.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex gap-2 mt-3 items-end">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Grupo / Departamento</label>
              <Input value={novoGrupo} onChange={e => setNovoGrupo(e.target.value)}
                placeholder="Ex: ROSAS, FOLHAGENS..." className="h-8 text-sm w-52" list="grupos-cooperflora" />
              <datalist id="grupos-cooperflora">
                {Array.from(new Set(todosProdutos.map((p: Produto) => p.grupo).filter(Boolean))).map((g: any) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Margem (%)</label>
              <Input value={novaMargem} onChange={e => setNovaMargem(e.target.value)}
                placeholder="Ex: 35" type="number" min="0" max="500" className="h-8 text-sm w-24" />
            </div>
            <Button
              onClick={() => { if (!novoGrupo.trim() || !novaMargem) return; salvarMargemDeptMut.mutate({ grupo: novoGrupo.trim().toUpperCase(), margem: parseFloat(novaMargem) }); }}
              disabled={salvarMargemDeptMut.isPending || !novoGrupo || !novaMargem}
              className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-sm gap-1">
              <PlusCircle size={14} /> Adicionar
            </Button>
          </div>
        </div>
      )}

      {/* ─── Painel de Histórico de Sincronizações ─── */}
      {showConfig && showHistorico && (
        <div className="bg-white border-b border-amber-200 px-4 py-3">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <RefreshCw size={14} className="text-amber-600" /> Histórico de Sincronizações — Cooperflora
            <Button variant="ghost" size="sm" className="h-6 text-xs ml-auto"
              onClick={() => { utils.cooperflora.getHistoricoSync.invalidate(); }}>
              Atualizar
            </Button>
          </h3>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Data/Hora</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-20 text-right">Produtos</TableHead>
                  <TableHead className="w-20 text-right">Duração</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicoSyncQuery.isLoading && (
                  <TableRow><TableCell colSpan={5} className="text-center py-4">
                    <Loader2 size={16} className="animate-spin inline mr-2" />Carregando...
                  </TableCell></TableRow>
                )}
                {!historicoSyncQuery.isLoading && (historicoSyncQuery.data || []).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-400 text-sm py-4">
                    Nenhuma sincronização registrada ainda.
                  </TableCell></TableRow>
                )}
                {(historicoSyncQuery.data || []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs tabular-nums">
                      {new Date(row.createdAt).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        row.status === 'SUCESSO'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {row.status === 'SUCESSO' ? '✓' : '✗'} {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{row.total}</TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-gray-500">
                      {row.duracaoMs != null ? `${(row.duracaoMs / 1000).toFixed(1)}s` : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-xs truncate" title={row.mensagem ?? undefined}>
                      {row.mensagem || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      {/* ─── Barra de filtros ─── */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-2 flex-wrap">
        <Search size={16} className="text-gray-400 shrink-0" />
        <Input
          value={filtroNome}
          onChange={e => { setFiltroNome(e.target.value); resetFiltro(); }}
          placeholder="Filtrar por nome do produto..."
          className="h-8 text-sm max-w-xs"
        />
        <Input
          value={filtroQualidade}
          onChange={e => { setFiltroQualidade(e.target.value); resetFiltro(); }}
          placeholder="Qualidade (A1, A2...)"
          className="h-8 text-sm w-36"
        />
         <button
          onClick={exportarExcel}
          className="flex items-center gap-1 h-8 px-2.5 rounded border border-green-300 bg-green-50 hover:bg-green-100 text-green-700 text-xs transition-colors font-medium"
          title="Exportar produtos para Excel (.xlsx)"
        >
          <FileDown className="h-3.5 w-3.5" />
          Excel
        </button>
        <div className="ml-auto text-xs text-gray-500">
          {produtosFiltrados.length > 0
            ? `${produtosVisiveis.length} de ${produtosFiltrados.length} produtos`
            : ""}
        </div>
      </div>
      {/* ─── Tabela com scroll infinito ─── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto px-2 py-2" onScroll={handleScroll}>
        {loadingProdutos && todosProdutos.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-500">
            <RefreshCw className="animate-spin mr-2" size={18} /> Carregando produtos...
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <Package size={40} className="text-gray-300" />
            <p className="text-sm">Nenhum produto encontrado.</p>
            {!config?.login && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <Info size={12} /> Configure as credenciais da Cooperflora e clique em "Atualizar Agora"
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse bg-white rounded-lg shadow-sm overflow-hidden">
              <thead>
                <tr className="bg-green-700 text-white text-xs">
                  <th className="px-2 py-2 text-left w-12">Img</th>
                  <th className="px-2 py-2 text-left w-24">Código</th>
                  <th className="px-2 py-2 text-left">Nome</th>
                  <th className="px-2 py-2 text-center w-16">Qual.</th>
                  <th className="px-2 py-2 text-center w-20">Estoque</th>
                  <th className="px-2 py-2 text-center w-24">Oferta Conv.</th>
                  <th className="px-2 py-2 text-right w-36">Custo (R$)</th>
                  <th className="px-2 py-2 text-right w-36">Venda Maço (R$)</th>
                  <th className="px-2 py-2 text-center w-24">Comprar</th>
                </tr>
              </thead>
              <tbody>
                {produtosVisiveis.map((p, i) => {
                  const margemProd = p.margemCustom !== null && p.margemCustom !== undefined
                    ? parseFloat(String(p.margemCustom))
                    : margemPadrao;
                  const hastesProd = p.hastes && p.hastes > 0 ? p.hastes : 1;
                  const hastesEmb = p.hastesEmbalagem && p.hastesEmbalagem > 1 ? p.hastesEmbalagem : hastesProd;
                  // estoqueMacos: se hastesEmb == hastesProd (padrão), estoque já é em maços
                  const estoqueMacos = hastesEmb === hastesProd
                    ? p.estoque
                    : Math.floor(p.estoque * (hastesEmb / hastesProd));
                  const qtdEmbalagem = parseInt(hastesEmb.toString().match(/\d+/)?.[0] || '1');
                  const ofertaConvertida = Math.floor((qtdEmbalagem * p.estoque) / hastesProd);
                  const precoMinNum = parseFloat(p.precoMin) || 0;
                  const precoMaxNum = parseFloat(p.precoMax) || precoMinNum;
                  const vendaMin = precoMinNum * hastesProd * (1 + margemProd / 100);
                  const vendaMax = precoMaxNum * hastesProd * (1 + margemProd / 100);

                  return (
                    <tr key={p.id}
                      className={`border-b hover:bg-green-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="px-2 py-1">
                        {p.imagemUrl ? (
                          <button type="button"
                            onClick={() => { setLightboxUrl(p.imagemUrl!); setLightboxAlt(p.nome); }}
                            className="group relative w-10 h-10 rounded border overflow-hidden focus:outline-none cursor-zoom-in">
                            <img src={p.imagemUrl} alt={p.nome}
                              className="w-10 h-10 object-cover transition-transform group-hover:scale-110"
                              onError={e => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).parentElement!.style.display = "none"; }} />
                            <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <ZoomIn size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </button>
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center">
                            <Package size={16} className="text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-1 font-mono text-xs text-gray-600">{p.codigo}</td>
                      <td className="px-2 py-1 font-medium text-gray-800">{p.nome} {p.qualidade} {p.grupo}</td>
                      <td className="px-2 py-1 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          p.qualidade === "A1" ? "bg-green-100 text-green-700" :
                          p.qualidade === "A2" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {p.qualidade || "—"}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-center">
                        <span className={`font-semibold ${estoqueMacos > 10 ? "text-green-700" : estoqueMacos > 0 ? "text-amber-600" : "text-red-500"}`}>
                          {estoqueMacos}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-center">
                        <span className={`font-semibold ${ofertaConvertida > 10 ? "text-green-700" : ofertaConvertida > 0 ? "text-amber-600" : "text-red-500"}`}>
                          {ofertaConvertida}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-right text-gray-700 text-xs">
                        {formatPreco(p.precoMin, p.precoMax)}
                      </td>
                      <td className="px-2 py-1 text-right font-semibold text-green-700 text-xs">
                        {precoMinNum === 0 ? "—" :
                          vendaMax > vendaMin
                            ? `R$ ${vendaMin.toFixed(2)} – ${vendaMax.toFixed(2)}`
                            : `R$ ${vendaMin.toFixed(2)}`}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {p.estoque > 0 ? (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => setProdutoModal(p)}
                              className="h-7 text-xs bg-green-700 hover:bg-green-800 text-white gap-1 px-2">
                              <ShoppingCart size={12} /> Comprar
                            </Button>
                            <Button size="sm"
                              className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white px-2"
                              title="Adicionar ao Orçamento (modal)"
                              onClick={() => {
                                const margem = p.margemCustom !== null && p.margemCustom !== undefined ? parseFloat(String(p.margemCustom)) : margemPadrao;
                                const precoMin = parseFloat(p.precoMin) || 0;
                                const hastes = p.hastesEmbalagem || p.hastes || 1;
                                const precoVenda = precoMin * (1 + margem / 100) * hastes;
                                setModalPedidoCompra({ nome: p.nome, qtd: 1, preco: precoVenda });
                              }}>
                              <ShoppingCart size={12} />
                            </Button>
                            {/* Botão painel lateral */}
                            <Button size="sm"
                              variant="outline"
                              className="h-7 text-xs border-orange-400 text-orange-600 hover:bg-orange-50 px-2"
                              title="Adicionar ao painel de orçamento"
                              onClick={() => {
                                const margem = p.margemCustom !== null && p.margemCustom !== undefined ? parseFloat(String(p.margemCustom)) : margemPadrao;
                                const precoMin = parseFloat(p.precoMin) || 0;
                                const hastes = p.hastesEmbalagem || p.hastes || 1;
                                const precoVenda = precoMin * (1 + margem / 100) * hastes;
                                setProdutoPainel({ nome: p.nome, quantidade: 1, precoUnitario: precoVenda });
                              }}>
                              <Plus size={12} />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-red-400 font-medium">Esgotado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Sentinel para IntersectionObserver */}
            <div ref={sentinelRef} className="h-4" />

            {/* Indicador de carregamento */}
            {isFetching && todosProdutos.length === 0 && (
              <div className="flex items-center justify-center py-4 gap-2 text-gray-500 text-xs">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando produtos...
              </div>
            )}

            {/* Mais produtos para carregar */}
            {temMais && (
              <div className="flex items-center justify-center py-4 gap-2 text-gray-500 text-xs">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando mais produtos...
              </div>
            )}

            {/* Fim da lista */}
            {!temMais && produtosFiltrados.length > 0 && (
              <div className="text-center py-3 text-xs text-gray-400">
                ✓ Todos os {produtosFiltrados.length} produtos carregados
                {produtosVisiveis[0]?.dataCarregamento && ` • Carregamento: ${produtosVisiveis[0].dataCarregamento}`}
                {" • Atualização automática a cada 20 min (servidor)"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Modal Adicionar ao Orçamento (modal tradicional) ─── */}
      {modalPedidoCompra && (
        <ModalAdicionarPedidoCompra
          produtoNome={modalPedidoCompra.nome}
          quantidade={modalPedidoCompra.qtd}
          precoUnitario={modalPedidoCompra.preco}
          onClose={() => setModalPedidoCompra(null)}
        />
      )}
      {/* Painel lateral de orçamento (mini resumo em tempo real) */}
      <OrcamentoSidePanel
        produtoPendente={produtoPainel}
        onProdutoPendenteConsumed={() => setProdutoPainel(null)}
        origem="COOPERFLORA"
      />
      {/* ─── Modal de Detalhes do Produto ─── */}
      {produtoModal && (
        <ModalDetalhesProduto
          produto={produtoModal}
          dataCarregamento={dataCarregamentoModal}
          margemPadrao={margemPadrao}
          onClose={() => setProdutoModal(null)}
        />
      )}

      {/* ─── Lightbox de imagem ─── */}
      <Dialog open={!!lightboxUrl} onOpenChange={open => { if (!open) setLightboxUrl(null); }}>
        <DialogContent className="flex items-center justify-center bg-black/90 border-none shadow-2xl p-2 max-w-[90vw] max-h-[90vh] w-auto">
          <DialogTitle className="sr-only">Imagem do produto</DialogTitle>
          {lightboxUrl && (
            <img src={lightboxUrl} alt={lightboxAlt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
              style={{ touchAction: "none" }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
