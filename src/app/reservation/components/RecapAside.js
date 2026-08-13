"use client";

import { useReservation, PLANS } from "./ReservationContext";
import { Check, Lock } from "./icons";
import styles from "../Reservation.module.css";

export default function RecapAside() {
  const { mode, isAbo, isEssai, typeInfo, plan, freq, slots, totalApresPromo } = useReservation();

  const planInfo = PLANS.find((p) => p.key === plan);
  const creneau =
    slots.length > 0
      ? slots
          .map((iso) =>
            new Intl.DateTimeFormat("fr-FR", {
              weekday: "short", day: "numeric", month: "short",
              hour: "2-digit", minute: "2-digit",
            }).format(new Date(iso))
          )
          .join(" · ")
      : null;

  return (
    <aside className={styles.aside}>
      <div className={styles.asideHead}>
        <div className={styles.ico}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        </div>
        <b>Votre réservation</b>
      </div>

      <div className={styles.asideLine}>
        <span className="k">Parcours</span>
        <span className={styles.v} style={{ color: "#fff" }}>
          {isEssai ? "Séance d'essai" : isAbo ? "Abonnement" : "À l'unité"}
        </span>
      </div>
      <div className={styles.asideLine}>
        <span className="k">Type</span>
        <span className={styles.v}>{typeInfo.name}</span>
      </div>

      {isAbo && (
        <>
          <div className={styles.asideLine}>
            <span className="k">Engagement</span>
            <span className={`${styles.v} ${styles.vRose}`}>
              {planInfo.name} · {planInfo.months} mois
            </span>
          </div>
          <div className={styles.asideLine}>
            <span className="k">Rythme</span>
            <span className={styles.v}>{freq} séance{freq > 1 ? "s" : ""} / sem.</span>
          </div>
        </>
      )}

      <div className={styles.asideLine}>
        <span className="k">Créneau</span>
        <span className={`${styles.v} ${creneau ? styles.vRose : styles.asideEmpty}`}>
          {creneau || "à choisir"}
        </span>
      </div>

      <div className={styles.asideTotal}>
        <span className="k">{isAbo ? "Total mensuel" : "Total"}</span>
        <span className={styles.v}>
          {isEssai ? "Offert" : `${totalApresPromo} €`}
          {!isEssai && <span>{isAbo ? " /mois" : ""}</span>}
        </span>
      </div>

      <div className={styles.asideTrust}>
        <div><Lock /> Paiement sécurisé Stripe</div>
        {isAbo && <div><Check /> Résiliation à l'échéance</div>}
        {!isAbo && !isEssai && <div><Check /> 1ʳᵉ séance d'essai offerte</div>}
      </div>
    </aside>
  );
}