import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, X, ChevronDown, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function BotaoSalvarFiltro({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 gap-1 text-xs"
      onClick={onClick}
    >
      <Heart className="h-3.5 w-3.5" />
      Salvar Filtro
    </Button>
  );
}

export function FiltrosSalvosDropdown({
  filtrosSalvos,
  onCarregar,
  onDeletar,
}: {
  filtrosSalvos: any[];
  onCarregar: (filtro: any) => void;
  onDeletar: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);

  if (filtrosSalvos.length === 0) return null;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 text-xs"
        onClick={() => setOpen((v) => !v)}
      >
        <Heart className="h-3.5 w-3.5" />
        Filtros salvos
        <ChevronDown className="h-3 w-3" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-popover border border-border rounded-lg shadow-lg min-w-[200px] max-w-[280px] overflow-hidden">
            {filtrosSalvos.map((filtro: any) => (
              <div
                key={filtro.id}
                className="flex items-center justify-between px-3 py-2 hover:bg-muted gap-2 group"
              >
                <button
                  className="flex-1 text-left text-xs truncate"
                  onClick={() => { onCarregar(filtro); setOpen(false); }}
                >
                  {filtro.nome}
                </button>
                <button
                  className="shrink-0 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); onDeletar(filtro.id); }}
                  title="Remover filtro"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ModalSalvarFiltro({
  open,
  onOpenChange,
  nomeFiltro,
  onNomeChange,
  onSalvar,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomeFiltro: string;
  onNomeChange: (nome: string) => void;
  onSalvar: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar Filtro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Nome do filtro (ex: Flores Vermelhas - Produtor A)"
            value={nomeFiltro}
            onChange={(e) => onNomeChange(e.target.value)}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Este filtro será salvo com as categorias, produtores, cores e busca
            atuais.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
