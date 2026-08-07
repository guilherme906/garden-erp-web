import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, Upload, AlertCircle, CheckCircle2, AlertTriangle, Search } from "lucide-react";
import * as XLSX from "xlsx";

interface ProdutoExcel {
  id?: number;
  codigo: string;
  nome: string;
  descricao?: string;
  unidade: string;
  departamento: string;
  preco: string | number;
  precoCusto?: string | number;
  estoque: string | number;
  ativo: number | string;
  imagemUrl?: string;
}

interface ExcelImportExportProps {
  produtos: any[];
  departamentos: string[];
  onExportar?: () => void;
  onImportar?: (dados: ProdutoExcel[], validacao: any) => Promise<void>;
  isLoading?: boolean;
}

export function ExcelImportExport({
  produtos,
  departamentos,
  onImportar,
  isLoading = false,
}: ExcelImportExportProps) {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [importedData, setImportedData] = useState<ProdutoExcel[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [importSummary, setImportSummary] = useState<{added: number, updated: number, failed: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Baixar template vazio
  const handleBaixarTemplate = () => {
    try {
      const template = [
        {
          ID: "",
          Código: "",
          Nome: "",
          Descrição: "",
          Unidade: "UN",
          Departamento: departamentos[0] || "",
          "Preço Venda": 0,
          "Preço Custo": 0,
          Estoque: 0,
          Ativo: 1,
          "URL Imagem": "",
        },
      ];
      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Produtos");
      XLSX.writeFile(wb, `template-produtos-loja.xlsx`);
      toast.success("Template baixado com sucesso!");
    } catch (err) {
      toast.error("Erro ao baixar template");
    }
  };

  // Exportar produtos para Excel
  const handleExportar = () => {
    try {
      const dadosExportar = produtos.map(p => ({
        ID: p.id || "",
        Código: p.codigo || "",
        Nome: p.nome,
        Descrição: p.descricao || "",
        Unidade: p.unidade || "UN",
        Departamento: p.departamento || "",
        "Preço Venda": p.preco ? parseFloat(String(p.preco)) : 0,
        "Preço Custo": p.precoCusto ? parseFloat(String(p.precoCusto)) : 0,
        Estoque: p.estoque ? parseFloat(String(p.estoque)) : 0,
        Ativo: p.ativo,
        "URL Imagem": p.imagemUrl || "",
      }));

      const ws = XLSX.utils.json_to_sheet(dadosExportar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Produtos");
      XLSX.writeFile(wb, `produtos-loja-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Produtos exportados com sucesso!");
    } catch (err) {
      toast.error("Erro ao exportar produtos");
    }
  };

  // Validar dados importados
  const validarDados = (dados: any[]): { erros: any[], avisos: any[], validos: ProdutoExcel[] } => {
    const erros: any[] = [];
    const avisos: any[] = [];
    const validos: ProdutoExcel[] = [];

    dados.forEach((item, idx) => {
      const linha = idx + 2;
      const errosLinha: string[] = [];
      const avisosLinha: string[] = [];

      // Validações obrigatórias
      if (!item.Nome || !String(item.Nome).trim()) {
        errosLinha.push("Nome é obrigatório");
      }
      if (!item.Departamento) {
        errosLinha.push("Departamento é obrigatório");
      } else if (!departamentos.includes(String(item.Departamento))) {
        avisosLinha.push(`Departamento "${item.Departamento}" não encontrado`);
      }

      // Validar tipos
      if (item["Preço Venda"] !== undefined && item["Preço Venda"] !== "") {
        const preco = parseFloat(String(item["Preço Venda"]));
        if (isNaN(preco)) errosLinha.push("Preço Venda deve ser um número");
      }
      if (item.Estoque !== undefined && item.Estoque !== "") {
        const estoque = parseFloat(String(item.Estoque));
        if (isNaN(estoque)) errosLinha.push("Estoque deve ser um número");
      }

      if (errosLinha.length > 0) {
        erros.push({ linha, erros: errosLinha });
      } else {
        validos.push({
          id: item.ID ? parseInt(String(item.ID)) : undefined,
          codigo: String(item.Código || ""),
          nome: String(item.Nome).trim(),
          descricao: item.Descrição ? String(item.Descrição) : undefined,
          unidade: String(item.Unidade || "UN"),
          departamento: String(item.Departamento),
          preco: parseFloat(String(item["Preço Venda"] || 0)),
          precoCusto: item["Preço Custo"] ? parseFloat(String(item["Preço Custo"])) : undefined,
          estoque: parseFloat(String(item.Estoque || 0)),
          ativo: item.Ativo ? 1 : 0,
          imagemUrl: item["URL Imagem"] ? String(item["URL Imagem"]) : undefined,
        });
      }

      if (avisosLinha.length > 0) {
        avisos.push({ linha, avisos: avisosLinha });
      }
    });

    return { erros, avisos, validos };
  };

  // Processar arquivo importado
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error("Arquivo vazio");
          return;
        }

        const { erros, avisos, validos } = validarDados(jsonData);
        setValidationErrors(erros);
        setValidationWarnings(avisos);
        setImportedData(validos);
        setSearchFilter("");
        setShowImportDialog(false);
        setShowValidationDialog(true);
      } catch (err) {
        toast.error("Erro ao ler arquivo");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Confirmar importação
  const handleConfirmarImportacao = async () => {
    if (!onImportar) return;
    setIsProcessing(true);
    try {
      await onImportar(importedData, { erros: validationErrors, avisos: validationWarnings });
      setShowValidationDialog(false);
      setImportedData([]);
      setValidationErrors([]);
      setValidationWarnings([]);
      setSearchFilter("");
      toast.success(`${importedData.length} produto(s) importado(s) com sucesso!`);
    } catch (error) {
      console.error("Erro ao confirmar importação:", error);
      toast.error("Erro ao importar produtos");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtrar dados para preview
  const filteredData = importedData.filter(item =>
    item.nome.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.codigo.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Paginação
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Reset página ao filtrar
  const handleSearchChange = (value: string) => {
    setSearchFilter(value);
    setCurrentPage(1);
  };

  return (
    <>
      {/* Botões de ação */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-xs"
          onClick={handleBaixarTemplate}
          title="Baixar planilha modelo vazia para preenchimento"
        >
          <Download className="h-3.5 w-3.5" />
          Template
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-xs"
          onClick={handleExportar}
          title="Baixar planilha com todos os produtos"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1 text-xs"
          onClick={() => setShowImportDialog(true)}
          title="Carregar planilha com novos produtos ou alterações"
        >
          <Upload className="h-3.5 w-3.5" />
          Importar
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {/* Dialog de importação */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Produtos</DialogTitle>
            <DialogDescription>
              Selecione um arquivo Excel (.xlsx, .xls ou .csv) com os produtos para importar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-muted transition-colors"
              onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Clique para selecionar arquivo</p>
              <p className="text-xs text-muted-foreground">ou arraste aqui</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-3 text-xs text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-1">Dica:</p>
              <p>Baixe o template para ter a estrutura correta. Você pode editar preços, estoque e adicionar novos produtos.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
              Selecionar Arquivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de validação */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Validação de Importação</DialogTitle>
            <DialogDescription>
              Revise os dados antes de confirmar a importação em massa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Erros */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="font-medium text-red-700 dark:text-red-400">
                    {validationErrors.length} erro(s) encontrado(s)
                  </p>
                </div>
                <ul className="space-y-1 text-xs text-red-600 dark:text-red-400">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>
                      <strong>Linha {err.linha}:</strong> {err.erros.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Avisos */}
            {validationWarnings.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    {validationWarnings.length} aviso(s)
                  </p>
                </div>
                <ul className="space-y-1 text-xs text-yellow-600 dark:text-yellow-400">
                  {validationWarnings.map((warn, idx) => (
                    <li key={idx}>
                      <strong>Linha {warn.linha}:</strong> {warn.avisos.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sucesso */}
            {validationErrors.length === 0 && importedData.length > 0 && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {importedData.length} produto(s) pronto(s) para importar
                  </p>
                </div>
              </div>
            )}

            {/* Campo de busca */}
            {importedData.length > 0 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-8 h-8 text-sm"
                  placeholder="Buscar por nome ou código..."
                  value={searchFilter}
                  onChange={e => handleSearchChange(e.target.value)}
                />
              </div>
            )}

            {/* Preview dos dados */}
            {filteredData.length > 0 && (
              <div className="border rounded p-3 max-h-64 overflow-y-auto">
                <p className="text-xs font-medium mb-2">
                  Preview dos dados ({filteredData.length} de {importedData.length}):
                </p>
                <div className="space-y-2 text-xs">
                  {filteredData.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="p-2 bg-muted rounded">
                      <p><strong>{item.nome}</strong> {item.codigo && `(${item.codigo})`} - {item.departamento}</p>
                      <p className="text-muted-foreground">
                        Preço: R$ {typeof item.preco === 'number' ? item.preco.toFixed(2) : parseFloat(String(item.preco)).toFixed(2)} | Estoque: {item.estoque}
                      </p>
                    </div>
                  ))}
                  {filteredData.length > 10 && (
                    <p className="text-muted-foreground text-center py-2">
                      ... e mais {filteredData.length - 10} produto(s)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Barra de progresso */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
                <p className="text-xs text-center text-muted-foreground">Importando {importedData.length} produto(s)...</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidationDialog(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarImportacao}
              disabled={validationErrors.length > 0 || importedData.length === 0 || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Importando..." : "Confirmar Importação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
