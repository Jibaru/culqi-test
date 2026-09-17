import { Culqi } from "@jibaru/culqi";

let client: Culqi | null = null;

// Instancia compartida para las rutas de API; falla claro si falta la llave.
export function getCulqiClient(): Culqi {
  if (!client) {
    const secretKey = process.env.CULQI_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Falta CULQI_SECRET_KEY en .env.local");
    }
    client = new Culqi({ secretKey });
  }
  return client;
}
