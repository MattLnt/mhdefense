"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "../app/compte/reserver/Reserver.module.css";

const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const JOURS = ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
const DOW = ["L", "M", "M", "J", "V", "S", "D"];

function dayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${j}`;
}

/**
 * Calendrier + créneaux (colonnes gauche + milieu).
 * Remonte le créneau ISO sélectionné via onChange.
 * @param {string|null} value
 * @param {(iso:string|null)=>void} onChange
 */
export default function MemberSlotPicker({ value, onChange }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [slotsByDay, setSlotsByDay] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 60);
    setLoading(true);
    fetch(`/api/availability?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => (r.ok ? r.json() : { days: {} }))
      .then((d) => setSlotsByDay(d.days || {}))
      .catch(() => setSlotsByDay({}))
      .finally(() => setLoading(false));
  }, []);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < startOffset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    return arr;
  }, [cursor]);

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daySlots = selectedDay ? slotsByDay[selectedDay] || [] : [];

  function selectDay(d) {
    const key = dayKey(d);
    if (!slotsByDay[key] || slotsByDay[key].length === 0) return;
    setSelectedDay(key);
    onChange(null); // reset le créneau quand on change de jour
  }

  const canPrev =
    cursor.getFullYear() > today.getFullYear() ||
    (cursor.getFullYear() === today.getFullYear() && cursor.getMonth() > today.getMonth());

  const selectedDayLabel = selectedDay
    ? (() => {
        const [y, m, j] = selectedDay.split("-").map(Number);
        const dt = new Date(y, m - 1, j);
        return `${JOURS[dt.getDay()]} ${j} ${MOIS[m - 1]}`;
      })()
    : null;

  return (
    <>
      {/* Calendrier */}
      <div className={styles.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: "0.96rem", fontWeight: 700, textTransform: "capitalize" }}>
            {MOIS[cursor.getMonth()]} {cursor.getFullYear()}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className={styles.navBtn}
              disabled={!canPrev}
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              aria-label="Mois précédent"
              style={navStyle(!canPrev)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              className={styles.navBtn}
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              aria-label="Mois suivant"
              style={navStyle(false)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
          {DOW.map((d, i) => (
            <span key={i} style={{ textAlign: "center", fontSize: "0.64rem", color: "var(--muted)", fontWeight: 600 }}>{d}</span>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <span key={i} style={dayBase} />;
            const key = dayKey(d);
            const has = (slotsByDay[key] || []).length > 0;
            const isPast = d < startOfToday;
            const isSel = key === selectedDay;

            if (isPast || !has) {
              return (
                <span key={i} style={{ ...dayBase, color: "var(--muted)", opacity: 0.35, cursor: "default" }}>
                  {d.getDate()}
                </span>
              );
            }
            return (
              <button
                key={i}
                onClick={() => selectDay(d)}
                style={{
                  ...dayBase,
                  cursor: "pointer",
                  background: isSel ? "#d64c7f" : "var(--rd)",
                  border: `1px solid ${isSel ? "#d64c7f" : "var(--glass-border)"}`,
                  color: isSel ? "#fff" : "var(--txt)",
                  position: "relative",
                }}
              >
                {d.getDate()}
                <span style={{ width: 3.5, height: 3.5, borderRadius: "50%", background: isSel ? "#fff" : "#f0699a", position: "absolute", bottom: 5 }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Créneaux */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          {selectedDay ? `${selectedDayLabel} — créneaux` : "Créneaux"}
        </div>
        <div className={styles.slots}>
          {loading ? (
            <div className={styles.slotsHint}>Chargement des disponibilités…</div>
          ) : !selectedDay ? (
            <div className={styles.slotsHint}>Sélectionnez un jour dans le calendrier pour voir les créneaux.</div>
          ) : daySlots.length === 0 ? (
            <div className={styles.slotsHint}>Aucun créneau ce jour-là.</div>
          ) : (
            daySlots.map((iso) => {
              const h = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
              return (
                <button
                  key={iso}
                  className={`${styles.slot} ${value === iso ? styles.slotSel : ""}`}
                  onClick={() => onChange(iso)}
                >
                  {h}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

const dayBase = {
  aspectRatio: "1",
  borderRadius: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.8rem",
  fontWeight: 600,
  border: "1px solid transparent",
  background: "none",
  fontFamily: "inherit",
  padding: 0,
};
function navStyle(disabled) {
  return {
    width: 29, height: 29, borderRadius: 8,
    background: "var(--rd)", border: "1px solid var(--glass-border)",
    color: "var(--txt)", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1,
  };
}