import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, Edit2, Download, RefreshCw, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function HistoricoPDFs() {
  const [busca, setBusca] = useState("");
  const [selectedCatalogo, setSelectedCatalogo] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: catalogos, isLoading, refetch } = trpc.catalogoHistorico.listar.useQuery();
  const deletarMut = trpc.catalogoHistorico.deletar.useMutation({
    onSuccess: () => {
      toast.success("Catálogo deletado com sucesso!");
      refetch();
    },
    onError: (e) => toast.error("Erro ao deletar: " + e.message),
  });

  const catalogosFiltrados = useMemo(() => {
    if (!catalogos) return [];
    return catalogos.filter((c: any) =>
      c.nome.toLowerCase().includes(busca.toLowerCase())
    );
  }, [catalogos, busca]);

  const handleDeletar = (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este catálogo?")) return;
    deletarMut.mutate({ id });
  };

  const handleEditar = (catalogo: any) => {
    setSelectedCatalogo(catalogo);
    setShowEditModal(true);
  };

  const handleDownloadPDF = (pdfUrl: string) => {
    if (!pdfUrl) {
      toast.error("PDF não disponível para download");
      return;
    }
    window.open(pdfUrl, "_blank");
  };

  return (
    <div className="w-full h-full flex flex-col bg-background p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Histórico de Catálogos PDF</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {catalogosFiltrados.length} catálogo(s) encontrado(s)
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Busca */}
      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nome do catálogo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto border rounded-lg bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando catálogos...</p>
          </div>
        ) : catalogosFiltrados.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Nenhum catálogo encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalogosFiltrados.map((catalogo: any) => (
                <TableRow key={catalogo.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{catalogo.nome}</TableCell>
                  <TableCell className="text-right">{catalogo.produtosCount}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(new Date(catalogo.dataGeracao), "dd/MM/yyyy HH:mm")}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(catalogo.dataGeracao), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {catalogo.desconto > 0 ? (
                      <span className="text-sm font-medium text-green-600">
                        {catalogo.desconto.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {catalogo.pdfUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(catalogo.pdfUrl)}
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditar(catalogo)}
                        title="Editar catálogo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletar(catalogo.id)}
                        title="Deletar catálogo"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal de Edição */}
      {showEditModal && selectedCatalogo && (
        <ModalEdicaoCatalogo
          catalogo={selectedCatalogo}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCatalogo(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function ModalEdicaoCatalogo({ catalogo, onClose }: { catalogo: any; onClose: () => void }) {
  const [nome, setNome] = useState(catalogo.nome);
  const [desconto, setDesconto] = useState(catalogo.desconto || 0);
  const [produtos, setProdutos] = useState<any[]>(() => {
    try {
      return JSON.parse(catalogo.produtosJson || "[]");
    } catch {
      return [];
    }
  });
  const [novoProduto, setNovoProduto] = useState<any>(null);
  const [showAdicionarProduto, setShowAdicionarProduto] = useState(false);

  const atualizarMut = trpc.catalogoHistorico.atualizar.useMutation({
    onSuccess: () => {
      toast.success("Catálogo atualizado com sucesso!");
      onClose();
    },
    onError: (e) => toast.error("Erro ao atualizar: " + e.message),
  });

  const handleSalvar = () => {
    atualizarMut.mutate({
      id: catalogo.id,
      nome,
      desconto,
      produtosJson: JSON.stringify(produtos),
      produtosCount: produtos.length,
    });
  };

  const handleAdicionarProduto = () => {
    if (!novoProduto) return;
    setProdutos([...produtos, { ...novoProduto, id: Date.now() }]);
    setNovoProduto(null);
    setShowAdicionarProduto(false);
  };

  const handleRemoverProduto = (id: number) => {
    setProdutos(produtos.filter((p) => p.id !== id));
  };

  const handleEditarProduto = (id: number, campo: string, valor: any) => {
    setProdutos(
      produtos.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Editar Catálogo: {nome}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Informações Básicas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Catálogo</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do catálogo"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Desconto Padrão (%)</label>
            <Input
              type="number"
              value={desconto}
              onChange={(e) => setDesconto(Number(e.target.value))}
              placeholder="0"
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          {/* Produtos */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Produtos ({produtos.length})</label>
              <Button
                size="sm"
                onClick={() => setShowAdicionarProduto(!showAdicionarProduto)}
              >
                + Adicionar Produto
              </Button>
            </div>

            {showAdicionarProduto && (
              <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
                <Input
                  placeholder="Nome do produto"
                  value={novoProduto?.nome || ""}
                  onChange={(e) =>
                    setNovoProduto({ ...novoProduto, nome: e.target.value })
                  }
                />
                <Input
                  placeholder="Valor de venda"
                  type="number"
                  value={novoProduto?.valorVenda || ""}
                  onChange={(e) =>
                    setNovoProduto({
                      ...novoProduto,
                      valorVenda: Number(e.target.value),
                    })
                  }
                />
                <Input
                  placeholder="Estoque"
                  type="number"
                  value={novoProduto?.estoque || ""}
                  onChange={(e) =>
                    setNovoProduto({
                      ...novoProduto,
                      estoque: Number(e.target.value),
                    })
                  }
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAdicionarProduto}>
                    Adicionar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAdicionarProduto(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de Produtos */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {produtos.map((produto) => (
                <div
                  key={produto.id}
                  className="border rounded-lg p-3 bg-card space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={produto.nome || ""}
                        onChange={(e) =>
                          handleEditarProduto(produto.id, "nome", e.target.value)
                        }
                        placeholder="Nome do produto"
                        className="text-sm"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          value={produto.valorVenda || ""}
                          onChange={(e) =>
                            handleEditarProduto(
                              produto.id,
                              "valorVenda",
                              Number(e.target.value)
                            )
                          }
                          placeholder="Valor"
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          value={produto.estoque || ""}
                          onChange={(e) =>
                            handleEditarProduto(
                              produto.id,
                              "estoque",
                              Number(e.target.value)
                            )
                          }
                          placeholder="Estoque"
                          className="text-sm"
                        />
                        <Input
                          type="text"
                          value={produto.categoria || ""}
                          onChange={(e) =>
                            handleEditarProduto(
                              produto.id,
                              "categoria",
                              e.target.value
                            )
                          }
                          placeholder="Categoria"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoverProduto(produto.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={atualizarMut.isPending}>
            {atualizarMut.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
