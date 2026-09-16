// Registro en memoria de los webhooks recibidos, solo para la demo.
// En producción esto iría a una base de datos, procesado con idempotencia.

export interface ReceivedEvent {
  type: string;
  resourceId?: string;
  verified: boolean;
  receivedAt: number;
}

// globalThis para sobrevivir al hot-reload del dev server.
const store = globalThis as unknown as { __culqiEvents?: ReceivedEvent[] };

export function recordEvent(event: ReceivedEvent) {
  store.__culqiEvents = [event, ...(store.__culqiEvents ?? [])].slice(0, 50);
}

export function listEvents(): ReceivedEvent[] {
  return store.__culqiEvents ?? [];
}
