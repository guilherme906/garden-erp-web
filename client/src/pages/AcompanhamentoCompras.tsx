import React, { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, Plus, Trash2, Edit2 } from 'lucide-react';

type AcompanhamentoItem = {
  id: number;
  compraItemId: number;
  compraId: number;
  produtoId: number | null;
  produtoNome: string;
  quantidadePedida: string;
  quantidadeComprada: string;
  quantidadeRestante: string;
  quantidadeExcedente: string;
  status: 'PENDENTE' | 'PARCIAL' | 'COMPLETO' | 'EXCEDENTE';
  observacoes: string | null;
};

export default function AcompanhamentoCompras() {
  const [selectedCompra, setSelectedCompra] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    quantidadeComprada: '',
    observacoes: '',
  });

  // Queries
  const comprasQuery = trpc.acompanhamentoCompras.listarTodas.useQuery();
  const acompanhamentosQuery = trpc.acompanhamentoCompras.listarPorCompra.useQuery(
    { compraId: selectedCompra! },
    { enabled: !!selectedCompra }
  );
  const resumoQuery = trpc.acompanhamentoCompras.obterResumo.useQuery(
    { compraId: selectedCompra! },
    { enabled: !!selectedCompra }
  );

  // Mutations
  const atualizarMutation = trpc.acompanhamentoCompras.atualizar.useMutation({
    onSuccess: () => {
      acompanhamentosQuery.refetch();
      resumoQuery.refetch();
      setShowModal(false);
      setFormData({ quantidadeComprada: '', observacoes: '' });
      setEditingId(null);
    },
  });

  const deletarMutation = trpc.acompanhamentoCompras.deletar.useMutation({
    onSuccess: () => {
      acompanhamentosQuery.refetch();
      resumoQuery.refetch();
    },
  });

  const handleEdit = (item: AcompanhamentoItem) => {
    setEditingId(item.id);
    setFormData({
      quantidadeComprada: item.quantidadeComprada,
      observacoes: item.observacoes || '',
    });
    setShowModal(true);
  };

  const handleSave = async (item: AcompanhamentoItem) => {
    if (!formData.quantidadeComprada) {
      alert('Informe a quantidade comprada');
      return;
    }

    await atualizarMutation.mutateAsync({
      compraItemId: item.compraItemId,
      compraId: item.compraId,
      produtoId: item.produtoId,
      produtoNome: item.produtoNome,
      quantidadePedida: parseFloat(item.quantidadePedida),
      quantidadeComprada: parseFloat(formData.quantidadeComprada),
      observacoes: formData.observacoes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETO':
        return <Badge className="bg-green-500">Completo</Badge>;
      case 'PARCIAL':
        return <Badge className="bg-yellow-500">Parcial</Badge>;
      case 'EXCEDENTE':
        return <Badge className="bg-blue-500">Excedente</Badge>;
      case 'PENDENTE':
        return <Badge className="bg-gray-500">Pendente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETO':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'EXCEDENTE':
        return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      case 'PENDENTE':
        return <Clock className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (!selectedCompra) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Acompanhamento de Compras</h1>
          <p className="text-gray-600 mt-2">
            Rastreie o progresso das compras e veja quanto já foi adquirido
          </p>
        </div>

        {comprasQuery.isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="grid gap-4">
            {comprasQuery.data?.map((compra: any) => (
              <Card
                key={compra.compraId}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedCompra(compra.compraId)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{compra.fornecedor || 'Fornecedor desconhecido'}</CardTitle>
                      <CardDescription>
                        Data: {new Date(compra.data).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {compra.produtosCompletos || 0}/{compra.totalProdutos}
                      </div>
                      <p className="text-sm text-gray-600">Produtos completos</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Pendentes</p>
                      <p className="font-semibold">{compra.produtosPendentes || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Parciais</p>
                      <p className="font-semibold">{compra.totalProdutos - (compra.produtosCompletos || 0) - (compra.produtosExcedentes || 0) - (compra.produtosPendentes || 0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Excedentes</p>
                      <p className="font-semibold text-blue-600">{compra.produtosExcedentes || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total</p>
                      <p className="font-semibold">R$ {parseFloat(compra.total).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={() => setSelectedCompra(null)}>
            ← Voltar
          </Button>
          <h1 className="text-3xl font-bold mt-4">Acompanhamento de Compra #{selectedCompra}</h1>
        </div>
      </div>

      {/* Resumo */}
      {resumoQuery.data && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Pedido</p>
                <p className="text-2xl font-bold">{resumoQuery.data.quantidadeTotalPedida.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Comprado</p>
                <p className="text-2xl font-bold text-green-600">{resumoQuery.data.quantidadeTotalComprada.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Restante</p>
                <p className="text-2xl font-bold text-orange-600">{resumoQuery.data.quantidadeTotalRestante.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Excedente</p>
                <p className="text-2xl font-bold text-blue-600">{resumoQuery.data.quantidadeTotalExcedente.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Produtos */}
      <div className="space-y-2">
        {acompanhamentosQuery.isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          acompanhamentosQuery.data?.map((item: AcompanhamentoItem) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(item.status)}
                      <h3 className="font-semibold text-lg">{item.produtoNome}</h3>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                      <div>
                        <p className="text-gray-600">Pedido</p>
                        <p className="font-semibold">{parseFloat(item.quantidadePedida).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Comprado</p>
                        <p className="font-semibold text-green-600">{parseFloat(item.quantidadeComprada).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Restante</p>
                        <p className="font-semibold text-orange-600">{parseFloat(item.quantidadeRestante).toFixed(2)}</p>
                      </div>
                      {parseFloat(item.quantidadeExcedente) > 0 && (
                        <div>
                          <p className="text-gray-600">Excedente</p>
                          <p className="font-semibold text-blue-600">{parseFloat(item.quantidadeExcedente).toFixed(2)}</p>
                        </div>
                      )}
                    </div>

                    {item.observacoes && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Obs:</strong> {item.observacoes}
                      </p>
                    )}

                    {item.status === 'COMPLETO' && (
                      <Alert className="mt-3 bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          ✓ Compra completa!
                        </AlertDescription>
                      </Alert>
                    )}

                    {item.status === 'EXCEDENTE' && (
                      <Alert className="mt-3 bg-blue-50 border-blue-200">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          ⚠ Quantidade excedente: {parseFloat(item.quantidadeExcedente).toFixed(2)} unidades
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletarMutation.mutate({ id: item.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de edição */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Acompanhamento</DialogTitle>
            <DialogDescription>
              Informe a quantidade que foi comprada
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Quantidade Comprada
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.quantidadeComprada}
                onChange={(e) =>
                  setFormData({ ...formData, quantidadeComprada: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Observações (opcional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                placeholder="Ex: Faltam 2 unidades, chegam na próxima semana..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const item = acompanhamentosQuery.data?.find(
                    (i: AcompanhamentoItem) => i.id === editingId
                  );
                  if (item) handleSave(item);
                }}
                disabled={atualizarMutation.isPending}
              >
                {atualizarMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
