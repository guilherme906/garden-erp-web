import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function GerenciamentoClientesWhatsApp() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientes, setSelectedClientes] = useState<number[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mensagem, setMensagem] = useState(
    "Olá! Confira nosso catálogo: {link}"
  );

  // Buscar clientes
  const { data: clientesData, isLoading } = trpc.clientes.list.useQuery({
    search: searchTerm,
  });

  const clientes = clientesData || [];

  // Filtrar clientes com WhatsApp
  const clientesComWhatsApp = useMemo(() => {
    return clientes.filter((c) => c.whatsapp);
  }, [clientes]);

  // Clientes selecionados com WhatsApp
  const clientesSelecionados = useMemo(() => {
    return clientesComWhatsApp.filter((c) => selectedClientes.includes(c.id));
  }, [clientesComWhatsApp, selectedClientes]);

  const toggleCliente = (id: number) => {
    setSelectedClientes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleTodos = () => {
    if (selectedClientes.length === clientesComWhatsApp.length) {
      setSelectedClientes([]);
    } else {
      setSelectedClientes(clientesComWhatsApp.map((c) => c.id));
    }
  };

  // Gerar link de WhatsApp para um cliente
  const gerarLinkWhatsApp = (whatsapp: string) => {
    const texto = encodeURIComponent(mensagem.replace("{link}", ""));
    return `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${texto}`;
  };

  // Copiar números selecionados
  const copiarNumeros = () => {
    const numeros = clientesSelecionados
      .map((c) => c.whatsapp)
      .filter(Boolean)
      .join(", ");

    navigator.clipboard.writeText(numeros);
    setCopiedLink(true);
    toast.success("Números copiados para a área de transferência!");

    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Abrir WhatsApp para todos os selecionados
  const abrirWhatsAppSelecionados = () => {
    if (clientesSelecionados.length === 0) {
      toast.error("Selecione pelo menos um cliente");
      return;
    }

    clientesSelecionados.forEach((cliente, index) => {
      const link = gerarLinkWhatsApp(cliente.whatsapp!);
      setTimeout(() => {
        window.open(link, "_blank");
      }, index * 500); // Abrir com delay para não bloquear
    });

    toast.success(
      `Abrindo WhatsApp para ${clientesSelecionados.length} cliente(s)...`
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Envio WhatsApp</h1>
        <p className="text-gray-600">
          Gerenciar clientes e enviar mensagens via WhatsApp
        </p>
      </div>

      {/* Configuração de Mensagem */}
      <Card className="p-4">
        <h2 className="font-semibold mb-3">Configurar Mensagem</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Mensagem</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="w-full border rounded p-2 text-sm"
              rows={3}
              placeholder="Use {link} para inserir o link do catálogo"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use {"{link}"} para inserir o link do catálogo
            </p>
          </div>
        </div>
      </Card>

      {/* Busca e Filtros */}
      <div className="flex gap-3">
        <Input
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total de Clientes</p>
          <p className="text-2xl font-bold">{clientes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Com WhatsApp</p>
          <p className="text-2xl font-bold">{clientesComWhatsApp.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Selecionados</p>
          <p className="text-2xl font-bold">{selectedClientes.length}</p>
        </Card>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-3">
        <Button
          onClick={abrirWhatsAppSelecionados}
          disabled={selectedClientes.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Abrir WhatsApp ({selectedClientes.length})
        </Button>
        <Button
          onClick={copiarNumeros}
          disabled={selectedClientes.length === 0}
          variant="outline"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Números
            </>
          )}
        </Button>
      </div>

      {/* Tabela de Clientes */}
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">
                  <Checkbox
                    checked={
                      selectedClientes.length === clientesComWhatsApp.length &&
                      clientesComWhatsApp.length > 0
                    }
                    onChange={toggleTodos}
                  />
                </th>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">WhatsApp</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-gray-500">
                    Carregando...
                  </td>
                </tr>
              ) : clientesComWhatsApp.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-gray-500">
                    Nenhum cliente com WhatsApp encontrado
                  </td>
                </tr>
              ) : (
                clientesComWhatsApp.map((cliente) => (
                  <tr key={cliente.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <Checkbox
                        checked={selectedClientes.includes(cliente.id)}
                        onChange={() => toggleCliente(cliente.id)}
                      />
                    </td>
                    <td className="p-3">{cliente.nome}</td>
                    <td className="p-3 font-mono text-sm">
                      {cliente.whatsapp}
                    </td>
                    <td className="p-3 text-sm">{cliente.email || "-"}</td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const link = gerarLinkWhatsApp(cliente.whatsapp!);
                          window.open(link, "_blank");
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
