import { NextResponse } from "next/server";
import { CulqiError } from "@demo/culqi";
import { getCulqiClient } from "@/lib/culqi-server";
import { AMOUNT, CURRENCY } from "@/lib/config";

// Igual que /api/charge pero con capture: false — Culqi retiene el monto
// sin cobrarlo; el cobro real ocurre después con /api/capture.
export async function POST(request: Request) {
  const { tokenId, email } = await request.json();
  if (!tokenId || !email) {
    return NextResponse.json(
      { error: "tokenId y email son requeridos" },
      { status: 400 }
    );
  }

  try {
    const charge = await getCulqiClient().createCharge({
      amount: AMOUNT,
      currencyCode: CURRENCY,
      email,
      sourceId: tokenId,
      description: "Retención (preautorización) de prueba",
      capture: false,
    });
    return NextResponse.json({
      id: charge.id,
      outcome: charge.outcome,
      reference_code: charge.reference_code,
      amount: charge.amount,
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
