import Link from "next/link";
import styles from "./TrialBanner.module.css";

/**
 * Bandeau "séance offerte".
 * variant : "dark" (sombre premium) | "rose" (clair liseré)
 * asButton : si true, rend un <button> (onClick) au lieu d'un <Link href>
 * onClick  : action déclenchée en mode bouton
 * href     : destination en mode lien (défaut /reservation)
 */
export default function TrialBanner({ variant = "dark", asButton = false, onClick, href = "/reservation" }) {
  const content = (
    <>
      Réserver mon essai
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </>
  );

  return (
    <div className={`${styles.banner} ${styles[variant]}`}>
      <div className={styles.inner}>
        <div className={styles.glow} />
        <div className={styles.glow2} />
        <div className={styles.left}>
          <div className={styles.ico}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="8" width="18" height="13" rx="2" />
              <path d="M12 8v13M3 12.5h18M7.5 8a2.5 2.5 0 010-5C11 3 12 8 12 8M16.5 8a2.5 2.5 0 000-5C13 3 12 8 12 8" />
            </svg>
          </div>
          <div>
            <span className={styles.tag}>🎁 Offre découverte</span>
            <div className={styles.title}>
              Votre première séance est <em>offerte</em>
            </div>
            <div className={styles.sub}>
              Venez tester sans engagement — un essai gratuit par personne.
            </div>
          </div>
        </div>

        {asButton ? (
          <button type="button" className={styles.cta} onClick={onClick}>
            {content}
          </button>
        ) : (
          <Link href={href} className={styles.cta}>
            {content}
          </Link>
        )}
      </div>
    </div>
  );
}