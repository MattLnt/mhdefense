"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import styles from "./UpdateCardModal.module.css";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const stripeAppearance = {
  theme: "flat",
  variables: {
    colorPrimary: "#D64C7F",
    colorText: "#1A1414",
    colorTextSecondary: "#8B7E7C",
    colorBackground: "#ffffff",
    colorDanger: "#b0234a",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: "1.5px solid #ECE4E3", padding: "13px 15px", boxShadow: "none" },
    ".Input:focus": { border: "1.5px solid #D64C7F", boxShadow: "0 0 0 3px rgba(214,76,127,0.09)" },
    ".Label": { fontWeight: "600", fontSize: "0.84rem", color: "#574c4b" },
    ".Tab": { border: "1.5px solid #ECE4E3", boxShadow: "none" },
    ".Tab--selected": { border: "1.5px solid #D64C7F", boxShadow: "0 0 0 2px rgba(214,76,127,0.1)" },
  },
};

/* ---------- Formulaire interne (dans <Elements>) ---------- */
function CardForm({ onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setErreur(null);

    // Enregistre la carte (SetupIntent), sans redirection si possible
    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
      confirmParams: {
        payment_method_data: {
          billing_details: { address: { country: "FR" } },
        },
      },
    });

    if (error) {
      setErreur(
        error.type === "card_error" || error.type === "validation_error"
          ? error.message
          : "Une erreur est survenue. Réessayez."
      );
      setLoading(false);
      return;
    }

    // Carte enregistrée → on la définit comme carte par défaut
    try {
      const res = await fetch("/api/me/subscription/set-default-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: setupIntent.payment_method }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErreur(d.error || "Carte enregistrée mais non appliquée. Réessayez.");
        setLoading(false);
        return;
      }
      onSuccess();
    } catch {
      setErreur("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.element}>
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: { link: "never", applePay: "auto", googlePay: "auto" },
            fields: {
              billingDetails: {
                name: "never",
                email: "never",
                phone: "never",
                address: { country: "never" },
              },
            },
          }}
        />
      </div>

      {erreur && (
        <div className={styles.error}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
          </svg>
          <span>{erreur}</span>
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.ghost} onClick={onClose} disabled={loading}>
          Retour
        </button>
        <button type="submit" className={styles.submit} disabled={!stripe || loading}>
          {loading ? "Enregistrement…" : "Enregistrer la carte"}
        </button>
      </div>

      <div className={styles.secure}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 018 0v3" />
        </svg>
        Paiement sécurisé · chiffrement SSL
      </div>
    </form>
  );
}

/* ---------- Modale ---------- */
export default function UpdateCardModal({ clientSecret, onClose, onSuccess }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <h3>Mettre à jour ma carte</h3>
          <button className={styles.close} onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className={styles.intro}>
          Votre nouvelle carte remplacera l'actuelle pour les prochains prélèvements mensuels.
        </p>

        <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
          <CardForm onSuccess={onSuccess} onClose={onClose} />
        </Elements>
      </div>
    </div>
  );
}