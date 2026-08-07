import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Plus, Trash2, Edit2, Link2, Copy, RefreshCw, ChevronDown, ChevronUp,
  ShoppingBag, Eye, Check, X, ArrowLeft, Save, Tag, List, Package,
  ExternalLink, Users, Clock, ToggleLeft, ToggleRight, Download, Search, Filter, Loader2
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useState, useEffect, useMemo, useRef } from "react";

type Aba = "listas" | "categorias";
type SubAba = "itens" | "pedidos";

interface ItemForm {
  id?: number;
  produtoLojaId?: number | null;
  categoriaId?: number;
  categoriaNome: string;
  variedade: string;
  tamanho: string;
  qtdHasteMaco: string;
  valorUnitario: string;
  disponivel: boolean;
}

const ITEM_VAZIO: ItemForm = {
  categoriaNome: "",
  variedade: "",
  tamanho: "",
  qtdHasteMaco: "",
  valorUnitario: "",
  disponivel: true,
};

export default function ListasPrecos() {
  const utils = trpc.useUtils();
  const [aba, setAba] = useState<Aba>("listas");
  const [listaEditando, setListaEditando] = useState<number | null>(null);
  const [subAba, setSubAba] = useState<SubAba>("itens");

  // ─── Categorias ───
  const { data: categorias = [], refetch: refetchCats } = trpc.categoriasProdutos.list.useQuery();
  const createCatMut = trpc.categoriasProdutos.create.useMutation({ onSuccess: () => { utils.categoriasProdutos.list.invalidate(); toast.success("Categoria criada!"); setNovaCat(""); } });
  const deleteCatMut = trpc.categoriasProdutos.delete.useMutation({ onSuccess: () => { utils.categoriasProdutos.list.invalidate(); toast.success("Categoria removida!"); } });
  const [novaCat, setNovaCat] = useState("");

  // ─── Listas ───
  const { data: listas = [], isLoading: loadingListas } = trpc.listasPrecos.list.useQuery();
  const createListaMut = trpc.listasPrecos.create.useMutation({
    onSuccess: (r) => { utils.listasPrecos.list.invalidate(); toast.success("Lista criada!"); setModalNova(false); setListaEditando(r.id); setSubAba("itens"); }
  });
  const updateListaMut = trpc.listasPrecos.update.useMutation({ onSuccess: () => { utils.listasPrecos.list.invalidate(); toast.success("Lista atualizada!"); } });
  const deleteListaMut = trpc.listasPrecos.delete.useMutation({ onSuccess: () => { utils.listasPrecos.list.invalidate(); toast.success("Lista removida!"); setListaEditando(null); } });
  const saveItensMut = trpc.listasPrecos.saveItens.useMutation({ onSuccess: () => { utils.listasPrecos.getById.invalidate({ id: listaEditando! }); toast.success("Itens salvos!"); } });
  const updatePedidoMut = trpc.listasPrecos.updatePedidoStatus.useMutation({ onSuccess: () => { utils.listasPrecos.listPedidos.invalidate({ listaId: listaEditando! }); } });

  // ─── Dados da lista em edição ───
  const { data: listaDetalhe } = trpc.listasPrecos.getById.useQuery(
    { id: listaEditando! },
    { enabled: !!listaEditando }
  );
  const { data: pedidos = [] } = trpc.listasPrecos.listPedidos.useQuery(
    { listaId: listaEditando! },
    { enabled: !!listaEditando && subAba === "pedidos" }
  );

  // ─── Modal nova lista ───
  const [modalNova, setModalNova] = useState(false);
  const [novaLista, setNovaLista] = useState({ titulo: "", subtitulo: "", observacao: "", aceitaPedidos: true });

  // ─── Itens em edição ───
  const [itens, setItens] = useState<ItemForm[]>([]);
  const [itensSujos, setItensSujos] = useState(false);

  // ─── Modal importar de produtos_loja ───
  const [modalImportar, setModalImportar] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [showProdSug, setShowProdSug] = useState(false);
  const prodRef = useRef<HTMLDivElement>(null);

  // Debounce: atualiza buscaAtiva 500ms após parar de digitar
  useEffect(() => {
    const t = setTimeout(() => setBuscaAtiva(buscaProduto), 500);
    return () => clearTimeout(t);
  }, [buscaProduto]);

  const { data: produtosLoja = [] } = trpc.produtosLista.searchLoja.useQuery(
    { busca: buscaAtiva.trim() || undefined },
    { enabled: modalImportar && buscaAtiva.trim().length >= 2 }
  );

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (prodRef.current && !prodRef.current.contains(e.target as Node)) {
        setShowProdSug(false);
      }
    }
    if (showProdSug) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProdSug]);

  function selecionarProduto(prod: any) {
    const novoItem: ItemForm = {
      produtoLojaId: prod.id,
      categoriaNome: prod.departamento || "SEM CATEGORIA",
      variedade: prod.nome,
      tamanho: "",
      qtdHasteMaco: "",
      valorUnitario: String(prod.preco || "0.00"),
      disponivel: true,
    };
    setItens(prev => [...prev, novoItem]);
    setItensSujos(true);
    setBuscaProduto("");
    setBuscaAtiva("");
    setShowProdSug(false);
    toast.success(`${prod.nome} adicionado!`);
  }

  // ─── Modal cadastro rápido de produto ───
  const [showCadastroRapido, setShowCadastroRapido] = useState(false);
  const [nomeProdutoRapido, setNomeProdutoRapido] = useState("");
  const [departamentoProdutoRapido, setDepartamentoProdutoRapido] = useState("");
  const [precoProdutoRapido, setPrecoProdutoRapido] = useState("");
  const createProdutoRapidoMut = trpc.produtosLista.create.useMutation({
    onSuccess: (result) => {
      const novoItem: ItemForm = {
        produtoLojaId: result.id,
        categoriaNome: departamentoProdutoRapido || "SEM CATEGORIA",
        variedade: nomeProdutoRapido.toUpperCase(),
        tamanho: "",
        qtdHasteMaco: "",
        valorUnitario: precoProdutoRapido,
        disponivel: true,
      };
      setItens(prev => [...prev, novoItem]);
      setItensSujos(true);
      setShowCadastroRapido(false);
      setNomeProdutoRapido("");
      setDepartamentoProdutoRapido("");
      setPrecoProdutoRapido("");
      toast.success("Produto cadastrado e adicionado!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  function cadastrarRapido() {
    if (!nomeProdutoRapido.trim() || !precoProdutoRapido.trim()) {
      toast.error("Preencha nome e preço");
      return;
    }
    createProdutoRapidoMut.mutate({
      categoriaNome: departamentoProdutoRapido || "SEM CATEGORIA",
      variedade: nomeProdutoRapido,
      valorUnitario: Number(precoProdutoRapido),
    });
  }

  // Carregar itens quando abre lista
  function abrirLista(id: number) {
    setListaEditando(id);
    setSubAba("itens");
    setItensSujos(false);
  }

  // Sincronizar itens com listaDetalhe
  useMemo(() => {
    if (listaDetalhe && !itensSujos) {
      setItens((listaDetalhe as any).itens.map((i: any) => ({
        id: i.id,
        produtoLojaId: i.produtoLojaId ?? undefined,
        categoriaId: i.categoriaId ?? undefined,
        categoriaNome: i.categoriaNome,
        variedade: i.variedade,
        tamanho: i.tamanho ?? "",
        qtdHasteMaco: i.qtdHasteMaco ?? "",
        valorUnitario: String(i.valorUnitario),
        disponivel: !!i.disponivel,
      })));
    }
  }, [listaDetalhe, itensSujos]);

  function addItemForm() {
    setItens(prev => [...prev, { ...ITEM_VAZIO }]);
    setItensSujos(true);
  }

  function updateItemForm(idx: number, field: keyof ItemForm, value: any) {
    setItens(prev => {
      const novo = [...prev];
      novo[idx] = { ...novo[idx], [field]: value };
      return novo;
    });
    setItensSujos(true);
  }

  function removeItemForm(idx: number) {
    setItens(prev => prev.filter((_, i) => i !== idx));
    setItensSujos(true);
  }

  function salvarItens() {
    if (!listaEditando) return;
    const itensValidos = itens.filter(i => i.categoriaNome && i.variedade && i.valorUnitario);
    saveItensMut.mutate({
      listaId: listaEditando,
      itens: itensValidos.map((i, idx) => ({
        produtoLojaId: i.produtoLojaId ?? null,
        categoriaId: i.categoriaId,
        categoriaNome: i.categoriaNome,
        variedade: i.variedade,
        tamanho: i.tamanho || undefined,
        qtdHasteMaco: i.qtdHasteMaco || undefined,
        valorUnitario: Number(i.valorUnitario),
        disponivel: i.disponivel,
        ordem: idx,
      })),
    });
    setItensSujos(false);
  }

  function copiarLink(token: string) {
    const url = `${window.location.origin}/lista-precos/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  function abrirLink(token: string) {
    window.open(`${window.location.origin}/lista-precos/${token}`, "_blank");
  }

  const listaAtual = listas.find(l => l.id === listaEditando);

  // ─── Tela de edição de lista ───
  if (listaEditando && listaAtual) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setListaEditando(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-800 truncate">{listaAtual.titulo}</h2>
            {listaAtual.subtitulo && <p className="text-xs text-gray-500 truncate">{listaAtual.subtitulo}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={listaAtual.ativo ? "default" : "secondary"} className={listaAtual.ativo ? "bg-green-100 text-green-700" : ""}>
              {listaAtual.ativo ? "Ativa" : "Inativa"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => copiarLink(listaAtual.token)}>
              <Copy className="w-4 h-4 mr-1" /> Copiar Link
            </Button>
            <Button variant="outline" size="sm" onClick={() => abrirLink(listaAtual.token)}>
              <ExternalLink className="w-4 h-4 mr-1" /> Abrir
            </Button>
            <Button
              variant={listaAtual.ativo ? "outline" : "default"}
              size="sm"
              onClick={() => updateListaMut.mutate({ id: listaAtual.id, ativo: !listaAtual.ativo })}
            >
              {listaAtual.ativo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Abas */}
        <div className="bg-white border-b px-4 flex gap-4 flex-shrink-0">
          <button
            onClick={() => setSubAba("itens")}
            className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
              subAba === "itens" ? "border-green-600 text-green-600" : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            <List className="w-4 h-4 inline mr-2" /> Itens ({itens.length})
          </button>
          <button
            onClick={() => setSubAba("pedidos")}
            className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
              subAba === "pedidos" ? "border-green-600 text-green-600" : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            <ShoppingBag className="w-4 h-4 inline mr-2" /> Pedidos ({pedidos.length})
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto">
          {subAba === "itens" && (
            <div className="p-4 space-y-4">
              {/* Toolbar */}
              <div className="bg-white rounded border p-3 flex gap-2 flex-wrap">
                <Button size="sm" onClick={() => setModalImportar(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-1" /> Importar de Produtos
                </Button>
                <Button size="sm" onClick={() => setShowCadastroRapido(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-1" /> Cadastro Rápido
                </Button>
                <Button size="sm" onClick={addItemForm} variant="outline">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Manual
                </Button>
                {itensSujos && (
                  <Button size="sm" onClick={salvarItens} className="bg-green-600 hover:bg-green-700 ml-auto">
                    <Save className="w-4 h-4 mr-1" /> Salvar Itens
                  </Button>
                )}
              </div>

              {/* Tabela de itens */}
              <div className="bg-white rounded border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b bg-gray-50">
                        <th className="text-left px-4 py-2 font-medium">CATEGORIA</th>
                        <th className="text-left px-4 py-2 font-medium">VARIEDADE</th>
                        <th className="text-center px-3 py-2 font-medium">TAM.</th>
                        <th className="text-center px-3 py-2 font-medium">QTD HST/MÇ</th>
                        <th className="text-right px-3 py-2 font-medium">VALOR UNIT.</th>
                        <th className="text-center px-3 py-2 font-medium">STATUS</th>
                        <th className="text-center px-3 py-2 font-medium">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <Input
                              value={item.categoriaNome}
                              onChange={(e) => updateItemForm(idx, "categoriaNome", e.target.value)}
                              placeholder="Categoria"
                              className="text-xs"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              value={item.variedade}
                              onChange={(e) => updateItemForm(idx, "variedade", e.target.value)}
                              placeholder="Variedade"
                              className="text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={item.tamanho}
                              onChange={(e) => updateItemForm(idx, "tamanho", e.target.value)}
                              placeholder="Tam."
                              className="text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={item.qtdHasteMaco}
                              onChange={(e) => updateItemForm(idx, "qtdHasteMaco", e.target.value)}
                              placeholder="Qtd"
                              className="text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={item.valorUnitario}
                              onChange={(e) => updateItemForm(idx, "valorUnitario", e.target.value)}
                              placeholder="0.00"
                              className="text-xs text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => updateItemForm(idx, "disponivel", !item.disponivel)}
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                item.disponivel ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {item.disponivel ? "Ativo" : "Inativo"}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button size="sm" variant="ghost" onClick={() => removeItemForm(idx)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {subAba === "pedidos" && (
            <div className="p-4">
              {pedidos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum pedido recebido ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pedidos.map((pedido: any) => (
                    <div key={pedido.id} className="bg-white rounded border p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-800">{(pedido as any).clienteNome}</p>
                          <p className="text-xs text-gray-500">{new Date((pedido as any).createdAt).toLocaleString()}</p>
                        </div>
                        <Select value={(pedido as any).status} onValueChange={(status) => updatePedidoMut.mutate({ id: (pedido as any).id, status: status as any })}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NOVO">Novo</SelectItem>
                            <SelectItem value="VISTO">Visto</SelectItem>
                            <SelectItem value="APROVADO">Aprovado</SelectItem>
                            <SelectItem value="CANCELADO">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-gray-600">Total: <span className="font-semibold">R$ {Number((pedido as any).total).toFixed(2).replace(".", ",")}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Modal importar produtos ───
  if (modalImportar) {
    return (
      <Dialog open={true} onOpenChange={setModalImportar}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader>
            <DialogTitle>Importar de Produtos da Loja</DialogTitle>
          </DialogHeader>
          <div className="space-y-3" ref={prodRef}>
            <div className="relative">
              <Input
                placeholder="Buscar produtos..."
                value={buscaProduto}
                onChange={(e) => {
                  setBuscaProduto(e.target.value);
                  setShowProdSug(true);
                }}
                onFocus={() => setShowProdSug(true)}
              />
              {showProdSug && buscaAtiva.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b shadow-lg z-50 max-h-64 overflow-y-auto">
                  {produtosLoja.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">Nenhum produto encontrado</div>
                  ) : (
                    produtosLoja.map((prod: any) => (
                      <button
                        key={prod.id}
                        onClick={() => selecionarProduto(prod)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-0 text-sm"
                      >
                        <p className="font-medium text-gray-800">{prod.nome}</p>
                        <p className="text-xs text-gray-500">{prod.departamento} • R$ {Number(prod.preco).toFixed(2).replace(".", ",")}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button onClick={() => setShowCadastroRapido(true)} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Ou cadastre um novo produto
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalImportar(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Modal cadastro rápido ───
  if (showCadastroRapido) {
    return (
      <Dialog open={true} onOpenChange={setShowCadastroRapido}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastro Rápido de Produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nome do Produto *</label>
              <Input
                placeholder="Ex: Rosa Vermelha"
                value={nomeProdutoRapido}
                onChange={(e) => setNomeProdutoRapido(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Departamento/Categoria</label>
              <Input
                placeholder="Ex: Flores"
                value={departamentoProdutoRapido}
                onChange={(e) => setDepartamentoProdutoRapido(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Preço Unitário *</label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={precoProdutoRapido}
                onChange={(e) => setPrecoProdutoRapido(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCadastroRapido(false)}>Cancelar</Button>
            <Button
              onClick={cadastrarRapido}
              disabled={createProdutoRapidoMut.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createProdutoRapidoMut.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Cadastrar e Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Tela principal (lista de listas) ───
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-800 flex-1">Listas de Preços</h1>
        <Button onClick={() => setModalNova(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-1" /> Nova Lista
        </Button>
      </div>

      {/* Abas */}
      <div className="bg-white border-b px-4 flex gap-4 flex-shrink-0">
        <button
          onClick={() => setAba("listas")}
          className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
            aba === "listas" ? "border-green-600 text-green-600" : "border-transparent text-gray-600 hover:text-gray-800"
          }`}
        >
          <List className="w-4 h-4 inline mr-2" /> Listas
        </button>
        <button
          onClick={() => setAba("categorias")}
          className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
            aba === "categorias" ? "border-green-600 text-green-600" : "border-transparent text-gray-600 hover:text-gray-800"
          }`}
        >
          <Tag className="w-4 h-4 inline mr-2" /> Categorias
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto">
        {aba === "listas" && (
          <div className="p-4">
            {loadingListas ? (
              <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" /></div>
            ) : listas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <List className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma lista criada</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {listas.map(lista => (
                  <div key={lista.id} className="bg-white rounded border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => abrirLista(lista.id)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{lista.titulo}</h3>
                        {lista.subtitulo && <p className="text-sm text-gray-600">{lista.subtitulo}</p>}
                      </div>
                      <Badge className={lista.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                        {lista.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{(lista as any).itens?.length ?? 0} itens • Criada em {new Date(lista.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {aba === "categorias" && (
          <div className="p-4 space-y-3">
            <div className="bg-white rounded border p-3 flex gap-2">
              <Input
                placeholder="Nova categoria..."
                value={novaCat}
                onChange={(e) => setNovaCat(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && novaCat.trim()) {
                    createCatMut.mutate({ nome: novaCat });
                  }
                }}
              />
              <Button onClick={() => novaCat.trim() && createCatMut.mutate({ nome: novaCat })}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {categorias.map(cat => (
                <div key={cat.id} className="bg-white rounded border p-3 flex justify-between items-center">
                  <span className="font-medium text-gray-800">{cat.nome}</span>
                  <Button size="sm" variant="ghost" onClick={() => deleteCatMut.mutate({ id: cat.id })}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal nova lista */}
      <Dialog open={modalNova} onOpenChange={setModalNova}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Lista de Preços</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input
                placeholder="Ex: Lista Março 2026"
                value={novaLista.titulo}
                onChange={(e) => setNovaLista({ ...novaLista, titulo: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subtítulo</label>
              <Input
                placeholder="Ex: Promoção especial"
                value={novaLista.subtitulo}
                onChange={(e) => setNovaLista({ ...novaLista, subtitulo: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Observação</label>
              <Textarea
                placeholder="Observações..."
                value={novaLista.observacao}
                onChange={(e) => setNovaLista({ ...novaLista, observacao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNova(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (novaLista.titulo.trim()) {
                  createListaMut.mutate({
                    titulo: novaLista.titulo,
                    subtitulo: novaLista.subtitulo,
                    observacao: novaLista.observacao,
                    aceitaPedidos: novaLista.aceitaPedidos,
                  });
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
