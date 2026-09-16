// Helpers de navegador para Culqi Checkout Custom (https://js.culqi.com/checkout-js).
// Solo usa la llave pública; nunca pasar la secreta por aquí.

const CHECKOUT_SCRIPT_URL = "https://js.culqi.com/checkout-js";

export interface CheckoutToken {
  id: string;
  email: string;
}

export interface CheckoutError {
  user_message?: string;
  merchant_message?: string;
}

export interface CulqiCheckoutInstance {
  open: () => void;
  close: () => void;
  culqi: () => void;
  token: CheckoutToken | null;
  order: { id: string } | null;
  error: CheckoutError | null;
}

declare global {
  interface Window {
    CulqiCheckout: new (
      publicKey: string,
      config: Record<string, unknown>
    ) => CulqiCheckoutInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

/** Inyecta el script del checkout una sola vez y resuelve cuando está listo. */
export function loadCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Solo disponible en el navegador"));
  }
  if (window.CulqiCheckout) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CHECKOUT_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("No se pudo cargar el script de Culqi"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export interface PaymentMethods {
  tarjeta?: boolean;
  yape?: boolean;
  billetera?: boolean;
  bancaMovil?: boolean;
  agente?: boolean;
  cuotealo?: boolean;
}

export interface OpenCheckoutOptions {
  publicKey: string;
  title: string;
  /** Monto en céntimos. */
  amount: number;
  currency: string;
  email?: string;
  /** "modal" abre ventana emergente; "embedded" renderiza dentro de containerId. */
  mode: "modal" | "embedded";
  /** Requerido en modo embedded: id (sin #) del div contenedor. */
  containerId?: string;
  paymentMethods?: PaymentMethods;
  appearance?: Record<string, unknown>;
  onToken: (token: CheckoutToken) => void;
  onError: (error: CheckoutError) => void;
}

/** Crea y abre el checkout; devuelve la instancia por si hay que cerrarla. */
export function openCheckout(options: OpenCheckoutOptions): CulqiCheckoutInstance {
  if (!window.CulqiCheckout) {
    throw new Error("El script de Culqi no está cargado; llama antes a loadCheckoutScript()");
  }
  if (options.mode === "embedded" && !options.containerId) {
    throw new Error("El modo embedded requiere containerId");
  }

  const culqi = new window.CulqiCheckout(options.publicKey, {
    settings: {
      title: options.title,
      currency: options.currency,
      amount: options.amount,
    },
    client: { email: options.email },
    options: {
      lang: "auto",
      installments: false,
      modal: options.mode === "modal",
      ...(options.mode === "embedded" && {
        container: `#${options.containerId}`,
      }),
      paymentMethods: options.paymentMethods ?? { tarjeta: true, yape: true },
    },
    appearance: options.appearance ?? { theme: "default" },
  });

  culqi.culqi = () => {
    if (options.mode === "modal") culqi.close();
    if (culqi.token) {
      options.onToken(culqi.token);
    } else if (culqi.error) {
      options.onError(culqi.error);
    }
  };

  culqi.open();
  return culqi;
}
