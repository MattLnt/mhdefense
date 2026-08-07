"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import TimeSelect from "./TimeSelect";
import styles from "./DateTimeSelect.module.css";

const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const DOW = ["L", "M", "M", "J", "V", "S", "D"];

/**
 * Sélecteur date + heure custom.
 * @param {string} value      valeur ISO (ou "") 
 * @param {(iso:string)=>void} onChange
 * @param {string} placeholder
 */
export default function DateTimeSelect({ value, onChange, placeholder = "Choisir…" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // État interne (jour + heure) initialisé depuis value
  const initial = value ? new Date(value) : null;
  const [cursor, setCursor] = useState(
    initial ? new Date(initial.getFullYear(), initial.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selDate, setSelDate] = useState(initial); // Date (jour) choisi
  const [time, setTime] = useState(
    initial
      ? `${String(initial.getHours()).padStart(2, "0")}:${String(initial.getMinutes()).padStart(2, "0")}`
      : "09:00"
  );

  // Fermeture au clic extérieur
  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const cells = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const offset = (first.getDay() + 6) % 7;
    const nb = new Date(y, m + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < offset; i++) arr.push(null);
    for (let d = 1; d <= nb; d++) arr.push(new Date(y, m, d));
    return arr;
  }, [cursor]);

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const sameDay = (a, b) =>
    a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  function valider() {
    if (!selDate) return;
    const [h, min] = time.split(":").map(Number);
    const result = new Date(selDate.getFullYear(), selDate.getMonth(), selDate.getDate(), h, min);
    onChange(result.toISOString());
    setOpen(false);
  }

  const canPrev =
    cursor.getFullYear() > today.getFullYear() ||
    (cursor.getFullYear() === today.getFullYear() && cursor.getMonth() > today.getMonth());

  const label = value
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      }).format(new Date(value))
    : placeholder;

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ""} ${!value ? styles.placeholder : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>

      {open && (
        <div className={styles.pop}>
          <div className={styles.calHead}>
            <div className={styles.mois}>
              {MOIS[cursor.getMonth()]} {cursor.getFullYear()}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className={styles.navBtn}
                disabled={!canPrev}
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>

          <div className={styles.dow}>
            {DOW.map((d, i) => <span key={i}>{d}</span>)}
          </div>

          <div className={styles.grid}>
            {cells.map((d, i) => {
              if (!d) return <span key={i} className={`${styles.day} ${styles.dayEmpty}`} />;
              const isPast = d < startToday;
              const isSel = sameDay(d, selDate);
              if (isPast) {
                return <span key={i} className={`${styles.day} ${styles.dayOff}`}>{d.getDate()}</span>;
              }
              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.day} ${isSel ? styles.daySel : ""}`}
                  onClick={() => setSelDate(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className={styles.timeRow}>
            <span>Heure :</span>
            <TimeSelect value={time} onChange={setTime} minHour={6} maxHour={22} />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.done}
              disabled={!selDate}
              onClick={valider}
            >
              Valider
            </button>
          </div>
        </div>
      )}
    </div>
  );
}