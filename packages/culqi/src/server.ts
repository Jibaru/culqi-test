// Cliente REST server-side del API v2 de Culqi. Requiere la llave secreta;
// nunca importar desde código que llegue al navegador.

import type {
  Charge,
  CulqiApiError,
  CulqiList,
  Refund,
  RefundReason,
} from "./types";

const API_BASE = "https://api.culqi.com/v2";

export class CulqiError extends Error {
  readonly status: number;
  readonly type?: string;
  readonly code?: string;
  readonly userMessage?: string;
  readonly merchantMessage?: string;

  constructor(status: number, body: Partial<CulqiApiError>) {
    super(
      body.user_message ??
        body.merchant_message ??
        `Culqi respondió ${status}`
    );
    this.name = "CulqiError";
    this.status = status;
    this.type = body.type;
    this.code = body.code;
    this.userMessage = body.user_message;
    this.merchantMessage = body.merchant_message;
  }
}

export interface CreateChargeParams {
  /** Monto en céntimos. */
  amount: number;
  currencyCode: string;
  email: string;
  /** Token (tkn_...) o tarjeta guardada (crd_...). */
  sourceId: string;
  description?: string;
  /** Retener sin cobrar (preautorización); capturar luego con captureCharge. */
  capture?: boolean;
}

export interface CreateRefundParams {
  chargeId: string;
  /** Monto en céntimos; puede ser parcial. */
  amount: number;
  reason: RefundReason;
}

export interface ListParams {
  limit?: number;
  before?: string;
  after?: string;
}

export class CulqiClient {
  readonly #secretKey: string;

  constructor(options: { secretKey: string }) {
    if (!options.secretKey) {
      throw new Error("CulqiClient requiere una llave secreta (sk_...)");
    }
    this.#secretKey = options.secretKey;
  }

  async #request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.#secretKey}`,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new CulqiError(res.status, data);
    }
    return data as T;
  }

  createCharge(params: CreateChargeParams): Promise<Charge> {
    return this.#request("POST", "/charges", {
      amount: params.amount,
      currency_code: params.currencyCode,
      email: params.email,
      source_id: params.sourceId,
      description: params.description,
      ...(params.capture !== undefined && { capture: params.capture }),
    });
  }

  getCharge(id: string): Promise<Charge> {
    return this.#request("GET", `/charges/${id}`);
  }

  listCharges(params: ListParams = {}): Promise<CulqiList<Charge>> {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.before) query.set("before", params.before);
    if (params.after) query.set("after", params.after);
    const qs = query.toString();
    return this.#request("GET", `/charges${qs ? `?${qs}` : ""}`);
  }

  captureCharge(id: string): Promise<Charge> {
    return this.#request("POST", `/charges/${id}/capture`);
  }

  createRefund(params: CreateRefundParams): Promise<Refund> {
    return this.#request("POST", "/refunds", {
      charge_id: params.chargeId,
      amount: params.amount,
      reason: params.reason,
    });
  }

  listRefunds(params: ListParams = {}): Promise<CulqiList<Refund>> {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return this.#request("GET", `/refunds${qs ? `?${qs}` : ""}`);
  }
}
