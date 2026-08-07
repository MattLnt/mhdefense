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
      <Image
        src="/images/logo.png"
        alt="MH Defense"
        width={120}
        height={120}
        className={styles.logo}
      />

      <h1 className={styles.title}>Connexion</h1>
      <p className={styles.sub}>Accédez à votre espace membre.</p>

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
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="marie@exemple.fr"
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <button className={styles.submit} disabled={loading}>
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      <div className={styles.foot}>
        Pas encore de compte ?{" "}
        <Link href="/reservation">Souscrire un abonnement</Link>
      </div>
    </form>
  );
}

export default function ConnexionPage() {
  return (
    <main className={styles.page}>
      <Suspense fallback={null}>
        <ConnexionForm />
      </Suspense>
    </main>
  );
}