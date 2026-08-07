/**
 * useLembretesAgent
 * Hook que age como um "agente de lembretes":
 * - Faz polling a cada 30s no endpoint pollPendentes
 * - Quando há lembretes pendentes, dispara Notification do browser (se permitido)
 * - Também retorna os lembretes disparados para que a UI mostre um alerta visual
 * - Solicita permissão de notificação na primeira vez que o usuário interage
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export interface LembreteDisparado {
  id: number;
  titulo: string;
  descricao?: string | null;
  prioridade: "BAIXA" | "MEDIA" | "ALTA";
  dataHora: number;
}

export function useLembretesAgent(enabled: boolean) {
  const [disparados, setDisparados] = useState<LembreteDisparado[]>([]);
  const notifiedIds = useRef<Set<number>>(new Set());
  const utils = trpc.useUtils();

  // Solicitar permissão de notificação do browser
  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }, []);

  // Polling a cada 30 segundos
  const { data: pendentes } = trpc.lembretes.pollPendentes.useQuery(undefined, {
    enabled,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (!pendentes || pendentes.length === 0) return;

    const novos = pendentes.filter((l) => !notifiedIds.current.has(l.id));
    if (novos.length === 0) return;

    novos.forEach((l) => {
      notifiedIds.current.add(l.id);

      // Toast visual sempre
      const prioLabel = l.prioridade === "ALTA" ? "🔴" : l.prioridade === "MEDIA" ? "🟡" : "🟢";
      toast(`${prioLabel} ${l.titulo}`, {
        description: l.descricao || "Lembrete agendado",
        duration: 10_000,
        action: {
          label: "Ver",
          onClick: () => {
            // Navegar para a tela inicial onde os lembretes são exibidos
            window.dispatchEvent(new CustomEvent("abrir-lembretes"));
          },
        },
      });

      // Notificação do browser se permitido
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          const n = new Notification(`🌿 Garden ERP — ${l.titulo}`, {
            body: l.descricao || "Você tem um lembrete agendado.",
            icon: "/favicon.ico",
            tag: `lembrete-${l.id}`,
            requireInteraction: l.prioridade === "ALTA",
          });
          n.onclick = () => {
            window.focus();
            window.dispatchEvent(new CustomEvent("abrir-lembretes"));
            n.close();
          };
        } catch {
          // Silenciar erros de notificação
        }
      }
    });

    // Adicionar aos disparados para mostrar no painel
    setDisparados((prev) => {
      const ids = new Set(prev.map((x) => x.id));
      const toAdd = novos.filter((l) => !ids.has(l.id));
      return [...prev, ...toAdd.map((l) => ({
        id: l.id,
        titulo: l.titulo,
        descricao: l.descricao,
        prioridade: l.prioridade as "BAIXA" | "MEDIA" | "ALTA",
        dataHora: l.dataHora,
      }))];
    });

    // Invalidar a lista de lembretes para atualizar o widget
    utils.lembretes.list.invalidate();
  }, [pendentes, utils]);

  const limparDisparado = useCallback((id: number) => {
    setDisparados((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const limparTodos = useCallback(() => {
    setDisparados([]);
  }, []);

  return { disparados, requestPermission, limparDisparado, limparTodos };
}
