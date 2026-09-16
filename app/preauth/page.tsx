import Link from "next/link";
import PreauthDemo from "../components/PreauthDemo";
import styles from "../page.module.css";

export default function PreauthPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Volver a las demos
      </Link>
      <div className={styles.header}>
        <span className={styles.badge}>Demo 4</span>
        <h1>Retener ahora, cobrar al aceptar</h1>
        <p>
          Preautorización (<code>capture: false</code>): el monto se retiene al
          reservar y se cobra recién cuando la otra parte acepta.
        </p>
      </div>
      <PreauthDemo />
    </main>
  );
}
