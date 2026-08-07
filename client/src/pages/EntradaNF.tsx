import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus, ArrowLeft, RefreshCw, Save, Trash2, X, Loader2,
  CheckCircle2, Search, PackageCheck, MoreVertical, FileText, Pencil
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type View = "list" | "form";

function statusBadge(status: string | null | undefined) {
  if (status === "CONFIRMADO")
    return <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-100 text-green-800">CONFIRMADO</span>;
  return <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-yellow-100 text-yellow-800">RASCUNHO</span>;
}

export default function EntradaNF() {
  const utils = trpc.useUtils();
  const { data: compras, isLoading } = trpc.compras.list.useQuery();
  const createMut = trpc.compras.create.useMutation({ onSuccess: () => { utils.compras.list.invalidate(); } });
  const confirmarMut = trpc.compras.confirmar.useMutation({ onSuccess: () => { utils.compras.list.invalidate(); toast.success("Entrada confirmada!"); } });
  const updateItemMut = trpc.compras.updateItem.useMutation({ onSuccess: () => { utils.compras.list.invalidate(); } });
  const deleteItemMut = trpc.compras.deleteItem.useMutation({ onSuccess: () => { utils.compras.list.invalidate(); } });
  const addItemMut = trpc.compras.addItem.useMutation({ onSuccess: () => { utils.compras.list.invalidate(); } });
  const updateMut = trpc.compras.update.useMutation({ onSuccess: () => { utils.compras.list.invalidate(); toast.success("Nota atualizada!"); setShowEditDialog(false); } });
  const deleteMut = trpc.compras.delete.useMutation({ onSuccess: () => { utils.compras.list.invalidate(); toast.success("Nota excluída!"); } });
  const createProdutoMut = trpc.produtos.create.useMutation({
    onSuccess: () => { utils.produtos.list.invalidate(); },
    onError: (e) => toast.error("Erro ao cadastrar produto: " + e.message),
  });

  // ─── View state ───
  const [view, setView] = useState<View>("list");
  const [editCompra, setEditCompra] = useState<any>(null);
  const [search, setSearch] = useState("");
  // ─── Edit dialog state ───
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editDialogId, setEditDialogId] = useState<number | null>(null);
  const [editDialogFornecedor, setEditDialogFornecedor] = useState("");
  const [editDialogNumNF, setEditDialogNumNF] = useState("");
  const [editDialogData, setEditDialogData] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; fornecedor: string } | null>(null);

  function openEditDialog(c: any) {
    setEditDialogId(c.id);
    setEditDialogFornecedor(c.fornecedor || "");
    setEditDialogNumNF(c.numNF || "");
    setEditDialogData(c.data || "");
    setShowEditDialog(true);
  }

  function handleEditDialogSave() {
    if (!editDialogId) return;
    updateMut.mutate({ id: editDialogId, fornecedor: editDialogFornecedor, numNF: editDialogNumNF, data: editDialogData });
  }

  // ─── Form state ───
  const [fornecedor, setFornecedor] = useState("");
  const [numNF, setNumNF] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));

  // ─── Add item state ───
  const [prodInput, setProdInput] = useState("");
  const [qtdInput, setQtdInput] = useState("1");
  const [vlrInput, setVlrInput] = useState("0");
  const [showProdSug, setShowProdSug] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState<number | undefined>();
  const prodRef = useRef<HTMLDivElement>(null);

  // ─── Edit item state ───
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [editItemProdNome, setEditItemProdNome] = useState("");
  const [editItemProdId, setEditItemProdId] = useState<number | undefined>();
  const [editItemQtd, setEditItemQtd] = useState("");
  const [editItemVlr, setEditItemVlr] = useState("");
  const [showEditProdSug, setShowEditProdSug] = useState(false);
  const editProdRef = useRef<HTMLDivElement | null>(null);

  // ─── Product search ───
  const { data: prodSugData } = trpc.compras.searchProdutos.useQuery(
    { termo: prodInput },
    { enabled: prodInput.length >= 2 }
  );
  const { data: editProdSugData } = trpc.compras.searchProdutos.useQuery(
    { termo: editItemProdNome },
    { enabled: editItemProdNome.length >= 2 && showEditProdSug }
  );

  const prodSuggestions = [
    ...(prodSugData?.loja || []).map((p: any) => ({ ...p, _src: "loja" })),
    ...(prodSugData?.geral || []).filter((p: any) =>
      !(prodSugData?.loja || []).some((l: any) => l.nome === p.nome)
    ).map((p: any) => ({ ...p, _src: "geral" })),
  ].slice(0, 10);

  const editProdSuggestions = [
    ...(editProdSugData?.loja || []).map((p: any) => ({ ...p, _src: "loja" })),
    ...(editProdSugData?.geral || []).filter((p: any) =>
      !(editProdSugData?.loja || []).some((l: any) => l.nome === p.nome)
    ).map((p: any) => ({ ...p, _src: "geral" })),
  ].slice(0, 10);

  // ─── Filtered list ───
  const filteredCompras = (compras || []).filter((c: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(c.id).includes(s) ||
      (c.fornecedor || "").toLowerCase().includes(s) ||
      (c.numNF || "").toLowerCase().includes(s) ||
      (c.data || "").includes(s)
    );
  }).sort((a: any, b: any) => {
    // Rascunhos primeiro
    if (a.status === "RASCUNHO" && b.status !== "RASCUNHO") return -1;
    if (a.status !== "RASCUNHO" && b.status === "RASCUNHO") return 1;
    return b.id - a.id;
  });

  const rascunhosCount = (compras || []).filter((c: any) => c.status !== "CONFIRMADO").length;

  // ─── Open entry ───
  function openEdit(c: any) {
    setEditCompra(c);
    setFornecedor(c.fornecedor || "");
    setNumNF(c.numNF || "");
    setData(c.data || new Date().toISOString().slice(0, 10));
    setEditingItemIdx(null);
    clearItemInputs();
    setView("form");
  }

  function novoRegistro() {
    setEditCompra(null);
    setFornecedor("");
    setNumNF("");
    setData(new Date().toISOString().slice(0, 10));
    setEditingItemIdx(null);
    clearItemInputs();
    setView("form");
  }

  function voltarLista() {
    setView("list");
    setEditCompra(null);
    setEditingItemIdx(null);
  }

  function clearItemInputs() {
    setProdInput("");
    setQtdInput("1");
    setVlrInput("0");
    setSelectedProdId(undefined);
    setShowProdSug(false);
  }

  // ─── Add item ───
  async function addItem() {
    if (!prodInput.trim()) { toast.error("Informe o produto"); return; }
    if (!editCompra) {
      // Criar nova entrada primeiro
      const result = await createMut.mutateAsync({
        fornecedor,
        numNF,
        data,
        total: "0",
        itens: [{
          produtoId: selectedProdId,
          produtoNome: prodInput.trim().toUpperCase(),
          quantidade: qtdInput,
          valorUnitario: vlrInput,
          subtotal: String(parseFloat(qtdInput) * parseFloat(vlrInput)),
        }],
      });
      const updated = await utils.compras.list.fetch();
      const nova = (updated || []).find((c: any) => c.id === result.id);
      if (nova) setEditCompra(nova);
      clearItemInputs();
      return;
    }
    await addItemMut.mutateAsync({
      compraId: editCompra.id,
      produtoId: selectedProdId,
      produtoNome: prodInput.trim().toUpperCase(),
      quantidade: qtdInput,
      valorUnitario: vlrInput,
      subtotal: String(parseFloat(qtdInput) * parseFloat(vlrInput)),
    });
    // Refresh compra
    const updated = await utils.compras.list.fetch();
    const nova = (updated || []).find((c: any) => c.id === editCompra.id);
    if (nova) setEditCompra(nova);
    clearItemInputs();
  }

  function selectProduto(p: any) {
    setProdInput(p.nome || p.descricao || "");
    setSelectedProdId(p.id);
    setVlrInput(String(p.precoCusto || p.preco || 0));
    setShowProdSug(false);
  }

  async function cadastrarProdutoRapido() {
    const desc = prodInput.trim().toUpperCase();
    if (!desc) { toast.error("Digite o nome do produto"); return; }
    try {
      const result = await createProdutoMut.mutateAsync({ descricao: desc, preco: vlrInput || "0" });
      const prodId = typeof result?.id === "number" ? result.id : undefined;
      setProdInput(desc);
      setSelectedProdId(prodId);
      setShowProdSug(false);
      toast.success(`Produto "${desc}" cadastrado!`);
    } catch { /* erro já tratado no onError */ }
  }

  async function cadastrarProdutoRapidoEdit() {
    const desc = editItemProdNome.trim().toUpperCase();
    if (!desc) { toast.error("Digite o nome do produto"); return; }
    try {
      const result = await createProdutoMut.mutateAsync({ descricao: desc, preco: editItemVlr || "0" });
      const prodId = typeof result?.id === "number" ? result.id : undefined;
      setEditItemProdNome(desc);
      setEditItemProdId(prodId);
      setShowEditProdSug(false);
      toast.success(`Produto "${desc}" cadastrado!`);
    } catch { /* erro já tratado no onError */ }
  }

  // ─── Edit item ───
  function startEditItem(idx: number) {
    const item = editCompra?.itens?.[idx];
    if (!item) return;
    setEditingItemIdx(idx);
    setEditItemProdNome(item.produtoNome || "");
    setEditItemProdId(item.produtoId || undefined);
    setEditItemQtd(String(item.quantidade));
    setEditItemVlr(String(item.valorUnitario));
    setShowEditProdSug(false);
  }

  async function saveEditItem() {
    if (editingItemIdx === null || !editCompra) return;
    const item = editCompra.itens[editingItemIdx];
    await updateItemMut.mutateAsync({
      itemId: item.id,
      compraId: editCompra.id,
      produtoId: editItemProdId,
      produtoNome: editItemProdNome.trim().toUpperCase(),
      quantidade: editItemQtd,
      valorUnitario: editItemVlr,
      subtotal: String(parseFloat(editItemQtd) * parseFloat(editItemVlr)),
    });
    const updated = await utils.compras.list.fetch();
    const nova = (updated || []).find((c: any) => c.id === editCompra.id);
    if (nova) setEditCompra(nova);
    setEditingItemIdx(null);
    toast.success("Item atualizado");
  }

  function cancelEditItem() {
    setEditingItemIdx(null);
    setShowEditProdSug(false);
  }

  function selectEditProduto(p: any) {
    setEditItemProdNome(p.nome || p.descricao || "");
    setEditItemProdId(p.id);
    setEditItemVlr(String(p.precoCusto || p.preco || 0));
    setShowEditProdSug(false);
  }

  async function removeItem(idx: number) {
    if (!editCompra) return;
    const item = editCompra.itens[idx];
    await deleteItemMut.mutateAsync({ itemId: item.id, compraId: editCompra.id });
    const updated = await utils.compras.list.fetch();
    const nova = (updated || []).find((c: any) => c.id === editCompra.id);
    if (nova) setEditCompra(nova);
  }

  async function confirmarEntrada() {
    if (!editCompra) return;
    await confirmarMut.mutateAsync({ id: editCompra.id });
    const updated = await utils.compras.list.fetch();
    const nova = (updated || []).find((c: any) => c.id === editCompra.id);
    if (nova) setEditCompra(nova);
  }

  const isRascunho = !editCompra || editCompra.status !== "CONFIRMADO";
  const itens = editCompra?.itens || [];
  const total = itens.reduce((s: number, i: any) => s + parseFloat(i.subtotal || 0), 0);

  return (
    <div className="flex flex-col h-full -m-3 sm:-m-4 md:-m-6">
      {/* ═══ TOOLBAR ═══ */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-[#eee] border-b border-[#ccc] flex-wrap">
        {view === "list" ? (
          <>
            <Button size="sm" variant="outline" onClick={novoRegistro} className="h-9 sm:h-7 text-sm sm:text-[11px] gap-1.5 bg-white border-[#ccc] text-[#333] px-3">
              <Plus className="h-4 w-4 sm:h-3 sm:w-3" /> Nova Entrada
            </Button>
            <Button size="sm" variant="outline" onClick={() => utils.compras.list.invalidate()} className="h-9 sm:h-7 text-sm sm:text-[11px] gap-1.5 bg-white border-[#ccc] text-[#333] px-3">
              <RefreshCw className="h-4 w-4 sm:h-3 sm:w-3" /> <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <div className="flex-1" />
            {rascunhosCount > 0 && (
              <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-300">
                {rascunhosCount} rascunho{rascunhosCount > 1 ? "s" : ""}
              </span>
            )}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#888]" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-9 sm:h-7 pl-8 sm:pl-7 pr-2 text-sm sm:text-[11px] border border-[#ccc] rounded-sm w-full sm:w-48 focus:outline-none focus:border-[#8cbb1f]"
              />
            </div>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={voltarLista} className="h-9 sm:h-7 text-sm sm:text-[11px] gap-1.5 bg-white border-[#ccc] text-[#333] px-3">
              <ArrowLeft className="h-4 w-4 sm:h-3 sm:w-3" /> Voltar
            </Button>
            <div className="flex-1" />
            {isRascunho && editCompra && (
              <Button
                size="sm"
                onClick={confirmarEntrada}
                disabled={confirmarMut.isPending}
                className="h-9 sm:h-7 text-sm sm:text-[11px] gap-1.5 bg-[#28a745] hover:bg-[#218838] text-white border-none px-4"
              >
                {confirmarMut.isPending ? <Loader2 className="h-4 w-4 sm:h-3 sm:w-3 animate-spin" /> : <PackageCheck className="h-4 w-4 sm:h-3 sm:w-3" />}
                CONFIRMAR ENTRADA
              </Button>
            )}
            {!isRascunho && (
              <span className="text-xs text-green-700 font-medium bg-green-50 px-3 py-1.5 rounded border border-green-200 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Entrada confirmada
              </span>
            )}
          </>
        )}
      </div>

      {/* ═══ LIST VIEW ═══ */}
      <div className={view === "list" ? "flex-1 overflow-y-auto overflow-x-auto" : "hidden"}>
        <table className="w-full border-collapse text-sm sm:text-[11px] min-w-[500px]">
          <thead>
            <tr className="bg-white border-b-2 border-[#e0e0e0]">
              <th className="w-8 p-3 sm:p-2.5"></th>
              <th className="text-left p-3 sm:p-2.5 font-semibold text-[#555] text-xs uppercase tracking-wide">Número</th>
              <th className="text-left p-3 sm:p-2.5 font-semibold text-[#555] text-xs uppercase tracking-wide">Data</th>
              <th className="text-left p-3 sm:p-2.5 font-semibold text-[#555] text-xs uppercase tracking-wide">Fornecedor</th>
              <th className="text-left p-3 sm:p-2.5 font-semibold text-[#555] text-xs uppercase tracking-wide">NF</th>
              <th className="text-right p-3 sm:p-2.5 font-semibold text-[#555] text-xs uppercase tracking-wide">Total (R$)</th>
              <th className="text-left p-3 sm:p-2.5 font-semibold text-[#555] text-xs uppercase tracking-wide">Situação</th>
              <th className="w-10 p-3 sm:p-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-[#8cbb1f]" /></td></tr>
            ) : filteredCompras.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-[#888]">Nenhuma entrada encontrada</td></tr>
            ) : filteredCompras.map((c: any) => (
              <tr
                key={c.id}
                className="border-b border-[#f0f0f0] hover:bg-[#fafafa] cursor-pointer group"
                onClick={() => openEdit(c)}
              >
                <td className="p-3 sm:p-2.5 text-center">
                  <input type="checkbox" className="rounded" onClick={e => e.stopPropagation()} />
                </td>
                <td className="p-3 sm:p-2.5 font-mono font-semibold text-[#333]">#{c.id}</td>
                <td className="p-3 sm:p-2.5 text-[#555]">{c.data}</td>
                <td className="p-3 sm:p-2.5 font-medium text-[#222]">{c.fornecedor || "-"}</td>
                <td className="p-3 sm:p-2.5 font-mono text-[#555]">{c.numNF || "-"}</td>
                <td className="p-3 sm:p-2.5 text-right font-mono">{c.total ? Number(c.total).toFixed(2).replace('.', ',') : "-"}</td>
                <td className="p-3 sm:p-2.5">
                  {c.status === "CONFIRMADO" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                      <CheckCircle2 className="h-3 w-3" /> Confirmado
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Rascunho</span>
                  )}
                </td>
                <td className="p-2.5 text-center" onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded hover:bg-[#e8e8e8] text-[#666] opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => openEdit(c)}>
                        <FileText className="h-4 w-4 mr-2" /> Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(c); }}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar nota
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeleteConfirm({ id: c.id, fornecedor: c.fornecedor || `#${c.id}` })}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir nota
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ EDIT DIALOG ═══ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Nota de Entrada #{editDialogId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-[#555] mb-1 block">Fornecedor</label>
              <input
                type="text"
                value={editDialogFornecedor}
                onChange={e => setEditDialogFornecedor(e.target.value)}
                className="w-full px-3 py-2 border border-[#ccc] rounded text-sm focus:outline-none focus:border-[#8cbb1f]"
                placeholder="Nome do fornecedor"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#555] mb-1 block">Número da NF</label>
              <input
                type="text"
                value={editDialogNumNF}
                onChange={e => setEditDialogNumNF(e.target.value)}
                className="w-full px-3 py-2 border border-[#ccc] rounded text-sm focus:outline-none focus:border-[#8cbb1f]"
                placeholder="Número da nota fiscal"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#555] mb-1 block">Data</label>
              <input
                type="date"
                value={editDialogData}
                onChange={e => setEditDialogData(e.target.value)}
                className="w-full px-3 py-2 border border-[#ccc] rounded text-sm focus:outline-none focus:border-[#8cbb1f]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleEditDialogSave} disabled={updateMut.isPending} className="bg-[#8cbb1f] hover:bg-[#7aa018] text-white">
              {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DELETE CONFIRM ═══ */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#555] py-2">Deseja excluir a nota de entrada <strong>{deleteConfirm?.fornecedor}</strong>? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteConfirm) { deleteMut.mutate({ id: deleteConfirm.id }); setDeleteConfirm(null); } }}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ FORM VIEW ═══ */}
      <div className={view === "form" ? "flex-1 overflow-y-auto p-3 sm:p-4" : "hidden"}>

        {/* Seção GERAL */}
        <div className="border border-[#dee2e6] rounded mb-2.5">
          <div className="bg-[#e9ecef] px-3 py-2 sm:py-1.5 font-bold text-xs sm:text-[10px] border-b border-[#dee2e6] text-[#495057] uppercase tracking-wider">
            GERAL
          </div>
          <div className="p-3 grid grid-cols-12 gap-3 sm:gap-2.5">
            {editCompra && (
              <div className="col-span-3 sm:col-span-2 flex flex-col">
                <label className="text-xs sm:text-[10px] text-[#888] font-bold mb-1 sm:mb-0.5">ID</label>
                <input type="text" value={`#${editCompra.id}`} readOnly className="px-2 py-2 sm:px-1.5 sm:py-1 border border-[#ccc] rounded-sm text-sm sm:text-[11px] bg-[#f4f6f9]" />
              </div>
            )}
            <div className={`${editCompra ? "col-span-9 sm:col-span-6" : "col-span-12 sm:col-span-8"} flex flex-col`}>
              <label className="text-xs sm:text-[10px] text-[#888] font-bold mb-1 sm:mb-0.5">Fornecedor</label>
              <input
                type="text"
                value={fornecedor}
                onChange={e => setFornecedor(e.target.value)}
                readOnly={!isRascunho}
                placeholder="Nome do fornecedor"
                className={`px-2 py-2 sm:px-1.5 sm:py-1 border border-[#ccc] rounded-sm text-sm sm:text-[11px] w-full focus:outline-none focus:border-[#8cbb1f] ${!isRascunho ? "bg-[#f4f6f9]" : ""}`}
              />
            </div>
            <div className="col-span-6 sm:col-span-2 flex flex-col">
              <label className="text-xs sm:text-[10px] text-[#888] font-bold mb-1 sm:mb-0.5">Nº NF</label>
              <input
                type="text"
                value={numNF}
                onChange={e => setNumNF(e.target.value)}
                readOnly={!isRascunho}
                placeholder="Opcional"
                className={`px-2 py-2 sm:px-1.5 sm:py-1 border border-[#ccc] rounded-sm text-sm sm:text-[11px] w-full focus:outline-none focus:border-[#8cbb1f] ${!isRascunho ? "bg-[#f4f6f9]" : ""}`}
              />
            </div>
            <div className="col-span-6 sm:col-span-2 flex flex-col">
              <label className="text-xs sm:text-[10px] text-[#888] font-bold mb-1 sm:mb-0.5">Data</label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                readOnly={!isRascunho}
                className={`px-2 py-2 sm:px-1.5 sm:py-1 border border-[#ccc] rounded-sm text-sm sm:text-[11px] w-full focus:outline-none focus:border-[#8cbb1f] ${!isRascunho ? "bg-[#f4f6f9]" : ""}`}
              />
            </div>
            {editCompra && (
              <div className="col-span-6 sm:col-span-2 flex flex-col">
                <label className="text-xs sm:text-[10px] text-[#888] font-bold mb-1 sm:mb-0.5">Status</label>
                <div className="px-2 py-2 sm:px-1.5 sm:py-1">{statusBadge(editCompra.status)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Seção ITENS */}
        <div className="border border-[#dee2e6] rounded mb-2.5">
          <div className="bg-[#e9ecef] px-3 py-2 sm:py-1.5 font-bold text-xs sm:text-[10px] border-b border-[#dee2e6] text-[#495057] uppercase tracking-wider">
            ITENS
          </div>

          {isRascunho && (
            <div className="p-3 grid grid-cols-12 gap-3 sm:gap-2.5">
              {/* Campo Produto */}
              <div className="col-span-12 md:col-span-6 flex flex-col relative" ref={prodRef}>
                <label className="text-xs sm:text-[10px] text-[#888] font-bold mb-1 sm:mb-0.5">Produto</label>
                <input
                  type="text"
                  value={prodInput}
                  onChange={e => { setProdInput(e.target.value); setShowProdSug(true); setSelectedProdId(undefined); }}
                  onFocus={() => setShowProdSug(true)}
                  onBlur={() => setTimeout(() => setShowProdSug(false), 350)}
                  placeholder="Buscar produto por semelhança..."
                  autoComplete="off"
                  className="px-2 py-2 sm:px-1.5 sm:py-1 border border-[#ccc] rounded-sm text-sm sm:text-[11px] w-full focus:outline-none focus:border-[#8cbb1f]"
                />
                {showProdSug && prodInput.length >= 2 && (
                  <div className="absolute top-[52px] sm:top-[42px] left-0 w-full bg-white border border-[#8cbb1f] z-[9999] shadow-lg max-h-[250px] overflow-y-auto">
                    {prodSuggestions.map((p: any) => (
                      <div
                        key={`${p._src}-${p.id}`}
                        className="px-3 py-2.5 sm:py-2 cursor-pointer border-b border-[#eee] hover:bg-[#f0f7ff] text-sm sm:text-[11px] flex items-center gap-2"
                        onMouseDown={() => selectProduto(p)}
                      >
                        <span className={`text-[9px] font-bold px-1 rounded ${p._src === "loja" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                          {p._src === "loja" ? "LOJA" : "CAD"}
                        </span>
                        <span className="flex-1 truncate">{p.nome || p.descricao}</span>
                        <span className="text-[#888] flex-shrink-0 font-mono">R$ {Number(p.precoCusto || p.preco || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    <div
                      className="px-3 py-3 sm:py-2 cursor-pointer bg-[#e8f5e9] text-[#2e7d32] font-bold border-t-2 border-[#8cbb1f] text-sm sm:text-[11px] active:bg-[#c8e6c9]"
                      onMouseDown={(e) => { e.preventDefault(); cadastrarProdutoRapido(); }}
                    >
                      {createProdutoMut.isPending ? "Cadastrando..." : `+ CADASTRAR PRODUTO: "${prodInput.toUpperCase()}"`}
                    </div>
                  </div>
                )}
              </div>
              <div className="col-span-4 md:col-span-2 flex flex-col">
                <label className="text-xs sm:text-[10px] text-[#888] font-bold mb-1 sm:mb-0.5">Qtd</label>
                <input
                  type="number"
                  value={qtdInput}
                  onChange={e => setQtdInput(e.target.value)}
                  className="px-2 py-2 sm:px-1.5 sm:py-1 border border-[#ccc] rounded-sm text-sm sm:text-[11px] w-full focus:outline-none focus:border-[#8cbb1f]"
                />
              </div>
              <div className="col-span-4 md:col-span-2 flex flex-col">
                <label className="text-xs sm:text-[10px] text-[#888] font-bold mb-1 sm:mb-0.5">Custo Unit.</label>
                <input
                  type="number"
                  step="0.01"
                  value={vlrInput}
                  onChange={e => setVlrInput(e.target.value)}
                  className="px-2 py-2 sm:px-1.5 sm:py-1 border border-[#ccc] rounded-sm text-sm sm:text-[11px] w-full focus:outline-none focus:border-[#8cbb1f]"
                />
              </div>
              <div className="col-span-4 md:col-span-2 flex flex-col justify-end">
                <button
                  onClick={addItem}
                  disabled={addItemMut.isPending || createMut.isPending}
                  className="px-4 py-2.5 sm:px-2 sm:py-1 bg-[#8cbb1f] hover:bg-[#7aa61a] text-white border-none rounded-sm text-sm sm:text-[11px] font-bold cursor-pointer w-full disabled:opacity-50"
                >
                  {addItemMut.isPending || createMut.isPending ? "..." : "ADD"}
                </button>
              </div>
            </div>
          )}

          {!isRascunho && (
            <div className="p-3 text-center text-green-700 text-sm font-medium bg-green-50 rounded">
              Entrada confirmada — itens somente leitura
            </div>
          )}
        </div>

        {/* Grid de Itens */}
        {itens.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm sm:text-[11px] mb-2.5 min-w-[480px]">
              <thead>
                <tr className="bg-[#f8f9fa]">
                  <th className="text-left p-3 sm:p-2.5 border-b-2 border-[#dee2e6] font-semibold">Produto</th>
                  <th className="text-right p-3 sm:p-2.5 border-b-2 border-[#dee2e6] font-semibold">Qtd</th>
                  <th className="text-right p-3 sm:p-2.5 border-b-2 border-[#dee2e6] font-semibold">Custo Unit.</th>
                  <th className="text-right p-3 sm:p-2.5 border-b-2 border-[#dee2e6] font-semibold">Subtotal</th>
                  <th className="w-10 sm:w-8 p-3 sm:p-2.5 border-b-2 border-[#dee2e6]"></th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item: any, idx: number) => {
                  const ehDuplicado = !!(item.isDuplicado);
                  if (editingItemIdx === idx) return (
                    <tr key={item.id} className="border-b border-[#eee] bg-yellow-50">
                      {/* Produto editável com autocomplete */}
                      <td className="p-2 sm:p-1.5 relative">
                        <input
                          type="text"
                          value={editItemProdNome}
                          onChange={e => { setEditItemProdNome(e.target.value); setShowEditProdSug(true); setEditItemProdId(undefined); }}
                          onFocus={() => setShowEditProdSug(true)}
                          onBlur={() => setTimeout(() => setShowEditProdSug(false), 350)}
                          autoFocus
                          autoComplete="off"
                          className="w-full px-2 py-1 border border-[#8cbb1f] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#8cbb1f]"
                          onKeyDown={e => { if (e.key === "Enter") saveEditItem(); if (e.key === "Escape") cancelEditItem(); }}
                          placeholder="Buscar por semelhança..."
                        />
                        {showEditProdSug && editItemProdNome.length >= 2 && (
                          <div className="absolute top-full left-0 w-[340px] bg-white border border-[#8cbb1f] z-[9999] shadow-lg max-h-[200px] overflow-y-auto">
                            {editProdSuggestions.map((p: any) => (
                              <div
                                key={`edit-${p._src}-${p.id}`}
                                className="px-3 py-2 cursor-pointer border-b border-[#eee] hover:bg-[#f0f7ff] text-sm flex items-center gap-2"
                                onMouseDown={() => selectEditProduto(p)}
                              >
                                <span className={`text-[9px] font-bold px-1 rounded ${p._src === "loja" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                  {p._src === "loja" ? "LOJA" : "CAD"}
                                </span>
                                <span className="flex-1 truncate">{p.nome || p.descricao}</span>
                                <span className="text-[#888] font-mono">R$ {Number(p.precoCusto || p.preco || 0).toFixed(2)}</span>
                              </div>
                            ))}
                            <div
                              className="px-3 py-2 cursor-pointer bg-[#e8f5e9] text-[#2e7d32] font-bold border-t-2 border-[#8cbb1f] text-sm active:bg-[#c8e6c9]"
                              onMouseDown={(e) => { e.preventDefault(); cadastrarProdutoRapidoEdit(); }}
                            >
                              {createProdutoMut.isPending ? "Cadastrando..." : `+ CADASTRAR PRODUTO: "${editItemProdNome.toUpperCase()}"`}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 sm:p-1.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editItemQtd}
                          onChange={e => setEditItemQtd(e.target.value)}
                          className="w-20 px-2 py-1 border border-[#8cbb1f] rounded text-sm text-right focus:outline-none"
                          onKeyDown={e => { if (e.key === "Enter") saveEditItem(); if (e.key === "Escape") cancelEditItem(); }}
                        />
                      </td>
                      <td className="p-2 sm:p-1.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editItemVlr}
                          onChange={e => setEditItemVlr(e.target.value)}
                          className="w-24 px-2 py-1 border border-[#8cbb1f] rounded text-sm text-right focus:outline-none"
                          onKeyDown={e => { if (e.key === "Enter") saveEditItem(); if (e.key === "Escape") cancelEditItem(); }}
                        />
                      </td>
                      <td className="p-3 sm:p-2.5 text-right font-mono">
                        R$ {(parseFloat(editItemQtd) * parseFloat(editItemVlr)).toFixed(2)}
                      </td>
                      <td className="p-2 sm:p-1 flex gap-1 items-center">
                        <button onClick={saveEditItem} className="text-green-600 hover:text-green-800 p-1" title="Salvar">
                          <Save className="h-4 w-4 sm:h-3 sm:w-3" />
                        </button>
                        <button onClick={cancelEditItem} className="text-gray-500 hover:text-gray-700 p-1" title="Cancelar">
                          <X className="h-4 w-4 sm:h-3 sm:w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                  return (
                    <tr
                      key={item.id}
                      className={`border-b ${
                        ehDuplicado
                          ? "bg-red-50 border-red-200"
                          : isRascunho ? "border-[#eee] hover:bg-[#f0f7ff] cursor-pointer" : "border-[#eee]"
                      }`}
                      onDoubleClick={() => !ehDuplicado && isRascunho && startEditItem(idx)}
                      title={ehDuplicado ? "Item duplicado — já importado anteriormente" : isRascunho ? "Duplo clique para editar" : ""}
                    >
                      <td className={`p-3 sm:p-2.5 font-medium ${ ehDuplicado ? "text-red-700" : "" }`}>
                        <span className="flex items-center gap-2">
                          {ehDuplicado && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 shrink-0">
                              DUPLICADO
                            </span>
                          )}
                          {item.produtoNome}
                        </span>
                      </td>
                      <td className={`p-3 sm:p-2.5 text-right ${ ehDuplicado ? "text-red-600" : "" }`}>{Number(item.quantidade).toFixed(2)}</td>
                      <td className={`p-3 sm:p-2.5 text-right font-mono ${ ehDuplicado ? "text-red-600" : "" }`}>R$ {Number(item.valorUnitario).toFixed(2)}</td>
                      <td className={`p-3 sm:p-2.5 text-right font-mono ${ ehDuplicado ? "text-red-600" : "" }`}>R$ {Number(item.subtotal).toFixed(2)}</td>
                      <td className="p-2 sm:p-1">
                        {isRascunho && !ehDuplicado && (
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-red-500 hover:text-red-700 p-2 sm:p-1"
                            title="Remover item"
                          >
                            <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f8f9fa] font-bold">
                  <td colSpan={3} className="p-3 sm:p-2.5 text-right text-xs sm:text-[10px] uppercase text-[#555]">Total</td>
                  <td className="p-3 sm:p-2.5 text-right font-mono text-[#333]">R$ {total.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {itens.length === 0 && (
          <div className="text-center py-8 text-[#888] text-sm">
            {isRascunho ? "Nenhum item adicionado. Use o formulário acima para adicionar itens." : "Nenhum item nesta entrada."}
          </div>
        )}
      </div>
    </div>
  );
}
