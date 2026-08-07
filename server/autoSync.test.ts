import { describe, it, expect } from "vitest";
import { proximoDiaUtil } from "./autoSync";

describe("proximoDiaUtil", () => {
  it("retorna o dia seguinte quando é segunda-feira", () => {
    // Segunda-feira 14/04/2026
    const base = new Date("2026-04-14T10:00:00Z"); // UTC, equivale a 07:00 SP
    const result = proximoDiaUtil(base);
    expect(result).toBe("15/04/2026"); // terça-feira
  });

  it("retorna segunda-feira quando é sexta-feira", () => {
    // Sexta-feira 10/04/2026
    const base = new Date("2026-04-10T10:00:00Z");
    const result = proximoDiaUtil(base);
    expect(result).toBe("13/04/2026"); // segunda-feira
  });

  it("retorna segunda-feira quando é sábado", () => {
    // Sábado 11/04/2026
    const base = new Date("2026-04-11T10:00:00Z");
    const result = proximoDiaUtil(base);
    expect(result).toBe("13/04/2026"); // segunda-feira
  });

  it("retorna segunda-feira quando é domingo", () => {
    // Domingo 12/04/2026
    const base = new Date("2026-04-12T10:00:00Z");
    const result = proximoDiaUtil(base);
    expect(result).toBe("13/04/2026"); // segunda-feira
  });

  it("retorna o dia seguinte quando é terça-feira", () => {
    // Terça-feira 07/04/2026
    const base = new Date("2026-04-07T10:00:00Z");
    const result = proximoDiaUtil(base);
    expect(result).toBe("08/04/2026"); // quarta-feira
  });

  it("retorna formato dd/MM/yyyy", () => {
    const base = new Date("2026-01-01T10:00:00Z");
    const result = proximoDiaUtil(base);
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});
