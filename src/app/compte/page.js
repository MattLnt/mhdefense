"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./Dashboard.module.css";

const PLAN_LABELS = { SILVER: "Silver", GOLD: "Gold", PLATINUM: "Platinum" };
const TYPE_LABELS = { INDIVIDUEL: "Individuel", DUO: "Duo", GROUPE: "Petit groupe" };
const TYPE_SESSION = {
  INDIVIDUEL: "Séance individuelle",
  DUO: "Séance duo",
  GROUPE: "Séance petit groupe",
};

function formatDateLong(iso) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}
function dayNum(iso) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(new Date(iso));
}
function monthShort(iso) {
  return new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(new Date(iso)).replace(".", "");
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.loading}>Chargement de votre espace…</div>;
  }

  const prenom = (data?.user?.name || "").trim().split(" ")[0] || "";
  const sub = data?.subscription;
  const bookings = data?.bookings || [];
  const usage = data?.weeklyUsage || { used: 0, quota: 0 };
  const prochaine = bookings[0];
  const resteSemaine = Math.max(0, usage.quota - usage.used);

  return (
    <>
      <div className={styles.hello}>Bonjour {prenom} 👋</div>
      <div className={styles.sub}>Voici un aperçu de votre activité.</div>

      <div className={styles.cards}>
        {/* Abonnement */}
        <div className={`${styles.card} ${styles.feat}`}>
          <div className={styles.label}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M12 2l2.4 6.9H21l-5.3 4 2 6.9-5.7-4.2L6.3 19.8l2-6.9L3 8.9h6.6z" />
            </svg>
            Abonnement
          </div>
          {sub ? (
            <>
              <div className={styles.value}>{PLAN_LABELS[sub.planKey]}</div>
              <div className={styles.note}>
                {TYPE_LABELS[sub.sessionType]} · {sub.weeklyQuota} séance
                {sub.weeklyQuota > 1 ? "s" : ""}/sem
              </div>
            </>
          ) : (
            <>
              <div className={styles.value}>—</div>
              <div className={styles.note}>Aucun abonnement actif</div>
            </>
          )}
        </div>

        {/* Prochaine séance */}
        <div className={styles.card}>
          <div className={styles.label}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
            </svg>
            Prochaine séance
          </div>
          {prochaine ? (
            <>
              <div className={styles.value}>
                {new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric" }).format(new Date(prochaine.startsAt))}
                <small> {monthShort(prochaine.startsAt)}</small>
              </div>
              <div className={styles.note}>
                {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(prochaine.startsAt))} · Sarrians (84)
              </div>
            </>
          ) : (
            <>
              <div className={styles.value}>—</div>
              <div className={styles.note}>Aucune séance à venir</div>
            </>
          )}
        </div>

        {/* Cette semaine */}
        <div className={styles.card}>
          <div className={styles.label}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            Cette semaine
          </div>
          {sub ? (
            <>
              <div className={styles.value}>
                {usage.used}<small>/{usage.quota}</small>
              </div>
              <div className={styles.note}>
                {resteSemaine > 0
                  ? `${resteSemaine} séance${resteSemaine > 1 ? "s" : ""} à réserver`
                  : "Quota atteint cette semaine"}
              </div>
            </>
          ) : (
            <>
              <div className={styles.value}>—</div>
              <div className={styles.note}>Réservez à l'unité</div>
            </>
          )}
        </div>
      </div>

      {/* Prochaines séances */}
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h3>Mes prochaines séances</h3>
          {bookings.length > 0 && <a onClick={() => router.push("/compte/seances")} style={{ cursor: "pointer" }}>Tout voir</a>}
        </div>

        {bookings.length === 0 ? (
          <div className={styles.empty}>Vous n'avez aucune séance à venir.</div>
        ) : (
          bookings.slice(0, 4).map((b) => (
            <div key={b.id} className={styles.resa}>
              <div className={styles.rdate}>
                <b>{dayNum(b.startsAt)}</b>
                <span>{monthShort(b.startsAt)}</span>
              </div>
              <div className={styles.rinfo}>
                <h4>{b.isFreeTrial ? "Séance d'essai" : TYPE_SESSION[b.sessionType]}</h4>
                <p>{formatDateLong(b.startsAt)}</p>
              </div>
              <span className={styles.chip}>
                {b.status === "CONFIRMED" ? "Confirmée" : "En attente"}
              </span>
            </div>
          ))
        )}

        {/* Bouton réserver la séance de la semaine (abonnés avec quota restant) */}
        {sub && resteSemaine > 0 && (
          <button className={styles.book} onClick={() => router.push("/compte/reserver")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Réserver ma séance de la semaine
          </button>
        )}
      </div>
    </>
  );
}