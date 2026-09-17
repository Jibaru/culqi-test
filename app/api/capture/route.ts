import { NextResponse } from "next/server";
import { CulqiError } from "@jibaru/culqi";
import { getCulqiClient } from "@/lib/culqi-server";

// Captura (cobra de verdad) una retención creada con capture: false.
export async function POST(request: Request) {
  const { chargeId } = await request.json();
  if (!chargeId || typeof chargeId !== "string") {
    return NextResponse.json({ error: "chargeId es requerido" }, { status: 400 });
  }

  try {
    const charge = await getCulqiClient().charges.capture(chargeId);
    return NextResponse.json({
      id: charge.id,
      capture: charge.capture,
      captureDate: charge.capture_date,
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
