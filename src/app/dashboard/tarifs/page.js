"use client";

import { useState, useEffect } from "react";
import styles from "./Tarifs.module.css";

const TYPES = [
  { key: "INDIVIDUEL", label: "Individuel", note: "1 personne" },
  { key: "DUO", label: "Duo", note: "par personne" },
  { key: "GROUPE", label: "Petit groupe", note: "par personne" },
];

const PLAN_KEYS = [
  { key: "SILVER", label: "Silver", note: "1 mois" },
  { key: "GOLD", label: "Gold", note: "3 mois" },
  { key: "PLATINUM", label: "Platinum", note: "6 mois" },
];

// centimes → euros affichés (ex: 4500 → "45", 4550 → "45,50")
const toEuros = (cents) => {
  const e = cents / 100;
  return Number.isInteger(e) ? e.toString() : e.toFixed(2).replace(".", ",");
};

/**
 * Champ prix premium : boutons − / + custom, accepte les centimes (virgule ou point).
 * value : chaîne en euros (ex "45" ou "45,50"). onChange renvoie la chaîne.
 */
function PriceInput({ value, onChange }) {
  // Normalise la saisie : chiffres + un seul séparateur décimal, 2 décimales max
  function handleInput(v) {
    let s = v.replace(/[^\d.,]/g, "").replace(".", ",");
    const parts = s.split(",");
    if (parts.length > 2) s = parts[0] + "," + parts.slice(1).join("");
    const [ent, dec] = s.split(",");
    if (dec !== undefined) s = ent + "," + dec.slice(0, 2);
    onChange(s);
  }

  function step(delta) {
    const current = parseFloat((value || "0").replace(",", ".")) || 0;
    const next = Math.max(0, current + delta);
    onChange(Number.isInteger(next) ? next.toString() : next.toFixed(2).replace(".", ","));
  }

  return (
    <div className={styles.priceInput}>
      <button type="button" className={styles.stepBtn} onClick={() => step(-1)} aria-label="Diminuer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M5 12h14" />
        </svg>
      </button>
      <div className={styles.priceField}>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="0"
        />
        <span className={styles.euro}>€</span>
      </div>
      <button type="button" className={styles.stepBtn} onClick={() => step(1)} aria-label="Augmenter">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

export default function TarifsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [ponctuel, setPonctuel] = useState({ INDIVIDUEL: "", DUO: "", GROUPE: "" });
  // plans indexés : { "SESSIONTYPE_KEY_FREQ": { id, price(euros) } }
  const [plans, setPlans] = useState({});

  useEffect(() => {
    fetch("/api/admin/pricing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setPonctuel({
          INDIVIDUEL: toEuros(d.ponctuel.INDIVIDUEL),
          DUO: toEuros(d.ponctuel.DUO),
          GROUPE: toEuros(d.ponctuel.GROUPE),
        });
        const map = {};
        for (const p of d.plans) {
          map[`${p.sessionType}_${p.key}_${p.frequency}`] = {
            id: p.id,
            price: toEuros(p.price),
          };
        }
        setPlans(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function setPlanPrice(sessionType, key, freq, value) {
    const k = `${sessionType}_${key}_${freq}`;
    setPlans((prev) => ({ ...prev, [k]: { ...prev[k], price: value } }));
  }

  async function enregistrer() {
    setMsg(null);
    setSaving(true);
    const plansPayload = Object.values(plans).map((p) => ({ id: p.id, price: p.price }));
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ponctuel, plans: plansPayload }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: d.error || "Erreur lors de l'enregistrement." });
      } else {
        setMsg({ type: "success", text: "Tarifs enregistrés." });
      }
    } catch {
      setMsg({ type: "error", text: "Une erreur est survenue." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Chargement des tarifs…</div>;
  }

  return (
    <>
      <div className={styles.head}>
        <div>
          <div className={styles.title}>Tarifs</div>
          <div className={styles.sub}>Modifiez vos prix. Ils s'appliquent immédiatement.</div>
        </div>
        <button className={styles.saveBtn} onClick={enregistrer} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer les tarifs"}
        </button>
      </div>

      {msg && (
        <div className={`${styles.message} ${styles[msg.type]}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            {msg.type === "success" ? <path d="M20 6L9 17l-5-5" /> : <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>}
          </svg>
          <span>{msg.text}</span>
        </div>
      )}

      {/* Prix ponctuels */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Séances à l'unité</div>
        <div className={styles.panelSub}>Prix d'une séance ponctuelle (duo et groupe : par personne).</div>

        <div className={styles.ponctuelGrid}>
          {TYPES.map((t) => (
            <div key={t.key} className={styles.priceCard}>
              <label>{t.label} <span style={{ fontWeight: 400 }}>· {t.note}</span></label>
              <PriceInput
                value={ponctuel[t.key]}
                onChange={(v) => setPonctuel((p) => ({ ...p, [t.key]: v }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Abonnements */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Abonnements mensuels</div>
        <div className={styles.panelSub}>
          Prix par personne et par mois, selon la formule et le rythme.
        </div>

        {TYPES.map((t) => (
          <div key={t.key} className={styles.aboSection}>
            <div className={styles.aboSectionTitle}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M12 2l2.4 6.9H21l-5.3 4 2 6.9-5.7-4.2L6.3 19.8l2-6.9L3 8.9h6.6z" />
              </svg>
              {t.label}
              <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.8rem" }}>
                · {t.note}
              </span>
            </div>

            <div className={styles.aboTable}>
              <div className={styles.aboGrid}>
                {/* En-têtes */}
                <div className={`${styles.aboHeader} ${styles.aboHeaderLeft}`}>Formule</div>
                <div className={styles.aboHeader}>1× / semaine</div>
                <div className={styles.aboHeader}>2× / semaine</div>

                {/* Lignes par formule */}
                {PLAN_KEYS.map((pk) => {
                  const once = plans[`${t.key}_${pk.key}_ONCE`];
                  const twice = plans[`${t.key}_${pk.key}_TWICE`];
                  return (
                    <div key={pk.key} className={styles.aboRow}>
                      <div className={styles.aboRowLabel}>
                        {pk.label}
                        <span>{pk.note}</span>
                      </div>
                      <div className={styles.aboCell}>
                        <PriceInput
                          value={once?.price ?? ""}
                          onChange={(v) => setPlanPrice(t.key, pk.key, "ONCE", v)}
                        />
                      </div>
                      <div className={styles.aboCell}>
                        <PriceInput
                          value={twice?.price ?? ""}
                          onChange={(v) => setPlanPrice(t.key, pk.key, "TWICE", v)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}