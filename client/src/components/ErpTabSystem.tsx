import { useAuth } from "@/_core/hooks/useAuth";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { getLoginUrl } from "@/const";
import ErpLogin from "@/pages/ErpLogin";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  LogOut, Users, Package, ShoppingCart, TrendingUp,
  BarChart3, Settings, ChevronDown, Menu, X as XIcon, Home as HomeIcon, Trash2, ClipboardCheck, AlertTriangle, DollarSign, ChevronRight, Globe, ClipboardList,
  Moon, Sun, CloudDownload, Store, Wallet, Bell, ShoppingBag, Tag, MessageCircle, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// Importar todas as páginas
import Home from "@/pages/Home";
import Clientes from "@/pages/Clientes";
import Produtos from "@/pages/Produtos";
import Vendas from "@/pages/Vendas";
import EntradaNF from "@/pages/EntradaNF";
import ImportarArquivo from "@/pages/ImportarArquivo";
import RelatorioPedidos from "@/pages/RelatorioPedidos";
import RelatorioProdutos from "@/pages/RelatorioProdutos";
import Vendedores from "@/pages/Vendedores";
import Configuracoes from "@/pages/Configuracoes";
import Lixeira from "@/pages/Lixeira";
import Conferencia from "@/pages/Conferencia";
import RelatorioDivergencias from "@/pages/RelatorioDivergencias";
import TabelaPreco from "@/pages/TabelaPreco";
import { FormasPagamento } from "@/pages/FormasPagamento";
import { TitulosPagos } from "@/pages/TitulosPagos";
import { TitulosAReceber } from "@/pages/TitulosAReceber";
import PedidosCompra from "@/pages/PedidosCompra";
import CatalogoCooperflora from "@/pages/CatalogoCooperflora";
import CatalogoVeiling from "@/pages/CatalogoVeiling";
import CatalogoVeilingCliente from "@/pages/CatalogoVeilingCliente";
import CadastroProdutosLoja from "@/pages/CadastroProdutosLoja";
import AjusteEstoque from "@/pages/AjusteEstoque";
import CatalogosVenda from "@/pages/CatalogosVenda";
import CatalogoUnificado from "@/pages/CatalogoUnificado";
import ImportarPedidosVeiling from "@/pages/ImportarPedidosVeiling";
import PedidosRecebidos from "@/pages/PedidosRecebidos";
import SaudeAutoSync from "@/pages/SaudeAutoSync";
import VendasEfetivas from "@/pages/VendasEfetivas";
import ControleCaixa from "@/pages/ControleCaixa";
import RelatorioFinanceiroCliente from "@/pages/RelatorioFinanceiroCliente";
import PedidosPublicos from "@/pages/PedidosPublicos";
import Promocoes from "@/pages/Promocoes";
import ListasPrecos from "@/pages/ListasPrecos";
import ProdutosLista from "@/pages/ProdutosLista";
import ComprasImportadas from "@/pages/ComprasImportadas";
import AcompanhamentoCompras from "@/pages/AcompanhamentoCompras";
import { HistoricoPDFs } from "@/pages/HistoricoPDFs";
import GerenciadorProdutosCustomizados from "@/pages/GerenciadorProdutosCustomizados";
import GerenciamentoClientesWhatsApp from "@/pages/GerenciamentoClientesWhatsApp";
import BloqueioClientes from "@/pages/BloqueioClientes";

// ─── Definição das abas disponíveis ───
type TabDef = {
  id: string;
  label: string;
  icon: any;
  component: React.ComponentType;
  adminOnly?: boolean;
  group: string;
};

const ALL_TABS: TabDef[] = [
  { id: "home", label: "Início", icon: HomeIcon, component: Home, group: "home" },
  { id: "clientes", label: "Clientes", icon: Users, component: Clientes, adminOnly: true, group: "Cadastro" },
  { id: "whatsapp", label: "Envio WhatsApp", icon: MessageCircle, component: GerenciamentoClientesWhatsApp, adminOnly: true, group: "Vendas" },
  { id: "produtos", label: "Produtos", icon: Package, component: Produtos, adminOnly: true, group: "Cadastro" },
  { id: "entrada-nf", label: "Entrada NF", icon: ShoppingCart, component: EntradaNF, adminOnly: true, group: "Compras" },
  { id: "importar", label: "Importar Arquivo", icon: ShoppingCart, component: ImportarArquivo, group: "Compras" },
  { id: "tabela-preco", label: "Tabela de Preço", icon: DollarSign, component: TabelaPreco, adminOnly: true, group: "Compras" },
  { id: "pedidos-compra", label: "Pedidos de Compra", icon: ShoppingCart, component: PedidosCompra, group: "Compras" },
  { id: "importar-pedidos-veiling", label: "Pedidos Veiling", icon: CloudDownload, component: ImportarPedidosVeiling, adminOnly: true, group: "Compras" },
  { id: "compras-importadas", label: "Compras Importadas", icon: ShoppingCart, component: ComprasImportadas, group: "Compras" },
  { id: "acompanhamento-compras", label: "Acompanhamento de Compras", icon: ClipboardCheck, component: AcompanhamentoCompras, group: "Compras" },
  { id: "catalogo-cooperflora", label: "Catálogo Cooperflora", icon: Globe, component: CatalogoCooperflora, group: "E-commerce" },
  { id: "catalogo-veiling", label: "Catálogo Veiling", icon: Globe, component: CatalogoVeiling, group: "E-commerce" },
  { id: "catalogo-veiling-cliente", label: "Catálogo Veiling (Cliente)", icon: Globe, component: CatalogoVeilingCliente, group: "E-commerce" },
  { id: "historico-pdfs", label: "Histórico de PDFs", icon: Globe, component: HistoricoPDFs, group: "E-commerce" },
  { id: "pedidos-recebidos", label: "Pedidos Recebidos", icon: ShoppingBag, component: PedidosRecebidos, group: "E-commerce" },
  { id: "catalogo-unificado", label: "Catálogo Unificado", icon: Globe, component: CatalogoUnificado, group: "E-commerce" },
  { id: "produtos-loja", label: "Produtos da Loja", icon: Package, component: CadastroProdutosLoja, adminOnly: true, group: "Cadastro" },
  { id: "produtos-customizados", label: "Produtos Customizados", icon: Package, component: GerenciadorProdutosCustomizados, adminOnly: true, group: "Cadastro" },
  { id: "ajuste-estoque", label: "Ajuste de Estoque", icon: ClipboardList, component: AjusteEstoque, adminOnly: true, group: "Cadastro" },
  { id: "formas-pagamento", label: "Formas de Pagamento", icon: DollarSign, component: FormasPagamento, adminOnly: true, group: "Financeiro" },
  { id: "titulos-pagos", label: "Títulos Pagos", icon: DollarSign, component: TitulosPagos, adminOnly: true, group: "Financeiro" },
  { id: "titulos-receber", label: "Títulos a Receber", icon: DollarSign, component: TitulosAReceber, adminOnly: true, group: "Financeiro" },
  { id: "caixa", label: "Caixa", icon: Wallet, component: ControleCaixa, adminOnly: true, group: "Financeiro" },
  { id: "relatorio-financeiro-cliente", label: "Rel. Financeiro por Cliente", icon: BarChart3, component: RelatorioFinanceiroCliente, adminOnly: true, group: "Financeiro" },
  { id: "bloqueio-clientes", label: "Bloqueios", icon: Lock, component: BloqueioClientes, adminOnly: true, group: "Financeiro" },
  { id: "vendas", label: "Orçamentos", icon: TrendingUp, component: Vendas, group: "Vendas" },
  { id: "vendas-efetivas", label: "Vendas Efetivas", icon: TrendingUp, component: VendasEfetivas, adminOnly: true, group: "Vendas" },
  { id: "conferencia", label: "Conferência", icon: ClipboardCheck, component: Conferencia, group: "Vendas" },
  { id: "catalogos-venda", label: "Catálogos de Venda", icon: Globe, component: CatalogosVenda, group: "Vendas" },
  { id: "pedidos-publicos", label: "Pedidos Públicos", icon: ShoppingCart, component: PedidosPublicos, group: "Vendas" },
  { id: "promocoes", label: "Promoções", icon: TrendingUp, component: Promocoes, group: "Vendas" },
  { id: "listas-precos", label: "Listas de Preços", icon: Tag, component: ListasPrecos, group: "Vendas" },
  { id: "produtos-lista", label: "Produtos de Lista", icon: Package, component: ProdutosLista, group: "Vendas" },
  { id: "rel-pedidos", label: "Rel. Pedidos", icon: BarChart3, component: RelatorioPedidos, adminOnly: true, group: "Relatórios" },
  { id: "rel-produtos", label: "Rel. Produtos", icon: BarChart3, component: RelatorioProdutos, adminOnly: true, group: "Relatórios" },
  { id: "rel-divergencias", label: "Divergências", icon: AlertTriangle, component: RelatorioDivergencias, adminOnly: true, group: "Relatórios" },
  { id: "vendedores", label: "Vendedores", icon: Users, component: Vendedores, adminOnly: true, group: "Usuários" },
  { id: "backup", label: "Backup", icon: Settings, component: Configuracoes, adminOnly: true, group: "Configurações" },
  { id: "manutencao", label: "Manutenção", icon: Settings, component: Configuracoes, adminOnly: true, group: "Configurações" },
  { id: "lixeira", label: "Lixeira", icon: Trash2, component: Lixeira, adminOnly: true, group: "Configurações" },
  { id: "saude-autosync", label: "Saúde do Sistema", icon: Settings, component: SaudeAutoSync, adminOnly: true, group: "Configurações" },
];

// Grupos do menu principal
type SubMenuGroup = {
  label: string;
  icon: any;
  tabIds: string[];
};

type MenuGroup = {
  label: string;
  icon: any;
  adminOnly?: boolean;
  tabIds: string[];
  subGroups?: SubMenuGroup[];
};

const MENU_GROUPS: MenuGroup[] = [
  {
    label: "Cadastro",
    icon: Package,
    adminOnly: true,
    tabIds: ["clientes", "produtos-loja", "produtos-customizados", "ajuste-estoque"],
  },
  { label: "Compras", icon: ShoppingCart, tabIds: ["entrada-nf", "importar", "tabela-preco", "pedidos-compra", "importar-pedidos-veiling", "compras-importadas", "acompanhamento-compras"] },
  { label: "Financeiro", icon: DollarSign, adminOnly: true, tabIds: ["formas-pagamento", "titulos-pagos", "titulos-receber", "caixa", "relatorio-financeiro-cliente", "bloqueio-clientes"] },
  {
    label: "Vendas",
    icon: TrendingUp,
    tabIds: ["vendas", "vendas-efetivas", "conferencia", "catalogos-venda", "pedidos-publicos", "promocoes", "listas-precos", "produtos-lista"],
  },
  {
    label: "E-commerce",
    icon: Store,
    tabIds: ["catalogo-cooperflora", "catalogo-veiling", "catalogo-veiling-cliente", "pedidos-recebidos", "catalogo-unificado", "catalogos-venda"],
  },
  { label: "Relatórios", icon: BarChart3, adminOnly: true, tabIds: ["rel-pedidos", "rel-produtos", "rel-divergencias"] },
  { label: "Usuários", icon: Users, adminOnly: true, tabIds: ["vendedores"] },
  { label: "Configurações", icon: Settings, adminOnly: true, tabIds: ["backup", "manutencao", "lixeira", "saude-autosync"] },
];

export default function ErpTabSystem() {
  const { erpUser } = useErpAuth();

  // Se não houver usuário ERP logado, mostrar página de login
  if (!erpUser) return <ErpLogin />;

  return <TabWorkspace />;
}

function TabWorkspace() {
  const { erpUser, erpLogout, isAdmin } = useErpAuth();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [expandedSubGroup, setExpandedSubGroup] = useState<string | null>(null);
  // Notificações de pedidos públicos via SSE
  const [pedidosNovos, setPedidosNovos] = useState(0);
  const [sinoAberto, setSinoAberto] = useState(false);
  const [ultimosPedidos, setUltimosPedidos] = useState<Array<{clienteNome: string; total: number; itens: number; timestamp: number; vendaId: number | null}>>([]);
  const sinceRef = useRef(Date.now() - 5 * 60 * 1000); // últimos 5 min ao conectar

  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    function connect() {
      es = new EventSource(`/api/pedidos-publicos/stream?since=${sinceRef.current}`);
      es.onmessage = (e) => {
        if (!e.data || e.data.startsWith(':')) return;
        try {
          const pedido = JSON.parse(e.data);
          const ts = pedido.timestamp ?? Date.now();
          setPedidosNovos(n => n + 1);
          setUltimosPedidos(prev => [{ ...pedido, timestamp: ts }, ...prev].slice(0, 10));
          sinceRef.current = ts;
          toast.success('🛒 Novo pedido recebido!', {
            description: `${pedido.clienteNome} — ${pedido.itens} iten(s) — R$ ${Number(pedido.total).toFixed(2)}`,
            duration: 8000,
          });
        } catch {}
      };
      es.onerror = () => {
        es?.close();
        retryTimeout = setTimeout(connect, 5000);
      };
    }
    connect();
    return () => { es?.close(); if (retryTimeout) clearTimeout(retryTimeout); };
  }, []);

  // Abas abertas e aba ativa
  const [openTabIds, setOpenTabIds] = useState<string[]>(["home"]);
  const [activeTabId, setActiveTabId] = useState("home");

  // Bloquear scroll do body quando menu mobile está aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  // Abas disponíveis baseado no perfil
  const availableTabs = useMemo(() =>
    ALL_TABS.filter(t => !t.adminOnly || isAdmin),
    [isAdmin]
  );

  // Grupos do menu filtrados
  const filteredGroups = useMemo(() =>
    MENU_GROUPS.filter(g => !g.adminOnly || isAdmin).map(g => ({
      ...g,
      tabIds: g.tabIds.filter(id => {
        const tab = ALL_TABS.find(t => t.id === id);
        return tab && (!tab.adminOnly || isAdmin);
      }),
      subGroups: (g.subGroups || []).map(sg => ({
        ...sg,
        tabIds: sg.tabIds.filter(id => {
          const tab = ALL_TABS.find(t => t.id === id);
          return tab && (!tab.adminOnly || isAdmin);
        }),
      })).filter(sg => sg.tabIds.length > 0),
    })).filter(g => g.tabIds.length > 0 || (g.subGroups && g.subGroups.length > 0)),
    [isAdmin]
  );

  // Listener de evento global para abrir aba por evento (ex: do OrcamentoSidePanel)
  useEffect(() => {
    function handleOpenTab(e: Event) {
      const detail = (e as CustomEvent).detail;
      // Aceita tanto string simples quanto objeto { tabId: string }
      const tabId: string = typeof detail === "string" ? detail : detail?.tabId;
      if (tabId) {
        setOpenTabIds(prev => {
          if (!prev.includes(tabId)) return [...prev, tabId];
          return prev;
        });
        setActiveTabId(tabId);
        setMobileMenuOpen(false);
        setExpandedGroup(null);
        setExpandedSubGroup(null);
      }
    }
    window.addEventListener("erp-open-tab", handleOpenTab);
    return () => window.removeEventListener("erp-open-tab", handleOpenTab);
  }, []);

  // Abrir uma aba (ou ativar se já estiver aberta)
  const openTab = useCallback((tabId: string) => {
    setOpenTabIds(prev => {
      if (!prev.includes(tabId)) return [...prev, tabId];
      return prev;
    });
    setActiveTabId(tabId);
    setMobileMenuOpen(false);
    setExpandedGroup(null);
    setExpandedSubGroup(null);
  }, []);

  // Fechar uma aba
  const closeTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (tabId === "home") return;
    setOpenTabIds(prev => {
      const next = prev.filter(id => id !== tabId);
      if (tabId === activeTabId) {
        const idx = prev.indexOf(tabId);
        const newActive = next[Math.min(idx, next.length - 1)] || "home";
        setActiveTabId(newActive);
      }
      return next;
    });
  }, [activeTabId]);

  // Abas abertas como objetos
  const openTabs = useMemo(() =>
    openTabIds.map(id => ALL_TABS.find(t => t.id === id)!).filter(Boolean),
    [openTabIds]
  );

  const toggleMobileGroup = (label: string) => {
    setExpandedGroup(prev => {
      if (prev === label) return null;
      setExpandedSubGroup(null); // limpa subgrupo ao trocar de grupo
      return label;
    });
  };

  return (
    <>
    <div className="min-h-screen flex flex-col bg-background">
      {/* ═══ HEADER ═══ */}
      <header
        ref={(el) => {
          if (el) {
            // Atualiza a CSS var com a altura real do header (inclui barra de abas)
            const update = () => {
              const h = el.getBoundingClientRect().height;
              if (h > 0) document.documentElement.style.setProperty('--erp-header-height', `${h}px`);
            };
            update();
            // Observar mudanças de tamanho (ex: abas abertas mudam a altura)
            const ro = new ResizeObserver(update);
            ro.observe(el);
          }
        }}
        className="sticky top-0 z-50 border-b bg-zinc-900 border-zinc-800">
        {/* Barra superior: logo + menu de módulos + perfil */}
        <div className="flex items-center justify-between h-14 lg:h-12 px-3 lg:px-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => openTab("home")}
          >
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663539257200/nE9aRDyk9G49cwSdfYmqny/LOGOPRINCIPAL-POSITIVA-HORIZONTAL_21b11a41.webp" alt="Garden Center Primavera" className="h-8 lg:h-6 object-contain" />
          </div>

          {/* Menu de módulos - Desktop (lg e acima) */}
          <nav className="hidden lg:flex items-center gap-0.5 mx-4">
            {filteredGroups.map(group => {
              const groupTabs = group.tabIds.map(id => ALL_TABS.find(t => t.id === id)!).filter(Boolean);
              const hasActiveTab = groupTabs.some(t => openTabIds.includes(t.id));

              if (groupTabs.length === 1) {
                return (
                  <button
                    key={group.label}
                    onClick={() => openTab(groupTabs[0].id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                        hasActiveTab
                        ? "bg-white/15 text-white"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    )}
                  >
                    <group.icon className="h-4 w-4" />
                    {group.label}
                  </button>
                );
              }

              return (
                <DropdownMenu key={group.label}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                        hasActiveTab
                          ? "bg-white/15 text-white"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                      )}
                    >
                      <group.icon className="h-4 w-4" />
                      {group.label}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 max-h-96 overflow-y-auto">
                    {groupTabs.map(tab => (
                      <DropdownMenuItem
                        key={tab.id}
                        onClick={() => openTab(tab.id)}
                        className={cn(
                          "cursor-pointer py-2.5 text-sm",
                          openTabIds.includes(tab.id) && "bg-accent font-medium"
                        )}
                      >
                        <tab.icon className="h-4 w-4 mr-2" />
                        {tab.label}
                      </DropdownMenuItem>
                    ))}
                    {group.subGroups && group.subGroups.length > 0 && (
                      <>
                        {groupTabs.length > 0 && <DropdownMenuSeparator />}
                        {group.subGroups.map(sg => {
                          const sgTabs = sg.tabIds.map(id => ALL_TABS.find(t => t.id === id)!).filter(Boolean);
                          const sgHasActive = sgTabs.some(t => openTabIds.includes(t.id));
                          return (
                            <DropdownMenuSub key={sg.label}>
                              <DropdownMenuSubTrigger
                                className={cn(
                                  "cursor-pointer py-2.5 text-sm",
                                  sgHasActive && "bg-accent font-medium"
                                )}
                              >
                                <sg.icon className="h-4 w-4 mr-2" />
                                {sg.label}
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="w-52">
                                {sgTabs.map(tab => (
                                  <DropdownMenuItem
                                    key={tab.id}
                                    onClick={() => openTab(tab.id)}
                                    className={cn(
                                      "cursor-pointer py-2.5 text-sm",
                                      openTabIds.includes(tab.id) && "bg-accent font-medium"
                                    )}
                                  >
                                    <tab.icon className="h-4 w-4 mr-2" />
                                    {tab.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          );
                        })}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Sino de notificações de pedidos públicos */}
            <div className="relative">
              <button
                onClick={() => { setSinoAberto(!sinoAberto); if (!sinoAberto) setPedidosNovos(0); }}
                className="h-9 w-9 lg:h-8 lg:w-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors relative"
                aria-label="Notificações de pedidos"
                title="Pedidos recebidos pelo catálogo"
              >
                <Bell className="h-5 w-5 lg:h-4 lg:w-4 text-zinc-300" />
                {pedidosNovos > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 lg:h-3.5 lg:w-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {pedidosNovos > 9 ? '9+' : pedidosNovos}
                  </span>
                )}
              </button>
              {sinoAberto && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
                    <span className="text-sm font-semibold text-white">Pedidos do Catálogo</span>
                    <button
                      onClick={() => { openTab('pedidos-publicos'); setSinoAberto(false); }}
                      className="text-xs text-green-400 hover:text-green-300 transition-colors"
                    >Ver todos</button>
                  </div>
                  {ultimosPedidos.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-zinc-400">Nenhum pedido recente</div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {ultimosPedidos.map((p, i) => (
                        <div key={i} className="px-4 py-3 border-b border-zinc-800 last:border-0 hover:bg-zinc-800 cursor-pointer transition-colors"
                          onClick={() => { if (p.vendaId) { openTab('vendas'); } setSinoAberto(false); }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white truncate">{p.clienteNome}</span>
                            <span className="text-xs text-green-400 font-semibold ml-2 shrink-0">R$ {Number(p.total).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-zinc-400">{p.itens} iten(s)</span>
                            <span className="text-xs text-zinc-500">{new Date(p.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botão de tema claro/escuro */}
            <button
              onClick={toggleTheme}
              className="h-9 w-9 lg:h-8 lg:w-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors"
              aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark'
                ? <Sun className="h-5 w-5 lg:h-4 lg:w-4 text-yellow-400" />
                : <Moon className="h-5 w-5 lg:h-4 lg:w-4 text-zinc-400" />}
            </button>

            {/* Botão mobile menu - visível até lg */}
            <button
              className="lg:hidden h-12 w-12 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors active:bg-zinc-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <XIcon className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>

            {/* Perfil */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-800 transition-colors">
                  <Avatar className="h-9 w-9 lg:h-7 lg:w-7 border">
                    <AvatarFallback className="text-sm lg:text-[10px] font-medium bg-primary text-primary-foreground">
                      {erpUser?.nome?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden lg:inline text-white">{erpUser?.nome}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400 hidden lg:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{erpUser?.nome}</p>
                  <p className="text-xs text-muted-foreground">{erpUser?.perfil}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { erpLogout(); logout(); }} className="cursor-pointer text-destructive focus:text-destructive py-2.5">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Menu mobile renderizado via portal - FORA do header para evitar z-index stacking context */}

        {/* ═══ BARRA DE ABAS ABERTAS ═══ */}
        <div className="flex items-center border-t overflow-x-auto scrollbar-hide" style={{ backgroundColor: '#16a34a' }}>
          {openTabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "group flex items-center gap-2 px-4 lg:px-3 py-3 lg:py-1.5 text-sm lg:text-xs font-medium cursor-pointer border-r border-white/20 whitespace-nowrap transition-colors select-none",
                activeTabId === tab.id
                  ? "bg-white/25 text-white shadow-sm font-semibold"
                  : "text-white/70 hover:text-white hover:bg-white/15"
              )}
            >
              <tab.icon className="h-4.5 w-4.5 lg:h-3 lg:w-3 shrink-0" />
              <span>{tab.label}</span>
              {tab.id !== "home" && (
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className={cn(
                    "h-7 w-7 lg:h-4 lg:w-4 flex items-center justify-center rounded-sm transition-colors shrink-0",
                    "lg:opacity-0 lg:group-hover:opacity-100",
                    activeTabId === tab.id && "opacity-80 lg:opacity-60 lg:hover:opacity-100",
                    "hover:bg-red-500/40 hover:text-white active:bg-red-500/60"
                  )}
                >
                  <XIcon className="h-4 w-4 lg:h-2.5 lg:w-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </header>

      {/* ═══ CONTEÚDO - Todas as abas montadas, alternando com display ═══ */}
      <div className="flex-1 relative">
        {openTabs.map(tab => {
          const TabComponent = tab.component;
          return (
            <div
              key={tab.id}
              className={cn(
                "p-3 lg:p-4 xl:p-6 w-full",
                activeTabId === tab.id ? "block" : "hidden"
              )}
            >
              <TabComponent />
            </div>
          );
        })}
      </div>
    </div>

    {/* ═══ MENU MOBILE - Portal para ficar ACIMA de tudo ═══ */}
    {mobileMenuOpen && createPortal(
      <>
        {/* Backdrop */}
        <div
          className="lg:hidden fixed inset-0 bg-black/50"
          style={{ zIndex: 9998 }}
          onClick={() => setMobileMenuOpen(false)}
        />
        {/* Menu panel */}
        <nav
          className="lg:hidden fixed inset-0 bg-background overflow-y-auto"
          style={{ zIndex: 9999 }}
        >
          {/* Cabeçalho do menu mobile com botão fechar */}
          <div className="sticky top-0 flex items-center justify-between h-14 px-4 border-b bg-background z-10">
            <div className="flex items-center gap-3">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663539257200/nE9aRDyk9G49cwSdfYmqny/LOGOPRINCIPAL-POSITIVA-HORIZONTAL_21b11a41.webp" alt="Garden Center Primavera" className="h-8 object-contain" />
              <span className="font-semibold tracking-tight text-lg">Menu</span>
            </div>
            <button
              className="h-12 w-12 flex items-center justify-center rounded-lg hover:bg-accent transition-colors active:bg-accent/80"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Fechar menu"
            >
              <XIcon className="h-7 w-7" />
            </button>
          </div>

          {/* Botão Início */}
          <button
            onClick={() => openTab("home")}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-5 text-lg font-medium border-b transition-colors active:bg-accent/80",
              activeTabId === "home" ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
            )}
          >
            <HomeIcon className="h-6 w-6" />
            Início
          </button>

          {/* Grupos com accordion */}
          {filteredGroups.map(group => {
            const groupTabs = group.tabIds.map(id => ALL_TABS.find(t => t.id === id)!).filter(Boolean);
            const allSubGroupTabs = (group.subGroups || []).flatMap(sg =>
              sg.tabIds.map(id => ALL_TABS.find(t => t.id === id)!).filter(Boolean)
            );
            const isExpanded = expandedGroup === group.label;
            const hasActiveTab = [...groupTabs, ...allSubGroupTabs].some(t => activeTabId === t.id);
            const totalItems = groupTabs.length + (group.subGroups?.length || 0);

            return (
              <div key={group.label} className="border-b">
                <button
                  onClick={() => {
                    if (totalItems === 1 && groupTabs.length === 1) {
                      openTab(groupTabs[0].id);
                    } else {
                      toggleMobileGroup(group.label);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-5 text-lg font-medium transition-colors active:bg-accent/80",
                    hasActiveTab ? "text-primary bg-primary/5" : "text-foreground hover:bg-accent"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <group.icon className="h-6 w-6" />
                    {group.label}
                  </div>
                  {totalItems > 1 && (
                    <ChevronRight className={cn(
                      "h-6 w-6 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-90"
                    )} />
                  )}
                </button>

                {/* Sub-itens expandidos */}
                {isExpanded && totalItems > 1 && (
                  <div className="bg-muted/30">
                    {groupTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => openTab(tab.id)}
                        className={cn(
                          "w-full flex items-center gap-4 pl-16 pr-5 py-4 text-base transition-colors active:bg-accent/80",
                          activeTabId === tab.id
                            ? "text-primary font-semibold bg-primary/10"
                            : "text-foreground/80 hover:bg-accent"
                        )}
                      >
                        <tab.icon className="h-5 w-5" />
                        {tab.label}
                      </button>
                    ))}
                    {/* Sub-grupos (ex: E-commerce dentro de Vendas) */}
                    {(group.subGroups || []).map(sg => {
                      const sgTabs = sg.tabIds.map(id => ALL_TABS.find(t => t.id === id)!).filter(Boolean);
                      const sgHasActive = sgTabs.some(t => activeTabId === t.id);
                      const sgKey = `${group.label}::${sg.label}`;
                      const sgExpanded = expandedSubGroup === sgKey;
                      return (
                        <div key={sg.label}>
                          <button
                            onClick={() => setExpandedSubGroup(prev =>
                              prev === sgKey ? null : sgKey
                            )}
                            className={cn(
                              "w-full flex items-center justify-between pl-16 pr-5 py-4 text-base font-medium transition-colors active:bg-accent/80",
                              sgHasActive ? "text-primary bg-primary/5" : "text-foreground/80 hover:bg-accent"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <sg.icon className="h-5 w-5" />
                              {sg.label}
                            </div>
                            <ChevronRight className={cn(
                              "h-5 w-5 text-muted-foreground transition-transform duration-200",
                              sgExpanded && "rotate-90"
                            )} />
                          </button>
                          {sgExpanded && (
                            <div className="bg-muted/50">
                              {sgTabs.map(tab => (
                                <button
                                  key={tab.id}
                                  onClick={() => openTab(tab.id)}
                                  className={cn(
                                    "w-full flex items-center gap-4 pl-24 pr-5 py-4 text-base transition-colors active:bg-accent/80",
                                    activeTabId === tab.id
                                      ? "text-primary font-semibold bg-primary/10"
                                      : "text-foreground/80 hover:bg-accent"
                                  )}
                                >
                                  <tab.icon className="h-5 w-5" />
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Info do usuário no rodapé do menu mobile */}
          <div className="p-5 border-t">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12 border">
                <AvatarFallback className="text-base font-medium bg-primary text-primary-foreground">
                  {erpUser?.nome?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-medium">{erpUser?.nome}</p>
                <p className="text-base text-muted-foreground">{erpUser?.perfil}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full h-14 text-lg mb-3"
              onClick={toggleTheme}
            >
              {theme === 'dark'
                ? <><Sun className="mr-2 h-6 w-6 text-yellow-400" /> Modo Claro</>
                : <><Moon className="mr-2 h-6 w-6" /> Modo Escuro</>}
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 text-lg text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => { erpLogout(); logout(); }}
            >
              <LogOut className="mr-2 h-6 w-6" />
              Sair do Sistema
            </Button>
          </div>
        </nav>
      </>,
      document.body
    )}
  </>
  );
}
