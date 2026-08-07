"use client";

import { useState, useEffect } from "react";
import styles from "./Abonnement.module.css";

function formatDate(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  }).format(new Date(iso));
}

const FREQ_LABEL = { ONCE: "1 séance / semaine", TWICE: "2 séances / semaine" };

export default function AbonnementPage() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [erreur, setErreur] = useState(null);

  function charger() {
    setLoading(true);
    fetch("/api/me/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSub(d?.subscription || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    charger();
  }, []);

  async function resilier() {
    if (
      !confirm(
        "Votre abonnement restera actif jusqu'à la fin de votre engagement, puis ne sera pas renouvelé. Confirmer la résiliation ?"
      )
    )
      return;
    setErreur(null);
    setCancelling(true);
    try {
      const res = await fetch("/api/me/subscription/cancel", { method: "POST" });
      const d = await res.json();
      if (!res.ok) {
        setErreur(d.error || "Impossible de résilier l'abonnement.");
        setCancelling(false);
        return;
      }
      charger();
    } catch (e) {
      setErreur("Une erreur est survenue. Réessayez.");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Chargement de votre abonnement…</div>;
  }

  // Aucun abonnement
  if (!sub) {
    return (
      <>
        <div className={styles.head}>
          <div className={styles.title}>Mon abonnement</div>
          <div className={styles.sub}>Gérez votre formule et vos préférences.</div>
        </div>
        <div className={styles.none}>
          <h3>Aucun abonnement actif</h3>
          <p>Souscrivez une formule pour profiter de séances régulières à tarif dégressif.</p>
          <a href="/reservation">Découvrir les abonnements</a>
        </div>
      </>
    );
  }

  const estResilie = sub.status === "CANCELLED" || !!sub.cancelAt;

  const statusBadge = () => {
    if (sub.status === "PAST_DUE")
      return <span className={`${styles.badge} ${styles.badgePastDue}`}>Paiement en attente</span>;
    if (estResilie)
      return <span className={`${styles.badge} ${styles.badgeCancelled}`}>Résiliation programmée</span>;
    return (
      <span className={`${styles.badge} ${styles.badgeActive}`}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        Actif
      </span>
    );
  };

  return (
    <>
      <div className={styles.head}>
        <div className={styles.title}>Mon abonnement</div>
        <div className={styles.sub}>Gérez votre formule et vos préférences.</div>
      </div>

      {erreur && (
        <div className={styles.error}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
          </svg>
          <span>{erreur}</span>
        </div>
      )}

      {estResilie && (
        <div className={styles.notice}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
          </svg>
          <span>
            Votre abonnement prendra fin le <b>{formatDate(sub.cancelAt || sub.engagementEndsAt)}</b>.
            Vous conservez l'accès à vos séances jusqu'à cette date.
          </span>
        </div>
      )}

      <div className={styles.grid}>
        {/* Carte principale */}
        <div className={styles.main}>
          <div className={styles.planRow}>
            <div>
              <div className={styles.planName}>{sub.planLabel}</div>
              <div className={styles.planTag}>{sub.sessionLabel}</div>
            </div>
            <div className={styles.price}>
              <div className={styles.priceValue}>
                {Math.round(sub.monthlyAmount / 100)} €<small> / mois</small>
              </div>
            </div>
          </div>

          <div className={styles.meta}>
            <div className={styles.metaRow}>
              <span>Rythme</span>
              <span>{FREQ_LABEL[sub.frequency]}</span>
            </div>
            {sub.participantsCount > 1 && (
              <div className={styles.metaRow}>
                <span>Participants</span>
                <span>{sub.participantsCount} personnes</span>
              </div>
            )}
            <div className={styles.metaRow}>
              <span>Engagement</span>
              <span>{sub.engagementMonths} mois</span>
            </div>
            <div className={styles.metaRow}>
              <span>Fin d'engagement</span>
              <span>{formatDate(sub.engagementEndsAt)}</span>
            </div>
            <div className={styles.metaRow}>
              <span>Statut</span>
              <span>{statusBadge()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.aside}>
          <div className={styles.card}>
            <h3>Moyen de paiement</h3>
            <p>Votre carte est prélevée automatiquement chaque mois via Stripe.</p>
            <button className={styles.btnOutline} disabled title="Bientôt disponible">
              Mettre à jour ma carte
            </button>
          </div>

          {!estResilie && (
            <div className={styles.card}>
              <h3>Résilier</h3>
              <p>
                La résiliation prend effet à la fin de votre engagement. Vous
                gardez l'accès à vos séances jusque-là.
              </p>
              <button
                className={styles.btnDanger}
                onClick={resilier}
                disabled={cancelling}
              >
                {cancelling ? "Traitement…" : "Résilier mon abonnement"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}