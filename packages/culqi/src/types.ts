// Tipos del API v2 de Culqi (subconjunto usado por este SDK).

export interface CulqiOutcome {
  type: string;
  code: string;
  user_message?: string;
  merchant_message?: string;
}

export interface Charge {
  object: "charge";
  id: string;
  creation_date: number;
  amount: number;
  amount_refunded: number;
  current_amount: number;
  currency_code: string;
  email: string;
  description?: string;
  reference_code?: string;
  outcome?: CulqiOutcome;
  source?: {
    object: string;
    id: string;
    card_number?: string;
    last_four?: string;
    iin?: { card_brand?: string };
  };
}

export type RefundReason = "solicitud_comprador" | "duplicado" | "fraudulento";

export interface Refund {
  object: "refund";
  id: string;
  charge_id: string;
  amount: number;
  reason: string;
  status: string;
  creation_date: number;
}

export interface CulqiList<T> {
  data: T[];
  paging?: {
    previous?: string | null;
    next?: string | null;
    cursors?: { before?: string; after?: string };
  };
}

export interface CulqiApiError {
  object: "error";
  type: string;
  code?: string;
  user_message?: string;
  merchant_message?: string;
  param?: string;
}
