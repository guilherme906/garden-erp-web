/**
 * autoSync.ts
 * Scheduler de sincronização automática dos catálogos Cooperflora e Veiling.
 * Roda no servidor a cada 20 minutos, independentemente de o navegador estar aberto.
 */

import * as db from "./db";
import { veilingLogin, veilingGetCategories, veilingGetAllOffers } from "./veilingApi";
import type { InsertVeilingProduto } from "../drizzle/schema";
import * as XLSX from "xlsx";
import { parseVeilingRows, extractFornecedorFromChave } from "../shared/veilingParser";
import { withRetry, isConnectionError } from "./retry";
import { storagePut } from "./storage";
import * as cloudscraper from "cloudscraper";

// ─── Cache de Imagens Veiling ─────────────────────────────────────────────────
/**
 * Faz download de uma imagem temporária do Veiling e re-hospeda no nosso S3.
 * Retorna a URL permanente ou null em caso de falha.
 */
async function cacheVeilingImage(offerId: number, tempUrl: string): Promise<string | null> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(tempUrl, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpeg';
      const key = `veiling-images/${offerId}.${ext}`;
      const { url } = await storagePut(key, buf, contentType);
      return url;
    } catch (e: any) {
      lastError = e;
      if (attempt < 3) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  console.warn(`[AutoSync] Falha ao cachear imagem ${offerId}: ${lastError?.message || 'unknown'}`);
  return null;
}


/**
 * Processa o cache de imagens em lotes para não sobrecarregar a sincronização.
 * Só faz download de imagens que ainda não têm cache permanente.
 * Roda em background (não bloqueia a sincronização principal).
 */
export async function cacheVeilingImages(produtos: Array<{ offerId: number; imagemUrl: string | null }>): Promise<void> {
  const mysql = await import('mysql2/promise');
  const { ENV } = await import('./_core/env');
  const conn = await (mysql as any).createConnection(ENV.databaseUrl);
  try {
    const offerIds = produtos.filter(p => p.imagemUrl).map(p => p.offerId);
    if (offerIds.length === 0) return;
    const placeholders = offerIds.map(() => '?').join(',');
    const [rows] = await conn.execute(
      `SELECT offerId FROM veiling_produtos WHERE offerId IN (${placeholders}) AND (imagemUrlCache IS NULL OR imagemUrlCache = '')`,
      offerIds
    ) as any;
    const semCache = new Set((rows as any[]).map((r: any) => r.offerId));
    const paraCache = produtos.filter(p => p.imagemUrl && semCache.has(p.offerId));
    if (paraCache.length === 0) { console.log('[AutoSync] Imagens Veiling: todas já em cache.'); return; }
    console.log(`[AutoSync] Cacheando ${paraCache.length} imagens Veiling em background...`);
    const LOTE = 10;
    let cached = 0;
    let fallback = 0;
    for (let i = 0; i < paraCache.length; i += LOTE) {
      const lote = paraCache.slice(i, i + LOTE);
      await Promise.all(lote.map(async p => {
        const url = await cacheVeilingImage(p.offerId, p.imagemUrl!);
        if (url) {
          await conn.execute('UPDATE veiling_produtos SET imagemUrlCache = ? WHERE offerId = ?', [url, p.offerId]);
          cached++;
        } else {
          await conn.execute('UPDATE veiling_produtos SET imagemUrlCache = ? WHERE offerId = ?', [p.imagemUrl!, p.offerId]);
          fallback++;
        }
      }));
    }
    console.log(`[AutoSync] Imagens Veiling: ${cached}/${paraCache.length} cacheadas com sucesso, ${fallback} usando fallback temporario.`);
  } finally {
    await conn.end();
  }
}

// Opções padrão de retry para operações de banco de dados
const DB_RETRY_OPTS = {
  maxAttempts: 4,
  baseDelayMs: 1500,
  maxDelayMs: 30_000,
  factor: 2,
  isRetryable: isConnectionError,
};

const INTERVALO_MS = 20 * 60 * 1000; // 20 minutos

// ─── Próximo Dia Útil ──────────────────────────────────────────────────────────
/**
 * Retorna o próximo dia útil (seg-sex) a partir de agora, no fuso America/Sao_Paulo.
 * Formato: dd/MM/yyyy
 */
export function proximoDiaUtil(base?: Date): string {
  // Converte para horário de São Paulo (UTC-3)
  const SP_OFFSET_MS = -3 * 60 * 60 * 1000;
  const now = base ?? new Date();
  const spMs = now.getTime() + (now.getTimezoneOffset() * 60000) + SP_OFFSET_MS;
  const sp = new Date(spMs);
  // Avança 1 dia
  sp.setDate(sp.getDate() + 1);
  // Pula sábado (6) e domingo (0)
  while (sp.getDay() === 0 || sp.getDay() === 6) {
    sp.setDate(sp.getDate() + 1);
  }
  const dd = String(sp.getDate()).padStart(2, '0');
  const mm = String(sp.getMonth() + 1).padStart(2, '0');
  const yyyy = sp.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ─── Job: atualizar dataCarregamento do Veiling às 18h ─────────────────────────
function msAteProximas18hSP(): number {
  const SP_OFFSET_MS = -3 * 60 * 60 * 1000;
  const now = new Date();
  const spMs = now.getTime() + (now.getTimezoneOffset() * 60000) + SP_OFFSET_MS;
  const sp = new Date(spMs);
  const alvo = new Date(spMs);
  alvo.setHours(18, 0, 0, 0);
  if (alvo.getTime() <= sp.getTime()) {
    // Já passou das 18h hoje — agenda para amanhã
    alvo.setDate(alvo.getDate() + 1);
  }
  return alvo.getTime() - sp.getTime();
}

function agendarJobDataCarregamento(): void {
  function disparar() {
    const novaData = proximoDiaUtil();
    // Atualiza Veiling
    db.saveVeilingConfig({ dataCarregamento: novaData })
      .then(() => console.log(`[AutoSync] Data de carregamento Veiling atualizada para ${novaData}`))
      .catch(e => console.error('[AutoSync] Erro ao atualizar data de carregamento Veiling:', e.message));
    // Atualiza Cooperflora
    db.upsertCooperfloraConfig({ dataCarregamento: novaData })
      .then(() => console.log(`[AutoSync] Data de carregamento Cooperflora atualizada para ${novaData}`))
      .catch(e => console.error('[AutoSync] Erro ao atualizar data de carregamento Cooperflora:', e.message));
    // Reagenda para as próximas 18h (aprox. 24h)
    setTimeout(disparar, msAteProximas18hSP() + 60000); // +1min de margem
  }
  const delay = msAteProximas18hSP();
  const horas = Math.floor(delay / 3600000);
  const mins = Math.floor((delay % 3600000) / 60000);
  console.log(`[AutoSync] Job data carregamento Veiling+Cooperflora: próxima execução em ${horas}h${mins}m (às 18h SP)`);
  setTimeout(disparar, delay);
}

// Estado do scheduler (consultável via tRPC)
export const schedulerStatus = {
  cooperflora: {
    ultimaSync: null as Date | null,
    proximaSync: null as Date | null,
    ultimoStatus: null as "SUCESSO" | "FALHA" | null,
    rodando: false,
  },
  veiling: {
    ultimaSync: null as Date | null,
    proximaSync: null as Date | null,
    ultimoStatus: null as "SUCESSO" | "FALHA" | null,
    rodando: false,
  },
  importacaoPedidos: {
    ultimaSync: null as Date | null,
    proximaSync: null as Date | null,
    ultimoStatus: null as "SUCESSO" | "FALHA" | null,
    rodando: false,
  },
};

// ─── Sincronização Veiling ───────────────────────────────────────────────────
export async function executarSyncVeiling(): Promise<void> {
  if (schedulerStatus.veiling.rodando) {
    console.log("[AutoSync] Veiling já está sincronizando, pulando...");
    return;
  }
  schedulerStatus.veiling.rodando = true;
  const inicio = Date.now();
  console.log("[AutoSync] Iniciando sincronização automática do Veiling...");
  try {
    const cfg = await withRetry(
      () => db.getVeilingConfig(),
      { ...DB_RETRY_OPTS, label: "[AutoSync Veiling] getVeilingConfig" }
    );
    if (!cfg || !cfg.usuario || !cfg.senha) {
      console.log("[AutoSync] Veiling: credenciais não configuradas, pulando.");
      schedulerStatus.veiling.rodando = false;
      return;
    }
    const tokenData = await veilingLogin(cfg.usuario, cfg.senha);
    const token = tokenData.access_token;
    const categorias = await veilingGetCategories(token);
    const todasOfertas = await veilingGetAllOffers(token, cfg.customerId);
    // Preservar status LKP_RECEPCIONADO dos produtos já recepcionados (GFP com entrega)
    const recepcionadosIds = await withRetry(
      () => db.getVeilingStatusRecepcionados(),
      { ...DB_RETRY_OPTS, label: "[AutoSync Veiling] getVeilingStatusRecepcionados" }
    );
    const catMapById = new Map<number, string>(categorias.map(c => [c.id, c.description]));
    const catMapByCode = new Map<string, string>(categorias.map(c => [c.code, c.description]));
    const catMapByCodeTrimmed = new Map<string, string>(categorias.map(c => [String(parseInt(c.code, 10)), c.description]));
    const inseridos: InsertVeilingProduto[] = todasOfertas.map(o => {
      const catId = Number(o.productCategory) || 0;
      const catNome = o.productCategoryDescription
        || catMapById.get(catId)
        || catMapByCode.get(o.productCategory)
        || catMapByCodeTrimmed.get(o.productCategory)
        || '';
      return {
        offerId: o.offerId,
        nome: o.name,
        nomeCompleto: o.longName || o.name,
        categoria: catNome,
        categoriaId: catId,
        produtor: o.siteName || o.producerName || '',
        qualidade: o.quality || '',
        dimensao: o.dimension || '',
        embalagem: o.packagingName || '',
        precoCarrinho: o.trolleyPrice != null ? String(o.trolleyPrice) : null,
        precoCamada: o.layerPrice != null ? String(o.layerPrice) : null,
        precoEmbalagem: o.packagingPrice != null ? String(o.packagingPrice) : null,
        estoqueDisponivel: o.availableStock || 0,
        tipoOferta: o.offerType || '',
        dataValidade: o.endDate ? o.endDate.substring(0, 10) : null,
        imagemUrl: o.defaultImage || null,
        frete: (() => {
          // Prioridade 1: shippingFeeFilials (frete por filial, mais preciso)
          const filialFrete = o.shippingFeeFilials?.[0]?.productShippingValue;
          if (filialFrete != null && filialFrete > 0) return String(filialFrete);
          // Prioridade 2: shippingFee direto
          if (o.shippingFee != null && o.shippingFee > 0) return String(o.shippingFee);
          // Prioridade 3: siteDeliveryPatterns
          const patternFrete = o.siteDeliveryPatterns?.[0]?.freightValue;
          if (patternFrete != null && patternFrete > 0) return String(patternFrete);
          return null;
        })(),
        multiplo: o.packings?.[0]?.minimumQuantity || 1,
        compraMinima: 1,
        cor: (o.colors && o.colors !== 'N/A') ? String(o.colors) : '',
        // Status do produto derivado do offerType
        // offerType=2 (ENP: estoque no produtor); qualquer outro valor (1, 3, vazio) = LKP_SITIO
        statusProduto: String(o.offerType).trim() === '2' ? 'ENP' : 'LKP_SITIO',
      };
    });
    const total = await withRetry(
      () => db.upsertVeilingProdutos(inseridos, recepcionadosIds),
      { ...DB_RETRY_OPTS, label: "[AutoSync Veiling] upsertVeilingProdutos" }
    );
    // Extrair e atualizar observações de GFPs na tabela veilingConversao
    // Limite de tempo: 5 minutos máximo para não travar a sincronização
    console.log('[AutoSync] Extraindo observações de GFPs para atualizar veilingConversao...');
    try {
      const { veilingGetGfpByOffer } = await import('./veilingApi');
      const LOTE_GFP = 30; // Aumentado para 30 para paralelismo
      const MAX_GFP_TIME = 20 * 60 * 1000; // 20 minutos
      const gfpStartTime = Date.now();
      let atualizadas = 0;
      let puladas = 0;
      // Processar GFPs em paralelo com limite de concorrência
      const MAX_CONCURRENT = 5; // 5 lotes simultâneos
      for (let i = 0; i < todasOfertas.length; i += LOTE_GFP * MAX_CONCURRENT) {
        // Verificar se excedeu tempo máximo
        if (Date.now() - gfpStartTime > MAX_GFP_TIME) {
          console.log(`[AutoSync] Limite de tempo de GFP atingido (20min). Pulando ${todasOfertas.length - i} produtos restantes.`);
          puladas = todasOfertas.length - i;
          break;
        }
        const megaLote = todasOfertas.slice(i, i + LOTE_GFP * MAX_CONCURRENT);
        const progressPercent = Math.round((i / todasOfertas.length) * 100);
        console.log(`[AutoSync] GFP: ${i}/${todasOfertas.length} (${progressPercent}%)`);
        // Processar em paralelo (5 lotes de 30 = 150 produtos simultâneos)
        await Promise.all(megaLote.map(async (oferta) => {
          try {
            const gfps = await Promise.race([
              veilingGetGfpByOffer(
                token,
                oferta.offerId,
                parseInt(oferta.offerType || '1'),
                oferta.packings?.[0]?.id || 0,
                oferta.endDate || new Date().toISOString()
              ),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout GFP')), 10000))
            ]) as any;
            if (gfps && Array.isArray(gfps) && gfps.length > 0) {
              const gfp = gfps[0];
              const qualidade = gfp.quality || '';
              const observacao = [gfp.qualityObservation1, gfp.qualityObservation2, gfp.observation]
                .filter(Boolean)
                .join(' - ') || null;
              const nomeCompleto = oferta.longName || oferta.name;
              await db.updateVeilingConversaoObservacoes(nomeCompleto, qualidade, observacao);
              atualizadas++;
            }
          } catch (e) {
            // Silenciosamente ignorar erros de GFP
          }
        }));
        // Sem delay entre lotes para acelerar
      }
      console.log(`[AutoSync] Observações de GFPs atualizadas: ${atualizadas}/${todasOfertas.length - puladas} (${puladas} puladas por timeout)`);
    } catch (e: any) {
      console.warn('[AutoSync] Erro ao extrair observações de GFPs:', e.message);
    }
    await withRetry(
      () => db.saveVeilingConfig({ ultimaAtualizacao: new Date() }),
      { ...DB_RETRY_OPTS, label: "[AutoSync Veiling] saveVeilingConfig" }
    );
    // Atualizar catálogos de venda: remover produtos sem estoque e atualizar preços
    try {
      const catalogoSync = await db.syncCatalogosVendaAposSync('veiling');
      if (catalogoSync.removidos > 0 || catalogoSync.atualizados > 0) {
        console.log(`[AutoSync] Catálogos Veiling: ${catalogoSync.removidos} itens removidos, ${catalogoSync.atualizados} preços atualizados`);
      }
    } catch (e: any) {
      console.warn('[AutoSync] Erro ao sincronizar catálogos Veiling:', e.message);
    }
    // Cache de imagens em background: re-hospedar fotos temporárias do Veiling no S3 permanente
    // Não aguarda conclusão para não atrasar a sincronização principal
    cacheVeilingImages(inseridos.map(p => ({ offerId: p.offerId, imagemUrl: p.imagemUrl ?? null })))
      .catch(e => console.warn('[AutoSync] Erro ao cachear imagens Veiling:', e.message));
    const msg = `AutoSync: ${total} ofertas carregadas.`;
    await withRetry(
      () => db.registrarSyncHistorico({ fonte: 'VEILING', status: 'SUCESSO', total, mensagem: msg, duracaoMs: Date.now() - inicio }),
      { ...DB_RETRY_OPTS, label: "[AutoSync Veiling] registrarSyncHistorico" }
    );
    schedulerStatus.veiling.ultimaSync = new Date();
    schedulerStatus.veiling.ultimoStatus = "SUCESSO";
    console.log(`[AutoSync] Veiling concluído: ${total} ofertas em ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
  } catch (err: any) {
    const msg = `AutoSync falhou: ${err?.message || 'erro desconhecido'}`;
    console.error("[AutoSync] Veiling erro:", msg);
    await withRetry(
      () => db.registrarSyncHistorico({ fonte: 'VEILING', status: 'FALHA', total: 0, mensagem: msg, duracaoMs: Date.now() - inicio }),
      { ...DB_RETRY_OPTS, label: "[AutoSync Veiling] registrarSyncHistorico FALHA", maxAttempts: 3 }
    ).catch(() => {});
    schedulerStatus.veiling.ultimaSync = new Date();
    schedulerStatus.veiling.ultimoStatus = "FALHA";
  } finally {
    schedulerStatus.veiling.rodando = false;
  }
}

// ─── Sincronização Cooperflora ───────────────────────────────────────────────
export async function executarSyncCooperflora(): Promise<void> {
  if (schedulerStatus.cooperflora.rodando) {
    console.log("[AutoSync] Cooperflora já está sincronizando, pulando...");
    return;
  }
  schedulerStatus.cooperflora.rodando = true;
  const inicio = Date.now();
  console.log("[AutoSync] Iniciando sincronização automática da Cooperflora...");
  try {
    const config = await withRetry(
      () => db.getCooperfloraConfig(),
      { ...DB_RETRY_OPTS, label: "[AutoSync Cooperflora] getCooperfloraConfig" }
    );
    if (!config || !config.login || !config.senha) {
      console.log("[AutoSync] Cooperflora: credenciais não configuradas, pulando.");
      schedulerStatus.cooperflora.rodando = false;
      return;
    }
    const dataCarregamento = config.dataCarregamento;
    if (!dataCarregamento) {
      console.log("[AutoSync] Cooperflora: data de carregamento não configurada, pulando.");
      schedulerStatus.cooperflora.rodando = false;
      return;
    }

    const https = await import('https');
    const http = await import('http');

    const fetchRaw = (url: string, options: any, timeoutMs = 15000): Promise<{status: number, headers: any, body: string}> => {
      return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const lib = urlObj.protocol === 'https:' ? https : http;
        const reqOptions: any = {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: options.method || 'GET',
          headers: options.headers || {},
        };
        const req = (lib as any).request(reqOptions, (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('error', reject);
        req.setTimeout(timeoutMs, () => {
          req.destroy();
          reject(new Error(`Timeout após ${timeoutMs}ms para ${url}`));
        });
        if (options.body) req.write(options.body);
        req.end();
      });
    };

    // 1. GET /index.jsp para obter cookies iniciais
    const cookieJar: Record<string, string> = {};
    const extractCookies = (headers: any) => {
      const setCookies = headers['set-cookie'] || [];
      const arr = Array.isArray(setCookies) ? setCookies : [setCookies];
      arr.forEach((c: string) => {
        if (!c) return;
        const [pair] = c.split(';');
        const [name, ...valParts] = pair.split('=');
        if (name && valParts.length) cookieJar[name.trim()] = valParts.join('=').trim();
      });
    };

    const indexResp = await fetchRaw('https://comercial.cooperflora.com.br/index.jsp', {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });
    extractCookies(indexResp.headers);

    // 2. POST /api/v1/login para obter TOKEN e USUARIO
    const loginApiResp = await fetchRaw('https://apinovo.cooperflora.com.br/api/v1/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://comercial.cooperflora.com.br',
        'Referer': 'https://comercial.cooperflora.com.br/index.jsp',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ login: config.login, senha: config.senha }),
    });

    let cooperToken = '';
    let usuario: any = {};
    let menu: any[] = [];
    try {
      const loginData = JSON.parse(loginApiResp.body);
      if (loginData?.CODERR !== 0 && loginData?.CODERR !== undefined) {
        throw new Error(`Login Cooperflora falhou: ${loginData?.MSG || 'Credenciais inválidas'}`);
      }
      cooperToken = loginData?.TOKEN || '';
      usuario = loginData?.USUARIO || {};
      menu = loginData?.MENU || [];
    } catch (e: any) {
      throw new Error(`Falha no login da Cooperflora: ${e.message}`);
    }
    if (!cooperToken) throw new Error('Falha no login da Cooperflora. Verifique login e senha.');

    // 3. POST /session/update
    const cookieHeader = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
    const sessionBody = new URLSearchParams({
      TOKEN: cooperToken,
      USUARIO: JSON.stringify(usuario),
      BASE_URL: 'https://apinovo.cooperflora.com.br',
      MENU: JSON.stringify(menu),
      CHAVE_PAGINA: '0',
    }).toString();
    const sessionResp = await fetchRaw('https://comercial.cooperflora.com.br/session/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookieHeader,
        'Origin': 'https://comercial.cooperflora.com.br',
        'Referer': 'https://comercial.cooperflora.com.br/index.jsp',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: sessionBody,
    });
    extractCookies(sessionResp.headers);
    const cookieStr = Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join('; ');
    if (!cookieStr) throw new Error('Falha ao obter sessão do site Cooperflora.');

    // 4. Buscar lista de produtos
    const chave = config.chave || '62002';
    const rota = config.rota || '463';
    const produtosBody = new URLSearchParams({
      chave, rota, enderecoEntrega: '0', dataCarregamento,
      filial: '', indexTr: '-1', utilizarCredito: 'false',
      utilizarCreditoDisponivel: 'false', utilizarCaixaSeca: 'false',
      grupos: '16,17,18,6,2,21,8,11', agencias: '', especies: '',
      tamanhos: '', cores: '', qualidades: '', produtores: '',
      temas: '', recepcionado: '', variedades: '',
    }).toString();
    const produtosResp = await fetchRaw('https://comercial.cooperflora.com.br/pedido/comprar/listarProdutos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'text/html, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': cookieStr,
        'Referer': 'https://comercial.cooperflora.com.br/pedido/comprar/principal',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: produtosBody,
    });

    // 5. Parsear HTML
    const html = produtosResp.body;
    const allProdutos: Array<{codigo: string, nome: string, preco: string, qualidade: string, estoque: number}> = [];
    const onclickPattern = /abrirModalComprarProduto\('(\d+)', '([^']+)', '([A-Z0-9]+)','([^']+)'/g;
    const seen = new Set<string>();
    let onclickMatch;
    while ((onclickMatch = onclickPattern.exec(html)) !== null) {
      const [, , , codigo, qualidade] = onclickMatch;
      const key = `${codigo}_${qualidade}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const idx = onclickMatch.index;
      const ctx = html.substring(Math.max(0, idx - 2000), idx);
      const nomeMatches = ctx.match(/<span class="fw-semibold[^"]*"\s*>\s*([^<]+?)\s*<\/span>/g);
      const nomeMatch = nomeMatches ? nomeMatches[nomeMatches.length - 1].match(/>\s*([^<]+?)\s*<\/span>/) : null;
      const nome = nomeMatch ? nomeMatch[1].trim().substring(0, 100) : '';
      if (!nome) continue;
      const precoMatches = ctx.match(/<td class="w-20">\s*(R\$[\d.,]+(?:\s*-\s*[\d.,]+)?)\s*<\/td>/g);
      const precoMatch = precoMatches ? precoMatches[precoMatches.length - 1].match(/(R\$[\d.,]+(?:\s*-\s*[\d.,]+)?)/) : null;
      const preco = precoMatch ? precoMatch[1].trim() : 'R$0';
      const estoqueMatches = ctx.substring(ctx.length - 500).match(/<td>\s*(\d+)\s*<\/td>/g);
      const estoqueStr = estoqueMatches ? estoqueMatches[estoqueMatches.length - 1].replace(/<[^>]+>/g, '').trim() : '0';
      const estoque = parseInt(estoqueStr) || 0;
      allProdutos.push({ codigo, nome, preco, qualidade, estoque });
    }

    // 6. Converter e salvar
    const produtosParaSalvar = allProdutos.map((p) => {
      const precoStr = p.preco.replace('R$', '').trim();
      const partes = precoStr.split(/\s*-\s*/);
      const precoMin = parseFloat(partes[0].replace(',', '.')) || 0;
      const precoMax = partes.length > 1 ? parseFloat(partes[1].replace(',', '.')) || precoMin : precoMin;
      return {
        codigo: p.codigo,
        nome: p.nome,
        precoMin: String(precoMin) as any,
        precoMax: String(precoMax) as any,
        qualidade: p.qualidade,
        estoque: p.estoque,
        grupo: '',
        imagemUrl: `https://apinovo.cooperflora.com.br/api/v1/imagem?codigo=${p.codigo}`,
        dataCarregamento,
        atualizadoEm: new Date(),
      };
    });
    await withRetry(
      () => db.upsertCooperfloraProdutos(produtosParaSalvar),
      { ...DB_RETRY_OPTS, label: "[AutoSync Cooperflora] upsertCooperfloraProdutos" }
    );
    await withRetry(
      () => db.upsertCooperfloraConfig({ ultimaAtualizacao: new Date(), dataCarregamento }),
      { ...DB_RETRY_OPTS, label: "[AutoSync Cooperflora] upsertCooperfloraConfig" }
    );

    // 7. Carregar hastes em lotes de 5
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    const buscarHastesProduto = async (prod: { codigo: string; qualidade: string }) => {
      const detBody = new URLSearchParams({
        chave, dataCarregamento, produto: prod.codigo, qualidade: prod.qualidade,
        rota, endereco: '0', compraRapida: 'false', filial: '', indexTr: '-1',
        utilizaCredito: 'false', utilizarCreditoDisponivel: 'false',
        valorCreditoDisponivel: '0', utilizarCaixaSeca: 'false',
      }).toString();
      const detResp = await fetchRaw('https://comercial.cooperflora.com.br/pedido/comprar/detalheProduto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'text/html, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          'Cookie': cookieStr,
          'Referer': 'https://comercial.cooperflora.com.br/pedido/comprar/principal',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: detBody,
      }, 10000);
      const detHtml = detResp.body;
      const hMatch = detHtml.match(/Hastes[^<]*<\/[^>]+>\s*<[^>]+>\s*(\d+)/);
      const hastesNum = hMatch ? parseInt(hMatch[1]) : 1;
      const trPat = /<tr[^>]*data-cod-sitio="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/;
      const trM = trPat.exec(detHtml);
      let hastesEmbNum = 1;
      if (trM) {
        const tds = trM[2].match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
        const embTd = tds[3] || '';
        const embText = embTd.replace(/<[^>]+>/g, '').trim();
        const embM = embText.match(/(\d+)/);
        if (embM) hastesEmbNum = parseInt(embM[1]);
      }
      await db.updateCooperfloraHastes(prod.codigo, hastesNum > 0 ? hastesNum : 1, hastesEmbNum);
    };
    const BATCH_SIZE = 5;
    for (let i = 0; i < produtosParaSalvar.length; i += BATCH_SIZE) {
      const lote = produtosParaSalvar.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(lote.map(prod => buscarHastesProduto(prod)));
      if (i + BATCH_SIZE < produtosParaSalvar.length) await sleep(300);
    }

    // 8. Sincronizar produtos de venda
    const margemSync = parseFloat(String(config.margemPadrao || '30'));
    const syncResult = await withRetry(
      () => db.syncProdutosVendaFromCooperflora(margemSync),
      { ...DB_RETRY_OPTS, label: "[AutoSync Cooperflora] syncProdutosVendaFromCooperflora" }
    );
    // Atualizar catálogos de venda: remover produtos sem estoque e atualizar preços
    try {
      const catalogoSyncCoop = await db.syncCatalogosVendaAposSync('cooperflora');
      if (catalogoSyncCoop.removidos > 0 || catalogoSyncCoop.atualizados > 0) {
        console.log(`[AutoSync] Catálogos Cooperflora: ${catalogoSyncCoop.removidos} itens removidos, ${catalogoSyncCoop.atualizados} preços atualizados`);
      }
    } catch (e: any) {
      console.warn('[AutoSync] Erro ao sincronizar catálogos Cooperflora:', e.message);
    }
    const totalProdutos = produtosParaSalvar.length;
    const syncMsg = `AutoSync: ${totalProdutos} produtos. Vendas: +${syncResult.criados} novos, ${syncResult.atualizados} atualizados.`;
    await withRetry(
      () => db.registrarSyncHistorico({ fonte: 'COOPERFLORA', status: 'SUCESSO', total: totalProdutos, mensagem: syncMsg, duracaoMs: Date.now() - inicio }),
      { ...DB_RETRY_OPTS, label: "[AutoSync Cooperflora] registrarSyncHistorico" }
    );
    schedulerStatus.cooperflora.ultimaSync = new Date();
    schedulerStatus.cooperflora.ultimoStatus = "SUCESSO";
    console.log(`[AutoSync] Cooperflora concluído: ${totalProdutos} produtos em ${((Date.now() - inicio) / 1000).toFixed(1)}s`);
  } catch (err: any) {
    const msg = `AutoSync falhou: ${err?.message || 'erro desconhecido'}`;
    console.error("[AutoSync] Cooperflora erro:", msg);
    await withRetry(
      () => db.registrarSyncHistorico({ fonte: 'COOPERFLORA', status: 'FALHA', total: 0, mensagem: msg, duracaoMs: Date.now() - inicio }),
      { ...DB_RETRY_OPTS, label: "[AutoSync Cooperflora] registrarSyncHistorico FALHA", maxAttempts: 3 }
    ).catch(() => {});
    schedulerStatus.cooperflora.ultimaSync = new Date();
    schedulerStatus.cooperflora.ultimoStatus = "FALHA";
  } finally {
    schedulerStatus.cooperflora.rodando = false;
  }
}

// ─── Iniciar Scheduler ───────────────────────────────────────────────────────
export function iniciarAutoSync(): void {
  console.log(`[AutoSync] Scheduler iniciado — sincronização a cada ${INTERVALO_MS / 60000} minutos`);

  // Calcular próximas execuções
  const agora = Date.now();
  schedulerStatus.cooperflora.proximaSync = new Date(agora + INTERVALO_MS);
  schedulerStatus.veiling.proximaSync = new Date(agora + INTERVALO_MS);

  // Executar Veiling a cada 20 minutos (offset de 0)
  setInterval(async () => {
    schedulerStatus.veiling.proximaSync = new Date(Date.now() + INTERVALO_MS);
    await executarSyncVeiling();
  }, INTERVALO_MS);

  // Executar Cooperflora a cada 20 minutos (offset de 2 minutos para não sobrecarregar)
  setTimeout(() => {
    setInterval(async () => {
      schedulerStatus.cooperflora.proximaSync = new Date(Date.now() + INTERVALO_MS);
      await executarSyncCooperflora();
    }, INTERVALO_MS);
    // Primeira execução imediata do Cooperflora (com delay de 2min)
    executarSyncCooperflora().catch(console.error);
  }, 2 * 60 * 1000);

  // Primeira execução do Veiling (com delay de 3min para o banco estabilizar após reinício)
  setTimeout(() => {
    executarSyncVeiling().catch(console.error);
  }, 3 * 60 * 1000);

  // Inicializar dataCarregamento se ainda não estiver configurada (Veiling)
  db.getVeilingConfig().then(cfg => {
    if (!cfg?.dataCarregamento) {
      const data = proximoDiaUtil();
      db.saveVeilingConfig({ dataCarregamento: data })
        .then(() => console.log(`[AutoSync] Data de carregamento Veiling inicializada: ${data}`))
        .catch(console.error);
    }
  }).catch(console.error);

  // Inicializar dataCarregamento se ainda não estiver configurada (Cooperflora)
  db.getCooperfloraConfig().then(cfg => {
    if (!cfg?.dataCarregamento) {
      const data = proximoDiaUtil();
      db.upsertCooperfloraConfig({ dataCarregamento: data })
        .then(() => console.log(`[AutoSync] Data de carregamento Cooperflora inicializada: ${data}`))
        .catch(console.error);
    }
  }).catch(console.error);

  // Agendar job às 18h para avançar dataCarregamento para próximo dia útil (Veiling + Cooperflora)
  agendarJobDataCarregamento();

  // Agendar importação automática de pedidos Veiling às 18h
  agendarImportacaoPedidos();
}

// ─── Importação Automática de Pedidos Veiling às 18h ───
export async function executarImportacaoPedidosVeiling(): Promise<void> {
  console.log('[AutoSync] Iniciando importação automática de pedidos Veiling...');
  try {
    const config = await withRetry(
      () => db.getVeilingConfig(),
      { ...DB_RETRY_OPTS, label: "[AutoSync ImportPedidos] getVeilingConfig" }
    );
    if (!config?.usuario || !config?.senha) {
      console.log('[AutoSync] Importação pedidos Veiling: credenciais não configuradas, pulando.');
      return;
    }
    const tokenData = await veilingLogin(config.usuario, config.senha);
    const token = tokenData.access_token;
    const customerId = config.customerId || '987';
    const targetDate = new Date();
    const dateStr = targetDate.toISOString().split('T')[0];
    const dataBR = dateStr.split('-').reverse().join('/');
    const exportUrl = `https://backend.veilingonline.com.br/ecommerce/api/Order/export?startDate=${dateStr}&endDate=${dateStr}&filterBy=purchaseDate&customerId=${customerId}`;
    const exportResp = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!exportResp.ok) {
      const errText = await exportResp.text();
      await db.createVeilingImportacao({ dataPedidos: dateStr, totalItens: 0, totalPedidos: 0, status: 'ERRO', mensagem: `HTTP ${exportResp.status}: ${errText.substring(0, 200)}`, origem: 'AUTOMATICO' });
      return;
    }
    const contentType = exportResp.headers.get('content-type') || '';
    let buffer: Buffer;
    if (contentType.includes('json')) {
      const jsonData = await exportResp.json() as any[];
      if (!jsonData || jsonData.length === 0) {
        await db.createVeilingImportacao({ dataPedidos: dateStr, totalItens: 0, totalPedidos: 0, status: 'SUCESSO', mensagem: `Nenhum pedido para ${dataBR}`, origem: 'AUTOMATICO' });
        return;
      }
      const ws = XLSX.utils.json_to_sheet(jsonData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
      buffer = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    } else {
      const arrayBuffer = await exportResp.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) {
      await db.createVeilingImportacao({ dataPedidos: dateStr, totalItens: 0, totalPedidos: 0, status: 'ERRO', mensagem: 'Planilha vazia', origem: 'AUTOMATICO' });
      return;
    }
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const parseResult = parseVeilingRows(rows);
    if (!parseResult.success || parseResult.items.length === 0) {
      await db.createVeilingImportacao({ dataPedidos: dateStr, totalItens: 0, totalPedidos: 0, status: 'PARCIAL', mensagem: parseResult.error || `Nenhum item válido para ${dataBR}`, origem: 'AUTOMATICO' });
      return;
    }
    const items = parseResult.items;
    const fornecedor = extractFornecedorFromChave(parseResult.chaveInfo) || config.usuario;
    const produtosResult = await db.listProdutosLoja({ limit: 1000 });
    const produtosList = (produtosResult as any).items || [];
    // Verificar quais números de pedido já existem (para marcar como duplicados)
    const numerosNovos = items.map((i: any) => i.pedido).filter(Boolean);
    const existentesSet = new Set<string>();
    if (numerosNovos.length > 0) {
      const existentes = await db.checkTransacoesExistentes(numerosNovos);
      (existentes as any[]).forEach((e: any) => { if (e.transacaoGfp) existentesSet.add(String(e.transacaoGfp)); });
    }
    const itensPayload = items.map((item: any) => {
      const existing = produtosList.find((p: any) => p.nome?.toLowerCase() === item.descricao?.toLowerCase());
      const qtdTotal = item.totalUn || 1;
      const isDuplicado = item.pedido ? existentesSet.has(item.pedido) : false;
      return {
        produtoId: existing?.id ?? undefined,
        produtoNome: item.descricao,
        quantidade: String(qtdTotal),
        valorUnitario: String(item.vlrUnit || 0),
        subtotal: String(qtdTotal * (item.vlrUnit || 0)),
        transacaoGfp: item.pedido || null,
        isDuplicado: isDuplicado ? 1 : 0,
      };
    });
    const total = itensPayload.reduce((s: number, i: any) => s + parseFloat(i.subtotal), 0);
    const compraId = await withRetry(
      () => db.createCompra(
        { fornecedor, data: dateStr, total: total.toFixed(2), origem: 'IMPORTACAO' },
        itensPayload as any
      ),
      { ...DB_RETRY_OPTS, label: "[AutoSync ImportPedidos] createCompra" }
    );
    for (const item of itensPayload) {
      if ((item as any).produtoNome?.trim()) {
        await withRetry(
          () => db.upsertProdutoLojaFromCompra({
            nome: (item as any).produtoNome.trim(),
            precoCusto: parseFloat((item as any).valorUnitario) || 0,
            quantidade: parseFloat((item as any).quantidade) || 0,
          }),
          { ...DB_RETRY_OPTS, label: "[AutoSync ImportPedidos] upsertProdutoLojaFromCompra" }
        );
      }
    }
    await withRetry(
      () => db.createVeilingImportacao({ dataPedidos: dateStr, totalItens: items.length, totalPedidos: 1, compraId, status: 'SUCESSO', mensagem: `${items.length} itens importados de ${dataBR}`, origem: 'AUTOMATICO' }),
      { ...DB_RETRY_OPTS, label: "[AutoSync ImportPedidos] createVeilingImportacao" }
    );
    console.log(`[AutoSync] Importação pedidos Veiling: ${items.length} itens importados de ${dataBR}`);
  } catch (err: any) {
    console.error('[AutoSync] Erro na importação de pedidos Veiling:', err?.message);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      await db.createVeilingImportacao({ dataPedidos: dateStr, totalItens: 0, totalPedidos: 0, status: 'ERRO', mensagem: err?.message || 'erro desconhecido', origem: 'AUTOMATICO' });
    } catch {}
  }
}

function agendarImportacaoPedidos(): void {
  function disparar() {
    schedulerStatus.importacaoPedidos.rodando = true;
    executarImportacaoPedidosVeiling()
      .then(() => {
        schedulerStatus.importacaoPedidos.ultimaSync = new Date();
        schedulerStatus.importacaoPedidos.ultimoStatus = 'SUCESSO';
      })
      .catch((err) => {
        schedulerStatus.importacaoPedidos.ultimaSync = new Date();
        schedulerStatus.importacaoPedidos.ultimoStatus = 'FALHA';
        console.error('[AutoSync] Importação pedidos falhou:', err?.message);
      })
      .finally(() => {
        schedulerStatus.importacaoPedidos.rodando = false;
        // Reagenda para as próximas 18h (aprox. 24h)
        const nextDelay = msAteProximas18hSP() + 60000;
        schedulerStatus.importacaoPedidos.proximaSync = new Date(Date.now() + nextDelay);
        setTimeout(disparar, nextDelay);
      });
  }
  const delay = msAteProximas18hSP();
  const horas = Math.floor(delay / 3600000);
  const mins = Math.floor((delay % 3600000) / 60000);
  schedulerStatus.importacaoPedidos.proximaSync = new Date(Date.now() + delay);
  console.log(`[AutoSync] Job importação pedidos Veiling: próxima execução em ${horas}h${mins}m (às 18h SP)`);
  setTimeout(disparar, delay);
}
