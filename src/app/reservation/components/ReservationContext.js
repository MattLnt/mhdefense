"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ---------- Données statiques ---------- */

export const TYPES = [
  { key: "INDIVIDUEL", name: "Individuel", desc: "Cours 100 % personnalisé, 1 personne", prixPonctuel: 60, personnes: 1 },
  { key: "DUO", name: "Duo", desc: "À deux, tarif par personne", prixPonctuel: 45, personnes: 2 },
  { key: "GROUPE", name: "Petit groupe", desc: "Jusqu'à 3 personnes", prixPonctuel: 45, personnes: 3 },
];

export const PLANS = [
  { key: "SILVER", name: "Silver", months: 1, desc: "1 mois" },
  { key: "GOLD", name: "Gold", months: 3, desc: "3 mois" },
  { key: "PLATINUM", name: "Platinum", months: 6, desc: "6 mois" },
];

export const PRIX_ABO = {
  INDIVIDUEL: { SILVER: { 1: 200, 2: 360 }, GOLD: { 1: 190, 2: 340 }, PLATINUM: { 1: 180, 2: 320 } },
  DUO: { SILVER: { 1: 160, 2: 280 }, GOLD: { 1: 150, 2: 260 }, PLATINUM: { 1: 140, 2: 240 } },
  GROUPE: { SILVER: { 1: 160, 2: 280 }, GOLD: { 1: 150, 2: 260 }, PLATINUM: { 1: 140, 2: 240 } },
};

export const FREQ_ENUM = { 1: "ONCE", 2: "TWICE" };
export const STEPS = ["Choix", "Formule", "Créneau", "Infos", "Paiement"];

/* ---------- Contexte ---------- */

const ReservationContext = createContext(null);

export function useReservation() {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error("useReservation doit être utilisé dans ReservationProvider");
  return ctx;
}

export function ReservationProvider({ children }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null); // PONCTUEL | ABONNEMENT | ESSAI

  const [type, setType] = useState("INDIVIDUEL");
  const [freq, setFreq] = useState(1);
  const [plan, setPlan] = useState("GOLD");
  const [slots, setSlots] = useState([]);
  const [paiement, setPaiement] = useState("COMPTANT");

  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);

  const [clientSecret, setClientSecret] = useState(null);
  const [payAmount, setPayAmount] = useState(0);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", p2Name: "", p3Name: "",
  });

  // Pré-remplissage depuis l'URL (liens venant de la home / tarifs)
  useEffect(() => {
    const m = searchParams.get("mode");
    if (!m) return;

    if (m === "ABONNEMENT") {
      setMode("ABONNEMENT");
      const t = searchParams.get("type");
      const p = searchParams.get("plan");
      const f = searchParams.get("freq");
      if (t && ["INDIVIDUEL", "DUO", "GROUPE"].includes(t)) setType(t);
      if (p && ["SILVER", "GOLD", "PLATINUM"].includes(p)) setPlan(p);
      if (f === "ONCE") setFreq(1);
      else if (f === "TWICE") setFreq(2);
      setStep(1);
    } else if (m === "PONCTUEL") {
      setMode("PONCTUEL");
      const t = searchParams.get("type");
      if (t && ["INDIVIDUEL", "DUO", "GROUPE"].includes(t)) setType(t);
      setStep(1);
    } else if (m === "ESSAI") {
      setMode("ESSAI");
      setStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Valeurs dérivées ---------- */
  const isAbo = mode === "ABONNEMENT";
  const isEssai = mode === "ESSAI";
  const typeInfo = TYPES.find((t) => t.key === type);
  const nbPersonnes = isEssai ? 1 : typeInfo.personnes;
  const maxSlots = isAbo ? freq : 1;

  const prixUnitaire = isAbo ? PRIX_ABO[type][plan][freq] : typeInfo.prixPonctuel;
  const total = isEssai ? 0 : prixUnitaire * nbPersonnes;
  const totalApresPromo = promo ? Math.round(promo.newAmount / 100) : total;

  const canNext =
    step === 0 ? mode !== null
    : step === 1 ? true
    : step === 2 ? slots.length === maxSlots
    : step === 3 ? form.name && form.email && form.phone && (!isAbo || isPasswordValidLocal(form.password))
    : true;

  /* ---------- Actions ---------- */
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function resetPromo() {
    setPromo(null);
    setPromoInput("");
    setPromoError(null);
  }

  function choisir(m) {
    setMode(m);
    setSlots([]);
    setErreur(null);
    resetPromo();
    setStep(1);
  }

  function retour() {
    if (clientSecret) {
      setClientSecret(null);
      setErreur(null);
    } else if (step === 1) {
      setMode(null);
      setStep(0);
    } else {
      setStep(step - 1);
    }
  }

  async function appliquerCodePromo() {
    setPromoError(null);
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput, scope: isAbo ? "ABONNEMENT" : "PONCTUEL", amount: total * 100 }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setPromo(null);
        setPromoError(data.error || "Code invalide.");
        setPromoLoading(false);
        return;
      }
      setPromo({ code: data.code, discount: data.discount, newAmount: data.newAmount, label: data.label });
      setPromoLoading(false);
    } catch (e) {
      setPromoError("Impossible de vérifier le code.");
      setPromoLoading(false);
    }
  }

  async function preparerPaiement() {
    setErreur(null);
    setLoading(true);
    try {
      const holdRes = await fetch("/api/booking/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startsAt: slots[0], type: "PONCTUEL", sessionType: type, participantsCount: nbPersonnes, isFreeTrial: false }),
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
        body: JSON.stringify({ bookingId: holdData.booking.id, mode: paiement, promoCode: promo?.code || null }),
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

  async function preparerAbonnement() {
    setErreur(null);
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone, password: form.password,
          sessionType: type, planKey: plan, frequency: FREQ_ENUM[freq], promoCode: promo?.code || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Impossible de créer l'abonnement.");
        setLoading(false);
        return;
      }
      setClientSecret(data.clientSecret);
      setPayAmount(data.amount);
      setLoading(false);
    } catch (e) {
      setErreur("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  async function confirmerEssai() {
    setErreur(null);
    setLoading(true);
    try {
      const res = await fetch("/api/booking/essai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startsAt: slots[0], name: form.name, email: form.email, phone: form.phone, sessionType: type, participantsCount: nbPersonnes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error || "Impossible d'enregistrer votre séance d'essai.");
        setLoading(false);
        return;
      }
      router.push("/reservation/confirmation?essai=1");
    } catch (e) {
      setErreur("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  function suivant() {
    if (step < 4) return setStep(step + 1);
    if (mode === "PONCTUEL") return preparerPaiement();
    if (mode === "ESSAI") return confirmerEssai();
    if (mode === "ABONNEMENT") return preparerAbonnement();
  }

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/reservation/confirmation${isAbo ? "?abo=1" : ""}`
      : "/reservation/confirmation";

  const value = {
    // états
    step, setStep, mode, type, setType, freq, setFreq, plan, setPlan,
    slots, setSlots, paiement, setPaiement, loading, erreur,
    clientSecret, payAmount, form, setField,
    promoInput, setPromoInput, promo, promoLoading, promoError,
    // dérivés
    isAbo, isEssai, typeInfo, nbPersonnes, maxSlots, total, totalApresPromo, canNext, returnUrl,
    // actions
    choisir, retour, suivant, appliquerCodePromo, resetPromo,
  };

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
}

// Validation mot de passe locale (évite un import circulaire)
function isPasswordValidLocal(v) {
  const val = v || "";
  return val.length >= 9 && /\d/.test(val) && /[A-Z]/.test(val) && /[^A-Za-z0-9]/.test(val);
}