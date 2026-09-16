# culqi-test

Proyecto mínimo de Next.js (App Router) para probar la integración con [Culqi](https://culqi.com/).

## Cómo funciona

Toda la integración con Culqi vive en un mini SDK local: **`packages/culqi`** (`@demo/culqi`), enlazado por npm workspaces y transpilado por Next (`transpilePackages`).

- **`@demo/culqi/client`** (navegador, solo llave pública): `loadCheckoutScript()` inyecta `https://js.culqi.com/checkout-js` una sola vez, y `openCheckout()` abre el Checkout Custom (modal o incrustado) y entrega el **token** por callback. Los datos de la tarjeta van directo del navegador a Culqi — nunca tocan tu servidor.
- **`@demo/culqi`** (servidor, llave secreta): `CulqiClient` habla con `https://api.culqi.com/v2` — `createCharge`, `getCharge`, `listCharges`, `captureCharge`, `createRefund`, `listRefunds` — y lanza `CulqiError` tipado en fallos.

La app usa el SDK así:

1. **Frontend** (`app/components/CheckoutDemo.tsx`): tokeniza con el checkout y envía el `tokenId` a la ruta de cargo.
2. **Backend** (`app/api/charge`, `app/api/charges`, `app/api/refund`): crea el cargo, lista los últimos cargos y crea devoluciones con `CulqiClient` (la llave secreta solo vive en el servidor, `lib/culqi-server.ts`). El monto del cargo se define en `lib/config.ts` del lado del servidor, nunca se confía en el monto del cliente.

## Setup

1. Afíliate como comercio en [afiliate.culqi.com](https://afiliate.culqi.com/) (las credenciales llegan al correo registrado), entra al panel en [culqipanel.culqi.com](https://culqipanel.culqi.com/login) y copia tus llaves de **prueba** (Desarrollo → API Keys → "Ver" para la secreta).
2. Edita `.env.local`:

   ```
   NEXT_PUBLIC_CULQI_PUBLIC_KEY=pk_test_...
   CULQI_SECRET_KEY=sk_test_...
   ```

3. Corre el proyecto:

   ```bash
   npm run dev
   ```

4. Abre http://localhost:3000 y elige una demo:
   - **/modal** — el checkout se abre como ventana emergente (`modal: true`).
   - **/embedded** — el formulario se renderiza incrustado en la página (`modal: false` + `container: "#culqi-container"`).
   - **/admin** — mini panel: lista los últimos cargos y permite devolverlos, total o parcialmente (`POST /v2/refunds`; razones: `solicitud_comprador`, `duplicado`, `fraudulento`).

   Las dos primeras usan el mismo componente (`app/components/CheckoutDemo.tsx`) y la misma ruta de cargo.

## Tarjetas de prueba

| Marca      | Número              | CVV | Resultado |
| ---------- | ------------------- | --- | --------- |
| Visa       | 4111 1111 1111 1111 | 123 | Aprobada  |
| Mastercard | 5111 1111 1111 1118 | 039 | Aprobada  |
| Amex       | 3712 121212 12122   | 2841| Aprobada  |
| Visa       | 4000 0200 0000 0000 | 123 | Rechazada |

Usa cualquier fecha de vencimiento futura y cualquier email. Lista completa en la [documentación de Culqi](https://docs.culqi.com/).

## Webhooks

Culqi notifica eventos (`charge.creation.succeeded`, `refund.creation.succeeded`, `order.status.changed`, ...) por POST a una URL que registras en **CulqiPanel → Eventos → Webhooks**. El receptor de esta demo es `app/api/webhooks/culqi/route.ts` y los eventos recibidos se ven en **/admin**.

**Importante:** Culqi **no firma** sus webhooks (no hay HMAC como en Stripe). La defensa de esta demo es doble:

1. Un token secreto propio en la URL (`?token=<CULQI_WEBHOOK_TOKEN>`), que descarta llamadas de terceros.
2. El payload se trata como pista, no como verdad: el recurso se **re-consulta al API** con la llave secreta (`getCharge`) antes de marcarlo como verificado.

Para recibir webhooks reales en desarrollo necesitas un túnel (Culqi no alcanza localhost):

```bash
ngrok http 3000   # o: cloudflared tunnel --url http://localhost:3000
# registrar: https://<subdominio>/api/webhooks/culqi?token=<CULQI_WEBHOOK_TOKEN>
```

Para simular uno localmente:

```bash
source .env.local && curl -s "http://localhost:3000/api/webhooks/culqi?token=$CULQI_WEBHOOK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"object":"event","type":"charge.creation.succeeded","data":{"id":"chr_test_xxxxxxxx"}}'
```

## Requisitos para URL

Las URLs deben cumplir estos requisitos para que pasen sin observaciones.

### Plataformas en las que son integrables

- Apps con tiendas virtuales
- Webs con tiendas virtuales

### Información general obligatoria

- Indicar de forma clara qué productos o servicios ofrece tu comercio.
- Muestra los datos de contacto: Número, correo, dirección.
- Si hay íconos de redes sociales, estos deben redirigir a las cuentas correspondientes.

### Información legal obligatoria

- Incluye los Términos y condiciones y Política de cambios y/o devoluciones.
- Debe tener el Libro de reclamaciones integrado en la web/app, cumpliendo con los lineamientos de INDECOPI. Además, no puede depender de formularios, enlaces ni archivos externos como Google Drive.

### Productos y servicios

- Muestra mínimo 5 productos. En caso de ofrecer servicios, la cantidad mínima puede variar, dependiendo del rubro o modelo de negocio.
- Cada uno debe tener una foto, descripción clara y precio visible.

### Proceso de compra

- Debe contar con un carrito de compras o botón de Compras.
- En caso el flujo solicite acceso con credenciales, debes proporcionarnos un usuario y contraseña de prueba.

### Seguridad

- Implementar certificado SSL en toda la web. Es decir, debe estar presente en todas las URLs (/productos, /contacto, etc), no solo al inicio.

## Notas

- Checkout **v4** clásico está en camino de deprecación; este proyecto usa **Checkout Custom** (el mismo script `checkout-js`), que es la vía recomendada actualmente.
- En producción algunos cargos pueden requerir **3DS** (autenticación adicional); este demo no lo implementa.
- Métodos como Yape también generan token; billetera/banca móvil/agente requieren crear una **Order** previa con la llave secreta (no incluido en este demo).
