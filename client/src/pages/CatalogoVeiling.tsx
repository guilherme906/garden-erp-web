import { ColorFilterDropdown } from "@/components/ColorFilterDropdown";
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  RefreshCw, Settings, CalendarIcon, Search, X, ChevronDown,
  Package, Loader2, ZoomIn, TrendingUp, Trash2, Eye, EyeOff,
  ShoppingCart, Plus, Minus, Upload, FileSpreadsheet, AlertCircle, FileDown,
  CloudDownload, CheckCircle, History, LinkIcon, Copy, Download, MessageCircle
} from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import ModalAdicionarPedidoCompra from "@/components/ModalAdicionarPedidoCompra";
import OrcamentoSidePanel from "@/components/OrcamentoSidePanel";
import ModalConferenciaCatalogo from "@/components/ModalConferenciaCatalogo";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// ─── Produtos ocultos (excluídos temporariamente do catálogo) ────────────────
const OCULTOS_KEY = "veiling_produtos_ocultos";
function loadOcultos(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(OCULTOS_KEY) || "[]") as number[]); } catch { return new Set(); }
}
function saveOcultos(ids: Set<number>) {
  localStorage.setItem(OCULTOS_KEY, JSON.stringify(Array.from(ids)));
}

// ─── Produtos selecionados para PDF (persistidos) ─────────────────────────────
const SELECIONADOS_PDF_KEY = "veiling_selecionados_pdf";
function loadSelecionadosPdf(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(SELECIONADOS_PDF_KEY) || "[]") as number[]); } catch { return new Set(); }
}
function saveSelecionadosPdf(ids: Set<number>) {
  localStorage.setItem(SELECIONADOS_PDF_KEY, JSON.stringify(Array.from(ids)));
}

// ─── Colunas visíveis ─────────────────────────────────────────────────────────
const COLUNAS_KEY = "veiling_colunas_visiveis";
const COLUNAS_PADRAO = {
  foto: true,
  qualidade: true,
  statusProduto: true,
  categoria: true,
  produtor: true,
  freteUn: true,
  icmsUn: true,
  estoque: true,
  qtd: true,
  indicadoresCusto: true, // +frete +ICMS abaixo do Custo/Pct
};
type ColunasVisiveis = typeof COLUNAS_PADRAO;
function loadColunas(): ColunasVisiveis {
  try { return { ...COLUNAS_PADRAO, ...JSON.parse(localStorage.getItem(COLUNAS_KEY) || "{}") }; } catch { return COLUNAS_PADRAO; }
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface SyncProgress {
  phase: string;
  current: number;
  total: number;
  message: string;
}

const PAGE_SIZE = 100;
const VEILING_CACHE_KEY = "veiling_cache";

// Mapeamento de cor → emoji/indicador visual
const COR_EMOJI: Record<string, string> = {
  BRANCO: "⚪",
  ROSA: "🌸",
  VINHO: "🍷",
  SALMÃO: "🍑",
  AMARELO: "🌼",
  LARANJA: "🟠",
  VERMELHO: "🌹",
  MULTICOLOR: "🌈",
  VARIADO: "🎨",
};

// ─── Helper: badge de status do produto Veiling ─────────────────────────────
function StatusVeilingBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-muted-foreground text-[10px]">—</span>;
  if (status === 'LKP_RECEPCIONADO') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 whitespace-nowrap">
        RECEPCIONADO LKP
      </span>
    );
  }
  if (status === 'ENP') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 whitespace-nowrap">
        ESTQ NO PROD. ENP
      </span>
    );
  }
  if (status === 'LKP_SITIO') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 whitespace-nowrap">
        NO SITIO LKP
      </span>
    );
  }
  return <span className="text-muted-foreground text-[10px]">{status}</span>;
}

// ─── Componente de Histórico de Sincronizações ───
function HistoricoSyncVeiling() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.veiling.getHistoricoSync.useQuery();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Registro das últimas 50 sincronizações.</p>
        <Button variant="ghost" size="sm" className="h-6 text-xs"
          onClick={() => utils.veiling.getHistoricoSync.invalidate()}>
          <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
        </Button>
      </div>
      <div className="border rounded overflow-hidden max-h-72 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-2 py-2 text-left font-medium">Data/Hora</th>
              <th className="px-2 py-2 text-left font-medium">Status</th>
              <th className="px-2 py-2 text-right font-medium">Produtos</th>
              <th className="px-2 py-2 text-right font-medium">Duração</th>
              <th className="px-2 py-2 text-left font-medium">Mensagem</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-3 py-4 text-center">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Carregando...
              </td></tr>
            )}
            {!isLoading && (data || []).length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                Nenhuma sincronização registrada ainda.
              </td></tr>
            )}
            {(data || []).map((row) => (
              <tr key={row.id} className="border-t hover:bg-muted/20">
                <td className="px-2 py-1.5 tabular-nums whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleString('pt-BR')}
                </td>
                <td className="px-2 py-1.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    row.status === 'SUCESSO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {row.status === 'SUCESSO' ? '✓' : '✗'} {row.status}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">{row.total}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                  {row.duracaoMs != null ? `${(row.duracaoMs / 1000).toFixed(1)}s` : '—'}
                </td>
                <td className="px-2 py-1.5 text-muted-foreground max-w-[160px] truncate" title={row.mensagem ?? undefined}>
                  {row.mensagem || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Componente de Importação de Pedidos Veiling Online ───
function ImportarPedidosVeiling() {
  const utils = trpc.useUtils();
  const importarMut = trpc.veiling.importarPedidosDia.useMutation({
    onSuccess: (data) => {
      utils.veiling.listarImportacoes.invalidate();
      if (data.totalItens > 0) {
        toast.success(`✅ ${data.mensagem}`);
      } else {
        toast.info(`ℹ️ ${data.mensagem}`);
      }
    },
    onError: (e) => toast.error("Erro ao importar pedidos: " + e.message),
  });
  const { data: historico, isLoading } = trpc.veiling.listarImportacoes.useQuery();
  return (
    <div className="space-y-4">
      <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <CloudDownload className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-orange-700 dark:text-orange-400">Importação Automática de Pedidos</p>
            <p className="text-xs text-orange-600/80 dark:text-orange-500/80">
              Clique em <strong>Importar Hoje</strong> para buscar os pedidos do dia atual diretamente do Veiling Online.
              O sistema faz login automaticamente com as credenciais configuradas na aba <strong>Geral</strong> e cria uma entrada em <strong>Compras</strong>.
            </p>
            <p className="text-xs text-orange-600/80 dark:text-orange-500/80">
              <History className="h-3 w-3 inline mr-1" />
              <strong>Automático:</strong> todos os dias às 18h o sistema importa os pedidos do dia automaticamente.
            </p>
          </div>
        </div>
      </div>
      <Button
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
        onClick={() => importarMut.mutate({ origem: "MANUAL" })}
        disabled={importarMut.isPending}
      >
        {importarMut.isPending
          ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Importando pedidos...</>
          : <><CloudDownload className="h-4 w-4 mr-2" />Importar Pedidos de Hoje</>
        }
      </Button>
      <div>
        <p className="text-xs font-medium mb-2 text-muted-foreground">Histórico de Importações</p>
        <div className="border rounded overflow-hidden max-h-60 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-2 text-left font-medium">Data/Hora</th>
                <th className="px-2 py-2 text-left font-medium">Pedidos</th>
                <th className="px-2 py-2 text-right font-medium">Itens</th>
                <th className="px-2 py-2 text-left font-medium">Status</th>
                <th className="px-2 py-2 text-left font-medium">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="px-3 py-4 text-center">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Carregando...
                </td></tr>
              )}
              {!isLoading && (historico || []).length === 0 && (
                <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                  Nenhuma importação registrada ainda.
                </td></tr>
              )}
              {(historico || []).map((row) => (
                <tr key={row.id} className="border-t hover:bg-muted/20">
                  <td className="px-2 py-1.5 tabular-nums whitespace-nowrap">
                    {new Date(row.dataImportacao).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-2 py-1.5 tabular-nums">{row.totalPedidos ?? 0}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{row.totalItens ?? 0}</td>
                  <td className="px-2 py-1.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      row.status === 'SUCESSO' ? 'bg-green-100 text-green-700' : row.status === 'PARCIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {row.status === 'SUCESSO' ? <CheckCircle className="h-3 w-3" /> : null}
                      {row.status}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground max-w-[140px] truncate" title={row.mensagem ?? undefined}>
                    {row.mensagem || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────────────────────────────────
export default function CatalogoVeiling() {
  // ── Estado de data e filtros (com persistência)
  const [syncDate, setSyncDate] = useState(() => {
    try {
      const cache = JSON.parse(localStorage.getItem(VEILING_CACHE_KEY) || "{}");
      if (cache.syncDate) return cache.syncDate;
    } catch {}
    return format(new Date(), "dd/MM/yyyy");
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem(VEILING_CACHE_KEY) || "{}").filtroCategoria || ""; } catch { return ""; }
  });
  const [filtroProdutor, setFiltroProdutor] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem(VEILING_CACHE_KEY) || "{}").filtroProdutor || ""; } catch { return ""; }
  });
  const [filtroBusca, setFiltroBusca] = useState(() => {
    try { return JSON.parse(localStorage.getItem(VEILING_CACHE_KEY) || "{}").filtroBusca || ""; } catch { return ""; }
  });
  const [filtroCores, setFiltroCores] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(VEILING_CACHE_KEY) || "{}").filtroCores || []; } catch { return []; }
  });
  const [buscaInput, setBuscaInput] = useState(() => {
    try { return JSON.parse(localStorage.getItem(VEILING_CACHE_KEY) || "{}").filtroBusca || ""; } catch { return ""; }
  });

  // ── Estado de scroll infinito (com persistência)
  const [pagina, setPagina] = useState(0);
  const [produtosAcumulados, setProdutosAcumulados] = useState<any[]>(() => {
    try {
      const cache = JSON.parse(localStorage.getItem(VEILING_CACHE_KEY) || "{}");
      return cache.produtos || [];
    } catch { return []; }
  });
  const [totalProdutos, setTotalProdutos] = useState(() => {
    try {
      const cache = JSON.parse(localStorage.getItem(VEILING_CACHE_KEY) || "{}");
      return cache.total || 0;
    } catch { return 0; }
  });
  const [carregandoMais, setCarregandoMais] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Estado de configuração
  const [configOpen, setConfigOpen] = useState(false);
  const [configTab, setConfigTab] = useState<"geral" | "margens" | "conversao" | "historico" | "importacao">("geral");
  const [importandoPedidos, setImportandoPedidos] = useState(false);
  const [cfgUsuario, setCfgUsuario] = useState("");
  const [cfgSenha, setCfgSenha] = useState("");
  const [cfgCustomerId, setCfgCustomerId] = useState("987");
  const [cfgCustomerIdPedidos, setCfgCustomerIdPedidos] = useState("5191");
  const [cfgMargem, setCfgMargem] = useState(30);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novaMargem, setNovaMargem] = useState(30);
  const [showLinkGenerator, setShowLinkGenerator] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [linkGeneratorMode, setLinkGeneratorMode] = useState<'categoria' | 'produtos'>('categoria');
  const [selectedProductsForPdf, setSelectedProductsForPdf] = useState<Set<number>>(loadSelecionadosPdf);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfTitulo, setPdfTitulo] = useState('Lista de Flores');
  const [pdfObservacoes, setPdfObservacoes] = useState('');
  const [pdfValidade, setPdfValidade] = useState(1);
  const [pdfDataEmissao, setPdfDataEmissao] = useState('');
  const [pdfHoraEmissao, setPdfHoraEmissao] = useState('');
  const [pdfHoraValidade, setPdfHoraValidade] = useState('');
  const [pdfDescontoPercentual, setPdfDescontoPercentual] = useState(5);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showConferenciaModal, setShowConferenciaModal] = useState(false);
  const [produtosParaConferencia, setProdutosParaConferencia] = useState<any[]>([]);

   // ── Estado de sincronização
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  // ── Status do auto-sync do servidor
  const { data: autoSyncStatus } = trpc.veiling.getAutoSyncStatus.useQuery(undefined, {
    refetchInterval: 30000, // verificar a cada 30s se o autoSync terminou
    refetchOnWindowFocus: false,
  });

  // ── Estado de colunas visíveis
  const [colunasVisiveis, setColunasVisiveis] = useState<ColunasVisiveis>(loadColunas);
  const toggleColuna = (col: keyof ColunasVisiveis) => {
    setColunasVisiveis(prev => {
      const next = { ...prev, [col]: !prev[col] };
      localStorage.setItem(COLUNAS_KEY, JSON.stringify(next));
      return next;
    });
  };

  // ── Estado de produtos ocultos (excluídos temporariamente do catálogo)
  const [produtosOcultos, setProdutosOcultos] = useState<Set<number>>(loadOcultos);
  const [mostrarOcultos, setMostrarOcultos] = useState(false);

  // Função para gerar link com produtos selecionados
  const generateProductLink = () => {
    if (selectedProductIds.size === 0) {
      toast.error('Selecione pelo menos um produto');
      return;
    }
    const ids = Array.from(selectedProductIds).join(',');
    const url = `${window.location.origin}/catalogo-veiling-cliente?produtos=${ids}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };
  const toggleProductSelection = (id: number) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleProductForPdf = (id: number) => {
    setSelectedProductsForPdf(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Persistir no localStorage
      saveSelecionadosPdf(next);
      return next;
    });
  };

  const generatePdf = useCallback(async (produtosAjustados?: any[], descontos?: Record<number, number>) => {
    if (selectedProductsForPdf.size === 0) {
      toast.error('Selecione pelo menos um produto');
      return;
    }

    setGeneratingPdf(true);
    try {
      const selectedProducts = produtosAjustados || produtosAcumulados.filter(p => selectedProductsForPdf.has(p.id));
      const descontosMap = descontos || {};
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let yPosition = 25;

      // Função para adicionar cabeçalho
      const addHeader = () => {
        doc.setFontSize(16);
        doc.setFont('', 'bold');
        doc.text('GARDEN CENTER PRIMAVERA', margin, 8);
        
        doc.setFontSize(12);
        doc.setFont('', 'bold');
        doc.text(pdfTitulo || '', margin, 12);
        
        // Data de emissão
        const emissaoData = pdfDataEmissao ? new Date(pdfDataEmissao) : new Date();
        const hoje = emissaoData.toLocaleDateString('pt-BR');
        const horaEmissao = pdfHoraEmissao || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        doc.setFontSize(8);
        doc.setFont('', 'normal');
        doc.text(`Emissão: ${hoje} às ${horaEmissao}`, pageWidth - margin - 50, 8);
        
        // Prazo de validade (personalizável)
        const validade = new Date(emissaoData);
        validade.setDate(validade.getDate() + pdfValidade);
        const validadeStr = validade.toLocaleDateString('pt-BR');
        const horaValidade = pdfHoraValidade || horaEmissao;
        doc.text(`Válido até: ${validadeStr} às ${horaValidade}`, pageWidth - margin - 50, 12);
        
        // Data de carregamento da tabela
        doc.setFontSize(8);
        doc.text(`Tabela de: ${syncDate}`, margin, 15);
        
        // Observações
        if (pdfObservacoes) {
          doc.setFontSize(7);
          doc.setFont('', 'normal');
          const obsLines = doc.splitTextToSize(pdfObservacoes, pageWidth - 2 * margin);
          doc.text(obsLines, margin, 17);
          yPosition += obsLines.length * 2;
        }
        
        // Linha separadora
        doc.setDrawColor(150, 150, 150);
        doc.line(margin, 19, pageWidth - margin, 19);
      };

      // Adicionar cabeçalho na primeira página
      addHeader();
      yPosition = 20;

      const contentWidth = pageWidth - 2 * margin;
      const fotoWidth = 12;
      const fotoHeight = 12;
      const nomeWidth = 60;
      const categoriaWidth = 30;
      const codigoWidth = 20;
      const precoWidth = 18;
      const descontoWidth = 18;
      const valorDescontoWidth = 18;
      const estoqueWidth = 18;
      const rowHeight = 12;
      const headerHeight = 6;

      // Função para adicionar cabeçalho da tabela
      const addTableHeader = () => {
        doc.setFillColor(0, 0, 0); // Preto
        let xPos = margin;
        doc.rect(xPos, yPosition, fotoWidth, headerHeight, 'F');
        xPos += fotoWidth;
        doc.rect(xPos, yPosition, nomeWidth, headerHeight, 'F');
        xPos += nomeWidth;
        doc.rect(xPos, yPosition, categoriaWidth, headerHeight, 'F');
        xPos += categoriaWidth;
        doc.rect(xPos, yPosition, codigoWidth, headerHeight, 'F');
        xPos += codigoWidth;
        doc.rect(xPos, yPosition, precoWidth, headerHeight, 'F');
        xPos += precoWidth;
        doc.rect(xPos, yPosition, descontoWidth, headerHeight, 'F');
        xPos += descontoWidth;
        doc.rect(xPos, yPosition, valorDescontoWidth, headerHeight, 'F');
        xPos += valorDescontoWidth;
        doc.rect(xPos, yPosition, estoqueWidth, headerHeight, 'F');
        
        doc.setTextColor(255, 255, 255); // Branco
        doc.setFontSize(6);
        doc.setFont('', 'bold');
        xPos = margin;
        doc.text('Foto', xPos + 1, yPosition + 4);
        xPos += fotoWidth;
        doc.text('Produto', xPos + 1, yPosition + 4);
        xPos += nomeWidth;
        doc.text('Categoria', xPos + 1, yPosition + 4);
        xPos += categoriaWidth;
        doc.text('Codigo', xPos + 1, yPosition + 4);
        xPos += codigoWidth;
        doc.text('Preco', xPos + 1, yPosition + 4);
        xPos += precoWidth;
        doc.text('Desconto', xPos + 1, yPosition + 4);
        xPos += descontoWidth;
        doc.text('V. Desc.', xPos + 1, yPosition + 4);
        xPos += valorDescontoWidth;
        doc.text('Estoque', xPos + 1, yPosition + 4);
        
        doc.setTextColor(0, 0, 0); // Volta para preto
        yPosition += headerHeight;
      };

      // Adicionar cabeçalho da tabela
      addTableHeader();

      for (let i = 0; i < selectedProducts.length; i++) {
        const product = selectedProducts[i];

        // Verificar se precisa de nova página
        if (yPosition + fotoHeight + 5 > pageHeight - margin) {
          doc.addPage();
          addHeader();
          yPosition = 20;
          addTableHeader();
        }

        // Renderizar linha do produto
        let xPos = margin;
        
        // Coluna FOTO
        doc.setDrawColor(200, 200, 200);
        doc.rect(xPos, yPosition, fotoWidth, rowHeight);
        
        // Tentar adicionar imagem usando a mesma lógica do catálogo
        try {
          const rawFoto = (product as any).fotoConversao as string | null;
          const fotoSrc = rawFoto
            ? (rawFoto.startsWith('http://') ? `/api/veiling/foto?url=${encodeURIComponent(rawFoto)}` : rawFoto)
            : (product.offerId ? `/api/veiling/image?offerId=${product.offerId}` : null);
          
          if (fotoSrc) {
            // Usar URL absoluta se for relativa
            const absoluteUrl = fotoSrc.startsWith('http') ? fotoSrc : `${window.location.origin}${fotoSrc}`;
            doc.addImage(absoluteUrl, 'JPEG', xPos + 0.5, yPosition + 0.5, fotoWidth - 1, rowHeight - 1);
          } else {
            doc.setFontSize(6);
            doc.setFont('', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text('FOTO', xPos + 1, yPosition + 6);
          }
        } catch (e) {
          doc.setFontSize(6);
          doc.setFont('', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.text('FOTO', xPos + 1, yPosition + 6);
        }
        xPos += fotoWidth;
        
        // Coluna PRODUTO (Nome + Cor)
        doc.rect(xPos, yPosition, nomeWidth, rowHeight);
        doc.setFontSize(6);
        doc.setFont('', 'bold');
        const nome = (product.nomeCompleto || product.nome).substring(0, 25);
        doc.text(nome, xPos + 1, yPosition + 4);
        doc.setFont('', 'normal');
        const cor = product.cor || '';
        doc.text(`Cor: ${cor}`, xPos + 1, yPosition + 8);
        xPos += nomeWidth;

        
        // Coluna CATEGORIA
        doc.setDrawColor(200, 200, 200);
        doc.rect(xPos, yPosition, categoriaWidth, rowHeight);
        doc.setFontSize(6);
        doc.setFont('', 'normal');
        const categoria = product.categoria || 'Produto de Corte';
        doc.text(categoria.substring(0, 15), xPos + 1, yPosition + 6);
        xPos += categoriaWidth;
        
        // Coluna CODIGO
        doc.rect(xPos, yPosition, codigoWidth, rowHeight);
        doc.setFontSize(6);
        const codigo = product.id ? product.id.toString().substring(0, 10) : '';
        doc.text(codigo, xPos + 1, yPosition + 6);
        xPos += codigoWidth;
        
        // Coluna PRECO
        doc.rect(xPos, yPosition, precoWidth, rowHeight);
        doc.setFontSize(6);
        doc.setFont('', 'bold');
        const precoVenda = (product as any).precoVenda as number | null | undefined;
        const preco = precoVenda != null ? precoVenda.toFixed(2) : '0.00';
        doc.text(`R$ ${preco}`, xPos + 1, yPosition + 6);
        xPos += precoWidth;
        
        // Coluna DESCONTO
        doc.rect(xPos, yPosition, descontoWidth, rowHeight);
        doc.setFontSize(6);
        doc.setFont('', 'normal');
        const descontoAtual = descontosMap[product.id] ?? pdfDescontoPercentual;
        doc.text(`${descontoAtual}% PIX`, xPos + 1, yPosition + 6);
        xPos += descontoWidth;
        
        // Coluna VALOR COM DESCONTO
        doc.rect(xPos, yPosition, valorDescontoWidth, rowHeight);
        doc.setFontSize(6);
        doc.setFont('', 'bold');
        const fatorDesconto = 1 - (descontoAtual / 100);
        const precoComDesconto = precoVenda != null ? (precoVenda * fatorDesconto).toFixed(2) : '0.00';
        doc.text(`R$ ${precoComDesconto}`, xPos + 1, yPosition + 6);
        xPos += valorDescontoWidth;
        
        // Coluna ESTOQUE
        doc.rect(xPos, yPosition, estoqueWidth, rowHeight);
        doc.setFontSize(6);
        doc.setFont('', 'normal');
        const estoque = product.estoqueDisponivel || 0;
        doc.text(estoque.toString(), xPos + 1, yPosition + 6);
        
        yPosition += rowHeight;
      }

      const pdfFileName = `catalogo-produtos-${new Date().getTime()}.pdf`;
      doc.save(pdfFileName);
      
      // Salvar histórico de PDF
      try {
        const produtosJson = JSON.stringify(
          selectedProducts.map(p => ({
            id: p.id,
            nome: p.nomeCompleto || p.nome,
            nomeAbreviado: p.nome,
            categoria: p.categoria,
            valorVenda: descontosMap[p.id] || p.precoVenda,
            estoque: p.estoqueDisponivel,
            cor: p.cor,
          }))
        );
        
        trpc.catalogoHistorico.salvar.useMutation().mutate({
          nome: pdfTitulo || `Catálogo ${new Date().toLocaleDateString('pt-BR')}`,
          produtosCount: selectedProducts.length,
          produtosJson: produtosJson,
          desconto: 0,
          pdfUrl: pdfFileName,
        });
      } catch (err) {
        console.error('Erro ao salvar histórico:', err);
      }
      
      toast.success(`PDF gerado com ${selectedProducts.length} produto(s)`);
      setSelectedProductsForPdf(new Set());
      saveSelecionadosPdf(new Set()); // Limpar localStorage após gerar PDF
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setGeneratingPdf(false);
    }
  }, [selectedProductsForPdf, produtosAcumulados, syncDate]);

  const shareWhatsApp = () => {
    try {
      const message = encodeURIComponent(
        `Olá! 🌸\n\nSegue em anexo a lista de flores disponíveis com preços e informações.\n\nTítulo: ${pdfTitulo}\nData: ${pdfDataEmissao}\nValidade: ${pdfValidade} dias\n\nAcesse nosso catálogo online para mais informações!`
      );
      
      window.open(`https://wa.me/?text=${message}`, '_blank');
      toast.success('Abrindo WhatsApp com mensagem padrão...');
    } catch (error) {
      console.error('Erro ao compartilhar no WhatsApp:', error);
      toast.error('Erro ao compartilhar no WhatsApp');
    }
  };

  const ocultarProduto = (id: number) => {
    setProdutosOcultos(prev => {
      const next = new Set(prev);
      next.add(id);
      saveOcultos(next);
      return next;
    });
  };
  const restaurarProduto = (id: number) => {
    setProdutosOcultos(prev => {
      const next = new Set(prev);
      next.delete(id);
      saveOcultos(next);
      return next;
    });
  };
  const restaurarTodos = () => {
    const empty = new Set<number>();
    saveOcultos(empty);
    setProdutosOcultos(empty);
  };

  // ── Estado de lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState("");

  // ── Estado de qtd por produto (id → qtd)
  const [qtdMap, setQtdMap] = useState<Record<number, number>>({});

  // ── Modal de adicionar ao pedido de compra
  const [modalPedido, setModalPedido] = useState<{ nome: string; qtd: number; preco: number } | null>(null);
  // ── Produto pendente para o painel lateral de orçamento
  const [produtoPainel, setProdutoPainel] = useState<{ nome: string; quantidade: number; precoUnitario: number } | null>(null);

  // ── Estado de upload de tabela de conversão
  const [uploadingConversao, setUploadingConversao] = useState(false);
  const [conversaoInfo, setConversaoInfo] = useState<{ count: number } | null>(null);
  const conversaoInfoQuery = trpc.veiling.getConversaoInfo.useQuery(undefined, { enabled: configOpen });
  const importarConversaoMut = trpc.veiling.importarConversao.useMutation({
    onSuccess: (data) => {
      setUploadingConversao(false);
      conversaoInfoQuery.refetch();
      toast.success(`✅ Tabela de conversão importada: ${data.total} registros`);
    },
    onError: (e) => {
      setUploadingConversao(false);
      toast.error("Erro ao importar tabela: " + e.message);
    },
  });

  // ── Ao abrir o Config, atualizar info da conversão
  useEffect(() => {
    if (conversaoInfoQuery.data) {
      setConversaoInfo(conversaoInfoQuery.data);
    }
  }, [conversaoInfoQuery.data]);

  // ── Queries
  const configQuery = trpc.veiling.getConfig.useQuery();
  const { data: produtosData, isLoading: loadingProdutos, isFetching } =
    trpc.veiling.listProdutos.useQuery({
      categoria: filtroCategoria || undefined,
      produtor: filtroProdutor || undefined,
      busca: filtroBusca || undefined,
      cores: filtroCores.length > 0 ? filtroCores : undefined,
      limit: PAGE_SIZE,
      offset: pagina * PAGE_SIZE,
    });
  const { data: categorias } = trpc.veiling.getCategorias.useQuery(undefined, {
    refetchInterval: 30000, // revalidar a cada 30s para pegar categorias após sync
    refetchOnWindowFocus: false,
  });
  const { data: produtores } = trpc.veiling.getProdutores.useQuery(
    { categoria: filtroCategoria || undefined },
    { refetchInterval: 30000, refetchOnWindowFocus: false }
  );
  const { data: coresDisponiveis } = trpc.veiling.getCores.useQuery(undefined, {
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
  });
  const { data: margens, refetch: refetchMargens } = trpc.veiling.listarMargens.useQuery();

  // ── Acumular produtos ao receber nova página e persistir no localStorage
  useEffect(() => {
    if (!produtosData) return;
    setTotalProdutos(produtosData.total);
    let novosAcumulados: any[];
    if (pagina === 0) {
      novosAcumulados = produtosData.items;
      setProdutosAcumulados(novosAcumulados);
    } else {
      setProdutosAcumulados(prev => {
        const ids = new Set(prev.map((p: any) => p.id));
        const novos = produtosData.items.filter((p: any) => !ids.has(p.id));
        novosAcumulados = [...prev, ...novos];
        return novosAcumulados;
      });
      novosAcumulados = [];
    }
    setCarregandoMais(false);
  }, [produtosData, pagina]);

  // ── Persistir no localStorage quando produtos mudam
  useEffect(() => {
    if (produtosAcumulados.length === 0) return;
    try {
      const cache = {
        produtos: produtosAcumulados,
        total: totalProdutos,
        filtroCategoria,
        filtroProdutor,
        filtroBusca,
        filtroCores,
        syncDate,
        savedAt: Date.now(),
      };
      localStorage.setItem(VEILING_CACHE_KEY, JSON.stringify(cache));
    } catch {}
  }, [produtosAcumulados, totalProdutos, filtroCategoria, filtroProdutor, filtroBusca, filtroCores, syncDate]);

  // ── Restaurar posição do scroll ao montar
  useEffect(() => {
    try {
      const cache = JSON.parse(localStorage.getItem(VEILING_CACHE_KEY) || "{}");
      if (cache.scrollTop && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = cache.scrollTop;
      }
    } catch {}
    return () => {
      try {
        const cache = JSON.parse(localStorage.getItem(VEILING_CACHE_KEY) || "{}");
        const updated = { ...cache, scrollTop: scrollContainerRef.current?.scrollTop || 0 };
        localStorage.setItem(VEILING_CACHE_KEY, JSON.stringify(updated));
      } catch {}
    };
  }, []);

  // ── Resetar ao trocar filtros
  const resetFiltro = useCallback(() => {
    setPagina(0);
    setProdutosAcumulados([]);
    setTotalProdutos(0);
    try { localStorage.removeItem(VEILING_CACHE_KEY); } catch {}
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  // ── IntersectionObserver para scroll infinito
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          !isFetching &&
          !carregandoMais &&
          produtosAcumulados.length < totalProdutos
        ) {
          setCarregandoMais(true);
          setPagina(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isFetching, carregandoMais, produtosAcumulados.length, totalProdutos]);

  // ── Calcular margem efetiva por categoria
  const getMargemEfetiva = useCallback((categoria: string): number => {
    if (margens) {
      const m = margens.find(m => m.categoria.toLowerCase() === categoria.toLowerCase());
      if (m) return Number(m.margem);
    }
    return cfgMargem;
  }, [margens, cfgMargem]);

  // ── Calcular custo base (menor preço disponível: carrinho < camada < embalagem)
  const getCusto = useCallback((p: { precoCarrinho?: string | number | null; precoCamada?: string | number | null; precoEmbalagem?: string | number | null }): number | null => {
    const vals = [p.precoCarrinho, p.precoCamada, p.precoEmbalagem]
      .map(v => v != null ? Number(v) : null)
      .filter((v): v is number => v !== null && v > 0);
    return vals.length > 0 ? Math.min(...vals) : null;
  }, []);

  // ── Mutations
  const utils = trpc.useUtils();

  // ── Quando o autoSync terminar, recarregar a lista automaticamente
  const prevUltimaSync = useRef<string | null>(null);
  useEffect(() => {
    if (!autoSyncStatus?.ultimaSync) return;
    const ultima = String(autoSyncStatus.ultimaSync);
    if (prevUltimaSync.current !== null && ultima !== prevUltimaSync.current) {
      // AutoSync terminou — limpar cache e recarregar do início
      // Preservar os produtos selecionados
      const selecionadosPreservados = loadSelecionadosPdf();
      setPagina(0);
      setProdutosAcumulados([]);
      utils.veiling.listProdutos.invalidate();
      utils.veiling.getCategorias.invalidate();
      utils.veiling.getProdutores.invalidate();
      utils.veiling.getCores.invalidate();
      configQuery.refetch();
      // Restaurar os produtos selecionados após a sincronização
      setTimeout(() => {
        setSelectedProductsForPdf(selecionadosPreservados);
      }, 1000);
    }
    prevUltimaSync.current = ultima;
  }, [autoSyncStatus?.ultimaSync, utils.veiling.listProdutos, utils.veiling.getCategorias, utils.veiling.getProdutores, utils.veiling.getCores, configQuery]);

  const saveConfigMut = trpc.veiling.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      configQuery.refetch();
    },
    onError: (e) => toast.error("Erro ao salvar configurações: " + e.message),
  });
  const sincronizarMut = trpc.veiling.sincronizar.useMutation({
    onSuccess: (data) => {
      // Se iniciado=true, a sincronização está rodando em background
      // O progresso chega via SSE; aguardar fase "concluido" para invalidar
      if ((data as any).iniciado) {
        toast.info("⏳ Sincronização iniciada em segundo plano...");
        return;
      }
      // Fallback para resposta síncrona (compatibilidade)
      resetFiltro();
      utils.veiling.listProdutos.invalidate();
      utils.veiling.getCategorias.invalidate();
      utils.catalogoUnificado.listProdutos.invalidate();
      utils.catalogoUnificado.listGrupos.invalidate();
      setTimeout(() => setSyncProgress(null), 4000);
      toast.success(`✅ Sincronização concluída! ${data.total} ofertas carregadas.`);
    },
    onError: (e) => {
      setSyncProgress({ phase: "erro", current: 0, total: 0, message: e.message });
      setTimeout(() => setSyncProgress(null), 5000);
      toast.error("Erro na sincronização: " + e.message);
    },
  });
  const salvarMargemMut = trpc.veiling.salvarMargem.useMutation({
    onSuccess: () => { refetchMargens(); setNovaCategoria(""); setNovaMargem(30); toast.success("Margem salva!"); },
    onError: (e) => toast.error("Erro ao salvar margem: " + e.message),
  });
  const deletarMargemMut = trpc.veiling.deletarMargem.useMutation({
    onSuccess: () => { refetchMargens(); toast.success("Margem removida."); },
    onError: (e) => toast.error("Erro ao remover margem: " + e.message),
  });
  const recategorizarMut = trpc.veiling.recategorizarProdutos.useMutation({
    onSuccess: (data) => {
      resetFiltro();
      utils.veiling.listProdutos.invalidate();
      utils.veiling.getCategorias.invalidate();
      toast.success(`✅ ${data.corrigidos} produto(s) recategorizados com sucesso!`);
    },
    onError: (e) => toast.error("Erro ao recategorizar: " + e.message),
  });

  // ── Preencher config quando carregar
  const syncDateInicializadoRef = useRef(false);
  useEffect(() => {
    if (configQuery.data) {
      setCfgUsuario(configQuery.data.usuario || "");
      setCfgSenha("");
      setCfgCustomerId(configQuery.data.customerId || "987");
      setCfgCustomerIdPedidos((configQuery.data as any).customerIdPedidos || "5191");
      setCfgMargem(Number(configQuery.data.margemGlobal) || 30);
      // Sincronizar dataCarregamento do banco (apenas na primeira carga)
      if (!syncDateInicializadoRef.current && configQuery.data.dataCarregamento) {
        setSyncDate(configQuery.data.dataCarregamento);
        syncDateInicializadoRef.current = true;
      }
    }
  }, [configQuery.data]);

  const setDataCarregamentoMut = trpc.veiling.setDataCarregamento.useMutation({
    onError: (e) => toast.error("Erro ao salvar data de carregamento: " + e.message),
  });

  // ── SSE para progresso
  const conectarSSE = useCallback((sessionId: string) => {
    if (sseRef.current) sseRef.current.close();
    const url = `/api/cooperflora/sync-stream?sessionId=${encodeURIComponent(sessionId)}`;
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try {
        const data: SyncProgress = JSON.parse(e.data);
        setSyncProgress(data);
        if (data.phase === "concluido") {
          // Sincronização concluída: invalidar dados e mostrar sucesso
          resetFiltro();
          utils.veiling.listProdutos.invalidate();
          utils.veiling.getCategorias.invalidate();
          utils.catalogoUnificado.listProdutos.invalidate();
          utils.catalogoUnificado.listGrupos.invalidate();
          utils.veiling.getHistoricoSync.invalidate();
          toast.success(`✅ ${data.message || 'Sincronização concluída!'}`);
          setTimeout(() => { setSyncProgress(null); es.close(); }, 3000);
        } else if (data.phase === "erro") {
          toast.error(`Erro na sincronização: ${data.message}`);
          setTimeout(() => { setSyncProgress(null); es.close(); }, 5000);
        }
      } catch {}
    };
    es.onerror = () => es.close();
    sseRef.current = es;
  }, [utils, resetFiltro]);

  // ── Handler para upload da tabela de conversão
  const handleUploadConversao = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingConversao(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result as ArrayBuffer;
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) { toast.error("Planilha vazia"); setUploadingConversao(false); return; }
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (rows.length < 2) { toast.error("Planilha sem dados"); setUploadingConversao(false); return; }
        // Detectar colunas: COD_ITEM, DESC_CURTA, DESC_LONGA, QUANTIDADE DE VENDA, FOTO
        const header = rows[0].map((h: any) => String(h).trim().toUpperCase());
        const idxCod = header.findIndex((h: string) => h.includes("COD_ITEM") || h.includes("COD ITEM"));
        const idxDesc = header.findIndex((h: string) => h.includes("DESC_CURTA") || h.includes("DESC CURTA"));
        const idxDescL = header.findIndex((h: string) => h.includes("DESC_LONGA") || h.includes("DESC LONGA"));
        const idxQtd = header.findIndex((h: string) => h.includes("QUANTIDADE") || h.includes("QTD") || h.includes("QTDE"));
        const idxFoto = header.findIndex((h: string) => h === "FOTO" || h.includes("FOTO") || h.includes("IMAGE") || h.includes("URL"));
        const idxQual = header.findIndex((h: string) => h.includes("QUAL") || h === "A1" || h === "A2");
        const idxObs = header.findIndex((h: string) => h.includes("OBSERVA") || h.includes("OBS"));
        const idxNumGfp = header.findIndex((h: string) => h.includes("GFP") || h.includes("NUM_GFP") || h.includes("NUM GFP"));
        const idxIcms = header.findIndex((h: string) => h === "ICMS" || h.includes("ICMS") || h.includes("ALIQ") || h.includes("ALÍQ"));
        if (idxCod < 0 || idxDesc < 0 || idxQtd < 0) {
          toast.error("Colunas não encontradas. Esperado: COD_ITEM, DESC_CURTA, QUANTIDADE DE VENDA");
          setUploadingConversao(false);
          return;
        }
        const parsed = rows.slice(1).map((row: any[]) => ({
          codItem: String(row[idxCod] ?? "").trim(),
          descCurta: String(row[idxDesc] ?? "").trim(),
          descLonga: idxDescL >= 0 ? String(row[idxDescL] ?? "").trim() : "",
          qtdVenda: Math.max(1, parseInt(String(row[idxQtd] ?? "1")) || 1),
          fotoUrl: idxFoto >= 0 ? (String(row[idxFoto] ?? "").trim() || null) : null,
          qualidade: idxQual >= 0 ? String(row[idxQual] ?? "").trim() : "",
          observacao: idxObs >= 0 ? (String(row[idxObs] ?? "").trim() || null) : null,
          numGfp: idxNumGfp >= 0 ? String(row[idxNumGfp] ?? "").trim() : "",
          icms: (() => {
            if (idxIcms < 0) return null;
            const raw = row[idxIcms];
            if (raw == null || raw === "") return null;
            // Aceita tanto decimal (0.82) quanto percentual (18 ou 18%)
            const str = String(raw).replace("%", "").trim();
            const num = parseFloat(str);
            if (isNaN(num)) return null;
            // Se valor >= 1, assume que é percentual (ex: 18 → 0.82 = 1 - 0.18)
            if (num >= 1) return Math.round((1 - num / 100) * 10000) / 10000;
            // Se valor < 1, assume que já é o fator (ex: 0.82)
            return num;
          })(),
        })).filter(r => r.codItem && r.descCurta);
        if (parsed.length === 0) { toast.error("Nenhum registro válido encontrado"); setUploadingConversao(false); return; }
        importarConversaoMut.mutate({ rows: parsed });
      } catch (err: any) {
        toast.error("Erro ao ler arquivo: " + (err?.message || "erro desconhecido"));
        setUploadingConversao(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }, [importarConversaoMut]);

  const handleSincronizar = useCallback(() => {
    const sessionId = `veiling-${Date.now()}`;
    conectarSSE(sessionId);
    setSyncProgress({ phase: "produtos", current: 0, total: 1, message: "Iniciando sincronização..." });
    sincronizarMut.mutate({ sessionId });
  }, [conectarSSE, sincronizarMut]);

  // Auto-sync agora é gerenciado pelo servidor (autoSync.ts)

  // ── Helpers de data
  const parsedDate = (() => {
    try { const d = parse(syncDate, "dd/MM/yyyy", new Date()); return isValid(d) ? d : new Date(); }
    catch { return new Date(); }
  })();

  // ── Progresso visual
  const progressPercent = syncProgress
    ? syncProgress.total > 0 ? Math.round((syncProgress.current / syncProgress.total) * 100) : 0
    : 0;
  const isSync = syncProgress && syncProgress.phase !== "concluido" && syncProgress.phase !== "erro";
  const syncDone = syncProgress?.phase === "concluido";
  const syncError = syncProgress?.phase === "erro";

  // ── Última atualização
  const ultimaAt = configQuery.data?.ultimaAtualizacao
    ? new Date(configQuery.data.ultimaAtualizacao).toLocaleString("pt-BR")
    : "Nunca";

  const temMais = produtosAcumulados.length < totalProdutos;

  // ── Exportar Excel
  const exportarExcel = useCallback(() => {
    if (produtosAcumulados.length === 0) { toast.error("Nenhum produto carregado para exportar."); return; }
    const linhas = produtosAcumulados.map((p: any) => ({
      "Nome": p.nome || "",
      "Nome Completo": p.nomeCompleto || "",
      "Cor": p.cor || "",
      "Categoria": p.categoria || "",
      "Produtor": p.produtor || "",
      "Qualidade": p.qualidade || "",
      "Status": (() => {
        const s = (p as any).statusProduto;
        if (s === 'LKP_RECEPCIONADO') return 'RECEPCIONADO LKP';
        if (s === 'ENP') return 'ESTQ NO PROD. ENP';
        if (s === 'LKP_SITIO') return 'NO SITIO LKP';
        return s || '';
      })(),
      "Embalagem": p.embalagem || "",
      "Dimensão": p.dimensao || "",
      "Custo (R$)": p.custoFinal != null ? Number(p.custoFinal).toFixed(2) : "",
      "Frete/Un (R$)": p.freteUnit != null ? Number(p.freteUnit).toFixed(2) : "",
      "ICMS/Un (R$)": p.valorIcmsUnit != null ? Number(p.valorIcmsUnit).toFixed(2) : "",
      "Preço Venda (R$)": p.precoVenda != null ? Number(p.precoVenda).toFixed(2) : "",
      "Margem (%)": p.margem != null ? Number(p.margem).toFixed(1) : "",
      "Estoque": p.estoqueDisponivel ?? "",
      "Qtd Venda (pct)": (p as any).qtdVenda || p.multiplo || 1,
      "Preço Carrinho": p.precoCarrinho != null ? Number(p.precoCarrinho).toFixed(2) : "",
      "Preço Camada": p.precoCamada != null ? Number(p.precoCamada).toFixed(2) : "",
      "Preço Embalagem": p.precoEmbalagem != null ? Number(p.precoEmbalagem).toFixed(2) : "",
      "Tipo Oferta": p.tipoOferta || "",
      "Data Validade": p.dataValidade || "",
    }));
    const ws = XLSX.utils.json_to_sheet(linhas);
    // Ajustar largura das colunas
    const cols = Object.keys(linhas[0] || {});
    ws['!cols'] = cols.map(k => ({ wch: Math.max(k.length, 12) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catálogo Veiling");
    const filtros = [filtroCategoria, filtroProdutor, filtroCores.join(","), filtroBusca].filter(Boolean).join("_") || "todos";
    const fileName = `catalogo_veiling_${filtros}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`✅ ${linhas.length} produtos exportados para Excel!`);
  }, [produtosAcumulados, filtroCategoria, filtroProdutor, filtroCores, filtroBusca]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <Package className="h-5 w-5 text-orange-500 shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-sm leading-tight">Catálogo Veiling</div>
            <div className="text-xs text-muted-foreground leading-tight">
              Última atualização: {ultimaAt}
            </div>
          </div>
        </div>
        <div className="flex-1" />
        {/* Data */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span className="hidden sm:inline">Data carreg.:</span>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs font-normal min-w-[110px]">
                <CalendarIcon className="h-3.5 w-3.5" />
                {syncDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={parsedDate}
                onSelect={(d) => {
                  if (d) {
                    const novaData = format(d, "dd/MM/yyyy");
                    setSyncDate(novaData);
                    setDataCarregamentoMut.mutate({ dataCarregamento: novaData });
                  }
                  setCalendarOpen(false);
                }}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        {/* Botões */}
        <Button
          size="sm"
          className="h-8 gap-1 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleSincronizar}
          disabled={sincronizarMut.isPending}
        >
          {sincronizarMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Atualizar Agora
        </Button>
        {/* Indicador de auto-sync do servidor */}
        {autoSyncStatus && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground border rounded px-2 h-8">
            <RefreshCw className="h-3 w-3 text-green-500" />
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
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => setShowLinkGenerator(!showLinkGenerator)}
          title="Gerar link para envio aos clientes"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Link
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => {
            // Usar produtosAcumulados que contém TODOS os produtos carregados, não apenas da página atual
            const produtos = produtosAcumulados.filter(p => selectedProductsForPdf.has(p.id));
            if (produtos.length === 0) {
              toast.error('Nenhum produto selecionado');
              return;
            }
            console.log(`[PDF] Abrindo modal com ${produtos.length} produtos de ${selectedProductsForPdf.size} selecionados`);
            setProdutosParaConferencia(produtos);
            setShowConferenciaModal(true);
          }}
          disabled={selectedProductsForPdf.size === 0 || generatingPdf}
          title="Gerar PDF com produtos selecionados"
        >
          {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          PDF ({selectedProductsForPdf.size})
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => setConfigOpen(true)}
        >
          <Settings className="h-3.5 w-3.5" />
          Config
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Barra de progresso */}
      {syncProgress && (
        <div className={`px-4 py-2 border-b text-xs flex items-center gap-3 ${
          syncDone ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400" :
          syncError ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400" :
          "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
        }`}>
          {isSync && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
          {syncDone && <span>✓</span>}
          {syncError && <span>⚠</span>}
          <span className="flex-1 truncate">{syncProgress.message}</span>
          {syncProgress.total > 0 && (
            <span className="shrink-0 tabular-nums">{syncProgress.current}/{syncProgress.total}</span>
          )}
          <div className="w-32 shrink-0">
            <Progress
              value={syncDone ? 100 : progressPercent}
              className={`h-1.5 ${syncDone ? "[&>div]:bg-green-500" : syncError ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-500"}`}
            />
          </div>
        </div>
      )}

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b bg-muted/30">
        {/* Busca */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-8 pl-8 pr-8 text-xs"
            placeholder="Buscar por nome completo ou abreviado..."
            value={buscaInput}
            onChange={(e) => {
              const v = e.target.value;
              setBuscaInput(v);
              // Debounce: dispara busca 400ms após parar de digitar
              clearTimeout((window as any).__veilingBuscaTimer);
              (window as any).__veilingBuscaTimer = setTimeout(() => {
                setFiltroBusca(v);
                resetFiltro();
              }, 400);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                clearTimeout((window as any).__veilingBuscaTimer);
                setFiltroBusca(buscaInput);
                resetFiltro();
              }
            }}
          />
          {buscaInput && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => {
              setBuscaInput("");
              setFiltroBusca("");
              resetFiltro();
            }}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        {/* Filtro por categoria */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            className={`px-2 py-1 rounded text-xs border transition-colors ${
              filtroCategoria === "" ? "bg-orange-500 text-white border-orange-500" : "bg-background hover:bg-muted border-border"
            }`}
            onClick={() => { setFiltroCategoria(""); setFiltroProdutor(""); resetFiltro(); }}
          >
            Todas
          </button>
          {["Produto de Corte", "Flor Envasada", "Planta Ornamental", "Produto Decorado"].map((cat: any) => (
            <button
              key={cat}
              className={`px-2 py-1 rounded text-xs border transition-colors ${filtroCategoria === cat ? "bg-orange-500 text-white border-orange-500" : "bg-background hover:bg-muted border-border"}`}
              onClick={() => { setFiltroCategoria(cat); setFiltroProdutor(""); resetFiltro(); }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative">
          <select
            className="h-8 rounded border border-border bg-background text-xs px-2 pr-7 appearance-none cursor-pointer hover:bg-muted transition-colors min-w-[160px] max-w-[240px]"
            value={filtroProdutor}
            onChange={(e) => { setFiltroProdutor(e.target.value); resetFiltro(); }}
            disabled={((produtores as any) ?? []).length === 0}
          >
            <option value="">Todos os produtores</option>
            {((produtores as any) ?? []).map((p: any) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
        {/* Filtro por cor — dropdown colapsável */}
        <ColorFilterDropdown
          cores={(coresDisponiveis as any) ?? []}
          filtroCores={filtroCores}
          onFilterChange={(novasCores) => {
            setFiltroCores(novasCores);
            resetFiltro();
          }}
          corEmoji={COR_EMOJI}
        />
        {/* Indicador de sync em andamento: só aparece durante sync MANUAL (botão Atualizar Agora)
             O auto-sync de fundo (˜3min) não deve interromper a experiência do usuário */}
        {isSync && ((categorias as any) ?? []).length === 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            <span>Sincronizando… filtros serão carregados em breve</span>
          </div>
        )}
        {isSync && ((categorias as any) ?? []).length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            <span>Atualizando catálogo…</span>
          </div>
        )}
        {/* Indicador de produtos ocultos */}
        {produtosOcultos.size > 0 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMostrarOcultos(v => !v)}
              className={`flex items-center gap-1 h-8 px-2.5 rounded border text-xs transition-colors font-medium ${
                mostrarOcultos
                  ? "border-amber-400 bg-amber-100 text-amber-700"
                  : "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
              }`}
              title={mostrarOcultos ? "Ocultar produtos excluídos" : "Mostrar produtos excluídos"}
            >
              {mostrarOcultos ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {produtosOcultos.size} oculto{produtosOcultos.size !== 1 ? "s" : ""}
            </button>
            <button
              onClick={restaurarTodos}
              className="flex items-center gap-1 h-8 px-2 rounded border border-red-300 bg-red-50 hover:bg-red-100 text-red-600 text-xs transition-colors"
              title="Restaurar todos os produtos ocultos"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {/* Botão Exportar Excel */}
        <button
          onClick={exportarExcel}
          className="flex items-center gap-1 h-8 px-2.5 rounded border border-green-300 bg-green-50 hover:bg-green-100 text-green-700 text-xs transition-colors font-medium"
          title="Exportar produtos visíveis para Excel (.xlsx)"
        >
          <FileDown className="h-3.5 w-3.5" />
          Excel
        </button>
        {/* Seletor de colunas visíveis */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 h-8 px-2.5 rounded border border-border bg-background hover:bg-muted text-xs transition-colors">
              <Eye className="h-3.5 w-3.5" />
              Colunas
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs">Colunas visíveis</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={colunasVisiveis.foto} onCheckedChange={() => toggleColuna("foto")}>Foto</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={colunasVisiveis.qualidade} onCheckedChange={() => toggleColuna("qualidade")}>Qualidade</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={colunasVisiveis.statusProduto} onCheckedChange={() => toggleColuna("statusProduto")}>Status</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={colunasVisiveis.categoria} onCheckedChange={() => toggleColuna("categoria")}>Categoria</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={colunasVisiveis.produtor} onCheckedChange={() => toggleColuna("produtor")}>Produtor</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={colunasVisiveis.freteUn} onCheckedChange={() => toggleColuna("freteUn")}><span className="text-blue-600">Frete/Un</span></DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={colunasVisiveis.icmsUn} onCheckedChange={() => toggleColuna("icmsUn")}><span className="text-red-500">ICMS/Un</span></DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={colunasVisiveis.estoque} onCheckedChange={() => toggleColuna("estoque")}>Estoque</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={colunasVisiveis.qtd} onCheckedChange={() => toggleColuna("qtd")}>Qtd</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={colunasVisiveis.indicadoresCusto} onCheckedChange={() => toggleColuna("indicadoresCusto")}>
              <span className="text-muted-foreground">+frete +ICMS no Custo</span>
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="ml-auto text-xs text-muted-foreground">
          {produtosAcumulados.length > 0 && totalProdutos > 0
            ? `${produtosAcumulados.length} de ${totalProdutos} ofertas`
            : `${totalProdutos} ofertas`}
        </div>
      </div>

      {/* Tabela de produtos com scroll infinito */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        {loadingProdutos && pagina === 0 ? (
          <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando...
          </div>
        ) : produtosAcumulados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <Package className="h-8 w-8 opacity-30" />
            <p className="text-sm">Nenhuma oferta encontrada.</p>
            {!configQuery.data?.usuario && (
              <Button size="sm" variant="outline" onClick={() => setConfigOpen(true)}>
                Configurar acesso ao Veiling
              </Button>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                <tr className="border-b">
                  <th className="px-2 py-2 text-center font-medium w-8">✓</th>
                  {colunasVisiveis.foto && <th className="px-2 py-2 text-left font-medium w-12">Foto</th>}
                  <th className="px-2 py-2 text-left font-medium">Produto</th>
                  {colunasVisiveis.qualidade && <th className="px-2 py-2 text-center font-medium w-16">Qualidade</th>}
                  {colunasVisiveis.statusProduto && <th className="px-2 py-2 text-left font-medium">Status</th>}
                  {colunasVisiveis.categoria && <th className="px-2 py-2 text-left font-medium">Categoria</th>}
                  {colunasVisiveis.produtor && <th className="px-2 py-2 text-left font-medium">Produtor</th>}
                  <th className="px-2 py-2 text-right font-medium">Custo/Pct</th>
                  {colunasVisiveis.freteUn && <th className="px-2 py-2 text-right font-medium text-blue-600 dark:text-blue-400" title="Frete por unidade">Frete/Un</th>}
                  {colunasVisiveis.icmsUn && <th className="px-2 py-2 text-right font-medium text-red-500 dark:text-red-400" title="Valor do ICMS embutido no custo">ICMS/Un</th>}
                  <th className="px-2 py-2 text-right font-medium text-orange-600 dark:text-orange-400">Venda/Pct</th>
                  {colunasVisiveis.estoque && <th className="px-2 py-2 text-right font-medium">Estoque</th>}
                  {colunasVisiveis.qtd && <th className="px-2 py-2 text-center font-medium w-20">Qtd</th>}
                  <th className="px-2 py-2 text-center font-medium w-16">ADD</th>
                </tr>
              </thead>
              <tbody>
                {produtosAcumulados.filter(p => mostrarOcultos || !produtosOcultos.has(p.id)).map((p, i) => {
                  const qtdVenda: number = (p.qtdVenda && p.qtdVenda > 0) ? p.qtdVenda : 1;
                  // Usar custoFinal do servidor (já inclui frete + ICMS) se disponível
                  const custoFinalServidor = (p as any).custoFinal as number | null | undefined;
                  const custoBase = getCusto(p);
                  const custoUnitario = (custoFinalServidor != null && custoFinalServidor > 0) ? custoFinalServidor : custoBase;
                  // Preço do pacote = custo unitário (com frete+ICMS) × qtdVenda
                  const custoPacote = custoUnitario != null ? custoUnitario * qtdVenda : null;
                  const margem = getMargemEfetiva(p.categoria);
                  // Usar precoVenda do servidor se disponível (já calculado com frete+ICMS+margem)
                  const precoVendaServidor = (p as any).precoVenda as number | null | undefined;
                  const vendaPacote = (precoVendaServidor != null && precoVendaServidor > 0) ? precoVendaServidor : (custoPacote != null ? custoPacote * (1 + margem / 100) : null);
                  // Frete e ICMS por unidade (do servidor)
                  const freteUnit = ((p as any).freteUnit as number) || 0;
                  const valorIcmsUnit = ((p as any).valorIcmsUnit as number) || 0;
                  // Estoque em pacotes = estoque total ÷ qtdVenda
                  const estoquePacotes = qtdVenda > 1 ? Math.floor(p.estoqueDisponivel / qtdVenda) : p.estoqueDisponivel;
                  const qtdAtual = qtdMap[p.id] ?? 1;
                  return (
                    <tr key={p.id} className={`border-b hover:bg-orange-50/40 dark:hover:bg-orange-950/10 transition-colors ${produtosOcultos.has(p.id) ? "opacity-40 bg-red-50/30 dark:bg-red-950/10" : i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProductsForPdf.has(p.id)}
                          onChange={() => toggleProductForPdf(p.id)}
                          className="w-4 h-4 cursor-pointer"
                          title="Selecionar para gerar PDF"
                        />
                      </td>
                      {colunasVisiveis.foto && <td className="px-2 py-1.5">
                        {(() => {
                          // Usar proxy /api/veiling/foto para URLs HTTP (evita mixed-content em HTTPS)
                          const rawFoto = (p as any).fotoConversao as string | null;
                          const fotoSrc = rawFoto
                            ? (rawFoto.startsWith('http://') ? `/api/veiling/foto?url=${encodeURIComponent(rawFoto)}` : rawFoto)
                            : (p.offerId ? `/api/veiling/image?offerId=${p.offerId}` : null);
                          const lightboxSrc = fotoSrc;
                          return fotoSrc ? (
                            <button type="button"
                              onClick={() => { setLightboxUrl(lightboxSrc!); setLightboxAlt(p.nomeCompleto); }}
                              className="group relative w-10 h-10 rounded border overflow-hidden focus:outline-none cursor-zoom-in">
                              <img src={fotoSrc} alt={p.nome}
                                className="w-10 h-10 object-cover transition-transform group-hover:scale-110"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  // Fallback para proxy offerId se a URL da conversão falhar
                                  if (p.offerId && !img.src.includes('/api/veiling/image')) {
                                    img.src = `/api/veiling/image?offerId=${p.offerId}`;
                                  } else {
                                    img.style.display = 'none';
                                  }
                                }} />
                              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ZoomIn size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                            </button>
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
                              <Package size={16} className="text-muted-foreground/30" />
                            </div>
                          );
                        })()}
                      </td>}
                      <td className="px-2 py-1.5">
                        <div className="font-medium leading-tight text-foreground">{p.nomeCompleto || p.nome}</div>
                        {p.nomeCompleto && p.nomeCompleto !== p.nome && (
                          <div className="text-muted-foreground text-[10px] leading-tight truncate max-w-[200px]">{p.nome}</div>
                        )}
                        {qtdVenda > 1 && (
                          <div className="text-[10px] text-orange-500 font-medium">Pct: {qtdVenda} un</div>
                        )}
                      </td>
                      {colunasVisiveis.qualidade && <td className="px-2 py-1.5 text-center">
                        {/* Qualidade + GFP */}
                        {(() => {
                          // Prioridade: dados GFP da API do Veiling (sincronizados diretamente)
                          const gfpQual = (p as any).gfpQualidade as string || '';
                          const gfpNum = (p as any).gfpNumero as string || '';
                          const gfpObs1 = (p as any).gfpObs1 as string | null;
                          const gfpObs2 = (p as any).gfpObs2 as string | null;
                          const gfpEntrega = (p as any).gfpEntregaCvh as string || '';
                          const gfpSerie = (p as any).gfpSerie as string || '';
                          const gfpLote = (p as any).gfpLote as string || '';
                          // Fallback: qualidade principal do produto
                          const qualDisplay = gfpQual || p.qualidade || '';
                          const hasGfpData = gfpNum || gfpObs1 || gfpObs2 || gfpEntrega;
                          // Montar texto de observações concatenando obs1 e obs2
                          const obsTexto = [gfpObs1, gfpObs2].filter(Boolean).join('; ');
                          return (
                            <div className="flex items-center justify-center gap-1">
                              {qualDisplay ? (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  qualDisplay === 'A1' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                                  qualDisplay === 'A2' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                                  'bg-muted text-muted-foreground'
                                }`}>{qualDisplay}</span>
                              ) : (
                                <span className="text-muted-foreground text-[10px]">—</span>
                              )}
                              {hasGfpData && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                                    title="Dados da GFP"
                                    onMouseEnter={(e) => {
                                      e.stopPropagation();
                                      const el = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (el) el.style.display = 'block';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.stopPropagation();
                                      const el = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (el) el.style.display = 'none';
                                    }}
                                  >
                                    <AlertCircle size={14} />
                                  </button>
                                  <div
                                    className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-1 bg-popover text-popover-foreground border rounded-lg shadow-xl p-3 text-xs hidden"
                                    style={{ minWidth: '240px', maxWidth: '300px' }}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseEnter={(e) => {
                                      e.stopPropagation();
                                      (e.currentTarget as HTMLElement).style.display = 'block';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.stopPropagation();
                                      (e.currentTarget as HTMLElement).style.display = 'none';
                                    }}
                                  >
                                    <div className="font-semibold text-sm mb-2 flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                      <AlertCircle size={14} />
                                      Dados da GFP
                                    </div>
                                    {/* Qualidade */}
                                    <div className="flex justify-between items-center py-1 border-b border-border/40">
                                      <span className="text-muted-foreground flex items-center gap-1">🏆 Qualidade:</span>
                                      <span className={`font-bold ${
                                        qualDisplay === 'A1' ? 'text-green-600 dark:text-green-400' :
                                        qualDisplay === 'A2' ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground'
                                      }`}>{qualDisplay || '—'}</span>
                                    </div>
                                    {/* Entrega CVH */}
                                    {gfpEntrega && (
                                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                                        <span className="text-muted-foreground flex items-center gap-1">📦 Entrega CVH:</span>
                                        <span className="font-medium">{gfpEntrega}</span>
                                      </div>
                                    )}
                                    {/* Número GFP */}
                                    {gfpNum && (
                                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                                        <span className="text-muted-foreground">Nº GFP:</span>
                                        <span className="font-medium">{gfpNum}</span>
                                      </div>
                                    )}
                                    {/* Série */}
                                    {gfpSerie && (
                                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                                        <span className="text-muted-foreground">Série:</span>
                                        <span className="font-medium">{gfpSerie}</span>
                                      </div>
                                    )}
                                    {/* Lote */}
                                    {gfpLote && (
                                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                                        <span className="text-muted-foreground">Lote:</span>
                                        <span className="font-medium">{gfpLote}</span>
                                      </div>
                                    )}
                                    {/* Observações da GFP */}
                                    {obsTexto && (
                                      <div className="pt-1.5">
                                        <span className="text-muted-foreground block mb-1 font-medium">Observações da GFP:</span>
                                        <span className="text-foreground leading-snug">{obsTexto}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>}
                      {colunasVisiveis.statusProduto && <td className="px-2 py-1.5">
                        <StatusVeilingBadge status={(p as any).statusProduto} />
                      </td>}
                      {colunasVisiveis.categoria && <td className="px-2 py-1.5">
                        <Badge variant="outline" className="text-[10px] py-0">{p.categoria}</Badge>
                      </td>}
                      {colunasVisiveis.produtor && <td className="px-2 py-1.5 text-muted-foreground truncate max-w-[140px]">{p.produtor}</td>}
                      <td className="px-2 py-1.5 text-right text-muted-foreground">
                        <div>{custoPacote != null ? `R$ ${custoPacote.toFixed(2)}` : "—"}</div>
                        {colunasVisiveis.indicadoresCusto && (freteUnit > 0 || valorIcmsUnit > 0) && (
                          <div className="text-[9px] text-muted-foreground/60 leading-tight">
                            {freteUnit > 0 && <span className="text-blue-500">+frete</span>}
                            {freteUnit > 0 && valorIcmsUnit > 0 && " "}
                            {valorIcmsUnit > 0 && <span className="text-red-500">+ICMS</span>}
                          </div>
                        )}
                      </td>
                      {colunasVisiveis.freteUn && <td className="px-2 py-1.5 text-right">
                        {freteUnit > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">R$ {freteUnit.toFixed(2)}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>}
                      {colunasVisiveis.icmsUn && <td className="px-2 py-1.5 text-right">
                        {valorIcmsUnit > 0 ? (
                          <span className="text-red-500 dark:text-red-400 font-medium">R$ {valorIcmsUnit.toFixed(2)}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>}
                      <td className="px-2 py-1.5 text-right font-semibold text-orange-600 dark:text-orange-400">
                        <div className="flex items-baseline justify-end gap-2 flex-wrap">
                          <span>{vendaPacote != null ? `R$ ${vendaPacote.toFixed(2)}` : "—"}</span>
                          {vendaPacote != null && qtdVenda > 1 && (
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-normal border-l border-gray-300 dark:border-gray-600 pl-2">
                              Cada: R$ {(vendaPacote / qtdVenda).toFixed(6)}
                            </span>
                          )}
                        </div>
                      </td>
                      {colunasVisiveis.estoque && <td className="px-2 py-1.5 text-right">
                        <span className={`font-medium ${estoquePacotes > 10 ? "text-green-600 dark:text-green-400" : estoquePacotes > 0 ? "text-amber-600" : "text-red-500"}`}>
                          {estoquePacotes > 0 ? `${estoquePacotes} pct` : "—"}
                        </span>
                      </td>}
                      {colunasVisiveis.qtd && <td className="px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            type="button"
                            className="w-5 h-5 rounded border bg-background hover:bg-muted flex items-center justify-center"
                            onClick={() => setQtdMap(prev => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] ?? 1) - 1) }))}
                          ><Minus size={10} /></button>
                          <input
                            type="number"
                            min={1}
                            value={qtdAtual}
                            onChange={e => setQtdMap(prev => ({ ...prev, [p.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                            className="w-10 h-5 text-center text-xs border rounded bg-background"
                          />
                          <button
                            type="button"
                            className="w-5 h-5 rounded border bg-background hover:bg-muted flex items-center justify-center"
                            onClick={() => setQtdMap(prev => ({ ...prev, [p.id]: (prev[p.id] ?? 1) + 1 }))}
                          ><Plus size={10} /></button>
                        </div>
                      </td>}
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex items-center gap-1 justify-center">
                          {/* Botão modal tradicional */}
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white gap-1 px-2"
                            title="Adicionar ao Orçamento (modal)"
                            onClick={() => {
                              const nome = p.nomeCompleto || p.nome || "Produto Veiling";
                              const preco = vendaPacote ?? 0;
                              setModalPedido({ nome, qtd: qtdAtual, preco });
                            }}
                          >
                            <ShoppingCart size={12} />
                          </Button>
                          {/* Botão painel lateral */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-orange-400 text-orange-600 hover:bg-orange-50 gap-1 px-2"
                            title="Adicionar ao painel de orçamento"
                            onClick={() => {
                              const nome = p.nomeCompleto || p.nome || "Produto Veiling";
                              const preco = vendaPacote ?? 0;
                              setProdutoPainel({ nome, quantidade: qtdAtual, precoUnitario: preco });
                            }}
                          >
                            <Plus size={12} />
                          </Button>
                          {/* Botão ocultar/restaurar produto */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 w-7 p-0 ${produtosOcultos.has(p.id) ? "text-green-600 hover:text-green-700" : "text-red-400 hover:text-red-600"}`}
                            title={produtosOcultos.has(p.id) ? "Restaurar produto" : "Ocultar produto do catálogo"}
                            onClick={() => produtosOcultos.has(p.id) ? restaurarProduto(p.id) : ocultarProduto(p.id)}
                          >
                            {produtosOcultos.has(p.id) ? <Eye size={12} /> : <EyeOff size={12} />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Sentinel para IntersectionObserver */}
            <div ref={sentinelRef} className="h-4" />

            {/* Indicador de carregamento */}
            {(carregandoMais || isFetching) && temMais && (
              <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground text-xs">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando mais produtos...
              </div>
            )}

            {/* Fim da lista */}
            {!temMais && produtosAcumulados.length > 0 && (
              <div className="text-center py-4 text-xs text-muted-foreground">
                ✓ Todos os {totalProdutos} produtos carregados
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Configuração */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> Configurações — Catálogo Veiling
            </DialogTitle>
          </DialogHeader>
          {/* Abas */}
          <div className="flex gap-1 border-b mb-4">
            {(["geral", "margens", "conversao", "importacao", "historico"] as const).map((tab) => (
              <button
                key={tab}
                className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${configTab === tab ? "border-orange-500 text-orange-600" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                onClick={() => setConfigTab(tab)}
              >
                {tab === "geral" ? "Geral" : tab === "margens" ? "Margens" : tab === "conversao" ? "Tabela de Conversão" : tab === "importacao" ? "Importar Pedidos" : "Histórico"}
              </button>
            ))}
          </div>

          {configTab === "geral" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">E-mail / CPF</label>
                <Input className="h-8 text-xs" value={cfgUsuario} onChange={e => setCfgUsuario(e.target.value)} placeholder="guilherme@gardenprimavera.com" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Senha</label>
                <div className="relative">
                  <Input
                    className="h-8 text-xs pr-8"
                    type={senhaVisivel ? "text" : "password"}
                    value={cfgSenha}
                    onChange={e => setCfgSenha(e.target.value)}
                    placeholder="••••••"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSenhaVisivel(!senhaVisivel)}>
                    {senhaVisivel ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Customer ID (Catálogo)</label>
                <Input className="h-8 text-xs" value={cfgCustomerId} onChange={e => setCfgCustomerId(e.target.value)} placeholder="987" />
                <p className="text-xs text-muted-foreground mt-0.5">Usado para sincronizar ofertas/catálogo</p>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Customer ID (Pedidos)</label>
                <Input className="h-8 text-xs" value={cfgCustomerIdPedidos} onChange={e => setCfgCustomerIdPedidos(e.target.value)} placeholder="5191" />
                <p className="text-xs text-muted-foreground mt-0.5">Usado para importar pedidos do dia</p>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Margem Global (%)</label>
                <Input className="h-8 text-xs w-28" type="number" value={cfgMargem} onChange={e => setCfgMargem(Number(e.target.value))} min={0} max={200} step={0.5} />
              </div>
              <div className="pt-1 border-t">
                <p className="text-xs text-muted-foreground mb-2">Se produtos aparecerem sem categoria após sincronização, use o botão abaixo para corrigir.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs w-full"
                  onClick={() => recategorizarMut.mutate()}
                  disabled={recategorizarMut.isPending}
                >
                  {recategorizarMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  Corrigir Categorias
                </Button>
              </div>
            </div>
          )}

          {configTab === "margens" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Defina margens específicas por categoria. Sobrepõem a margem global.
              </p>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Categoria</th>
                      <th className="px-3 py-2 text-right font-medium">Margem (%)</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(margens ?? []).map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="px-3 py-2">{m.categoria}</td>
                        <td className="px-3 py-2 text-right font-medium">{Number(m.margem).toFixed(1)}%</td>
                        <td className="px-3 py-2">
                          <button onClick={() => deletarMargemMut.mutate({ id: m.id })}>
                            <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(margens ?? []).length === 0 && (
                      <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">Nenhuma margem configurada</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium mb-1 block">Categoria</label>
                  <Input
                    className="h-8 text-xs"
                    list="veiling-categorias-list"
                    value={novaCategoria}
                    onChange={e => setNovaCategoria(e.target.value)}
                    placeholder="Ex: Produto de Corte"
                  />
                  <datalist id="veiling-categorias-list">
                    <option value="Produto de Corte" />
                    <option value="Flor Envasada" />
                    <option value="Planta Ornamental" />
                    <option value="Produto Decorado" />
                    {((categorias as any) ?? []).filter((c: any) => !["Produto de Corte","Flor Envasada","Planta Ornamental","Produto Decorado"].includes(c)).map((c: any) => <option key={c} value={c} />)}
                  </datalist>
                </div>
                <div className="w-24">
                  <label className="text-xs font-medium mb-1 block">Margem %</label>
                  <Input className="h-8 text-xs" type="number" value={novaMargem} onChange={e => setNovaMargem(Number(e.target.value))} min={0} max={500} step={0.5} />
                </div>
                <Button
                  size="sm"
                  className="h-8 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => { if (novaCategoria) salvarMargemMut.mutate({ categoria: novaCategoria, margem: novaMargem }); }}
                  disabled={!novaCategoria || salvarMargemMut.isPending}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {configTab === "conversao" && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/40 rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <FileSpreadsheet className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-medium">Tabela de Conversão Atual</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {conversaoInfoQuery.isLoading ? "Carregando..." :
                    conversaoInfo ? `${conversaoInfo.count.toLocaleString("pt-BR")} registros importados` :
                    "Nenhuma tabela importada"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-3">
                  Importe a planilha <strong>tabelaimportaçãosite.xlsx</strong> para atualizar a tabela de conversão unidade→pacote.
                  Colunas esperadas: <code className="bg-muted px-1 rounded">COD_ITEM</code>, <code className="bg-muted px-1 rounded">DESC_CURTA</code>, <code className="bg-muted px-1 rounded">QUANTIDADE DE VENDA</code>.
                </p>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-orange-300 rounded-lg p-6 cursor-pointer hover:bg-orange-50/30 transition-colors">
                  {uploadingConversao ? (
                    <><Loader2 className="h-6 w-6 animate-spin text-orange-500" /><span className="text-xs text-muted-foreground">Importando...</span></>
                  ) : (
                    <><Upload className="h-6 w-6 text-orange-400" /><span className="text-sm font-medium text-orange-600">Clique para selecionar arquivo</span><span className="text-xs text-muted-foreground">.xlsx ou .xls</span></>
                  )}
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    disabled={uploadingConversao}
                    onChange={handleUploadConversao}
                  />
                </label>
              </div>
            </div>
          )}

          {configTab === "importacao" && (
            <ImportarPedidosVeiling />
          )}
          {configTab === "historico" && (
            <HistoricoSyncVeiling />
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfigOpen(false)}>Fechar</Button>
            {configTab === "geral" && (
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => saveConfigMut.mutate({ usuario: cfgUsuario, senha: cfgSenha, customerId: cfgCustomerId, customerIdPedidos: cfgCustomerIdPedidos, margemGlobal: cfgMargem })}
                disabled={saveConfigMut.isPending || !cfgUsuario}
              >
                {saveConfigMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Salvar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar ao Orçamento (modal tradicional) */}
      {modalPedido && (
        <ModalAdicionarPedidoCompra
          produtoNome={modalPedido.nome}
          quantidade={modalPedido.qtd}
          precoUnitario={modalPedido.preco}
          onClose={() => {
            setModalPedido(null);
            // Refetch dos produtos após fechar o modal para sincronizar com possíveis mudanças
            produtosData && produtosData.items && setProdutosAcumulados([]);
          }}
        />
      )}
      {/* Painel lateral de orçamento (mini resumo em tempo real) */}
      <OrcamentoSidePanel
        produtoPendente={produtoPainel}
        onProdutoPendenteConsumed={() => setProdutoPainel(null)}
        origem="VEILING"
      />
      {/* Modal de Gerador de Links */}
      {showLinkGenerator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 pb-4 border-b">
              <h2 className="text-lg font-bold">Gerar Link para Envio</h2>
              <button
                onClick={() => {
                  setShowLinkGenerator(false);
                  setSelectedProductIds(new Set());
                  setLinkGeneratorMode('categoria');
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-800 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Abas de modo */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setLinkGeneratorMode('categoria')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  linkGeneratorMode === 'categoria'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Por Categoria
              </button>
              <button
                onClick={() => setLinkGeneratorMode('produtos')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  linkGeneratorMode === 'produtos'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Produtos Específicos ({selectedProductIds.size})
              </button>
            </div>

            <div className="space-y-3">
              {linkGeneratorMode === 'categoria' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Selecione uma categoria (opcional):</label>
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => setSelectedCategory(e.target.value || null)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                    >
                      <option value="">Todos os produtos</option>
                      <option value="Flor Envasada">Flor Envasada</option>
                      <option value="Planta Ornamental">Planta Ornamental</option>
                      <option value="Produto Decorado">Produto Decorado</option>
                      <option value="Produto de Corte">Produto de Corte</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Link gerado:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={selectedCategory 
                          ? `${window.location.origin}/catalogo-veiling-cliente?categoria=${encodeURIComponent(selectedCategory)}`
                          : window.location.origin + '/catalogo-veiling-cliente'
                        }
                        className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 text-sm"
                      />
                      <button
                        onClick={() => {
                          const url = selectedCategory 
                            ? `${window.location.origin}/catalogo-veiling-cliente?categoria=${encodeURIComponent(selectedCategory)}`
                            : window.location.origin + '/catalogo-veiling-cliente';
                          navigator.clipboard.writeText(url);
                          toast.success('Link copiado!');
                        }}
                        className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Selecione produtos da tabela abaixo:</label>
                    <p className="text-xs text-muted-foreground mb-3">Clique no checkbox de cada produto para incluir no link. Você pode filtrar a tabela normalmente.</p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg text-sm text-amber-900 dark:text-amber-200">
                    <p className="font-medium">📌 Como usar:</p>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                      <li>Filtre os produtos usando os filtros da tabela (categoria, busca, etc)</li>
                      <li>Clique no checkbox de cada produto que deseja incluir</li>
                      <li>Clique em Gerar Link para copiar o link com os produtos selecionados</li>
                    </ol>
                  </div>

                  {selectedProductIds.size > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Link gerado:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/catalogo-veiling-cliente?produtos=${Array.from(selectedProductIds).join(',')}`}
                          className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 text-sm truncate"
                        />
                        <button
                          onClick={generateProductLink}
                          className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-sm text-blue-900 dark:text-blue-200">
                <p className="font-medium mb-1">💡 Dica:</p>
                <p>Compartilhe este link via WhatsApp, email ou SMS para seus clientes acessarem o catálogo diretamente.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Configuracao do PDF */}
      <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Titulo da Tabela</label>
              <Input
                className="h-8 text-xs"
                value={pdfTitulo}
                onChange={e => setPdfTitulo(e.target.value)}
                placeholder="Ex: Lista de Flores"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Data de Emissao (DD/MM/YYYY)</label>
              <Input
                className="h-8 text-xs"
                value={pdfDataEmissao}
                onChange={e => setPdfDataEmissao(e.target.value)}
                placeholder="Ex: 19/05/2026"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Hora de Emissao (HH:MM)</label>
              <Input
                className="h-8 text-xs"
                type="time"
                value={pdfHoraEmissao}
                onChange={e => setPdfHoraEmissao(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Dias de Validade</label>
              <Input
                className="h-8 text-xs"
                type="number"
                value={pdfValidade}
                onChange={e => setPdfValidade(Number(e.target.value))}
                min={1}
                max={365}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Hora de Validade (HH:MM)</label>
              <Input
                className="h-8 text-xs"
                type="time"
                value={pdfHoraValidade}
                onChange={e => setPdfHoraValidade(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Desconto PIX (%)</label>
              <Input
                className="h-8 text-xs"
                type="number"
                value={pdfDescontoPercentual}
                onChange={e => setPdfDescontoPercentual(Number(e.target.value))}
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Observacoes</label>
              <textarea
                className="w-full h-20 px-2 py-1 text-xs border rounded-md resize-none"
                value={pdfObservacoes}
                onChange={e => setPdfObservacoes(e.target.value)}
                placeholder="Ex: Precos sujeitos a alteracao. Consulte disponibilidade."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowPdfModal(false)}>Cancelar</Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const produtosIds = Array.from(selectedProductsForPdf).join(',');
                const params = new URLSearchParams();
                params.append('produtos', produtosIds);
                params.append('titulo', pdfTitulo);
                params.append('data', pdfDataEmissao);
                params.append('validade', pdfValidade.toString());
                params.append('desconto', pdfDescontoPercentual.toString());
                params.append('observacoes', pdfObservacoes);
                const linkUrl = `${window.location.origin}/catalogo-veiling-cliente?${params.toString()}`;
                const encoded = encodeURIComponent(linkUrl);
                window.open(`https://wa.me/?text=Confira%20nosso%20cat%C3%A1logo%20atualizado:%20${encoded}`, '_blank');
                toast.success('Link com estrutura do PDF gerado!');
              }}
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <LinkIcon className="h-3.5 w-3.5 mr-1" />
              Link com Produtos
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={shareWhatsApp}
              className="text-green-600 border-green-600 hover:bg-green-50"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              Compartilhar WhatsApp
            </Button>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => {
                generatePdf();
                setShowPdfModal(false);
              }}
              disabled={generatingPdf}
            >
              {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Conferência de Catálogo */}
      <ModalConferenciaCatalogo
        open={showConferenciaModal}
        onOpenChange={setShowConferenciaModal}
        produtos={produtosParaConferencia}
        descontoPercentualPadrao={pdfDescontoPercentual}
        onConfirm={(produtosAjustados, descontos) => {
          // Não faz nada aqui, apenas fecha o modal
          setShowConferenciaModal(false);
        }}
        onGerarPdf={async (produtosAjustados, descontos) => {
          await generatePdf(produtosAjustados, descontos);
        }}
        isGeneratingPdf={generatingPdf}
      />

            {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-2xl p-2 bg-black/90 border-0">
          {lightboxUrl && (
            <img
              src={lightboxUrl}
              alt={lightboxAlt}
              className="w-full max-h-[80vh] object-contain rounded"
              onClick={() => setLightboxUrl(null)}
            />
          )}
          <p className="text-center text-xs text-white/60 mt-1">{lightboxAlt}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
