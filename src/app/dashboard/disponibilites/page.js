"use client";

import { useState, useEffect } from "react";
import TimeSelect from "@/components/TimeSelect";
import DateTimeSelect from "@/components/DateTimeSelect";
import styles from "./Disponibilites.module.css";

const JOURS = [
  { dow: 1, name: "Lundi" },
  { dow: 2, name: "Mardi" },
  { dow: 3, name: "Mercredi" },
  { dow: 4, name: "Jeudi" },
  { dow: 5, name: "Vendredi" },
  { dow: 6, name: "Samedi" },
  { dow: 0, name: "Dimanche" },
];

function formatBlock(startISO, endISO) {
  const opts = { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" };
  const s = new Intl.DateTimeFormat("fr-FR", opts).format(new Date(startISO));
  const e = new Intl.DateTimeFormat("fr-FR", opts).format(new Date(endISO));
  return `${s} → ${e}`;
}

export default function DisponibilitesPage() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState({});
  const [blocks, setBlocks] = useState([]);

  const [savingDispos, setSavingDispos] = useState(false);
  const [dispoMsg, setDispoMsg] = useState(null);

  const [blockStart, setBlockStart] = useState(""); // ISO
  const [blockEnd, setBlockEnd] = useState("");     // ISO
  const [blockReason, setBlockReason] = useState("");
  const [addingBlock, setAddingBlock] = useState(false);
  const [blockMsg, setBlockMsg] = useState(null);

  function charger() {
    setLoading(true);
    fetch("/api/admin/availability")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const map = {};
        for (const { dow } of JOURS) {
          map[dow] = { active: false, startTime: "09:00", endTime: "18:00" };
        }
        for (const a of d.availability) {
          map[a.dayOfWeek] = {
            active: a.active,
            startTime: a.startTime,
            endTime: a.endTime,
          };
        }
        setDays(map);
        setBlocks(d.blocks || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    charger();
  }, []);

  function updateDay(dow, patch) {
    setDays((prev) => ({ ...prev, [dow]: { ...prev[dow], ...patch } }));
  }

  async function enregistrerDispos() {
    setDispoMsg(null);
    setSavingDispos(true);
    const availability = JOURS.filter(({ dow }) => days[dow]?.active).map(({ dow }) => ({
      dayOfWeek: dow,
      startTime: days[dow].startTime,
      endTime: days[dow].endTime,
      active: true,
    }));
    try {
      const res = await fetch("/api/admin/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });
      const d = await res.json();
      if (!res.ok) {
        setDispoMsg({ type: "error", text: d.error || "Erreur lors de l'enregistrement." });
      } else {
        setDispoMsg({ type: "success", text: "Disponibilités enregistrées." });
      }
    } catch {
      setDispoMsg({ type: "error", text: "Une erreur est survenue." });
    } finally {
      setSavingDispos(false);
    }
  }

  async function ajouterBlocage() {
    setBlockMsg(null);
    if (!blockStart || !blockEnd) {
      setBlockMsg({ type: "error", text: "Renseignez les dates de début et de fin." });
      return;
    }
    setAddingBlock(true);
    try {
      const res = await fetch("/api/admin/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: blockStart,
          endsAt: blockEnd,
          reason: blockReason,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setBlockMsg({ type: "error", text: d.error || "Erreur lors de l'ajout." });
      } else {
        setBlocks((prev) =>
          [...prev, d.block].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
        );
        setBlockStart("");
        setBlockEnd("");
        setBlockReason("");
        setBlockMsg({ type: "success", text: "Blocage ajouté." });
      }
    } catch {
      setBlockMsg({ type: "error", text: "Une erreur est survenue." });
    } finally {
      setAddingBlock(false);
    }
  }

  async function supprimerBlocage(id) {
    try {
      const res = await fetch(`/api/admin/blocks?id=${id}`, { method: "DELETE" });
      if (res.ok) setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch {}
  }

  if (loading) {
    return <div className={styles.loading}>Chargement des disponibilités…</div>;
  }

  return (
    <>
      <div className={styles.head}>
        <div className={styles.title}>Disponibilités</div>
        <div className={styles.sub}>Définissez vos horaires d'ouverture et vos absences.</div>
      </div>

      <div className={styles.grid}>
        {/* Horaires récurrents */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Horaires hebdomadaires</div>
          <div className={styles.panelSub}>
            Activez les jours d'ouverture et définissez la plage horaire (séances d'1h).
          </div>

          {dispoMsg && (
            <div className={`${styles.message} ${styles[dispoMsg.type]}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                {dispoMsg.type === "success" ? <path d="M20 6L9 17l-5-5" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>}
              </svg>
              <span>{dispoMsg.text}</span>
            </div>
          )}

          {JOURS.map(({ dow, name }) => {
            const d = days[dow] || { active: false, startTime: "09:00", endTime: "18:00" };
            return (
              <div key={dow} className={styles.dayRow}>
                <span className={`${styles.dayName} ${!d.active ? styles.dayOff : ""}`}>{name}</span>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={d.active}
                    onChange={(e) => updateDay(dow, { active: e.target.checked })}
                  />
                  <span className={styles.slider} />
                </label>
                <div className={`${styles.times} ${!d.active ? styles.timesDisabled : ""}`}>
                  <TimeSelect
                    value={d.startTime}
                    onChange={(v) => updateDay(dow, { startTime: v })}
                    disabled={!d.active}
                    minHour={6}
                    maxHour={22}
                  />
                  <span>à</span>
                  <TimeSelect
                    value={d.endTime}
                    onChange={(v) => updateDay(dow, { endTime: v })}
                    disabled={!d.active}
                    minHour={6}
                    maxHour={22}
                  />
                </div>
              </div>
            );
          })}

          <button className={styles.save} onClick={enregistrerDispos} disabled={savingDispos}>
            {savingDispos ? "Enregistrement…" : "Enregistrer les horaires"}
          </button>
        </div>

        {/* Blocages */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Absences & blocages</div>
          <div className={styles.panelSub}>
            Bloquez une période (vacances, indisponibilité) : les créneaux concernés disparaissent du calendrier.
          </div>

          {blockMsg && (
            <div className={`${styles.message} ${styles[blockMsg.type]}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                {blockMsg.type === "success" ? <path d="M20 6L9 17l-5-5" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>}
              </svg>
              <span>{blockMsg.text}</span>
            </div>
          )}

          <div className={styles.blockForm}>
            <div className={styles.field}>
              <label>Du</label>
              <DateTimeSelect value={blockStart} onChange={setBlockStart} placeholder="Début du blocage" />
            </div>
            <div className={styles.field}>
              <label>Au</label>
              <DateTimeSelect value={blockEnd} onChange={setBlockEnd} placeholder="Fin du blocage" />
            </div>
            <div className={styles.field}>
              <label>Motif (optionnel)</label>
              <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Vacances, formation…" />
            </div>
            <button className={styles.addBlock} onClick={ajouterBlocage} disabled={addingBlock}>
              {addingBlock ? "Ajout…" : "+ Ajouter un blocage"}
            </button>
          </div>

          <div className={styles.blockList}>
            {blocks.length === 0 ? (
              <div className={styles.empty}>Aucun blocage à venir.</div>
            ) : (
              blocks.map((b) => (
                <div key={b.id} className={styles.blockItem}>
                  <div className={styles.blockInfo}>
                    <b>{b.reason || "Indisponible"}</b>
                    <p>{formatBlock(b.startsAt, b.endsAt)}</p>
                  </div>
                  <button className={styles.blockDel} onClick={() => supprimerBlocage(b.id)} aria-label="Supprimer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}