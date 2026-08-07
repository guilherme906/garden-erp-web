import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Validade de Preços - Config", () => {
  beforeAll(async () => {
    // Limpar configurações anteriores
    await db.setAppConfig("VALIDADE_PRECOS_VEILING_DIAS", "7");
    await db.setAppConfig("VALIDADE_PRECOS_COOPERFLORA_DIAS", "7");
  });

  it("deve retornar validade padrão de 7 dias para Veiling", async () => {
    const dias = await db.getValidadePrecosVeiling();
    expect(dias).toBe(7);
  });

  it("deve retornar validade padrão de 7 dias para Cooperflora", async () => {
    const dias = await db.getValidadePrecosCooperflora();
    expect(dias).toBe(7);
  });

  it("deve atualizar validade de preços do Veiling", async () => {
    await db.setValidadePrecosVeiling(14);
    const dias = await db.getValidadePrecosVeiling();
    expect(dias).toBe(14);
  });

  it("deve atualizar validade de preços da Cooperflora", async () => {
    await db.setValidadePrecosCooperflora(21);
    const dias = await db.getValidadePrecosCooperflora();
    expect(dias).toBe(21);
  });

  it("deve permitir valores entre 1 e 365 dias", async () => {
    // Teste com valor mínimo
    await db.setValidadePrecosVeiling(1);
    let dias = await db.getValidadePrecosVeiling();
    expect(dias).toBe(1);

    // Teste com valor máximo
    await db.setValidadePrecosVeiling(365);
    dias = await db.getValidadePrecosVeiling();
    expect(dias).toBe(365);
  });

  it("deve manter valores independentes para cada catálogo", async () => {
    await db.setValidadePrecosVeiling(10);
    await db.setValidadePrecosCooperflora(20);

    const veilingDias = await db.getValidadePrecosVeiling();
    const cooperfloraDias = await db.getValidadePrecosCooperflora();

    expect(veilingDias).toBe(10);
    expect(cooperfloraDias).toBe(20);
  });

  it("deve retornar ambas as validações na query getValidadePrecos", async () => {
    await db.setValidadePrecosVeiling(15);
    await db.setValidadePrecosCooperflora(25);

    const veiling = await db.getValidadePrecosVeiling();
    const cooperflora = await db.getValidadePrecosCooperflora();

    expect(veiling).toBe(15);
    expect(cooperflora).toBe(25);
  });
});
