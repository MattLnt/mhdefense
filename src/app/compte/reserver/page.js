"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MemberSlotPicker from "@/components/MemberSlotPicker";
import styles from "./Reserver.module.css";

const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const TYPE_LABELS = { INDIVIDUEL: "Individuelle", DUO: "Duo", GROUPE: "Petit groupe" };

export default function ReserverPage() {
  const router = useRouter();

  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState(null); // ISO du créneau choisi
  const [submitting, setSubmitting] = useState(false);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function confirmer() {
    if (!slot) return;
    setErreur(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscription/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startsAt: slot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Impossible de réserver ce créneau.");
        setSubmitting(false);
        return;
      }
      router.push("/compte");
      router.refresh();
    } catch (e) {
      setErreur("Une erreur est survenue. Réessayez.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Chargement…</div>;
  }

  const sub = me?.subscription;
  const usage = me?.weeklyUsage || { used: 0, quota: 0 };
  const reste = Math.max(0, usage.quota - usage.used);

  // Pas d'abonnement
  if (!sub) {
    return (
      <>
        <div className={styles.head}>
          <div className={styles.title}>Réserver une séance</div>
          <div className={styles.sub}>Cette page est réservée aux abonnés.</div>
        </div>
        <div className={styles.card}>
          <div className={styles.done}>
            <h3>Aucun abonnement actif</h3>
            <p>Souscrivez un abonnement pour réserver vos séances hebdomadaires.</p>
          </div>
        </div>
      </>
    );
  }

  // Détails du créneau choisi pour le récap
  const slotDate = slot ? new Date(slot) : null;
  const recapHeure = slotDate
    ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(slotDate)
    : null;

  return (
    <>
      <div className={styles.head}>
        <div className={styles.title}>Réserver ma séance</div>
        <div className={styles.sub}>Choisissez le jour, l'horaire, et confirmez.</div>
      </div>

      {/* Quota */}
      <div className={styles.quotaBar}>
        <div className={styles.quotaIcon}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div className={styles.quotaText}>
          <b>Cette semaine</b>
          <span>
            {" · "}
            {reste > 0
              ? `Il vous reste ${reste} séance${reste > 1 ? "s" : ""} à réserver`
              : "Quota atteint"}
          </span>
        </div>
        <div className={styles.quotaCount}>
          {usage.used}<small>/{usage.quota}</small>
        </div>
      </div>

      {/* Quota atteint */}
      {reste === 0 ? (
        <div className={styles.card}>
          <div className={styles.done}>
            <div className={styles.doneIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3>Séances de la semaine réservées</h3>
            <p>Revenez la semaine prochaine pour réserver vos prochaines séances.</p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.layout}>
            {/* Calendrier + créneaux (composant) */}
            <MemberSlotPicker value={slot} onChange={setSlot} />

            {/* Encadré récap */}
            <div className={`${styles.card} ${styles.recap}`}>
              <div className={styles.cardTitle}>Récapitulatif</div>

              {slotDate ? (
                <>
                  <div className={styles.recapBig}>
                    <div className={styles.recapDay}>{slotDate.getDate()}</div>
                    <div className={styles.recapMonth}>
                      {MOIS[slotDate.getMonth()]} {slotDate.getFullYear()}
                    </div>
                    <div className={styles.recapTime}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                      </svg>
                      {recapHeure}
                    </div>
                  </div>
                  <div className={styles.recapRow}>
                    <span>Séance</span><span>{TYPE_LABELS[sub.sessionType]}</span>
                  </div>
                  <div className={styles.recapRow}>
                    <span>Durée</span><span>1 heure</span>
                  </div>
                  <div className={styles.recapRow}>
                    <span>Lieu</span><span>Sarrians</span>
                  </div>
                  <div className={styles.recapRow}>
                    <span>Tarif</span><span className={styles.recapIncluse}>Incluse</span>
                  </div>
                </>
              ) : (
                <div className={styles.recapEmpty}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
                  </svg>
                  <p>Choisissez un jour et un horaire pour voir le récapitulatif.</p>
                </div>
              )}

              <button
                className={styles.confirm}
                disabled={!slot || submitting}
                onClick={confirmer}
              >
                {submitting ? "Réservation…" : "Confirmer"}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          {erreur && (
            <div className={styles.error}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
              </svg>
              <span>{erreur}</span>
            </div>
          )}
        </>
      )}
    </>
  );
}