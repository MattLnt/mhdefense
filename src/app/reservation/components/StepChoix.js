"use client";

import TrialBanner from "@/components/TrialBanner";
import { useReservation } from "./ReservationContext";
import { Arrow } from "./icons";
import styles from "../Reservation.module.css";

export default function StepChoix() {
  const { choisir } = useReservation();

  return (
    <div className={styles.step0}>
      <TrialBanner variant="dark" onClick={() => choisir("ESSAI")} asButton />

      <div className={styles.step0Head}>
        <h2>Que souhaitez-vous faire ?</h2>
        <p>Choisissez la formule qui vous convient, vous pourrez tout ajuster ensuite.</p>
      </div>

      <div className={styles.choices}>
        <button className={styles.choice} onClick={() => choisir("PONCTUEL")}>
          <div className={styles.choiceIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="16" rx="3" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
          </div>
          <h3>Une séance à l'unité</h3>
          <p>Réservez ponctuellement, quand vous le souhaitez. Sans compte ni engagement.</p>
          <div className={styles.choiceMeta}>
            <span className={styles.choicePrice}>dès 45 €<span> / pers.</span></span>
            <span className={styles.choiceArrow}>Choisir <Arrow /></span>
          </div>
        </button>

        <button className={`${styles.choice} ${styles.choiceFeat}`} onClick={() => choisir("ABONNEMENT")}>
          <span className={styles.choiceBadge}>Recommandé</span>
          <div className={styles.choiceIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2l2.4 6.9H21l-5.3 4 2 6.9-5.7-4.2L6.3 19.8l2-6.9L3 8.9h6.6z" />
            </svg>
          </div>
          <h3>Un abonnement mensuel</h3>
          <p>Un rythme régulier à tarif dégressif. 1 ou 2 séances par semaine.</p>
          <div className={styles.choiceMeta}>
            <span className={styles.choicePrice}>dès 140 €<span> / mois</span></span>
            <span className={styles.choiceArrow}>Choisir <Arrow /></span>
          </div>
        </button>
      </div>
    </div>
  );
}