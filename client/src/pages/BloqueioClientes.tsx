import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X, Loader2, Edit2, Lock, Unlock, Trash2, Phone } from "lucide-react";
import { toast } from "sonner";

export default function BloqueioClientes() {
  const { erpUser } = useErpAuth();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [motivoBloqueio, setMotivoBloqueio] = useState("");
  const [clienteSearch, setClienteSearch] = useState("");
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [telefones, setTelefones] = useState<string[]>([]);
  const [novoTelefone, setNovoTelefone] = useState("");

  const utils = trpc.useUtils();
  
  // Buscar clientes bloqueados
  const { data: bloqueados, isLoading } = trpc.clientes.listBloqueados.useQuery({ search: search || undefined });
  
  // Buscar todos os clientes para o dropdown
  const { data: todosClientes } = trpc.clientes.list.useQuery({ search: clienteSearch || undefined });
  
  // Buscar telefones do cliente
  const { data: telefonesCliente } = trpc.clientes.listTelefones.useQuery(
    { clienteId: selectedClienteId! },
    { enabled: !!selectedClienteId }
  );
  
  // Mutations
  const bloquearMut = trpc.clientes.bloquear.useMutation({
    onSuccess: () => {
      utils.clientes.listBloqueados.invalidate();
      toast.success("Cliente bloqueado com sucesso!");
      closeModal();
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const desbloquearMut = trpc.clientes.desbloquear.useMutation({
    onSuccess: () => {
      utils.clientes.listBloqueados.invalidate();
      toast.success("Cliente desbloqueado com sucesso!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const addTelefoneMut = trpc.clientes.addTelefone.useMutation({
    onSuccess: () => {
      utils.clientes.listTelefones.invalidate();
      setNovoTelefone("");
      toast.success("Telefone adicionado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const removeTelefoneMut = trpc.clientes.removeTelefone.useMutation({
    onSuccess: () => {
      utils.clientes.listTelefones.invalidate();
      toast.success("Telefone removido!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setSelectedClienteId(null);
    setMotivoBloqueio("");
    setClienteSearch("");
    setTelefones([]);
    setNovoTelefone("");
  };

  const openAddModal = () => {
    setEditingId(null);
    setSelectedClienteId(null);
    setMotivoBloqueio("");
    setClienteSearch("");
    setTelefones([]);
    setNovoTelefone("");
    setShowModal(true);
  };

  const openEditModal = (cliente: any) => {
    setEditingId(cliente.id);
    setSelectedClienteId(cliente.id);
    setMotivoBloqueio(cliente.motivoBloqueio || "");
    setClienteSearch(cliente.nome);
    setTelefones([]);
    setNovoTelefone("");
    setShowModal(true);
  };

  const handleAddTelefone = () => {
    if (!novoTelefone.trim()) {
      toast.error("Digite um telefone");
      return;
    }
    if (telefones.includes(novoTelefone)) {
      toast.error("Telefone já adicionado");
      return;
    }
    setTelefones([...telefones, novoTelefone]);
    setNovoTelefone("");
  };

  const handleRemoveTelefone = (index: number) => {
    setTelefones(telefones.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedClienteId) {
      toast.error("Selecione um cliente");
      return;
    }
    if (!motivoBloqueio.trim()) {
      toast.error("Informe o motivo do bloqueio");
      return;
    }

    bloquearMut.mutate({
      clienteId: selectedClienteId,
      motivo: motivoBloqueio,
      usuarioNome: erpUser?.nome || "Sistema",
    });

    // Adicionar telefones após bloquear
    if (telefones.length > 0) {
      telefones.forEach((tel) => {
        addTelefoneMut.mutate({
          clienteId: selectedClienteId,
          telefone: tel,
        });
      });
    }
  };

  const handleDesbloquear = (clienteId: number) => {
    desbloquearMut.mutate({ clienteId });
  };

  const clientesDisponiveis = todosClientes?.filter(
    (c: any) => !bloqueados?.some((b: any) => b.id === c.id)
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Lock className="h-5 w-5 text-red-600" />
          Bloqueio de Clientes
        </h1>
        <Button className="h-10 sm:h-9 text-sm px-4" onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Adicionar Bloqueio</span>
          <span className="sm:hidden">Adicionar</span>
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 sm:h-9 text-sm"
          />
        </div>
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 sm:h-9 sm:w-9"
            onClick={() => setSearch("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {bloqueados && bloqueados.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum cliente bloqueado
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Bloqueado em</TableHead>
                  <TableHead>Por</TableHead>
                  <TableHead className="w-24 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : (
                  bloqueados?.map((cliente: any) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-mono text-xs">{cliente.id}</TableCell>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.telefone || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {cliente.motivoBloqueio || "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {cliente.bloqueadoEm
                          ? new Date(cliente.bloqueadoEm).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs">{cliente.bloqueadoPor || "-"}</TableCell>
                      <TableCell className="text-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => openEditModal(cliente)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleDesbloquear(cliente.id)}
                          disabled={desbloquearMut.isPending}
                        >
                          <Unlock className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de Adicionar/Editar Bloqueio */}
      <Dialog open={showModal} onOpenChange={(v) => { if (!v) closeModal(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Bloqueio" : "Adicionar Cliente Bloqueado"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize o motivo do bloqueio e telefones"
                : "Selecione um cliente, informe o motivo do bloqueio e adicione telefones"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Seleção de Cliente */}
            <div>
              <label className="text-sm font-medium">Cliente *</label>
              <div className="relative mt-1">
                <Input
                  placeholder="Buscar cliente..."
                  value={clienteSearch}
                  onChange={(e) => {
                    setClienteSearch(e.target.value);
                    setShowClienteDropdown(true);
                  }}
                  onFocus={() => setShowClienteDropdown(true)}
                  disabled={!!editingId}
                  className="pr-8"
                />
                {showClienteDropdown && clienteSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {clientesDisponiveis.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nenhum cliente disponível
                      </div>
                    ) : (
                      clientesDisponiveis.map((c: any) => (
                        <button
                          key={c.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                          onClick={() => {
                            setSelectedClienteId(c.id);
                            setClienteSearch(c.nome);
                            setShowClienteDropdown(false);
                          }}
                        >
                          <div className="font-medium">{c.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.telefone || "-"}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedClienteId && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  Cliente ID: {selectedClienteId}
                </div>
              )}
            </div>

            {/* Motivo do Bloqueio */}
            <div>
              <label className="text-sm font-medium">Motivo do Bloqueio *</label>
              <textarea
                placeholder="Ex: Inadimplência, débito em aberto, etc."
                value={motivoBloqueio}
                onChange={(e) => setMotivoBloqueio(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none h-20"
              />
            </div>

            {/* Telefones */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefones para Bloqueio
              </label>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite um telefone (ex: 11999999999)"
                    value={novoTelefone}
                    onChange={(e) => setNovoTelefone(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddTelefone();
                      }
                    }}
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTelefone}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Lista de Telefones */}
                {(telefones.length > 0 || telefonesCliente?.length) && (
                  <div className="border rounded-md p-2 space-y-1 bg-muted/50">
                    {telefones.map((tel, idx) => (
                      <div
                        key={`new-${idx}`}
                        className="flex items-center justify-between p-2 bg-white rounded border border-green-200"
                      >
                        <span className="text-sm font-medium text-green-700">
                          {tel} <Badge className="ml-2">Novo</Badge>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => handleRemoveTelefone(idx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {telefonesCliente?.map((tel: any) => (
                      <div
                        key={`existing-${tel.id}`}
                        className="flex items-center justify-between p-2 bg-white rounded border"
                      >
                        <span className="text-sm">{tel.telefone}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => removeTelefoneMut.mutate({ id: tel.id })}
                          disabled={removeTelefoneMut.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={bloquearMut.isPending || !selectedClienteId || !motivoBloqueio.trim()}
                className="flex-1"
              >
                {bloquearMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingId ? "Atualizar Bloqueio" : "Bloquear Cliente"}
              </Button>
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
