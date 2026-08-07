"use client";

import { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import styles from "./PaymentForm.module.css";

/**
 * Formulaire de paiement carte (Stripe Elements).
 * À monter dans un <Elements> parent qui fournit le clientSecret.
 * @param {number} amount     montant en centimes (pour le libellé du bouton)
 * @param {string} returnUrl  URL de retour après paiement validé
 */
export default function PaymentForm({ amount, returnUrl }) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErreur(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: { address: { country: "FR" } },
        },
      },
    });

    // On n'arrive ici qu'en cas d'erreur immédiate (carte refusée, champ
    // invalide). En cas de succès, Stripe redirige vers return_url.
    if (error) {
      setErreur(
        error.type === "card_error" || error.type === "validation_error"
          ? error.message
          : "Une erreur est survenue pendant le paiement."
      );
      setLoading(false);
    }
  }

  const euros = (amount / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
  });

  return (
    <form className={styles.pay} onSubmit={handleSubmit}>
      <div className={styles.title}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <path d="M2 10h20" />
        </svg>
        Coordonnées de paiement
      </div>
      <div className={styles.sub}>
        Vos informations bancaires sont chiffrées et sécurisées.
      </div>

      <div className={styles.element}>
        <PaymentElement
          options={{
            layout: "tabs",
            fields: { billingDetails: { address: { country: "never" } } },
          }}
        />
      </div>

      {erreur && (
        <div className={styles.error}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          <span>{erreur}</span>
        </div>
      )}

      <button className={styles.btn} disabled={!stripe || loading}>
        {loading ? (
          "Traitement…"
        ) : (
          <>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 018 0v3" />
            </svg>
            Payer {euros} €
          </>
        )}
      </button>

      <div className={styles.secure}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 018 0v3" />
        </svg>
        Paiement sécurisé · chiffrement SSL
      </div>
      <div className={styles.powered}>Propulsé par Stripe</div>
    </form>
  );
}