'use client';
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Search, X, Package, Loader2, ZoomIn, ChevronDown, Copy
} from "lucide-react";
import ModalAdicionarPedidoCompra from "@/components/ModalAdicionarPedidoCompra";

interface CatalogoVeilingPublicoProps {
  token: string;
}

const PAGE_SIZE = 100;
const VEILING_CACHE_KEY = "veiling_cache_publico";

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

export default function CatalogoVeilingPublico({ token }: CatalogoVeilingPublicoProps) {
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroProdutor, setFiltroProdutor] = useState("");
  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroCores, setFiltroCores] = useState<string[]>([]);
  
  const [pagina, setPagina] = useState(0);
  const [produtosAcumulados, setProdutosAcumulados] = useState<any[]>([]);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [carregandoMais, setCarregandoMais] = useState(false);
  
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState("");
  const [imagensComErro, setImagensComErro] = useState<Set<string>>(new Set());
  
  const [modalPedido, setModalPedido] = useState<{ nome: string; qtd: number; preco: number } | null>(null);
  
  // Buscar configuração de validade de preços
  const { data: validadeData } = trpc.config.getValidadePrecos.useQuery();
  
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: produtosData, isLoading: loadingProdutos, error: produtosError } = trpc.veiling.listProdutosPublico.useQuery({
    categoria: filtroCategoria || undefined,
    produtor: filtroProdutor || undefined,
    busca: filtroBusca || undefined,
    cores: filtroCores.length > 0 ? filtroCores : undefined,
    limit: PAGE_SIZE,
    offset: pagina * PAGE_SIZE,
  }, { enabled: true, retry: 3, refetchOnWindowFocus: false });

  // Debug: log de erro
  if (produtosError) {
    console.error('[CatalogoVeilingPublico] Erro na query:', produtosError);
  }

  const { data: categorias } = trpc.veiling.getCategorias.useQuery(undefined, {
    refetchInterval: 30000,
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

  // Acumular produtos
  useEffect(() => {
    if (!produtosData) return;
    setTotalProdutos(produtosData.total);
    if (pagina === 0) {
      setProdutosAcumulados(produtosData.items);
    } else {
      setProdutosAcumulados(prev => {
        const ids = new Set(prev.map((p: any) => p.id));
        const novos = produtosData.items.filter((p: any) => !ids.has(p.id));
        return [...prev, ...novos];
      });
    }
    setCarregandoMais(false);
  }, [produtosData, pagina]);

  // Persistir no localStorage
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
        savedAt: Date.now(),
      };
      localStorage.setItem(VEILING_CACHE_KEY, JSON.stringify(cache));
    } catch {}
  }, [produtosAcumulados, totalProdutos, filtroCategoria, filtroProdutor, filtroBusca, filtroCores]);

  // Restaurar posição do scroll
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

  // Resetar ao trocar filtros
  const resetFiltro = useCallback(() => {
    setPagina(0);
    setProdutosAcumulados([]);
    setTotalProdutos(0);
    try { localStorage.removeItem(VEILING_CACHE_KEY); } catch {}
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []);

  // IntersectionObserver para scroll infinito
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingProdutos && !carregandoMais && produtosAcumulados.length < totalProdutos) {
          setCarregandoMais(true);
          setPagina(p => p + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadingProdutos, carregandoMais, produtosAcumulados.length, totalProdutos]);

  const handleFiltroChange = useCallback((tipo: string, valor: any) => {
    resetFiltro();
    switch (tipo) {
      case "categoria":
        setFiltroCategoria(valor);
        setFiltroProdutor("");
        break;
      case "produtor":
        setFiltroProdutor(valor);
        break;
      case "busca":
        setFiltroBusca(valor);
        break;
      case "cores":
        setFiltroCores(valor);
        break;
    }
  }, [resetFiltro]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Lista de Flores Garden Center</h1>
              <p className="text-sm text-muted-foreground">Produtos disponíveis para pedido</p>
              <p className="text-xs text-orange-600">Última atualização: {new Date().toLocaleDateString('pt-BR')} • Preços válidos por {validadeData?.veiling || 7} dias</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Link
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Busca */}
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por nome..."
                value={filtroBusca}
                onChange={(e) => handleFiltroChange("busca", e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Categorias */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  Categoria {filtroCategoria && <span className="ml-1 font-bold">{filtroCategoria}</span>}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="space-y-1">
                  <Button
                    variant={!filtroCategoria ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => handleFiltroChange("categoria", "")}
                  >
                    Todas
                  </Button>
                  {(categorias || []).map(cat => (
                    <Button
                      key={cat}
                      variant={filtroCategoria === cat ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleFiltroChange("categoria", cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Produtores */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  Produtor {filtroProdutor && <span className="ml-1 font-bold">✓</span>}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <Button
                    variant={!filtroProdutor ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => handleFiltroChange("produtor", "")}
                  >
                    Todos
                  </Button>
                  {(produtores || []).map(prod => (
                    <Button
                      key={prod}
                      variant={filtroProdutor === prod ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleFiltroChange("produtor", prod)}
                    >
                      {prod}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Cores */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  🎨 Cor {filtroCores.length > 0 && <span className="ml-1 font-bold">{filtroCores.length}</span>}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="space-y-1">
                  <Button
                    variant={filtroCores.length === 0 ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => handleFiltroChange("cores", [])}
                  >
                    Todas
                  </Button>
                  {(coresDisponiveis || []).map(cor => (
                    <Button
                      key={cor}
                      variant={filtroCores.includes(cor) ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => {
                        const novasCores = filtroCores.includes(cor)
                          ? filtroCores.filter(c => c !== cor)
                          : [...filtroCores, cor];
                        handleFiltroChange("cores", novasCores);
                      }}
                    >
                      {COR_EMOJI[cor] || "🎨"} {cor}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Contador */}
            <div className="text-sm text-muted-foreground ml-auto">
              {produtosAcumulados.length} de {totalProdutos} produtos
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div
        ref={scrollContainerRef}
        className="max-w-7xl mx-auto px-4 py-8 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {produtosAcumulados.length === 0 && !loadingProdutos ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum produto encontrado com os filtros selecionados.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {produtosAcumulados.map(produto => (
                <div key={produto.id} className="bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                  {/* Imagem */}
                  <div
                    className="relative bg-muted aspect-square overflow-hidden cursor-pointer group"
                    onClick={() => {
                      if (produto.imagemUrl) {
                        setLightboxUrl(produto.imagemUrl);
                        setLightboxAlt(produto.nomeCompleto || produto.nome);
                      }
                    }}
                  >
                    {produto.imagemUrl && !imagensComErro.has(produto.id) ? (
                      <>
                        <img
                          src={produto.imagemUrl}
                          alt={produto.nomeCompleto || produto.nome}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (produto.offerId && !img.src.includes('/api/veiling/image')) {
                              img.src = `/api/veiling/image?offerId=${produto.offerId}`;
                            } else {
                              setImagensComErro(prev => new Set([...Array.from(prev), produto.id]));
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                        <div className="flex flex-col items-center gap-1">
                          <Package className="h-12 w-12 text-muted-foreground/40" />
                          <span className="text-xs text-muted-foreground/60 text-center px-2">Sem foto</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 p-3 flex flex-col gap-2">
                    <div>
                      <p className="font-semibold text-sm line-clamp-2">{produto.nomeCompleto || produto.nome}</p>
                      <p className="text-xs text-muted-foreground">{produto.produtor}</p>
                    </div>

                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-lg font-bold text-green-600">R$ {parseFloat(produto.precoVenda).toFixed(2)}</p>
                      </div>
                      {produto.estoqueDisponivel != null && (
                        <span className={`text-sm font-semibold ${
                          produto.estoqueDisponivel > 3 ? 'text-green-600' : 
                          produto.estoqueDisponivel > 0 ? 'text-orange-500' : 
                          'text-red-500'
                        }`}>
                          {Math.floor(produto.estoqueDisponivel / (produto.qtdVenda || 1))} un
                        </span>
                      )}
                    </div>

                    {produto.cor && (
                      <div className="flex items-center gap-1">
                        <span>{COR_EMOJI[produto.cor] || '🎨'}</span>
                        <span className="text-xs text-muted-foreground">{produto.cor}</span>
                      </div>
                    )}

                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-sm mt-auto"
                      onClick={() => setModalPedido({
                        nome: produto.nomeCompleto || produto.nome,
                        qtd: 1,
                        preco: parseFloat(produto.precoVenda)
                      })}
                    >
                      Adicionar ao Carrinho
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sentinel para infinite scroll */}
            <div ref={sentinelRef} className="py-8 text-center">
              {carregandoMais && <Loader2 className="h-6 w-6 animate-spin mx-auto" />}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{lightboxAlt}</DialogTitle>
          </DialogHeader>
          {lightboxUrl && <img src={lightboxUrl} alt={lightboxAlt} className="w-full" />}
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar ao Carrinho */}
      {modalPedido && (
        <ModalAdicionarPedidoCompra
          produtoNome={modalPedido.nome}
          quantidade={modalPedido.qtd}
          precoUnitario={modalPedido.preco}
          onClose={() => setModalPedido(null)}
          forceNovoOrcamento={true}
          origem="catalogo-publico"
        />
      )}
    </div>
  );
}
