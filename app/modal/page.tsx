import Link from "next/link";
import CheckoutDemo from "../components/CheckoutDemo";
import styles from "../page.module.css";

export default function ModalDemo() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Volver a las demos
      </Link>
      <div className={styles.header}>
        <span className={styles.badge}>Demo 1</span>
        <h1>Checkout en modal</h1>
        <p>El formulario de Culqi se abre como ventana emergente.</p>
      </div>
      <CheckoutDemo mode="modal" />
    </main>
  );
}
