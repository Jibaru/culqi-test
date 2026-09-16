"use client";

import { useCallback, useEffect, useState } from "react";
import CheckoutDemo from "./CheckoutDemo";
import styles from "../page.module.css";

interface ChargeRow {
  id: string;
  creationDate: number;
  amount: number;
  amountRefunded: number;
  capture?: boolean;
  captureDate?: number | null;
  email: string;
}

type Notice = { kind: "success" | "error"; message: string } | null;

const soles = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;

export default function PreauthDemo() {
  const [holds, setHolds] = useState<ChargeRow[] | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/charges");
      const data = await res.json();
      if (res.ok) {
        // Retención pendiente: no capturada y no liberada (devuelta).
        setHolds(
          (data.charges as ChargeRow[]).filter(
            (c) => c.capture === false && c.amountRefunded < c.amount
          )
        );
      }
    } catch {
      // la tabla simplemente no se actualiza
    }
  }, []);

  useEffect(() => {
    // Carga inicial; refresh es async y solo hace setState tras el fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const act = async (chargeId: string, action: "capture" | "release") => {
    setBusyId(chargeId);
    setNotice(null);
    try {
      const res =
        action === "capture"
          ? await fetch("/api/capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chargeId }),
            })
          : await fetch("/api/refund", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chargeId,
                amount: holds?.find((h) => h.id === chargeId)?.amount,
                reason: "solicitud_comprador",
              }),
            });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ kind: "error", message: data.error });
      } else {
        setNotice({
          kind: "success",
          message:
            action === "capture"
              ? `Cobrado: la acompañante aceptó — cargo ${data.id} capturado`
              : `Liberado: la retención de ${chargeId} fue devuelta`,
        });
        refresh();
      }
    } catch {
      setNotice({ kind: "error", message: "No se pudo contactar al backend" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <CheckoutDemo mode="modal" variant="preauth" onSuccess={refresh} />

      <div className={`${styles.card} ${styles.cardTable}`}>
        <div className={styles.cardBody}>
          <div className={styles.sectionTitle}>
            <h2>Retenciones pendientes</h2>
            <span className={styles.tableMuted}>
              Aceptar = capturar el cobro · Rechazar = liberar la retención
            </span>
          </div>

          <p className={styles.tableMuted}>
            En un producto real, estos botones no existirían: la aceptación
            llegaría por el webhook del canal de WhatsApp (p. ej. Kapso) cuando
            la acompañante responde, y el backend capturaría o liberaría.
          </p>

          {notice && (
            <p
              className={
                notice.kind === "success" ? styles.success : styles.error
              }
            >
              {notice.kind === "success" ? "✅ " : "❌ "}
              {notice.message}
            </p>
          )}

          {!holds && <p>Cargando...</p>}
          {holds && holds.length === 0 && (
            <p className={styles.tableMuted}>
              No hay retenciones pendientes — crea una con el botón de arriba.
            </p>
          )}

          {holds && holds.length > 0 && (
            <div className={styles.tableWrap}>
              <table className={styles.chargesTable}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Retención</th>
                    <th>Monto</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {holds.map((h) => (
                    <tr key={h.id}>
                      <td>
                        {new Date(h.creationDate).toLocaleString("es-PE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>
                        <code>{h.id.slice(0, 18)}…</code>
                        <br />
                        <span className={styles.tableMuted}>{h.email}</span>
                      </td>
                      <td className={styles.tableAmount}>{soles(h.amount)}</td>
                      <td>
                        <div className={styles.refundForm}>
                          <button
                            onClick={() => act(h.id, "capture")}
                            disabled={busyId === h.id}
                          >
                            {busyId === h.id ? "..." : "Aceptar (capturar)"}
                          </button>
                          <button
                            className={styles.refundButton}
                            onClick={() => act(h.id, "release")}
                            disabled={busyId === h.id}
                          >
                            Rechazar (liberar)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
