import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, ToggleLeft, ToggleRight, Tag, Package, Filter } from "lucide-react";

interface ProdutoForm {
  categoriaId?: number;
  categoriaNome: string;
  variedade: string;
  tamanho: string;
  qtdHasteMaco: string;
  valorUnitario: number;
  observacao: string;
}

const FORM_VAZIO: ProdutoForm = {
  categoriaNome: "",
  variedade: "",
  tamanho: "70",
  qtdHasteMaco: "10",
  valorUnitario: 0,
  observacao: "",
};

type Produto = { id: number; categoriaId: number | null; categoriaNome: string; variedade: string; tamanho: string | null; qtdHasteMaco: string | null; valorUnitario: string; ativo: number; observacao: string | null; createdAt: Date; updatedAt: Date; };

export default function ProdutosLista() {
  const utils = trpc.useUtils();

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroAtivo, setFiltroAtivo] = useState<string>("todos");

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [form, setForm] = useState<ProdutoForm>(FORM_VAZIO);

  // Confirmação de exclusão
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; nome: string } | null>(null);

  // Queries
  const { data: produtos = [] as Produto[], isLoading } = trpc.produtosLista.list.useQuery({});
  const { data: categorias = [] } = trpc.categoriasProdutos.list.useQuery();

  // Mutations
  const createMut = trpc.produtosLista.create.useMutation({
    onSuccess: () => { utils.produtosLista.list.invalidate(); toast.success("Produto cadastrado!"); setModalAberto(false); setForm(FORM_VAZIO); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const updateMut = trpc.produtosLista.update.useMutation({
    onSuccess: () => { utils.produtosLista.list.invalidate(); toast.success("Produto atualizado!"); setModalAberto(false); setEditando(null); setForm(FORM_VAZIO); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const deleteMut = trpc.produtosLista.delete.useMutation({
    onSuccess: () => { utils.produtosLista.list.invalidate(); toast.success("Produto removido!"); setConfirmDelete(null); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
  const toggleMut = trpc.produtosLista.toggleAtivo.useMutation({
    onSuccess: () => { utils.produtosLista.list.invalidate(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  // Filtros locais
  const produtosFiltrados = useMemo(() => {
    let lista: Produto[] = produtos;
    if (filtroAtivo === "ativos") lista = lista.filter((p) => p.ativo === 1);
    if (filtroAtivo === "inativos") lista = lista.filter((p) => p.ativo === 0);
    if (filtroCategoria !== "todas") lista = lista.filter((p) => p.categoriaNome === filtroCategoria);
    if (busca.trim()) {
      const b = busca.toLowerCase();
      lista = lista.filter((p) => p.variedade.toLowerCase().includes(b) || p.categoriaNome.toLowerCase().includes(b));
    }
    return lista;
  }, [produtos, filtroAtivo, filtroCategoria, busca]);

  // Agrupar por categoria
  const grupos = useMemo(() => {
    const map = new Map<string, Produto[]>();
    for (const p of produtosFiltrados) {
      if (!map.has(p.categoriaNome)) map.set(p.categoriaNome, []);
      map.get(p.categoriaNome)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [produtosFiltrados]);

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  function abrirEditar(p: Produto) {
    setEditando(p.id);
    setForm({
      categoriaId: p.categoriaId ?? undefined,
      categoriaNome: p.categoriaNome,
      variedade: p.variedade,
      tamanho: p.tamanho ?? "70",
      qtdHasteMaco: p.qtdHasteMaco ?? "10",
      valorUnitario: Number(p.valorUnitario),
      observacao: p.observacao ?? "",
    });
    setModalAberto(true);
  }

  function handleSalvar() {
    if (!form.categoriaNome.trim()) return toast.error("Selecione ou informe a categoria");
    if (!form.variedade.trim()) return toast.error("Informe a variedade");
    if (editando !== null) {
      updateMut.mutate({ id: editando, ...form });
    } else {
      createMut.mutate(form);
    }
  }

  function handleCategoria(val: string) {
    const cat = categorias.find(c => c.nome === val);
    setForm(f => ({ ...f, categoriaNome: val, categoriaId: cat?.id }));
  }

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex flex-wrap items-center gap-2">
        <Button onClick={abrirNovo} className="bg-green-600 hover:bg-green-700 text-white gap-1 text-sm h-8">
          <Plus className="w-4 h-4" /> Novo Produto
        </Button>

        {/* Busca */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Buscar produto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>

        {/* Filtro categoria */}
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="h-8 text-sm w-44">
            <Filter className="w-3.5 h-3.5 mr-1 text-gray-400" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {categorias.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Filtro ativo */}
        <Select value={filtroAtivo} onValueChange={setFiltroAtivo}>
          <SelectTrigger className="h-8 text-sm w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-gray-500 ml-auto">{produtosFiltrados.length} produto(s)</span>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">Carregando...</div>
        ) : grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <Package className="w-10 h-10 opacity-30" />
            <p className="text-sm">Nenhum produto encontrado.</p>
            <Button onClick={abrirNovo} variant="outline" size="sm">Cadastrar primeiro produto</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {grupos.map(([catNome, itens]) => (
              <div key={catNome} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Cabeçalho do grupo */}
                <div className="bg-green-50 border-b border-green-100 px-4 py-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-800 text-sm uppercase tracking-wide">{catNome}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">{itens.length}</Badge>
                </div>

                {/* Tabela */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b bg-gray-50">
                      <th className="text-left px-4 py-2 font-medium">VARIEDADE</th>
                      <th className="text-center px-3 py-2 font-medium">TAM.</th>
                      <th className="text-center px-3 py-2 font-medium">QTD HST/MÇ</th>
                      <th className="text-right px-3 py-2 font-medium">VALOR UNIT.</th>
                      <th className="text-center px-3 py-2 font-medium">STATUS</th>
                      <th className="text-center px-3 py-2 font-medium">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((p) => (
                      <tr key={p.id} className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${p.ativo === 0 ? "opacity-50" : ""}`}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{p.variedade}</td>
                        <td className="px-3 py-2.5 text-center text-gray-600">{p.tamanho ?? "-"}</td>
                        <td className="px-3 py-2.5 text-center text-gray-600">{p.qtdHasteMaco ?? "-"}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                          R$ {Number(p.valorUnitario).toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            onClick={() => toggleMut.mutate({ id: p.id, ativo: p.ativo === 0 })}
                            title={p.ativo === 1 ? "Clique para inativar" : "Clique para ativar"}
                            className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 transition-colors"
                          >
                            {p.ativo === 1 ? (
                              <><ToggleRight className="w-5 h-5 text-green-500" /><span className="text-green-600">Ativo</span></>
                            ) : (
                              <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-400">Inativo</span></>
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => abrirEditar(p)} className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded" title="Editar">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setConfirmDelete({ id: p.id, nome: `${p.categoriaNome} - ${p.variedade}` })} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Excluir">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Cadastro/Edição */}
      <Dialog open={modalAberto} onOpenChange={v => { if (!v) { setModalAberto(false); setEditando(null); setForm(FORM_VAZIO); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              {editando !== null ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Categoria */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 uppercase">Categoria / Tipo *</label>
              {categorias.length > 0 ? (
                <Select value={form.categoriaNome} onValueChange={handleCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                  Nenhuma categoria cadastrada. Vá em <strong>Listas de Preços → Categorias</strong> para criar.
                </div>
              )}
              {/* Permite digitar manualmente se não houver categorias */}
              {categorias.length === 0 && (
                <Input
                  placeholder="Digite a categoria manualmente"
                  value={form.categoriaNome}
                  onChange={e => setForm(f => ({ ...f, categoriaNome: e.target.value.toUpperCase() }))}
                  className="uppercase mt-1"
                />
              )}
            </div>

            {/* Variedade */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 uppercase">Variedade *</label>
              <Input
                placeholder="Ex: BRANCA, LARANJA, MISTO..."
                value={form.variedade}
                onChange={e => setForm(f => ({ ...f, variedade: e.target.value.toUpperCase() }))}
                className="uppercase"
              />
            </div>

            {/* Tamanho e Qtd */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 uppercase">Tamanho (cm)</label>
                <Input
                  placeholder="Ex: 70, 60/70"
                  value={form.tamanho}
                  onChange={e => setForm(f => ({ ...f, tamanho: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 uppercase">Qtd HST/MÇ</label>
                <Input
                  placeholder="Ex: 10, 1 KG, 150"
                  value={form.qtdHasteMaco}
                  onChange={e => setForm(f => ({ ...f, qtdHasteMaco: e.target.value }))}
                />
              </div>
            </div>

            {/* Valor */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 uppercase">Valor Unitário (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.valorUnitario || ""}
                onChange={e => setForm(f => ({ ...f, valorUnitario: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            {/* Observação */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 uppercase">Observação</label>
              <Textarea
                placeholder="Observações opcionais..."
                value={form.observacao}
                onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalAberto(false); setEditando(null); setForm(FORM_VAZIO); }}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={isPending} className="bg-green-600 hover:bg-green-700">
              {isPending ? "Salvando..." : editando !== null ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal confirmação exclusão */}
      <Dialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir o produto <strong>{confirmDelete?.nome}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && deleteMut.mutate({ id: confirmDelete.id })}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Removendo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
