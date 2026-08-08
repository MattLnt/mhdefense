import Link from "next/link";
import styles from "./HomeCta.module.css";

/**
 * Section CTA finale de la home : grand encart sombre sur fond clair.
 * Fait la transition entre la section Abonnements (sombre) et le footer (sombre).
 */
export default function HomeCta() {
  return (
    <section className={styles.section}>
      <div className={styles.card}>
        <span className={styles.tag}>🥋 Prête à commencer ?</span>
        <h2>
          Faites le premier pas vers <span>votre sécurité</span>
        </h2>
        <p>
          Rejoignez les femmes qui ont repris confiance avec MH Defense.
          Votre première séance est offerte, sans engagement.
        </p>
        <div className={styles.btns}>
          <Link href="/reservation" className={styles.btnRose}>
            Réserver mon essai gratuit →
          </Link>
          <Link href="/tarifs" className={styles.btnGhost}>
            Voir les formules
          </Link>
        </div>
      </div>
    </section>
  );
}