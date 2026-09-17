import { NextResponse } from "next/server";
import { CulqiError } from "@jibaru/culqi";
import type { Charge, Token } from "@jibaru/culqi";
import { getCulqiClient } from "@/lib/culqi-server";

// La fuente puede ser un token o una tarjeta guardada (que envuelve al token).
function sourceToken(charge: Charge): Token | null {
  const source = charge.source;
  if (!source) return null;
  return source.object === "token" ? source : source.source;
}

// Lista los últimos cargos para el panel de administración.
export async function GET() {
  try {
    const list = await getCulqiClient().charges.list({ limit: 20 });
    const charges = list.data.map((c) => {
      const token = sourceToken(c);
      return {
        id: c.id,
        creationDate: c.creation_date,
        amount: c.amount,
        amountRefunded: c.amount_refunded,
        currencyCode: c.currency_code,
        email: c.email,
        referenceCode: c.reference_code,
        capture: c.capture,
        captureDate: c.capture_date,
        outcomeType: c.outcome?.type,
        cardBrand: token?.iin?.card_brand,
        lastFour: token?.last_four,
      };
    });
    return NextResponse.json({ charges });
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
