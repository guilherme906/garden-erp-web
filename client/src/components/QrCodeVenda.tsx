import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface QrCodeVendaProps {
  vendaId: number;
  clienteNome: string;
  onGenerateToken?: (token: string) => void;
}

export function QrCodeVenda({ vendaId, clienteNome, onGenerateToken }: QrCodeVendaProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [conferenceUrl, setConferenceUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQrCodeMut = trpc.vendas.gerarQrCode.useMutation();

  const handleGenerateQrCode = async () => {
    setIsGenerating(true);
    try {
      const result = await generateQrCodeMut.mutateAsync({ vendaId });
      
      // Gerar URL do QR Code usando API externa
      const conferenceLink = `${window.location.origin}/conferencia-qrcode/${result.token}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(conferenceLink)}`;
      
      setQrCodeUrl(qrUrl);
      setConferenceUrl(conferenceLink);
      
      if (onGenerateToken) {
        onGenerateToken(result.token);
      }
      
      toast.success("QR Code gerado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao gerar QR Code: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (conferenceUrl) {
      navigator.clipboard.writeText(conferenceUrl);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const handleOpenLink = () => {
    if (conferenceUrl) {
      window.open(conferenceUrl, "_blank");
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="gap-2"
      >
        <QrCode className="h-4 w-4" />
        QR Code
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code de Conferência</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cliente */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Cliente</p>
              <p className="font-semibold text-gray-800">{clienteNome}</p>
              <p className="text-xs text-gray-500 mt-2">Pedido #{vendaId}</p>
            </div>

            {/* QR Code */}
            {qrCodeUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="h-64 w-64" />
                </div>

                {/* Link de Conferência */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Link de Conferência:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={conferenceUrl || ""}
                      readOnly
                      className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleOpenLink}
                    className="flex-1 gap-2 bg-green-700 hover:bg-green-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir Link
                  </Button>
                </div>

                {/* Instruções */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                  <p className="font-semibold mb-1">Como usar:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Imprima ou compartilhe o QR Code</li>
                    <li>O entregador escaneia com o celular</li>
                    <li>Abre a tela de conferência automaticamente</li>
                    <li>Confirma a entrega com sua assinatura</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-600">
                  Gere um QR Code único para este pedido. O entregador poderá escanear com o celular para confirmar a entrega.
                </p>
                <Button
                  onClick={handleGenerateQrCode}
                  disabled={isGenerating}
                  className="w-full gap-2 bg-green-700 hover:bg-green-800"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      Gerar QR Code
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
