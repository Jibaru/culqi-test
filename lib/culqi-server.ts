import { CulqiClient } from "@demo/culqi";

let client: CulqiClient | null = null;

// Instancia compartida para las rutas de API; falla claro si falta la llave.
export function getCulqiClient(): CulqiClient {
  if (!client) {
    const secretKey = process.env.CULQI_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Falta CULQI_SECRET_KEY en .env.local");
    }
    client = new CulqiClient({ secretKey });
  }
  return client;
}
