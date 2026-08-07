/**
 * retry.ts
 * Utilitário de retry com backoff exponencial e jitter para operações assíncronas.
 * Ideal para lidar com falhas transitórias de conexão com banco de dados ou APIs externas.
 */

export interface RetryOptions {
  /** Número máximo de tentativas (incluindo a primeira). Padrão: 4 */
  maxAttempts?: number;
  /** Delay base em ms para o backoff exponencial. Padrão: 1000ms */
  baseDelayMs?: number;
  /** Delay máximo em ms entre tentativas. Padrão: 30000ms */
  maxDelayMs?: number;
  /** Fator multiplicador do backoff. Padrão: 2 */
  factor?: number;
  /** Prefixo para logs de diagnóstico. Padrão: "[Retry]" */
  label?: string;
  /** Função para determinar se o erro é recuperável. Por padrão, todos os erros são recuperáveis. */
  isRetryable?: (err: unknown) => boolean;
}

/**
 * Executa uma função assíncrona com retry automático e backoff exponencial com jitter.
 *
 * @example
 * const result = await withRetry(() => db.getVeilingConfig(), {
 *   maxAttempts: 4,
 *   baseDelayMs: 1000,
 *   label: "[AutoSync Veiling]",
 * });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 4,
    baseDelayMs = 1000,
    maxDelayMs = 30_000,
    factor = 2,
    label = "[Retry]",
    isRetryable = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;

      const isLast = attempt === maxAttempts;
      const errMsg = err instanceof Error ? err.message : String(err);

      if (isLast || !isRetryable(err)) {
        if (!isLast) {
          console.error(`${label} Erro não recuperável na tentativa ${attempt}/${maxAttempts}: ${errMsg}`);
        }
        throw err;
      }

      // Backoff exponencial com jitter aleatório (±20%)
      const exponential = Math.min(baseDelayMs * Math.pow(factor, attempt - 1), maxDelayMs);
      const jitter = exponential * 0.2 * (Math.random() * 2 - 1); // ±20%
      const delay = Math.round(exponential + jitter);

      console.warn(
        `${label} Tentativa ${attempt}/${maxAttempts} falhou: ${errMsg}. ` +
        `Próxima tentativa em ${(delay / 1000).toFixed(1)}s...`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Verifica se um erro é de conexão transitória (ECONNRESET, ETIMEDOUT, etc.)
 */
export function isConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  const cause = (err as any).cause;
  const causeMsg = cause instanceof Error ? cause.message.toLowerCase() : '';

  const transientKeywords = [
    'econnreset', 'etimedout', 'econnrefused', 'enotfound',
    'socket hang up', 'connection lost', 'connection refused',
    'too many connections', 'deadlock', 'lock wait timeout',
    'server has gone away', 'broken pipe', 'epipe',
  ];

  return transientKeywords.some(k => msg.includes(k) || causeMsg.includes(k));
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
