import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import superjson from "superjson";
import {
  Search, X, Package, Loader2, ShoppingCart, Menu, Home, Heart, Trash2, Plus, Minus
} from "lucide-react";
import ModalAdicionarPedidoCompra from "@/components/ModalAdicionarPedidoCompra";
import { ColorFilterDropdown } from "@/components/ColorFilterDropdown";

const PAGE_SIZE = 100; // Carrega 100 produtos por página para scroll infinito

function QualidadeBadge({ qualidade }: { qualidade?: string | null }) {
  if (!qualidade) return null;
  const cls = qualidade === "A1"
    ? "bg-green-100 text-green-700"
    : qualidade === "A2"
    ? "bg-yellow-100 text-yellow-700"
    : "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${cls}`}>
      {qualidade}
    </span>
  );
}

// Item de Lista Horizontal
function ProdutoListItem({ produto, onAddToCart, quantidade, setQuantidade }: any) {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [localQuantidade, setLocalQuantidade] = useState(quantidade);
  const [showZoom, setShowZoom] = useState<boolean>(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const qtdVenda = Number(produto.qtdVenda) || Number(produto.multiplo) || 1;
  // Suportar tanto produtos Veiling quanto customizados
  const estoque = produto.estoqueDisponivel ?? produto.estoque ?? 0;
  const estoqueUnidades = Math.floor(estoque / qtdVenda);
  const precoVenda = produto.precoVenda ? Number(produto.precoVenda) : (produto.preco ? Number(produto.preco) : (produto.precoUnitario ? Number(produto.precoUnitario) : 0));

  // Resolver URL da imagem (suporta Veiling e customizados)
  let imgUrl = null;
  
  // Primeiro tenta fotoUrl dos customizados
  if (produto.fotoUrl && produto.fotoUrl.startsWith('http')) {
    imgUrl = produto.fotoUrl;
  }
  
  // Depois tenta fotoConversao do Veiling
  const rawFoto = (produto as any).fotoConversao as string | null;
  if (!imgUrl && rawFoto) {
    imgUrl = rawFoto.startsWith('http://') 
      ? `/api/veiling/foto?url=${encodeURIComponent(rawFoto)}` 
      : rawFoto;
  }
  if (!imgUrl && produto.offerId && String(produto.offerId).trim()) {
    imgUrl = `/api/veiling/image?offerId=${produto.offerId}`;
  }
  if (!imgUrl && produto.imagemUrlCache && !produto.imagemUrlCache.includes('/Default')) {
    imgUrl = produto.imagemUrlCache;
  }
  if (!imgUrl && produto.imagemUrl && !produto.imagemUrl.includes('/Default')) {
    imgUrl = produto.imagemUrl;
  }
  if (!imgUrl && produto.id) {
    imgUrl = `/api/veiling/image?offerId=${produto.id}`;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        {/* Foto */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (imgUrl) {
              setZoomImageUrl(imgUrl);
              setShowZoom(true);
            }
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (imgUrl) {
              setZoomImageUrl(imgUrl);
              setShowZoom(true);
            }
          }}
          className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden cursor-zoom-in hover:opacity-80 transition-opacity active:opacity-60"
        >
          {imgUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
            <img
              src={imgUrl}
              alt={produto.nomeCompleto || produto.nome}
              className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
            <Package size={20} />
          </div>
          )}
        </button>

        {/* Informações do Produto */}
        <div className="flex-1 min-w-0">
          {/* Primeira Linha: Nome + Qualidade */}
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-gray-800 text-sm flex-1">
              {produto.nomeCompleto || produto.nome}
            </p>
            <QualidadeBadge qualidade={produto.qualidade} />
          </div>

          {/* Segunda Linha: Descrição */}
          {produto.descricao && (
            <p className="text-xs text-gray-600 mb-1">
              {produto.descricao}
            </p>
          )}

          {/* Terceira Linha: Produtor */}
          {produto.produtor && (
            <p className="text-xs text-gray-600 mb-1">
              <span className="font-semibold">Produtor:</span> {produto.produtor}
            </p>
          )}

          {/* Terceira Linha: Preço + Estoque */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-green-700">
                  R$ {precoVenda.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">
                  / {qtdVenda} {produto.unidade || 'un'}
                </span>
              </div>
              {qtdVenda > 1 && (
                <span className="text-xs text-gray-600 border-l border-gray-300 pl-2">
                  <span className="font-semibold">Cada unidade:</span> R$ {(precoVenda / qtdVenda).toFixed(6)}
                </span>
              )}
            </div>
            <span className={`text-xs font-medium ${
              estoqueUnidades > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {estoqueUnidades > 0 ? `${estoqueUnidades} disponível` : 'Sem estoque'}
            </span>
          </div>

          {/* Terceira Linha: Controles */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocalQuantidade(Math.max(1, localQuantidade - 1))}
                className="h-7 w-7 p-0"
              >
                <Minus size={12} />
              </Button>
              <Input
                type="number"
                min="1"
                max={estoqueUnidades}
                value={localQuantidade}
                onChange={(e) => setLocalQuantidade(Math.min(estoqueUnidades, Math.max(1, parseInt(e.target.value) || 1)))}
                className="h-7 w-12 text-center text-xs p-0 border"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocalQuantidade(Math.min(estoqueUnidades, localQuantidade + 1))}
                className="h-7 w-7 p-0"
              >
                <Plus size={12} />
              </Button>
            </div>
            <Button
              onClick={() => onAddToCart(produto, localQuantidade)}
              disabled={estoqueUnidades === 0}
              className="h-9 px-3 bg-green-700 hover:bg-green-800 text-white text-xs gap-1"
            >
              <Plus size={14} />
              Adicionar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Categorias Veiling padrão
const CATEGORIAS_VEILING = [
  { label: "Produto de Corte", value: "Produto de Corte" },
  { label: "Flor Envasada", value: "Flor Envasada" },
  { label: "Planta Ornamental", value: "Planta Ornamental" },
  { label: "Produto Decorado", value: "Produto Decorado" },
];

export default function CatalogoVeilingClientePublico() {
  const searchParams = new URLSearchParams(window.location.search);
  const linkToken = searchParams.get("token") || ""; // Extrair token da URL
  const [categoria, setCategoria] = useState<string | null>(searchParams.get("categoria") || null);
  const [categoriaCustomizada, setCategoriaCustomizada] = useState<number | null>(null);
  const produtor = searchParams.get("produtor") || undefined;

  const [searchTerm, setSearchTerm] = useState("");
  const [letraFiltro, setLetraFiltro] = useState<string | null>(null);
  const [filtroCores, setFiltroCores] = useState<string[]>([]);
  const [carrinho, setCarrinho] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("carrinho_publico");
      return saved ? superjson.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showCarrinho, setShowCarrinho] = useState(false);
  const [modalPedido, setModalPedido] = useState<any>(null);
  const [showZoom, setShowZoom] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  
  // Estado para scroll infinito
  const [pagina, setPagina] = useState(0);
  const [produtosAcumulados, setProdutosAcumulados] = useState<any[]>([]);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Salvar carrinho no localStorage
  useEffect(() => {
    localStorage.setItem("carrinho_publico", superjson.stringify(carrinho));
  }, [carrinho]);

  // Recarregar carrinho quando modal fecha (para sincronizar com limpeza do localStorage)
  useEffect(() => {
    if (!modalPedido) {
      try {
        const saved = localStorage.getItem("carrinho_publico");
        const carrinhoAtualizado = saved ? (superjson.parse(saved) as any[]) : [];
        setCarrinho(carrinhoAtualizado);
      } catch {
        setCarrinho([]);
      }
    }
  }, [modalPedido]);

  // Query de produtos Veiling com paginação
  const { data: produtosData, isLoading, isFetching } = trpc.veiling.listProdutosPublico.useQuery({
    categoria: categoria ?? undefined,
    produtor,
    busca: searchTerm || undefined,
    cores: filtroCores.length > 0 ? filtroCores : undefined,
    letra: letraFiltro || undefined,
    limit: PAGE_SIZE,
    offset: pagina * PAGE_SIZE,
  });

  // Query de produtos customizados
  const { data: produtosCustomizados = [] } = trpc.produtosCustomizados.listar.useQuery();
  const { data: categoriasCustomizadas = [] } = trpc.categoriasCustomizadas.listar.useQuery();
  const { data: coresDisponiveis = [] } = trpc.veiling.getCores.useQuery();

  // Acumular produtos ao receber nova página
  useEffect(() => {
    if (!produtosData) return;
    if (pagina === 0) {
      setProdutosAcumulados(produtosData.items || []);
    } else {
      setProdutosAcumulados(prev => {
        const ids = new Set(prev.map((p: any) => p.id));
        const novos = (produtosData.items || []).filter((p: any) => !ids.has(p.id));
        return [...prev, ...novos];
      });
    }
    setCarregandoMais(false);
  }, [produtosData, pagina]);

  // IntersectionObserver para scroll infinito
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
          produtosAcumulados.length < (produtosData?.total || 0)
        ) {
          setCarregandoMais(true);
          setPagina(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isFetching, carregandoMais, produtosAcumulados.length, produtosData?.total]);

  // Filtrar customizados por categoria, letra e busca
  let produtosCustomizadosFiltrados = produtosCustomizados.filter(p => p.ativo && p.estoque > 0).filter(p => {
    // Filtro por categoria customizada
    if (categoriaCustomizada !== null && p.categoriaId !== categoriaCustomizada) {
      return false;
    }
    
    // Filtro por letra
    if (letraFiltro && !p.nome?.toUpperCase().startsWith(letraFiltro)) {
      return false;
    }
    
    // Filtro por busca
    if (searchTerm) {
      return p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
             p.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });
  
  // Aplicar filtro por letra se selecionado (apenas quando não há categoria customizada selecionada)
  let produtosVeilingFiltrados = produtosAcumulados;
  
  // Se há categoria customizada selecionada, não mostrar produtos Veiling
  if (categoriaCustomizada !== null) {
    produtosVeilingFiltrados = [];
  }
  
  // Aplicar filtro por letra apenas para produtos Veiling (quando não há categoria customizada)
  if (letraFiltro && !categoriaCustomizada) {
    produtosVeilingFiltrados = produtosAcumulados.filter(p => 
      p.nome?.toUpperCase().startsWith(letraFiltro)
    );
  }

  // Combinar todos os produtos
  const todosProdutos = [...produtosVeilingFiltrados, ...produtosCustomizadosFiltrados];
  const temMais = produtosAcumulados.length < (produtosData?.total || 0);

  // Resetar quando mudar categoria, letra ou cores
  useEffect(() => {
    setPagina(0);
    setProdutosAcumulados([]);
  }, [categoria, categoriaCustomizada, letraFiltro, filtroCores]);

  const handleAddToCart = (produto: any, quantidade: number) => {
    const qtdVenda = Number(produto.qtdVenda) || Number(produto.multiplo) || 1;
    const estoque = produto.estoqueDisponivel ?? produto.estoque ?? 0;
    const estoqueUnidades = Math.floor(estoque / qtdVenda);

    if (estoqueUnidades === 0) {
      toast.error("Produto sem estoque");
      return;
    }

    if (quantidade > estoqueUnidades) {
      toast.error("Quantidade maior que o estoque disponível");
      return;
    }

    // Resolver o preço do produto (suporta Veiling e customizados)
    const precoVenda = produto.precoVenda ? Number(produto.precoVenda) : (produto.preco ? Number(produto.preco) : (produto.precoUnitario ? Number(produto.precoUnitario) : 0));
    
    const existente = carrinho.find(item => item.id === produto.id);
    if (existente) {
      if (existente.quantidade + quantidade <= estoqueUnidades) {
        setCarrinho(prev => prev.map(item =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        ));
        toast.success("Quantidade aumentada");
      } else {
        toast.error("Estoque insuficiente");
      }
    } else {
      setCarrinho(prev => [...prev, { ...produto, quantidade, valorUnitario: precoVenda }]);
      toast.success("Adicionado ao carrinho");
    }
  };

  const totalCarrinho = carrinho.reduce((acc, item) => {
    const preco = Number(item.valorUnitario || item.precoVenda) || 0;
    return acc + (preco * item.quantidade);
  }, 0);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-700 rounded flex items-center justify-center text-white font-bold text-sm">
            🌿
          </div>
          <h1 className="font-bold text-gray-800">GARDEN CENTER PRIMAVERA</h1>
        </div>
        <button
          onClick={() => setShowCarrinho(!showCarrinho)}
          className="relative p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <ShoppingCart size={20} className="text-green-700" />
          {carrinho.length > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {carrinho.length}
            </span>
          )}
        </button>
      </div>

      {/* Menu de Categorias */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 sticky top-12 z-30 overflow-x-auto">
        <div className="flex gap-2 whitespace-nowrap">
          {/* Botão "Todos" */}
          <button
            onClick={() => {
              setCategoria(null);
              setCategoriaCustomizada(null);
              setLetraFiltro(null);
              setPagina(0);
              setProdutosAcumulados([]);
            }}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              categoria === null && categoriaCustomizada === null
                ? "bg-green-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Todos
          </button>
          
          {/* Categorias Veiling */}
          {CATEGORIAS_VEILING.map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                setCategoria(cat.value);
                setCategoriaCustomizada(null);
                setLetraFiltro(null);
                setPagina(0);
                setProdutosAcumulados([]);
              }}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                categoria === cat.value && categoriaCustomizada === null
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
          
          {/* Categorias Customizadas removidas - mantém apenas as 5 categorias Veiling principais */}
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-24 z-30">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagina(0);
              setProdutosAcumulados([]);
            }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        
        {/* Filtro por Letra e Cor - só aparece quando não há categoria customizada selecionada */}
        {categoriaCustomizada === null && (
          <>
            <div className="mt-3 flex gap-1 flex-wrap">
              <button
                onClick={() => {
                  setLetraFiltro(null);
                  setPagina(0);
                  setProdutosAcumulados([]);
                }}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  letraFiltro === null
                    ? "bg-green-700 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos
              </button>
              {Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").map((letra) => (
                <button
                  key={letra}
                  onClick={() => {
                    setLetraFiltro(letra);
                    setPagina(0);
                    setProdutosAcumulados([]);
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    letraFiltro === letra
                      ? "bg-green-700 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {letra}
                </button>
              ))}
            </div>
            
            {/* Filtro de Cores */}
            <div className="mt-3 flex gap-2">
              <ColorFilterDropdown
                cores={coresDisponiveis as string[]}
                filtroCores={filtroCores}
                onFilterChange={(novasCores) => {
                  setFiltroCores(novasCores);
                  setPagina(0);
                  setProdutosAcumulados([]);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Carrinho Lateral */}
      {showCarrinho && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setShowCarrinho(false)} />
          <div className="w-96 bg-white shadow-lg flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Carrinho</h2>
              <button onClick={() => setShowCarrinho(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {carrinho.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Carrinho vazio</p>
                </div>
              ) : (
                <div className="divide-y">
                  {carrinho.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{item.nomeCompleto || item.nome}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantidade}x R$ {(Number(item.valorUnitario || item.precoVenda) || 0).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => setCarrinho(prev => prev.filter(i => i.id !== item.id))}
                        className="p-1 hover:bg-red-50 rounded text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t p-4 space-y-3">
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-green-700">R$ {totalCarrinho.toFixed(2)}</span>
              </div>
              <Button
                onClick={() => setModalPedido({ carrinho })}
                disabled={carrinho.length === 0}
                className="w-full bg-green-700 hover:bg-green-800 text-white"
              >
                Finalizar Pedido
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Produtos */}
      <div ref={containerRef} className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-green-700" />
          </div>
        ) : todosProdutos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <Package size={24} className="mb-2" />
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <>
            {todosProdutos.map((produto: any) => (
              <ProdutoListItem key={produto.id} produto={produto} onAddToCart={handleAddToCart} quantidade={1} setQuantidade={() => {}} />
            ))}
            {/* Sentinel para IntersectionObserver */}
            <div ref={sentinelRef} className="h-4" />
            {(carregandoMais || isFetching) && temMais && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-green-700" />
                <span className="ml-2 text-sm text-gray-600">Carregando mais produtos...</span>
              </div>
            )}
            {produtosAcumulados.length > 0 && !temMais && (
              <div className="flex items-center justify-center py-4 text-sm text-gray-500">
                Todos os {produtosAcumulados.length} produtos carregados
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Zoom da Foto */}
      {showZoom && zoomImageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowZoom(false)}
        >
          <div
            className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowZoom(false)}
              className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 rounded-full p-2 z-10"
            >
              <X size={20} />
            </button>
            <img
              src={zoomImageUrl}
              alt="Zoom"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}

      {/* Modal de Pedido */}
      {modalPedido && (
        <ModalAdicionarPedidoCompra
          produtoNome="Produto"
          quantidade={1}
          precoUnitario={0}
          onClose={() => setModalPedido(null)}
          forceNovoOrcamento={true}
          origem="catalogo-publico"
          itensCarrinho={modalPedido.carrinho}
          linkToken={linkToken}
        />
      )}
    </div>
  );
}
