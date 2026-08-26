"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./Clients.module.css";

function initiale(name) {
  return (name || "?").trim().charAt(0).toUpperCase();
}

const STATUS = {
  ACTIVE: { label: "Actif", cls: "badgeActive" },
  CANCELLED: { label: "Résiliation prévue", cls: "badgeCancelled" },
  PAST_DUE: { label: "Paiement en retard", cls: "badgePastDue" },
  ENDED: { label: "Terminé", cls: "badgeNone" },
};

export default function ClientsPage() {
  const [q, setQ] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/admin/clients?${params}`)
      .then((r) => (r.ok ? r.json() : { clients: [] }))
      .then((d) => setClients(d.clients || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q]);

  useEffect(() => {
    const t = setTimeout(charger, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [charger, q]);

  return (
    <>
      <div className={styles.head}>
        <div className={styles.title}>Clients & abonnements</div>
        <div className={styles.sub}>Vos membres, abonnés comme clients ponctuels.</div>
      </div>

      <div className={styles.search}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
        </svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un client…" />
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement…</div>
      ) : clients.length === 0 ? (
        <div className={styles.list}>
          <div className={styles.empty}>Aucun client pour le moment.</div>
        </div>
      ) : (
        <div className={styles.list}>
          {clients.map((c) => {
            const st = c.subscription ? STATUS[c.subscription.status] : null;
            return (
              <div key={c.id} className={styles.row}>
                <div className={styles.avatar}>{initiale(c.name)}</div>

                <div className={styles.who}>
                  <h4>{c.name}</h4>
                  <p>
                    {c.email}
                    {c.phone ? <> · <a href={`tel:${c.phone}`}>{c.phone}</a></> : ""}
                  </p>
                </div>

                {/* Bloc abonnement (formule + prix + statut + séances) */}
                <div className={styles.right}>
                  {/* Formule */}
                  <div className={styles.plan}>
                    {c.subscription ? (
                      <>
                        <b>{c.subscription.planLabel}</b>
                        <span>{c.subscription.sessionLabel}</span>
                      </>
                    ) : (
                      <span className={styles.planEmpty}>—</span>
                    )}
                  </div>

                  {/* Prix */}
                  <div className={styles.price}>
                    {c.subscription ? (
                      <>
                        {Math.round(c.subscription.monthlyAmount / 100)} €
                        <span>par mois</span>
                      </>
                    ) : (
                      ""
                    )}
                  </div>

                  {/* Statut / type */}
                  <div className={styles.statusCol}>
                    {c.subscription ? (
                      <span className={`${styles.badge} ${styles[st.cls]}`}>{st.label}</span>
                    ) : c.guest && c.guestKind === "ESSAI" ? (
                      <span className={`${styles.badge} ${styles.badgeTrial}`}>Essai</span>
                    ) : c.guest ? (
                      <span className={`${styles.badge} ${styles.badgePonctuel}`}>Ponctuel</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeNone}`}>Sans abonnement</span>
                    )}
                  </div>

                  {/* Séances */}
                  <div className={styles.stat}>
                    <b>{c.totalBookings}</b>
                    <span>séance{c.totalBookings > 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}