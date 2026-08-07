import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useErpAuth } from "@/contexts/ErpAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Download, Upload, Trash2, Loader2, Shield, Database, CloudUpload, History, Lock, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Configuracoes() {
  const { erpUser } = useErpAuth();
  const utils = trpc.useUtils();
  const [confirmZerar, setConfirmZerar] = useState(false);

  const exportMut = trpc.config.exportBackup.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Backup exportado e salvo no S3!");
      }
    },
    onError: () => toast.error("Erro ao exportar backup"),
  });

  const importMut = trpc.config.importBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup importado com sucesso! Dados restaurados.");
      utils.invalidate();
    },
    onError: () => toast.error("Erro ao importar backup"),
  });

  const zerarMut = trpc.config.zerarEstoque.useMutation({
    onSuccess: () => {
      toast.success("Estoque zerado com sucesso!");
      utils.invalidate();
      setConfirmZerar(false);
    },
    onError: () => toast.error("Erro ao zerar estoque"),
  });

  const { data: backupList, isLoading: loadingBackups } = trpc.config.listBackups.useQuery();

  // Senha de desbloqueio de orçamentos expirados
  const { data: senhaInfo, refetch: refetchSenha } = trpc.config.getSenhaDesbloqueio.useQuery();
  const [showSenhaForm, setShowSenhaForm] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const setSenhaMut = trpc.config.setSenhaDesbloqueio.useMutation({
    onSuccess: () => {
      toast.success('Senha de desbloqueio atualizada!');
      setSenhaAtual(''); setNovaSenha(''); setConfirmSenha('');
      setShowSenhaForm(false);
      refetchSenha();
    },
    onError: (e) => toast.error(e.message || 'Erro ao salvar senha'),
  });

  const handleImportFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          const backupData = data.db || data;
          if (!backupData.clientes && !backupData.produtos && !backupData.vendas) {
            toast.error("Arquivo de backup inválido");
            return;
          }
          importMut.mutate({ data });
        } catch {
          toast.error("Arquivo JSON inválido");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground">Configurações</h1>

      {/* Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CloudUpload className="h-5 w-5" /> Backup do Sistema</CardTitle>
          <CardDescription>Exporte todos os dados para um arquivo JSON salvo no armazenamento em nuvem (S3), ou importe um backup anterior para restaurar o sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => exportMut.mutate({ usuarioNome: erpUser?.nome })} disabled={exportMut.isPending}>
              {exportMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Exportar Backup (S3)
            </Button>
            <Button variant="outline" onClick={handleImportFile} disabled={importMut.isPending}>
              {importMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Importar Backup (JSON)
            </Button>
          </div>

          {/* Backup History */}
          {backupList && backupList.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><History className="h-4 w-4" /> Backups Salvos no S3</h4>
              <div className="space-y-2">
                {backupList.map((b: any) => (
                  <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 p-2 bg-muted/30 rounded text-sm">
                    <div className="truncate">
                      <span className="font-mono text-xs">{b.nomeArquivo}</span>
                      <span className="text-muted-foreground ml-2">({b.tamanho})</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{new Date(b.criadoEm).toLocaleString("pt-BR")}</span>
                      {b.url && <Button size="sm" variant="ghost" className="h-8" onClick={() => window.open(b.url, "_blank")}><Download className="h-3 w-3" /></Button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Senha de Desbloqueio de Orçamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-amber-600" /> Senha de Desbloqueio de Orçamentos</CardTitle>
          <CardDescription>Defina a senha necessária para reativar orçamentos que foram expirados automaticamente por vencimento. Sem essa senha configurada, qualquer texto será aceito.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${senhaInfo?.configurada ? 'bg-green-500' : 'bg-amber-400'}`} />
            <span className="text-sm text-gray-600">
              {senhaInfo?.configurada ? 'Senha configurada' : 'Nenhuma senha configurada — qualquer texto desbloqueia'}
            </span>
            <Button variant="outline" size="sm" onClick={() => setShowSenhaForm(!showSenhaForm)}>
              {showSenhaForm ? 'Cancelar' : senhaInfo?.configurada ? 'Alterar Senha' : 'Configurar Senha'}
            </Button>
          </div>
          {showSenhaForm && (
            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
              {senhaInfo?.configurada && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Senha Atual</label>
                  <input
                    type="password"
                    value={senhaAtual}
                    onChange={e => setSenhaAtual(e.target.value)}
                    placeholder="Digite a senha atual"
                    className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Nova Senha (mínimo 4 caracteres)</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmSenha}
                  onChange={e => setConfirmSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              {novaSenha && confirmSenha && novaSenha !== confirmSenha && (
                <p className="text-xs text-red-500">As senhas não coincidem</p>
              )}
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={
                  !novaSenha ||
                  novaSenha.length < 4 ||
                  novaSenha !== confirmSenha ||
                  setSenhaMut.isPending ||
                  (!!senhaInfo?.configurada && !senhaAtual)
                }
                onClick={() => setSenhaMut.mutate({ senhaAtual: senhaAtual || undefined, novaSenha })}
              >
                {setSenhaMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar Senha
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validade de Preços */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Validade de Preços dos Catálogos</CardTitle>
          <CardDescription>Configure quantos dias os preços dos catálogos (Veiling e Cooperflora) são válidos a partir da data de emissão.</CardDescription>
        </CardHeader>
        <CardContent>
          <ValidadePrecosSection />
        </CardContent>
      </Card>

      {/* Manutenção Section */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive"><Shield className="h-5 w-5" /> Manutenção</CardTitle>
          <CardDescription>Operações de manutenção do sistema. Use com cautela.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-destructive">Zerar Estoque</h4>
                <p className="text-sm text-muted-foreground mt-1">Remove todas as entradas de compras, vendas e ajustes de estoque. Os cadastros de clientes, produtos e vendedores serão mantidos.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="mt-3"><Trash2 className="h-4 w-4 mr-2" /> Zerar Estoque</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Primeira Confirmação</AlertDialogTitle>
                      <AlertDialogDescription>Você está prestes a zerar todo o estoque do sistema. Essa ação removerá todas as vendas, compras e movimentações. Deseja continuar?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => setConfirmZerar(true)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim, continuar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={confirmZerar} onOpenChange={setConfirmZerar}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">SEGUNDA CONFIRMAÇÃO - AÇÃO IRREVERSÍVEL</AlertDialogTitle>
                      <AlertDialogDescription>Esta é a última confirmação. Ao prosseguir, TODOS os dados de vendas, compras e movimentações serão permanentemente excluídos. Recomendamos fazer um backup antes. Tem certeza absoluta?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => zerarMut.mutate({ confirmacao: "CONFIRMAR" })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={zerarMut.isPending}>
                        {zerarMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        CONFIRMAR EXCLUSÃO DEFINITIVA
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ValidadePrecosSection() {
  const { data: validadeData, isLoading, refetch } = trpc.config.getValidadePrecos.useQuery();
  const utils = trpc.useUtils();
  
  const setValidadeVeilingMut = trpc.config.setValidadePrecosVeiling.useMutation({
    onSuccess: async (data, variables) => {
      toast.success('Validade do Veiling atualizada!');
      setVeilingDias(variables.dias);
      await utils.config.getValidadePrecos.invalidate();
      await refetch();
    },
    onError: () => toast.error('Erro ao atualizar validade'),
  });
  const setValidadeCooperfloraMut = trpc.config.setValidadePrecosCooperflora.useMutation({
    onSuccess: async (data, variables) => {
      toast.success('Validade da Cooperflora atualizada!');
      setCooperfloraDias(variables.dias);
      await utils.config.getValidadePrecos.invalidate();
      await refetch();
    },
    onError: () => toast.error('Erro ao atualizar validade'),
  });

  const [veilingDias, setVeilingDias] = useState<number | null>(null);
  const [cooperfloraDias, setCooperfloraDias] = useState<number | null>(null);

  // Sincronizar valores quando dados carregam - usar useEffect para evitar estado desatualizado
  useEffect(() => {
    if (validadeData) {
      setVeilingDias(validadeData.veiling);
      setCooperfloraDias(validadeData.cooperflora);
    }
  }, [validadeData]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Veiling */}
        <div className="border rounded-lg p-4 bg-orange-50/50">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Catálogo Veiling</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="365"
              value={veilingDias ?? ''}
              onChange={(e) => setVeilingDias(parseInt(e.target.value) || 7)}
              className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:border-orange-400"
            />
            <span className="text-sm text-gray-600">dias</span>
          </div>
          <Button
            size="sm"
            className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white"
            disabled={setValidadeVeilingMut.isPending || veilingDias === validadeData?.veiling}
            onClick={() => setValidadeVeilingMut.mutate({ dias: veilingDias || 7 })}
          >
            {setValidadeVeilingMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </div>

        {/* Cooperflora */}
        <div className="border rounded-lg p-4 bg-green-50/50">
          <label className="text-sm font-semibold text-gray-700 block mb-2">Catálogo Cooperflora</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="365"
              value={cooperfloraDias ?? ''}
              onChange={(e) => setCooperfloraDias(parseInt(e.target.value) || 7)}
              className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:border-green-400"
            />
            <span className="text-sm text-gray-600">dias</span>
          </div>
          <Button
            size="sm"
            className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white"
            disabled={setValidadeCooperfloraMut.isPending || cooperfloraDias === validadeData?.cooperflora}
            onClick={() => setValidadeCooperfloraMut.mutate({ dias: cooperfloraDias || 7 })}
          >
            {setValidadeCooperfloraMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Estes valores serão exibidos no cabeçalho dos catálogos compartilhados com clientes.</p>
    </div>
  );
}
