import { NextResponse } from "next/server";
import { parseWebhookEvent, WebhookParseError } from "@demo/culqi";
import { getCulqiClient } from "@/lib/culqi-server";
import { listEvents, recordEvent } from "@/lib/webhook-store";

// Receptor de webhooks de Culqi. La URL a registrar en
// CulqiPanel > Eventos > Webhooks es:
//   https://tu-dominio/api/webhooks/culqi?token=<CULQI_WEBHOOK_TOKEN>
// Culqi no firma los webhooks, así que: (1) el token en la URL descarta
// llamadas de terceros, y (2) el recurso se re-consulta al API antes de
// darlo por cierto.
export async function POST(request: Request) {
  const expected = process.env.CULQI_WEBHOOK_TOKEN;
  const token = new URL(request.url).searchParams.get("token");
  if (!expected || token !== expected) {
    return NextResponse.json({ error: "token inválido" }, { status: 401 });
  }

  let event;
  try {
    event = parseWebhookEvent(await request.text());
  } catch (err) {
    if (err instanceof WebhookParseError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const data = event.data as { id?: string } | undefined;
  const resourceId = typeof data?.id === "string" ? data.id : undefined;

  // Verificación contra el API: el webhook es una pista, no una prueba.
  let verified = false;
  if (resourceId?.startsWith("chr_")) {
    verified = await getCulqiClient()
      .getCharge(resourceId)
      .then(() => true)
      .catch(() => false);
  }

  recordEvent({
    type: event.type,
    resourceId,
    verified,
    receivedAt: Date.now(),
  });

  // Responder 2xx rápido; si no, Culqi reintenta.
  return NextResponse.json({ received: true });
}

// Solo para la demo: el panel /admin lee los eventos recibidos.
export async function GET() {
  return NextResponse.json({ events: listEvents() });
}
