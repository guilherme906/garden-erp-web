import { useAuth } from "@/_core/hooks/useAuth";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { getLoginUrl } from "@/const";
import ErpLogin from "@/pages/ErpLogin";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Leaf, LogOut, Users, Package, ShoppingCart, TrendingUp,
  BarChart3, Settings, ChevronDown, Menu, X,
} from "lucide-react";
import { useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

type TabItem = {
  icon: any;
  label: string;
  adminOnly?: boolean;
  children: { label: string; path: string; adminOnly?: boolean }[];
};

const tabItems: TabItem[] = [
  {
    icon: Package, label: "Cadastro", adminOnly: true,
    children: [
      { label: "Clientes", path: "/cadastro/clientes" },
      { label: "Produtos", path: "/cadastro/produtos" },
    ],
  },
  {
    icon: ShoppingCart, label: "Compras", adminOnly: false,
    children: [
      { label: "Entrada NF", path: "/compras/entrada", adminOnly: true },
      { label: "Importar Arquivo", path: "/compras/importar" },
    ],
  },
  {
    icon: TrendingUp, label: "Vendas",
    children: [
      { label: "Lista de Vendas", path: "/vendas" },
      { label: "Nova Venda", path: "/vendas/nova" },
    ],
  },
  {
    icon: BarChart3, label: "Relatórios", adminOnly: true,
    children: [
      { label: "Pedidos", path: "/relatorios/pedidos" },
      { label: "Produtos Vendidos", path: "/relatorios/produtos" },
    ],
  },
  {
    icon: Users, label: "Usuários", adminOnly: true,
    children: [
      { label: "Vendedores", path: "/usuarios/vendedores" },
    ],
  },
  {
    icon: Settings, label: "Configurações", adminOnly: true,
    children: [
      { label: "Backup", path: "/config/backup" },
      { label: "Manutenção", path: "/config/manutencao" },
    ],
  },
];

export default function ErpLayout({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  const { erpUser } = useErpAuth();

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Leaf className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">Garden Primavera ERP</h1>
            <p className="text-sm text-muted-foreground text-center">Faça login para acessar o sistema.</p>
          </div>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} size="lg" className="w-full">Entrar</Button>
        </div>
      </div>
    );
  }

  if (!erpUser) return <ErpLogin />;

  return <ErpTabsLayout>{children}</ErpTabsLayout>;
}

function ErpTabsLayout({ children }: { children: ReactNode }) {
  const { erpUser, erpLogout, isAdmin } = useErpAuth();
  const { logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredTabs = tabItems.filter(item => !item.adminOnly || isAdmin);

  const isTabActive = (tab: TabItem) => {
    return tab.children.some(c => location === c.path || location.startsWith(c.path + "/"));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header com logo, abas e perfil */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* Linha superior: logo + perfil */}
        <div className="flex items-center justify-between h-14 px-4">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setLocation("/")}
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight text-base hidden sm:inline">Garden Primavera ERP</span>
            <span className="font-semibold tracking-tight text-base sm:hidden">Garden ERP</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão mobile menu */}
            <button
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-lg hover:bg-accent active:bg-accent/80 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Perfil do usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors">
                  <Avatar className="h-7 w-7 border">
                    <AvatarFallback className="text-[10px] font-medium bg-primary text-primary-foreground">
                      {erpUser?.nome?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-medium leading-none">{erpUser?.nome}</span>
                    <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{erpUser?.perfil}</span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 sm:hidden">
                  <p className="text-sm font-medium">{erpUser?.nome}</p>
                  <p className="text-xs text-muted-foreground">{erpUser?.perfil}</p>
                </div>
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuItem onClick={() => { erpLogout(); logout(); }} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Abas de navegação - Desktop */}
        <nav className="hidden md:flex items-center gap-0.5 px-4 -mb-px overflow-x-auto">
          {filteredTabs.map(tab => {
            const active = isTabActive(tab);
            const visibleChildren = tab.children.filter(c => !c.adminOnly || isAdmin);

            if (visibleChildren.length === 1) {
              // Aba simples sem dropdown
              return (
                <button
                  key={tab.label}
                  onClick={() => setLocation(visibleChildren[0].path)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            }

            // Aba com dropdown para sub-itens
            return (
              <DropdownMenu key={tab.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    <ChevronDown className="h-3 w-3 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {visibleChildren.map(child => (
                    <DropdownMenuItem
                      key={child.path}
                      onClick={() => setLocation(child.path)}
                      className={cn(
                        "cursor-pointer",
                        location === child.path && "bg-accent font-medium"
                      )}
                    >
                      {child.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </nav>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t bg-background px-4 py-3 space-y-2 max-h-[70vh] overflow-y-auto">
            {filteredTabs.map(tab => {
              const visibleChildren = tab.children.filter(c => !c.adminOnly || isAdmin);
              return (
                <div key={tab.label}>
                  <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </div>
                  {visibleChildren.map(child => (
                    <button
                      key={child.path}
                      onClick={() => { setLocation(child.path); setMobileMenuOpen(false); }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-base rounded-md transition-colors active:bg-accent/80",
                        location === child.path
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-accent"
                      )}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
        )}
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
