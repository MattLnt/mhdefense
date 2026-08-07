"use client";

import { useState, useEffect } from "react";
import styles from "./Planning.module.css";

const TYPE_SESSION = {
  INDIVIDUEL: "Séance individuelle",
  DUO: "Séance duo",
  GROUPE: "Séance petit groupe",
};

function heure(iso) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
function jourCourt(iso) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric" }).format(new Date(iso));
}
function dateComplete(iso) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date(iso));
}

export default function PlanningPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/planning")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.loading}>Chargement du planning…</div>;
  }
  if (!data) {
    return <div className={styles.loading}>Impossible de charger le planning.</div>;
  }

  const { today, upcoming, stats } = data;

  const renderResa = (b, withDay = false) => (
    <div key={b.id} className={styles.resa}>
      <div className={styles.time}>
        <b>{heure(b.startsAt)}</b>
        <span>{withDay ? jourCourt(b.startsAt) : "1 h"}</span>
      </div>
      <div className={styles.rinfo}>
        <h4>
          {b.clientName}
          {b.isFreeTrial && <span className={`${styles.tag} ${styles.tagTrial}`}>Essai</span>}
          {b.type === "ABONNEMENT" && <span className={`${styles.tag} ${styles.tagAbo}`}>Abonné</span>}
        </h4>
        <p>
          {TYPE_SESSION[b.sessionType]}
          {b.participantsCount > 1 ? ` · ${b.participantsCount} pers.` : ""}
          {b.clientPhone ? (
            <> · <a href={`tel:${b.clientPhone}`}>{b.clientPhone}</a></>
          ) : null}
        </p>
      </div>
      {b.paymentStatus === "PARTIAL" && !b.onSitePaid && b.amountDueOnSite > 0 && (
        <span className={styles.solde}>
          Solde {Math.round(b.amountDueOnSite / 100)} €
        </span>
      )}
    </div>
  );

  return (
    <>
      <div className={styles.hello}>Planning</div>
      <div className={styles.sub}>Votre activité en un coup d'œil.</div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18" />
            </svg>
            Aujourd'hui
          </div>
          <div className={styles.statValue}>{stats.today}<small> séance{stats.today > 1 ? "s" : ""}</small></div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            Cette semaine
          </div>
          <div className={styles.statValue}>{stats.week}<small> séances</small></div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M12 2l2.4 6.9H21l-5.3 4 2 6.9-5.7-4.2L6.3 19.8l2-6.9L3 8.9h6.6z" />
            </svg>
            Abonnés actifs
          </div>
          <div className={styles.statValue}>{stats.activeSubs}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            Soldes à percevoir
          </div>
          <div className={`${styles.statValue} ${stats.pendingSolde > 0 ? styles.statAlert : ""}`}>
            {stats.pendingSolde}
          </div>
        </div>
      </div>

      {/* Aujourd'hui */}
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h3>Aujourd'hui</h3>
          <span className={styles.count}>{dateComplete(new Date().toISOString())}</span>
        </div>
        {today.length === 0 ? (
          <div className={styles.empty}>Aucune séance prévue aujourd'hui.</div>
        ) : (
          today.map((b) => renderResa(b))
        )}
      </div>

      {/* Prochaines séances */}
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h3>Prochaines séances</h3>
          <span className={styles.count}>{upcoming.length} à venir</span>
        </div>
        {upcoming.length === 0 ? (
          <div className={styles.empty}>Aucune séance à venir.</div>
        ) : (
          upcoming.map((b) => renderResa(b, true))
        )}
      </div>
    </>
  );
}