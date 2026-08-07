import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Clientes() {
  const { erpUser } = useErpAuth();
  const isAdmin = erpUser?.perfil === "ADMIN";
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: "", telefone: "", whatsapp: "", email: "", endereco: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nome: string } | null>(null);
  const utils = trpc.useUtils();
  const { data: clientes, isLoading } = trpc.clientes.list.useQuery({ search: search || undefined });
  const { data: historico } = trpc.clientes.historico.useQuery({ id: editId! }, { enabled: !!editId });
  const createMut = trpc.clientes.create.useMutation({ onSuccess: () => { utils.clientes.list.invalidate(); toast.success("Cliente cadastrado!"); closeForm(); } });
  const updateMut = trpc.clientes.update.useMutation({ onSuccess: () => { utils.clientes.list.invalidate(); toast.success("Cliente atualizado!"); closeForm(); } });
  const deleteMut = trpc.clientes.delete.useMutation({
    onSuccess: () => { utils.clientes.list.invalidate(); toast.success("Cliente movido para lixeira!"); setDeleteConfirm(null); },
    onError: (e) => toast.error("Erro ao excluir: " + e.message),
  });

  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ nome: "", telefone: "", whatsapp: "", email: "", endereco: "" }); };

  const openEdit = (c: any) => {
    setForm({ nome: c.nome, telefone: c.telefone || "", whatsapp: c.whatsapp || "", email: c.email || "", endereco: c.endereco || "" });
    setEditId(c.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (editId) {
      updateMut.mutate({ id: editId, ...form, usuarioNome: erpUser?.nome });
    } else {
      createMut.mutate(form);
    }
  };

  const handleDelete = (e: React.MouseEvent, c: any) => {
    e.stopPropagation();
    setDeleteConfirm({ id: c.id, nome: c.nome });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Clientes</h1>
        <Button className="h-10 sm:h-9 text-sm px-4" onClick={() => { setEditId(null); setForm({ nome: "", telefone: "", whatsapp: "", email: "", endereco: "" }); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Novo Cliente</span><span className="sm:hidden">Novo</span>
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 sm:h-9 text-sm" />
        </div>
        {search && <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-9 sm:w-9" onClick={() => setSearch("")}><X className="h-4 w-4" /></Button>}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Endereço</TableHead>
                {isAdmin && <TableHead className="w-16 text-center">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              ) : clientes?.length === 0 ? (
                <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
              ) : clientes?.map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onDoubleClick={() => openEdit(c)}>
                  <TableCell className="font-mono text-xs">{c.id}</TableCell>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.telefone || "-"}</TableCell>
                  <TableCell>{c.email || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{c.endereco || "-"}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => handleDelete(e, c)}>
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
            <DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Nome *</label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Telefone</label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
            <div><label className="text-sm font-medium">WhatsApp</label><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="Ex: 5511999999999" /></div>
            <div><label className="text-sm font-medium">Email</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Endereço</label><Input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} /></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="flex-1">
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editId ? "Salvar Alterações" : "Cadastrar"}
              </Button>
              {editId && isAdmin && (
                <Button variant="destructive" onClick={() => { closeForm(); setDeleteConfirm({ id: editId, nome: form.nome }); }}>
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
              O cliente <strong>"{deleteConfirm?.nome}"</strong> será movido para a lixeira. Você poderá restaurá-lo depois em Configurações &gt; Lixeira.
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
