import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function RelatorioDivergencias() {
  const { data: divergencias, isLoading } = trpc.conferencia.divergencias.useQuery();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [filtro, setFiltro] = useState<"todos" | "divergentes" | "ok">("todos");

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = (divergencias || []).filter((v: any) => {
    if (filtro === "divergentes") return v.itensDivergentes > 0;
    if (filtro === "ok") return v.itensDivergentes === 0;
    return true;
  });

  const totalConferidos = divergencias?.length || 0;
  const totalDivergentes = divergencias?.filter((v: any) => v.itensDivergentes > 0).length || 0;
  const totalOk = totalConferidos - totalDivergentes;

  const gerarPDF = async () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // Logo
    const logoUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663539257200/nE9aRDyk9G49cwSdfYmqny/logo-garden_de682faf.png";
    try {
      const logoImg = new Image();
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
    } catch (e) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("GARDEN CENTER PRIMAVERA", 14, 12);
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE DIVERGÊNCIAS", pageW / 2, 32, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 39);
    doc.text(`Total conferidos: ${totalConferidos} | Com divergências: ${totalDivergentes} | OK: ${totalOk}`, 14, 44);

    let y = 50;
    for (const v of filtered as any[]) {
      if (y > 260) { doc.addPage(); y = 15; }
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const statusText = v.itensDivergentes > 0 ? "⚠ DIVERGENTE" : "✓ OK";
      doc.text(`Pedido #${v.id} - ${v.clienteNome || "-"} - ${statusText}`, 14, y);
      y += 5;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Conferido por: ${v.conferidoPor || "-"} em ${v.conferidoEm ? new Date(v.conferidoEm).toLocaleString("pt-BR") : "-"}`, 14, y);
      y += 4;

      const rows = v.itens.map((item: any) => [
        item.produtoNome || "-",
        item.quantidade || "0",
        item.qtdConferida || "0",
        item.divergente ? "DIVERGENTE" : "OK",
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Produto", "Qtd Pedido", "Qtd Conferida", "Status"]],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [22, 163, 74], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        margin: { left: 14 },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 3) {
            if (data.cell.raw === "DIVERGENTE") {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = "bold";
            } else {
              data.cell.styles.textColor = [22, 163, 74];
            }
          }
        },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    doc.output("dataurlnewwindow");
  };

  return (
    <div className="p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-[#1a1a1a]">Relatório de Divergências</h2>
        <Button onClick={gerarPDF} disabled={!divergencias?.length} className="bg-[#16a34a] hover:bg-[#15803d] text-white gap-1.5 h-10 sm:h-9 text-sm">
          <FileText className="h-4 w-4" /> Gerar PDF
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        <div
          className={`p-3 rounded-lg border cursor-pointer transition-all ${filtro === "todos" ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          onClick={() => setFiltro("todos")}
        >
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalConferidos}</div>
          <div className="text-[10px] sm:text-xs text-gray-500">Total Conferidos</div>
        </div>
        <div
          className={`p-3 rounded-lg border cursor-pointer transition-all ${filtro === "divergentes" ? "border-red-500 bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          onClick={() => setFiltro("divergentes")}
        >
          <div className="text-xl sm:text-2xl font-bold text-red-600">{totalDivergentes}</div>
          <div className="text-[10px] sm:text-xs text-gray-500">Com Divergências</div>
        </div>
        <div
          className={`p-3 rounded-lg border cursor-pointer transition-all ${filtro === "ok" ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
          onClick={() => setFiltro("ok")}
        >
          <div className="text-xl sm:text-2xl font-bold text-green-600">{totalOk}</div>
          <div className="text-[10px] sm:text-xs text-gray-500">Sem Divergências</div>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#16a34a]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Nenhum pedido conferido encontrado</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((v: any) => (
            <div key={v.id} className="border rounded-lg overflow-hidden">
              <div
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${v.itensDivergentes > 0 ? "bg-red-50/50" : "bg-green-50/50"}`}
                onClick={() => toggleExpand(v.id)}
              >
                {expandedIds.has(v.id) ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                <span className="font-mono font-bold text-sm">#{v.id}</span>
                <span className="font-medium text-sm truncate max-w-[100px] sm:max-w-none">{v.clienteNome || "-"}</span>
                <span className="text-xs text-gray-500 hidden sm:inline">{v.data}</span>
                <div className="ml-auto flex items-center gap-2 shrink-0">
                  {v.itensDivergentes > 0 ? (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <AlertTriangle className="h-3 w-3" /> {v.itensDivergentes} divergência{v.itensDivergentes > 1 ? "s" : ""}
                    </Badge>
                  ) : (
                    <Badge className="gap-1 text-xs bg-green-600">
                      <CheckCircle2 className="h-3 w-3" /> OK
                    </Badge>
                  )}
                  <span className="text-xs text-gray-400">por {v.conferidoPor || "-"}</span>
                </div>
              </div>

              {expandedIds.has(v.id) && (
                <div className="border-t p-3 bg-white">
                  <div className="text-xs text-gray-500 mb-2">
                    Conferido por <strong>{v.conferidoPor}</strong> em {v.conferidoEm ? new Date(v.conferidoEm).toLocaleString("pt-BR") : "-"}
                  </div>
                  <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[400px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-2 font-semibold">Produto</th>
                        <th className="text-right p-2 font-semibold">Qtd Pedido</th>
                        <th className="text-right p-2 font-semibold">Qtd Conferida</th>
                        <th className="text-right p-2 font-semibold">Diferença</th>
                        <th className="text-center p-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {v.itens.map((item: any) => {
                        const qtdPedido = Number(item.quantidade) || 0;
                        const qtdConf = Number(item.qtdConferida) || 0;
                        const diff = qtdConf - qtdPedido;
                        return (
                          <tr key={item.id} className={`border-b ${item.divergente ? "bg-red-50" : ""}`}>
                            <td className="p-2 font-medium">{item.produtoNome || "-"}</td>
                            <td className="p-2 text-right font-mono">{qtdPedido}</td>
                            <td className="p-2 text-right font-mono">{qtdConf}</td>
                            <td className={`p-2 text-right font-mono font-bold ${diff !== 0 ? "text-red-600" : "text-green-600"}`}>
                              {diff > 0 ? `+${diff}` : diff}
                            </td>
                            <td className="p-2 text-center">
                              {item.divergente ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-red-500 mx-auto" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mx-auto" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
