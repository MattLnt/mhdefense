"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./Connexion.module.css";

function ConnexionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/compte";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setErreur("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <div className={styles.tag}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Connexion sécurisée
      </div>

      <h1 className={styles.title}>Mon espace</h1>
      <p className={styles.sub}>Connectez-vous pour gérer vos séances.</p>

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

      <div className={`${styles.field} ${styles.withForgot}`}>
        <div className={styles.labelRow}>
          <label htmlFor="password">Mot de passe</label>
          <Link href="/mot-de-passe-oublie" className={styles.forgot}>
            Oublié ?
          </Link>
        </div>
        <div className={styles.inputWrap}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 018 0v4" />
          </svg>
          <input
            id="password"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            className={styles.eye}
            onClick={() => setShowPwd((s) => !s)}
            aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPwd ? (
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
      </div>

      <button className={styles.submit} disabled={loading}>
        {loading ? "Connexion…" : "Se connecter"}
        {!loading && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>

      <div className={styles.sep}>nouveau ici ?</div>

      <div className={styles.foot}>
        Pas encore membre ?{" "}
        <Link href="/reservation">Réserver une séance</Link>
      </div>
    </form>
  );
}

export default function ConnexionPage() {
  return (
    <main className={styles.page}>
      <Link href="/" className={styles.brand} aria-label="MH Defense — accueil">
        <Image src="/images/logo-white.svg" alt="MH Defense" width={220} height={110} />
      </Link>

      <Suspense fallback={null}>
        <ConnexionForm />
      </Suspense>
    </main>
  );
}