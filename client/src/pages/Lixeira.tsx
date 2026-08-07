import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, RotateCcw, Trash2, Users, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

type Tab = "clientes" | "produtos" | "vendas";

export default function Lixeira() {
  const [activeTab, setActiveTab] = useState<Tab>("clientes");
  const [confirmAction, setConfirmAction] = useState<{ type: "restore" | "delete"; entity: Tab; id: number; nome: string } | null>(null);
  const utils = trpc.useUtils();

  // Queries
  const { data: clientesLixeira, isLoading: loadCli } = trpc.clientes.lixeira.useQuery();
  const { data: produtosLixeira, isLoading: loadProd } = trpc.produtos.lixeira.useQuery();
  const { data: vendasLixeira, isLoading: loadVen } = trpc.vendas.lixeira.useQuery();

  // Restore mutations
  const restoreCliente = trpc.clientes.restore.useMutation({
    onSuccess: () => { utils.clientes.lixeira.invalidate(); utils.clientes.list.invalidate(); toast.success("Cliente restaurado!"); setConfirmAction(null); },
    onError: (e) => toast.error(e.message),
  });
  const restoreProduto = trpc.produtos.restore.useMutation({
    onSuccess: () => { utils.produtos.lixeira.invalidate(); utils.produtos.list.invalidate(); toast.success("Produto restaurado!"); setConfirmAction(null); },
    onError: (e) => toast.error(e.message),
  });
  const restoreVenda = trpc.vendas.restore.useMutation({
    onSuccess: () => { utils.vendas.lixeira.invalidate(); utils.vendas.list.invalidate(); toast.success("Venda restaurada!"); setConfirmAction(null); },
    onError: (e) => toast.error(e.message),
  });

  // Delete permanent mutations
  const deleteCliPerm = trpc.clientes.deletePermanente.useMutation({
    onSuccess: () => { utils.clientes.lixeira.invalidate(); toast.success("Cliente excluído permanentemente!"); setConfirmAction(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteProdPerm = trpc.produtos.deletePermanente.useMutation({
    onSuccess: () => { utils.produtos.lixeira.invalidate(); toast.success("Produto excluído permanentemente!"); setConfirmAction(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteVenPerm = trpc.vendas.deletePermanente.useMutation({
    onSuccess: () => { utils.vendas.lixeira.invalidate(); toast.success("Venda excluída permanentemente!"); setConfirmAction(null); },
    onError: (e) => toast.error(e.message),
  });

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { type, entity, id } = confirmAction;
    if (type === "restore") {
      if (entity === "clientes") restoreCliente.mutate({ id });
      else if (entity === "produtos") restoreProduto.mutate({ id });
      else restoreVenda.mutate({ id });
    } else {
      if (entity === "clientes") deleteCliPerm.mutate({ id });
      else if (entity === "produtos") deleteProdPerm.mutate({ id });
      else deleteVenPerm.mutate({ id });
    }
  };

  const isPending = restoreCliente.isPending || restoreProduto.isPending || restoreVenda.isPending ||
    deleteCliPerm.isPending || deleteProdPerm.isPending || deleteVenPerm.isPending;

  const tabs: { id: Tab; label: string; icon: any; count: number }[] = [
    { id: "clientes", label: "Clientes", icon: Users, count: clientesLixeira?.length || 0 },
    { id: "produtos", label: "Produtos", icon: Package, count: produtosLixeira?.length || 0 },
    { id: "vendas", label: "Vendas", icon: ShoppingCart, count: vendasLixeira?.length || 0 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Trash2 className="h-5 sm:h-6 w-5 sm:w-6 text-muted-foreground" /> Lixeira
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Registros excluídos podem ser restaurados ou removidos permanentemente.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 border-b pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap active:bg-accent/80 ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
            {tab.count > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{tab.count}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Clientes */}
      {activeTab === "clientes" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Excluído em</TableHead>
                  <TableHead className="text-center w-40">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadCli ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : !clientesLixeira?.length ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum cliente na lixeira</TableCell></TableRow>
                ) : clientesLixeira.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.deletedAt ? new Date(c.deletedAt).toLocaleString("pt-BR") : "-"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="outline" className="h-8 sm:h-7 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => setConfirmAction({ type: "restore", entity: "clientes", id: c.id, nome: c.nome })}>
                          <RotateCcw className="h-3 w-3" /> Restaurar
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 sm:h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setConfirmAction({ type: "delete", entity: "clientes", id: c.id, nome: c.nome })}>
                          <Trash2 className="h-3 w-3" /> Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Produtos */}
      {activeTab === "produtos" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[650px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Código Ext.</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead>Excluído em</TableHead>
                  <TableHead className="text-center w-40">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadProd ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : !produtosLixeira?.length ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum produto na lixeira</TableCell></TableRow>
                ) : produtosLixeira.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell className="font-medium">{p.descricao}</TableCell>
                    <TableCell className="text-muted-foreground">{p.codigoExterno || "-"}</TableCell>
                    <TableCell className="text-right font-mono">R$ {Number(p.preco).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.deletedAt ? new Date(p.deletedAt).toLocaleString("pt-BR") : "-"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="outline" className="h-8 sm:h-7 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => setConfirmAction({ type: "restore", entity: "produtos", id: p.id, nome: p.descricao })}>
                          <RotateCcw className="h-3 w-3" /> Restaurar
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 sm:h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setConfirmAction({ type: "delete", entity: "produtos", id: p.id, nome: p.descricao })}>
                          <Trash2 className="h-3 w-3" /> Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Vendas */}
      {activeTab === "vendas" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Excluído em</TableHead>
                  <TableHead className="text-center w-40">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadVen ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : !vendasLixeira?.length ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma venda na lixeira</TableCell></TableRow>
                ) : vendasLixeira.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.id}</TableCell>
                    <TableCell className="font-medium">{v.clienteNome || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{v.data}</TableCell>
                    <TableCell className="text-right font-mono">R$ {Number(v.total || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{v.deletedAt ? new Date(v.deletedAt).toLocaleString("pt-BR") : "-"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        <Button size="sm" variant="outline" className="h-8 sm:h-7 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => setConfirmAction({ type: "restore", entity: "vendas", id: v.id, nome: `Venda #${v.id}` })}>
                          <RotateCcw className="h-3 w-3" /> Restaurar
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 sm:h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setConfirmAction({ type: "delete", entity: "vendas", id: v.id, nome: `Venda #${v.id}` })}>
                          <Trash2 className="h-3 w-3" /> Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Confirmação */}
      <Dialog open={!!confirmAction} onOpenChange={v => { if (!v) setConfirmAction(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className={confirmAction?.type === "restore" ? "text-green-600" : "text-red-600"}>
              {confirmAction?.type === "restore" ? "Restaurar Registro" : "Excluir Permanentemente"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "restore"
                ? <>Deseja restaurar <strong>"{confirmAction?.nome}"</strong>? O registro voltará a aparecer normalmente no sistema.</>
                : <>Deseja excluir permanentemente <strong>"{confirmAction?.nome}"</strong>? Esta ação <strong>não pode ser desfeita</strong>.</>
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
            <Button
              variant={confirmAction?.type === "restore" ? "default" : "destructive"}
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {confirmAction?.type === "restore" ? "Restaurar" : "Excluir Permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
