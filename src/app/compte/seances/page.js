"use client";

import { useState, useEffect } from "react";
import styles from "./Seances.module.css";

const TYPE_SESSION = {
  INDIVIDUEL: "Séance individuelle",
  DUO: "Séance duo",
  GROUPE: "Séance petit groupe",
};

const STATUS_LABEL = {
  CONFIRMED: "Confirmée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  NO_SHOW: "Absence",
};
const STATUS_CLASS = {
  CONFIRMED: "stConfirmed",
  COMPLETED: "stCompleted",
  CANCELLED: "stCancelled",
  NO_SHOW: "stNoShow",
};

function dayNum(iso) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(new Date(iso));
}
function monthShort(iso) {
  return new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(new Date(iso)).replace(".", "");
}
function fullDate(iso) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

export default function SeancesPage() {
  const [data, setData] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null); // id en cours
  const [erreur, setErreur] = useState(null);

  function charger() {
    setLoading(true);
    fetch("/api/me/bookings")
      .then((r) => (r.ok ? r.json() : { upcoming: [], past: [] }))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    charger();
  }, []);

  async function annuler(id) {
    if (!confirm("Confirmer l'annulation de cette séance ?")) return;
    setErreur(null);
    setCancelling(id);
    try {
      const res = await fetch(`/api/me/bookings/${id}/cancel`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) {
        setErreur(d.error || "Impossible d'annuler cette séance.");
        setCancelling(null);
        return;
      }
      charger(); // recharge les listes
    } catch (e) {
      setErreur("Une erreur est survenue. Réessayez.");
    } finally {
      setCancelling(null);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Chargement de vos séances…</div>;
  }

  const { upcoming, past } = data;

  return (
    <>
      <div className={styles.head}>
        <div className={styles.title}>Mes séances</div>
        <div className={styles.sub}>Vos séances à venir et votre historique.</div>
      </div>

      {erreur && (
        <div className={styles.error}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
          </svg>
          <span>{erreur}</span>
        </div>
      )}

      {/* À venir */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>À venir</div>
        <div className={styles.card}>
          {upcoming.length === 0 ? (
            <div className={styles.empty}>Aucune séance à venir.</div>
          ) : (
            upcoming.map((b) => (
              <div key={b.id} className={styles.resa}>
                <div className={styles.rdate}>
                  <b>{dayNum(b.startsAt)}</b>
                  <span>{monthShort(b.startsAt)}</span>
                </div>
                <div className={styles.rinfo}>
                  <h4>{b.isFreeTrial ? "Séance d'essai" : TYPE_SESSION[b.sessionType]}</h4>
                  <p>{fullDate(b.startsAt)} · Sarrians (84)</p>
                </div>
                <span className={`${styles.status} ${styles[STATUS_CLASS[b.status]]}`}>
                  {STATUS_LABEL[b.status]}
                </span>
                <button
                  className={styles.cancelBtn}
                  disabled={cancelling === b.id}
                  onClick={() => annuler(b.id)}
                >
                  {cancelling === b.id ? "…" : "Annuler"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Historique */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Historique</div>
        <div className={styles.card}>
          {past.length === 0 ? (
            <div className={styles.empty}>Aucune séance passée.</div>
          ) : (
            past.map((b) => (
              <div key={b.id} className={styles.resa}>
                <div className={styles.rdate}>
                  <b>{dayNum(b.startsAt)}</b>
                  <span>{monthShort(b.startsAt)}</span>
                </div>
                <div className={styles.rinfo}>
                  <h4>{b.isFreeTrial ? "Séance d'essai" : TYPE_SESSION[b.sessionType]}</h4>
                  <p>{fullDate(b.startsAt)}</p>
                </div>
                <span className={`${styles.status} ${styles[STATUS_CLASS[b.status]]}`}>
                  {STATUS_LABEL[b.status]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}