import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ErpAuthProvider } from "./contexts/ErpAuthContext";
import ErpTabSystem from "./components/ErpTabSystem";

import PedidoPublico from "./pages/PedidoPublico";
import RastreamentoPedido from "./pages/RastreamentoPedido";
import CatalogoPublico from "./pages/CatalogoPublico";
import CatalogoVeilingPublico from "./pages/CatalogoVeilingPublico";
import CatalogoVeilingClientePublico from "./pages/CatalogoVeilingClientePublico";
import OrcamentoPublico from "./pages/OrcamentoPublico";
import RelatorioPublico from "./pages/RelatorioPublico";
import PedidosPublicos from "./pages/PedidosPublicos";
import ListaPrecoPublica from "./pages/ListaPrecoPublica";
import ConferenciaQrCode from "./pages/ConferenciaQrCode";
import GerenciadorProdutosCustomizados from "./pages/GerenciadorProdutosCustomizados";


function App() {
  // Detectar se é um link de rastreamento: /rastreamento?id=:pedidoId
  const path = window.location.pathname;
  const rastreamentoMatch = path.match(/^\/rastreamento$/);

  if (rastreamentoMatch) {
    // Página de rastreamento - não precisa de auth ERP
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <RastreamentoPedido />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Detectar se é um link de conferência por QR Code: /conferencia-qrcode/:token
  const conferenciaQrCodeMatch = path.match(/^\/conferencia-qrcode\/([a-zA-Z0-9_-]+)$/);

  if (conferenciaQrCodeMatch) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <ConferenciaQrCode params={{ token: conferenciaQrCodeMatch[1] }} />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Detectar se é um link de catálogo Veiling cliente público: /catalogo-veiling-cliente
  const catalogoVeilingClienteMatch = path.match(/^\/catalogo-veiling-cliente$/);

  if (catalogoVeilingClienteMatch) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <CatalogoVeilingClientePublico />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Detectar se é um link de catálogo Veiling público: /catalogo-veiling/:token
  const catalogoVeilingMatch = path.match(/^\/catalogo-veiling\/([a-zA-Z0-9_-]+)$/);

  if (catalogoVeilingMatch) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <CatalogoVeilingPublico token={catalogoVeilingMatch[1]} />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Detectar se é um link de catálogo de venda: /catalogo/:token
  const catalogoMatch = path.match(/^\/catalogo\/([a-f0-9]+)$/);

  if (catalogoMatch) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <CatalogoPublico />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Detectar se é um link de orçamento público: /orcamento/:token
  const orcamentoMatch = path.match(/^\/orcamento\/([a-zA-Z0-9_-]+)$/);

  if (orcamentoMatch) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <OrcamentoPublico token={orcamentoMatch[1]} />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Detectar se é um link de relatório financeiro público: /relatorio/:token
  const relatorioMatch = path.match(/^\/relatorio\/([a-zA-Z0-9_-]+)$/);

  if (relatorioMatch) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <RelatorioPublico token={relatorioMatch[1]} />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Detectar se é um link de lista de preços pública: /lista-precos/:token
  const listaPrecoMatch = path.match(/^\/lista-precos\/([a-zA-Z0-9]+)$/);

  if (listaPrecoMatch) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <ListaPrecoPublica token={listaPrecoMatch[1]} />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  // Detectar se é um link de compartilhamento: /pedido/:token
  const shareMatch = path.match(/^\/pedido\/([a-f0-9]+)$/);

  if (shareMatch) {
    // Página pública - não precisa de auth ERP
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <PedidoPublico token={shareMatch[1]} />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <ErpAuthProvider>
            <ErpTabSystem />
          </ErpAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
