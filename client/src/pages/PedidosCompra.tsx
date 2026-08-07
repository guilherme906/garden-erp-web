import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus, Trash2, FileText, Search, ArrowLeft, Save, ShoppingCart, PackagePlus, Printer, MoreVertical, Clock, ExternalLink,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ItemCompra = {
  produtoId?: number;
  produtoNome: string;
  quantidade: string;
  precoVenda: string;
  subtotalVenda: string;
  observacao?: string;
};

export default function PedidosCompra() {
  const { erpUser } = useErpAuth();
  const utils = trpc.useUtils();

  // Queries
  const { data: pedidos, isLoading } = trpc.pedidosCompra.list.useQuery();
  const { data: produtosData } = trpc.produtos.list.useQuery();
  const nextNumeroQuery = trpc.pedidosCompra.nextNumero.useQuery();

  // Mutations
  const createMut = trpc.pedidosCompra.create.useMutation({
    onSuccess: () => { utils.pedidosCompra.list.invalidate(); utils.pedidosCompra.nextNumero.invalidate(); toast.success("Pedido de compra criado!"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.pedidosCompra.update.useMutation({
    onSuccess: () => { utils.pedidosCompra.list.invalidate(); toast.success("Pedido atualizado!"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.pedidosCompra.delete.useMutation({
    onSuccess: () => { utils.pedidosCompra.list.invalidate(); toast.success("Pedido excluído!"); },
    onError: (e) => toast.error(e.message),
  });
  const statusMut = trpc.pedidosCompra.updateStatus.useMutation({
    onSuccess: () => { utils.pedidosCompra.list.invalidate(); toast.success("Status atualizado!"); },
    onError: (e) => toast.error(e.message),
  });
  const createProdutoMut = trpc.produtos.create.useMutation({
    onSuccess: () => { utils.produtos.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // State
  const [view, setView] = useState<"list" | "form">("list");
  const [editId, setEditId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({ data: "", solicitante: "", observacoes: "" });
  const [itens, setItens] = useState<ItemCompra[]>([]);

  // Produto search
  const [prodSearch, setProdSearch] = useState("");
  const [prodDropdownOpen, setProdDropdownOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Autocadastro modal
  const [autocadastroOpen, setAutocadastroOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoPreco, setNovoPreco] = useState("0.00");
  const [novaUnidade, setNovaUnidade] = useState("UN");
  const [salvandoProduto, setSalvandoProduto] = useState(false);

  const produtos = produtosData || [];

  const prodSugestoes = useMemo(() => {
    if (!prodSearch || prodSearch.length < 2) return [];
    const t = prodSearch.toLowerCase();
    return produtos.filter((p: any) => p.descricao.toLowerCase().includes(t)).slice(0, 8);
  }, [prodSearch, produtos]);

  // Filtered pedidos
  const filtered = useMemo(() => {
    if (!pedidos) return [];
    if (!searchTerm) return pedidos;
    const t = searchTerm.toLowerCase();
    return pedidos.filter((p: any) =>
      String(p.numero).includes(t) ||
      p.solicitante.toLowerCase().includes(t) ||
      p.status.toLowerCase().includes(t)
    );
  }, [pedidos, searchTerm]);

  const openNew = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData({ data: today, solicitante: erpUser?.nome || "", observacoes: "" });
    setItens([]);
    setEditId(null);
    setView("form");
  };

  const openEdit = async (pedido: any) => {
    const detail = await utils.pedidosCompra.getById.fetch({ id: pedido.id });
    if (!detail) { toast.error("Pedido não encontrado"); return; }
    setFormData({
      data: detail.data,
      solicitante: detail.solicitante,
      observacoes: detail.observacoes || "",
    });
    setItens(detail.itens.map((i: any) => ({
      produtoId: i.produtoId || undefined,
      produtoNome: i.produtoNome,
      quantidade: String(i.quantidade),
      precoVenda: String(i.precoVenda),
      subtotalVenda: String(i.subtotalVenda),
    })));
    setEditId(pedido.id);
    setView("form");
  };

  const addItem = (prod: any) => {
    const preco = String(prod.preco || "0.00");
    setItens(prev => [...prev, {
      produtoId: prod.id,
      produtoNome: prod.descricao,
      quantidade: "1",
      precoVenda: preco,
      subtotalVenda: preco,
    }]);
    setProdSearch("");
    setProdDropdownOpen(false);
    setHighlightIdx(-1);
  };

  const removeItem = (idx: number) => {
    setItens(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: string) => {
    setItens(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === "quantidade" || field === "precoVenda") {
        const qty = parseFloat(updated.quantidade) || 0;
        const price = parseFloat(updated.precoVenda) || 0;
        updated.subtotalVenda = (qty * price).toFixed(2);
      }
      return updated;
    }));
  };

  const totalGeral = useMemo(() => {
    return itens.reduce((sum, item) => sum + (parseFloat(item.subtotalVenda) || 0), 0);
  }, [itens]);

  const handleSave = async () => {
    if (!formData.data) { toast.error("Data é obrigatória"); return; }
    if (!formData.solicitante.trim()) { toast.error("Solicitante é obrigatório"); return; }
    if (itens.length === 0) { toast.error("Adicione pelo menos um produto"); return; }

    const payload = {
      data: formData.data,
      solicitante: formData.solicitante,
      observacoes: formData.observacoes || undefined,
      total: totalGeral.toFixed(2),
      itens: itens.map(i => ({
        produtoId: i.produtoId,
        produtoNome: i.produtoNome,
        quantidade: i.quantidade,
        precoVenda: i.precoVenda,
        subtotalVenda: i.subtotalVenda,
      })),
    };

    if (editId) {
      await updateMut.mutateAsync({ id: editId, ...payload });
    } else {
      const numero = nextNumeroQuery.data || 1;
      await createMut.mutateAsync({ numero, ...payload });
    }
    setView("list");
  };

  const handleDelete = async (id: number) => {
    await deleteMut.mutateAsync({ id });
    setDeleteConfirm(null);
  };

  // Abrir modal de autocadastro com o nome já preenchido
  const abrirAutocadastro = () => {
    setNovoNome(prodSearch.toUpperCase());
    setNovoPreco("0.00");
    setNovaUnidade("UN");
    setAutocadastroOpen(true);
    setProdDropdownOpen(false);
  };

  // Salvar novo produto e adicionar ao pedido
  const salvarNovoProduto = async () => {
    if (!novoNome.trim()) { toast.error("Nome do produto é obrigatório"); return; }
    setSalvandoProduto(true);
    try {
      const result = await createProdutoMut.mutateAsync({
        descricao: novoNome.trim().toUpperCase(),
        preco: novoPreco || "0.00",
      });
      // Adicionar diretamente ao pedido
      const preco = novoPreco || "0.00";
      setItens(prev => [...prev, {
        produtoId: (result as any)?.id,
        produtoNome: novoNome.trim().toUpperCase(),
        quantidade: "1",
        precoVenda: preco,
        subtotalVenda: preco,
      }]);
      setProdSearch("");
      setAutocadastroOpen(false);
      toast.success(`Produto "${novoNome.trim().toUpperCase()}" cadastrado e adicionado ao pedido!`);
    } catch {
      // erro já tratado pelo onError
    } finally {
      setSalvandoProduto(false);
    }
  };

  // Gerar PDF do pedido atual (formulário)
  const gerarPDFForm = async () => {
    if (itens.length === 0) { toast.error("Adicione produtos antes de gerar o PDF"); return; }
    const numero = editId || nextNumeroQuery.data || "RASCUNHO";
    await gerarPDFData({
      numero,
      data: formData.data,
      solicitante: formData.solicitante,
      status: editId ? "EDITANDO" : "RASCUNHO",
      observacoes: formData.observacoes,
      total: totalGeral.toFixed(2),
      itens: itens.map(i => ({
        produtoNome: i.produtoNome,
        quantidade: i.quantidade,
        precoVenda: i.precoVenda,
        subtotalVenda: i.subtotalVenda,
      })),
    });
  };

  // Gerar PDF a partir de dados de um pedido salvo
  const gerarPDF = async (pedido: any) => {
    const detail = await utils.pedidosCompra.getById.fetch({ id: pedido.id });
    if (!detail) { toast.error("Pedido não encontrado"); return; }
    await gerarPDFData(detail);
  };

  // Função central de geração de PDF
  const gerarPDFData = async (detail: any) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();

    // Header com logo
    const logoUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663539257200/nE9aRDyk9G49cwSdfYmqny/logo-garden_de682faf.png";
    try {
      const logoImg = new window.Image();
      logoImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject(new Error("Logo não carregou"));
        logoImg.src = logoUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = logoImg.naturalWidth;
      canvas.height = logoImg.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(logoImg, 0, 0);
      const logoDataUrl = canvas.toDataURL("image/png");
      const logoW = 50;
      const logoH = logoW * (1065 / 2048);
      doc.addImage(logoDataUrl, "PNG", 14, 4, logoW, logoH);
    } catch {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("GARDEN CENTER PRIMAVERA", 14, 12);
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(now.toLocaleDateString("pt-BR") + ", " + now.toLocaleTimeString("pt-BR"), pageW - 14, 10, { align: "right" });
    doc.text("Avenida João Naves de Ávila, Nº 5420", pageW - 14, 15, { align: "right" });
    doc.text("38408680 - Uberlândia, MG", pageW - 14, 19, { align: "right" });

    // Número do pedido
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Pedido Compra ${detail.numero}`, pageW / 2, 32, { align: "center" });

    // Dados do pedido
    let y = 42;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Solicitante:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(detail.solicitante, 50, y);

    doc.setFont("helvetica", "bold");
    doc.text("Data:", 120, y);
    doc.setFont("helvetica", "normal");
    doc.text(detail.data, 140, y);

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Status:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(detail.status || "—", 50, y);

    // Tabela de itens
    y += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Itens do Pedido de Compra", 14, y);
    y += 4;

    const tableData = detail.itens.map((item: any, idx: number) => [
      idx + 1,
      item.produtoNome,
      parseFloat(item.quantidade).toFixed(2),
      `R$ ${parseFloat(item.precoVenda).toFixed(2)}`,
      `R$ ${parseFloat(item.subtotalVenda).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [["#", "Produto", "Qtd", "Preço Venda", "Subtotal Venda"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [34, 139, 34], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 80 },
        2: { cellWidth: 20, halign: "right" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 35, halign: "right" },
      },
      margin: { left: 14, right: 14 },
    });

    // Totais
    const finalY = (doc as any).lastAutoTable?.finalY || y + 20;
    let ty = finalY + 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Nº de itens: ${detail.itens.length}`, pageW - 14, ty, { align: "right" });
    ty += 5;
    doc.text(`Soma das Qtdes: ${detail.itens.reduce((s: number, i: any) => s + parseFloat(i.quantidade), 0).toFixed(2)}`, pageW - 14, ty, { align: "right" });
    ty += 5;
    doc.setFont("helvetica", "bold");
    doc.text(`Total de produtos (Venda): R$ ${parseFloat(detail.total).toFixed(2)}`, pageW - 14, ty, { align: "right" });

    // Observações
    if (detail.observacoes) {
      ty += 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Observações", 14, ty);
      ty += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(detail.observacoes, pageW - 28);
      doc.text(lines, 14, ty);
    }

    // Rodapé com numeração
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setDrawColor(200);
      doc.line(14, doc.internal.pageSize.getHeight() - 15, pageW - 14, doc.internal.pageSize.getHeight() - 15);
      doc.text(`Página ${i} de ${totalPages}`, pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    }

    window.open(doc.output("bloburl"), "_blank");
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "ABERTO": return "bg-blue-100 text-blue-800";
      case "APROVADO": return "bg-green-100 text-green-800";
      case "FINALIZADO": return "bg-gray-100 text-gray-800";
      case "CANCELADO": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  // ═══ FORMULÁRIO ═══
  if (view === "form") {
    return (
      <div className="p-4 max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView("list")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <h2 className="text-lg font-bold">{editId ? `Pedido Compra #${editId}` : "Novo Pedido de Compra"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={gerarPDFForm} title="Imprimir PDF">
              <Printer className="h-4 w-4 mr-1" /> Imprimir PDF
            </Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="bg-green-700 hover:bg-green-800">
              <Save className="h-4 w-4 mr-1" /> Salvar
            </Button>
          </div>
        </div>

        {/* Dados do pedido */}
        <Card>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Data *</label>
              <Input type="date" value={formData.data} onChange={e => setFormData(p => ({ ...p, data: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Solicitante *</label>
              <Input value={formData.solicitante} onChange={e => setFormData(p => ({ ...p, solicitante: e.target.value }))} placeholder="Nome do solicitante" />
            </div>
            <div>
              <label className="text-sm font-medium">Observações</label>
              <Input value={formData.observacoes} onChange={e => setFormData(p => ({ ...p, observacoes: e.target.value }))} placeholder="Observações opcionais" />
            </div>
          </CardContent>
        </Card>

        {/* Adicionar produto */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Adicionar Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2">
                <Input
                  value={prodSearch}
                  onChange={e => { setProdSearch(e.target.value); setProdDropdownOpen(true); setHighlightIdx(-1); }}
                  onFocus={() => setProdDropdownOpen(true)}
                  onKeyDown={e => {
                    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightIdx(prev => Math.min(prev + 1, prodSugestoes.length)); }
                    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightIdx(prev => Math.max(prev - 1, -1)); }
                    else if (e.key === "Enter" && highlightIdx >= 0 && highlightIdx < prodSugestoes.length) { e.preventDefault(); addItem(prodSugestoes[highlightIdx]); }
                    else if (e.key === "Escape") { setProdDropdownOpen(false); setHighlightIdx(-1); }
                  }}
                  placeholder="Digite o nome do produto para buscar..."
                  className="flex-1"
                />
              </div>
              {prodDropdownOpen && prodSearch.length >= 2 && (
                <div className="absolute z-50 top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-52 overflow-y-auto">
                  {prodSugestoes.map((p: any, idx: number) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm border-b last:border-b-0 transition-colors ${
                        idx === highlightIdx ? "bg-green-100 dark:bg-green-900/50 text-green-800" : "hover:bg-green-50 dark:hover:bg-green-900/30"
                      }`}
                      onMouseEnter={() => setHighlightIdx(idx)}
                      onClick={() => addItem(p)}
                    >
                      <span className="font-medium">{p.descricao}</span>
                      <span className="text-muted-foreground ml-2">R$ {parseFloat(p.preco || "0").toFixed(2)}</span>
                    </button>
                  ))}
                  {/* Opção de autocadastro quando não há resultados */}
                  {prodSugestoes.length === 0 && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 font-medium"
                      onClick={abrirAutocadastro}
                    >
                      <PackagePlus className="h-4 w-4 shrink-0" />
                      <span>Cadastrar produto <strong>"{prodSearch}"</strong></span>
                    </button>
                  )}
                  {/* Opção de cadastro adicional quando há resultados mas o usuário quer cadastrar mesmo assim */}
                  {prodSugestoes.length > 0 && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-muted-foreground hover:bg-muted/50 border-t"
                      onClick={abrirAutocadastro}
                    >
                      <PackagePlus className="h-3.5 w-3.5 shrink-0" />
                      <span>Não encontrou? Cadastrar novo produto</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabela de itens */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Itens do Pedido ({itens.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-700 hover:bg-green-700">
                    <TableHead className="text-white w-10">#</TableHead>
                    <TableHead className="text-white">Produto</TableHead>
                    <TableHead className="text-white">Descrição</TableHead>
                    <TableHead className="text-white text-right w-24">Qtd</TableHead>
                    <TableHead className="text-white text-right w-28">Preço Venda</TableHead>
                    <TableHead className="text-white text-right w-28">Subtotal</TableHead>
                    <TableHead className="text-white w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhum produto adicionado. Use a busca acima para adicionar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...itens].sort((a, b) => a.produtoNome.localeCompare(b.produtoNome, 'pt-BR')).map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-center font-mono text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{item.produtoNome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.observacao || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={item.quantidade}
                            onChange={e => updateItem(idx, "quantidade", e.target.value)}
                            className="h-7 w-20 text-right text-sm ml-auto"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={item.precoVenda}
                            onChange={e => updateItem(idx, "precoVenda", e.target.value)}
                            className="h-7 w-24 text-right text-sm ml-auto"
                            min="0"
                            step="0.01"
                          />
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          R$ {parseFloat(item.subtotalVenda).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {itens.length > 0 && (
              <div className="p-4 border-t text-right space-y-1">
                <p className="text-sm text-muted-foreground">Nº de itens: {itens.length}</p>
                <p className="text-sm text-muted-foreground">Soma das Qtdes: {itens.reduce((s, i) => s + (parseFloat(i.quantidade) || 0), 0).toFixed(2)}</p>
                <p className="text-lg font-bold text-green-700">Total (Venda): R$ {totalGeral.toFixed(2)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orçamentos Consolidados */}
        {editId && pedidos && (() => {
          const pedido = pedidos.find((p: any) => p.id === editId);
          const orcamentosIds = pedido?.orcamentosOrigemIds ? JSON.parse(pedido.orcamentosOrigemIds) : [];
          return orcamentosIds.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Orçamentos Consolidados ({orcamentosIds.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Este pedido foi gerado a partir dos seguintes orçamentos:</p>
                  <div className="flex flex-wrap gap-2">
                    {orcamentosIds.map((id: number) => (
                      <Badge key={id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Orçamento #{id}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null;
        })()}

        {/* Modal de Autocadastro de Produto */}
        <Dialog open={autocadastroOpen} onOpenChange={setAutocadastroOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5 text-green-700" />
                Cadastrar Novo Produto
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="novo-nome">Nome do Produto *</Label>
                <Input
                  id="novo-nome"
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value.toUpperCase())}
                  placeholder="Ex: ALSTROEMERIA LILAS"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="novo-preco">Preço de Venda (R$)</Label>
                  <Input
                    id="novo-preco"
                    type="number"
                    value={novoPreco}
                    onChange={e => setNovoPreco(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nova-unidade">Unidade</Label>
                  <Input
                    id="nova-unidade"
                    value={novaUnidade}
                    onChange={e => setNovaUnidade(e.target.value.toUpperCase())}
                    placeholder="UN"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                O produto será cadastrado no sistema e adicionado automaticamente ao pedido.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAutocadastroOpen(false)} disabled={salvandoProduto}>
                Cancelar
              </Button>
              <Button
                onClick={salvarNovoProduto}
                disabled={salvandoProduto || !novoNome.trim()}
                className="bg-green-700 hover:bg-green-800"
              >
                {salvandoProduto ? "Cadastrando..." : "Cadastrar e Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ═══ LISTAGEM ═══
  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" /> Pedidos de Compra
        </h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pedido..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={openNew} className="bg-green-700 hover:bg-green-800 shrink-0">
            <Plus className="h-4 w-4 mr-1" /> Novo Pedido
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[500px]">
          <thead>
            <tr className="bg-white border-b-2 border-[#e0e0e0]">
              <th className="w-8 p-3"></th>
              <th className="text-left p-3 font-semibold text-[#555] text-xs uppercase tracking-wide">Número</th>
              <th className="text-left p-3 font-semibold text-[#555] text-xs uppercase tracking-wide">Data</th>
              <th className="text-left p-3 font-semibold text-[#555] text-xs uppercase tracking-wide">Solicitante</th>
              <th className="text-left p-3 font-semibold text-[#555] text-xs uppercase tracking-wide hidden md:table-cell">Origem Orçamento</th>
              <th className="text-right p-3 font-semibold text-[#555] text-xs uppercase tracking-wide">Total (R$)</th>
              <th className="text-left p-3 font-semibold text-[#555] text-xs uppercase tracking-wide">Situação</th>
              <th className="w-10 p-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-[#888]">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-[#888]">Nenhum pedido de compra encontrado.</td></tr>
            ) : (
              filtered.map((p: any) => (
                <tr key={p.id} className="border-b border-[#f0f0f0] hover:bg-[#fafafa] cursor-pointer group" onClick={() => openEdit(p)}>
                  <td className="p-3 text-center">
                    <input type="checkbox" className="rounded" onClick={e => e.stopPropagation()} />
                  </td>
                  <td className="p-3 font-mono font-semibold text-[#333]">{p.numero}</td>
                  <td className="p-3 text-[#555]">{p.data}</td>
                  <td className="p-3 font-medium text-[#222]">{p.solicitante}</td>
                  <td className="p-3 hidden md:table-cell" onClick={e => e.stopPropagation()}>
                    {p.origens && p.origens.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {p.origens.map((o: any) => (
                          <button
                            key={o.vendaOrigemId}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors text-left"
                            title={`Abrir orçamento #${o.vendaOrigemId} - ${o.clienteNome || 'Cliente'}`}
                            onClick={() => window.dispatchEvent(new CustomEvent('erp-open-tab', { detail: 'vendas' }))}
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            #{o.vendaOrigemId}{o.clienteNome ? ` — ${o.clienteNome}` : ''}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono">{parseFloat(p.total).toFixed(2).replace('.', ',')}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#888]" />
                      {p.status === "FINALIZADO" ? (
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Finalizado</span>
                      ) : p.status === "APROVADO" ? (
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Aprovado</span>
                      ) : p.status === "CANCELADO" ? (
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Cancelado</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Em aberto</span>
                      )}
                    </div>
                  </td>
                  <td className="p-2.5 text-center" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded hover:bg-[#e8e8e8] text-[#666] opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEdit(p)}>
                          <FileText className="h-4 w-4 mr-2" /> Ver pedido
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => gerarPDF(p)}>
                          <Printer className="h-4 w-4 mr-2" /> Imprimir PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteConfirm(p.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este pedido de compra?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
