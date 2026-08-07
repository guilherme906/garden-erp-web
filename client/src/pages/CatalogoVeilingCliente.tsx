import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Search, X, Package, Loader2, ShoppingCart, ChevronDown, ZoomIn, Trash2, MoreVertical, Plus
} from "lucide-react";
import ModalAdicionarPedidoCompra from "@/components/ModalAdicionarPedidoCompra";
import { ProductLightbox } from "@/components/ProductLightbox";
import { ModalAdicionarProdutoCustomizado } from "@/components/ModalAdicionarProdutoCustomizado";

const PAGE_SIZE = 500;

const COR_EMOJI: Record<string, string> = {
  BRANCO: "⚪", ROSA: "🌸", VINHO: "🍷",
  AMARELO: "🌼", LARANJA: "🟠", VERMELHO: "🌹", MULTICOLOR: "🌈", VARIADO: "🎨",
};

function QualidadeBadge({ qualidade }: { qualidade?: string | null }) {
  if (!qualidade) return null;
  const cls = qualidade === "A1"
    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
    : qualidade === "A2"
    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
    : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${cls}`}>
      {qualidade}
    </span>
  );
}

// Componente separado para cada produto (permite usar hooks)
function ProdutoCard({ produto, onAddToCart, onZoom }: any) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const qtdVenda = Number(produto.qtdVenda) || Number(produto.multiplo) || 1;
  const estoque = produto.estoqueDisponivel ?? 0;
  const estoqueUnidades = Math.floor(estoque / qtdVenda);
  const precoVenda = produto.precoVenda ? Number(produto.precoVenda) : 0;

  // Prioridade: fotoConversao (proxy) > offerId > imagemUrlCache > imagemUrl
  // Tentar múltiplas estratégias para encontrar uma imagem válida (igual ao sistema interno)
  let imgUrl = null;
  
  // Estratégia 1: fotoConversao via proxy (igual ao sistema interno)
  const rawFoto = (produto as any).fotoConversao as string | null;
  if (rawFoto) {
    imgUrl = rawFoto.startsWith('http://') 
      ? `/api/veiling/foto?url=${encodeURIComponent(rawFoto)}` 
      : rawFoto;
  }
  
  // Estratégia 2: offerId via proxy (mais confiável)
  if (!imgUrl && produto.offerId && String(produto.offerId).trim()) {
    imgUrl = `/api/veiling/image?offerId=${produto.offerId}`;
  }
  
  // Estratégia 3: imagemUrlCache (S3 cacheado)
  if (!imgUrl && produto.imagemUrlCache && !produto.imagemUrlCache.includes('/Default')) {
    imgUrl = produto.imagemUrlCache;
  }
  
  // Estratégia 4: imagemUrl (URL temporária)
  if (!imgUrl && produto.imagemUrl && !produto.imagemUrl.includes('/Default')) {
    imgUrl = produto.imagemUrl;
  }
  
  // Estratégia 5: Tentar gerar URL a partir do ID do produto
  if (!imgUrl && produto.id) {
    imgUrl = `/api/veiling/image?offerId=${produto.id}`;
  }

  return (
    <div className="p-2 sm:p-3 hover:bg-muted/50 transition-colors">
      <div className="flex gap-2 sm:gap-3">
        {/* Foto */}
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-muted rounded overflow-hidden cursor-pointer group relative"
          onClick={() => imgUrl && !imageError && onZoom({ url: imgUrl, alt: produto.nomeCompleto || produto.nome })}
        >
          {imgUrl && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
              )}
              <img
                src={imgUrl}
                alt={produto.nomeCompleto || produto.nome}
                className={`w-full h-full object-cover group-hover:scale-110 transition-transform ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  // Fallback para offerId se fotoConversao falhar
                  if (rawFoto && !img.src.includes('/api/veiling/image') && produto.offerId) {
                    img.src = `/api/veiling/image?offerId=${produto.offerId}`;
                    setImageLoaded(false);
                  } else {
                    setImageError(true);
                    setImageLoaded(false);
                  }
                }}
              />
              {imageLoaded && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                  <ZoomIn className="text-white opacity-0 group-hover:opacity-100 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <div className="text-center">
                <Package className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground/40 mx-auto mb-1" />
                {produto.cor && (
                  <span className="text-2xl">{COR_EMOJI[produto.cor] || "🌸"}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-1 sm:gap-2 mb-0.5 sm:mb-1">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs sm:text-sm line-clamp-2">{produto.nomeCompleto || produto.nome}</p>
              </div>
              {produto.cor && <span className="text-lg">{COR_EMOJI[produto.cor] || "🌸"}</span>}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap mb-0.5 sm:mb-1">
              <QualidadeBadge qualidade={produto.qualidade} />
              {produto.categoria && <span className="text-[9px] sm:text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{produto.categoria}</span>}
            </div>
            <div className="text-[9px] sm:text-xs text-muted-foreground space-y-0.5">
              {produto.produtor && <p>Produtor: {produto.produtor}</p>}
              <p>Estoque: {estoqueUnidades} un</p>
            </div>
          </div>

          {/* Preço e Botão */}
          <div className="flex items-center justify-between gap-1 sm:gap-2 mt-1">
            <span className="font-bold text-green-600 text-xs sm:text-sm whitespace-nowrap">
              R$ {precoVenda.toFixed(2).replace(".", ",")}
            </span>
            <Button
              size="sm"
              onClick={() => onAddToCart(produto)}
              className="h-6 sm:h-7 px-2 text-[10px] sm:text-xs"
              disabled={estoqueUnidades === 0}
            >
              <ShoppingCart className="h-3 w-3" />
              <span className="hidden sm:inline ml-1">Adicionar</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogoVeilingCliente() {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [categoria, setCategoria] = useState("");
  const [coresSelecionadas, setCoresSelecionadas] = useState<string[]>([]);
  const [allProdutos, setAllProdutos] = useState<any[]>([]);
  const [selectedProduto, setSelectedProduto] = useState<any>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; alt: string } | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showCoresDropdown, setShowCoresDropdown] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Query de categorias
  const { data: categoriasData } = trpc.veiling.getCategorias.useQuery();
  const categorias = (categoriasData || []) as string[];

  // Query de cores
  const { data: coresData } = trpc.veiling.getCores.useQuery();
  const cores = (coresData || []) as string[];

  // Query de produtos com infinite scroll - usar versão pública
  const { data: produtosData, isLoading, isFetching } = trpc.veiling.listProdutosPublico.useQuery({
    offset,
    busca: searchTerm,
    categoria: categoria || undefined,
    cores: coresSelecionadas.length > 0 ? coresSelecionadas : undefined,
    limit: PAGE_SIZE,
  });

  // Atualizar lista quando novos produtos chegam
  useEffect(() => {
    if (produtosData?.items) {
      if (offset === 0) {
        // Primeira carga - sempre mostrar produtos
        setAllProdutos(produtosData.items);
      } else {
        // Adicionar mais produtos
        setAllProdutos(prev => [...prev, ...produtosData.items]);
      }
      // Verificar se há mais produtos
      setHasMore((offset + PAGE_SIZE) < (produtosData.total || 0));
    }
  }, [produtosData, offset]);

  // Resetar quando filtro muda
  useEffect(() => {
    setOffset(0);
    setAllProdutos([]);
    setHasMore(true);
  }, [searchTerm, categoria, coresSelecionadas]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isFetching && !isLoading) {
          setOffset(prev => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isFetching, isLoading]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoriaChange = (cat: string) => {
    setCategoria(cat);
  };

  const handleCorToggle = (cor: string) => {
    setCoresSelecionadas(prev =>
      prev.includes(cor)
        ? prev.filter(c => c !== cor)
        : [...prev, cor]
    );
  };

  const handleLimparCores = () => {
    setCoresSelecionadas([]);
  };

  const handleAddToCart = (produto: any) => {
    setSelectedProduto(produto);
    setModalAberto(true);
  };

  const total = produtosData?.total || 0;

  // Recarregar produtos quando um novo é adicionado
  const handleProdutoAdicionado = () => {
    setOffset(0);
    setAllProdutos([]);
    setHasMore(true);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b px-3 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            <div>
              <h1 className="font-semibold text-xs sm:text-sm">GARDEN CENTER PRIMAVERA</h1>
              <p className="text-xs text-muted-foreground">{allProdutos.length} de {total} produtos</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setModalAdicionarAberto(true)}
            className="h-7 sm:h-8 px-2 text-[10px] sm:text-xs"
          >
            <Plus className="h-3 w-3" />
            <span className="hidden sm:inline ml-1">Adicionar</span>
          </Button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 pr-8 h-8 sm:h-9 text-xs sm:text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>

        {/* Categorias */}
        {categorias.length > 0 && (
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2">
            <Button
              variant={categoria === "" ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoriaChange("")}
              className="text-[10px] sm:text-xs whitespace-nowrap h-7 sm:h-8 px-2 sm:px-3"
            >
              Todas ({total})
            </Button>
            {categorias.map((cat) => (
              <Button
                key={cat}
                variant={categoria === cat ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoriaChange(cat)}
                className="text-[10px] sm:text-xs whitespace-nowrap h-7 sm:h-8 px-2 sm:px-3"
              >
                {cat}
              </Button>
            ))}
          </div>
        )}

        {/* Filtro de Cores */}
        {cores.length > 0 && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCoresDropdown(!showCoresDropdown)}
              className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 w-full justify-between"
            >
              <span>
                {coresSelecionadas.length > 0
                  ? `Cores (${coresSelecionadas.length})`
                  : "Selecionar Cores"}
              </span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
            {showCoresDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded shadow-lg z-20 p-2 space-y-1">
                {cores.map((cor) => (
                  <label key={cor} className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={coresSelecionadas.includes(cor)}
                      onChange={() => handleCorToggle(cor)}
                      className="w-3 h-3"
                    />
                    <span>{COR_EMOJI[cor] || "🌸"} {cor}</span>
                  </label>
                ))}
                {coresSelecionadas.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLimparCores}
                    className="text-[10px] w-full mt-2"
                  >
                    Limpar Cores
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && allProdutos.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-muted-foreground" />
          </div>
        ) : allProdutos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Package className="h-6 w-6 sm:h-8 sm:w-8 mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="divide-y">
            {allProdutos.map((produto: any) => (
              <ProdutoCard
                key={produto.id}
                produto={produto}
                onAddToCart={handleAddToCart}
                onZoom={setZoomImage}
              />
            ))}
            {isFetching && (
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground py-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Carregando mais...
              </div>
            )}
            {!hasMore && allProdutos.length > 0 && (
              <div className="flex items-center justify-center text-[10px] text-muted-foreground py-2">
                ✓ Fim da lista
              </div>
            )}
            <div ref={observerTarget} className="h-4" />
          </div>
        )}
      </div>

      {/* Modal e Lightbox */}
      {selectedProduto && modalAberto && (
        <ModalAdicionarPedidoCompra
          produtoNome={selectedProduto.nomeCompleto || selectedProduto.nome}
          quantidade={1}
          precoUnitario={selectedProduto.precoVenda ? Number(selectedProduto.precoVenda) : 0}
          onClose={() => setModalAberto(false)}
          origem="catalogo-publico"
        />
      )}
      <ModalAdicionarProdutoCustomizado
        isOpen={modalAdicionarAberto}
        onClose={() => setModalAdicionarAberto(false)}
        onSuccess={handleProdutoAdicionado}
      />
      {zoomImage && (
        <ProductLightbox
          isOpen={!!zoomImage}
          imageUrl={zoomImage.url}
          productName={zoomImage.alt}
          onClose={() => setZoomImage(null)}
        />
      )}
    </div>
  );
}
