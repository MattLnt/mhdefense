"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Header from "@/components/Header";
import SlotPicker from "@/components/SlotPicker";
import PaymentForm from "@/components/PaymentForm";
import styles from "./Reservation.module.css";

// Instance Stripe (clé publique) — chargée une seule fois hors du composant.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Thème des Stripe Elements, accordé aux couleurs du site.
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
    ".Input": {
      border: "1.5px solid #ECE4E3",
      padding: "13px 15px",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1.5px solid #D64C7F",
      boxShadow: "0 0 0 3px rgba(214,76,127,0.09)",
    },
    ".Label": {
      fontWeight: "600",
      fontSize: "0.84rem",
      color: "#574c4b",
    },
    ".Tab": {
      border: "1.5px solid #ECE4E3",
      boxShadow: "none",
    },
    ".Tab--selected": {
      border: "1.5px solid #D64C7F",
      boxShadow: "0 0 0 2px rgba(214,76,127,0.1)",
    },
  },
};

/* ---------- Données ---------- */

const TYPES = [
  { key: "INDIVIDUEL", name: "Individuel", desc: "1 personne", prixPonctuel: 60, personnes: 1 },
  { key: "DUO", name: "Duo", desc: "2 personnes", prixPonctuel: 45, personnes: 2 },
  { key: "GROUPE", name: "Petit groupe", desc: "3 personnes max", prixPonctuel: 45, personnes: 3 },
];

const PLANS = [
  { key: "SILVER", name: "Silver", months: 1, desc: "1 mois" },
  { key: "GOLD", name: "Gold", months: 3, desc: "3 mois" },
  { key: "PLATINUM", name: "Platinum", months: 6, desc: "6 mois" },
];

const PRIX_ABO = {
  INDIVIDUEL: { SILVER: { 1: 200, 2: 360 }, GOLD: { 1: 190, 2: 340 }, PLATINUM: { 1: 180, 2: 320 } },
  DUO: { SILVER: { 1: 160, 2: 280 }, GOLD: { 1: 150, 2: 260 }, PLATINUM: { 1: 140, 2: 240 } },
  GROUPE: { SILVER: { 1: 160, 2: 280 }, GOLD: { 1: 150, 2: 260 }, PLATINUM: { 1: 140, 2: 240 } },
};

const STEP_LABELS = ["Votre choix", "Formule", "Créneau", "Vos informations", "Paiement"];

const Arrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const Info = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

/* ---------- Page ---------- */

export default function ReservationPage() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null); // PONCTUEL | ABONNEMENT | ESSAI

  const [type, setType] = useState("INDIVIDUEL");
  const [freq, setFreq] = useState(1);
  const [plan, setPlan] = useState("GOLD");
  const [slots, setSlots] = useState([]);
  const [paiement, setPaiement] = useState("COMPTANT");

  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);

  // Paiement : secret client + montant, une fois le PaymentIntent créé
  const [clientSecret, setClientSecret] = useState(null);
  const [payAmount, setPayAmount] = useState(0);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", p2Name: "", p3Name: "",
  });

  const isAbo = mode === "ABONNEMENT";
  const isEssai = mode === "ESSAI";
  const typeInfo = TYPES.find((t) => t.key === type);
  const nbPersonnes = isEssai ? 1 : typeInfo.personnes;
  const maxSlots = isAbo ? freq : 1;

  const prixUnitaire = isAbo ? PRIX_ABO[type][plan][freq] : typeInfo.prixPonctuel;
  const total = isEssai ? 0 : prixUnitaire * nbPersonnes;
  const aPayer = isEssai ? 0 : isAbo ? total : paiement === "ACOMPTE" ? Math.round(total / 2) : total;

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function choisir(m) {
    setMode(m);
    setSlots([]);
    if (m === "ESSAI") setType("INDIVIDUEL");
    setStep(1);
  }

  // Prépare le paiement : bloque le créneau + crée le PaymentIntent,
  // puis affiche le formulaire de carte (sans quitter la page).
  async function preparerPaiement() {
    setErreur(null);
    setLoading(true);
    try {
      const holdRes = await fetch("/api/booking/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: slots[0],
          type: "PONCTUEL",
          sessionType: type,
          participantsCount: nbPersonnes,
          isFreeTrial: false,
        }),
      });
      const holdData = await holdRes.json();
      if (!holdRes.ok) {
        setErreur(holdData.error || "Ce créneau n'est plus disponible.");
        setLoading(false);
        return;
      }

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: holdData.booking.id, mode: paiement }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        setErreur(checkoutData.error || "Impossible de préparer le paiement.");
        setLoading(false);
        return;
      }

      setClientSecret(checkoutData.clientSecret);
      setPayAmount(checkoutData.amount);
      setLoading(false);
    } catch (e) {
      setErreur("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  const canNext =
    step === 0 ? mode !== null
    : step === 1 ? true
    : step === 2 ? slots.length === maxSlots
    : step === 3 ? form.name && form.email && form.phone && (!isAbo || form.password.length >= 8)
    : true;

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/reservation/confirmation`
      : "/reservation/confirmation";

  return (
    <>
      <Header />
      <main className={styles.page}>
        {/* Bandeau */}
        <section className={styles.top}>
          <div className={`${styles.narrow} ${styles.topInner}`}>
            <h1>
              Réservez <span>votre séance</span>
            </h1>
            <p>Simple, rapide et sécurisé.</p>
            <div className={styles.prog}>
              <div className={styles.progBar}>
                <div className={styles.progFill} style={{ width: `${((step + 1) / 5) * 100}%` }} />
              </div>
              <div className={styles.progLabel}>
                Étape <b>{step + 1}</b> sur 5 · {STEP_LABELS[step]}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.body}>
          <div className={styles.narrow}>
            {/* 1. Choix du parcours */}
            {step === 0 && (
              <>
                <div className={styles.qTitle}>Que souhaitez-vous faire ?</div>
                <div className={styles.qSub}>
                  Choisissez la formule qui vous convient, vous pourrez tout
                  ajuster ensuite.
                </div>

                <div className={styles.choices}>
                  <button className={styles.choice} onClick={() => choisir("PONCTUEL")}>
                    <div className={styles.choiceIcon}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="5" width="18" height="16" rx="3" />
                        <path d="M3 10h18M8 3v4M16 3v4" />
                      </svg>
                    </div>
                    <h3>Une séance à l'unité</h3>
                    <p>Réservez ponctuellement, quand vous le souhaitez. Sans compte ni engagement.</p>
                    <div className={styles.choiceMeta}>
                      <span className={styles.choicePrice}>dès 45 €<span> / personne</span></span>
                      <span className={styles.choiceArrow}>Choisir <Arrow /></span>
                    </div>
                  </button>

                  <button className={styles.choice} onClick={() => choisir("ABONNEMENT")}>
                    <div className={styles.choiceIcon}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 2l2.4 6.9H21l-5.3 4 2 6.9-5.7-4.2L6.3 19.8l2-6.9L3 8.9h6.6z" />
                      </svg>
                    </div>
                    <h3>Un abonnement mensuel</h3>
                    <p>Un rythme régulier à tarif dégressif. 1 ou 2 séances par semaine.</p>
                    <div className={styles.choiceMeta}>
                      <span className={styles.choicePrice}>dès 140 €<span> / mois</span></span>
                      <span className={styles.choiceArrow}>Choisir <Arrow /></span>
                    </div>
                  </button>
                </div>

                <div className={styles.trial}>
                  C'est votre première fois ?{" "}
                  <button className={styles.trialLink} onClick={() => choisir("ESSAI")}>
                    Réservez votre séance d'essai offerte →
                  </button>
                </div>
              </>
            )}

            {/* 2. Formule */}
            {step === 1 && (
              <>
                <div className={styles.qTitle}>Quel type de séance ?</div>
                <div className={styles.qSub}>
                  {isEssai
                    ? "La séance d'essai offerte est individuelle."
                    : "Le tarif s'adapte au nombre de participants."}
                </div>
                <div className={styles.options}>
                  {TYPES.map((t) => (
                    <button
                      key={t.key}
                      className={`${styles.option} ${type === t.key ? styles.optionOn : ""}`}
                      onClick={() => setType(t.key)}
                      disabled={isEssai && t.key !== "INDIVIDUEL"}
                    >
                      <span className={styles.radio} />
                      <div className={styles.optionName}>{t.name}</div>
                      <div className={styles.optionDesc}>{t.desc}</div>
                      {!isEssai && (
                        <div className={styles.optionPrice}>
                          {isAbo ? PRIX_ABO[t.key][plan][freq] : t.prixPonctuel} €
                          <span>
                            {isAbo
                              ? ` / mois${t.key !== "INDIVIDUEL" ? " / pers." : ""}`
                              : t.key === "INDIVIDUEL"
                              ? " / séance"
                              : " / personne"}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {isAbo && (
                  <>
                    <div className={styles.block}>
                      <div className={styles.blockTitle}>Votre rythme</div>
                      <div className={styles.qSub}>Le nombre de séances incluses chaque semaine.</div>
                      <div className={`${styles.options} ${styles.options2}`}>
                        {[1, 2].map((f) => (
                          <button
                            key={f}
                            className={`${styles.option} ${freq === f ? styles.optionOn : ""}`}
                            onClick={() => { setFreq(f); setSlots([]); }}
                          >
                            <span className={styles.radio} />
                            <div className={styles.optionName}>{f} séance{f > 1 ? "s" : ""} / semaine</div>
                            <div className={styles.optionDesc}>
                              {f === 1 ? "Un rendez-vous hebdomadaire" : "Progression accélérée"}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.block}>
                      <div className={styles.blockTitle}>Durée d'engagement</div>
                      <div className={styles.qSub}>Plus l'engagement est long, plus le tarif baisse.</div>
                      <div className={styles.options}>
                        {PLANS.map((p) => (
                          <button
                            key={p.key}
                            className={`${styles.option} ${plan === p.key ? styles.optionOn : ""}`}
                            onClick={() => setPlan(p.key)}
                          >
                            <span className={styles.radio} />
                            <div className={styles.optionName}>{p.name}</div>
                            <div className={styles.optionDesc}>{p.desc}</div>
                            <div className={styles.optionPrice}>
                              {PRIX_ABO[type][p.key][freq]} €
                              <span> / mois{type !== "INDIVIDUEL" ? " / pers." : ""}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* 3. Créneau */}
            {step === 2 && (
              <>
                <div className={styles.qTitle}>Quand souhaitez-vous venir ?</div>
                <div className={styles.qSub}>
                  {maxSlots === 1
                    ? "Séances d'1 heure, du lundi au dimanche."
                    : "Choisissez vos 2 créneaux hebdomadaires."}
                </div>
                <div className={styles.slotWrap}>
                  <SlotPicker max={maxSlots} value={slots} onChange={setSlots} />
                </div>
              </>
            )}

            {/* 4. Informations */}
            {step === 3 && (
              <>
                <div className={styles.qTitle}>Vos informations</div>
                <div className={styles.qSub}>
                  {isAbo
                    ? "Un compte est créé pour gérer votre abonnement et vos réservations."
                    : "Pour vous envoyer la confirmation et l'adresse exacte."}
                </div>
                <div className={styles.fields}>
                  <div className={styles.field}>
                    <label htmlFor="name">Nom et prénom</label>
                    <input id="name" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Marie Dupont" />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="phone">Téléphone</label>
                    <input id="phone" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="06 12 34 56 78" />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="marie@exemple.fr" />
                  </div>
                  {isAbo && (
                    <div className={styles.field}>
                      <label htmlFor="password">Mot de passe (8 car. min.)</label>
                      <input id="password" type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} placeholder="••••••••" />
                    </div>
                  )}

                  {nbPersonnes > 1 && (
                    <>
                      <div className={styles.subhead}>Les autres participants</div>
                      <div className={styles.field}>
                        <label htmlFor="p2">2ᵉ participant</label>
                        <input id="p2" value={form.p2Name} onChange={(e) => setField("p2Name", e.target.value)} placeholder="Nom et prénom" />
                      </div>
                      {nbPersonnes === 3 && (
                        <div className={styles.field}>
                          <label htmlFor="p3">3ᵉ participant</label>
                          <input id="p3" value={form.p3Name} onChange={(e) => setField("p3Name", e.target.value)} placeholder="Nom et prénom" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* 5. Paiement */}
            {step === 4 && (
              <>
                <div className={styles.qTitle}>Vérifiez et confirmez</div>
                <div className={styles.qSub}>Un récapitulatif avant le paiement sécurisé.</div>

                <div className={styles.recap}>
                  <div className={styles.recapRow}>
                    <span>Formule</span>
                    <span>
                      {isEssai
                        ? "Séance d'essai offerte"
                        : isAbo
                        ? `${typeInfo.name} · ${PLANS.find((p) => p.key === plan).name}`
                        : `Séance ${typeInfo.name.toLowerCase()}`}
                    </span>
                  </div>
                  {isAbo && (
                    <div className={styles.recapRow}>
                      <span>Rythme</span>
                      <span>{freq} séance{freq > 1 ? "s" : ""} d'1h / semaine</span>
                    </div>
                  )}
                  <div className={styles.recapRow}>
                    <span>{slots.length > 1 ? "Créneaux" : "Date & heure"}</span>
                    <span>
                      {slots
                        .map((iso) =>
                          new Intl.DateTimeFormat("fr-FR", {
                            weekday: "long", day: "numeric", month: "long",
                            hour: "2-digit", minute: "2-digit",
                          }).format(new Date(iso))
                        )
                        .join(" · ")}
                    </span>
                  </div>
                  <div className={styles.recapRow}>
                    <span>Durée</span>
                    <span>1 heure</span>
                  </div>
                  {nbPersonnes > 1 && (
                    <div className={styles.recapRow}>
                      <span>Participants</span>
                      <span>{nbPersonnes} personnes</span>
                    </div>
                  )}
                  <div className={styles.recapRow}>
                    <span>Lieu</span>
                    <span>Sarrians (84)</span>
                  </div>

                  <div className={styles.recapTotal}>
                    <span className={styles.label}>{isAbo ? "Total mensuel" : "Total"}</span>
                    <span className={styles.amount}>
                      {total} €<span>{isAbo ? " / mois" : " TTC"}</span>
                    </span>
                  </div>
                </div>

                {/* Mode de paiement (ponctuel) — masqué une fois le formulaire carte affiché */}
                {mode === "PONCTUEL" && !clientSecret && (
                  <div className={styles.block}>
                    <div className={styles.blockTitle}>Mode de paiement</div>
                    <div className={styles.qSub}>Réglez la totalité ou un acompte pour bloquer le créneau.</div>
                    <div className={`${styles.options} ${styles.options2}`}>
                      <button
                        className={`${styles.option} ${paiement === "COMPTANT" ? styles.optionOn : ""}`}
                        onClick={() => setPaiement("COMPTANT")}
                      >
                        <span className={styles.radio} />
                        <div className={styles.optionName}>Comptant</div>
                        <div className={styles.optionDesc}>La totalité maintenant</div>
                        <div className={styles.optionPrice}>{total} €</div>
                      </button>
                      <button
                        className={`${styles.option} ${paiement === "ACOMPTE" ? styles.optionOn : ""}`}
                        onClick={() => setPaiement("ACOMPTE")}
                      >
                        <span className={styles.radio} />
                        <div className={styles.optionName}>Acompte 50 %</div>
                        <div className={styles.optionDesc}>Le solde sur place</div>
                        <div className={styles.optionPrice}>
                          {Math.round(total / 2)} €
                          <span> puis {total - Math.round(total / 2)} €</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulaire de carte Stripe, une fois le clientSecret prêt */}
                {clientSecret && (
                  <div className={styles.block}>
                    <Elements
                      stripe={stripePromise}
                      options={{ clientSecret, appearance: stripeAppearance }}
                    >
                      <PaymentForm amount={payAmount} returnUrl={returnUrl} />
                    </Elements>
                  </div>
                )}

                {!clientSecret && (
                  <div className={styles.note}>
                    <Info />
                    <span>
                      {isEssai
                        ? "Séance offerte, aucun paiement requis. Un essai gratuit par personne."
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
              </>
            )}

            {/* Navigation */}
            {step > 0 && (
              <div className={styles.nav}>
                <button
                  className={styles.back}
                  onClick={() => {
                    // Si le formulaire carte est affiché, revenir masque juste le paiement
                    if (clientSecret) {
                      setClientSecret(null);
                      setErreur(null);
                    } else {
                      setStep(step - 1);
                    }
                  }}
                  disabled={loading}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M19 12H5M11 18l-6-6 6-6" />
                  </svg>
                  Retour
                </button>

                {/* Le bouton principal disparaît quand le formulaire carte est affiché
                    (c'est le bouton du PaymentForm qui prend le relais) */}
                {!(step === 4 && clientSecret) && (
                  <button
                    className={styles.next}
                    disabled={!canNext || loading}
                    onClick={() => {
                      if (step < 4) return setStep(step + 1);
                      if (mode === "PONCTUEL") preparerPaiement();
                      // ESSAI et ABONNEMENT : branchés plus tard
                    }}
                  >
                    {loading
                      ? "Préparation…"
                      : step === 4
                      ? isEssai ? "Confirmer ma séance d'essai" : "Procéder au paiement"
                      : "Continuer"}
                    <Arrow />
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}