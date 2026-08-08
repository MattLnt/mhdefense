"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../connexion/Connexion.module.css";

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
    <main className={styles.page}>
      <Link href="/" className={styles.brand} aria-label="MH Defense — accueil">
        <Image src="/images/logo-white.png" alt="MH Defense" width={140} height={140} />
      </Link>

      <div className={styles.card}>
        {!sent ? (
          <form onSubmit={handleSubmit}>
            <div className={styles.tag}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 018 0v4" />
              </svg>
              Réinitialisation
            </div>

            <h1 className={styles.title}>Mot de passe oublié ?</h1>
            <p className={styles.sub}>
              Saisissez votre email, nous vous enverrons un lien de réinitialisation.
            </p>

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
              <label htmlFor="email">Email</label>
              <div className={styles.inputWrap}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marie@exemple.fr"
                  required
                />
              </div>
            </div>

            <button className={styles.submit} disabled={loading}>
              {loading ? "Envoi…" : "Envoyer le lien"}
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
              Email envoyé
            </div>

            <h1 className={styles.title}>Vérifiez vos emails</h1>
            <p className={styles.sub}>
              Si un compte existe avec cette adresse, vous recevrez un lien de
              réinitialisation dans quelques instants. Pensez à vérifier vos spams.
            </p>

            <div className={styles.foot}>
              <Link href="/connexion">← Retour à la connexion</Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}