import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, Search, X, Edit2, Trash2, Package, DollarSign, Box, AlertCircle, Check, Camera, Tag, Upload, Loader2
} from "lucide-react";

interface FormData {
  nome: string;
  descricao: string;
  precoUnitario: string;
  estoque: string;
  estoqueMinimo: string;
  fotoUrl: string;
  categoriaId: number | null;
}

function emptyForm(): FormData {
  return {
    nome: "",
    descricao: "",
    precoUnitario: "",
    estoque: "0",
    estoqueMinimo: "0",
    fotoUrl: "",
    categoriaId: null,
  };
}

export default function GerenciadorProdutosCustomizados() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm());
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefEdit = useRef<HTMLInputElement>(null);

  // Queries e Mutations
  const { data: produtos, isLoading, refetch } = trpc.produtosCustomizados.listar.useQuery();
  const { data: categorias } = trpc.categoriasCustomizadas.listar.useQuery();
  const criarMut = trpc.produtosCustomizados.criar.useMutation();
  const atualizarMut = trpc.produtosCustomizados.atualizar.useMutation();
  const deletarMut = trpc.produtosCustomizados.deletar.useMutation();

  const filteredProdutos = produtos?.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleOpenModal = (produto?: any) => {
    if (produto) {
      setEditingId(produto.id);
      setFormData({
        nome: produto.nome,
        descricao: produto.descricao || "",
        precoUnitario: produto.precoUnitario,
        estoque: produto.estoque.toString(),
        estoqueMinimo: produto.estoqueMinimo?.toString() || "0",
        fotoUrl: produto.fotoUrl || "",
        categoriaId: produto.categoriaId || null,
      });
    } else {
      setEditingId(null);
      setFormData(emptyForm());
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm());
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }

    if (!formData.precoUnitario || parseFloat(formData.precoUnitario) <= 0) {
      toast.error("Preço deve ser maior que zero");
      return;
    }

    try {
      if (editingId) {
        await atualizarMut.mutateAsync({
          id: editingId,
          nome: formData.nome,
          descricao: formData.descricao || undefined,
          precoUnitario: parseFloat(formData.precoUnitario),
          estoque: parseInt(formData.estoque) || 0,
          estoqueMinimo: parseInt(formData.estoqueMinimo) || 0,
          fotoUrl: formData.fotoUrl || undefined,
          categoriaId: formData.categoriaId || null,
        });
        toast.success("Produto atualizado com sucesso!");
      } else {
        await criarMut.mutateAsync({
          nome: formData.nome,
          descricao: formData.descricao || undefined,
          precoUnitario: parseFloat(formData.precoUnitario),
          estoque: parseInt(formData.estoque) || 0,
          estoqueMinimo: parseInt(formData.estoqueMinimo) || 0,
          fotoUrl: formData.fotoUrl || undefined,
          categoriaId: formData.categoriaId || undefined,
        });
        toast.success("Produto criado com sucesso!");
      }
      refetch();
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar produto");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return;

    try {
      await deletarMut.mutateAsync({ id });
      toast.success("Produto deletado com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar produto");
    }
  };

  const handleToggleAtivo = async (id: number, ativoAtual: boolean) => {
    try {
      await atualizarMut.mutateAsync({
        id,
        ativo: ativoAtual ? 0 : 1,
      });
      toast.success(ativoAtual ? "Produto desativado!" : "Produto ativado!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar produto");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Carregando produtos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Produtos Customizados</h1>
        <Button onClick={() => handleOpenModal()} className="bg-green-700 hover:bg-green-800 gap-2">
          <Plus size={18} />
          Novo Produto
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de Produtos */}
      <div className="space-y-2">
        {filteredProdutos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Package className="mx-auto mb-3 text-gray-400" size={32} />
            <p className="text-gray-600">Nenhum produto customizado encontrado</p>
          </div>
        ) : (
          filteredProdutos.map((produto: any) => (
            <div
              key={produto.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Foto */}
                {produto.fotoUrl && (
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    <img
                      src={produto.fotoUrl}
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Informações */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{produto.nome}</h3>
                    <Badge variant={produto.ativo ? "default" : "secondary"}>
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  {produto.descricao && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{produto.descricao}</p>
                  )}

                  {produto.categoriaId && categorias && (
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs gap-1">
                        <Tag size={12} />
                        {categorias.find((c: any) => c.id === produto.categoriaId)?.nome || "Categoria"}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-green-700 font-bold">
                      <DollarSign size={14} />
                      R$ {parseFloat(produto.precoUnitario).toFixed(2)}
                    </div>
                    <div className={`flex items-center gap-1 font-bold ${
                      produto.estoque > 0 ? "text-blue-700" : "text-red-700"
                    }`}>
                      <Box size={14} />
                      {produto.estoque} un
                    </div>
                    {produto.estoque === 0 && (
                      <div className="flex items-center gap-1 text-red-700 font-bold">
                        <AlertCircle size={14} />
                        Sem estoque
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant={produto.ativo ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => handleToggleAtivo(produto.id, produto.ativo)}
                    className="gap-1"
                  >
                    {produto.ativo ? "Desativar" : "Ativar"}
                  </Button>
                  <input
                    ref={fileInputRefEdit}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setUploadingFoto(true);
                      try {
                        const formDataUpload = new FormData();
                        formDataUpload.append('file', file);
                        
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formDataUpload,
                        });
                        
                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}));
                          throw new Error(errorData.error || `Erro ao fazer upload: ${response.status}`);
                        }
                        
                        const data = await response.json();
                        if (!data.url) throw new Error('URL não retornada pelo servidor');
                        
                        await atualizarMut.mutateAsync({
                          id: produto.id,
                          fotoUrl: data.url,
                        });
                        toast.success('Foto atualizada com sucesso!');
                        refetch();
                      } catch (error: any) {
                        console.error('Erro no upload:', error);
                        toast.error(error.message || 'Erro ao fazer upload da foto');
                      } finally {
                        setUploadingFoto(false);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingFoto}
                    className="gap-1"
                    onClick={() => fileInputRefEdit.current?.click()}
                  >
                    {uploadingFoto ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Camera size={14} />
                        Foto
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(produto)}
                    className="gap-1"
                  >
                    <Edit2 size={14} />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(produto.id)}
                    className="gap-1"
                  >
                    <Trash2 size={14} />
                    Deletar
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Produto" : "Novo Produto Customizado"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto *
              </label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Buquê de Rosas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição do produto..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço (R$) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precoUnitario}
                  onChange={(e) => setFormData({ ...formData, precoUnitario: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.estoque}
                  onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estoque Mínimo
              </label>
              <Input
                type="number"
                min="0"
                value={formData.estoqueMinimo}
                onChange={(e) => setFormData({ ...formData, estoqueMinimo: e.target.value })}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <Select
                value={formData.categoriaId ? formData.categoriaId.toString() : "null"}
                onValueChange={(value) => setFormData({ ...formData, categoriaId: value === "null" ? null : (value ? parseInt(value) : null) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Sem categoria</SelectItem>
                  {categorias?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foto do Produto
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={formData.fotoUrl}
                    onChange={(e) => setFormData({ ...formData, fotoUrl: e.target.value })}
                    placeholder="https://... ou fazer upload"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setUploadingFoto(true);
                      try {
                        const formDataUpload = new FormData();
                        formDataUpload.append('file', file);
                        
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formDataUpload,
                        });
                        
                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}));
                          throw new Error(errorData.error || `Erro ao fazer upload: ${response.status}`);
                        }
                        
                        const data = await response.json();
                        if (!data.url) throw new Error('URL não retornada pelo servidor');
                        
                        setFormData({ ...formData, fotoUrl: data.url });
                        toast.success('Foto enviada com sucesso!');
                      } catch (error: any) {
                        console.error('Erro no upload:', error);
                        toast.error(error.message || 'Erro ao fazer upload da foto');
                      } finally {
                        setUploadingFoto(false);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingFoto}
                    className="gap-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingFoto ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                {formData.fotoUrl && (
                  <div className="mt-2 w-full h-32 bg-gray-100 rounded overflow-hidden">
                    <img
                      src={formData.fotoUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => toast.error("Erro ao carregar imagem")}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={criarMut.isPending || atualizarMut.isPending}
              className="bg-green-700 hover:bg-green-800"
            >
              {criarMut.isPending || atualizarMut.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
