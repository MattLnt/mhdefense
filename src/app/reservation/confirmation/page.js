"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import SiteLayout from "@/components/SiteLayout";
import styles from "./Confirmation.module.css";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function Confirmation() {
  const params = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | success | processing | error

  const isEssai = params.get("essai") === "1";

  useEffect(() => {
    // Cas séance d'essai : pas de paiement, succès direct
    if (isEssai) {
      setStatus("success");
      return;
    }

    const clientSecret = params.get("payment_intent_client_secret");

    if (!clientSecret) {
      const redirect = params.get("redirect_status");
      if (redirect === "succeeded") setStatus("success");
      else if (redirect === "processing") setStatus("processing");
      else setStatus("error");
      return;
    }

    stripePromise.then((stripe) => {
      if (!stripe) {
        setStatus("error");
        return;
      }
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        switch (paymentIntent?.status) {
          case "succeeded":
            setStatus("success");
            break;
          case "processing":
            setStatus("processing");
            break;
          default:
            setStatus("error");
        }
      });
    });
  }, [params, isEssai]);

  return (
    <section className={styles.section}>
      <div className={styles.glow} />
      <div className={styles.inner}>
        {status === "loading" && (
          <p className={styles.checking}>Vérification du paiement…</p>
        )}

        {status === "success" && (
          <>
            <div className={styles.icon}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className={styles.title}>
              {isEssai ? "Séance d'essai réservée !" : "Paiement confirmé !"}
            </h1>
            <p className={styles.text}>
              {isEssai
                ? "Votre séance d'essai offerte est enregistrée. Vous allez recevoir un email avec l'adresse exacte et tous les détails."
                : "Merci, votre paiement a bien été reçu. Vous allez recevoir un email de confirmation avec tous les détails."}
            </p>
            <div className={styles.actions}>
              <Link href="/" className={styles.btnGhost}>Retour à l'accueil</Link>
              {!isEssai && (
                <Link href="/compte" className={styles.btnRose}>Accéder à mon espace</Link>
              )}
            </div>
          </>
        )}

        {status === "processing" && (
          <>
            <h1 className={styles.title}>Paiement en cours…</h1>
            <p className={styles.text}>
              Votre paiement est en cours de traitement. Vous recevrez une
              confirmation par email dès qu'il sera validé.
            </p>
            <div className={styles.actions}>
              <Link href="/" className={styles.btnGhost}>Retour à l'accueil</Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className={`${styles.icon} ${styles.iconError}`}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <h1 className={styles.title}>Paiement non abouti</h1>
            <p className={styles.text}>
              Votre paiement n'a pas pu être finalisé. Aucun montant n'a été
              débité. Vous pouvez réessayer.
            </p>
            <div className={styles.actions}>
              <Link href="/" className={styles.btnGhost}>Retour à l'accueil</Link>
              <Link href="/reservation" className={styles.btnRose}>Réessayer</Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default function ConfirmationPage() {
  return (
    <SiteLayout>
      <Suspense fallback={null}>
        <Confirmation />
      </Suspense>
    </SiteLayout>
  );
}