import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  RefreshCw,
  ShoppingCart,
  Flower2,
  Package,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatarData(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatarDuracao(ms: number | null | undefined): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusBadge({
  status,
  rodando,
}: {
  status: "SUCESSO" | "FALHA" | null | undefined;
  rodando?: boolean;
}) {
  if (rodando) {
    return (
      <Badge variant="outline" className="gap-1 border-blue-400 text-blue-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        Executando
      </Badge>
    );
  }
  if (status === "SUCESSO") {
    return (
      <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Sucesso
      </Badge>
    );
  }
  if (status === "FALHA") {
    return (
      <Badge variant="outline" className="gap-1 border-red-500 text-red-600">
        <XCircle className="h-3 w-3" />
        Falha
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Clock className="h-3 w-3" />
      Aguardando
    </Badge>
  );
}

// ─── Card de Job ─────────────────────────────────────────────────────────────

interface JobCardProps {
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
  status: "SUCESSO" | "FALHA" | null | undefined;
  rodando: boolean;
  ultimaSync: Date | string | null | undefined;
  proximaSync: Date | string | null | undefined;
  historico: any[];
  tipoHistorico: "sync" | "importacao";
}

function JobCard({
  titulo,
  descricao,
  icon,
  status,
  rodando,
  ultimaSync,
  proximaSync,
  historico,
  tipoHistorico,
}: JobCardProps) {
  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{titulo}</CardTitle>
              <p className="text-xs text-muted-foreground">{descricao}</p>
            </div>
          </div>
          <StatusBadge status={status} rodando={rodando} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Última execução</p>
            <p className="mt-1 text-sm font-semibold">{formatarData(ultimaSync)}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Próxima execução</p>
            <p className="mt-1 text-sm font-semibold">{formatarData(proximaSync)}</p>
          </div>
        </div>

        {/* Histórico recente */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Histórico recente
          </p>
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Nenhuma execução registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="py-2">Data/Hora</TableHead>
                    <TableHead className="py-2">Status</TableHead>
                    {tipoHistorico === "sync" && <TableHead className="py-2">Total</TableHead>}
                    {tipoHistorico === "sync" && <TableHead className="py-2">Duração</TableHead>}
                    {tipoHistorico === "importacao" && <TableHead className="py-2">Pedidos</TableHead>}
                    {tipoHistorico === "importacao" && <TableHead className="py-2">Itens</TableHead>}
                    <TableHead className="py-2">Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.slice(0, 8).map((h: any, i: number) => {
                    const isOk =
                      tipoHistorico === "sync"
                        ? h.status === "SUCESSO"
                        : h.status === "SUCESSO" || h.status === "PARCIAL";
                    return (
                      <TableRow key={i} className={!isOk ? "bg-red-50" : undefined}>
                        <TableCell className="py-1.5 text-xs whitespace-nowrap">
                          {formatarData(tipoHistorico === "sync" ? h.createdAt : h.dataImportacao)}
                        </TableCell>
                        <TableCell className="py-1.5">
                          {isOk ? (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle2 className="h-3 w-3" />
                              {h.status}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-600">
                              <XCircle className="h-3 w-3" />
                              {h.status}
                            </span>
                          )}
                        </TableCell>
                        {tipoHistorico === "sync" && (
                          <TableCell className="py-1.5 text-xs">{h.total ?? "—"}</TableCell>
                        )}
                        {tipoHistorico === "sync" && (
                          <TableCell className="py-1.5 text-xs">{formatarDuracao(h.duracaoMs)}</TableCell>
                        )}
                        {tipoHistorico === "importacao" && (
                          <TableCell className="py-1.5 text-xs">{h.totalPedidos ?? "—"}</TableCell>
                        )}
                        {tipoHistorico === "importacao" && (
                          <TableCell className="py-1.5 text-xs">{h.totalItens ?? "—"}</TableCell>
                        )}
                        <TableCell className="py-1.5 text-xs max-w-[200px] truncate text-muted-foreground">
                          {h.mensagem || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function SaudeAutoSync() {
  const { data, isLoading, refetch } = trpc.config.syncHealth.useQuery(undefined, {
    refetchInterval: 30_000, // auto-refresh a cada 30s
  });

  // Indicador de quando foi a última atualização
  useEffect(() => {}, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const jobs = data?.jobs;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Saúde do Sistema</h2>
          <p className="text-sm text-muted-foreground">
            Status em tempo real dos jobs de sincronização automática. Atualiza a cada 30 segundos.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Cards dos jobs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <JobCard
          titulo="Catálogo Veiling"
          descricao="Sincroniza ofertas do Veiling Online a cada 20 minutos"
          icon={<Flower2 className="h-5 w-5" />}
          status={jobs?.veilingCatalogo?.ultimoStatus}
          rodando={jobs?.veilingCatalogo?.rodando ?? false}
          ultimaSync={jobs?.veilingCatalogo?.ultimaSync}
          proximaSync={jobs?.veilingCatalogo?.proximaSync}
          historico={jobs?.veilingCatalogo?.historico ?? []}
          tipoHistorico="sync"
        />
        <JobCard
          titulo="Catálogo Cooperflora"
          descricao="Sincroniza produtos da Cooperflora a cada 20 minutos"
          icon={<Package className="h-5 w-5" />}
          status={jobs?.cooperfloraCatalogo?.ultimoStatus}
          rodando={jobs?.cooperfloraCatalogo?.rodando ?? false}
          ultimaSync={jobs?.cooperfloraCatalogo?.ultimaSync}
          proximaSync={jobs?.cooperfloraCatalogo?.proximaSync}
          historico={jobs?.cooperfloraCatalogo?.historico ?? []}
          tipoHistorico="sync"
        />
        <JobCard
          titulo="Importação de Pedidos Veiling"
          descricao="Importa pedidos do Veiling automaticamente às 18h"
          icon={<ShoppingCart className="h-5 w-5" />}
          status={jobs?.veilingImportacaoPedidos?.ultimoStatus}
          rodando={jobs?.veilingImportacaoPedidos?.rodando ?? false}
          ultimaSync={jobs?.veilingImportacaoPedidos?.ultimaSync}
          proximaSync={jobs?.veilingImportacaoPedidos?.proximaSync}
          historico={jobs?.veilingImportacaoPedidos?.historico ?? []}
          tipoHistorico="importacao"
        />
      </div>

      {/* Legenda */}
      <div className="rounded-lg border bg-muted/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Legenda</p>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            Sucesso — última execução concluída sem erros
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 text-red-600" />
            Falha — última execução terminou com erro
          </span>
          <span className="flex items-center gap-1">
            <Loader2 className="h-3.5 w-3.5 text-blue-600" />
            Executando — job em andamento agora
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Aguardando — ainda não executou desde o último reinício
          </span>
        </div>
      </div>
    </div>
  );
}
