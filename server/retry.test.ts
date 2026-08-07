/**
 * retry.test.ts
 * Testes unitários para o utilitário withRetry e isConnectionError.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withRetry, isConnectionError } from "./retry";

describe("isConnectionError", () => {
  it("deve retornar true para ECONNRESET", () => {
    expect(isConnectionError(new Error("read ECONNRESET"))).toBe(true);
  });

  it("deve retornar true para ETIMEDOUT", () => {
    expect(isConnectionError(new Error("connect ETIMEDOUT"))).toBe(true);
  });

  it("deve retornar true para ECONNREFUSED", () => {
    expect(isConnectionError(new Error("connect ECONNREFUSED"))).toBe(true);
  });

  it("deve retornar true para socket hang up", () => {
    expect(isConnectionError(new Error("socket hang up"))).toBe(true);
  });

  it("deve retornar true para erro com cause ECONNRESET", () => {
    const cause = new Error("read ECONNRESET");
    const err = Object.assign(new Error("DrizzleQueryError"), { cause });
    expect(isConnectionError(err)).toBe(true);
  });

  it("deve retornar false para erro de negócio", () => {
    expect(isConnectionError(new Error("Credenciais inválidas"))).toBe(false);
  });

  it("deve retornar false para valor não-Error", () => {
    expect(isConnectionError("string error")).toBe(false);
    expect(isConnectionError(null)).toBe(false);
    expect(isConnectionError(42)).toBe(false);
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve retornar o resultado na primeira tentativa quando bem-sucedido", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("deve tentar novamente após falha de conexão e retornar na segunda tentativa", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("read ECONNRESET"))
      .mockResolvedValue("ok");

    const [result] = await Promise.all([
      withRetry(fn, {
        maxAttempts: 3,
        baseDelayMs: 100,
        isRetryable: isConnectionError,
      }),
      vi.runAllTimersAsync(),
    ]);

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("deve lançar o erro após esgotar todas as tentativas", async () => {
    const err = new Error("read ECONNRESET");
    const fn = vi.fn().mockRejectedValue(err);

    await expect(
      Promise.all([
        withRetry(fn, {
          maxAttempts: 3,
          baseDelayMs: 100,
          isRetryable: isConnectionError,
        }),
        vi.runAllTimersAsync(),
      ])
    ).rejects.toThrow("read ECONNRESET");

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("deve não tentar novamente para erros não recuperáveis", async () => {
    const err = new Error("Credenciais inválidas");
    const fn = vi.fn().mockRejectedValue(err);

    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        baseDelayMs: 100,
        isRetryable: isConnectionError,
      })
    ).rejects.toThrow("Credenciais inválidas");

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("deve respeitar maxAttempts = 1 (sem retry)", async () => {
    const err = new Error("read ECONNRESET");
    const fn = vi.fn().mockRejectedValue(err);

    await expect(
      withRetry(fn, {
        maxAttempts: 1,
        baseDelayMs: 100,
        isRetryable: isConnectionError,
      })
    ).rejects.toThrow("read ECONNRESET");

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("deve usar o label nos logs de aviso", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("read ECONNRESET"))
      .mockResolvedValue("done");

    await Promise.all([
      withRetry(fn, {
        maxAttempts: 2,
        baseDelayMs: 50,
        label: "[TestLabel]",
        isRetryable: isConnectionError,
      }),
      vi.runAllTimersAsync(),
    ]);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[TestLabel]")
    );
    consoleSpy.mockRestore();
  });
});
