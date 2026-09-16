import Link from "next/link";
import CheckoutDemo from "../components/CheckoutDemo";
import styles from "../page.module.css";

export default function EmbeddedDemo() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Volver a las demos
      </Link>
      <div className={styles.header}>
        <span className={styles.badge}>Demo 2</span>
        <h1>Checkout incrustado</h1>
        <p>El formulario de Culqi se renderiza dentro de la página.</p>
      </div>
      <CheckoutDemo mode="embedded" />
    </main>
  );
}
