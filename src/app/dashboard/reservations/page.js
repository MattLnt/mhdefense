"use client";

import { useState, useEffect, useCallback } from "react";
import DateTimeSelect from "@/components/DateTimeSelect";
import styles from "./Reservations.module.css";

const TYPE_SESSION = {
  INDIVIDUEL: "Séance individuelle",
  DUO: "Séance duo",
  GROUPE: "Séance petit groupe",
};
const STATUS_LABEL = {
  CONFIRMED: "Confirmée", COMPLETED: "Terminée", CANCELLED: "Annulée", NO_SHOW: "Absence",
};
const STATUS_CLASS = {
  CONFIRMED: "stConfirmed", COMPLETED: "stCompleted", CANCELLED: "stCancelled", NO_SHOW: "stNoShow",
};

function jour(iso) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(new Date(iso));
}
function heure(iso) {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export default function ReservationsPage() {
  const [filter, setFilter] = useState("upcoming");
  const [q, setQ] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const charger = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ filter });
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/admin/bookings?${params}`)
      .then((r) => (r.ok ? r.json() : { bookings: [] }))
      .then((d) => setBookings(d.bookings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, q]);

  useEffect(() => {
    const t = setTimeout(charger, q ? 300 : 0); // léger debounce sur la recherche
    return () => clearTimeout(t);
  }, [charger, q]);

  async function action(id, act) {
    setMenuOpen(null);
    if (act === "cancel" && !confirm("Annuler cette réservation ?")) return;
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: act }),
      });
      if (res.ok) charger();
    } catch {}
  }

  return (
    <>
      <div className={styles.head}>
        <div>
          <div className={styles.title}>Réservations</div>
          <div className={styles.sub}>Gérez toutes les séances et leur paiement.</div>
        </div>
        <button className={styles.newBtn} onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle réservation
        </button>
      </div>

      {/* Filtres */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {[
            { k: "upcoming", l: "À venir" },
            { k: "past", l: "Passées" },
            { k: "all", l: "Toutes" },
          ].map((t) => (
            <button
              key={t.k}
              className={`${styles.tab} ${filter === t.k ? styles.on : ""}`}
              onClick={() => setFilter(t.k)}
            >
              {t.l}
            </button>
          ))}
        </div>
        <div className={styles.search}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un client (nom, email, téléphone)…"
          />
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className={styles.loading}>Chargement…</div>
      ) : bookings.length === 0 ? (
        <div className={styles.list}>
          <div className={styles.empty}>Aucune réservation.</div>
        </div>
      ) : (
        <div className={styles.list}>
          {bookings.map((b) => {
            const soldeDu =
              b.payment?.status === "PARTIAL" && !b.payment?.onSitePaid && b.payment?.amountDueOnSite > 0;
            return (
              <div key={b.id} className={styles.row}>
                <div className={styles.when}>
                  <b>{jour(b.startsAt)}</b>
                  <span>{heure(b.startsAt)}</span>
                </div>
                <div className={styles.who}>
                  <h4>
                    {b.clientName}
                    {b.isFreeTrial && <span className={`${styles.tag} ${styles.tagTrial}`}>Essai</span>}
                    {b.type === "ABONNEMENT" && <span className={`${styles.tag} ${styles.tagAbo}`}>Abonné</span>}
                  </h4>
                  <p>
                    {TYPE_SESSION[b.sessionType]}
                    {b.participantsCount > 1 ? ` · ${b.participantsCount} pers.` : ""}
                    {b.clientPhone ? <> · <a href={`tel:${b.clientPhone}`}>{b.clientPhone}</a></> : ""}
                  </p>
                </div>

                {soldeDu && (
                  <span className={styles.solde}>Solde {Math.round(b.payment.amountDueOnSite / 100)} €</span>
                )}
                <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[b.status]]}`}>
                  {STATUS_LABEL[b.status]}
                </span>

                {/* Menu actions */}
                <div className={styles.actions}>
                  <button
                    className={styles.actionsBtn}
                    onClick={() => setMenuOpen(menuOpen === b.id ? null : b.id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
                  {menuOpen === b.id && (
                    <div className={styles.menu}>
                      {soldeDu && (
                        <button className={styles.menuItem} onClick={() => action(b.id, "mark_paid")}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M20 6L9 17l-5-5" /></svg>
                          Marquer le solde payé
                        </button>
                      )}
                      {b.status === "CONFIRMED" && (
                        <>
                          <button className={styles.menuItem} onClick={() => action(b.id, "completed")}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                            Marquer réalisée
                          </button>
                          <button className={styles.menuItem} onClick={() => action(b.id, "no_show")}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
                            Marquer absence
                          </button>
                          <button className={`${styles.menuItem} ${styles.menuDanger}`} onClick={() => action(b.id, "cancel")}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                            Annuler
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <CreateModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            charger();
          }}
        />
      )}
    </>
  );
}

/* ---------- Modal de création manuelle ---------- */

function CreateModal({ onClose, onCreated }) {
  const [startsAt, setStartsAt] = useState("");
  const [sessionType, setSessionType] = useState("INDIVIDUEL");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [markPaid, setMarkPaid] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState(null);

  const nbParticipants = { INDIVIDUEL: 1, DUO: 2, GROUPE: 3 }[sessionType];

  async function creer() {
    setErreur(null);
    if (!startsAt || !name.trim()) {
      setErreur("Le créneau et le nom du client sont requis.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt,
          sessionType,
          participantsCount: nbParticipants,
          guestName: name,
          guestPhone: phone,
          guestEmail: email,
          markPaid,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErreur(d.error || "Erreur lors de la création.");
        setSaving(false);
        return;
      }
      onCreated();
    } catch {
      setErreur("Une erreur est survenue.");
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3>Nouvelle réservation</h3>
          <button className={styles.close} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {erreur && <div className={styles.modalError}>{erreur}</div>}

        <div className={styles.field}>
          <label>Type de séance</label>
          <div className={styles.typeRow}>
            {[
              { k: "INDIVIDUEL", l: "Individuel" },
              { k: "DUO", l: "Duo" },
              { k: "GROUPE", l: "Groupe" },
            ].map((t) => (
              <button
                key={t.k}
                className={`${styles.typeOpt} ${sessionType === t.k ? styles.on : ""}`}
                onClick={() => setSessionType(t.k)}
              >
                {t.l}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label>Créneau</label>
          <DateTimeSelect value={startsAt} onChange={setStartsAt} placeholder="Choisir date et heure" />
        </div>

        <div className={styles.field}>
          <label>Nom du client</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Marie Dupont" />
        </div>
        <div className={styles.field}>
          <label>Téléphone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" />
        </div>
        <div className={styles.field}>
          <label>Email (optionnel)</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marie@exemple.fr" />
        </div>

        <label className={styles.checkRow}>
          <input type="checkbox" checked={markPaid} onChange={(e) => setMarkPaid(e.target.checked)} />
          Paiement déjà réglé
        </label>

        <button className={styles.submit} onClick={creer} disabled={saving}>
          {saving ? "Création…" : "Créer la réservation"}
        </button>
      </div>
    </div>
  );
}