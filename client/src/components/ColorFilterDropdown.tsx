import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface ColorFilterDropdownProps {
  cores: string[];
  filtroCores: string[];
  onFilterChange: (cores: string[]) => void;
  corEmoji?: Record<string, string>;
}

export function ColorFilterDropdown({
  cores,
  filtroCores,
  onFilterChange,
  corEmoji = {},
}: ColorFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleCor = (cor: string) => {
    const novosFiltros = filtroCores.includes(cor)
      ? filtroCores.filter(c => c !== cor)
      : [...filtroCores, cor];
    onFilterChange(novosFiltros);
  };

  const handleLimparFiltro = () => {
    onFilterChange([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 px-2.5 rounded border text-xs transition-colors font-medium flex items-center gap-1.5 whitespace-nowrap ${
          filtroCores.length > 0
            ? "border-blue-400 bg-blue-100 text-blue-700"
            : "border-border bg-background hover:bg-muted"
        }`}
        title={filtroCores.length > 0 ? `${filtroCores.length} cor(es) selecionada(s)` : "Filtrar por cor"}
      >
        🎨 Cor
        {filtroCores.length > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-blue-500 text-white rounded-full">
            {filtroCores.length}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-background border border-border rounded-lg shadow-lg p-2 min-w-[200px]">
          {/* Botão Limpar */}
          <button
            onClick={handleLimparFiltro}
            className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-muted transition-colors mb-1.5 border-b border-border pb-1.5"
          >
            🎨 Todas as cores
          </button>

          {/* Lista de cores */}
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {cores.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-2">
                Nenhuma cor disponível
              </div>
            ) : (
              cores.map((cor) => (
                <label
                  key={cor}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted transition-colors cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={filtroCores.includes(cor)}
                    onChange={() => handleToggleCor(cor)}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <span>{corEmoji[cor] ?? "●"}</span>
                  <span className="flex-1">{cor}</span>
                  {filtroCores.includes(cor) && (
                    <span className="text-blue-600 font-bold">✓</span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
