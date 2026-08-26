"use client";

import { useReservation, TYPES, PLANS } from "./ReservationContext";
import { TYPE_ICON } from "./icons";
import styles from "../Reservation.module.css";

export default function StepFormule() {
  const {
    isAbo, isEssai, type, setType, freq, setFreq, plan, setPlan, setSlots,
    prixPonctuel, prixAbo,
  } = useReservation();

  return (
    <>
      <div className={styles.qTitle}>Quel type de séance ?</div>
      <div className={styles.qSub}>
        {isEssai ? "Votre séance d'essai est offerte, quel que soit le format." : "Le tarif s'adapte au nombre de participants."}
      </div>

      <div className={styles.options}>
        {TYPES.map((t) => {
          const Ic = TYPE_ICON[t.key];
          return (
            <button
              key={t.key}
              className={`${styles.option} ${type === t.key ? styles.optionOn : ""}`}
              onClick={() => setType(t.key)}
            >
              <div className={styles.optionIcon}><Ic /></div>
              <div className={styles.optionText}>
                <div className={styles.optionName}>{t.name}</div>
                <div className={styles.optionDesc}>{t.desc}</div>
              </div>
              {!isEssai && (
                <div className={styles.optionPrice}>
                  {isAbo ? prixAbo(t.key, plan, freq) : prixPonctuel(t.key)} €
                  <span>
                    {isAbo
                      ? `/mois${t.key !== "INDIVIDUEL" ? " /pers." : ""}`
                      : t.key === "INDIVIDUEL"
                      ? "/séance"
                      : "/pers."}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {isAbo && (
        <>
          <div className={styles.block}>
            <div className={styles.blockTitle}>Votre rythme</div>
            <div className={styles.qSub} style={{ marginBottom: 16 }}>
              Le nombre de séances incluses chaque semaine.
            </div>
            <div className={`${styles.options} ${styles.options2}`}>
              {[1, 2].map((f) => (
                <button
                  key={f}
                  className={`${styles.option} ${freq === f ? styles.optionOn : ""}`}
                  onClick={() => { setFreq(f); setSlots([]); }}
                >
                  <div className={styles.optionText}>
                    <div className={styles.optionName}>{f} séance{f > 1 ? "s" : ""} / semaine</div>
                    <div className={styles.optionDesc}>
                      {f === 1 ? "Un rendez-vous hebdomadaire" : "Progression accélérée"}
                    </div>
                  </div>
                  <span className={styles.radio} />
                </button>
              ))}
            </div>
          </div>

          <div className={styles.block}>
            <div className={styles.blockTitle}>Durée d'engagement</div>
            <div className={styles.qSub} style={{ marginBottom: 16 }}>
              Plus l'engagement est long, plus le tarif baisse.
            </div>
            <div className={styles.options}>
              {PLANS.map((p) => (
                <button
                  key={p.key}
                  className={`${styles.option} ${plan === p.key ? styles.optionOn : ""}`}
                  onClick={() => setPlan(p.key)}
                >
                  <div className={styles.optionText}>
                    <div className={styles.optionName}>{p.name}</div>
                    <div className={styles.optionDesc}>{p.desc}</div>
                  </div>
                  <div className={styles.optionPrice}>
                    {prixAbo(type, p.key, freq)} €
                    <span>/mois{type !== "INDIVIDUEL" ? " /pers." : ""}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}