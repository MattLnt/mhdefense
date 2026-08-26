"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Link from "next/link";
import PaymentForm from "@/components/PaymentForm";
import { useReservation, PLANS } from "./ReservationContext";
import { Check, Info, Lock } from "./icons";
import styles from "../Reservation.module.css";

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

export default function StepPaiement() {
  const {
    mode, isAbo, isEssai, plan, paiement, setPaiement,
    clientSecret, payAmount, returnUrl, erreur,
    promoInput, setPromoInput, promo, promoLoading, promoError,
    appliquerCodePromo, resetPromo, totalApresPromo,
    cgvAccepte, setCgvAccepte,
  } = useReservation();

  const acompte = Math.round(totalApresPromo / 2);

  return (
    <>
      <div className={styles.qTitle}>{isEssai ? "Confirmez votre séance d'essai" : "Vérifiez et confirmez"}</div>
      <div className={styles.qSub}>
        {isEssai
          ? "Séance découverte offerte, sans paiement."
          : isAbo
          ? "Un récapitulatif avant le paiement de la première mensualité."
          : "Un récapitulatif avant le paiement sécurisé."}
      </div>

      {/* Code promo */}
      {!isEssai && !clientSecret && (
        <div className={styles.promoBox}>
          {!promo ? (
            <>
              <div className={styles.promoRow}>
                <input
                  className={styles.promoInput}
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Code promo"
                  maxLength={24}
                />
                <button
                  className={styles.promoBtn}
                  onClick={appliquerCodePromo}
                  disabled={promoLoading || !promoInput.trim()}
                  type="button"
                >
                  {promoLoading ? "…" : "Appliquer"}
                </button>
              </div>
              {promoError && <div className={styles.promoError}>{promoError}</div>}
            </>
          ) : (
            <div className={styles.promoApplied}>
              <span><Check /> Code <b>{promo.code}</b> appliqué ({promo.label}){isAbo && " sur le 1ᵉʳ mois"}</span>
              <button className={styles.promoRemove} onClick={resetPromo} type="button">Retirer</button>
            </div>
          )}
        </div>
      )}

      {/* Mode de paiement (ponctuel) */}
      {mode === "PONCTUEL" && !clientSecret && (
        <div className={styles.block}>
          <div className={styles.blockTitle}>Mode de paiement</div>
          <div className={styles.qSub} style={{ marginBottom: 16 }}>Réglez la totalité ou un acompte pour bloquer le créneau.</div>
          <div className={`${styles.options} ${styles.options2}`}>
            <button className={`${styles.option} ${paiement === "COMPTANT" ? styles.optionOn : ""}`} onClick={() => setPaiement("COMPTANT")}>
              <div className={styles.optionText}>
                <div className={styles.optionName}>Comptant</div>
                <div className={styles.optionDesc}>La totalité maintenant</div>
              </div>
              <div className={styles.optionPrice}>{totalApresPromo} €</div>
            </button>
            <button className={`${styles.option} ${paiement === "ACOMPTE" ? styles.optionOn : ""}`} onClick={() => setPaiement("ACOMPTE")}>
              <div className={styles.optionText}>
                <div className={styles.optionName}>Acompte 50 %</div>
                <div className={styles.optionDesc}>Le solde sur place</div>
              </div>
              <div className={styles.optionPrice}>{acompte} €<span>puis {totalApresPromo - acompte} €</span></div>
            </button>
          </div>
        </div>
      )}

      {/* Case CGV (obligatoire avant paiement / confirmation) */}
      {!clientSecret && (
        <label className={styles.cgvRow}>
          <input
            type="checkbox"
            checked={cgvAccepte}
            onChange={(e) => setCgvAccepte(e.target.checked)}
            className={styles.cgvCheck}
          />
          <span>
            J'ai lu et j'accepte les{" "}
            <Link href="/cgv" target="_blank" rel="noopener noreferrer">conditions générales de vente</Link>.
          </span>
        </label>
      )}

      {/* Stripe */}
      {clientSecret && (
        <div className={styles.block}>
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
            <PaymentForm amount={payAmount} returnUrl={returnUrl} />
          </Elements>
        </div>
      )}

      {/* Note */}
      {!clientSecret && (
        <div className={styles.note}>
          <Info />
          <span>
            {isEssai
              ? "Séance offerte, aucun paiement requis. Un essai gratuit par personne. L'adresse exacte vous sera envoyée par email."
              : isAbo
              ? `Engagement de ${PLANS.find((p) => p.key === plan).months} mois. La première mensualité est prélevée maintenant, puis chaque mois. Une demande de résiliation prend effet à l'échéance de l'engagement.`
              : "Le créneau est bloqué dès validation du paiement. L'adresse exacte vous sera envoyée par email."}
          </span>
        </div>
      )}

      {erreur && (
        <div className={styles.note} style={{ background: "#fdecef", color: "#b0234a", marginTop: 14 }}>
          <Info />
          <span>{erreur}</span>
        </div>
      )}

      {!isEssai && !clientSecret && (
        <div className={styles.secure}>
          <Lock /> Paiement sécurisé via Stripe
        </div>
      )}
    </>
  );
}