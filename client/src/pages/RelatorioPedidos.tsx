import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";

// Converte "dd/MM/yyyy" → "yyyy-MM-dd" para comparação
function brToIso(dataBr: string): string {
  if (!dataBr) return "";
  const parts = dataBr.split("/");
  if (parts.length !== 3) return dataBr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

export default function RelatorioPedidos() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState<string>("TODOS");
  const { data: vendas, isLoading } = trpc.vendas.list.useQuery({ search: undefined });

  const filtered = (vendas || []).filter((v: any) => {
    if (status !== "TODOS" && v.status !== status) return false;
    const dataIso = brToIso(v.data || "");
    if (dataInicio && dataIso < dataInicio) return false;
    if (dataFim && dataIso > dataFim) return false;
    return true;
  });

  const totalGeral = filtered.reduce((s: number, v: any) => s + Number(v.total), 0);

  const limparFiltros = () => {
    setDataInicio("");
    setDataFim("");
    setStatus("TODOS");
  };

  const temFiltro = dataInicio || dataFim || status !== "TODOS";

  const gerarPDF = () => {
    const win = window.open("", "_blank");
    if (!win) { toast.error("Popup bloqueado"); return; }
    
    // Gerar URLs de QR Codes para cada pedido usando API externa
    const qrCodes: Record<string, string> = {};
    for (const v of filtered) {
      const qrText = `Pedido ${v.id} - ${v.clienteNome}`;
      qrCodes[v.id] = `https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(qrText)}`;
    }
    
    win.document.write(`<html><head><title>Relatório de Pedidos</title><style>
      body { font-family: Arial; padding: 20px; font-size: 12px; }
      h1 { font-size: 18px; color: #2d5016; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f0f7e6; font-weight: bold; }
      .total { font-weight: bold; text-align: right; }
      .sub { font-size: 10px; color: #666; margin-left: 10px; }
      .qrcode { width: 60px; height: 60px; }
    </style></head><body>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;"><img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663539257200/nE9aRDyk9G49cwSdfYmqny/logo-garden_de682faf.png" alt="Garden Center Primavera" style="height:48px;" /><h1 style="margin:0;">Relatório de Pedidos</h1></div>
      <p>Período: ${dataInicio ? dataInicio.split("-").reverse().join("/") : "Início"} a ${dataFim ? dataFim.split("-").reverse().join("/") : "Fim"} | Status: ${status} | Total: R$ ${totalGeral.toFixed(2)}</p>
      <table><tr><th>QR Code</th><th>ID</th><th>Data</th><th>Cliente</th><th>Vendedor</th><th>Status</th><th>Total</th></tr>
      ${filtered.map((v: any) => `<tr><td><img src="${qrCodes[v.id]}" class="qrcode" alt="QR ${v.id}" /></td><td>${v.id}</td><td>${v.data}</td><td>${v.clienteNome || "-"}</td><td>${v.vendedorNome || "-"}</td><td>${v.status}</td><td class="total">R$ ${Number(v.total).toFixed(2)}</td></tr>
        ${v.itens?.map((i: any) => `<tr><td></td><td colspan="1" class="sub">↳ ${i.produtoNome}</td><td class="sub">${i.observacao || ""}</td><td class="sub">Qtd: ${i.quantidade}</td><td class="sub">R$ ${Number(i.valorUnitario).toFixed(2)}</td><td class="sub total">R$ ${Number(i.subtotal).toFixed(2)}</td></tr>`).join("") || ""}`).join("")}
      <tr><td></td><td colspan="5" class="total">TOTAL GERAL</td><td class="total">R$ ${totalGeral.toFixed(2)}</td></tr>
      </table></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Relatório de Pedidos</h1>
        <Button onClick={() => gerarPDF()} variant="outline" className="h-10 sm:h-9 text-sm">
          <FileText className="h-4 w-4 mr-2" /> Gerar PDF
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-muted-foreground pl-0.5">Data início</label>
          <Input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="w-full sm:w-40 h-9"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-muted-foreground pl-0.5">Data fim</label>
          <Input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            className="w-full sm:w-40 h-9"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-xs text-muted-foreground pl-0.5">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos</SelectItem>
              <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
              <SelectItem value="APROVADO">Aprovado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {temFiltro && (
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-muted-foreground pl-0.5 invisible">Limpar</label>
            <Button variant="ghost" size="sm" onClick={limparFiltros} className="h-9 gap-1 text-xs text-muted-foreground">
              <X className="h-3.5 w-3.5" /> Limpar filtros
            </Button>
          </div>
        )}
        {temFiltro && (
          <div className="flex flex-col gap-0.5 ml-auto">
            <label className="text-xs text-muted-foreground pl-0.5 invisible">Total</label>
            <span className="text-sm font-semibold text-primary h-9 flex items-center">
              {filtered.length} pedido{filtered.length !== 1 ? "s" : ""} · R$ {totalGeral.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                : filtered.length === 0
                  ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado{temFiltro ? " para os filtros selecionados" : ""}</TableCell></TableRow>
                  : filtered.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">{v.id}</TableCell>
                      <TableCell>{v.data}</TableCell>
                      <TableCell className="font-medium">{v.clienteNome || "-"}</TableCell>
                      <TableCell>{v.vendedorNome || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={v.status === "APROVADO" ? "default" : v.status === "CANCELADO" ? "destructive" : "secondary"}>
                          {v.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">R$ {Number(v.total).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
              }
              {filtered.length > 0 && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={5} className="text-right font-bold">Total Geral:</TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">R$ {totalGeral.toFixed(2)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
