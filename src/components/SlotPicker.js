"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./SlotPicker.module.css";

const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function dayKey(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * @param {number} max        nombre de créneaux sélectionnables (1 ou 2)
 * @param {string[]} value    créneaux sélectionnés (ISO strings)
 * @param {Function} onChange callback(nouvelleListe)
 */
export default function SlotPicker({ max = 1, value = [], onChange }) {
  const today = new Date();
  const [month, setMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState(null);
  const [days, setDays] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const from = new Date(month);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);

    setLoading(true);
    fetch(`/api/availability?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((data) => setDays(data.days || {}))
      .catch(() => setDays({}))
      .finally(() => setLoading(false));
  }, [month]);

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const offset = (first.getDay() + 6) % 7; // commence lundi
    const list = Array(offset).fill(null);
    for (let d = 1; d <= last.getDate(); d++) {
      list.push(new Date(month.getFullYear(), month.getMonth(), d));
    }
    return list;
  }, [month]);

  const monthLabel = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(month);

  const canGoBack =
    month.getFullYear() > today.getFullYear() ||
    (month.getFullYear() === today.getFullYear() &&
      month.getMonth() > today.getMonth());

  const slotsOfDay = selectedDay ? days[selectedDay] || [] : [];

  function toggleSlot(iso) {
    if (value.includes(iso)) {
      onChange(value.filter((s) => s !== iso));
    } else if (value.length < max) {
      onChange([...value, iso]);
    } else if (max === 1) {
      onChange([iso]);
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* Calendrier */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Date</div>

        <div className={styles.calHead}>
          <button
            className={styles.navBtn}
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
            disabled={!canGoBack}
            aria-label="Mois précédent"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <span className={styles.calMonth}>{monthLabel}</span>
          <button
            className={styles.navBtn}
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
            aria-label="Mois suivant"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className={styles.grid}>
          {DOW.map((d) => (
            <div key={d} className={styles.dow}>
              {d}
            </div>
          ))}

          {cells.map((date, i) => {
            if (!date) return <div key={`e${i}`} className={styles.dayEmpty} />;
            const key = dayKey(date);
            const hasSlots = (days[key] || []).length > 0;
            const isSelected = selectedDay === key;

            return (
              <button
                key={key}
                className={[
                  styles.day,
                  !hasSlots ? styles.dayDisabled : "",
                  hasSlots ? styles.dayHasSlots : "",
                  isSelected ? styles.daySelected : "",
                ].join(" ")}
                disabled={!hasSlots}
                onClick={() => setSelectedDay(key)}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div className={styles.hint}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
          Disponible du lundi au dimanche
        </div>
      </div>

      {/* Horaires */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Horaire</div>

        {loading ? (
          <div className={styles.loading}>Chargement des disponibilités…</div>
        ) : !selectedDay ? (
          <div className={styles.empty}>
            Sélectionnez d'abord une date.
          </div>
        ) : slotsOfDay.length === 0 ? (
          <div className={styles.empty}>Aucun créneau ce jour-là.</div>
        ) : (
          <div className={styles.times}>
            {slotsOfDay.map((iso) => {
              const label = new Intl.DateTimeFormat("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(iso));
              const isSelected = value.includes(iso);

              return (
                <button
                  key={iso}
                  className={`${styles.time} ${isSelected ? styles.timeSelected : ""}`}
                  onClick={() => toggleSlot(iso)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {max > 1 && (
          <div className={styles.counter}>
            <b>
              {value.length} / {max}
            </b>{" "}
            créneaux sélectionnés — choisissez {max} horaires dans la semaine.
          </div>
        )}
      </div>
    </div>
  );
}