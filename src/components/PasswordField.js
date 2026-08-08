"use client";

import { useState } from "react";
import styles from "./PasswordField.module.css";

// Les 4 règles de validation
const RULES = [
  { key: "length", label: "9 caractères min.", test: (v) => v.length >= 9 },
  { key: "digit", label: "Un chiffre", test: (v) => /\d/.test(v) },
  { key: "upper", label: "Une majuscule", test: (v) => /[A-Z]/.test(v) },
  { key: "symbol", label: "Un symbole (!@#…)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

/**
 * Renvoie true si le mot de passe respecte toutes les règles.
 */
export function isPasswordValid(value) {
  return RULES.every((r) => r.test(value || ""));
}

const Check = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

/**
 * Champ mot de passe avec œil, indicateur de force et check-list des règles.
 * @param {boolean} dark  variante sombre (pour fond sombre)
 */
export default function PasswordField({ value, onChange, id = "password", placeholder = "••••••••", dark = false }) {
  const [show, setShow] = useState(false);

  const passed = RULES.filter((r) => r.test(value || "")).length;

  let levelLabel = "";
  let fillPct = 0;
  if (value) {
    if (passed <= 1) { levelLabel = "Faible"; fillPct = 33; }
    else if (passed <= 3) { levelLabel = "Moyen"; fillPct = 66; }
    else { levelLabel = "Fort"; fillPct = 100; }
  }

  const wrapClass = dark ? `${styles.wrap} ${styles.dark}` : styles.wrap;

  return (
    <div className={wrapClass}>
      <div className={styles.inputRow}>
        <svg className={styles.lock} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 018 0v4" />
        </svg>
        <input
          id={id}
          className={styles.input}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
        />
        <button
          type="button"
          className={styles.eye}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M17.9 17.9A10.4 10.4 0 0112 20C5 20 1 12 1 12a18.5 18.5 0 015.1-6M9.9 4.2A9.1 9.1 0 0112 4c7 0 11 8 11 8a18.3 18.3 0 01-2.2 3.2M1 1l22 22M9.9 9.9a3 3 0 004.2 4.2" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {/* Barre de force */}
      {value && (
        <div className={styles.strength}>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${fillPct}%` }} />
          </div>
          <span className={styles.strengthLabel}>{levelLabel}</span>
        </div>
      )}

      {/* Check-list des règles */}
      <div className={styles.rules}>
        {RULES.map((r) => {
          const ok = r.test(value || "");
          return (
            <div key={r.key} className={`${styles.rule} ${ok ? styles.ruleOk : ""}`}>
              <span className={styles.ruleIcon}>{ok && <Check />}</span>
              {r.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}