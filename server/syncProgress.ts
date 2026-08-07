import { EventEmitter } from "events";

export type SyncProgressEvent = {
  // Fases conhecidas: "produtos", "hastes", "concluido", "erro" (Cooperflora)
  //                   "login", "categorias", "salvando" (Veiling)
  phase: string;
  current: number;
  total: number;
  message: string;
};

// EventEmitter global para progresso de sincronização
// Chave: sessionId (string), valor: último evento emitido
class SyncProgressEmitter extends EventEmitter {
  private lastEvent: Map<string, SyncProgressEvent> = new Map();

  emit(event: string, sessionId: string, data: SyncProgressEvent): boolean {
    this.lastEvent.set(sessionId, data);
    return super.emit(event, sessionId, data);
  }

  getLastEvent(sessionId: string): SyncProgressEvent | undefined {
    return this.lastEvent.get(sessionId);
  }

  clearSession(sessionId: string) {
    this.lastEvent.delete(sessionId);
  }
}

export const syncProgressEmitter = new SyncProgressEmitter();
syncProgressEmitter.setMaxListeners(50);

export const SYNC_EVENT = "sync:progress";
