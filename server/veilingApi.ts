/**
 * Integração com a API do Veiling Online
 * Base URL: https://backend.veilingonline.com.br
 */

const VEILING_BASE = "https://backend.veilingonline.com.br";
const CLIENT_ID = "veiling-online";
const CLIENT_SECRET = "9be425c1-cac1-46ba-a89b-2b564f9ad474";

export interface VeilingToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface VeilingOffer {
  offerId: number;
  name: string;
  longName: string;
  price: number | null;
  layerPrice: number | null;
  packagingPrice: number | null;
  trolleyPrice: number | null;
  quality: string;
  availableStock: number;
  productCategory: string;
  productCategoryDescription: string;
  producerName: string;
  siteName: string;
  packagingName: string | null;
  dimension: string;
  defaultImage: string | null;
  images: string[];
  pagesCount: number;
  offerType: string;
  startDate: string | null;
  endDate: string | null;
  minimumUnitQuantity?: number;
  packings?: Array<{ id: number; name: string; price: number; minimumQuantity: number }>;
  siteDeliveryPatterns?: Array<{ freightValue: number }>;
  shippingFee?: number;
  shippingFeeFilials?: Array<{ organizationName: string; custCar: number; branchIdentification: string; productShippingValue: number }>;
  colors?: string;
  productColorId?: number;
}

export interface VeilingOffersResponse {
  offers: VeilingOffer[];
  hasBox: boolean;
}

export interface VeilingCategory {
  id: number;
  code: string;
  description: string;
}

/** Autentica e retorna o token de acesso */
export async function veilingLogin(usuario: string, senha: string): Promise<VeilingToken> {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    username: usuario,
    password: senha,
    scope: "openid profile offline_access",
  });

  const resp = await fetchWithTimeout(
    `${VEILING_BASE}/identity/connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
    15000
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Login Veiling falhou (${resp.status}): ${err}`);
  }

  await assertJson(resp, 'Login');
  return resp.json() as Promise<VeilingToken>;
}

/** Busca as categorias de produto (com retry automático) */
export async function veilingGetCategories(token: string): Promise<VeilingCategory[]> {
  const MAX_RETRIES = 3;
  let lastErr: Error = new Error('Erro desconhecido');
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetchWithTimeout(
        `${VEILING_BASE}/ecommerce/api/productcategory`,
        { headers: { Authorization: `Bearer ${token}` } },
        30000 // 30s timeout (era 10s — servidor pode demorar mais)
      );
      if (!resp.ok) throw new Error(`Erro ao buscar categorias (${resp.status})`);
      await assertJson(resp, 'Categorias');
      return resp.json() as Promise<VeilingCategory[]>;
    } catch (err: any) {
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt); // backoff: 1s, 2s
      }
    }
  }
  throw lastErr;
}

/** Busca uma página de ofertas com filtros opcionais */
export async function veilingGetOffers(
  token: string,
  customerId: string,
  page: number,
  pageSize: number,
  options: {
    categoryId?: number;
    orderBy?: string;
    letter?: string;
    search?: string;
  } = {}
): Promise<VeilingOffersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    totalPage: String(pageSize),
    customerId,
    orderBy: options.orderBy || "AZ",
    includeGfpImages: "false",
  });

  if (options.categoryId) params.append("productCategoryId", String(options.categoryId));
  if (options.letter && options.letter !== "Todas") params.append("letter", options.letter);
  if (options.search) params.append("productName", options.search);

  const resp = await fetchWithTimeout(
    `${VEILING_BASE}/ecommerce/api/Offer?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
    45000 // Aumentado de 15s para 45s (pode demorar com 5500+ ofertas)
  );

  if (!resp.ok) throw new Error(`Erro ao buscar ofertas (${resp.status})`);
  await assertJson(resp, 'Ofertas');
  return resp.json() as Promise<VeilingOffersResponse>;
}

/** Busca TODAS as ofertas paginando até o fim (sequencial para evitar rate limit) */
export async function veilingGetAllOffers(
  token: string,
  customerId: string,
  categoryId?: number,
  onProgress?: (current: number, total: number) => void
): Promise<VeilingOffer[]> {
  const PAGE_SIZE = 100;
  const MAX_RETRIES = 5; // Aumentado de 3 para 5
  const DELAY_MS = 100; // Reduzido de 300 para 100ms
  let totalPages = 0; // Será definido após primeira página

  // Busca uma página com retry automático
  async function fetchPage(page: number): Promise<VeilingOffersResponse> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Veiling] Buscando página ${page}/${totalPages || '?'} (tentativa ${attempt}/${MAX_RETRIES})`);
        return await veilingGetOffers(token, customerId, page, PAGE_SIZE, { categoryId });
      } catch (err: any) {
        console.warn(`[Veiling] Erro na página ${page} (tentativa ${attempt}/${MAX_RETRIES}): ${err.message}`);
        if (attempt === MAX_RETRIES) throw err;
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // backoff exponencial até 10s
        console.log(`[Veiling] Aguardando ${delayMs}ms antes de retry...`);
        await sleep(delayMs);
      }
    }
    throw new Error('Não deveria chegar aqui');
  }

  // Primeira página para descobrir o total
  console.log('[Veiling] Iniciando busca de ofertas...');
  const first = await fetchPage(1);
  totalPages = first.offers.length > 0 ? first.offers[0].pagesCount : 0;
  const totalEstimado = totalPages * PAGE_SIZE;
  console.log(`[Veiling] Total de páginas: ${totalPages} (~${totalEstimado} ofertas)`);
  
  const allOffers: VeilingOffer[] = [...first.offers];
  if (onProgress) onProgress(allOffers.length, totalEstimado);

  // Buscar páginas restantes sequencialmente para evitar rate limit
  for (let p = 2; p <= totalPages; p++) {
    try {
      const resp = await fetchPage(p);
      allOffers.push(...resp.offers);
      console.log(`[Veiling] Página ${p} carregada: ${allOffers.length}/${totalEstimado} ofertas`);
    } catch (err: any) {
      console.warn(`[Veiling] Erro crítico na página ${p}, pulando: ${err.message}`);
    }
    if (onProgress) onProgress(allOffers.length, totalEstimado);
    await sleep(DELAY_MS);
  }

  console.log(`[Veiling] Busca concluída: ${allOffers.length} ofertas carregadas`);
  return allOffers;
}

/** Interface de dados de GFP retornados pelo endpoint by-gfp */
export interface VeilingGfp {
  lkpOfferId: number;
  gfpLineId: number;
  packingQuantity: number;
  quantityPerPacking: number;
  availableQuantity: number;
  quality: string;
  gfpNumber: string;
  deliveryDate: string;
  series: string;
  lot: string;
  qualityObservation1: string;
  qualityObservation2: string;
  observation: string;
}

/** Busca dados de GFP para uma oferta específica */
export async function veilingGetGfpByOffer(
  token: string,
  offerId: number,
  offerType: number,
  packingId: number,
  auctionDate: string
): Promise<VeilingGfp[]> {
  const params = new URLSearchParams({
    offerType: String(offerType),
    packingId: String(packingId),
    auctionDate,
  });
  const resp = await fetchWithTimeout(
    `${VEILING_BASE}/ecommerce/api/offer/by-gfp/${offerId}?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
    20000 // Aumentado de 10s para 20s
  );
  if (!resp.ok) return [];
  if (resp.status === 204) return [];
  const ct = resp.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return [];
  return resp.json() as Promise<VeilingGfp[]>;
}

/**
 * Valida que a resposta tem Content-Type JSON antes de tentar parsear.
 * Lança erro descritivo se o servidor retornou HTML (ex: página de erro/manutenção).
 */
async function assertJson(resp: Response, context: string): Promise<void> {
  const ct = resp.headers.get('content-type') || '';
  if (!ct.includes('application/json') && !ct.includes('text/json')) {
    const body = await resp.text();
    const preview = body.substring(0, 100).replace(/\n/g, ' ');
    throw new Error(`Veiling retornou resposta inválida em ${context} (esperado JSON, recebido: ${ct || 'sem content-type'}). Preview: ${preview}`);
  }
}

function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
