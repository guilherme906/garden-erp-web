import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, Printer, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function RelatorioProdutos() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState<string>("TODOS");
  const [filtroAtivo, setFiltroAtivo] = useState(false);

  // Datas padrão: mês atual
  const hoje = new Date();
  const primeiroDia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
  const ultimoDia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;

  const { data: ranking, isLoading, refetch } = trpc.relatorios.ranking.useQuery(
    {
      dataInicio: dataInicio || primeiroDia,
      dataFim: dataFim || ultimoDia,
      status: status === "TODOS" ? undefined : status,
    },
    { enabled: true }
  );

  const grouped = ranking ?? [];
  const totalGeral = grouped.reduce((s: number, g: any) => s + Number(g.total), 0);
  const totalQtd = grouped.reduce((s: number, g: any) => s + Number(g.quantidade), 0);

  const handleFiltrar = () => {
    setFiltroAtivo(true);
    refetch();
  };

  const gerarPDF = () => {
    const win = window.open("", "_blank");
    if (!win) { toast.error("Popup bloqueado"); return; }
    win.document.write(`<html><head><title>Relatório de Produtos Vendidos</title><style>
      body { font-family: Arial; padding: 20px; font-size: 12px; }
      h1 { font-size: 18px; color: #2d5016; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f0f7e6; }
      .r { text-align: right; }
      .obs { font-size: 10px; color: #666; }
      .estoque-ok { color: #2e7d32; font-weight: bold; }
      .estoque-baixo { color: #e65100; font-weight: bold; }
      .estoque-zero { color: #d32f2f; font-weight: bold; }
    </style></head><body>
      <h1>Relatório de Produtos Vendidos - Garden Primavera</h1>
      <p>Período: ${dataInicio || primeiroDia} a ${dataFim || ultimoDia} | Status: ${status}</p>
      <table>
        <tr><th>#</th><th>Produto</th><th class="r">Valor Unit.</th><th class="r">Qtd Vendida</th><th class="r">Total</th><th class="r">Estoque Atual</th><th>Obs</th></tr>
        ${grouped.map((g: any, i: number) => {
          const estDisp = g.estoqueDisponivel;
          const estClass = estDisp === null ? "" : (estDisp < 0 ? "estoque-zero" : estDisp === 0 ? "estoque-baixo" : "estoque-ok");
          const estLabel = estDisp !== null ? String(estDisp) : "-";
          return `<tr><td>${i + 1}</td><td>${g.produtoNome}</td><td class="r">R$ ${Number(g.valorUnitario).toFixed(2)}</td><td class="r">${g.quantidade}</td><td class="r">R$ ${Number(g.total).toFixed(2)}</td><td class="r ${estClass}">${estLabel}</td><td class="obs">${(g.observacoes || []).join("; ")}</td></tr>`;
        }).join("")}
        <tr><td colspan="3" class="r"><b>TOTAL GERAL</b></td><td class="r"><b>${totalQtd}</b></td><td class="r"><b>R$ ${totalGeral.toFixed(2)}</b></td><td></td><td></td></tr>
      </table>
    </body></html>`);
    win.document.close();
    win.print();
  };

  const imprimirCupom = () => {
    const win = window.open("", "_blank");
    if (!win) { toast.error("Popup bloqueado"); return; }
    const linhaLarga = "=".repeat(40);
    const linhaFina = "-".repeat(40);
    let cupom = "\n\n";
    cupom += "         GARDEN CENTER PRIMAVERA\n";
    cupom += "         PRODUTOS VENDIDOS\n";
    cupom += linhaLarga + "\n\n";
    cupom += `Período: ${dataInicio || primeiroDia} a ${dataFim || ultimoDia}\n`;
    cupom += `Status: ${status}\n`;
    cupom += linhaFina + "\n\n";
    cupom += "#  PRODUTO                    QTD    TOTAL\n";
    cupom += linhaFina + "\n";
    grouped.forEach((g: any, i: number) => {
      const prodName = g.produtoNome.substring(0, 24).padEnd(24);
      const qtd = String(g.quantidade).padStart(4);
      const total = `R$ ${Number(g.total).toFixed(2)}`.padStart(10);
      cupom += `${String(i + 1).padStart(2)}  ${prodName} ${qtd}  ${total}\n`;
    });
    cupom += linhaFina + "\n";
    cupom += `TOTAL GERAL: R$ ${totalGeral.toFixed(2)}`.padStart(40) + "\n";
    cupom += linhaLarga + "\n\n";
    cupom += new Date().toLocaleString("pt-BR") + "\n\n\n";

    const rastreamentoUrl = `${window.location.origin}/rastreamento?periodo=${dataInicio}-${dataFim}&status=${status}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(rastreamentoUrl)}`;

    const qrHtml = `<html><head><title>Cupom - Produtos Vendidos</title><style>
      body { font-family: 'Courier New', monospace; padding: 10px; font-size: 11px; line-height: 1.2; }
      pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; }
      .qr-container { text-align: center; margin: 10px 0; }
      .qr-container img { width: 100px; height: 100px; }
      @media print { body { margin: 0; padding: 0; } }
    </style></head><body><pre>${cupom}</pre>
    <div class="qr-container"><img src="${qrImageUrl}" alt="QR Code" /></div>
    </body></html>`;

    win.document.write(qrHtml);
    win.document.close();
    win.print();
  };

  const imprimirA4ComQR = () => {
    const win = window.open("", "_blank");
    if (!win) { toast.error("Popup bloqueado"); return; }

    const rastreamentoUrl = `${window.location.origin}/rastreamento?periodo=${dataInicio}-${dataFim}&status=${status}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(rastreamentoUrl)}`;

    const htmlContent = `<html><head><title>Relatório de Produtos Vendidos - A4</title><style>
      body { font-family: Arial; padding: 20px; font-size: 12px; }
      h1 { font-size: 18px; color: #2d5016; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f0f7e6; }
      .r { text-align: right; }
      .obs { font-size: 10px; color: #666; }
      .estoque-ok { color: #2e7d32; font-weight: bold; }
      .estoque-baixo { color: #e65100; font-weight: bold; }
      .estoque-zero { color: #d32f2f; font-weight: bold; }
      .qr-section { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd; }
      .qr-section img { width: 80px; height: 80px; }
      .qr-text { font-size: 11px; color: #666; margin-top: 10px; }
    </style></head><body>
      <h1>Relatório de Produtos Vendidos - Garden Primavera</h1>
      <p>Período: ${dataInicio || primeiroDia} a ${dataFim || ultimoDia} | Status: ${status}</p>
      <table>
        <tr><th>#</th><th>Produto</th><th class="r">Valor Unit.</th><th class="r">Qtd Vendida</th><th class="r">Total</th><th class="r">Estoque Atual</th><th>Obs</th></tr>
        ${grouped.map((g: any, i: number) => {
          const estDisp = g.estoqueDisponivel;
          const estClass = estDisp === null ? "" : (estDisp < 0 ? "estoque-zero" : estDisp === 0 ? "estoque-baixo" : "estoque-ok");
          const estLabel = estDisp !== null ? String(estDisp) : "-";
          return `<tr><td>${i + 1}</td><td>${g.produtoNome}</td><td class="r">R$ ${Number(g.valorUnitario).toFixed(2)}</td><td class="r">${g.quantidade}</td><td class="r">R$ ${Number(g.total).toFixed(2)}</td><td class="r ${estClass}">${estLabel}</td><td class="obs">${(g.observacoes || []).join("; ")}</td></tr>`;
        }).join("")}
        <tr><td colspan="3" class="r"><b>TOTAL GERAL</b></td><td class="r"><b>${totalQtd}</b></td><td class="r"><b>R$ ${totalGeral.toFixed(2)}</b></td><td></td><td></td></tr>
      </table>
      <div class="qr-section">
        <p><strong>Escaneie para rastrear:</strong></p>
        <img src="${qrImageUrl}" alt="QR Code" />
        <p class="qr-text">Acesso rápido ao rastreamento e conferência</p>
      </div>
    </body></html>`;

    win.document.write(htmlContent);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Relatório de Produtos Vendidos</h1>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={gerarPDF} variant="outline" className="h-10 sm:h-9 text-sm" disabled={grouped.length === 0}>
            <FileText className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button onClick={imprimirCupom} variant="outline" className="h-10 sm:h-9 text-sm" disabled={grouped.length === 0}>
            <Printer className="h-4 w-4 mr-2" /> Cupom 80mm
          </Button>
          <Button onClick={imprimirA4ComQR} variant="outline" className="h-10 sm:h-9 text-sm" disabled={grouped.length === 0}>
            <QrCode className="h-4 w-4 mr-2" /> A4 + QR
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-end">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Data início</span>
          <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full sm:w-40 h-10 sm:h-9" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Data fim</span>
          <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-full sm:w-40 h-10 sm:h-9" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Status</span>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40 h-10 sm:h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
              <SelectItem value="APROVADO">Aprovado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleFiltrar} className="h-10 sm:h-9">Filtrar</Button>
      </div>

      {/* Resumo */}
      {grouped.length > 0 && (
        <div className="flex gap-4 flex-wrap text-sm text-muted-foreground">
          <span><strong className="text-foreground">{grouped.length}</strong> produto(s)</span>
          <span><strong className="text-foreground">{totalQtd}</strong> unidades vendidas</span>
          <span>Total: <strong className="text-primary">R$ {totalGeral.toFixed(2)}</strong></span>
        </div>
      )}

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Valor Unit.</TableHead>
                <TableHead className="text-right">Qtd Vendida</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead>Obs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                : grouped.length === 0
                  ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum produto vendido no período</TableCell></TableRow>
                  : grouped.map((g: any, i: number) => {
                      const estDisp: number | null = g.estoqueDisponivel ?? null;
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                          <TableCell className="font-medium">{g.produtoNome}</TableCell>
                          <TableCell className="text-right font-mono">R$ {Number(g.valorUnitario).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono">{g.quantidade}</TableCell>
                          <TableCell className="text-right font-mono font-bold">R$ {Number(g.total).toFixed(2)}</TableCell>
                          <TableCell className={`text-right font-mono font-bold ${
                            estDisp === null
                              ? "text-muted-foreground"
                              : estDisp < 0
                                ? "text-red-600"
                                : estDisp === 0
                                  ? "text-orange-600"
                                  : "text-green-700"
                          }`}>
                            {estDisp !== null ? estDisp : "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {(g.observacoes || []).join("; ") || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })
              }
              {grouped.length > 0 && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={3} className="text-right font-bold">Total Geral:</TableCell>
                  <TableCell className="text-right font-mono font-bold">{totalQtd}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">R$ {totalGeral.toFixed(2)}</TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
