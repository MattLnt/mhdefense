"use client";

import { useState } from "react";
import Link from "next/link";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      setSent(true);
      setLoading(false);
    } catch (e) {
      setErreur("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.card}>
        <Link href="/" style={styles.logo}>
          <img src="/images/logo-white.png" alt="MH Defense" style={{ height: 48 }} />
        </Link>

        {!sent ? (
          <>
            <h1 style={styles.title}>Mot de passe oublié ?</h1>
            <p style={styles.sub}>
              Saisissez votre email, nous vous enverrons un lien pour réinitialiser
              votre mot de passe.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label htmlFor="email" style={styles.label}>Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marie@exemple.fr"
                  required
                  style={styles.input}
                />
              </div>

              {erreur && <div style={styles.error}>{erreur}</div>}

              <button type="submit" disabled={loading} style={styles.btn}>
                {loading ? "Envoi…" : "Envoyer le lien"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={styles.checkIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 style={styles.title}>Email envoyé</h1>
            <p style={styles.sub}>
              Si un compte existe avec cette adresse, vous recevrez un email avec
              un lien de réinitialisation. Pensez à vérifier vos spams.
            </p>
          </>
        )}

        <Link href="/connexion" style={styles.backLink}>
          ← Retour à la connexion
        </Link>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--night)",
    position: "relative",
    padding: "24px",
    overflow: "hidden",
  },
  bg: {
    position: "absolute",
    top: "-200px",
    left: "50%",
    transform: "translateX(-50%)",
    width: 800,
    height: 600,
    background: "radial-gradient(circle, rgba(240,105,154,0.28), transparent 60%)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 420,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 24,
    padding: "44px 38px",
    textAlign: "center",
    backdropFilter: "blur(10px)",
  },
  logo: { display: "inline-block", marginBottom: 28 },
  title: { color: "#fff", fontSize: "1.7rem", marginBottom: 12 },
  sub: { color: "rgba(255,255,255,0.65)", fontSize: "0.95rem", marginBottom: 28, lineHeight: 1.6 },
  form: { display: "flex", flexDirection: "column", gap: 18, textAlign: "left" },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", fontWeight: 600 },
  input: {
    padding: "13px 15px",
    borderRadius: 12,
    border: "1.5px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: "0.95rem",
    fontFamily: "inherit",
  },
  error: {
    background: "rgba(224,72,77,0.15)",
    color: "#ff9ba0",
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: "0.88rem",
  },
  btn: {
    background: "var(--rose)",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: "0.98rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  checkIcon: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    background: "linear-gradient(150deg, #F0699A, #D64C7F)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  },
  backLink: {
    display: "inline-block",
    marginTop: 26,
    color: "rgba(255,255,255,0.6)",
    fontSize: "0.9rem",
  },
};