import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,   // não refetch ao trocar de aba
      refetchOnReconnect: false,     // não refetch ao reconectar
      staleTime: 30_000,             // dados válidos por 30s antes de refetch
      retry: 1,                      // apenas 1 retry em caso de erro
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Não redirecionar em rotas públicas (catálogo, orçamento, conferência QR)
  const publicRoutes = ['/catalogo-veiling-cliente', '/catalogo-veiling/', '/orcamento/', '/conferencia-qrcode/', '/catalogo/', '/rastreamento/'];
  const isPublicRoute = publicRoutes.some(route => window.location.pathname.startsWith(route));
  
  if (isPublicRoute) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// Suprimir aviso do Radix UI sobre DialogTitle
const originalError = console.error;
console.error = (...args: any[]) => {
  if (args[0]?.includes?.('DialogContent') && args[0]?.includes?.('DialogTitle')) {
    return; // Suprimir aviso específico
  }
  originalError(...args);
};

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
