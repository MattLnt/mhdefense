"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./TimeSelect.module.css";

/**
 * Sélecteur d'heure custom (au format "HH:MM").
 * @param {string} value        heure sélectionnée, ex "09:00"
 * @param {(v:string)=>void} onChange
 * @param {number} minHour      première heure proposée (défaut 6)
 * @param {number} maxHour      dernière heure proposée (défaut 22)
 * @param {number} step         pas en minutes (défaut 60)
 * @param {boolean} disabled
 */
export default function TimeSelect({
  value,
  onChange,
  minHour = 6,
  maxHour = 22,
  step = 60,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  // Génère la liste des heures
  const options = [];
  for (let h = minHour; h <= maxHour; h++) {
    for (let m = 0; m < 60; m += step) {
      options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  // Fermeture au clic extérieur
  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Scroll sur l'option sélectionnée à l'ouverture
  useEffect(() => {
    if (open && listRef.current) {
      const sel = listRef.current.querySelector(`.${styles.sel}`);
      if (sel) sel.scrollIntoView({ block: "center" });
    }
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.btn} ${open ? styles.open : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        {value || "--:--"}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className={styles.dropdown} ref={listRef}>
          {options.map((t) => (
            <div
              key={t}
              className={`${styles.opt} ${t === value ? styles.sel : ""}`}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
            >
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}