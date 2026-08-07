/**
 * FloatingNotes.tsx
 * Botão flutuante de anotações pessoais por usuário.
 * - Botão fixo no canto inferior direito da tela
 * - Painel lateral deslizante com lista de anotações
 * - Cada anotação tem título, conteúdo, cor e opção de fixar
 * - Anotações são privadas por usuário (userId = openId)
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  StickyNote, X, Plus, Trash2, Pin, PinOff, ChevronRight, Loader2, Check, EyeOff, Eye,
} from "lucide-react";

type Cor = "yellow" | "blue" | "green" | "pink" | "purple";

const COR_CONFIG: Record<Cor, { bg: string; border: string; btn: string; label: string }> = {
  yellow: { bg: "bg-yellow-50",   border: "border-yellow-300", btn: "bg-yellow-400 hover:bg-yellow-500", label: "Amarelo" },
  blue:   { bg: "bg-blue-50",     border: "border-blue-300",   btn: "bg-blue-400 hover:bg-blue-500",     label: "Azul"    },
  green:  { bg: "bg-green-50",    border: "border-green-300",  btn: "bg-green-400 hover:bg-green-500",   label: "Verde"   },
  pink:   { bg: "bg-pink-50",     border: "border-pink-300",   btn: "bg-pink-400 hover:bg-pink-500",     label: "Rosa"    },
  purple: { bg: "bg-purple-50",   border: "border-purple-300", btn: "bg-purple-400 hover:bg-purple-500", label: "Roxo"    },
};

function NoteCard({
  nota,
  onDelete,
  onUpdate,
  onTogglePin,
  onToggleAtiva,
}: {
  nota: any;
  onDelete: (id: number) => void;
  onUpdate: (id: number, titulo: string, conteudo: string, cor: Cor) => void;
  onTogglePin: (id: number, fixada: boolean) => void;
  onToggleAtiva: (id: number, ativa: boolean) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(nota.titulo);
  const [conteudo, setConteudo] = useState(nota.conteudo);
  const [cor, setCor] = useState<Cor>(nota.cor as Cor);
  const cfg = COR_CONFIG[cor] || COR_CONFIG.yellow;

  function salvar() {
    onUpdate(nota.id, titulo, conteudo, cor);
    setEditando(false);
  }

  return (
    <div className={`rounded-lg border-2 ${cfg.bg} ${cfg.border} p-3 space-y-2 relative group`}>
      {/* Ações */}
      <div className="flex items-center justify-between gap-1">
        {editando ? (
          <Input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            className="h-7 text-sm font-semibold bg-white/70 border-0 shadow-none px-1 flex-1"
            placeholder="Título..."
            maxLength={100}
          />
        ) : (
          <span
            className="text-sm font-semibold truncate flex-1 cursor-pointer"
            onClick={() => setEditando(true)}
          >
            {nota.titulo || "Sem título"}
          </span>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleAtiva(nota.id, !(nota.ativa === 1 || nota.ativa === true))}
            className={`p-1 rounded hover:bg-black/10 ${nota.ativa === 0 || nota.ativa === false ? 'text-orange-500' : 'text-gray-400'}`}
            title={nota.ativa === 0 || nota.ativa === false ? "Ativar anotação" : "Desativar anotação"}
          >
            {nota.ativa === 0 || nota.ativa === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onTogglePin(nota.id, !nota.fixada)}
            className="p-1 rounded hover:bg-black/10 text-gray-500"
            title={nota.fixada ? "Desafixar" : "Fixar no topo"}
          >
            {nota.fixada ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
          {editando ? (
            <button onClick={salvar} className="p-1 rounded hover:bg-black/10 text-green-600" title="Salvar">
              <Check className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button onClick={() => setEditando(true)} className="p-1 rounded hover:bg-black/10 text-gray-500" title="Editar">
              <StickyNote className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(nota.id)}
            className="p-1 rounded hover:bg-black/10 text-red-500"
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {editando ? (
        <Textarea
          value={conteudo}
          onChange={e => setConteudo(e.target.value)}
          className="text-xs bg-white/70 border-0 shadow-none resize-none min-h-[80px]"
          placeholder="Escreva sua anotação..."
        />
      ) : (
        <p
          className="text-xs text-gray-700 whitespace-pre-wrap cursor-pointer min-h-[40px]"
          onClick={() => setEditando(true)}
        >
          {nota.conteudo || <span className="text-gray-400 italic">Clique para editar...</span>}
        </p>
      )}

      {/* Seletor de cor (só no modo edição) */}
      {editando && (
        <div className="flex gap-1.5 pt-1">
          {(Object.keys(COR_CONFIG) as Cor[]).map(c => (
            <button
              key={c}
              onClick={() => setCor(c)}
              className={`w-5 h-5 rounded-full border-2 ${COR_CONFIG[c].btn} ${cor === c ? "border-gray-700 scale-110" : "border-transparent"} transition-transform`}
              title={COR_CONFIG[c].label}
            />
          ))}
          <span className="ml-auto text-xs text-gray-400">
            {new Date(nota.updatedAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      )}

      {/* Indicador de fixada */}
      {nota.fixada === 1 && !editando && (
        <Pin className="h-3 w-3 text-gray-400 absolute top-2 right-2 opacity-50" />
      )}
      {/* Indicador de desativada */}
      {(nota.ativa === 0 || nota.ativa === false) && (
        <div className="absolute inset-0 rounded-lg bg-gray-100/70 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-gray-400 font-medium bg-white/80 px-2 py-0.5 rounded">Desativada</span>
        </div>
      )}
    </div>
  );
}

export function FloatingNotes() {
  const [aberto, setAberto] = useState(false);
  const utils = trpc.useUtils();

  const { data: notas = [], isLoading } = trpc.anotacoes.list.useQuery(undefined, {
    enabled: aberto,
    refetchOnWindowFocus: false,
  });

  const createMut = trpc.anotacoes.create.useMutation({
    onSuccess: () => utils.anotacoes.list.invalidate(),
    onError: (e) => toast.error("Erro ao criar: " + e.message),
  });

  const updateMut = trpc.anotacoes.update.useMutation({
    onSuccess: () => utils.anotacoes.list.invalidate(),
    onError: (e) => toast.error("Erro ao salvar: " + e.message),
  });

  const deleteMut = trpc.anotacoes.delete.useMutation({
    onSuccess: () => utils.anotacoes.list.invalidate(),
    onError: (e) => toast.error("Erro ao excluir: " + e.message),
  });

  function novaAnotacao() {
    createMut.mutate({ titulo: "Nova anotação", conteudo: "", cor: "yellow" });
  }

  function handleUpdate(id: number, titulo: string, conteudo: string, cor: Cor) {
    updateMut.mutate({ id, titulo, conteudo, cor });
  }

  function handleDelete(id: number) {
    deleteMut.mutate({ id });
  }

  function handleTogglePin(id: number, fixada: boolean) {
    updateMut.mutate({ id, fixada });
  }

  function handleToggleAtiva(id: number, ativa: boolean) {
    updateMut.mutate({ id, ativa });
    toast.success(ativa ? "Anotação ativada" : "Anotação desativada");
  }

  const notasAtivas = notas.filter((n: any) => n.ativa === 1 || n.ativa === true || n.ativa === undefined);
  const notasInativas = notas.filter((n: any) => n.ativa === 0 || n.ativa === false);

  // Fechar ao pressionar Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setAberto(v => !v)}
        className={`
          fixed bottom-6 right-6 z-50
          w-12 h-12 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-200
          ${aberto
            ? "bg-gray-700 hover:bg-gray-800 text-white"
            : "bg-yellow-400 hover:bg-yellow-500 text-yellow-900"}
        `}
        title="Minhas anotações"
      >
        {aberto ? <X className="h-5 w-5" /> : <StickyNote className="h-5 w-5" />}
        {!aberto && notas.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
            {notas.length > 9 ? "9+" : notas.length}
          </span>
        )}
      </button>

      {/* Painel lateral */}
      <div
        className={`
          fixed bottom-0 right-0 z-40
          w-80 max-h-[85vh]
          bg-white dark:bg-gray-900
          border-l border-t border-gray-200 dark:border-gray-700
          rounded-tl-2xl shadow-2xl
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${aberto ? "translate-y-0 translate-x-0" : "translate-y-full"}
        `}
        style={{ bottom: "4.5rem", right: "1.5rem", width: "20rem" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-tl-2xl">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-yellow-600" />
            <span className="font-semibold text-sm">Minhas Anotações</span>
            {notas.length > 0 && (
              <span className="text-xs text-gray-500">({notas.length})</span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-yellow-700 hover:bg-yellow-100"
              onClick={novaAnotacao}
              disabled={createMut.isPending}
              title="Nova anotação"
            >
              {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-gray-500 hover:bg-gray-100"
              onClick={() => setAberto(false)}
              title="Fechar"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Lista de anotações */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : notas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-3">
              <StickyNote className="h-10 w-10 opacity-30" />
              <p className="text-sm text-center">Nenhuma anotação ainda.<br />Clique em + para criar.</p>
              <Button
                size="sm"
                className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
                onClick={novaAnotacao}
                disabled={createMut.isPending}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Nova Anotação
              </Button>
            </div>
          ) : (
            <>
              {notasAtivas.map((nota: any) => (
                <NoteCard
                  key={nota.id}
                  nota={nota}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  onTogglePin={handleTogglePin}
                  onToggleAtiva={handleToggleAtiva}
                />
              ))}
              {notasInativas.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <EyeOff className="h-3 w-3" /> Desativadas ({notasInativas.length})
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  {notasInativas.map((nota: any) => (
                    <div key={nota.id} className="mb-2">
                      <NoteCard
                        nota={nota}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        onTogglePin={handleTogglePin}
                        onToggleAtiva={handleToggleAtiva}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {notas.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-xs text-gray-500 hover:text-gray-700"
              onClick={novaAnotacao}
              disabled={createMut.isPending}
            >
              <Plus className="h-3 w-3 mr-1" /> Nova anotação
            </Button>
          </div>
        )}
      </div>

      {/* Overlay para fechar ao clicar fora */}
      {aberto && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setAberto(false)}
        />
      )}
    </>
  );
}
