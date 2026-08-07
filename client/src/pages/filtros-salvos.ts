// Funções para gerenciar filtros salvos no catálogo Veiling para clientes

export const handleSalvarFiltro = async (
  nomeFiltroSalvar: string,
  filtroCategoria: string,
  filtroProdutor: string,
  filtroCores: string[],
  filtroBusca: string,
  salvarFiltroMutation: any,
  setNomeFiltroSalvar: any,
  setShowSalvarFiltroModal: any,
  refetchFiltrosSalvos: any,
  toast: any
) => {
  if (!nomeFiltroSalvar.trim()) {
    toast.error("Digite um nome para o filtro");
    return;
  }
  
  try {
    await salvarFiltroMutation.mutateAsync({
      nome: nomeFiltroSalvar,
      categoria: filtroCategoria || undefined,
      produtor: filtroProdutor || undefined,
      cores: filtroCores.length > 0 ? filtroCores : undefined,
      busca: filtroBusca || undefined,
    });
    
    toast.success("Filtro salvo com sucesso!");
    setNomeFiltroSalvar("");
    setShowSalvarFiltroModal(false);
    refetchFiltrosSalvos();
  } catch (err) {
    toast.error("Erro ao salvar filtro");
  }
};

export const handleCarregarFiltro = (
  filtro: any,
  setFiltroCategoria: any,
  setFiltroProdutor: any,
  setFiltroCores: any,
  setFiltroBusca: any,
  setBuscaInput: any,
  toast: any
) => {
  setFiltroCategoria(filtro.categoria || "");
  setFiltroProdutor(filtro.produtor || "");
  setFiltroCores(filtro.cores || []);
  setFiltroBusca(filtro.busca || "");
  setBuscaInput(filtro.busca || "");
  setBuscaInput(filtro.busca || "");
  toast.success(`Filtro "${filtro.nome}" carregado!`);
};

export const handleDeletarFiltro = async (
  id: number,
  deletarFiltroMutation: any,
  refetchFiltrosSalvos: any,
  toast: any
) => {
  try {
    await deletarFiltroMutation.mutateAsync({ id });
    toast.success("Filtro deletado com sucesso!");
    refetchFiltrosSalvos();
  } catch (err) {
    toast.error("Erro ao deletar filtro");
  }
};
