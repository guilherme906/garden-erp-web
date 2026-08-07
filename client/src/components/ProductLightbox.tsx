import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ProductLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  productName: string;
  productDetails?: {
    categoria?: string;
    qualidade?: string;
    cor?: string;
    produtor?: string;
    estoque?: number;
    preco?: number;
  };
  currentIndex?: number;
  totalItems?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onAddToCart?: (quantidade: number) => void;
  isAddingToCart?: boolean;
}

export function ProductLightbox({
  isOpen,
  onClose,
  imageUrl,
  productName,
  productDetails,
  currentIndex,
  totalItems,
  onPrevious,
  onNext,
  onAddToCart,
  isAddingToCart,
}: ProductLightboxProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [displayUrl, setDisplayUrl] = useState(imageUrl);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  // Reset quando URL muda
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setQuantidade(1);
    setDisplayUrl(imageUrl);
    setFallbackAttempted(false);
  }, [imageUrl]);

  // Tentar fallback quando imagem falha
  const handleImageError = () => {
    // Se ainda não tentou fallback e tem offerId, tenta proxy
    if (!fallbackAttempted) {
      // Tenta extrair offerId da URL
      let offerId: string | null = null;
      
      // Se a URL é do proxy, já é um fallback
      if (displayUrl.includes('/api/veiling/image')) {
        setImageError(true);
        return;
      }
      
      // Tenta extrair offerId de query params
      try {
        const url = new URL(displayUrl, window.location.origin);
        offerId = url.searchParams.get('offerId');
      } catch {
        // Se não conseguir parsear, tenta regex
        const match = displayUrl.match(/offerId[=&]([^&]+)/);
        if (match) offerId = match[1];
      }
      
      // Se encontrou offerId, tenta proxy
      if (offerId) {
        setDisplayUrl(`/api/veiling/image?offerId=${offerId}`);
        setFallbackAttempted(true);
        setImageError(false);
        return;
      }
    }
    
    // Se tudo falhou, mostra erro
    setImageError(true);
  };

  // Fechar ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrevious) onPrevious();
      if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onPrevious, onNext]);

  const hasNavigation = totalItems && totalItems > 1;
  const showPrevious = hasNavigation && currentIndex !== undefined && currentIndex > 0;
  const showNext = hasNavigation && currentIndex !== undefined && currentIndex < (totalItems || 0) - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>{productName}</DialogTitle>
        </DialogHeader>
        {/* Header com nome do produto e botão fechar */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex-1">
            <h2 className="text-white font-semibold text-lg line-clamp-2">{productName}</h2>
            {hasNavigation && (
              <p className="text-white/60 text-sm mt-1">
                {(currentIndex ?? 0) + 1} de {totalItems}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Fechar"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Conteúdo principal com imagem e navegação */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden p-4">
          {/* Botão anterior */}
          {showPrevious && (
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-white/20 rounded-full transition-colors group"
              aria-label="Produto anterior"
            >
              <ChevronLeft className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Imagem */}
          <div className="flex items-center justify-center max-w-full max-h-full">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {imageError ? (
              <div className="text-center">
                <p className="text-white/60 text-lg">Erro ao carregar imagem</p>
                <p className="text-white/40 text-sm mt-2">Tente novamente</p>
              </div>
            ) : (
              <img
                src={displayUrl}
                alt={productName}
                onLoad={() => setImageLoaded(true)}
                onError={handleImageError}
                className={`max-w-full max-h-[calc(90vh-200px)] object-contain transition-opacity duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
          </div>

          {/* Botão próximo */}
          {showNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 hover:bg-white/20 rounded-full transition-colors group"
              aria-label="Próximo produto"
            >
              <ChevronRight className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Footer com detalhes do produto */}
        {productDetails && (
          <div className="border-t border-white/10 p-4 bg-black/50 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {productDetails.categoria && (
                <div>
                  <p className="text-white/60">Categoria</p>
                  <p className="text-white font-medium">{productDetails.categoria}</p>
                </div>
              )}
              {productDetails.qualidade && (
                <div>
                  <p className="text-white/60">Qualidade</p>
                  <p className="text-white font-medium">{productDetails.qualidade}</p>
                </div>
              )}
              {productDetails.cor && (
                <div>
                  <p className="text-white/60">Cor</p>
                  <p className="text-white font-medium">{productDetails.cor}</p>
                </div>
              )}
              {productDetails.produtor && (
                <div>
                  <p className="text-white/60">Produtor</p>
                  <p className="text-white font-medium">{productDetails.produtor}</p>
                </div>
              )}
              {productDetails.estoque !== undefined && (
                <div>
                  <p className="text-white/60">Estoque</p>
                  <p className="text-white font-medium">{productDetails.estoque} un</p>
                </div>
              )}
              {productDetails.preco !== undefined && (
                <div>
                  <p className="text-white/60">Preço</p>
                  <p className="text-white font-medium">R$ {productDetails.preco.toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* Controle de quantidade e botão de carrinho */}
            {onAddToCart && (
              <div className="flex items-center gap-2 pt-3 border-t border-white/10 mt-3">
                <div className="flex items-center gap-1 bg-white/10 rounded px-2 py-1.5">
                  <button
                    onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    className="text-white hover:text-orange-400 transition-colors font-bold"
                    disabled={quantidade <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={productDetails.estoque || 999}
                    value={quantidade}
                    onChange={(e) => setQuantidade(Math.max(1, Math.min(productDetails.estoque || 999, parseInt(e.target.value) || 1)))}
                    className="w-12 text-center bg-transparent text-white text-sm focus:outline-none font-semibold"
                  />
                  <button
                    onClick={() => setQuantidade(Math.min(productDetails.estoque || 999, quantidade + 1))}
                    className="text-white hover:text-orange-400 transition-colors font-bold"
                    disabled={quantidade >= (productDetails.estoque || 999)}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => {
                    onAddToCart(quantidade);
                    setQuantidade(1);
                  }}
                  disabled={isAddingToCart}
                  className="flex-1 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold rounded transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {isAddingToCart ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>🛒 Adicionar</>  
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dica de navegação */}
        {hasNavigation && (
          <div className="text-center text-white/40 text-xs p-2 border-t border-white/10">
            Use as setas ← → ou teclado para navegar • ESC para fechar
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
