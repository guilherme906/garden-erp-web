import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Trash2, Copy, ExternalLink, BookOpen, ShoppingCart, Loader2,
  X, Search, Package, Leaf, Flower2, Eye, Clock, Check,
  ChevronDown, ChevronUp, TrendingUp, Save, Share2, CalendarClock, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type CatalogoItem = {
  id: number;
  catalogoId: number;
  origem: "cooperflora" | "veiling" | "loja";
  produtoId: string;
  nome: string;
  descricao?: string | null;
  preco?: string | null;
  imagemUrl?: string | null;
  unidade?: string | null;
  ordem: number;
};

type Catalogo = {
  id: number;
  titulo: string;
  descricao?: string | null;
  token: string;
  expiresAt: Date | string;
  ativo: number;
  criadoPor?: string | null;
  createdAt: Date | string;
  itens?: CatalogoItem[];
};

type AddItemInput = {
  origem: "cooperflora" | "veiling" | "loja";
  produtoId: string;
  nome: string;
  descricao?: string;
  preco?: string;
  imagemUrl?: string;
  unidade?: string;
};

// ─── Janela Flutuante ─────────────────────────────────────────────────────────
type FloatWindowProps = {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  initialPos?: { x: number; y: number };
};

function FloatWindow({ title, icon, children, onClose, initialPos }: FloatWindowProps) {
  const [pos, setPos] = useState(initialPos || { x: 60, y: 80 });
  const [size, setSize] = useState({ w: 480, h: 520 });
  const [minimized, setMinimized] = useState(false);
  const dragging = useRef(false);
  const resizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragging.current) {
        setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
      }
      if (resizing.current) {
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
          setSize(s => ({
            w: Math.max(320, e.clientX - rect.left),
            h: Math.max(200, e.clientY - rect.top),
          }));
        }
      }
    };
    const onMouseUp = () => { dragging.current = false; resizing.current = false; };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div
      ref={windowRef}
      className="fixed z-50 bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden select-none"
      style={{ left: pos.x, top: pos.y, width: size.w, height: minimized ? "auto" : size.h, minWidth: 320 }}
    >
      {/* Header arrastável */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-muted/60 border-b cursor-move shrink-0"
        onMouseDown={e => {
          dragging.current = true;
          dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(m => !m)} className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground">
            {minimized ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {/* Conteúdo */}
      {!minimized && (
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      )}
      {/* Handle de resize */}
      {!minimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={e => { e.stopPropagation(); resizing.current = true; }}
          style={{ background: "transparent" }}
        />
      )}
    </div>
  );
}

// ─── Janela: Cooperflora ──────────────────────────────────────────────────────
function JanelaCooperflora({ onAdd }: { onAdd: (item: AddItemInput) => void }) {
  const [buscaInput, setBuscaInput] = useState("");
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState("TODOS");
  const [visiveis, setVisiveis] = useState(100);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: rawData, isLoading } = trpc.cooperflora.listar.useQuery({
    nome: busca || undefined,
    grupo: grupo !== "TODOS" ? grupo : undefined,
  });

  const todosProdutos = rawData || [];
  const produtos = todosProdutos.slice(0, visiveis);
  const temMais = visiveis < todosProdutos.length;

  // Resetar visíveis ao mudar filtros
  useEffect(() => { setVisiveis(100); }, [busca, grupo]);

  // Scroll infinito via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !temMais) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisiveis(v => v + 100);
    }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [temMais, produtos.length]);

  // Extrair grupos únicos dos produtos carregados
  const grupos = Array.from(new Set(todosProdutos.map((p: any) => p.grupo).filter(Boolean))).sort() as string[];

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b space-y-1.5 shrink-0">
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={buscaInput}
              onChange={e => {
                const v = e.target.value;
                setBuscaInput(v);
                clearTimeout((window as any).__janelaCoopBuscaTimer);
                (window as any).__janelaCoopBuscaTimer = setTimeout(() => setBusca(v), 400);
              }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  clearTimeout((window as any).__janelaCoopBuscaTimer);
                  setBusca(buscaInput);
                }
              }}
              placeholder="Buscar produto..."
              className="pl-7 h-8 text-xs"
            />
          </div>
          <Select value={grupo} onValueChange={setGrupo}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              {grupos.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">{todosProdutos.length} produto{todosProdutos.length !== 1 ? "s" : ""}{temMais ? ` · mostrando ${visiveis}` : ""}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Nenhum produto encontrado</div>
        ) : (
          <div className="divide-y">
            {produtos.map((p: any) => (
              <div key={`${p.codigo}-${p.qualidade}`} className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent/40 group">
                {p.imagemUrl ? (
                  <img src={p.imagemUrl} alt={p.nome} className="h-10 w-10 object-cover rounded shrink-0 bg-muted" onError={e => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }} />
                ) : (
                  <div className="h-10 w-10 rounded shrink-0 bg-muted flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">sem foto</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.nome}</p>
                  {(() => {
                    const precoHaste = Number(p.precoVendaMax || p.precoVendaMin || p.precoMax || p.precoMin || 0);
                    const hastes = Number(p.hastes) || 1;
                    const precoPacote = precoHaste * hastes;
                    return (
                      <p className="text-xs text-muted-foreground">
                        {p.qualidade}{hastes > 1 ? ` · ${hastes} hastes` : ''} · R$ {precoPacote.toFixed(2)}
                      </p>
                    );
                  })()}
                </div>
                <button
                  onClick={() => {
                    const precoHaste = Number(p.precoVendaMax || p.precoVendaMin || p.precoMax || p.precoMin || 0);
                    const hastes = Number(p.hastes) || 1;
                    const precoPacote = precoHaste * hastes;
                    onAdd({
                      origem: "cooperflora",
                      produtoId: `${p.codigo}_${p.qualidade}`,
                      nome: p.nome,
                      descricao: `${p.qualidade}${hastes > 1 ? ` · ${hastes} hastes` : ''}`,
                      preco: precoPacote.toFixed(2),
                      imagemUrl: p.imagemUrl || undefined,
                      unidade: hastes > 1 ? `maço c/${hastes}` : "un",
                    });
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-colors shrink-0"
                  title="Adicionar ao catálogo"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {temMais && (
              <div ref={sentinelRef} className="flex items-center justify-center py-3">
                <span className="text-xs text-muted-foreground">Role para carregar mais...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Janela: Veiling ──────────────────────────────────────────────────────────
// Mapeamento de cor → emoji visual (igual ao CatalogoVeiling)
const COR_EMOJI_VENDA: Record<string, string> = {
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

// Helper: badge de status do produto Veiling
function StatusBadgeVeiling({ status }: { status?: string | null }) {
  if (!status) return null;
  if (status === 'LKP_RECEPCIONADO') {
    return <span className="inline-flex items-center px-1 py-0 rounded text-[9px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 whitespace-nowrap">RECEPCIONADO LKP</span>;
  }
  if (status === 'ENP') {
    return <span className="inline-flex items-center px-1 py-0 rounded text-[9px] font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 whitespace-nowrap">ESTQ NO PROD. ENP</span>;
  }
  if (status === 'LKP_SITIO') {
    return <span className="inline-flex items-center px-1 py-0 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 whitespace-nowrap">NO SITIO LKP</span>;
  }
  return null;
}

function JanelaVeiling({ onAdd }: { onAdd: (item: AddItemInput) => void }) {
  const [buscaInput, setBuscaInput] = useState("");
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("TODOS");
  const [cor, setCor] = useState("TODAS");
  const [offset, setOffset] = useState(0);
  const [acumulados, setAcumulados] = useState<any[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Rastrear qual offset já foi processado para evitar duplicatas
  const processedOffsetRef = useRef<number>(-1);
  const PAGE = 100;

  const { data: rawData, isLoading, isFetching } = trpc.veiling.listProdutos.useQuery({
    busca: busca || undefined,
    categoria: categoria !== "TODOS" ? categoria : undefined,
    cor: cor !== "TODAS" ? cor : undefined,
    limit: PAGE,
    offset,
  }, { keepPreviousData: true } as any);

  const { data: categoriasData } = trpc.veiling.getCategorias.useQuery();
  const { data: coresData } = trpc.veiling.getCores.useQuery();
  const categorias = (categoriasData as any)?.categorias || [];
  const coresDisponiveis = (coresData as any)?.cores || [];

  // Ao mudar filtros, resetar
  useEffect(() => {
    setOffset(0);
    setAcumulados([]);
    processedOffsetRef.current = -1;
  }, [busca, categoria, cor]);

  // Acumular páginas — só processa quando rawData corresponde ao offset atual
  useEffect(() => {
    if (!rawData?.items) return;
    // Evitar reprocessar o mesmo offset
    if (processedOffsetRef.current === offset) return;
    processedOffsetRef.current = offset;
    if (offset === 0) {
      setAcumulados(rawData.items);
    } else {
      setAcumulados(prev => {
        const existingIds = new Set(prev.map((p: any) => p.id));
        const novos = rawData.items.filter((p: any) => !existingIds.has(p.id));
        return [...prev, ...novos];
      });
    }
  }, [rawData?.items, offset]);

  const total = rawData?.total ?? 0;
  const temMais = acumulados.length < total;

  // Scroll infinito via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !temMais || isFetching) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setOffset(prev => prev + PAGE);
    }, { threshold: 0.1 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [temMais, isFetching, acumulados.length]);

  const getImageUrl = (p: any) => {
    const url = p.fotoConversao || p.imagemUrl;
    if (!url) return undefined;
    if (url.startsWith("http://")) return `/api/veiling/foto?url=${encodeURIComponent(url)}`;
    return url;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b space-y-1.5 shrink-0">
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={buscaInput}
              onChange={e => {
                const v = e.target.value;
                setBuscaInput(v);
                clearTimeout((window as any).__janelaVeilingBuscaTimer);
                (window as any).__janelaVeilingBuscaTimer = setTimeout(() => setBusca(v), 400);
              }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  clearTimeout((window as any).__janelaVeilingBuscaTimer);
                  setBusca(buscaInput);
                }
              }}
              placeholder="Buscar por nome completo ou abreviado..."
              className="pl-7 h-8 text-xs"
            />
          </div>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas</SelectItem>
              {(categorias as any[] || []).map((c: any) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Select value={cor} onValueChange={setCor}>
          <SelectTrigger className="h-8 text-xs w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">🎨 Todas as cores</SelectItem>
            {((coresDisponiveis as any[]) ?? []).map((c: string) => (
              <SelectItem key={c} value={c}>{COR_EMOJI_VENDA[c] ?? "●"} {c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {total > 0 ? `${acumulados.length} de ${total} produto${total !== 1 ? "s" : ""}` : "Nenhum produto"}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && acumulados.length === 0 ? (
          <div className="flex items-center justify-center h-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : acumulados.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Nenhum produto encontrado</div>
        ) : (
          <div className="divide-y">
            {acumulados.map((p: any) => {
              const imgUrl = getImageUrl(p);
              return (
                <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent/40 group">
                  {imgUrl ? (
                    <img src={imgUrl} alt={p.nome} className="h-10 w-10 object-cover rounded shrink-0 bg-muted" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="h-10 w-10 rounded shrink-0 bg-muted flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground">sem foto</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <p className="text-xs font-medium truncate">{p.nomeCompleto || p.nome}</p>
                      <StatusBadgeVeiling status={(p as any).statusProduto} />
                    </div>
                    {(() => {
                      const precoFinal = Number(p.precoVenda || 0);
                      const qtdVenda = Number(p.qtdVenda) || Number(p.multiplo) || 1;
                      const freteUnit = Number(p.freteUnit || 0);
                      const valorIcmsUnit = Number(p.valorIcmsUnit || 0);
                      return (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {p.categoria}{qtdVenda > 1 ? ` · ${qtdVenda} un` : ''} · <span className="font-medium text-foreground">R$ {precoFinal.toFixed(2)}</span>
                          </p>
                          {(freteUnit > 0 || valorIcmsUnit > 0) && (
                            <p className="text-[10px] text-muted-foreground/70 leading-tight">
                              {freteUnit > 0 && (
                                <span className="text-blue-500">frete R$ {freteUnit.toFixed(2)}/un</span>
                              )}
                              {freteUnit > 0 && valorIcmsUnit > 0 && <span> · </span>}
                              {valorIcmsUnit > 0 && (
                                <span className="text-red-500">ICMS R$ {valorIcmsUnit.toFixed(2)}/un</span>
                              )}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => {
                      const precoFinal = Number(p.precoVenda || 0);
                      const qtdVenda = Number(p.qtdVenda) || Number(p.multiplo) || 1;
                      onAdd({
                        origem: "veiling",
                        produtoId: String((p as any).offerId ?? p.id),
                        nome: p.nomeCompleto || p.nome,
                        descricao: `${p.categoria}${qtdVenda > 1 ? ` · ${qtdVenda} un` : ''}`,
                        preco: precoFinal.toFixed(2),
                        imagemUrl: imgUrl,
                        unidade: p.embalagem || (qtdVenda > 1 ? `cx c/${qtdVenda}` : "un"),
                      });
                    }}
                    className="h-6 w-6 flex items-center justify-center rounded bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-colors shrink-0"
                    title="Adicionar ao catálogo"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            {temMais && (
              <div ref={sentinelRef} className="flex items-center justify-center py-3">
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <span className="text-xs text-muted-foreground">Role para carregar mais...</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Janela: Produtos Loja ────────────────────────────────────────────────────
function JanelaProdutosLoja({ onAdd }: { onAdd: (item: AddItemInput) => void }) {
  const [busca, setBusca] = useState("");
  const { data: rawData, isLoading } = trpc.loja.listar.useQuery({
    busca: busca || undefined,
    ativo: 1,
    limit: 200,
    offset: 0,
  });

  const produtos = rawData?.items || [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b space-y-1.5 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar produto da loja..." className="pl-7 h-8 text-xs" />
        </div>
        <p className="text-xs text-muted-foreground">{produtos.length} produto{produtos.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Nenhum produto encontrado</div>
        ) : (
          <div className="divide-y">
            {produtos.map((p: any) => (
              <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent/40 group">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">{p.departamento || p.unidade} · R$ {Number(p.preco || 0).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => onAdd({
                    origem: "loja",
                    produtoId: String(p.id),
                    nome: p.nome,
                    descricao: p.descricao || p.departamento,
                    preco: String(p.preco || 0),
                    imagemUrl: undefined,
                    unidade: p.unidade || "un",
                  })}
                  className="h-6 w-6 flex items-center justify-center rounded bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-colors shrink-0"
                  title="Adicionar ao catálogo"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal de Criação de Catálogo ─────────────────────────────────────────────
function ModalCriarCatalogo({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: number) => void }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(168);
  const criarMut = trpc.catalogosVenda.criar.useMutation({
    onSuccess: (data) => {
      toast.success("Catálogo criado com sucesso!");
      onCreated(data.id);
      onClose();
      setTitulo(""); setDescricao(""); setExpiresInHours(168);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Novo Catálogo de Venda</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Título do Catálogo *</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Flores Semana 20/04" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição (opcional)</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição do catálogo para o cliente..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Prazo de Validade do Link</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "1 hora", hours: 1 },
                { label: "6 horas", hours: 6 },
                { label: "12 horas", hours: 12 },
                { label: "24 horas", hours: 24 },
                { label: "3 dias", hours: 72 },
                { label: "7 dias", hours: 168 },
                { label: "15 dias", hours: 360 },
                { label: "30 dias", hours: 720 },
                { label: "90 dias", hours: 2160 },
              ].map(opt => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setExpiresInHours(opt.hours)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    expiresInHours === opt.hours
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>⏰</span>
              O link expira em{" "}
              <strong>
                {expiresInHours < 24
                  ? `${expiresInHours} hora${expiresInHours > 1 ? "s" : ""}`
                  : `${Math.round(expiresInHours / 24)} dia${Math.round(expiresInHours / 24) > 1 ? "s" : ""}`}
              </strong>{" "}após a geração.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => criarMut.mutate({ titulo, descricao, expiresInHours })} disabled={!titulo.trim() || criarMut.isPending}>
            {criarMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Criar Catálogo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal de Prorrogação de Catálogo ───────────────────────────────────────
const OPCOES_PRORROGACAO = [
  { label: "+24 horas", hours: 24 },
  { label: "+48 horas", hours: 48 },
  { label: "+72 horas", hours: 72 },
  { label: "+7 dias",   hours: 168 },
  { label: "+15 dias",  hours: 360 },
  { label: "+30 dias",  hours: 720 },
  { label: "+90 dias",  hours: 2160 },
];
function ModalProrrogarCatalogo({
  catalogoId,
  expiresAt,
  open,
  onClose,
}: {
  catalogoId: number;
  expiresAt: Date | string;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [horasAdicionais, setHorasAdicionais] = useState(168);
  const expirado = new Date(expiresAt) < new Date();
  const prorrogarMut = trpc.catalogosVenda.prorrogar.useMutation({
    onSuccess: (data) => {
      const nova = new Date(data.novaExpiracao);
      toast.success(
        `Catálogo válido até ${nova.toLocaleDateString("pt-BR")} às ${nova.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
        { duration: 5000 }
      );
      utils.catalogosVenda.list.invalidate();
      utils.catalogosVenda.getById.invalidate({ id: catalogoId });
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-amber-500" />
            Prorrogar Catálogo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border p-3 bg-muted/40 text-sm space-y-1">
            <p className="text-muted-foreground text-xs">Validade atual</p>
            <p className={cn("font-medium", expirado ? "text-destructive" : "text-foreground")}>
              {expirado ? "⚠️ Expirado em " : "✅ Válido até "}
              {new Date(expiresAt).toLocaleDateString("pt-BR")} às{" "}
              {new Date(expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Adicionar tempo</Label>
            <div className="grid grid-cols-2 gap-2">
              {OPCOES_PRORROGACAO.map(opt => (
                <button
                  key={opt.hours}
                  type="button"
                  onClick={() => setHorasAdicionais(opt.hours)}
                  className={cn(
                    "py-2 px-3 rounded-lg text-sm font-medium border transition-colors text-left",
                    horasAdicionais === opt.hours
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-950/20 text-sm">
            <p className="text-muted-foreground text-xs mb-1">Nova validade</p>
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              {(() => {
                const base = expirado ? new Date() : new Date(expiresAt);
                const nova = new Date(base.getTime() + horasAdicionais * 60 * 60 * 1000);
                return `${nova.toLocaleDateString("pt-BR")} às ${nova.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
              })()}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => prorrogarMut.mutate({ id: catalogoId, horasAdicionais })}
            disabled={prorrogarMut.isPending}
          >
            {prorrogarMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarClock className="h-4 w-4 mr-2" />}
            Prorrogar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// ─── Editor de Catálogo ───────────────────────────────────────────────────────
function EditorCatalogo({ catalogoId, onBack }: { catalogoId: number; onBack: () => void }) {
  const utils = trpc.useUtils();
  const [showCooperflora, setShowCooperflora] = useState(false);
  const [showVeiling, setShowVeiling] = useState(false);
  const [showLoja, setShowLoja] = useState(false);
  const [linkCopiado, setLinkCopiado] = useState(false);

  const { data: catalogo, isLoading } = trpc.catalogosVenda.getById.useQuery({ id: catalogoId }, { refetchInterval: 60000, refetchOnWindowFocus: false });
  // Contador temporário para IDs otimistas
  const tempIdRef = useRef(-1);

  const addItemMut = trpc.catalogosVenda.addItem.useMutation({
    onMutate: async (input) => {
      // Cancelar queries em andamento para não sobrescrever o otimismo
      await utils.catalogosVenda.getById.cancel({ id: catalogoId });
      const prev = utils.catalogosVenda.getById.getData({ id: catalogoId });
      const tempId = tempIdRef.current--;
      utils.catalogosVenda.getById.setData({ id: catalogoId }, (old: any) => {
        if (!old) return old;
        const novoItem = {
          id: tempId,
          catalogoId: input.catalogoId,
          origem: input.origem,
          produtoId: input.produtoId,
          nome: input.nome,
          descricao: input.descricao || null,
          preco: input.preco != null ? String(input.preco) : null,
          imagemUrl: input.imagemUrl || null,
          unidade: input.unidade || null,
          ordem: 0,
          createdAt: new Date(),
        };
        return { ...old, itens: [...(old.itens || []), novoItem] };
      });
      return { prev };
    },
    onError: (e, _input, ctx: any) => {
      // Reverter em caso de erro
      if (ctx?.prev) utils.catalogosVenda.getById.setData({ id: catalogoId }, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => {
      // Sincronizar com o servidor após a mutation
      utils.catalogosVenda.getById.invalidate({ id: catalogoId });
    },
  });
  const removeItemMut = trpc.catalogosVenda.removeItem.useMutation({
    onMutate: async (input) => {
      await utils.catalogosVenda.getById.cancel({ id: catalogoId });
      const prev = utils.catalogosVenda.getById.getData({ id: catalogoId });
      utils.catalogosVenda.getById.setData({ id: catalogoId }, (old: any) => {
        if (!old) return old;
        return { ...old, itens: (old.itens || []).filter((i: any) => i.id !== input.itemId) };
      });
      return { prev };
    },
    onError: (e, _input, ctx: any) => {
      if (ctx?.prev) utils.catalogosVenda.getById.setData({ id: catalogoId }, ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => {
      utils.catalogosVenda.getById.invalidate({ id: catalogoId });
    },
  });

  const handleAdd = useCallback((item: AddItemInput) => {
    addItemMut.mutate({
      catalogoId,
      origem: item.origem,
      produtoId: item.produtoId,
      nome: item.nome,
      descricao: item.descricao,
      preco: item.preco ? Number(item.preco) : undefined,
      imagemUrl: item.imagemUrl,
      unidade: item.unidade,
    });
    toast.success(`"${item.nome.substring(0, 30)}" adicionado!`, { duration: 1500 });
  }, [catalogoId, addItemMut]);

  const copiarLink = () => {
    if (!catalogo) return;
    const url = `${window.location.origin}/catalogo/${catalogo.token}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopiado(true);
      toast.success("Link copiado!");
      setTimeout(() => setLinkCopiado(false), 2000);
    });
  };

  const abrirLink = () => {
    if (!catalogo) return;
    window.open(`${window.location.origin}/catalogo/${catalogo.token}`, "_blank");
  };

  if (isLoading) return <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!catalogo) return <div className="text-center py-8 text-muted-foreground">Catálogo não encontrado</div>;

  const expirado = new Date(catalogo.expiresAt) < new Date();
  const itens = catalogo.itens || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-xs">
          ← Voltar
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate">{catalogo.titulo}</h2>
          <p className="text-xs text-muted-foreground">
            {itens.length} produto{itens.length !== 1 ? "s" : ""} ·{" "}
            {expirado
              ? <span className="text-destructive">Link expirado</span>
              : <span className="text-green-600">Válido até {new Date(catalogo.expiresAt).toLocaleDateString("pt-BR")}</span>
            }
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={copiarLink} className="gap-1 text-xs h-8">
            {linkCopiado ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            Copiar Link
          </Button>
          <Button variant="outline" size="sm" onClick={abrirLink} className="gap-1 text-xs h-8">
            <ExternalLink className="h-3.5 w-3.5" /> Abrir Link
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs h-8"
            onClick={() => {
              toast.success("Catálogo salvo com sucesso!");
            }}
          >
            <Save className="h-3.5 w-3.5" /> Salvar
          </Button>
          <Button
            size="sm"
            className="gap-1 text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              copiarLink();
              toast.success("Link copiado! Compartilhe com seus clientes.");
            }}
          >
            <Share2 className="h-3.5 w-3.5" /> Compartilhar
          </Button>
        </div>
      </div>

      {/* Botões para abrir janelas flutuantes */}
      <div className="flex gap-2 flex-wrap items-center">
        <p className="text-sm text-muted-foreground">Adicionar produtos do catálogo:</p>
        <Button
          variant={showCooperflora ? "default" : "outline"}
          size="sm"
          onClick={() => setShowCooperflora(v => !v)}
          className="gap-1.5 h-8 text-xs"
        >
          <Leaf className="h-3.5 w-3.5" /> Cooperflora
        </Button>
        <Button
          variant={showVeiling ? "default" : "outline"}
          size="sm"
          onClick={() => setShowVeiling(v => !v)}
          className="gap-1.5 h-8 text-xs"
        >
          <Flower2 className="h-3.5 w-3.5" /> Veiling
        </Button>
        <Button
          variant={showLoja ? "default" : "outline"}
          size="sm"
          onClick={() => setShowLoja(v => !v)}
          className="gap-1.5 h-8 text-xs"
        >
          <Package className="h-3.5 w-3.5" /> Produtos Loja
        </Button>
      </div>

      {/* Lista de itens do catálogo */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            Produtos no Catálogo ({itens.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {itens.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Nenhum produto adicionado ainda.<br />
              Abra um catálogo acima para adicionar produtos.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="w-24">Origem</TableHead>
                  <TableHead className="w-24 text-right">Preço</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(itens as CatalogoItem[]).map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="p-1">
                      {item.imagemUrl ? (
                        <img src={item.imagemUrl} alt={item.nome} className="h-8 w-8 object-cover rounded bg-muted" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{item.nome}</p>
                      {item.descricao && <p className="text-xs text-muted-foreground">{item.descricao}</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{item.origem}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {item.preco ? `R$ ${Number(item.preco).toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => removeItemMut.mutate({ itemId: item.id })}
                        className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Janelas flutuantes */}
      {showCooperflora && (
        <FloatWindow
          title="Cooperflora"
          icon={<Leaf className="h-4 w-4 text-green-600" />}
          onClose={() => setShowCooperflora(false)}
          initialPos={{ x: 40, y: 120 }}
        >
          <JanelaCooperflora onAdd={handleAdd} />
        </FloatWindow>
      )}
      {showVeiling && (
        <FloatWindow
          title="Veiling"
          icon={<Flower2 className="h-4 w-4 text-pink-500" />}
          onClose={() => setShowVeiling(false)}
          initialPos={{ x: 560, y: 120 }}
        >
          <JanelaVeiling onAdd={handleAdd} />
        </FloatWindow>
      )}
      {showLoja && (
        <FloatWindow
          title="Produtos Loja"
          icon={<Package className="h-4 w-4 text-blue-500" />}
          onClose={() => setShowLoja(false)}
          initialPos={{ x: 300, y: 120 }}
        >
          <JanelaProdutosLoja onAdd={handleAdd} />
        </FloatWindow>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function CatalogosVenda() {
  const utils = trpc.useUtils();
  const [showCriar, setShowCriar] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("catalogos");
  const [recusandoPedido, setRecusandoPedido] = useState<{ id: number; nome: string } | null>(null);
  const [prorrogandoCatalogo, setProrrogandoCatalogo] = useState<{ id: number; expiresAt: Date | string } | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");

  const { data: catalogos, isLoading } = trpc.catalogosVenda.list.useQuery();
  const { data: todosPedidos } = trpc.catalogosVenda.listAllPedidos.useQuery();
  const deletarMut = trpc.catalogosVenda.deletar.useMutation({
    onSuccess: () => { utils.catalogosVenda.list.invalidate(); toast.success("Catálogo excluído"); },
    onError: (e) => toast.error(e.message),
  });
  const updateStatusMut = trpc.catalogosVenda.updatePedidoStatus.useMutation({
    onSuccess: () => {
      utils.catalogosVenda.listAllPedidos.invalidate();
      setRecusandoPedido(null);
      setMotivoRecusa("");
    },
    onError: (e) => toast.error(e.message),
  });
  const handleRecusar = () => {
    if (!recusandoPedido) return;
    if (!motivoRecusa.trim()) { toast.error("Informe o motivo da recusa"); return; }
    updateStatusMut.mutate({ pedidoId: recusandoPedido.id, status: "RECUSADO", motivoRecusa: motivoRecusa.trim() });
  };
  const converterMut = trpc.catalogosVenda.converterEmVenda.useMutation({
    onSuccess: (data) => {
      utils.catalogosVenda.listAllPedidos.invalidate();
      toast.success(`Venda #${data.vendaId} criada com sucesso! Acesse o módulo de Vendas para visualizar.`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (editandoId !== null) {
    return <EditorCatalogo catalogoId={editandoId} onBack={() => setEditandoId(null)} />;
  }

  const pedidosNovos = (todosPedidos || []).filter((p: any) => p.status === "NOVO").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Catálogos de Venda
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Crie catálogos com produtos e compartilhe links com clientes</p>
        </div>
        <Button onClick={() => setShowCriar(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Catálogo
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalogos">Catálogos</TabsTrigger>
          <TabsTrigger value="pedidos" className="relative">
            Pedidos Recebidos
            {pedidosNovos > 0 && (
              <Badge className="ml-1.5 h-4 px-1 text-xs bg-destructive text-destructive-foreground">{pedidosNovos}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Catálogos */}
        <TabsContent value="catalogos" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !catalogos || catalogos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">Nenhum catálogo criado ainda</p>
                <Button onClick={() => setShowCriar(true)} variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Criar primeiro catálogo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(catalogos as Catalogo[]).map(cat => {
                const expirado = new Date(cat.expiresAt) < new Date();
                const url = `${window.location.origin}/catalogo/${cat.token}`;
                return (
                  <Card key={cat.id} className={cn("transition-shadow hover:shadow-md", expirado && "opacity-60")}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{cat.titulo}</h3>
                          {cat.descricao && <p className="text-xs text-muted-foreground truncate mt-0.5">{cat.descricao}</p>}
                        </div>
                        <Badge variant={expirado ? "destructive" : cat.ativo ? "default" : "secondary"} className="text-xs shrink-0">
                          {expirado ? "Expirado" : cat.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {expirado ? "Expirado em " : "Válido até "}
                        {new Date(cat.expiresAt).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(cat.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-1" onClick={() => setEditandoId(cat.id)}>
                          <Eye className="h-3 w-3" /> Editar
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-1" onClick={() => {
                          navigator.clipboard.writeText(url);
                          toast.success("Link copiado!");
                        }}>
                          <Copy className="h-3 w-3" /> Link
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          onClick={() => setProrrogandoCatalogo({ id: cat.id, expiresAt: cat.expiresAt })}
                        >
                          <CalendarClock className="h-3 w-3" /> Prorrogar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => { if (confirm("Excluir este catálogo?")) deletarMut.mutate({ id: cat.id }); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab: Pedidos Recebidos */}
        <TabsContent value="pedidos" className="mt-4">
          {!todosPedidos || todosPedidos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">Nenhum pedido recebido ainda</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(todosPedidos as any[]).map(pedido => (
                <Card key={pedido.id} className={cn(pedido.status === "NOVO" && "border-primary/50 bg-primary/5")}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{pedido.clienteNome}</span>
                          <Badge
                            variant={pedido.status === "APROVADO" ? "default" : (pedido.status === "CANCELADO" || pedido.status === "RECUSADO") ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {pedido.status === "RECUSADO" ? "Recusado" : pedido.status === "APROVADO" ? "Aprovado" : pedido.status === "CANCELADO" ? "Cancelado" : pedido.status === "VISTO" ? "Visto" : "Novo"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">📞 {pedido.clienteTelefone} · Entrega: {pedido.dataEntrega}</p>
                        {pedido.observacao && <p className="text-xs text-muted-foreground italic">"{pedido.observacao}"</p>}
                        {pedido.motivoRecusa && (
                          <p className="text-xs text-red-600 font-medium">⚠ Recusa: {pedido.motivoRecusa}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{new Date(pedido.createdAt).toLocaleString("pt-BR")}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {pedido.vendaId && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md px-2 py-1">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Convertido — Venda #{pedido.vendaId}
                          </div>
                        )}
                        <Select value={pedido.status} onValueChange={v => {
                          if (v === 'RECUSADO') {
                            setRecusandoPedido({ id: pedido.id, nome: pedido.clienteNome });
                            setMotivoRecusa("");
                          } else {
                            updateStatusMut.mutate({ pedidoId: pedido.id, status: v as any });
                          }
                        }}>
                          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NOVO">Novo</SelectItem>
                            <SelectItem value="VISTO">Visto</SelectItem>
                            <SelectItem value="APROVADO">Aprovado</SelectItem>
                            <SelectItem value="CANCELADO">Cancelado</SelectItem>
                            <SelectItem value="RECUSADO">Recusar pedido</SelectItem>
                          </SelectContent>
                        </Select>
                        {pedido.status !== "CANCELADO" && (
                          pedido.vendaId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1 border-muted text-muted-foreground cursor-not-allowed opacity-50"
                              disabled
                              title={`Já convertido na Venda #${pedido.vendaId}`}
                            >
                              <ShieldCheck className="h-3 w-3" />
                              Já Convertido
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1 border-green-600 text-green-700 hover:bg-green-50"
                              onClick={() => {
                                if (confirm(`Converter pedido de ${pedido.clienteNome} em venda?`)) {
                                  converterMut.mutate({ pedidoId: pedido.id });
                                }
                              }}
                              disabled={converterMut.isPending}
                            >
                              {converterMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />}
                              Converter em Venda
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                    {pedido.itens && pedido.itens.length > 0 && (
                      <div className="mt-3 border-t pt-3">
                        <p className="text-xs font-medium mb-1.5">Itens solicitados:</p>
                        <div className="space-y-1">
                          {pedido.itens.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{item.quantidade}x {item.nome}</span>
                              <span className="font-mono">
                                {item.subtotal
                                  ? `R$ ${Number(item.subtotal).toFixed(2)}`
                                  : item.preco
                                    ? `R$ ${(Number(item.preco) * item.quantidade).toFixed(2)}`
                                    : "-"}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs font-semibold pt-1 border-t">
                            <span>Total</span>
                            <span className="font-mono text-primary">
                              R$ {pedido.itens.reduce((s: number, i: any) => s + (i.subtotal ? Number(i.subtotal) : Number(i.preco || 0) * i.quantidade), 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ModalCriarCatalogo open={showCriar} onClose={() => setShowCriar(false)} onCreated={id => setEditandoId(id)} />
      {/* Modal de Prorrogação */}
      {prorrogandoCatalogo && (
        <ModalProrrogarCatalogo
          catalogoId={prorrogandoCatalogo.id}
          expiresAt={prorrogandoCatalogo.expiresAt}
          open={!!prorrogandoCatalogo}
          onClose={() => setProrrogandoCatalogo(null)}
        />
      )}
      {/* Modal de Recusa de Pedido */}
      <Dialog open={!!recusandoPedido} onOpenChange={open => { if (!open) { setRecusandoPedido(null); setMotivoRecusa(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <X className="h-5 w-5" /> Recusar Pedido
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Você está recusando o pedido de <strong>{recusandoPedido?.nome}</strong>. Informe o motivo para que fique registrado no histórico.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="motivo-recusa">Motivo da recusa <span className="text-red-500">*</span></Label>
              <Textarea
                id="motivo-recusa"
                placeholder="Ex: Produto sem estoque, data de entrega indisponível, pedido fora da área de atendimento..."
                value={motivoRecusa}
                onChange={e => setMotivoRecusa(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRecusandoPedido(null); setMotivoRecusa(""); }}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleRecusar}
              disabled={updateStatusMut.isPending || !motivoRecusa.trim()}
            >
              {updateStatusMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
