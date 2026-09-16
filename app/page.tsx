import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <span className={styles.badge}>Culqi + Next.js</span>
        <h1>Demos de pago con Culqi</h1>
        <p>Dos formas de mostrar el mismo Checkout Custom.</p>
      </div>

      <div className={styles.demoGrid}>
        <Link href="/modal" className={styles.demoCard}>
          <span className={styles.demoIcon} aria-hidden>
            🪟
          </span>
          <h2>Checkout en modal</h2>
          <p>
            El formulario de pago se abre como ventana emergente al presionar
            el botón de pagar. Es la integración más rápida.
          </p>
          <span className={styles.demoCta}>Probar demo →</span>
        </Link>

        <Link href="/embedded" className={styles.demoCard}>
          <span className={styles.demoIcon} aria-hidden>
            📄
          </span>
          <h2>Checkout incrustado</h2>
          <p>
            El formulario se renderiza dentro de la página, integrado al flujo
            de compra (<code>modal: false</code> + <code>container</code>).
          </p>
          <span className={styles.demoCta}>Probar demo →</span>
        </Link>

        <Link href="/admin" className={styles.demoCard}>
          <span className={styles.demoIcon} aria-hidden>
            🧾
          </span>
          <h2>Cargos y devoluciones</h2>
          <p>
            Mini panel de administración: lista los últimos cargos y permite
            devolverlos, total o parcialmente, con el API de refunds.
          </p>
          <span className={styles.demoCta}>Probar demo →</span>
        </Link>
      </div>
    </main>
  );
}
