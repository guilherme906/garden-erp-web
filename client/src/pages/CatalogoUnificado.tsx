import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, ShoppingCart, Loader2, RefreshCw, ChevronDown, X } from "lucide-react";
import ModalAdicionarPedidoCompra from "@/components/ModalAdicionarPedidoCompra";

type ProdutoUnificado = {
  id: string;
  origem: "Veiling" | "Cooperflora";
  nome: string;
  qualidade: string;
  estoque: number;
  precoCompra: number;
  precoVenda: number;
  margem: number;
  imagemUrl: string | null;
  grupo: string;
  dimensao: string;
  hastes: number;
  hastesEmbalagem: number;
  codigo: string;
  // Campos extras para Veiling
  freteUnit?: number;
  valorIcmsUnit?: number;
  custoFinal?: number;
};

type OrigemFiltro = "todos" | "veiling" | "cooperflora";

const LIMIT = 200;

export default function CatalogoUnificado() {
  const [busca, setBusca] = useState("");
  const [buscaInput, setBuscaInput] = useState("");
  const [origemFiltro, setOrigemFiltro] = useState<OrigemFiltro>("todos");
  const [qualidadeFiltro, setQualidadeFiltro] = useState("");
  const [grupoFiltro, setGrupoFiltro] = useState("");
  const [offset, setOffset] = useState(0);
  const [allItems, setAllItems] = useState<ProdutoUnificado[]>([]);
  const [modalPedido, setModalPedido] = useState<{ nome: string; qtd: number; preco: number } | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Buscar grupos disponíveis
  const { data: grupos } = trpc.catalogoUnificado.listGrupos.useQuery({ origem: origemFiltro });

  const { data, isFetching, refetch } = trpc.catalogoUnificado.listProdutos.useQuery({
    busca: busca || undefined,
    origem: origemFiltro,
    qualidade: qualidadeFiltro || undefined,
    grupo: grupoFiltro || undefined,
    limit: LIMIT,
    offset,
  });

  // Acumular itens ao paginar
  const prevDataRef = useRef<typeof data | null>(null);
  if (data && data !== prevDataRef.current) {
    prevDataRef.current = data;
    if (offset === 0) {
      setAllItems(data.items as ProdutoUnificado[]);
    } else {
      setAllItems(prev => {
        const ids = new Set(prev.map(p => p.id));
        const novos = (data.items as ProdutoUnificado[]).filter(p => !ids.has(p.id));
        return [...prev, ...novos];
      });
    }
  }

  const total = data?.total ?? 0;
  const hasMore = allItems.length < total;

  const resetPagination = () => { setOffset(0); setAllItems([]); };

  const handleBuscaChange = useCallback((v: string) => {
    setBuscaInput(v);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setBusca(v);
      setOffset(0);
      setAllItems([]);
    }, 400);
  }, []);

  const handleFiltroOrigem = (o: OrigemFiltro) => {
    setOrigemFiltro(o);
    setGrupoFiltro(""); // limpar grupo ao trocar origem
    resetPagination();
  };

  const handleFiltroQualidade = (q: string) => {
    setQualidadeFiltro(q === qualidadeFiltro ? "" : q);
    resetPagination();
  };

  const handleFiltroGrupo = (g: string) => {
    setGrupoFiltro(g === grupoFiltro ? "" : g);
    resetPagination();
  };

  const origemBadge = (origem: "Veiling" | "Cooperflora") => {
    if (origem === "Veiling") {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold px-2 py-0.5">
          Veiling
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-semibold px-2 py-0.5">
        Cooperflora
      </Badge>
    );
  };

  const qualidadeBadge = (q: string) => {
    if (!q) return null;
    const isA1 = q.toUpperCase().includes("A1");
    return (
      <Badge className={`text-xs font-bold px-1.5 py-0 ${isA1 ? "bg-green-100 text-green-800 border-green-300" : "bg-yellow-100 text-yellow-800 border-yellow-300"}`}>
        {q}
      </Badge>
    );
  };

  const temFiltrosAtivos = qualidadeFiltro || grupoFiltro || busca || origemFiltro !== "todos";

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Catálogo Unificado</h1>
            <p className="text-xs text-gray-500">
              {isFetching ? "Carregando..." : `${total.toLocaleString()} produtos — Veiling + Cooperflora`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {temFiltrosAtivos && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-gray-500 gap-1 hover:text-red-500"
                onClick={() => {
                  setBusca(""); setBuscaInput(""); setQualidadeFiltro("");
                  setGrupoFiltro(""); setOrigemFiltro("todos"); resetPagination();
                }}
              >
                <X size={12} /> Limpar filtros
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { resetPagination(); refetch(); }} className="gap-1 text-xs">
              <RefreshCw size={12} /> Atualizar
            </Button>
          </div>
        </div>

        {/* Linha de filtros */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Busca */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={buscaInput}
              onChange={e => handleBuscaChange(e.target.value)}
              placeholder="Buscar produto..."
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Filtro Origem */}
          <div className="flex gap-1">
            {(["todos", "cooperflora", "veiling"] as OrigemFiltro[]).map(o => (
              <Button
                key={o}
                size="sm"
                variant={origemFiltro === o ? "default" : "outline"}
                className={`h-8 text-xs px-3 ${origemFiltro === o
                  ? o === "veiling" ? "bg-blue-600 hover:bg-blue-700" : o === "cooperflora" ? "bg-green-700 hover:bg-green-800" : "bg-gray-700 hover:bg-gray-800"
                  : ""}`}
                onClick={() => handleFiltroOrigem(o)}
              >
                {o === "todos" ? "Todos" : o === "veiling" ? "Veiling" : "Cooperflora"}
              </Button>
            ))}
          </div>

          {/* Filtro Qualidade */}
          <div className="flex gap-1">
            {["A1", "A2"].map(q => (
              <Button
                key={q}
                size="sm"
                variant={qualidadeFiltro === q ? "default" : "outline"}
                className={`h-8 text-xs px-3 ${qualidadeFiltro === q
                  ? q === "A1" ? "bg-green-600 hover:bg-green-700" : "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : ""}`}
                onClick={() => handleFiltroQualidade(q)}
              >
                {q}
              </Button>
            ))}
          </div>

          {/* Filtro Grupo — Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 text-xs px-3 gap-1 max-w-[200px] ${grupoFiltro ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold" : ""}`}
              >
                <span className="truncate">{grupoFiltro || "Grupo / Categoria"}</span>
                <ChevronDown size={12} className="shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto min-w-[200px]">
              {grupoFiltro && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleFiltroGrupo("")}
                    className="text-xs text-red-500 font-medium gap-1"
                  >
                    <X size={11} /> Remover filtro de grupo
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {!grupos || grupos.length === 0 ? (
                <DropdownMenuItem disabled className="text-xs text-gray-400">
                  Nenhum grupo encontrado
                </DropdownMenuItem>
              ) : (
                grupos.map(g => (
                  <DropdownMenuItem
                    key={g}
                    onClick={() => handleFiltroGrupo(g)}
                    className={`text-xs cursor-pointer ${grupoFiltro === g ? "bg-indigo-50 text-indigo-700 font-semibold" : ""}`}
                  >
                    {g}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags de filtros ativos */}
        {(grupoFiltro || qualidadeFiltro) && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {grupoFiltro && (
              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                Grupo: {grupoFiltro}
                <button onClick={() => { setGrupoFiltro(""); resetPagination(); }} className="hover:text-indigo-900">
                  <X size={10} />
                </button>
              </span>
            )}
            {qualidadeFiltro && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                Qualidade: {qualidadeFiltro}
                <button onClick={() => { setQualidadeFiltro(""); resetPagination(); }} className="hover:text-green-900">
                  <X size={10} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr className="text-xs text-gray-600 uppercase tracking-wide">
              <th className="px-3 py-2 text-left font-semibold w-12"></th>
              <th className="px-3 py-2 text-left font-semibold">Produto</th>
              <th className="px-3 py-2 text-center font-semibold w-28">Catálogo</th>
              <th className="px-3 py-2 text-center font-semibold w-20">Qualidade</th>
              <th className="px-3 py-2 text-left font-semibold w-32">Grupo</th>
              <th className="px-3 py-2 text-right font-semibold w-24">Estoque</th>
              <th className="px-3 py-2 text-right font-semibold w-28">Preço Compra</th>
              <th className="px-3 py-2 text-right font-semibold w-28">Preço Venda</th>
              <th className="px-3 py-2 text-center font-semibold w-16">ADD</th>
            </tr>
          </thead>
          <tbody>
            {allItems.length === 0 && !isFetching && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                  Nenhum produto encontrado
                </td>
              </tr>
            )}
            {allItems.map((p, idx) => (
              <tr
                key={p.id}
                className={`border-b transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                {/* Imagem */}
                <td className="px-2 py-1">
                  {p.imagemUrl ? (
                    <img
                      src={p.imagemUrl}
                      alt={p.nome}
                      className="w-10 h-10 object-cover rounded-md border border-gray-200 shadow-sm"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-300 text-xs">
                      <span className="text-gray-300">—</span>
                    </div>
                  )}
                </td>

                {/* Nome */}
                <td className="px-3 py-1">
                  <span className="font-medium text-gray-800 text-xs leading-tight">
                    {`${p.nome}${p.qualidade ? ` ${p.qualidade}` : ""}${p.grupo ? ` ${p.grupo}` : ""}`}
                  </span>
                  {p.dimensao && (
                    <span className="ml-1 text-gray-400 text-xs">{p.dimensao}</span>
                  )}
                </td>

                {/* Catálogo (origem) */}
                <td className="px-3 py-1 text-center">
                  {origemBadge(p.origem)}
                </td>

                {/* Qualidade */}
                <td className="px-3 py-1 text-center">
                  {qualidadeBadge(p.qualidade)}
                </td>

                {/* Grupo */}
                <td className="px-3 py-1">
                  <span className="text-xs text-gray-500 truncate max-w-[120px] block">{p.grupo || "—"}</span>
                </td>

                {/* Estoque */}
                <td className="px-3 py-1 text-right">
                  <span className={`text-xs font-medium ${p.estoque > 0 ? "text-gray-700" : "text-red-400"}`}>
                    {p.estoque > 0 ? p.estoque.toLocaleString() : "Esgotado"}
                  </span>
                </td>

                {/* Preço Compra */}
                <td className="px-3 py-1 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-600">
                      {p.precoCompra > 0 ? `R$ ${p.precoCompra.toFixed(2)}` : "—"}
                    </span>
                    {p.origem === 'Veiling' && ((p.freteUnit ?? 0) > 0 || (p.valorIcmsUnit ?? 0) > 0) && (
                      <span className="text-[10px] text-gray-400 leading-tight">
                        {(p.freteUnit ?? 0) > 0 && (
                          <span className="text-blue-500">+frete R$ {(p.freteUnit!).toFixed(2)}</span>
                        )}
                        {(p.freteUnit ?? 0) > 0 && (p.valorIcmsUnit ?? 0) > 0 && " "}
                        {(p.valorIcmsUnit ?? 0) > 0 && (
                          <span className="text-red-500">+ICMS R$ {(p.valorIcmsUnit!).toFixed(2)}</span>
                        )}
                      </span>
                    )}
                  </div>
                </td>

                {/* Preço Venda */}
                <td className="px-3 py-1 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold text-green-700">
                      {p.precoVenda > 0 ? `R$ ${p.precoVenda.toFixed(2)}` : "—"}
                    </span>
                    {p.margem > 0 && (
                      <span className="text-[10px] text-gray-400">{p.margem.toFixed(0)}% margem</span>
                    )}
                  </div>
                </td>

                {/* ADD */}
                <td className="px-2 py-1 text-center">
                  {p.estoque > 0 ? (
                    <Button
                      size="sm"
                      className="h-7 w-7 p-0 bg-orange-500 hover:bg-orange-600 text-white"
                      title="Adicionar ao Orçamento"
                      onClick={() => setModalPedido({ nome: p.nome, qtd: 1, preco: p.precoVenda })}
                    >
                      <ShoppingCart size={12} />
                    </Button>
                  ) : (
                    <span className="text-xs text-red-300">—</span>
                  )}
                </td>
              </tr>
            ))}

            {/* Linha de carregamento */}
            {isFetching && (
              <tr>
                <td colSpan={9} className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando produtos...
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Carregar mais */}
        {hasMore && !isFetching && (
          <div className="flex justify-center py-4">
            <Button variant="outline" size="sm" onClick={() => setOffset(allItems.length)} className="text-xs gap-1">
              Carregar mais ({allItems.length} de {total})
            </Button>
          </div>
        )}

        {!hasMore && allItems.length > 0 && !isFetching && (
          <div className="text-center py-3 text-xs text-gray-400">
            Todos os {total.toLocaleString()} produtos carregados
          </div>
        )}
      </div>

      {/* Modal Adicionar ao Orçamento */}
      {modalPedido && (
        <ModalAdicionarPedidoCompra
          produtoNome={modalPedido.nome}
          quantidade={modalPedido.qtd}
          precoUnitario={modalPedido.preco}
          onClose={() => setModalPedido(null)}
        />
      )}
    </div>
  );
}
