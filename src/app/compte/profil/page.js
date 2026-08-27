"use client";

import { useState, useEffect } from "react";
import styles from "./Profil.module.css";

function initiale(name) {
  return (name || "M").trim().charAt(0).toUpperCase();
}

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setName(d.user.name || "");
          setPhone(d.user.phone || "");
          setEmail(d.user.email || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function enregistrerInfos(e) {
    e.preventDefault();
    setInfoMsg(null);
    setSavingInfo(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const d = await res.json();
      if (!res.ok) {
        setInfoMsg({ type: "error", text: d.error || "Erreur lors de l'enregistrement." });
      } else {
        setInfoMsg({ type: "success", text: "Vos informations ont été mises à jour." });
      }
    } catch {
      setInfoMsg({ type: "error", text: "Une erreur est survenue." });
    } finally {
      setSavingInfo(false);
    }
  }

  async function changerMotDePasse(e) {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "error", text: "Les deux mots de passe ne correspondent pas." });
      return;
    }
    if (newPassword.length < 8) {
      setPwdMsg({ type: "error", text: "Le nouveau mot de passe doit faire au moins 8 caractères." });
      return;
    }

    setSavingPwd(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, currentPassword, newPassword }),
      });
      const d = await res.json();
      if (!res.ok) {
        setPwdMsg({ type: "error", text: d.error || "Erreur lors du changement." });
      } else {
        setPwdMsg({ type: "success", text: "Votre mot de passe a été modifié." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPwdMsg({ type: "error", text: "Une erreur est survenue." });
    } finally {
      setSavingPwd(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Chargement de votre profil…</div>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.title}>Mon profil</div>
        <div className={styles.sub}>Gérez vos informations personnelles et votre sécurité.</div>
      </div>

      {/* En-tête profil */}
      <div className={styles.hero}>
        <div className={styles.heroAvatar}>{initiale(name)}</div>
        <div className={styles.heroInfo}>
          <b>{name || "Mon compte"}</b>
          <span>{email}</span>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Informations */}
        <form className={styles.card} onSubmit={enregistrerInfos}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <div>
              <div className={styles.cardTitle}>Mes informations</div>
              <div className={styles.cardSub}>Utilisées pour vos réservations.</div>
            </div>
          </div>

          {infoMsg && (
            <div className={`${styles.message} ${styles[infoMsg.type]}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                {infoMsg.type === "success" ? (
                  <path d="M20 6L9 17l-5-5" />
                ) : (
                  <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>
                )}
              </svg>
              <span>{infoMsg.text}</span>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="name">Nom et prénom</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Marie Dupont" />
          </div>
          <div className={styles.field}>
            <label htmlFor="phone">Téléphone</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" />
          </div>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input id="email" value={email} disabled />
            <div className={styles.hint}>L'adresse email ne peut pas être modifiée.</div>
          </div>

          <button className={styles.submit} disabled={savingInfo}>
            {savingInfo ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>

        {/* Mot de passe */}
        <form className={styles.card} onSubmit={changerMotDePasse}>
          <div className={styles.cardHead}>
            <div className={styles.cardIcon}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" />
              </svg>
            </div>
            <div>
              <div className={styles.cardTitle}>Mot de passe</div>
              <div className={styles.cardSub}>Au moins 8 caractères.</div>
            </div>
          </div>

          {pwdMsg && (
            <div className={`${styles.message} ${styles[pwdMsg.type]}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                {pwdMsg.type === "success" ? (
                  <path d="M20 6L9 17l-5-5" />
                ) : (
                  <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>
                )}
              </svg>
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="current">Mot de passe actuel</label>
            <input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className={styles.field}>
            <label htmlFor="new">Nouveau mot de passe</label>
            <input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className={styles.field}>
            <label htmlFor="confirm">Confirmer le nouveau mot de passe</label>
            <input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <button className={styles.submit} disabled={savingPwd}>
            {savingPwd ? "Modification…" : "Modifier le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}