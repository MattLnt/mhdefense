import Link from "next/link";
import styles from "./TrialBanner.module.css";

/**
 * Bandeau "séance offerte".
 * variant : "rose" (home) | "dark" (tarifs, réservation)
 */
export default function TrialBanner({ variant = "rose" }) {
  return (
    <div className={`${styles.banner} ${styles[variant]}`}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.ico}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="3" y="8" width="18" height="13" rx="2" />
              <path d="M12 8v13M3 12.5h18M7.5 8a2.5 2.5 0 010-5C11 3 12 8 12 8M16.5 8a2.5 2.5 0 000-5C13 3 12 8 12 8" />
            </svg>
          </div>
          <div>
            <span className={styles.tag}>🎁 Offre découverte</span>
            <div className={styles.title}>Votre première séance est offerte</div>
            <div className={styles.sub}>
              Venez tester sans engagement — un essai gratuit par personne.
            </div>
          </div>
        </div>
        <Link href="/reservation" className={styles.cta}>
          Réserver mon essai gratuit →
        </Link>
      </div>
    </div>
  );
}