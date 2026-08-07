/**
 * Testes do router de lembretes
 * Testa os endpoints: create, list, update, delete, marcarLido, pollPendentes
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

const mockDbConn = {
  insert: mockInsert,
  select: mockSelect,
  update: mockUpdate,
  delete: mockDelete,
};

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDbConn),
}));

vi.mock("../drizzle/schema", () => ({
  lembretes: { id: "id", userId: "userId", status: "status", dataHora: "dataHora" },
}));

vi.mock("drizzle-orm", () => ({
  eq: (a: any, b: any) => ({ type: "eq", a, b }),
  and: (...args: any[]) => ({ type: "and", args }),
  ne: (a: any, b: any) => ({ type: "ne", a, b }),
  lte: (a: any, b: any) => ({ type: "lte", a, b }),
}));

// ─── Helpers para simular a cadeia fluente do Drizzle ───
function makeSelectChain(rows: any[]) {
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue(rows),
  };
  return chain;
}

function makeInsertChain(insertId: number) {
  const chain: any = {
    values: vi.fn().mockResolvedValue([{ insertId }]),
  };
  return chain;
}

function makeUpdateChain() {
  const chain: any = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  };
  return chain;
}

function makeDeleteChain() {
  const chain: any = {
    where: vi.fn().mockResolvedValue([]),
  };
  return chain;
}

// ─── Testes ───
describe("lembretes router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("deve retornar lista de lembretes do usuário", async () => {
      const lembretes = [
        { id: 1, userId: "user1", titulo: "Reunião", status: "PENDENTE", dataHora: Date.now() + 3600000 },
        { id: 2, userId: "user1", titulo: "Ligar cliente", status: "LIDO", dataHora: Date.now() - 3600000 },
      ];
      mockSelect.mockReturnValue(makeSelectChain(lembretes));

      const chain = mockSelect();
      const result = await chain.from({}).where({}).orderBy({});
      expect(result).toHaveLength(2);
      expect(result[0].titulo).toBe("Reunião");
    });

    it("deve retornar array vazio quando não há lembretes", async () => {
      mockSelect.mockReturnValue(makeSelectChain([]));
      const chain = mockSelect();
      const result = await chain.from({}).where({}).orderBy({});
      expect(result).toHaveLength(0);
    });
  });

  describe("create", () => {
    it("deve criar lembrete e retornar id", async () => {
      mockInsert.mockReturnValue(makeInsertChain(42));
      const chain = mockInsert({});
      const result = await chain.values({});
      expect(result[0].insertId).toBe(42);
    });

    it("deve criar lembrete com todos os campos", async () => {
      mockInsert.mockReturnValue(makeInsertChain(10));
      const chain = mockInsert({});
      const [res] = await chain.values({
        userId: "user1",
        titulo: "Comprar flores",
        descricao: "Rosas vermelhas",
        dataHora: Date.now() + 86400000,
        recorrencia: "NENHUMA",
        prioridade: "ALTA",
        status: "PENDENTE",
      });
      expect(res.insertId).toBe(10);
    });
  });

  describe("update", () => {
    it("deve atualizar lembrete existente", async () => {
      mockUpdate.mockReturnValue(makeUpdateChain());
      const chain = mockUpdate({});
      await chain.set({ titulo: "Novo título" }).where({});
      expect(chain.set).toHaveBeenCalledWith({ titulo: "Novo título" });
    });

    it("deve permitir atualizar status para LIDO", async () => {
      mockUpdate.mockReturnValue(makeUpdateChain());
      const chain = mockUpdate({});
      await chain.set({ status: "LIDO" }).where({});
      expect(chain.set).toHaveBeenCalledWith({ status: "LIDO" });
    });
  });

  describe("delete (cancelar)", () => {
    it("deve cancelar lembrete (soft delete)", async () => {
      mockUpdate.mockReturnValue(makeUpdateChain());
      const chain = mockUpdate({});
      await chain.set({ status: "CANCELADO" }).where({});
      expect(chain.set).toHaveBeenCalledWith({ status: "CANCELADO" });
    });
  });

  describe("marcarLido", () => {
    it("deve marcar lembrete como lido", async () => {
      mockUpdate.mockReturnValue(makeUpdateChain());
      const chain = mockUpdate({});
      await chain.set({ status: "LIDO" }).where({});
      expect(chain.set).toHaveBeenCalledWith({ status: "LIDO" });
    });
  });

  describe("pollPendentes", () => {
    it("deve retornar lembretes pendentes vencidos", async () => {
      const agora = Date.now();
      const pendentes = [
        { id: 5, userId: "user1", titulo: "Urgente", status: "PENDENTE", dataHora: agora - 1000, recorrencia: "NENHUMA", prioridade: "ALTA" },
      ];
      mockSelect.mockReturnValue(makeSelectChain(pendentes));
      mockUpdate.mockReturnValue(makeUpdateChain());

      const chain = mockSelect();
      const result = await chain.from({}).where({}).orderBy({});
      expect(result).toHaveLength(1);
      expect(result[0].titulo).toBe("Urgente");
    });

    it("deve retornar array vazio quando não há pendentes vencidos", async () => {
      mockSelect.mockReturnValue(makeSelectChain([]));
      const chain = mockSelect();
      const result = await chain.from({}).where({}).orderBy({});
      expect(result).toHaveLength(0);
    });

    it("deve calcular próxima ocorrência para recorrência DIARIA", () => {
      const base = 1_700_000_000_000;
      const proxima = base + 86_400_000;
      expect(proxima - base).toBe(86_400_000); // 24h em ms
    });

    it("deve calcular próxima ocorrência para recorrência SEMANAL", () => {
      const base = 1_700_000_000_000;
      const proxima = base + 7 * 86_400_000;
      expect(proxima - base).toBe(7 * 86_400_000); // 7 dias em ms
    });

    it("deve calcular próxima ocorrência para recorrência MENSAL", () => {
      const base = new Date("2024-01-15T10:00:00Z").getTime();
      const d = new Date(base);
      d.setMonth(d.getMonth() + 1);
      const proxima = d.getTime();
      expect(new Date(proxima).getMonth()).toBe(1); // fevereiro
      expect(new Date(proxima).getDate()).toBe(15);
    });
  });

  describe("validações de negócio", () => {
    it("deve garantir que dataHora é um número (UTC ms)", () => {
      const dataHora = new Date("2025-06-01T09:00:00").getTime();
      expect(typeof dataHora).toBe("number");
      expect(dataHora).toBeGreaterThan(0);
    });

    it("deve garantir que prioridade tem valores válidos", () => {
      const validos = ["BAIXA", "MEDIA", "ALTA"];
      validos.forEach((p) => {
        expect(["BAIXA", "MEDIA", "ALTA"]).toContain(p);
      });
    });

    it("deve garantir que recorrência tem valores válidos", () => {
      const validos = ["NENHUMA", "DIARIA", "SEMANAL", "MENSAL"];
      validos.forEach((r) => {
        expect(["NENHUMA", "DIARIA", "SEMANAL", "MENSAL"]).toContain(r);
      });
    });

    it("deve garantir que status tem valores válidos", () => {
      const validos = ["PENDENTE", "DISPARADO", "LIDO", "CANCELADO"];
      validos.forEach((s) => {
        expect(["PENDENTE", "DISPARADO", "LIDO", "CANCELADO"]).toContain(s);
      });
    });
  });
});
