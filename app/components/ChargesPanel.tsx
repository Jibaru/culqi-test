"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../page.module.css";

interface ChargeRow {
  id: string;
  creationDate: number;
  amount: number;
  amountRefunded: number;
  currencyCode: string;
  email: string;
  referenceCode?: string;
  outcomeType?: string;
  cardBrand?: string;
  lastFour?: string;
}

type Notice = { kind: "success" | "error"; message: string } | null;

const soles = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;

function RefundForm({
  charge,
  onDone,
}: {
  charge: ChargeRow;
  onDone: (notice: Notice) => void;
}) {
  const remaining = charge.amount - charge.amountRefunded;
  const [amountText, setAmountText] = useState((remaining / 100).toFixed(2));
  const [reason, setReason] = useState("solicitud_comprador");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const cents = Math.round(parseFloat(amountText.replace(",", ".")) * 100);
    if (!Number.isInteger(cents) || cents <= 0 || cents > remaining) {
      onDone({
        kind: "error",
        message: `El monto debe estar entre S/ 0.01 y ${soles(remaining)}`,
      });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chargeId: charge.id, amount: cents, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        onDone({ kind: "error", message: data.error });
      } else {
        onDone({
          kind: "success",
          message: `Devolución ${data.id} por ${soles(data.amount)} (${data.status})`,
        });
      }
    } catch {
      onDone({ kind: "error", message: "No se pudo contactar al backend" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.refundForm}>
      <input
        type="number"
        min="0.01"
        step="0.01"
        max={remaining / 100}
        value={amountText}
        onChange={(e) => setAmountText(e.target.value)}
        aria-label="Monto a devolver en soles"
      />
      <select value={reason} onChange={(e) => setReason(e.target.value)}>
        <option value="solicitud_comprador">Solicitud del comprador</option>
        <option value="duplicado">Duplicado</option>
        <option value="fraudulento">Fraudulento</option>
      </select>
      <button onClick={submit} disabled={busy}>
        {busy ? "Devolviendo..." : "Devolver"}
      </button>
    </div>
  );
}

export default function ChargesPanel() {
  const [charges, setCharges] = useState<ChargeRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [openRefund, setOpenRefund] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/charges");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error);
      } else {
        setCharges(data.charges);
        setLoadError(null);
      }
    } catch {
      setLoadError("No se pudo contactar al backend");
    }
  }, []);

  useEffect(() => {
    // Carga inicial: refresh es async y solo hace setState tras el fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const handleRefundDone = (result: Notice) => {
    setNotice(result);
    if (result?.kind === "success") {
      setOpenRefund(null);
      refresh();
    }
  };

  return (
    <div className={`${styles.card} ${styles.cardTable}`}>
      <div className={styles.cardBody}>
        {notice && (
          <p className={notice.kind === "success" ? styles.success : styles.error}>
            {notice.kind === "success" ? "✅ " : "❌ "}
            {notice.message}
          </p>
        )}

        {loadError && <p className={styles.error}>❌ {loadError}</p>}
        {!charges && !loadError && <p>Cargando cargos...</p>}

        {charges && charges.length === 0 && (
          <p>No hay cargos todavía — crea uno desde las demos 1 o 2.</p>
        )}

        {charges && charges.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.chargesTable}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cargo</th>
                  <th>Tarjeta</th>
                  <th>Monto</th>
                  <th>Devuelto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c) => {
                  const remaining = c.amount - c.amountRefunded;
                  return (
                    <tr key={c.id}>
                      <td>
                        {new Date(c.creationDate).toLocaleString("es-PE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>
                        <code>{c.id.slice(0, 18)}…</code>
                        <br />
                        <span className={styles.tableMuted}>{c.email}</span>
                      </td>
                      <td>
                        {c.cardBrand ?? "—"}
                        {c.lastFour ? ` ····${c.lastFour}` : ""}
                      </td>
                      <td className={styles.tableAmount}>{soles(c.amount)}</td>
                      <td className={styles.tableAmount}>
                        {c.amountRefunded > 0 ? (
                          <span className={styles.refundedBadge}>
                            {soles(c.amountRefunded)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {remaining > 0 ? (
                          openRefund === c.id ? (
                            <RefundForm charge={c} onDone={handleRefundDone} />
                          ) : (
                            <button
                              className={styles.refundButton}
                              onClick={() => {
                                setNotice(null);
                                setOpenRefund(c.id);
                              }}
                            >
                              Devolver
                            </button>
                          )
                        ) : (
                          <span className={styles.refundedBadge}>
                            Devuelto total
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
