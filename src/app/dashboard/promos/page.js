"use client";

import { useState, useEffect } from "react";
import styles from "./Promos.module.css";

const SCOPE_LABEL = {
  ALL: "Tout",
  PONCTUEL: "Séances ponctuelles",
  ABONNEMENT: "Abonnements",
};

function formatReduction(p) {
  if (p.discountType === "PERCENT") return `-${p.discountValue} %`;
  return `-${Math.round(p.discountValue / 100)} €`;
}

function formatValidite(p) {
  const parts = [];
  if (p.startsAt) {
    parts.push(`dès le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(p.startsAt))}`);
  }
  if (p.endsAt) {
    parts.push(`jusqu'au ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(p.endsAt))}`);
  }
  return parts.join(" ");
}

export default function PromosPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulaire
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [scope, setScope] = useState("ALL");
  const [endsAt, setEndsAt] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  function charger() {
    setLoading(true);
    fetch("/api/admin/promos")
      .then((r) => (r.ok ? r.json() : { promos: [] }))
      .then((d) => setPromos(d.promos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    charger();
  }, []);

  async function creer() {
    setMsg(null);
    if (!code.trim() || !discountValue) {
      setMsg({ type: "error", text: "Le code et la valeur sont requis." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue,
          scope,
          endsAt: endsAt || null,
          maxRedemptions: maxRedemptions || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: d.error || "Erreur lors de la création." });
        setSaving(false);
        return;
      }
      // Reset + recharge
      setCode("");
      setDiscountValue("");
      setEndsAt("");
      setMaxRedemptions("");
      setMsg({ type: "success", text: "Code promo créé." });
      charger();
    } catch {
      setMsg({ type: "error", text: "Une erreur est survenue." });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(id, active) {
    try {
      const res = await fetch(`/api/admin/promos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        setPromos((prev) => prev.map((p) => (p.id === id ? { ...p, active } : p)));
      }
    } catch {}
  }

  async function supprimer(id) {
    if (!confirm("Supprimer ce code promo ?")) return;
    try {
      const res = await fetch(`/api/admin/promos/${id}`, { method: "DELETE" });
      if (res.ok) setPromos((prev) => prev.filter((p) => p.id !== id));
    } catch {}
  }

  return (
    <>
      <div className={styles.head}>
        <div className={styles.title}>Codes promo</div>
        <div className={styles.sub}>Créez et gérez vos réductions.</div>
      </div>

      <div className={styles.grid}>
        {/* Liste */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Codes existants</div>
          <div className={styles.panelSub}>Activez, désactivez ou supprimez vos codes.</div>

          {loading ? (
            <div className={styles.loading}>Chargement…</div>
          ) : promos.length === 0 ? (
            <div className={styles.empty}>Aucun code promo pour le moment.</div>
          ) : (
            promos.map((p) => {
              const validite = formatValidite(p);
              return (
                <div key={p.id} className={styles.promo}>
                  <span className={styles.code}>{p.code}</span>
                  <div className={styles.promoInfo}>
                    <h4>{formatReduction(p)}</h4>
                    <p>
                      {validite || "Sans limite de date"}
                      {p.maxRedemptions
                        ? ` · ${p.timesRedeemed}/${p.maxRedemptions} utilisés`
                        : p.timesRedeemed > 0
                        ? ` · ${p.timesRedeemed} utilisé${p.timesRedeemed > 1 ? "s" : ""}`
                        : ""}
                    </p>
                  </div>
                  <span className={styles.scopeTag}>{SCOPE_LABEL[p.scope]}</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={p.active}
                      onChange={(e) => toggle(p.id, e.target.checked)}
                    />
                    <span className={styles.slider} />
                  </label>
                  <button className={styles.del} onClick={() => supprimer(p.id)} aria-label="Supprimer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Création */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Nouveau code</div>
          <div className={styles.panelSub}>Créez une réduction personnalisée.</div>

          {msg && <div className={`${styles.message} ${styles[msg.type]}`}>{msg.text}</div>}

          <div className={`${styles.field} ${styles.codeInput}`}>
            <label>Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="RENTREE25"
              maxLength={24}
            />
          </div>

          <div className={styles.field}>
            <label>Type de réduction</label>
            <div className={styles.segRow}>
              <button
                className={`${styles.seg} ${discountType === "PERCENT" ? styles.on : ""}`}
                onClick={() => setDiscountType("PERCENT")}
              >
                Pourcentage
              </button>
              <button
                className={`${styles.seg} ${discountType === "FIXED" ? styles.on : ""}`}
                onClick={() => setDiscountType("FIXED")}
              >
                Montant fixe
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label>Valeur</label>
            <div className={styles.valueRow}>
              <div className={styles.valueInput}>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "PERCENT" ? "25" : "10"}
                />
                <span className={styles.unit}>{discountType === "PERCENT" ? "%" : "€"}</span>
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label>S'applique à</label>
            <div className={styles.segRow}>
              {[
                { k: "ALL", l: "Tout" },
                { k: "PONCTUEL", l: "Ponctuel" },
                { k: "ABONNEMENT", l: "Abo" },
              ].map((s) => (
                <button
                  key={s.k}
                  className={`${styles.seg} ${scope === s.k ? styles.on : ""}`}
                  onClick={() => setScope(s.k)}
                >
                  {s.l}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>Date d'expiration (optionnel)</label>
            <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>Nombre max d'utilisations (optionnel)</label>
            <input
              type="number"
              min="1"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="Illimité"
            />
          </div>

          <button className={styles.submit} onClick={creer} disabled={saving}>
            {saving ? "Création…" : "Créer le code"}
          </button>
        </div>
      </div>
    </>
  );
}