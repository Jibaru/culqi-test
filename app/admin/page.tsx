import Link from "next/link";
import ChargesPanel from "../components/ChargesPanel";
import WebhookEvents from "../components/WebhookEvents";
import styles from "../page.module.css";

export default function AdminDemo() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Volver a las demos
      </Link>
      <div className={styles.header}>
        <span className={styles.badge}>Demo 3</span>
        <h1>Panel de cargos y devoluciones</h1>
        <p>Últimos cargos del comercio; devuelve total o parcialmente.</p>
      </div>
      <ChargesPanel />
      <WebhookEvents />
    </main>
  );
}
