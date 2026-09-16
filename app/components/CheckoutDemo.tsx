"use client";

import { useEffect, useState } from "react";
import { loadCheckoutScript, openCheckout } from "@demo/culqi/client";
import { AMOUNT, CURRENCY } from "@/lib/config";
import styles from "../page.module.css";

type Status =
  | { kind: "idle" }
  | { kind: "processing" }
  | { kind: "success"; chargeId: string; reference: string }
  | { kind: "error"; message: string };

const EMAIL = "prueba@example.com";
const CONTAINER_ID = "culqi-container";
const PRICE = `S/ ${(AMOUNT / 100).toFixed(2)}`;

export default function CheckoutDemo({ mode }: { mode: "modal" | "embedded" }) {
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    loadCheckoutScript()
      .then(() => setScriptReady(true))
      .catch((err) => setStatus({ kind: "error", message: err.message }));
  }, []);

  const startCheckout = () => {
    const publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY;
    if (!publicKey) {
      setStatus({
        kind: "error",
        message: "Falta NEXT_PUBLIC_CULQI_PUBLIC_KEY en .env.local",
      });
      return;
    }

    openCheckout({
      publicKey,
      title: "Tienda de prueba",
      amount: AMOUNT,
      currency: CURRENCY,
      email: EMAIL,
      mode,
      containerId: CONTAINER_ID,
      appearance: {
        theme: "default",
        defaultStyle: {
          bannerColor: "#0f766e",
          buttonBackground: "#0f766e",
        },
      },
      onToken: async (token) => {
        setStatus({ kind: "processing" });
        try {
          const res = await fetch("/api/charge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tokenId: token.id,
              email: token.email ?? EMAIL,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setStatus({ kind: "error", message: data.error });
          } else {
            setStatus({
              kind: "success",
              chargeId: data.id,
              reference: data.reference_code,
            });
          }
        } catch {
          setStatus({ kind: "error", message: "No se pudo contactar al backend" });
        }
      },
      onError: (error) => {
        setStatus({
          kind: "error",
          message:
            error.user_message ??
            error.merchant_message ??
            "Error en el checkout",
        });
      },
    });
  };

  // En modo incrustado el formulario se renderiza apenas el script está listo,
  // sin esperar un clic.
  useEffect(() => {
    if (mode === "embedded" && scriptReady) {
      // Sincroniza con un sistema externo (el widget de Culqi); el setState
      // solo ocurre en callbacks o en el camino de error de configuración.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, scriptReady]);

  return (
    <div
      className={`${styles.card} ${mode === "embedded" ? styles.cardWide : ""}`}
    >
      <div className={styles.cardBody}>
        <div className={styles.orderSummary}>
          <div className={styles.orderRow}>
            <div className={styles.orderThumb} aria-hidden>
              🛍️
            </div>
            <div className={styles.orderInfo}>
              <strong>Producto de prueba</strong>
              <span>Pedido de demostración · 1 unidad</span>
            </div>
            <div className={styles.orderPrice}>{PRICE}</div>
          </div>
          <div className={styles.totalRow}>
            <span>Total a pagar ({CURRENCY})</span>
            <strong>{PRICE}</strong>
          </div>
        </div>

        {mode === "modal" ? (
          <button
            className={styles.payButton}
            onClick={startCheckout}
            disabled={!scriptReady || status.kind === "processing"}
          >
            {!scriptReady
              ? "Cargando Culqi..."
              : status.kind === "processing"
                ? "Procesando cargo..."
                : `Pagar ${PRICE}`}
          </button>
        ) : (
          <div id={CONTAINER_ID} className={styles.embedContainer}>
            {!scriptReady && <p>Cargando Culqi...</p>}
          </div>
        )}

        {status.kind === "processing" && mode === "embedded" && (
          <p className={styles.processing}>Procesando cargo...</p>
        )}
        {status.kind === "success" && (
          <p className={styles.success}>
            ✅ Cargo creado: <code>{status.chargeId}</code>
            <br />
            Referencia: {status.reference}
          </p>
        )}
        {status.kind === "error" && (
          <p className={styles.error}>❌ {status.message}</p>
        )}

        <p className={styles.testCardHint}>
          Tarjeta de prueba: <code>4111 1111 1111 1111</code> · CVV{" "}
          <code>123</code> · cualquier fecha futura
        </p>
      </div>
    </div>
  );
}
