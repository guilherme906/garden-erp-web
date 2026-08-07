import { useState, useCallback } from "react";
import { useSearchParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package, CheckCircle2, AlertTriangle, Loader2, Lock,
  Hash, User, Calendar, MapPin, ArrowLeft, ClipboardCheck,
  ChevronDown, ChevronUp, Truck, Share2,
} from "lucide-react";
import { toast } from "sonner";

const SENHA_ACESSO = "1203";

type ConferenciaTipo = "separacao" | "entrega";

export default function RastreamentoPedido() {
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get("id");
  const [autenticado, setAutenticado] = useState(false);
  const [senhaInput, setSenhaInput] = useState("");
  const [senhaErro, setSenhaErro] = useState(false);
  const [view, setView] = useState<"menu" | "pedido" | "conferencia">("menu");
  const [conferenciaTipo, setConferenciaTipo] = useState<ConferenciaTipo>("separacao");
  const [nomeConferente, setNomeConferente] = useState("");
  const [qtdConferidas, setQtdConferidas] = useState<Record<number, string>>({});
  const [salvando, setSalvando] = useState(false);

  const numericId = pedidoId ? parseInt(pedidoId, 10) : NaN;

  const { data, isLoading, refetch } = trpc.rastreamento.getVenda.useQuery(
    { id: numericId },
    { enabled: autenticado && !isNaN(numericId) }
  );

  const salvarMut = trpc.rastreamento.salvarConferencia.useMutation();
  const salvarMut2 = trpc.rastreamento.salvarConferencia2.useMutation();

  const handleSenha = useCallback(() => {
    if (senhaInput === SENHA_ACESSO) {
      setAutenticado(true);
      setSenhaErro(false);
    } else {
      setSenhaErro(true);
      toast.error("Senha incorreta!");
    }
  }, [senhaInput]);

  const handleSenhaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSenha();
  };

  const iniciarConferencia = (tipo: ConferenciaTipo) => {
    if (!data?.venda?.itens) return;
    setConferenciaTipo(tipo);
    setQtdConferidas({});
    setNomeConferente("");
    setView("conferencia");
  };

  const algumItemPreenchido = Object.values(qtdConferidas).some((v) => v !== "" && v !== undefined);

  const handleSalvarConferencia = async () => {
    if (!data?.venda || !nomeConferente.trim()) {
      toast.error("Informe o nome do conferente");
      return;
    }
    setSalvando(true);
    try {
      const itensConferidos = (data.venda.itens || []).map((item: any) => ({
        itemId: item.id,
        qtdConferida: qtdConferidas[item.id] || "0",
      }));
      if (conferenciaTipo === "separacao") {
        await salvarMut.mutateAsync({
          vendaId: data.venda.id,
          itens: itensConferidos,
          conferidoPor: nomeConferente.trim(),
        });
      } else {
        await salvarMut2.mutateAsync({
          vendaId: data.venda.id,
          itens: itensConferidos,
          conferidoPor: nomeConferente.trim(),
        });
      }
      const label = conferenciaTipo === "separacao" ? "Separação" : "Entrega";
      toast.success(`${label} do pedido #${data.venda.id} conferida com sucesso!`);
      refetch();
      setView("menu");
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const getDivergencia = (qtdOriginal: string, qtdConf: string) => {
    const orig = parseFloat(qtdOriginal || "0");
    const conf = parseFloat(qtdConf || "0");
    if (conf === orig) return null;
    return conf - orig;
  };

  // Verificar se conferência está OK (sem divergências)
  const conferenciaSemDivergencias = (itens: any[], tipo: ConferenciaTipo) => {
    if (!itens || itens.length === 0) return false;
    const campo = tipo === "separacao" ? "qtdConferida" : "qtdConferida2";
    return itens.every((item: any) => {
      const qtdConf = item[campo];
      return qtdConf !== null && qtdConf !== undefined && qtdConf === item.quantidade;
    });
  };

  // Compartilhar pelo WhatsApp
  const compartilharWhatsApp = () => {
    if (!data?.venda) return;
    const v = data.venda;
    let msg = `*Pedido #${v.id} - Garden Primavera*\n`;
    msg += `Cliente: ${v.clienteNome || "-"}\n`;
    msg += `Data: ${v.data}\n`;
    msg += `Logística: ${v.logistica || "RETIRADA"}\n\n`;
    msg += `*Itens:*\n`;
    v.itens?.forEach((item: any, idx: number) => {
      msg += `${idx + 1}. ${item.produtoNome} - Qtd: ${Number(item.quantidade).toFixed(0)} - R$ ${Number(item.subtotal).toFixed(2)}\n`;
    });
    msg += `\n*Total: R$ ${Number(v.total).toFixed(2)}*\n`;
    msg += `\n✅ Conferência OK`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // ═══ Erro: sem ID ═══
  if (!pedidoId || isNaN(numericId)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-muted-foreground">Pedido não encontrado. QR code inválido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══ Tela de Senha ═══
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center pb-2">
            <div className="h-14 w-14 rounded-xl bg-green-600 flex items-center justify-center mx-auto mb-3">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-xl text-green-700">Acesso Restrito</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Pedido #{pedidoId}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-gray-600">
              Digite a senha para acessar as funções do pedido
            </p>
            <Input
              type="password"
              placeholder="Senha de acesso"
              value={senhaInput}
              onChange={(e) => { setSenhaInput(e.target.value); setSenhaErro(false); }}
              onKeyDown={handleSenhaKeyDown}
              className={`text-center text-lg h-12 ${senhaErro ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              autoFocus
            />
            {senhaErro && (
              <p className="text-center text-sm text-red-500 font-medium">Senha incorreta. Tente novamente.</p>
            )}
            <Button
              onClick={handleSenha}
              className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
            >
              <Lock className="h-5 w-5 mr-2" /> Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══ Loading ═══
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  // ═══ Pedido não encontrado ═══
  if (!data?.found || !data.venda) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Pedido Não Encontrado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-muted-foreground">O pedido #{pedidoId} não existe no sistema.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const v = data.venda;
  const statusColor = v.status === "APROVADO" ? "bg-green-100 text-green-800" : v.status === "CANCELADO" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800";

  const conf1Ok = v.conferido === 1;
  const conf2Ok = v.conferido2 === 1;
  const conf1SemDiv = conferenciaSemDivergencias(v.itens || [], "separacao");
  const conf2SemDiv = conferenciaSemDivergencias(v.itens || [], "entrega");

  // ═══ Menu Principal ═══
  if (view === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="h-12 w-12 rounded-lg bg-green-600 flex items-center justify-center mx-auto mb-2">
              <Package className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl text-green-700">Pedido #{v.id}</CardTitle>
            <p className="text-sm text-muted-foreground">{v.clienteNome || "Sem cliente"}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 ${statusColor}`}>{v.status}</span>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {/* Status das conferências */}
            <div className="space-y-2">
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${conf1Ok ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                <ClipboardCheck className={`h-5 w-5 ${conf1Ok ? "text-green-600" : "text-gray-400"}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${conf1Ok ? "text-green-700" : "text-gray-600"}`}>
                    1ª Conferência (Separação)
                  </p>
                  {conf1Ok && v.conferidoPor && (
                    <p className="text-xs text-green-600">
                      por {v.conferidoPor} {v.conferidoEm ? `em ${new Date(v.conferidoEm).toLocaleString("pt-BR")}` : ""}
                    </p>
                  )}
                </div>
                {conf1Ok ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <span className="text-xs text-gray-400">Pendente</span>}
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg border ${conf2Ok ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                <Truck className={`h-5 w-5 ${conf2Ok ? "text-blue-600" : "text-gray-400"}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${conf2Ok ? "text-blue-700" : "text-gray-600"}`}>
                    2ª Conferência (Entrega)
                  </p>
                  {conf2Ok && v.conferidoPor2 && (
                    <p className="text-xs text-blue-600">
                      por {v.conferidoPor2} {v.conferidoEm2 ? `em ${new Date(v.conferidoEm2).toLocaleString("pt-BR")}` : ""}
                    </p>
                  )}
                </div>
                {conf2Ok ? <CheckCircle2 className="h-5 w-5 text-blue-600" /> : <span className="text-xs text-gray-400">Pendente</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-medium">Total</p>
                <p className="font-bold text-green-700 text-lg">R$ {Number(v.total).toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gray-500 uppercase font-medium">Itens</p>
                <p className="font-bold text-gray-800 text-lg">{v.itens?.length || 0}</p>
              </div>
            </div>

            <Button
              onClick={() => setView("pedido")}
              className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
            >
              <Package className="h-5 w-5 mr-2" />
              Visualizar Pedido
            </Button>

            <Button
              onClick={() => iniciarConferencia("separacao")}
              variant="outline"
              className="w-full h-12 text-base border-green-300 text-green-700 hover:bg-green-50"
            >
              <ClipboardCheck className="h-5 w-5 mr-2" />
              {conf1Ok ? "Reconferir Separação" : "1ª Conferência (Separação)"}
            </Button>

            <Button
              onClick={() => iniciarConferencia("entrega")}
              variant="outline"
              className="w-full h-12 text-base border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Truck className="h-5 w-5 mr-2" />
              {conf2Ok ? "Reconferir Entrega" : "2ª Conferência (Entrega)"}
            </Button>

            {/* Botão WhatsApp - aparece quando pelo menos uma conferência está OK */}
            {(conf1Ok && conf1SemDiv) || (conf2Ok && conf2SemDiv) ? (
              <Button
                onClick={compartilharWhatsApp}
                className="w-full h-12 text-base bg-[#25D366] hover:bg-[#20BD5A] text-white"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Compartilhar pelo WhatsApp
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══ Visualizar Pedido ═══
  if (view === "pedido") {
    return (
      <div className="min-h-screen bg-gray-50 py-4 px-3">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663539257200/nE9aRDyk9G49cwSdfYmqny/LOGOPRINCIPAL-POSITIVA-HORIZONTAL_21b11a41.webp" alt="Garden Center Primavera" className="h-10 object-contain" />
                <div>
                  <p className="text-xs text-gray-500">Pedido de Venda</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>{v.status}</span>
            </div>
          </div>

          {/* Dados do pedido */}
          <div className="bg-white border-x border-gray-200 p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-start gap-2">
                <Hash className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">Pedido</p>
                  <p className="text-sm font-bold text-gray-800">#{v.id}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">Cliente</p>
                  <p className="text-sm font-semibold text-gray-800">{v.clienteNome || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">Data</p>
                  <p className="text-sm text-gray-800">{v.data}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">Logística</p>
                  <p className="text-sm text-gray-800">{v.logistica || "RETIRADA"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de itens */}
          <div className="bg-white border-x border-gray-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="bg-green-600 text-white">
                  <th className="text-left px-4 py-2 font-medium">Produto</th>
                  <th className="text-right px-4 py-2 font-medium">Qtd</th>
                  <th className="text-right px-4 py-2 font-medium">Vlr Unit.</th>
                  <th className="text-right px-4 py-2 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {v.itens?.map((item: any, idx: number) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2 text-gray-800">{item.produtoNome}</td>
                    <td className="text-right px-4 py-2 text-gray-700">{Number(item.quantidade).toFixed(2)}</td>
                    <td className="text-right px-4 py-2 text-gray-700">R$ {Number(item.valorUnitario).toFixed(2)}</td>
                    <td className="text-right px-4 py-2 font-medium text-gray-800">R$ {Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="bg-green-600 rounded-b-xl shadow-sm p-4 flex items-center justify-between">
            <span className="text-white font-medium text-sm">TOTAL DO PEDIDO</span>
            <span className="text-white font-bold text-xl">R$ {Number(v.total).toFixed(2)}</span>
          </div>

          {/* Botão voltar */}
          <div className="mt-4">
            <Button onClick={() => setView("menu")} variant="outline" className="w-full h-11">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ Conferência (Separação ou Entrega) ═══
  if (view === "conferencia") {
    const isSeparacao = conferenciaTipo === "separacao";
    const label = isSeparacao ? "Separação" : "Entrega";
    const color = isSeparacao ? "green" : "blue";
    const confAtual = isSeparacao ? v.conferido : v.conferido2;
    const confPor = isSeparacao ? v.conferidoPor : v.conferidoPor2;
    const confEm = isSeparacao ? v.conferidoEm : v.conferidoEm2;

    return (
      <div className="min-h-screen bg-gray-50 py-4 px-3">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3 mb-3">
              {isSeparacao ? (
                <ClipboardCheck className={`h-6 w-6 text-${color}-700`} />
              ) : (
                <Truck className={`h-6 w-6 text-${color}-700`} />
              )}
              <h1 className="text-xl font-bold text-gray-800">
                {label} - Pedido #{v.id}
              </h1>
            </div>
            <p className="text-sm text-gray-500">{v.clienteNome || "Sem cliente"} | {v.data}</p>

            <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold ${isSeparacao ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
              {isSeparacao ? "1ª Conferência" : "2ª Conferência"}
            </div>

            {confAtual === 1 && confPor && (
              <div className={`flex items-center gap-2 mt-3 p-3 ${isSeparacao ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"} border rounded-lg`}>
                <CheckCircle2 className={`h-5 w-5 ${isSeparacao ? "text-green-600" : "text-blue-600"}`} />
                <span className={`text-sm ${isSeparacao ? "text-green-700" : "text-blue-700"}`}>
                  Conferido por <strong>{confPor}</strong>
                  {confEm && ` em ${new Date(confEm).toLocaleString("pt-BR")}`}
                </span>
              </div>
            )}

            {/* Nome do conferente */}
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Nome do Conferente *</label>
              <Input
                placeholder="Digite seu nome"
                value={nomeConferente}
                onChange={(e) => setNomeConferente(e.target.value)}
                className="h-11 text-base"
              />
            </div>
          </div>

          {/* Tabela de itens */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-3 py-2.5 font-semibold">#</th>
                    <th className="px-3 py-2.5 font-semibold">Produto</th>
                    {algumItemPreenchido && <th className="px-3 py-2.5 font-semibold text-center">Qtd Esperada</th>}
                    <th className="px-3 py-2.5 font-semibold text-center">Qtd Contada</th>
                    {algumItemPreenchido && <th className="px-3 py-2.5 font-semibold text-center">Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {v.itens?.map((item: any, idx: number) => {
                    const qtdConf = qtdConferidas[item.id] || "";
                    const itemPreenchido = qtdConf !== "" && qtdConf !== undefined;
                    const div = itemPreenchido ? getDivergencia(item.quantidade, qtdConf) : null;
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-medium">{item.produtoNome}</td>
                        {algumItemPreenchido && (
                          <td className="px-3 py-2.5 text-center font-mono">
                            {parseFloat(item.quantidade).toFixed(0)}
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-center">
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="—"
                            value={qtdConferidas[item.id] ?? ""}
                            onChange={(e) => setQtdConferidas((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            className="w-24 mx-auto text-center font-mono h-9"
                          />
                        </td>
                        {algumItemPreenchido && (
                          <td className="px-3 py-2.5 text-center">
                            {!itemPreenchido ? (
                              <span className="text-gray-400">—</span>
                            ) : div === null ? (
                              <span className="text-green-600 font-medium flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-4 w-4" /> OK
                              </span>
                            ) : (
                              <span className={`font-bold flex items-center justify-center gap-1 ${div > 0 ? "text-blue-600" : "text-red-600"}`}>
                                <AlertTriangle className="h-4 w-4" />
                                {div > 0 ? `+${div}` : div}
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="h-10"
              onClick={() => setQtdConferidas({})}
            >
              Limpar Contagem
            </Button>
            <Button
              onClick={handleSalvarConferencia}
              disabled={salvando || !nomeConferente.trim()}
              className={`h-12 text-base ${isSeparacao ? "bg-green-700 hover:bg-green-800" : "bg-blue-700 hover:bg-blue-800"}`}
            >
              {salvando ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : isSeparacao ? (
                <ClipboardCheck className="h-5 w-5 mr-2" />
              ) : (
                <Truck className="h-5 w-5 mr-2" />
              )}
              {confAtual === 1 ? `Reconferir ${label}` : `Confirmar ${label}`}
            </Button>
            <Button onClick={() => setView("menu")} variant="outline" className="h-10">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
