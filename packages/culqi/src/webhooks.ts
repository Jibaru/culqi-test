// Utilidades para webhooks de Culqi (CulqiPanel > Eventos > Webhooks).
//
// Culqi no firma sus webhooks (no hay header HMAC como en Stripe), así que
// la defensa recomendada es doble:
//   1. Un token secreto en la URL del webhook (?token=...), que Culqi
//      reenviará tal cual al notificar.
//   2. Tratar el payload como una pista, no como verdad: re-consultar el
//      recurso al API con la llave secreta antes de actuar sobre él.

/** Tipos de evento conocidos; Culqi puede añadir otros, por eso string. */
export type KnownEventType =
  | "token.creation.succeeded"
  | "charge.creation.succeeded"
  | "charge.creation.failed"
  | "refund.creation.succeeded"
  | "order.status.changed"
  | (string & {});

export interface CulqiEvent<T = unknown> {
  object: "event";
  type: KnownEventType;
  data: T;
  id?: string;
  creation_date?: number;
}

export class WebhookParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookParseError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Valida y normaliza el cuerpo de un webhook de Culqi.
 * Acepta el body crudo (string) o ya parseado; si `data` llega como string
 * JSON (formato histórico de Culqi), lo parsea también.
 */
export function parseWebhookEvent(payload: unknown): CulqiEvent {
  let value = payload;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      throw new WebhookParseError("El cuerpo del webhook no es JSON válido");
    }
  }
  if (!isRecord(value) || value.object !== "event") {
    throw new WebhookParseError('El cuerpo no es un evento (object !== "event")');
  }
  if (typeof value.type !== "string" || value.type.length === 0) {
    throw new WebhookParseError("El evento no tiene type");
  }

  let data = value.data;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      // data no era JSON: se conserva como string
    }
  }

  return {
    object: "event",
    type: value.type,
    data,
    ...(typeof value.id === "string" && { id: value.id }),
    ...(typeof value.creation_date === "number" && {
      creation_date: value.creation_date,
    }),
  };
}
