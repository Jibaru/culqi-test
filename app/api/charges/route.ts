import { NextResponse } from "next/server";
import { CulqiError } from "@demo/culqi";
import { getCulqiClient } from "@/lib/culqi-server";

// Lista los últimos cargos para el panel de administración.
export async function GET() {
  try {
    const list = await getCulqiClient().listCharges({ limit: 20 });
    const charges = list.data.map((c) => ({
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
      cardBrand: c.source?.iin?.card_brand,
      lastFour: c.source?.last_four,
    }));
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
