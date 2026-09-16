"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "../page.module.css";

interface EventRow {
  type: string;
  resourceId?: string;
  verified: boolean;
  receivedAt: number;
}

export default function WebhookEvents() {
  const [events, setEvents] = useState<EventRow[] | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks/culqi");
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    // Carga inicial + sondeo ligero; refresh es async y solo hace setState tras el fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className={`${styles.card} ${styles.cardTable}`}>
      <div className={styles.cardBody}>
        <div className={styles.sectionTitle}>
          <h2>Webhooks recibidos</h2>
          <span className={styles.tableMuted}>
            POST /api/webhooks/culqi · se refresca cada 5 s
          </span>
        </div>

        {!events && <p>Cargando...</p>}
        {events && events.length === 0 && (
          <p className={styles.tableMuted}>
            Aún no llega ningún webhook. Culqi no puede alcanzar localhost:
            usa un túnel (ngrok, cloudflared) y registra la URL en CulqiPanel
            → Eventos → Webhooks, o simúlalo con el curl del README.
          </p>
        )}

        {events && events.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.chargesTable}>
              <thead>
                <tr>
                  <th>Recibido</th>
                  <th>Evento</th>
                  <th>Recurso</th>
                  <th>Verificado vs API</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={`${e.receivedAt}-${i}`}>
                    <td>
                      {new Date(e.receivedAt).toLocaleTimeString("es-PE")}
                    </td>
                    <td>
                      <code>{e.type}</code>
                    </td>
                    <td>{e.resourceId ? <code>{e.resourceId}</code> : "—"}</td>
                    <td>
                      {e.verified ? (
                        <span className={styles.okBadge}>✓ verificado</span>
                      ) : (
                        <span className={styles.refundedBadge}>
                          sin verificar
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
