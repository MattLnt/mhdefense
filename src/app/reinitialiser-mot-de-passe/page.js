"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import PasswordField, { isPasswordValid } from "@/components/PasswordField";

function Reinitialiser() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur(null);

    if (!isPasswordValid(password)) {
      setErreur("Le mot de passe ne respecte pas tous les critères.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      setDone(true);
      setLoading(false);
    } catch (e) {
      setErreur("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  // Token absent de l'URL
  if (!token) {
    return (
      <div style={styles.card}>
        <h1 style={styles.title}>Lien invalide</h1>
        <p style={styles.sub}>Ce lien de réinitialisation est incomplet ou invalide.</p>
        <Link href="/mot-de-passe-oublie" style={styles.btnLink}>
          Refaire une demande
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <Link href="/" style={styles.logo}>
        <img src="/images/logo-white.png" alt="MH Defense" style={{ height: 48 }} />
      </Link>

      {!done ? (
        <>
          <h1 style={styles.title}>Nouveau mot de passe</h1>
          <p style={styles.sub}>Choisissez un mot de passe sécurisé pour votre compte.</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.pwWrap}>
              <PasswordField
                id="new-password"
                value={password}
                onChange={setPassword}
              />
            </div>

            {erreur && <div style={styles.error}>{erreur}</div>}

            <button
              type="submit"
              disabled={loading || !isPasswordValid(password)}
              style={{
                ...styles.btn,
                opacity: loading || !isPasswordValid(password) ? 0.55 : 1,
                cursor: loading || !isPasswordValid(password) ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Enregistrement…" : "Réinitialiser mon mot de passe"}
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
          <h1 style={styles.title}>Mot de passe modifié</h1>
          <p style={styles.sub}>
            Votre mot de passe a bien été mis à jour. Vous pouvez maintenant vous
            connecter.
          </p>
          <button onClick={() => router.push("/connexion")} style={styles.btn}>
            Me connecter
          </button>
        </>
      )}
    </div>
  );
}

export default function ReinitialiserPage() {
  return (
    <main style={styles.page}>
      <div style={styles.bg} />
      <Suspense fallback={null}>
        <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 440 }}>
          <Reinitialiser />
        </div>
      </Suspense>
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
    width: "100%",
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
  form: { display: "flex", flexDirection: "column", gap: 20, textAlign: "left" },
  pwWrap: {
    background: "#fff",
    borderRadius: 16,
    padding: "18px 16px",
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
    width: "100%",
  },
  btnLink: {
    display: "inline-block",
    marginTop: 20,
    background: "var(--rose)",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: "0.95rem",
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
};