"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import Header from "@/components/Header";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function Confirmation() {
  const params = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | success | processing | error

  useEffect(() => {
    const clientSecret = params.get("payment_intent_client_secret");

    // Pas de client_secret dans l'URL → on se rabat sur redirect_status
    if (!clientSecret) {
      const redirect = params.get("redirect_status");
      if (redirect === "succeeded") setStatus("success");
      else if (redirect === "processing") setStatus("processing");
      else setStatus("error");
      return;
    }

    // On vérifie le vrai statut du PaymentIntent auprès de Stripe
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
  }, [params]);

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <section
        style={{
          position: "relative",
          background: "var(--night)",
          color: "#fff",
          padding: "150px 0 90px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", top: "-200px", left: "50%",
            transform: "translateX(-50%)", width: 700, height: 500,
            background: "radial-gradient(circle, rgba(240,105,154,0.3), transparent 60%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 600, margin: "0 auto", padding: "0 26px" }}>
          {status === "success" && (
            <>
              <div style={iconWrap}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 style={{ fontSize: "2.2rem", marginBottom: 12 }}>Paiement confirmé !</h1>
              <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1.05rem" }}>
                Merci, votre paiement a bien été reçu. Vous allez recevoir un
                email de confirmation avec tous les détails.
              </p>
            </>
          )}
          {status === "processing" && (
            <>
              <h1 style={{ fontSize: "2.2rem", marginBottom: 12 }}>Paiement en cours…</h1>
              <p style={{ color: "rgba(255,255,255,0.72)" }}>
                Votre paiement est en cours de traitement. Vous recevrez une
                confirmation par email dès qu'il sera validé.
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <h1 style={{ fontSize: "2.2rem", marginBottom: 12 }}>Paiement non abouti</h1>
              <p style={{ color: "rgba(255,255,255,0.72)" }}>
                Votre paiement n'a pas pu être finalisé. Aucun montant n'a été
                débité. Vous pouvez réessayer.
              </p>
            </>
          )}
          {status === "loading" && (
            <p style={{ color: "rgba(255,255,255,0.72)" }}>Vérification du paiement…</p>
          )}

          <div style={{ marginTop: 34, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/" className="btn btn-rose">Retour à l'accueil</Link>
            {status === "success" && (
              <Link href="/compte" className="btn btn-outline">Accéder à mon espace</Link>
            )}
            {status === "error" && (
              <Link href="/reservation" className="btn btn-outline">Réessayer</Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

const iconWrap = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  background: "linear-gradient(150deg, #F0699A, #D64C7F)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 26px",
  boxShadow: "0 16px 40px rgba(214,76,127,0.4)",
};

export default function ConfirmationPage() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <Confirmation />
      </Suspense>
    </>
  );
}