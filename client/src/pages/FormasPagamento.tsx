import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2 } from "lucide-react";


export function FormasPagamento() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nome: "", descricao: "" });

  const { data: formas = [], refetch } = trpc.financeiro.formasPagamento.list.useQuery();
  const createMutation = trpc.financeiro.formasPagamento.create.useMutation();
  const updateMutation = trpc.financeiro.formasPagamento.update.useMutation();
  const deleteMutation = trpc.financeiro.formasPagamento.delete.useMutation();

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      alert("Nome é obrigatório");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...formData });
        alert("Forma de pagamento atualizada");
      } else {
        await createMutation.mutateAsync(formData);
        alert("Forma de pagamento criada");
      }
      setFormData({ nome: "", descricao: "" });
      setEditingId(null);
      setIsOpen(false);
      refetch();
    } catch (error) {
      alert("Falha ao salvar forma de pagamento");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja excluir esta forma de pagamento?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      alert("Forma de pagamento excluída");
      refetch();
    } catch (error) {
      alert("Falha ao excluir");
    }
  };

  const handleEdit = (forma: any) => {
    setEditingId(forma.id);
    setFormData({ nome: forma.nome, descricao: forma.descricao || "" });
    setIsOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Formas de Pagamento</h1>
        <Button onClick={() => { setEditingId(null); setFormData({ nome: "", descricao: "" }); setIsOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Nova
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm md:text-base">
          <thead>
            <tr className="bg-green-600 text-white">
              <th className="border p-2 text-left">Nome</th>
              <th className="border p-2 text-left">Descrição</th>
              <th className="border p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {formas.map((forma: any) => (
              <tr key={forma.id} className="hover:bg-gray-100">
                <td className="border p-2">{forma.nome}</td>
                <td className="border p-2">{forma.descricao}</td>
                <td className="border p-2 text-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(forma)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(forma.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar" : "Nova"} Forma de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Dinheiro, Cartão Crédito"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
