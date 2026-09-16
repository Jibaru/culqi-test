import { NextResponse } from "next/server";
import { CulqiError, type RefundReason } from "@demo/culqi";
import { getCulqiClient } from "@/lib/culqi-server";

const REASONS: RefundReason[] = [
  "solicitud_comprador",
  "duplicado",
  "fraudulento",
];

// Crea una devolución (total o parcial) sobre un cargo existente.
export async function POST(request: Request) {
  const { chargeId, amount, reason } = await request.json();

  if (!chargeId || typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "chargeId y amount (entero en céntimos, > 0) son requeridos" },
      { status: 400 }
    );
  }
  if (!REASONS.includes(reason)) {
    return NextResponse.json(
      { error: `reason debe ser uno de: ${REASONS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const refund = await getCulqiClient().createRefund({
      chargeId,
      amount,
      reason,
    });
    return NextResponse.json({
      id: refund.id,
      chargeId: refund.charge_id,
      amount: refund.amount,
      status: refund.status,
    });
  } catch (err) {
    if (err instanceof CulqiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error inesperado" },
      { status: 500 }
    );
  }
}
