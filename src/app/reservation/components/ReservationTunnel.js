"use client";

import Header from "@/components/Header";
import { useReservation } from "./ReservationContext";
import Stepper from "./Stepper";
import RecapAside from "./RecapAside";
import StepChoix from "./StepChoix";
import StepFormule from "./StepFormule";
import StepCreneau from "./StepCreneau";
import StepInfos from "./StepInfos";
import StepPaiement from "./StepPaiement";
import { Arrow, ArrowBack } from "./icons";
import styles from "../Reservation.module.css";

export default function ReservationTunnel() {
  const { step, isEssai, loading, canNext, clientSecret, retour, suivant } = useReservation();

  // Contenu de l'étape courante (1 à 4)
  const stepContent =
    step === 1 ? <StepFormule />
    : step === 2 ? <StepCreneau />
    : step === 3 ? <StepInfos />
    : step === 4 ? <StepPaiement />
    : null;

  const labelSuivant = loading
    ? "Traitement…"
    : step === 4
    ? isEssai ? "Confirmer ma séance d'essai" : "Procéder au paiement"
    : "Continuer";

  return (
    <>
      <Header />
      <main className={styles.page}>
        {/* Hero sombre + stepper */}
        <section className={styles.top}>
          <div className={styles.topInner}>
            <span className={styles.eyebrow}>🥋 Réservation en ligne</span>
            <h1>Réservez <span>votre séance</span></h1>
            <p>Simple, rapide et 100 % sécurisé.</p>
            <Stepper />
          </div>
        </section>

        {/* Corps */}
        <section className={styles.body}>
          {step === 0 ? (
            <div className={styles.step0Wrap}>
              <StepChoix />
            </div>
          ) : (
            <div className={styles.grid}>
              <div className={styles.main}>
                {stepContent}

                {/* Navigation */}
                <div className={styles.nav}>
                  <button className={styles.back} onClick={retour} disabled={loading}>
                    <ArrowBack /> Retour
                  </button>

                  {!(step === 4 && clientSecret) && (
                    <button className={styles.next} disabled={!canNext || loading} onClick={suivant}>
                      {labelSuivant}
                      <Arrow />
                    </button>
                  )}
                </div>
              </div>

              <RecapAside />
            </div>
          )}
        </section>
      </main>
    </>
  );
}