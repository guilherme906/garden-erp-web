import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { storagePut } from "@/lib/storage";

interface ModalAdicionarProdutoCustomizadoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ModalAdicionarProdutoCustomizado({
  isOpen,
  onClose,
  onSuccess,
}: ModalAdicionarProdutoCustomizadoProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [estoque, setEstoque] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const criarMutation = trpc.produtosCustomizados.criar.useMutation();
  const utils = trpc.useUtils();

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let fotoUrl = "";

      // Upload de foto se fornecida
      if (fotoFile) {
        const buffer = await fotoFile.arrayBuffer();
        const { url } = await storagePut(
          `produtos-customizados/${Date.now()}-${fotoFile.name}`,
          new Uint8Array(buffer),
          fotoFile.type
        );
        fotoUrl = url;
      }

      // Criar produto
      await criarMutation.mutateAsync({
        nome,
        descricao: descricao || undefined,
        precoUnitario: parseFloat(precoUnitario),
        estoque: parseInt(estoque),
        estoqueMinimo: estoqueMinimo ? parseInt(estoqueMinimo) : undefined,
        fotoUrl: fotoUrl || undefined,
      });

      // Invalidar cache e fechar modal
      await utils.produtosCustomizados.listar.invalidate();
      
      // Resetar form
      setNome("");
      setDescricao("");
      setPrecoUnitario("");
      setEstoque("");
      setEstoqueMinimo("");
      setFotoFile(null);
      setFotoPreview("");

      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      alert("Erro ao criar produto. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Produto Customizado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Rosa Vermelha Premium"
              required
              disabled={isLoading}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do produto (opcional)"
              disabled={isLoading}
              className="resize-none h-20"
            />
          </div>

          {/* Preço Unitário */}
          <div className="space-y-2">
            <Label htmlFor="preco">Preço Unitário (R$) *</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              min="0"
              value={precoUnitario}
              onChange={(e) => setPrecoUnitario(e.target.value)}
              placeholder="0.00"
              required
              disabled={isLoading}
            />
          </div>

          {/* Estoque */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estoque">Estoque *</Label>
              <Input
                id="estoque"
                type="number"
                min="0"
                value={estoque}
                onChange={(e) => setEstoque(e.target.value)}
                placeholder="0"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estoqueMinimo">Estoque Mínimo</Label>
              <Input
                id="estoqueMinimo"
                type="number"
                min="0"
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value)}
                placeholder="0"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Upload de Foto */}
          <div className="space-y-2">
            <Label htmlFor="foto">Foto do Produto</Label>
            <div className="flex gap-2">
              <Input
                id="foto"
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                disabled={isLoading}
                className="flex-1"
              />
              {fotoFile && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  ✓ {fotoFile.name.slice(0, 15)}...
                </span>
              )}
            </div>

            {/* Preview da Foto */}
            {fotoPreview && (
              <div className="mt-2 relative">
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded border"
                />
              </div>
            )}
          </div>

          {/* Botões */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Criar Produto
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
