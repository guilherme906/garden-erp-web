import { useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import LembretesWidget from "@/components/LembretesWidget";
import {
  TrendingUp, ShoppingCart, BookOpen, Package, Clock, Users,
  AlertCircle, BarChart3, ArrowRight, DollarSign, CheckCircle2,
  FileText, Star, Leaf,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const fmtShort = (v: number) => {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
};

const STATUS_COLORS: Record<string, string> = {
  NOVO: "#22c55e",
  VISTO: "#3b82f6",
  APROVADO: "#10b981",
  CANCELADO: "#ef4444",
  RECUSADO: "#f97316",
};

const STATUS_VENDA_LABEL: Record<string, { label: string; color: string }> = {
  AGUARDANDO: { label: "Em aberto", color: "bg-amber-100 text-amber-800 border-amber-200" },
  APROVADO: { label: "Aprovado", color: "bg-green-100 text-green-800 border-green-200" },
  CANCELADO: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200" },
};

function KpiCard({
  title, value, sub, icon: Icon, color, href, highlight,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
  highlight?: boolean;
}) {
  const handleClick = () => {
    if (href) {
      // Extrair tabId da URL (ex: /catalogos-venda -> catalogos-venda)
      const tabId = href.replace(/^\//, '');
      // Disparar evento customizado para o ErpTabSystem abrir a aba
      window.dispatchEvent(new CustomEvent('erp-open-tab', { detail: tabId }));
    }
  };

  const inner = (
    <Card className={`hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''} group ${highlight ? "ring-2 ring-emerald-400/40" : ""}`} onClick={handleClick}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">{title}</p>
            <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl shrink-0 ml-2 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        {href && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            Ver detalhes <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
  return inner;
}

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
      <span className="w-1 h-4 bg-emerald-500 rounded-full inline-block" />
      {children}
    </h2>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { data, isLoading } = trpc.dashboard.resumo.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  useEffect(() => {
    document.title = "Garden Center Primavera — Sistema de Gestão";
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Usuário";
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-7 p-1 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {saudacao}, {firstName}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">{hoje}</p>
        </div>
        <p className="text-xs text-muted-foreground">Garden Center Primavera — Sistema de Gestão Comercial</p>
      </div>

      {/* ── Lembretes ── */}
      <LembretesWidget />

      {/* ── KPIs do Dia ── */}
      <div>
        <SectionTitle>Resumo de Hoje</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          ) : !data ? (
            <div className="col-span-full flex items-center gap-2 text-muted-foreground text-sm">
              <AlertCircle className="h-4 w-4" /> Não foi possível carregar os dados.
            </div>
          ) : (
            <>
              <KpiCard
                title="Faturamento Hoje"
                value={fmt(data.kpis.faturamentoHoje)}
                sub={`${data.kpis.qtdVendasHoje} orçamento${data.kpis.qtdVendasHoje !== 1 ? "s" : ""} hoje`}
                icon={DollarSign}
                color="bg-emerald-500"
                href="/vendas"
                highlight={data.kpis.faturamentoHoje > 0}
              />
              <KpiCard
                title="Ticket Médio Hoje"
                value={fmt(data.kpis.ticketMedioHoje)}
                sub="por orçamento"
                icon={TrendingUp}
                color="bg-blue-500"
              />
              <KpiCard
                title="Em Aberto Hoje"
                value={data.kpis.vendasAbertasHoje}
                sub="aguardando aprovação"
                icon={Clock}
                color={data.kpis.vendasAbertasHoje > 0 ? "bg-amber-500" : "bg-slate-400"}
                href="/vendas"
              />
              <KpiCard
                title="Aprovados Hoje"
                value={data.kpis.vendasAprovadasHoje}
                sub="pedidos confirmados"
                icon={CheckCircle2}
                color={data.kpis.vendasAprovadasHoje > 0 ? "bg-green-500" : "bg-slate-400"}
                href="/vendas"
              />
            </>
          )}
        </div>
      </div>

      {/* ── KPIs do Mês ── */}
      <div>
        <SectionTitle>Indicadores do Mês</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
          ) : !data ? null : (
            <>
              <KpiCard
                title="Faturamento do Mês"
                value={fmt(data.kpis.faturamentoMes)}
                sub={`${data.kpis.qtdVendasMes} venda${data.kpis.qtdVendasMes !== 1 ? "s" : ""}`}
                icon={TrendingUp}
                color="bg-emerald-500"
                href="/vendas"
              />
              <KpiCard
                title="Pedidos Novos"
                value={data.kpis.qtdPedidosNovos}
                sub="aguardando atenção"
                icon={ShoppingCart}
                color={data.kpis.qtdPedidosNovos > 0 ? "bg-amber-500" : "bg-slate-400"}
                href="/catalogos-venda"
              />
              <KpiCard
                title="Catálogos Ativos"
                value={data.kpis.qtdCatalogosAtivos}
                sub="links disponíveis"
                icon={BookOpen}
                color="bg-blue-500"
                href="/catalogos-venda"
              />
              <KpiCard
                title="Produtos em Estoque"
                value={data.kpis.qtdProdutosEstoque}
                sub="itens com saldo"
                icon={Package}
                color="bg-violet-500"
                href="/estoque"
              />
              <KpiCard
                title="A Receber"
                value={fmt(data.kpis.valorPendente)}
                sub="títulos pendentes"
                icon={Clock}
                color={data.kpis.valorPendente > 0 ? "bg-rose-500" : "bg-slate-400"}
                href="/financeiro"
              />
              <KpiCard
                title="Clientes"
                value={data.kpis.qtdClientes}
                sub="cadastrados"
                icon={Users}
                color="bg-cyan-500"
                href="/clientes"
              />
            </>
          )}
        </div>
      </div>

      {/* ── Gráficos principais ── */}
      <div>
        <SectionTitle>Evolução de Vendas</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Área — 30 dias */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                Faturamento — Últimos 30 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : !data ? null : (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={data.graficoVendasDia} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradVendas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="data"
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(v: number) => [fmt(v), "Faturamento"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--background)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#gradVendas)"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pizza — pedidos por status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                Pedidos por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : !data || data.graficoPedidosStatus.length === 0 ? (
                <div className="h-52 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <ShoppingCart className="h-8 w-8 opacity-20" />
                  Nenhum pedido registrado
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={data.graficoPedidosStatus}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {data.graficoPedidosStatus.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number, name: string) => [v, name]}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--background)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
                    {data.graficoPedidosStatus.map(e => (
                      <div key={e.status} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: STATUS_COLORS[e.status] ?? "#94a3b8" }} />
                        {e.label} ({e.count})
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Faturamento mensal + Top Clientes + Top Produtos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Barras — faturamento mensal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              Faturamento — 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : !data ? null : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.graficoFaturamentoMensal} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => v === 0 ? "0" : `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: number) => [fmt(v), "Faturamento"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--background)" }}
                  />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Clientes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Top 5 Clientes — 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : !data || data.topClientes.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <Users className="h-8 w-8 opacity-20" />
                Sem dados
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.topClientes.map((c, i) => {
                  const max = data.topClientes[0]?.total || 1;
                  const pct = Math.round((c.total / max) * 100);
                  return (
                    <div key={c.nome} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[60%] flex items-center gap-1">
                          <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-orange-300 text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                          {c.nome}
                        </span>
                        <span className="text-muted-foreground font-mono">{fmtShort(c.total)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Produtos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-500" />
              Top 5 Produtos — 30 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : !data || data.topProdutos.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                <Package className="h-8 w-8 opacity-20" />
                Sem dados
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.topProdutos.map((p, i) => {
                  const max = data.topProdutos[0]?.total || 1;
                  const pct = Math.round((p.total / max) * 100);
                  return (
                    <div key={p.nome} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[60%] flex items-center gap-1">
                          <span className={`text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? "bg-green-500 text-white" : i === 1 ? "bg-green-400 text-white" : i === 2 ? "bg-green-300 text-white" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                          {p.nome}
                        </span>
                        <span className="text-muted-foreground font-mono">{p.qtd} un</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Últimos orçamentos do dia ── */}
      {data && data.ultimosHoje.length > 0 && (
        <div>
          <SectionTitle>Orçamentos de Hoje</SectionTitle>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nº</th>
                      <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</th>
                      <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ultimosHoje.map((v: { id: number; clienteNome: string; total: number; status: string }) => {
                      const st = STATUS_VENDA_LABEL[v.status] ?? { label: v.status, color: "bg-gray-100 text-gray-700 border-gray-200" };
                      return (
                        <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono font-semibold text-foreground">#{v.id}</td>
                          <td className="p-3 text-foreground">{v.clienteNome}</td>
                          <td className="p-3 text-right font-mono font-semibold text-emerald-600">{fmt(v.total)}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full border ${st.color}`}>{st.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t">
                <Link href="/vendas">
                  <button className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                    <FileText className="h-3.5 w-3.5" /> Ver todos os orçamentos <ArrowRight className="h-3 w-3" />
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Acesso rápido ── */}
      <div>
        <SectionTitle>Acesso Rápido</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Nova Venda", href: "/vendas", color: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", icon: TrendingUp },
            { label: "Catálogos", href: "/catalogos-venda", color: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800", icon: BookOpen },
            { label: "Estoque", href: "/estoque", color: "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800", icon: Package },
            { label: "Clientes", href: "/clientes", color: "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800", icon: Users },
            { label: "Financeiro", href: "/financeiro", color: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800", icon: Clock },
            { label: "Compras", href: "/compras", color: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800", icon: ShoppingCart },
          ].map(item => (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-center text-sm font-medium cursor-pointer hover:shadow-md transition-all ${item.color}`}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
