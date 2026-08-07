/**
 * RelatorioPublico.tsx
 * Página pública para visualização do relatório financeiro via link compartilhado.
 * Acessível sem autenticação via /relatorio/:token
 */
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, AlertCircle, CheckCircle2, Clock, CreditCard, TrendingUp } from "lucide-react";

const fmt = (v: number | string) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtData = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("pt-BR");
};

const STATUS_TITULO_BADGE: Record<string, { label: string; cls: string }> = {
  PAGO:      { label: "Pago",      cls: "bg-green-100 text-green-700" },
  PENDENTE:  { label: "Pendente",  cls: "bg-yellow-100 text-yellow-700" },
  VENCIDO:   { label: "Vencido",   cls: "bg-red-100 text-red-700" },
  CANCELADO: { label: "Cancelado", cls: "bg-gray-100 text-gray-500" },
};

export default function RelatorioPublico({ token }: { token: string }) {
  const { data: relatorio, isLoading, error } = trpc.relatorioFinanceiro.getRelatorioPublico.useQuery(
    { token },
    { retry: false, refetchOnWindowFocus: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <p className="text-sm">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500 max-w-sm text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <h2 className="text-lg font-semibold text-gray-700">Link inválido ou expirado</h2>
          <p className="text-sm text-gray-400">Este relatório não está mais disponível. Solicite um novo link ao responsável.</p>
        </div>
      </div>
    );
  }

  if (!relatorio) return null;

  const r = relatorio.resumo;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-700 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-bold">Garden Center Primavera</div>
          <div className="text-green-200 text-xs">Relatório Financeiro do Cliente</div>
        </div>
        <div className="text-right text-xs text-green-200">
          <div>Gerado em {new Date().toLocaleDateString("pt-BR")}</div>
          {relatorio.expiresAt && (
            <div>Válido até {new Date(relatorio.expiresAt).toLocaleDateString("pt-BR")}</div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Dados do cliente */}
        <div className="bg-white border border-green-200 rounded-lg p-4">
          <h1 className="text-xl font-bold text-green-800">{relatorio.cliente.nome}</h1>
          <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
            {relatorio.cliente.telefone && <span>📞 {relatorio.cliente.telefone}</span>}
            {relatorio.cliente.email && <span>✉ {relatorio.cliente.email}</span>}
          </div>
          {(relatorio.filtros?.dataInicio || relatorio.filtros?.dataFim) && (
            <div className="mt-2 text-xs text-gray-400">
              Período: {relatorio.filtros.dataInicio ? fmtData(relatorio.filtros.dataInicio) : "início"} — {relatorio.filtros.dataFim ? fmtData(relatorio.filtros.dataFim) : "hoje"}
            </div>
          )}
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Total Pedidos</div>
            <div className="text-lg font-bold text-gray-800 mt-1">{fmt(r?.totalPedidos || 0)}</div>
            <div className="text-xs text-gray-400">{r?.qtdPedidos} pedido(s)</div>
          </div>
          <div className="bg-white border border-green-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" /> Pago</div>
            <div className="text-lg font-bold text-green-700 mt-1">{fmt(r?.totalTitulosPago || 0)}</div>
          </div>
          <div className="bg-white border border-yellow-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><Clock className="h-3 w-3 text-yellow-600" /> Pendente</div>
            <div className="text-lg font-bold text-yellow-700 mt-1">{fmt(r?.totalTitulosPendente || 0)}</div>
          </div>
          <div className="bg-white border border-red-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><AlertCircle className="h-3 w-3 text-red-600" /> Vencido</div>
            <div className="text-lg font-bold text-red-700 mt-1">{fmt(r?.totalTitulosVencido || 0)}</div>
          </div>
        </div>

        {/* Formas de pagamento */}
        {Object.keys(r?.porFormaPagamento || {}).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-blue-500" /> Recebido por Forma de Pagamento
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(r!.porFormaPagamento).map(([fp, val]) => (
                <div key={fp} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                  <span className="text-sm font-medium text-blue-800">{fp}</span>
                  <span className="text-sm font-bold text-blue-900">{fmt(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Títulos Financeiros */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-purple-500" />
              Títulos Financeiros ({relatorio.titulos.length})
            </h2>
          </div>
          {relatorio.titulos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum título encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Pedido</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Emissão</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Vencimento</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Pagamento</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Forma Pgto</th>
                    <th className="text-right px-3 py-2 text-gray-600 font-medium">Valor</th>
                    <th className="text-center px-3 py-2 text-gray-600 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.titulos.map((t: any) => {
                    const cfg = STATUS_TITULO_BADGE[t.status] || STATUS_TITULO_BADGE.PENDENTE;
                    return (
                      <tr key={t.id} className="border-b border-gray-100">
                        <td className="px-3 py-2 text-blue-600 font-mono">#{t.vendaId}</td>
                        <td className="px-3 py-2 text-gray-600">{fmtData(t.dataEmissao)}</td>
                        <td className="px-3 py-2 text-gray-600">{fmtData(t.dataVencimento)}</td>
                        <td className="px-3 py-2 text-gray-600">{fmtData(t.dataPagamento)}</td>
                        <td className="px-3 py-2 text-gray-600">{t.formaPagamentoNome || "—"}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmt(t.valor)}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pedidos */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-orange-500" />
              Pedidos / Orçamentos ({relatorio.pedidos.length})
            </h2>
          </div>
          {relatorio.pedidos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum pedido encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Nº Pedido</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Data</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Vendedor</th>
                    <th className="text-right px-3 py-2 text-gray-600 font-medium">Total</th>
                    <th className="text-center px-3 py-2 text-gray-600 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.pedidos.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="px-3 py-2 text-blue-600 font-mono font-semibold">#{p.id}</td>
                      <td className="px-3 py-2 text-gray-600">{p.data}</td>
                      <td className="px-3 py-2 text-gray-600">{p.vendedorNome || "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-800">{fmt(p.total)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.status === "APROVADO" ? "bg-green-100 text-green-700" :
                          p.status === "CANCELADO" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {p.status === "APROVADO" ? "Aprovado" : p.status === "CANCELADO" ? "Cancelado" : "Em aberto"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
          Garden Center Primavera — Este relatório é confidencial e destinado exclusivamente ao cliente indicado.
        </div>
      </div>
    </div>
  );
}
