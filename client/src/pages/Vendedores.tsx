import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Vendedores() {
  const { erpUser } = useErpAuth();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", senha: "", perfil: "VENDEDOR" as "ADMIN" | "VENDEDOR" });
  const utils = trpc.useUtils();
  const { data: vendedores, isLoading } = trpc.vendedores.list.useQuery();
  const createMut = trpc.vendedores.create.useMutation({ onSuccess: () => { utils.vendedores.list.invalidate(); toast.success("Vendedor cadastrado!"); closeForm(); } });
  const updateMut = trpc.vendedores.update.useMutation({ onSuccess: () => { utils.vendedores.list.invalidate(); toast.success("Vendedor atualizado!"); closeForm(); } });

  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ nome: "", email: "", telefone: "", senha: "", perfil: "VENDEDOR" }); };

  const openEdit = (v: any) => {
    setForm({ nome: v.nome, email: v.email || "", telefone: v.telefone || "", senha: "", perfil: v.perfil || "VENDEDOR" });
    setEditId(v.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!editId && !form.senha.trim()) { toast.error("Senha é obrigatória"); return; }
    if (editId) {
      updateMut.mutate({ id: editId, ...form, senha: form.senha || undefined, usuarioNome: erpUser?.nome });
    } else {
      createMut.mutate(form);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Vendedores</h1>
        <Button className="h-10 sm:h-9 text-sm" onClick={() => { closeForm(); setShowForm(true); }}><Plus className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Novo Vendedor</span><span className="sm:hidden">Novo</span></Button>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[550px]">
            <TableHeader><TableRow><TableHead className="w-16">ID</TableHead><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Telefone</TableHead><TableHead>Perfil</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
              : vendedores?.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum vendedor cadastrado</TableCell></TableRow>
              : vendedores?.map((v: any) => (
                <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onDoubleClick={() => openEdit(v)}>
                  <TableCell className="font-mono text-xs">{v.id}</TableCell>
                  <TableCell className="font-medium">{v.nome}</TableCell>
                  <TableCell>{v.email || "-"}</TableCell>
                  <TableCell>{v.telefone || "-"}</TableCell>
                  <TableCell><Badge variant={v.perfil === "ADMIN" ? "default" : "secondary"}>{v.perfil}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={v => { if (!v) closeForm(); }}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-auto">
          <DialogHeader><DialogTitle>{editId ? "Editar Vendedor" : "Novo Vendedor"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Nome *</label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Email</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Telefone</label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
            <div><label className="text-sm font-medium">{editId ? "Nova Senha (deixe em branco para manter)" : "Senha *"}</label><Input type="password" value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} /></div>
            <div>
              <label className="text-sm font-medium">Perfil</label>
              <Select value={form.perfil} onValueChange={(v: "ADMIN" | "VENDEDOR") => setForm({ ...form, perfil: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="VENDEDOR">VENDEDOR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="flex-1">
                {(createMut.isPending || updateMut.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editId ? "Salvar Alterações" : "Cadastrar"}
              </Button>
              <Button variant="outline" onClick={closeForm}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
