import React, { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, Trash2, Plus, Search, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface ProdutoSelecionado {
  produtoId: string;
  produtoNome: string;
  precoOriginal: number;
  precoPromocional: number;
  imagemUrl?: string;
  catalogo: string;
}

export default function Promocoes() {
  const [promocoes, setPromocoes] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState<"percentual" | "fixo">("percentual");
  const [valorDesconto, setValorDesconto] = useState("");
  const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoSelecionado[]>([]);
  const [searchProduto, setSearchProduto] = useState("");
  const [precoOriginal, setPrecoOriginal] = useState("");
  const [precoPromocional, setPrecoPromocional] = useState("");
  const [catalogoSelecionado, setCatalogoSelecionado] = useState("veiling");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bannerPreview, setBannerPreview] = useState<string>("");

  // Estado para o painel de busca do catálogo
  const [showCatalogPanel, setShowCatalogPanel] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [debouncedCatalogSearch, setDebouncedCatalogSearch] = useState("");

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCatalogSearch(catalogSearch), 400);
    return () => clearTimeout(timer);
  }, [catalogSearch]);

  // Queries de busca por catálogo
  const veilingQuery = trpc.veiling.listProdutos.useQuery(
    { busca: debouncedCatalogSearch, limit: 30 },
    { enabled: catalogoSelecionado === "veiling" && showCatalogPanel }
  );
  const cooperfloraQuery = trpc.cooperflora.listar.useQuery(
    { nome: debouncedCatalogSearch || undefined },
    { enabled: catalogoSelecionado === "cooperflora" && showCatalogPanel }
  );
  const lojaQuery = trpc.loja.listar.useQuery(
    { busca: debouncedCatalogSearch || undefined, limit: 30 },
    { enabled: catalogoSelecionado === "loja" && showCatalogPanel }
  );

  const listPromocoes = trpc.promocoes.list.useQuery({});
  const createPromocao = trpc.promocoes.create.useMutation();
  const deletePromocao = trpc.promocoes.delete.useMutation();

  useEffect(() => {
    if (listPromocoes.data) {
      setPromocoes(listPromocoes.data);
    }
  }, [listPromocoes.data]);

  // Armazenar imagemUrl do produto selecionado temporariamente
  const [imagemUrlTemp, setImagemUrlTemp] = useState<string | undefined>(undefined);

  // Selecionar produto do catálogo
  const selecionarProdutoCatalogo = useCallback((produto: { id: string | number; nome: string; preco: number; imagemUrl?: string }) => {
    setSearchProduto(produto.nome);
    setPrecoOriginal(produto.preco.toFixed(2));
    // Sugerir preço promocional como 90% do original
    setPrecoPromocional((produto.preco * 0.9).toFixed(2));
    setImagemUrlTemp(produto.imagemUrl);
    setShowCatalogPanel(false);
    setCatalogSearch("");
  }, []);

  // Helper: carregar imagem como HTMLImageElement com CORS
  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Falha ao carregar imagem"));
      img.src = url;
    });

  // Helper: resolver URL de imagem do Veiling via proxy
  const resolveImageUrl = (url: string, catalogo: string): string => {
    if (catalogo === "veiling" && url && !url.startsWith("http")) {
      return `/api/veiling/foto?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // Gerar banner com Canvas (async para suportar imagens)
  const gerarBanner = async (produtos: ProdutoSelecionado[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensões 1080x1080
    canvas.width = 1080;
    canvas.height = 1080;

    // Fundo gradiente (verde da Garden)
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, "#16a34a");
    gradient.addColorStop(1, "#15803d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // Carregar imagens dos produtos em paralelo (máx 4)
    const produtosComFoto = produtos.filter((p) => p.imagemUrl);
    const produtosSemFoto = produtos.filter((p) => !p.imagemUrl);
    const maxFotos = Math.min(produtosComFoto.length, 4);

    if (maxFotos > 0) {
      // Layout das fotos: grade dinâmica
      const imgSize = maxFotos === 1 ? 400 : maxFotos <= 2 ? 300 : 220;
      const totalWidth = maxFotos * imgSize + (maxFotos - 1) * 20;
      const startX = (1080 - totalWidth) / 2;
      const imgY = 160;

      // Tentar carregar todas as imagens
      const loadedImages = await Promise.all(
        produtosComFoto.slice(0, maxFotos).map(async (p) => {
          try {
            const url = resolveImageUrl(p.imagemUrl!, p.catalogo);
            const img = await loadImage(url);
            return { img, produto: p };
          } catch {
            return null;
          }
        })
      );

      // Desenhar cada imagem com borda arredondada
      loadedImages.forEach((item, i) => {
        if (!item) return;
        const x = startX + i * (imgSize + 20);
        const y = imgY;

        // Sombra
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;

        // Clip arredondado
        const radius = 16;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + imgSize - radius, y);
        ctx.quadraticCurveTo(x + imgSize, y, x + imgSize, y + radius);
        ctx.lineTo(x + imgSize, y + imgSize - radius);
        ctx.quadraticCurveTo(x + imgSize, y + imgSize, x + imgSize - radius, y + imgSize);
        ctx.lineTo(x + radius, y + imgSize);
        ctx.quadraticCurveTo(x, y + imgSize, x, y + imgSize - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();

        // Desenhar imagem com object-fit: cover
        const { img } = item;
        const scale = Math.max(imgSize / img.naturalWidth, imgSize / img.naturalHeight);
        const sw = imgSize / scale;
        const sh = imgSize / scale;
        const sx = (img.naturalWidth - sw) / 2;
        const sy = (img.naturalHeight - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, x, y, imgSize, imgSize);
        ctx.restore();

        // Nome do produto abaixo da foto
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${maxFotos <= 2 ? 32 : 26}px Arial`;
        ctx.textAlign = "center";
        const nomeDisplay = item.produto.produtoNome.length > 20
          ? item.produto.produtoNome.substring(0, 18) + "..."
          : item.produto.produtoNome;
        ctx.fillText(nomeDisplay, x + imgSize / 2, y + imgSize + 35);

        // Preços
        ctx.fillStyle = "#d1fae5";
        ctx.font = `${maxFotos <= 2 ? 26 : 22}px Arial`;
        ctx.fillText(`R$ ${item.produto.precoPromocional.toFixed(2)}`, x + imgSize / 2, y + imgSize + 65);
      });

      // Calcular yPos após as fotos
      const afterPhotos = imgY + imgSize + 90;

      // Título da promoção (acima das fotos)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 70px Arial";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 8;
      ctx.fillText(titulo || "PROMOÇÃO", 540, 110);
      ctx.shadowBlur = 0;

      // Desconto destacado
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 90px Arial";
      ctx.fillText(`${valorDesconto}${tipoDesconto === "percentual" ? "% OFF" : " R$ OFF"}`, 540, afterPhotos + 70);

      // Produtos sem foto (lista)
      if (produtosSemFoto.length > 0) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "32px Arial";
        let yExtra = afterPhotos + 130;
        produtosSemFoto.slice(0, 2).forEach((p) => {
          ctx.fillText(`• ${p.produtoNome.substring(0, 28)}`, 540, yExtra);
          yExtra += 45;
        });
      }
    } else {
      // Layout sem fotos (original)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 80px Arial";
      ctx.textAlign = "center";
      ctx.fillText(titulo || "PROMOÇÃO", 540, 150);

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 120px Arial";
      ctx.fillText(`${valorDesconto}${tipoDesconto === "percentual" ? "%" : "R$"}`, 540, 350);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 60px Arial";
      ctx.fillText(tipoDesconto === "percentual" ? "OFF" : "DE DESCONTO", 540, 450);

      ctx.fillStyle = "#ffffff";
      ctx.font = "40px Arial";
      let yPos = 550;
      produtos.slice(0, 3).forEach((prod) => {
        ctx.fillText(prod.produtoNome.substring(0, 30), 540, yPos);
        yPos += 80;
      });
      if (produtos.length > 3) {
        ctx.font = "35px Arial";
        ctx.fillText(`+ ${produtos.length - 3} produtos`, 540, yPos);
      }
    }

    // Logo/Rodapé
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, 1020, 1080, 60);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Garden Center Primavera", 540, 1058);

    // Converter para imagem
    const imageUrl = canvas.toDataURL("image/png");
    setBannerPreview(imageUrl);
  };

  const adicionarProduto = () => {
    if (!searchProduto || !precoOriginal || !precoPromocional) {
      toast.error("Preencha todos os campos do produto");
      return;
    }

    const novoProduto: ProdutoSelecionado = {
      produtoId: Math.random().toString(),
      produtoNome: searchProduto,
      precoOriginal: parseFloat(precoOriginal),
      precoPromocional: parseFloat(precoPromocional),
      catalogo: catalogoSelecionado,
      imagemUrl: imagemUrlTemp,
    };

    setProdutosSelecionados([...produtosSelecionados, novoProduto]);
    setSearchProduto("");
    setPrecoOriginal("");
    setPrecoPromocional("");
    setImagemUrlTemp(undefined);

    // Regenerar banner
    gerarBanner([...produtosSelecionados, novoProduto]);
  };

  const removerProduto = (index: number) => {
    const novosProdutos = produtosSelecionados.filter((_, i) => i !== index);
    setProdutosSelecionados(novosProdutos);
    gerarBanner(novosProdutos);
  };

  const salvarPromocao = async () => {
    if (!titulo || !valorDesconto || produtosSelecionados.length === 0) {
      toast.error("Preencha título, desconto e selecione pelo menos um produto");
      return;
    }

    try {
      await createPromocao.mutateAsync({
        titulo,
        descricao,
        tipoDesconto,
        valorDesconto: parseFloat(valorDesconto),
        imagemBase64: bannerPreview,
        itens: produtosSelecionados,
      });

      toast.success("Promoção criada com sucesso!");
      setShowCreateDialog(false);
      setTitulo("");
      setDescricao("");
      setValorDesconto("");
      setProdutosSelecionados([]);
      setBannerPreview("");
      listPromocoes.refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar promoção");
    }
  };

  const downloadBanner = () => {
    if (!bannerPreview) {
      toast.error("Gere um banner primeiro");
      return;
    }

    const link = document.createElement("a");
    link.href = bannerPreview;
    link.download = `promocao-${titulo}-${Date.now()}.png`;
    link.click();
  };

  const compartilharWhatsApp = () => {
    if (!bannerPreview) {
      toast.error("Gere um banner primeiro");
      return;
    }

    const mensagem = `🎉 *${titulo}* 🎉\n\n${valorDesconto}${tipoDesconto === "percentual" ? "%" : "R$"} de desconto!\n\nProdutos em promoção:\n${produtosSelecionados.map((p) => `• ${p.produtoNome}`).join("\n")}\n\nVenha aproveitar! 🌸`;

    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWhatsApp, "_blank");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Promoções</h1>
          <p className="text-gray-600">Crie banners de promoção para compartilhar no WhatsApp</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Nova Promoção
        </Button>
      </div>

      {/* Dialog de Criação */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Promoção</DialogTitle>
            <DialogDescription>Selecione produtos e gere um banner para compartilhar</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Aba Informações */}
            <TabsContent value="info" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título da Promoção</label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Flores em Promoção"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição adicional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Desconto</label>
                  <Select value={tipoDesconto} onValueChange={(v: any) => setTipoDesconto(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual (%)</SelectItem>
                      <SelectItem value="fixo">Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Valor do Desconto</label>
                  <Input
                    type="number"
                    value={valorDesconto}
                    onChange={(e) => setValorDesconto(e.target.value)}
                    placeholder="Ex: 20"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Aba Produtos */}
            <TabsContent value="produtos" className="space-y-4">
              <div className="space-y-4 border-b pb-4">
                {/* Seletor de catálogo */}
                <div>
                  <label className="block text-sm font-medium mb-2">Catálogo</label>
                  <Select
                    value={catalogoSelecionado}
                    onValueChange={(v) => {
                      setCatalogoSelecionado(v);
                      setShowCatalogPanel(false);
                      setCatalogSearch("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veiling">Veiling</SelectItem>
                      <SelectItem value="cooperflora">Cooperflora</SelectItem>
                      <SelectItem value="loja">Loja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campo nome com botão de abrir catálogo */}
                <div>
                  <label className="block text-sm font-medium mb-2">Nome do Produto</label>
                  <div className="flex gap-2">
                    <Input
                      value={searchProduto}
                      onChange={(e) => setSearchProduto(e.target.value)}
                      placeholder="Digite o nome ou selecione do catálogo →"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCatalogPanel(true);
                        setCatalogSearch(searchProduto);
                      }}
                      className="shrink-0 gap-1"
                      title={`Buscar no catálogo ${catalogoSelecionado}`}
                    >
                      <Search className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs">Catálogo</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Painel de busca no catálogo */}
                {showCatalogPanel && (
                  <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold capitalize">
                        Catálogo {catalogoSelecionado}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setShowCatalogPanel(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      autoFocus
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder={`Buscar no catálogo ${catalogoSelecionado}...`}
                    />
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {/* Veiling */}
                      {catalogoSelecionado === "veiling" && (
                        veilingQuery.isLoading ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
                        ) : ((veilingQuery.data as any)?.items ?? []).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto encontrado</p>
                        ) : (
                          ((veilingQuery.data as any)?.items ?? []).map((p: any) => {
                            const preco = p.precoVenda ?? p.custoFinal ?? p.precoEmbalagem ?? p.precoCarrinho ?? 0;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                className="w-full flex items-center gap-3 p-2 rounded hover:bg-accent text-left transition-colors"
                                onClick={() =>
                                  selecionarProdutoCatalogo({
                                    id: p.id,
                                    nome: p.nomeCompleto ?? p.nome,
                                    preco,
                                    imagemUrl: p.fotoUrl,
                                  })
                                }
                              >
                                {p.fotoUrl && (
                                  <img
                                    src={`/api/veiling/foto?url=${encodeURIComponent(p.fotoUrl)}`}
                                    className="w-10 h-10 object-cover rounded shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{p.nomeCompleto ?? p.nome}</p>
                                  <p className="text-xs text-muted-foreground">R$ {Number(preco).toFixed(2)}</p>
                                </div>
                              </button>
                            );
                          })
                        )
                      )}

                      {/* Cooperflora */}
                      {catalogoSelecionado === "cooperflora" && (
                        cooperfloraQuery.isLoading ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
                        ) : (cooperfloraQuery.data ?? []).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto encontrado</p>
                        ) : (
                          (cooperfloraQuery.data ?? []).map((p: any) => {
                            const preco = p.precoVendaMax ?? p.precoMin ?? 0;
                            return (
                              <button
                                key={p.codigo}
                                type="button"
                                className="w-full flex items-center gap-3 p-2 rounded hover:bg-accent text-left transition-colors"
                                onClick={() =>
                                  selecionarProdutoCatalogo({
                                    id: p.codigo,
                                    nome: p.nome,
                                    preco,
                                    imagemUrl: p.imagemUrl,
                                  })
                                }
                              >
                                {p.imagemUrl && (
                                  <img
                                    src={p.imagemUrl}
                                    className="w-10 h-10 object-cover rounded shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{p.nome}</p>
                                  <p className="text-xs text-muted-foreground">R$ {Number(preco).toFixed(2)}</p>
                                </div>
                              </button>
                            );
                          })
                        )
                      )}

                      {/* Loja */}
                      {catalogoSelecionado === "loja" && (
                        lojaQuery.isLoading ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
                        ) : ((lojaQuery.data as any)?.items ?? lojaQuery.data ?? []).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto encontrado</p>
                        ) : (
                          ((lojaQuery.data as any)?.items ?? lojaQuery.data ?? []).map((p: any) => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full flex items-center gap-3 p-2 rounded hover:bg-accent text-left transition-colors"
                              onClick={() =>
                                selecionarProdutoCatalogo({
                                  id: p.id,
                                  nome: p.nome,
                                  preco: p.preco ?? 0,
                                  imagemUrl: p.imagemUrl,
                                })
                              }
                            >
                              {p.imagemUrl && (
                                <img
                                  src={p.imagemUrl}
                                  className="w-10 h-10 object-cover rounded shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{p.nome}</p>
                                <p className="text-xs text-muted-foreground">R$ {Number(p.preco ?? 0).toFixed(2)}</p>
                              </div>
                            </button>
                          ))
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Preço Original (R$)</label>
                    <Input
                      type="number"
                      value={precoOriginal}
                      onChange={(e) => setPrecoOriginal(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Preço Promocional (R$)</label>
                    <Input
                      type="number"
                      value={precoPromocional}
                      onChange={(e) => setPrecoPromocional(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <Button onClick={adicionarProduto} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Produto
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Produtos Selecionados ({produtosSelecionados.length})</h3>
                {produtosSelecionados.length === 0 ? (
                  <p className="text-gray-500 text-sm">Nenhum produto adicionado</p>
                ) : (
                  <div className="space-y-2">
                    {produtosSelecionados.map((prod, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-100 p-3 rounded">
                        <div>
                          <p className="font-medium">{prod.produtoNome}</p>
                          <p className="text-sm text-gray-600">
                            R$ {prod.precoOriginal.toFixed(2)} → R$ {prod.precoPromocional.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerProduto(idx)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Aba Preview */}
            <TabsContent value="preview" className="space-y-4">
              <Button
                onClick={() => gerarBanner(produtosSelecionados)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Gerar Banner
              </Button>

              {bannerPreview && (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden bg-gray-100 flex justify-center">
                    <img src={bannerPreview} alt="Preview" className="max-w-full max-h-96" />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={downloadBanner} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Imagem
                    </Button>
                    <Button onClick={compartilharWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
                      <Share2 className="mr-2 h-4 w-4" />
                      Compartilhar WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarPromocao} className="bg-green-600 hover:bg-green-700">
              Salvar Promoção
            </Button>
          </div>

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </DialogContent>
      </Dialog>

      {/* Lista de Promoções */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promocoes.map((promo) => (
          <Card key={promo.id}>
            <CardHeader>
              <CardTitle>{promo.titulo}</CardTitle>
              <CardDescription>{promo.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {promo.imagemBase64 && (
                <img src={promo.imagemBase64} alt={promo.titulo} className="w-full rounded" />
              )}

              <div className="text-2xl font-bold text-green-600">
                {promo.valorDesconto}
                {promo.tipoDesconto === "percentual" ? "%" : "R$"}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = promo.imagemBase64;
                    link.download = `${promo.titulo}.png`;
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    const msg = `🎉 ${promo.titulo} 🎉\n${promo.valorDesconto}${promo.tipoDesconto === "percentual" ? "%" : "R$"} de desconto!`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600"
                  onClick={() => {
                    deletePromocao.mutate({ id: promo.id });
                    listPromocoes.refetch();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
