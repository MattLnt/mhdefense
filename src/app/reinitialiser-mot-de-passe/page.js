"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PasswordField, { isPasswordValid } from "@/components/PasswordField";
import styles from "../connexion/Connexion.module.css";

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
      <div className={styles.card}>
        <div className={styles.tag}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          Lien invalide
        </div>
        <h1 className={styles.title}>Lien invalide</h1>
        <p className={styles.sub}>Ce lien de réinitialisation est incomplet ou invalide.</p>
        <div className={styles.foot}>
          <Link href="/mot-de-passe-oublie">Refaire une demande</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      {!done ? (
        <form onSubmit={handleSubmit}>
          <div className={styles.tag}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 018 0v4" />
            </svg>
            Nouveau mot de passe
          </div>

          <h1 className={styles.title}>Choisissez un mot de passe</h1>
          <p className={styles.sub}>Un mot de passe sécurisé pour protéger votre compte.</p>

          {erreur && (
            <div className={styles.error}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5M12 16h.01" />
              </svg>
              <span>{erreur}</span>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="new-password">Mot de passe</label>
            <PasswordField
              id="new-password"
              value={password}
              onChange={setPassword}
              dark
            />
          </div>

          <button
            className={styles.submit}
            disabled={loading || !isPasswordValid(password)}
            style={{
              opacity: loading || !isPasswordValid(password) ? 0.55 : 1,
              cursor: loading || !isPasswordValid(password) ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Enregistrement…" : "Réinitialiser mon mot de passe"}
            {!loading && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>

          <div className={styles.foot}>
            <Link href="/connexion">← Retour à la connexion</Link>
          </div>
        </form>
      ) : (
        <>
          <div className={styles.tag}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Mot de passe modifié
          </div>

          <h1 className={styles.title}>C'est fait !</h1>
          <p className={styles.sub}>
            Votre mot de passe a bien été mis à jour. Vous pouvez maintenant vous
            connecter avec votre nouveau mot de passe.
          </p>

          <button className={styles.submit} onClick={() => router.push("/connexion")}>
            Me connecter
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

export default function ReinitialiserPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.brand} aria-label="MH Defense — accueil">
        <Image src="/images/logo-white.png" alt="MH Defense" width={140} height={140} />
      </Link>

      <Suspense fallback={null}>
        <Reinitialiser />
      </Suspense>
    </main>
  );
}