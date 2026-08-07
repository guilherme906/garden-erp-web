import { EventEmitter } from "events";

export type NovoPedidoPublicoEvent = {
  id: number | undefined;
  vendaId: number | null;
  clienteNome: string;
  total: number;
  itens: number;
  timestamp?: number;
};

class PedidoPublicoEmitter extends EventEmitter {
  private pending: NovoPedidoPublicoEvent[] = [];

  emit(event: string, data: NovoPedidoPublicoEvent): boolean {
    // Armazena os últimos 20 pedidos para clientes que conectam depois
    this.pending.push({ ...data, timestamp: Date.now() });
    if (this.pending.length > 20) this.pending.shift();
    return super.emit(event, data);
  }

  getPending(since: number): NovoPedidoPublicoEvent[] {
    return this.pending.filter(p => (p.timestamp ?? 0) > since);
  }
}

export const pedidoPublicoEmitter = new PedidoPublicoEmitter();
pedidoPublicoEmitter.setMaxListeners(100);

export const PEDIDO_PUBLICO_EVENT = "pedido-publico:novo";
