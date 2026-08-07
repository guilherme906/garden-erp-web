import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as db from "./db";

describe("Bloqueio de Clientes", () => {
  let clienteId: number;

  beforeEach(async () => {
    // Criar um cliente de teste
    clienteId = (await db.createCliente({
      nome: "Cliente Teste Bloqueio",
      telefone: "11999999999",
      email: "teste@bloqueio.com",
    })) as number;
  });

  afterEach(async () => {
    // Limpar dados de teste
    if (clienteId) {
      await db.deleteClientePermanente(clienteId);
    }
  });

  it("deve bloquear um cliente com motivo", async () => {
    await db.bloquearCliente(clienteId, "Inadimplência", "Admin Teste");

    const cliente = await db.getCliente(clienteId);
    expect(cliente?.bloqueado).toBe(1);
    expect(cliente?.motivoBloqueio).toBe("Inadimplência");
    expect(cliente?.bloqueadoPor).toBe("Admin Teste");
    expect(cliente?.bloqueadoEm).toBeDefined();
  });

  it("deve desbloquear um cliente", async () => {
    // Primeiro bloqueia
    await db.bloquearCliente(clienteId, "Teste", "Admin");

    // Depois desbloqueia
    await db.desbloquearCliente(clienteId);

    const cliente = await db.getCliente(clienteId);
    expect(cliente?.bloqueado).toBe(0);
    expect(cliente?.motivoBloqueio).toBeNull();
    expect(cliente?.bloqueadoEm).toBeNull();
    expect(cliente?.bloqueadoPor).toBeNull();
  });

  it("deve listar clientes bloqueados", async () => {
    // Criar e bloquear um cliente
    const clienteId2 = (await db.createCliente({
      nome: "Outro Cliente Bloqueado",
      telefone: "11988888888",
    })) as number;

    await db.bloquearCliente(clienteId, "Motivo 1", "Admin");
    await db.bloquearCliente(clienteId2, "Motivo 2", "Admin");

    const bloqueados = await db.listClientesBloqueados();
    expect(bloqueados.length).toBeGreaterThanOrEqual(2);

    const encontrado1 = bloqueados.find((c) => c.id === clienteId);
    const encontrado2 = bloqueados.find((c) => c.id === clienteId2);

    expect(encontrado1).toBeDefined();
    expect(encontrado2).toBeDefined();
    expect(encontrado1?.bloqueado).toBe(1);
    expect(encontrado2?.bloqueado).toBe(1);

    // Limpar
    await db.deleteClientePermanente(clienteId2);
  });

  it("deve filtrar clientes bloqueados por busca", async () => {
    await db.bloquearCliente(clienteId, "Teste", "Admin");

    const bloqueados = await db.listClientesBloqueados("Cliente Teste");
    expect(bloqueados.length).toBeGreaterThan(0);
    expect(bloqueados.some((c) => c.id === clienteId)).toBe(true);
  });

  it("deve manter histórico de bloqueio", async () => {
    const motivo = "Débito em aberto";
    const usuario = "Admin Teste";

    await db.bloquearCliente(clienteId, motivo, usuario);

    const cliente = await db.getCliente(clienteId);
    expect(cliente?.motivoBloqueio).toBe(motivo);
    expect(cliente?.bloqueadoPor).toBe(usuario);
    expect(cliente?.bloqueadoEm).toBeDefined();
  });

  it("não deve listar clientes deletados nos bloqueados", async () => {
    await db.bloquearCliente(clienteId, "Teste", "Admin");

    // Deletar o cliente (soft delete)
    await db.deleteCliente(clienteId);

    const bloqueados = await db.listClientesBloqueados();
    expect(bloqueados.some((c) => c.id === clienteId)).toBe(false);
  });
});
