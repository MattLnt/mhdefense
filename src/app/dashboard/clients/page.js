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
  const [menuOpen, setMenuOpen] = useState(null);
  const [resilier, setResilier] = useState(null); // client dont on résilie l'abo

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
            // Résiliation possible seulement si abo actif ou en retard
            const peutResilier =
              c.subscription && ["ACTIVE", "PAST_DUE"].includes(c.subscription.status);
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

                  {/* Menu actions (seulement si abo résiliable) */}
                  {peutResilier && (
                    <div className={styles.actions}>
                      <button
                        className={styles.actionsBtn}
                        onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                      {menuOpen === c.id && (
                        <div className={styles.menu}>
                          <button
                            className={`${styles.menuItem} ${styles.menuDanger}`}
                            onClick={() => {
                              setMenuOpen(null);
                              setResilier(c);
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                            Résilier l'abonnement
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale de résiliation (2 modes) */}
      {resilier && (
        <ResiliationModal
          client={resilier}
          onClose={() => setResilier(null)}
          onDone={() => {
            setResilier(null);
            charger();
          }}
        />
      )}
    </>
  );
}

/* ---------- Modale de résiliation ---------- */

function ResiliationModal({ client, onClose, onDone }) {
  const [mode, setMode] = useState("END_OF_TERM");
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function confirmer() {
    setErreur(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErreur(d.error || "Erreur lors de la résiliation.");
        setSaving(false);
        return;
      }
      onDone();
    } catch {
      setErreur("Une erreur est survenue.");
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={() => !saving && onClose()}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3>Résilier l'abonnement</h3>
          <button className={styles.close} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <p className={styles.modalIntro}>
          Abonnement de <b>{client.name}</b>. Choisissez le mode de résiliation.
          Aucun remboursement n'est effectué.
        </p>

        {erreur && <div className={styles.modalError}>{erreur}</div>}

        <div className={styles.modeList}>
          <button
            className={`${styles.modeOpt} ${mode === "END_OF_TERM" ? styles.modeOn : ""}`}
            onClick={() => setMode("END_OF_TERM")}
          >
            <div className={styles.modeRadio} />
            <div>
              <b>À l'échéance de l'engagement</b>
              <span>Le client garde l'accès jusqu'à la fin de sa période. Recommandé.</span>
            </div>
          </button>
          <button
            className={`${styles.modeOpt} ${mode === "IMMEDIATE" ? styles.modeOn : ""}`}
            onClick={() => setMode("IMMEDIATE")}
          >
            <div className={styles.modeRadio} />
            <div>
              <b>Immédiatement</b>
              <span>L'abonnement s'arrête tout de suite, sans remboursement.</span>
            </div>
          </button>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onClose} disabled={saving}>
            Retour
          </button>
          <button className={styles.btnDanger} onClick={confirmer} disabled={saving}>
            {saving ? "Résiliation…" : "Confirmer la résiliation"}
          </button>
        </div>
      </div>
    </div>
  );
}