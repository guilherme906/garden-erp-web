import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Produtos() {
  const { erpUser } = useErpAuth();
  const isAdmin = erpUser?.perfil === "ADMIN";
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ descricao: "", custo: "", fatorConversao: "1", preco: "", codigoExterno: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; descricao: string } | null>(null);
  const utils = trpc.useUtils();
  const { data: produtos, isLoading } = trpc.produtos.list.useQuery({});
  const { data: historico } = trpc.produtos.historico.useQuery({ id: editId! }, { enabled: !!editId });
  const createMut = trpc.produtos.create.useMutation({ onSuccess: () => { utils.produtos.list.invalidate(); toast.success("Produto cadastrado!"); closeForm(); } });
  const updateMut = trpc.produtos.update.useMutation({ onSuccess: () => { utils.produtos.list.invalidate(); toast.success("Produto atualizado!"); closeForm(); } });
  const deleteMut = trpc.produtos.delete.useMutation({
    onSuccess: () => { utils.produtos.list.invalidate(); toast.success("Produto movido para lixeira!"); setDeleteConfirm(null); },
    onError: (e) => toast.error("Erro ao excluir: " + e.message),
  });

  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ descricao: "", custo: "", fatorConversao: "1", preco: "", codigoExterno: "" }); };

  const openEdit = (p: any) => {
    setForm({
      descricao: p.descricao,
      custo: String(p.custo || 0),
      fatorConversao: String(p.fatorConversao || 1),
      preco: String(p.preco || 0),
      codigoExterno: p.codigoExterno || "",
    });
    setEditId(p.id);
    setShowForm(true);
  };

  // Calcular preço automaticamente quando custo ou fator mudam
  const updateCusto = (val: string) => {
    const custo = Number(val) || 0;
    const fator = Number(form.fatorConversao) || 1;
    setForm({ ...form, custo: val, preco: (custo * fator).toFixed(2) });
  };

  const updateFator = (val: string) => {
    const custo = Number(form.custo) || 0;
    const fator = Number(val) || 1;
    setForm({ ...form, fatorConversao: val, preco: (custo * fator).toFixed(2) });
  };

  const handleSave = () => {
    if (!form.descricao.trim()) { toast.error("Descrição é obrigatória"); return; }
    if (editId) {
      updateMut.mutate({ id: editId, ...form, usuarioNome: erpUser?.nome });
    } else {
      createMut.mutate(form);
    }
  };

  const handleDelete = (e: React.MouseEvent, p: any) => {
    e.stopPropagation();
    setDeleteConfirm({ id: p.id, descricao: p.descricao });
  };

  const filtered = useMemo(() => {
    if (!produtos) return [];
    if (!search) return produtos;
    const s = search.toLowerCase();
    return produtos.filter((p: any) =>
      p.descricao.toLowerCase().includes(s) || (p.codigoExterno && p.codigoExterno.toLowerCase().includes(s))
    );
  }, [produtos, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Produtos</h1>
        <Button className="h-10 sm:h-9 text-sm px-4" onClick={() => { setEditId(null); setForm({ descricao: "", custo: "", fatorConversao: "1", preco: "", codigoExterno: "" }); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Novo Produto</span><span className="sm:hidden">Novo</span>
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por descrição ou código..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 sm:h-9 text-sm" />
        </div>
        {search && <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-9 sm:w-9" onClick={() => setSearch("")}><X className="h-4 w-4" /></Button>}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Código Ext.</TableHead>
                <TableHead className="text-right">Custo Unit.</TableHead>
                <TableHead className="text-right">Fator</TableHead>
                <TableHead className="text-right">Preço (Custo × Fator)</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                {isAdmin && <TableHead className="w-16 text-center">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</TableCell></TableRow>
              ) : filtered?.map((p: any) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onDoubleClick={() => openEdit(p)}>
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="font-medium">{p.descricao}</TableCell>
                  <TableCell className="text-muted-foreground">{p.codigoExterno || "-"}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">R$ {Number(p.custo || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">{Number(p.fatorConversao || 1).toFixed(4)}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">R$ {Number(p.preco).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={p.estoque > 0 ? "default" : p.estoque < 0 ? "destructive" : "secondary"}>
                      {p.estoque}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDelete(e, p)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Edição/Criação */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) closeForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Descrição *</label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Custo Unitário</label>
                <Input type="number" step="0.01" value={form.custo} onChange={e => updateCusto(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm font-medium">Fator Conversão</label>
                <Input type="number" step="0.0001" value={form.fatorConversao} onChange={e => updateFator(e.target.value)} placeholder="1.0000" />
              </div>
              <div>
                <label className="text-sm font-medium">Preço (auto)</label>
                <Input type="number" step="0.01" value={form.preco} readOnly className="bg-muted/50 font-semibold" />
                <p className="text-xs sm:text-[10px] text-muted-foreground mt-0.5">Custo × Fator</p>
              </div>
            </div>
            <div><label className="text-sm font-medium">Código Externo</label><Input value={form.codigoExterno} onChange={e => setForm({ ...form, codigoExterno: e.target.value })} /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="flex-1">
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editId ? "Salvar Alterações" : "Cadastrar"}
              </Button>
              {editId && isAdmin && (
                <Button variant="destructive" onClick={() => { closeForm(); setDeleteConfirm({ id: editId, descricao: form.descricao }); }}>
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir
                </Button>
              )}
              <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            </div>
          </div>
          {editId && historico && historico.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">Histórico de Alterações</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {historico.map((h: any) => (
                  <div key={h.id} className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2">
                    <span className="font-medium">{h.campo}</span>: {h.valorAntigo} → {h.valorNovo}
                    <span className="ml-2 opacity-60">por {h.usuarioNome} em {new Date(h.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={!!deleteConfirm} onOpenChange={v => { if (!v) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">Mover para Lixeira</DialogTitle>
            <DialogDescription>
              O produto <strong>"{deleteConfirm?.descricao}"</strong> será movido para a lixeira. Você poderá restaurá-lo depois em Configurações &gt; Lixeira.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMut.mutate({ id: deleteConfirm.id })} disabled={deleteMut.isPending}>
              {deleteMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Mover para Lixeira
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
