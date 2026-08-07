import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ExcelImportExport } from "@/components/ExcelImportExport";
import {
  Plus, Search, X, Edit2, Trash2, Package, ChevronDown, ChevronUp,
  Tag, Layers, DollarSign, Archive, ToggleLeft, ToggleRight, Camera, ImageIcon, Info
} from "lucide-react";

const LOJA_CACHE_KEY = "loja_produtos_cache";
const PAGE_SIZE = 80;

interface ProdutoLoja {
  id: number;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  unidade: string;
  departamento: string;
  preco: string;
  precoCusto: string | null;
  estoque: string;
  ativo: number;
  imagemUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UNIDADES = ["UN", "CX", "KG", "G", "L", "ML", "M", "M²", "M³", "PC", "DZ", "FD", "BDL", "PT"];

function emptyForm() {
  return {
    codigo: "",
    nome: "",
    descricao: "",
    unidade: "UN",
    departamento: "",
    preco: "",
    precoCusto: "",
    estoque: "0",
    ativo: 1,
    imagemUrl: "",
  };
}

export default function CadastroProdutosLoja() {
  // ── Estado de filtros (com persistência)
  const [filtroBusca, setFiltroBusca] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOJA_CACHE_KEY) || "{}").filtroBusca || ""; } catch { return ""; }
  });
  const [buscaInput, setBuscaInput] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOJA_CACHE_KEY) || "{}").filtroBusca || ""; } catch { return ""; }
  });
  const [filtroDepartamento, setFiltroDepartamento] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOJA_CACHE_KEY) || "{}").filtroDepartamento || ""; } catch { return ""; }
  });
  const [filtroAtivo, setFiltroAtivo] = useState<number | undefined>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(LOJA_CACHE_KEY) || "{}").filtroAtivo;
      return v !== undefined ? v : undefined;
    } catch { return undefined; }
  });

  // ── Estado de scroll infinito (com persistência)
  const [pagina, setPagina] = useState(0);
  const [produtosAcumulados, setProdutosAcumulados] = useState<ProdutoLoja[]>(() => {
    try { return JSON.parse(localStorage.getItem(LOJA_CACHE_KEY) || "{}").produtos || []; } catch { return []; }
  });
  const [totalProdutos, setTotalProdutos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOJA_CACHE_KEY) || "{}").total || 0; } catch { return 0; }
  });
  const [carregandoMais, setCarregandoMais] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Estado de modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<ProdutoLoja | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [confirmDelete, setConfirmDelete] = useState<ProdutoLoja | null>(null);
  const [expandFiltros, setExpandFiltros] = useState(false);

  // ── Queries
  const { data: produtosData, isLoading, isFetching } = trpc.loja.listar.useQuery({
    busca: filtroBusca || undefined,
    departamento: filtroDepartamento || undefined,
    ativo: filtroAtivo,
    limit: PAGE_SIZE,
    offset: pagina * PAGE_SIZE,
  });
  const { data: departamentos } = trpc.loja.listDepartamentos.useQuery();

  // ── Acumular produtos
  useEffect(() => {
    if (!produtosData) return;
    setTotalProdutos(produtosData.total);
    if (pagina === 0) {
      setProdutosAcumulados(produtosData.items as ProdutoLoja[]);
    } else {
      setProdutosAcumulados(prev => {
        const ids = new Set(prev.map(p => p.id));
        const novos = (produtosData.items as ProdutoLoja[]).filter(p => !ids.has(p.id));
        return [...prev, ...novos];
      });
    }
    setCarregandoMais(false);
  }, [produtosData, pagina]);

  // ── Persistir no localStorage
  useEffect(() => {
    if (produtosAcumulados.length === 0 && totalProdutos === 0) return;
    try {
      localStorage.setItem(LOJA_CACHE_KEY, JSON.stringify({
        produtos: produtosAcumulados,
        total: totalProdutos,
        filtroBusca,
        filtroDepartamento,
        filtroAtivo,
        savedAt: Date.now(),
      }));
    } catch {}
  }, [produtosAcumulados, totalProdutos, filtroBusca, filtroDepartamento, filtroAtivo]);

  // ── Restaurar scroll
  useEffect(() => {
    try {
      const cache = JSON.parse(localStorage.getItem(LOJA_CACHE_KEY) || "{}");
      if (cache.scrollTop && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = cache.scrollTop;
      }
    } catch {}
    return () => {
      try {
        const cache = JSON.parse(localStorage.getItem(LOJA_CACHE_KEY) || "{}");
        localStorage.setItem(LOJA_CACHE_KEY, JSON.stringify({ ...cache, scrollTop: scrollContainerRef.current?.scrollTop || 0 }));
      } catch {}
    };
  }, []);

  // ── Reset filtros
  const resetFiltro = useCallback(() => {
    setPagina(0);
    setProdutosAcumulados([]);
    setTotalProdutos(0);
    try { localStorage.removeItem(LOJA_CACHE_KEY); } catch {}
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, []);

  // ── IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isFetching && !carregandoMais && produtosAcumulados.length < totalProdutos) {
        setCarregandoMais(true);
        setPagina(prev => prev + 1);
      }
    }, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isFetching, carregandoMais, produtosAcumulados.length, totalProdutos]);

  // ── Mutations
  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.loja.listar.invalidate();
    utils.loja.listDepartamentos.invalidate();
    resetFiltro();
  };

  const criarMut = trpc.loja.criar.useMutation({
    onSuccess: () => { toast.success("Produto criado com sucesso!"); setModalOpen(false); invalidate(); },
    onError: e => toast.error("Erro ao criar produto: " + e.message),
  });
  const atualizarMut = trpc.loja.atualizar.useMutation({
    onSuccess: () => { toast.success("Produto atualizado!"); setModalOpen(false); invalidate(); },
    onError: e => toast.error("Erro ao atualizar: " + e.message),
  });
  const deletarMut = trpc.loja.deletar.useMutation({
    onSuccess: () => { toast.success("Produto excluído."); setConfirmDelete(null); invalidate(); },
    onError: e => toast.error("Erro ao excluir: " + e.message),
  });

  // ── Importar produtos do Excel
  const handleImportarProdutos = async (dados: any[], validacao: any) => {
    try {
      for (const produto of dados) {
        const data = {
          codigo: produto.codigo || undefined,
          nome: produto.nome.trim(),
          descricao: produto.descricao || undefined,
          unidade: produto.unidade || "UN",
          departamento: produto.departamento || "",
          preco: typeof produto.preco === 'number' ? produto.preco : parseFloat(String(produto.preco)) || 0,
          precoCusto: produto.precoCusto ? (typeof produto.precoCusto === 'number' ? produto.precoCusto : parseFloat(String(produto.precoCusto))) : undefined,
          estoque: typeof produto.estoque === 'number' ? produto.estoque : parseFloat(String(produto.estoque)) || 0,
          ativo: produto.ativo,
          imagemUrl: produto.imagemUrl || undefined,
        };

        if (produto.id) {
          await new Promise<void>((resolve, reject) => {
            atualizarMut.mutate({ id: produto.id, ...data }, {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            });
          });
        } else {
          await new Promise<void>((resolve, reject) => {
            criarMut.mutate(data, {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            });
          });
        }
      }
      invalidate();
    } catch (error) {
      console.error("Erro ao importar produtos:", error);
      throw error;
    }
  };

  // ── Abrir modal
  const abrirNovo = () => {
    setEditando(null);
    setForm(emptyForm());
    setModalOpen(true);
  };
  const abrirEditar = (p: ProdutoLoja) => {
    setEditando(p);
    setForm({
      codigo: p.codigo || "",
      nome: p.nome,
      descricao: p.descricao || "",
      unidade: p.unidade,
      departamento: p.departamento,
      preco: p.preco,
      precoCusto: p.precoCusto || "",
      estoque: p.estoque,
      ativo: p.ativo,
      imagemUrl: p.imagemUrl || "",
    });
    setModalOpen(true);
  };

  const [uploadingFoto, setUploadingFoto] = useState(false);

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Foto muito grande. Máximo 5MB."); return; }
    setUploadingFoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const resp = await fetch("/api/upload/produto-loja", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, mimeType: file.type, fileName: file.name }),
        });
        const json = await resp.json();
        if (json.url) {
          setForm(f => ({ ...f, imagemUrl: json.url }));
          toast.success("Foto enviada com sucesso!");
        } else {
          toast.error("Erro ao enviar foto: " + (json.error || "desconhecido"));
        }
        setUploadingFoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Erro ao enviar foto");
      setUploadingFoto(false);
    }
  };

  const salvar = () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    const data = {
      codigo: form.codigo || undefined,
      nome: form.nome.trim(),
      descricao: form.descricao || undefined,
      unidade: form.unidade || "UN",
      departamento: form.departamento || "",
      preco: parseFloat(form.preco) || 0,
      precoCusto: form.precoCusto ? parseFloat(form.precoCusto) : undefined,
      estoque: parseFloat(form.estoque) || 0,
      ativo: form.ativo,
      imagemUrl: form.imagemUrl || undefined,
    };
    if (editando) {
      atualizarMut.mutate({ id: editando.id, ...data });
    } else {
      criarMut.mutate(data);
    }
  };

  const formatPreco = (v: string | null) => v ? `R$ ${Number(v).toFixed(2).replace(".", ",")}` : "—";

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-none border-b bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            <div>
              <h1 className="text-base font-semibold leading-tight">Produtos da Loja</h1>
              <p className="text-xs text-muted-foreground">{totalProdutos} produto{totalProdutos !== 1 ? "s" : ""} cadastrado{totalProdutos !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ExcelImportExport
              produtos={produtosAcumulados}
              departamentos={departamentos || []}
              onImportar={handleImportarProdutos}
              isLoading={isLoading}
            />
            <Button size="sm" onClick={abrirNovo} className="bg-green-600 hover:bg-green-700 text-white gap-1">
              <Plus className="h-4 w-4" /> Novo
            </Button>
          </div>
        </div>

        {/* Aviso sobre produtos de catálogos */}
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-2.5 text-xs text-blue-700 dark:text-blue-400">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>
            Produtos cadastrados via <strong>Compras</strong> são adicionados automaticamente aqui e aparecem como sugestão na tela de <strong>Venda</strong>.
            {" "}Produtos do <strong>Veiling</strong> e <strong>Cooperflora</strong> são exclusivos para pedidos via catálogo e não aparecem nesta lista.
          </span>
        </div>
        {/* Barra de busca */}
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm"
              placeholder="Buscar por nome, código..."
              value={buscaInput}
              onChange={e => setBuscaInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { setFiltroBusca(buscaInput); resetFiltro(); } }}
            />
            {buscaInput && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => { setBuscaInput(""); setFiltroBusca(""); resetFiltro(); }}>
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => setExpandFiltros(v => !v)}>
            <Layers className="h-3.5 w-3.5" />
            {expandFiltros ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>

        {/* Filtros expandidos */}
        {expandFiltros && (
          <div className="mt-2 flex flex-wrap gap-2">
            {/* Departamento */}
            <select
              className="h-7 text-xs border rounded px-2 bg-background"
              value={filtroDepartamento}
              onChange={e => { setFiltroDepartamento(e.target.value); resetFiltro(); }}
            >
              <option value="">Todos os departamentos</option>
              {(departamentos ?? []).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {/* Ativo */}
            <select
              className="h-7 text-xs border rounded px-2 bg-background"
              value={filtroAtivo !== undefined ? String(filtroAtivo) : ""}
              onChange={e => { setFiltroAtivo(e.target.value === "" ? undefined : Number(e.target.value)); resetFiltro(); }}
            >
              <option value="">Todos</option>
              <option value="1">Ativos</option>
              <option value="0">Inativos</option>
            </select>
            {(filtroDepartamento || filtroAtivo !== undefined) && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => { setFiltroDepartamento(""); setFiltroAtivo(undefined); resetFiltro(); }}>
                <X className="h-3 w-3" /> Limpar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Lista */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {isLoading && produtosAcumulados.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Carregando...</div>
        ) : produtosAcumulados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
            <Package className="h-10 w-10 opacity-30" />
            <p className="text-sm">Nenhum produto encontrado</p>
            <Button size="sm" onClick={abrirNovo} className="bg-green-600 hover:bg-green-700 text-white gap-1">
              <Plus className="h-4 w-4" /> Cadastrar primeiro produto
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-xs">Produto</th>
                <th className="px-3 py-2 text-left font-medium text-xs hidden sm:table-cell">Depto</th>
                <th className="px-3 py-2 text-right font-medium text-xs">Custo</th>
                <th className="px-3 py-2 text-right font-medium text-xs">Preço</th>
                <th className="px-3 py-2 text-right font-medium text-xs hidden md:table-cell">Estoque</th>
                <th className="px-3 py-2 text-center font-medium text-xs">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosAcumulados.map((p, i) => (
                <tr key={p.id} className={`border-b transition-colors hover:bg-muted/40 ${i % 2 === 0 ? "" : "bg-muted/20"} ${p.ativo === 0 ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {p.imagemUrl ? (
                        <img src={p.imagemUrl} alt={p.nome} className="h-8 w-8 object-cover rounded shrink-0 bg-muted" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-xs leading-tight">{p.nome}</div>
                        <div className="text-xs text-muted-foreground">{p.codigo ? `#${p.codigo} · ` : ""}{p.unidade}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    {p.departamento ? (
                      <Badge variant="outline" className="text-xs font-normal">{p.departamento}</Badge>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground">{formatPreco(p.precoCusto)}</td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-green-700">{formatPreco(p.preco)}</td>
                  <td className="px-3 py-2 text-right text-xs hidden md:table-cell">{Number(p.estoque).toFixed(3)} {p.unidade}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1 rounded hover:bg-muted" onClick={() => abrirEditar(p)} title="Editar">
                        <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                      </button>
                      <button className="p-1 rounded hover:bg-muted" onClick={() => setConfirmDelete(p)} title="Excluir">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Sentinel scroll infinito */}
        <div ref={sentinelRef} className="h-4" />
        {carregandoMais && (
          <div className="flex items-center justify-center py-3 text-xs text-muted-foreground gap-2">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
            Carregando mais produtos...
          </div>
        )}
        {!carregandoMais && produtosAcumulados.length > 0 && produtosAcumulados.length >= totalProdutos && (
          <div className="text-center py-3 text-xs text-muted-foreground">
            Todos os {totalProdutos} produtos carregados
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 text-green-600" />
              {editando ? "Editar Produto" : "Novo Produto da Loja"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            {/* Nome */}
            <div>
              <label className="text-xs font-medium mb-1 block">Nome *</label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do produto" className="h-8 text-sm" />
            </div>

            {/* Código e Unidade */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block">Código</label>
                <Input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="Ex: 001" className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Unidade</label>
                <select
                  className="h-8 w-full text-sm border rounded px-2 bg-background"
                  value={form.unidade}
                  onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}
                >
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {/* Departamento */}
            <div>
              <label className="text-xs font-medium mb-1 block">Departamento</label>
              <Input
                list="depto-list"
                value={form.departamento}
                onChange={e => setForm(f => ({ ...f, departamento: e.target.value }))}
                placeholder="Ex: Flores, Vasos, Acessórios..."
                className="h-8 text-sm"
              />
              <datalist id="depto-list">
                {(departamentos ?? []).map(d => <option key={d} value={d} />)}
              </datalist>
            </div>

            {/* Preços */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block flex items-center gap-1"><DollarSign className="h-3 w-3" />Custo (R$)</label>
                <Input type="number" min="0" step="0.01" value={form.precoCusto} onChange={e => setForm(f => ({ ...f, precoCusto: e.target.value }))} placeholder="0,00" className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Tag className="h-3 w-3 text-green-600" />Preço Venda (R$)</label>
                <Input type="number" min="0" step="0.01" value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} placeholder="0,00" className="h-8 text-sm" />
              </div>
            </div>

            {/* Estoque */}
            <div>
              <label className="text-xs font-medium mb-1 block flex items-center gap-1"><Archive className="h-3 w-3" />Estoque</label>
              <Input type="number" min="0" step="0.001" value={form.estoque} onChange={e => setForm(f => ({ ...f, estoque: e.target.value }))} placeholder="0" className="h-8 text-sm" />
            </div>

            {/* Descrição */}
            <div>
              <label className="text-xs font-medium mb-1 block">Descrição</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm bg-background resize-none h-16"
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Descrição opcional do produto..."
              />
            </div>

            {/* Foto do Produto */}
            <div>
              <label className="text-xs font-medium mb-1 block flex items-center gap-1">
                <Camera className="h-3 w-3" />Foto do Produto
              </label>
              <div className="flex items-center gap-3">
                {form.imagemUrl ? (
                  <div className="relative shrink-0">
                    <img
                      src={form.imagemUrl}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, imagemUrl: "" }))}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center text-xs"
                      title="Remover foto"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded border border-dashed flex items-center justify-center bg-muted/30 shrink-0">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded border text-xs transition-colors ${
                      uploadingFoto
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "hover:bg-accent hover:border-primary cursor-pointer"
                    }`}>
                      <Camera className="h-3.5 w-3.5" />
                      {uploadingFoto ? "Enviando..." : form.imagemUrl ? "Trocar foto" : "Selecionar foto"}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingFoto}
                      onChange={handleFotoChange}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP · máx. 5MB</p>
                </div>
              </div>
            </div>

            {/* Ativo */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, ativo: f.ativo === 1 ? 0 : 1 }))}
                className="flex items-center gap-2 text-sm"
              >
                {form.ativo === 1
                  ? <ToggleRight className="h-5 w-5 text-green-600" />
                  : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                <span className={form.ativo === 1 ? "text-green-700 font-medium" : "text-muted-foreground"}>
                  {form.ativo === 1 ? "Produto ativo" : "Produto inativo"}
                </span>
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={salvar}
              disabled={criarMut.isPending || atualizarMut.isPending}
            >
              {criarMut.isPending || atualizarMut.isPending ? "Salvando..." : editando ? "Salvar Alterações" : "Criar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja excluir permanentemente o produto <strong>{confirmDelete?.nome}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => confirmDelete && deletarMut.mutate({ id: confirmDelete.id })}
              disabled={deletarMut.isPending}
            >
              {deletarMut.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
