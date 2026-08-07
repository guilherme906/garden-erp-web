/**
 * LembretesWidget
 * Widget completo de lembretes para a tela inicial do ERP.
 * Funcionalidades:
 * - Listar lembretes do usuário (pendentes, disparados, lidos)
 * - Criar / editar / excluir lembretes
 * - Vincular lembrete a orçamento ou cliente específico
 * - Agente de notificação integrado (polling + browser notification)
 * - Filtros por status
 * - Suporte a recorrência (diária, semanal, mensal)
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Bell, BellRing, Plus, Pencil, Trash2, Check,
  Clock, RefreshCw, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, Calendar, Repeat, BellOff, Volume2,
  Link2, ShoppingCart, User, X,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLembretesAgent } from "@/hooks/useLembretesAgent";

type Prioridade = "BAIXA" | "MEDIA" | "ALTA";
type Recorrencia = "NENHUMA" | "DIARIA" | "SEMANAL" | "MENSAL";
type Status = "PENDENTE" | "DISPARADO" | "LIDO" | "CANCELADO";

interface LembreteForm {
  titulo: string;
  descricao: string;
  dataHora: string;
  recorrencia: Recorrencia;
  prioridade: Prioridade;
  vinculoTipo: "NENHUM" | "ORCAMENTO" | "CLIENTE";
  vinculoOrcamentoId?: number;
  vinculoOrcamentoNum?: string;
  vinculoClienteNome?: string;
}

const FORM_DEFAULT: LembreteForm = {
  titulo: "",
  descricao: "",
  dataHora: "",
  recorrencia: "NENHUMA",
  prioridade: "MEDIA",
  vinculoTipo: "NENHUM",
};

function toDatetimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(s: string): number {
  return new Date(s).getTime();
}

function formatDataHora(ms: number): string {
  return new Date(ms).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function prioColor(p: Prioridade) {
  if (p === "ALTA") return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400";
  if (p === "MEDIA") return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400";
  return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400";
}

function prioLabel(p: Prioridade) {
  if (p === "ALTA") return "Alta";
  if (p === "MEDIA") return "Média";
  return "Baixa";
}

function recLabel(r: Recorrencia) {
  if (r === "DIARIA") return "Diária";
  if (r === "SEMANAL") return "Semanal";
  if (r === "MENSAL") return "Mensal";
  return "Sem recorrência";
}

function statusIcon(s: Status) {
  if (s === "DISPARADO") return <BellRing className="h-3.5 w-3.5 text-orange-500" />;
  if (s === "LIDO") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  return <Clock className="h-3.5 w-3.5 text-blue-500" />;
}

// ─── Componente de busca de orçamentos ───
function OrcamentoBusca({ onSelect }: { onSelect: (id: number, num: string, cliente: string) => void }) {
  const [busca, setBusca] = useState("");
  const { data: abertos = [] } = trpc.vendas.listAbertos.useQuery();

  const filtrados = useMemo(() => {
    if (!busca.trim()) return abertos.slice(0, 8);
    const q = busca.toLowerCase();
    return (abertos as any[]).filter((v: any) =>
      String(v.numero).includes(q) ||
      (v.clienteNome || "").toLowerCase().includes(q)
    ).slice(0, 8);
  }, [abertos, busca]);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Buscar por número ou cliente..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="h-8 text-sm"
        autoFocus
      />
      <div className="max-h-40 overflow-y-auto space-y-1">
        {(filtrados as any[]).length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Nenhum orçamento aberto encontrado.</p>
        ) : (
          (filtrados as any[]).map((v: any) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id, `#${v.numero}`, v.clienteNome || "(sem cliente)")}
              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20 text-xs flex items-center gap-2 border border-transparent hover:border-orange-200 dark:hover:border-orange-800 transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5 text-orange-500 shrink-0" />
              <span className="font-mono font-semibold text-orange-600">#{v.numero}</span>
              <span className="text-muted-foreground truncate">{v.clienteNome || "(sem cliente)"}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Componente de busca de clientes ───
function ClienteBusca({ onSelect }: { onSelect: (nome: string) => void }) {
  const [busca, setBusca] = useState("");
  const { data: clientes = [] } = trpc.clientes.list.useQuery({ search: busca || undefined });

  const filtrados = useMemo(() => (clientes as any[]).slice(0, 8), [clientes]);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Buscar cliente..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="h-8 text-sm"
        autoFocus
      />
      <div className="max-h-40 overflow-y-auto space-y-1">
        {filtrados.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Nenhum cliente encontrado.</p>
        ) : (
          filtrados.map((c: any) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.nome)}
              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs flex items-center gap-2 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
            >
              <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span className="truncate">{c.nome}</span>
              {c.telefone && <span className="text-muted-foreground shrink-0">{c.telefone}</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Widget principal ───
export interface LembreteCreateInput {
  titulo: string;
  descricao?: string;
  dataHora: number;
  recorrencia?: Recorrencia;
  prioridade?: Prioridade;
  vinculoOrcamentoId?: number;
  vinculoOrcamentoNum?: string;
  vinculoClienteNome?: string;
}

export default function LembretesWidget({ initialOpen = false, initialForm }: {
  initialOpen?: boolean;
  initialForm?: Partial<LembreteCreateInput>;
}) {
  const [aberto, setAberto] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<LembreteForm>(FORM_DEFAULT);
  const [filtroStatus, setFiltroStatus] = useState<"TODOS" | Status>("TODOS");
  const [notifPermissao, setNotifPermissao] = useState<NotificationPermission | "unsupported">("default");
  const [showOrcamentoBusca, setShowOrcamentoBusca] = useState(false);
  const [showClienteBusca, setShowClienteBusca] = useState(false);

  const utils = trpc.useUtils();

  // Agente de notificação
  const { disparados, requestPermission, limparDisparado, limparTodos } = useLembretesAgent(true);

  // Abrir widget quando o agente dispara evento
  useEffect(() => {
    const handler = () => setAberto(true);
    window.addEventListener("abrir-lembretes", handler);
    return () => window.removeEventListener("abrir-lembretes", handler);
  }, []);

  // Abrir modal com formulário pré-preenchido (chamado pelo OrcamentoSidePanel)
  useEffect(() => {
    if (initialOpen && initialForm) {
      const daqui1h = new Date(Date.now() + 3_600_000);
      const pad = (n: number) => String(n).padStart(2, "0");
      const dt = `${daqui1h.getFullYear()}-${pad(daqui1h.getMonth() + 1)}-${pad(daqui1h.getDate())}T${pad(daqui1h.getHours())}:${pad(daqui1h.getMinutes())}`;
      setForm({
        ...FORM_DEFAULT,
        titulo: initialForm.titulo || "",
        descricao: initialForm.descricao || "",
        dataHora: dt,
        recorrencia: initialForm.recorrencia || "NENHUMA",
        prioridade: initialForm.prioridade || "MEDIA",
        vinculoTipo: initialForm.vinculoOrcamentoId ? "ORCAMENTO" : initialForm.vinculoClienteNome ? "CLIENTE" : "NENHUM",
        vinculoOrcamentoId: initialForm.vinculoOrcamentoId,
        vinculoOrcamentoNum: initialForm.vinculoOrcamentoNum,
        vinculoClienteNome: initialForm.vinculoClienteNome,
      });
      setEditandoId(null);
      setModalAberto(true);
    }
  }, [initialOpen, initialForm]);

  // Verificar permissão de notificação
  useEffect(() => {
    if (typeof Notification === "undefined") {
      setNotifPermissao("unsupported");
    } else {
      setNotifPermissao(Notification.permission);
    }
  }, []);

  const { data: lembretes = [], isLoading, refetch } = trpc.lembretes.list.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const createMut = trpc.lembretes.create.useMutation({
    onSuccess: () => {
      toast.success("Lembrete criado!");
      setModalAberto(false);
      setForm(FORM_DEFAULT);
      utils.lembretes.list.invalidate();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const updateMut = trpc.lembretes.update.useMutation({
    onSuccess: () => {
      toast.success("Lembrete atualizado!");
      setModalAberto(false);
      setEditandoId(null);
      setForm(FORM_DEFAULT);
      utils.lembretes.list.invalidate();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const deleteMut = trpc.lembretes.delete.useMutation({
    onSuccess: () => {
      toast.success("Lembrete removido.");
      utils.lembretes.list.invalidate();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const marcarLidoMut = trpc.lembretes.marcarLido.useMutation({
    onSuccess: () => utils.lembretes.list.invalidate(),
    onError: (e) => toast.error("Erro: " + e.message),
  });

  function abrirCriar(prefill?: Partial<LembreteForm>) {
    setEditandoId(null);
    const daqui1h = new Date(Date.now() + 3_600_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dt = `${daqui1h.getFullYear()}-${pad(daqui1h.getMonth() + 1)}-${pad(daqui1h.getDate())}T${pad(daqui1h.getHours())}:${pad(daqui1h.getMinutes())}`;
    setForm({ ...FORM_DEFAULT, dataHora: dt, ...prefill });
    setShowOrcamentoBusca(false);
    setShowClienteBusca(false);
    setModalAberto(true);
  }

  function abrirEditar(l: any) {
    setEditandoId(l.id);
    setForm({
      titulo: l.titulo,
      descricao: l.descricao || "",
      dataHora: toDatetimeLocal(l.dataHora),
      recorrencia: l.recorrencia as Recorrencia,
      prioridade: l.prioridade as Prioridade,
      vinculoTipo: l.vinculoOrcamentoId ? "ORCAMENTO" : l.vinculoClienteNome ? "CLIENTE" : "NENHUM",
      vinculoOrcamentoId: l.vinculoOrcamentoId || undefined,
      vinculoOrcamentoNum: l.vinculoOrcamentoNum || undefined,
      vinculoClienteNome: l.vinculoClienteNome || undefined,
    });
    setShowOrcamentoBusca(false);
    setShowClienteBusca(false);
    setModalAberto(true);
  }

  function salvar() {
    if (!form.titulo.trim()) { toast.error("Informe o título do lembrete."); return; }
    if (!form.dataHora) { toast.error("Informe a data e hora."); return; }
    const dataHora = fromDatetimeLocal(form.dataHora);
    const vinculo = form.vinculoTipo === "ORCAMENTO"
      ? { vinculoOrcamentoId: form.vinculoOrcamentoId, vinculoOrcamentoNum: form.vinculoOrcamentoNum, vinculoClienteNome: undefined }
      : form.vinculoTipo === "CLIENTE"
        ? { vinculoOrcamentoId: undefined, vinculoOrcamentoNum: undefined, vinculoClienteNome: form.vinculoClienteNome }
        : { vinculoOrcamentoId: undefined, vinculoOrcamentoNum: undefined, vinculoClienteNome: undefined };

    if (editandoId) {
      updateMut.mutate({
        id: editandoId,
        titulo: form.titulo,
        descricao: form.descricao || undefined,
        dataHora,
        recorrencia: form.recorrencia,
        prioridade: form.prioridade,
        status: "PENDENTE",
        ...vinculo,
      });
    } else {
      createMut.mutate({
        titulo: form.titulo,
        descricao: form.descricao || undefined,
        dataHora,
        recorrencia: form.recorrencia,
        prioridade: form.prioridade,
        ...vinculo,
      });
    }
  }

  function mudarVinculoTipo(tipo: LembreteForm["vinculoTipo"]) {
    setForm(f => ({ ...f, vinculoTipo: tipo, vinculoOrcamentoId: undefined, vinculoOrcamentoNum: undefined, vinculoClienteNome: undefined }));
    setShowOrcamentoBusca(tipo === "ORCAMENTO");
    setShowClienteBusca(tipo === "CLIENTE");
  }

  async function pedirPermissao() {
    await requestPermission();
    if (typeof Notification !== "undefined") {
      setNotifPermissao(Notification.permission);
    }
  }

  // Filtrar lembretes
  const lembretesFiltrados = (lembretes as any[]).filter((l: any) => {
    if (filtroStatus === "TODOS") return true;
    return l.status === filtroStatus;
  });

  // Contadores
  const qtdPendentes = (lembretes as any[]).filter((l: any) => l.status === "PENDENTE").length;
  const qtdDisparados = (lembretes as any[]).filter((l: any) => l.status === "DISPARADO").length;
  const qtdAlerta = qtdDisparados + disparados.length;

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <>
      {/* Widget compacto / expandido */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border shadow-sm overflow-hidden">
        {/* Header do widget */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors select-none"
          onClick={() => setAberto(!aberto)}
        >
          <div className="relative">
            {qtdAlerta > 0 ? (
              <BellRing className="h-5 w-5 text-orange-500 animate-pulse" />
            ) : (
              <Bell className="h-5 w-5 text-muted-foreground" />
            )}
            {qtdAlerta > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {qtdAlerta > 9 ? "9+" : qtdAlerta}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Meus Lembretes</p>
            <p className="text-[11px] text-muted-foreground">
              {qtdPendentes} pendente{qtdPendentes !== 1 ? "s" : ""}
              {qtdDisparados > 0 && ` · ${qtdDisparados} para ler`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 px-2"
              onClick={(e) => { e.stopPropagation(); abrirCriar(); }}
            >
              <Plus className="h-3.5 w-3.5" />
              Novo
            </Button>
            {aberto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Conteúdo expandido */}
        {aberto && (
          <div className="border-t">
            {/* Banner de lembretes disparados */}
            {disparados.length > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 px-4 py-2">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                    <BellRing className="h-3.5 w-3.5" />
                    {disparados.length} lembrete{disparados.length !== 1 ? "s" : ""} disparado{disparados.length !== 1 ? "s" : ""}!
                  </p>
                  <button onClick={limparTodos} className="text-[10px] text-orange-600 hover:underline">
                    Limpar todos
                  </button>
                </div>
                <div className="space-y-1">
                  {disparados.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-md px-2 py-1.5 border border-orange-200 dark:border-orange-700">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${prioColor(d.prioridade)}`}>
                        {prioLabel(d.prioridade)}
                      </span>
                      <p className="flex-1 text-xs font-medium truncate">{d.titulo}</p>
                      <button
                        onClick={() => { limparDisparado(d.id); marcarLidoMut.mutate({ id: d.id }); }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Barra de permissão de notificação */}
            {notifPermissao === "default" && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-2 flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300 flex-1">
                  Ative notificações do browser para receber alertas mesmo com a aba minimizada.
                </p>
                <Button size="sm" variant="outline" className="h-6 text-[11px] px-2 border-blue-300 text-blue-700" onClick={pedirPermissao}>
                  Ativar
                </Button>
              </div>
            )}
            {notifPermissao === "denied" && (
              <div className="bg-gray-50 dark:bg-zinc-800 border-b px-4 py-1.5 flex items-center gap-1.5">
                <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">Notificações do browser bloqueadas. Ative nas configurações do navegador.</p>
              </div>
            )}

            {/* Filtros */}
            <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50 dark:bg-white/5">
              {(["TODOS", "PENDENTE", "DISPARADO", "LIDO"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    filtroStatus === s
                      ? "bg-orange-500 text-white border-orange-500"
                      : "border-gray-200 dark:border-white/10 text-muted-foreground hover:border-gray-300"
                  }`}
                >
                  {s === "TODOS" ? "Todos" : s === "PENDENTE" ? "Pendentes" : s === "DISPARADO" ? "Para ler" : "Lidos"}
                </button>
              ))}
              <div className="flex-1" />
              <button onClick={() => refetch()} className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Lista de lembretes */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-20 gap-2 text-muted-foreground text-xs">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : lembretesFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 gap-2 text-muted-foreground text-xs">
                  <Bell className="h-8 w-8 opacity-20" />
                  <p>Nenhum lembrete {filtroStatus !== "TODOS" ? "neste filtro" : "cadastrado"}.</p>
                  <button onClick={() => abrirCriar()} className="text-orange-600 hover:underline text-[11px]">
                    + Criar primeiro lembrete
                  </button>
                </div>
              ) : (
                <div className="divide-y">
                  {lembretesFiltrados.map((l: any) => {
                    const vencido = l.status === "PENDENTE" && l.dataHora < Date.now();
                    return (
                      <div
                        key={l.id}
                        className={`group flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                          l.status === "LIDO" ? "opacity-60" : ""
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">{statusIcon(l.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-sm font-medium leading-tight ${l.status === "LIDO" ? "line-through" : ""}`}>
                              {l.titulo}
                            </p>
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${prioColor(l.prioridade)}`}>
                              {prioLabel(l.prioridade)}
                            </span>
                            {l.recorrencia !== "NENHUMA" && (
                              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                <Repeat className="h-2.5 w-2.5" /> {recLabel(l.recorrencia)}
                              </span>
                            )}
                          </div>
                          {l.descricao && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{l.descricao}</p>
                          )}
                          {/* Vínculo */}
                          {(l.vinculoOrcamentoNum || l.vinculoClienteNome) && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Link2 className="h-3 w-3 text-muted-foreground" />
                              {l.vinculoOrcamentoNum && (
                                <span className="text-[11px] text-orange-600 font-mono font-semibold">
                                  {l.vinculoOrcamentoNum}
                                  {l.vinculoClienteNome && ` · ${l.vinculoClienteNome}`}
                                </span>
                              )}
                              {!l.vinculoOrcamentoNum && l.vinculoClienteNome && (
                                <span className="text-[11px] text-blue-600">{l.vinculoClienteNome}</span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className={`text-[11px] ${vencido ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                              {formatDataHora(l.dataHora)}
                              {vencido && " · Vencido!"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {l.status !== "LIDO" && (
                            <button
                              onClick={() => marcarLidoMut.mutate({ id: l.id })}
                              className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600"
                              title="Marcar como lido"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => abrirEditar(l)}
                            className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteMut.mutate({ id: l.id })}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Rodapé */}
            <div className="border-t px-4 py-2 flex items-center justify-between bg-gray-50 dark:bg-white/5">
              <p className="text-[11px] text-muted-foreground">
                {(lembretes as any[]).length} lembrete{(lembretes as any[]).length !== 1 ? "s" : ""} no total
              </p>
              <Button size="sm" className="h-7 text-xs gap-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => abrirCriar()}>
                <Plus className="h-3.5 w-3.5" />
                Novo lembrete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de criação / edição */}
      <Dialog open={modalAberto} onOpenChange={(v) => {
        setModalAberto(v);
        if (!v) { setEditandoId(null); setForm(FORM_DEFAULT); setShowOrcamentoBusca(false); setShowClienteBusca(false); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              {editandoId ? "Editar Lembrete" : "Novo Lembrete"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Título */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Título *</label>
              <Input
                placeholder="Ex: Ligar para cliente João"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                maxLength={255}
                autoFocus
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Descrição (opcional)</label>
              <Textarea
                placeholder="Detalhes do lembrete..."
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Data e hora */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Data e Hora *</label>
              <Input
                type="datetime-local"
                value={form.dataHora}
                onChange={(e) => setForm({ ...form, dataHora: e.target.value })}
              />
            </div>

            {/* Prioridade e Recorrência */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Prioridade</label>
                <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v as Prioridade })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXA">🟢 Baixa</SelectItem>
                    <SelectItem value="MEDIA">🟡 Média</SelectItem>
                    <SelectItem value="ALTA">🔴 Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Recorrência</label>
                <Select value={form.recorrencia} onValueChange={(v) => setForm({ ...form, recorrencia: v as Recorrencia })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NENHUMA">Sem recorrência</SelectItem>
                    <SelectItem value="DIARIA">Diária</SelectItem>
                    <SelectItem value="SEMANAL">Semanal</SelectItem>
                    <SelectItem value="MENSAL">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Vínculo */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block flex items-center gap-1.5">
                <Link2 className="h-3 w-3" /> Vincular a (opcional)
              </label>
              <div className="flex gap-2 mb-2">
                {(["NENHUM", "ORCAMENTO", "CLIENTE"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => mudarVinculoTipo(tipo)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                      form.vinculoTipo === tipo
                        ? tipo === "ORCAMENTO" ? "bg-orange-500 text-white border-orange-500"
                          : tipo === "CLIENTE" ? "bg-blue-500 text-white border-blue-500"
                          : "bg-gray-200 dark:bg-zinc-700 text-foreground border-gray-300 dark:border-zinc-600"
                        : "border-gray-200 dark:border-white/10 text-muted-foreground hover:border-gray-300"
                    }`}
                  >
                    {tipo === "ORCAMENTO" && <ShoppingCart className="h-3 w-3" />}
                    {tipo === "CLIENTE" && <User className="h-3 w-3" />}
                    {tipo === "NENHUM" ? "Nenhum" : tipo === "ORCAMENTO" ? "Orçamento" : "Cliente"}
                  </button>
                ))}
              </div>

              {/* Selecionado atual */}
              {form.vinculoTipo === "ORCAMENTO" && form.vinculoOrcamentoNum && (
                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-md px-3 py-1.5 mb-2">
                  <ShoppingCart className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-sm font-mono font-semibold text-orange-600">{form.vinculoOrcamentoNum}</span>
                  {form.vinculoClienteNome && <span className="text-xs text-muted-foreground">— {form.vinculoClienteNome}</span>}
                  <button type="button" onClick={() => setForm(f => ({ ...f, vinculoOrcamentoId: undefined, vinculoOrcamentoNum: undefined }))} className="ml-auto text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {form.vinculoTipo === "CLIENTE" && form.vinculoClienteNome && (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-1.5 mb-2">
                  <User className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-sm text-blue-700">{form.vinculoClienteNome}</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, vinculoClienteNome: undefined }))} className="ml-auto text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Busca de orçamento */}
              {form.vinculoTipo === "ORCAMENTO" && showOrcamentoBusca && (
                <div className="border rounded-md p-3 bg-gray-50 dark:bg-zinc-800">
                  <OrcamentoBusca onSelect={(id, num, cliente) => {
                    setForm(f => ({ ...f, vinculoOrcamentoId: id, vinculoOrcamentoNum: num, vinculoClienteNome: cliente }));
                    setShowOrcamentoBusca(false);
                  }} />
                </div>
              )}
              {form.vinculoTipo === "ORCAMENTO" && !showOrcamentoBusca && !form.vinculoOrcamentoNum && (
                <button type="button" onClick={() => setShowOrcamentoBusca(true)} className="text-xs text-orange-600 hover:underline flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3" /> Selecionar orçamento...
                </button>
              )}

              {/* Busca de cliente */}
              {form.vinculoTipo === "CLIENTE" && showClienteBusca && (
                <div className="border rounded-md p-3 bg-gray-50 dark:bg-zinc-800">
                  <ClienteBusca onSelect={(nome) => {
                    setForm(f => ({ ...f, vinculoClienteNome: nome }));
                    setShowClienteBusca(false);
                  }} />
                </div>
              )}
              {form.vinculoTipo === "CLIENTE" && !showClienteBusca && !form.vinculoClienteNome && (
                <button type="button" onClick={() => setShowClienteBusca(true)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <User className="h-3 w-3" /> Selecionar cliente...
                </button>
              )}
            </div>

            {form.recorrencia !== "NENHUMA" && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2 flex items-start gap-2">
                <Repeat className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Este lembrete se repetirá automaticamente de forma <strong>{recLabel(form.recorrencia).toLowerCase()}</strong> após ser disparado.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalAberto(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
              onClick={salvar}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              {editandoId ? "Salvar alterações" : "Criar lembrete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
