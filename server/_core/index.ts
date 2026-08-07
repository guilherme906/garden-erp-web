import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { syncProgressEmitter, SYNC_EVENT, SyncProgressEvent } from "../syncProgress";
import { pedidoPublicoEmitter, PEDIDO_PUBLICO_EVENT, NovoPedidoPublicoEvent } from "../pedidoPublicoEmitter";
import * as dbModule from "../db";
import { veilingLogin } from "../veilingApi";
import { iniciarAutoSync, schedulerStatus } from "../autoSync";
import busboy from "busboy";

// Cache de token do Veiling para o proxy de imagens
let veilingTokenCache: { token: string; expiresAt: number } | null = null;
async function getVeilingToken(): Promise<string | null> {
  try {
    if (veilingTokenCache && Date.now() < veilingTokenCache.expiresAt) {
      return veilingTokenCache.token;
    }
    const config = await dbModule.getVeilingConfig();
    if (!config?.usuario || !config?.senha) return null;
    const tokenData = await veilingLogin(config.usuario, config.senha);
    veilingTokenCache = {
      token: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in - 60) * 1000,
    };
    return veilingTokenCache.token;
  } catch {
    return null;
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // SSE endpoint para progresso de sincronização do catálogo Cooperflora
  app.get("/api/cooperflora/sync-stream", (req, res) => {
    const sessionId = (req.query.sessionId as string) || "default";
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    // Enviar último evento conhecido imediatamente (se houver)
    const last = syncProgressEmitter.getLastEvent(sessionId);
    if (last) {
      res.write(`data: ${JSON.stringify(last)}\n\n`);
    }

    const listener = (sid: string, data: SyncProgressEvent) => {
      if (sid === sessionId) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        if (data.phase === "concluido" || data.phase === "erro") {
          syncProgressEmitter.clearSession(sid);
          res.end();
        }
      }
    };

    syncProgressEmitter.on(SYNC_EVENT, listener);

    req.on("close", () => {
      syncProgressEmitter.off(SYNC_EVENT, listener);
    });
  });

  // SSE endpoint para notificações de novos pedidos públicos do catálogo Veiling
  app.get("/api/pedidos-publicos/stream", (req, res) => {
    const since = parseInt((req.query.since as string) || "0", 10);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();
    // Enviar pedidos pendentes desde o último timestamp conhecido
    const pending = pedidoPublicoEmitter.getPending(since);
    for (const p of pending) {
      res.write(`data: ${JSON.stringify(p)}\n\n`);
    }
    // Heartbeat a cada 30s para manter conexão viva
    const heartbeat = setInterval(() => {
      res.write(`:heartbeat\n\n`);
    }, 30000);
    const listener = (data: NovoPedidoPublicoEvent) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    pedidoPublicoEmitter.on(PEDIDO_PUBLICO_EVENT, listener);
    req.on("close", () => {
      clearInterval(heartbeat);
      pedidoPublicoEmitter.off(PEDIDO_PUBLICO_EVENT, listener);
    });
  });

  // Proxy de imagens do Veiling: busca URL assinada fresca via API usando offerId
  app.get("/api/veiling/image", async (req, res) => {
    const offerId = req.query.offerId as string;
    if (!offerId) { res.status(400).send("offerId obrigatório"); return; }
    try {
      const token = await getVeilingToken();
      if (!token) { res.status(503).send("Token Veiling indisponível"); return; }
      const config = await dbModule.getVeilingConfig();
      const customerId = config?.customerId || "987";
      // Buscar a oferta para obter URL de imagem fresca (assinada)
      const offerResp = await fetch(
        `https://backend.veilingonline.com.br/ecommerce/api/Offer?page=1&totalPage=1&customerId=${customerId}&orderBy=AZ&includeGfpImages=false&offerId=${offerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!offerResp.ok) { res.status(404).send("Oferta não encontrada"); return; }
      const offerData = await offerResp.json() as { offers?: Array<{ defaultImage?: string | null }> };
      const imageUrl = offerData.offers?.[0]?.defaultImage;
      if (!imageUrl) { res.status(404).send("Imagem não disponível"); return; }
      // Buscar a imagem e fazer proxy
      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) { res.status(404).send("Imagem expirada"); return; }
      const contentType = imgResp.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=1200"); // 20 min (mesmo tempo da assinatura)
      const buffer = await imgResp.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch {
      res.status(500).send("Erro ao buscar imagem");
    }
  });

  // Proxy de imagens HTTP da tabela de conversão do Veiling (evita mixed-content HTTPS→HTTP)
  app.get("/api/veiling/foto", async (req, res) => {
    const url = req.query.url as string;
    if (!url) { res.status(400).send("url obrigatória"); return; }
    // Validar que é uma URL do servidor de imagens da Cooperflora/Veiling
    if (!url.startsWith("http://cvh-img.brazilsouth.cloudapp.azure.com/")) {
      res.status(403).send("URL não permitida"); return;
    }
    try {
      const imgResp = await fetch(url);
      if (!imgResp.ok) { res.status(404).send("Imagem não encontrada"); return; }
      const contentType = imgResp.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400"); // 24h cache
      const buffer = await imgResp.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch {
      res.status(500).send("Erro ao buscar imagem");
    }
  });

  // Upload de foto de produto da loja
  app.post("/api/upload/produto-loja", async (req, res) => {
    try {
      const { base64, mimeType, fileName } = req.body as { base64: string; mimeType: string; fileName: string };
      if (!base64 || !mimeType) {
        res.status(400).json({ error: "base64 e mimeType são obrigatórios" });
        return;
      }
      const buffer = Buffer.from(base64, "base64");
      const ext = mimeType.split("/")[1] || "jpg";
      const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const safeName = (fileName || "produto").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const fileKey = `produtos-loja/${safeName}-${suffix}.${ext}`;
      const { storagePut } = await import("../storage");
      const { url } = await storagePut(fileKey, buffer, mimeType);
      res.json({ url });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: msg });
    }
  });

  // Upload de foto multipart para produtos customizados
  app.post("/api/upload", async (req, res) => {
    try {
      const bb = busboy({
        headers: req.headers,
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      });

      let fileBuffer: Buffer | null = null;
      let mimeType = "image/jpeg";
      let fileName = "foto";

      bb.on("file", (fieldname: string, file: any, info: any) => {
        const chunks: Buffer[] = [];
        mimeType = info.mimetype || "image/jpeg";
        fileName = info.filename || "foto";

        file.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        file.on("end", () => {
          fileBuffer = Buffer.concat(chunks);
        });

        file.on("error", (err: Error) => {
          res.status(500).json({ error: err.message });
        });
      });

      bb.on("close", async () => {
        try {
          if (!fileBuffer) {
            res.status(400).json({ error: "Nenhum arquivo enviado" });
            return;
          }

          const ext = mimeType.split("/")[1] || "jpg";
          const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          const safeName = (fileName || "produto").replace(/[^a-z0-9]/gi, "_").toLowerCase();
          const fileKey = `produtos-customizados/${safeName}-${suffix}.${ext}`;
          const { storagePut } = await import("../storage");
          const { url } = await storagePut(fileKey, fileBuffer, mimeType);
          res.json({ url });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          res.status(500).json({ error: msg });
        }
      });

      bb.on("error", (err: Error) => {
        res.status(500).json({ error: err.message });
      });

      req.pipe(bb);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: msg });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Endpoint para consultar status do scheduler de auto-sync
  app.get("/api/autosync/status", (_req, res) => {
    res.json({
      cooperflora: {
        ultimaSync: schedulerStatus.cooperflora.ultimaSync,
        proximaSync: schedulerStatus.cooperflora.proximaSync,
        ultimoStatus: schedulerStatus.cooperflora.ultimoStatus,
        rodando: schedulerStatus.cooperflora.rodando,
      },
      veiling: {
        ultimaSync: schedulerStatus.veiling.ultimaSync,
        proximaSync: schedulerStatus.veiling.proximaSync,
        ultimoStatus: schedulerStatus.veiling.ultimoStatus,
        rodando: schedulerStatus.veiling.rodando,
      },
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
    // Iniciar sincronização automática dos catálogos (30s após o servidor estabilizar)
    iniciarAutoSync();
  });
}

startServer().catch(console.error);
