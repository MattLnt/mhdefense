"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import styles from "./Tarifs.module.css";

const TYPES = [
  { key: "INDIVIDUEL", label: "Individuel" },
  { key: "DUO", label: "Duo" },
  { key: "GROUPE", label: "Petit groupe" },
];

const PLANS = [
  { key: "SILVER", name: "Silver", months: 1, engage: "Sans engagement", featured: false },
  { key: "GOLD", name: "Gold", months: 3, engage: "Engagement 3 mois", featured: true },
  { key: "PLATINUM", name: "Platinum", months: 6, engage: "Engagement 6 mois", featured: false },
];

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export default function TarifsPage() {
  const [loading, setLoading] = useState(true);
  const [ponctuel, setPonctuel] = useState({ INDIVIDUEL: 0, DUO: 0, GROUPE: 0 });
  const [plans, setPlans] = useState({}); // { "TYPE_KEY_FREQ": priceCents }

  const [type, setType] = useState("INDIVIDUEL");
  const [freq, setFreq] = useState("ONCE");

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setPonctuel(d.ponctuel);
        const map = {};
        for (const p of d.plans) {
          map[`${p.sessionType}_${p.key}_${p.frequency}`] = p.price;
        }
        setPlans(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const euro = (cents) => Math.round((cents || 0) / 100);

  return (
    <>
      <Header />
      <main className={styles.page}>
        {/* Bandeau */}
        <section className={styles.top}>
          <div className={`${styles.narrow} ${styles.topInner}`}>
            <div className={styles.tag}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 12l-8 8-9-9V3h8z" /><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
              </svg>
              Tarifs clairs, sans surprise
            </div>
            <h1>Des formules pour <span>chaque objectif</span></h1>
            <p>
              Que vous veniez ponctuellement ou que vous souhaitiez progresser
              régulièrement, il y a une formule faite pour vous.
            </p>
          </div>
        </section>

        <section className={styles.body}>
          <div className={styles.narrow}>
            {loading ? (
              <div className={styles.loading}>Chargement des tarifs…</div>
            ) : (
              <>
                {/* Séances à l'unité */}
                <div className={styles.sectionTitle}>Séances à l'unité</div>
                <div className={styles.sectionSub}>
                  Sans compte ni engagement. Payez à la séance.
                </div>

                <div className={styles.ponctuel}>
                  <div className={styles.pCard}>
                    <div className={styles.pName}>Individuel</div>
                    <div className={styles.pDesc}>Cours particulier, 100 % pour vous</div>
                    <div className={styles.pPrice}>
                      {euro(ponctuel.INDIVIDUEL)} €<span> / séance</span>
                    </div>
                  </div>
                  <div className={styles.pCard}>
                    <div className={styles.pName}>Duo</div>
                    <div className={styles.pDesc}>À deux, entre amies ou en famille</div>
                    <div className={styles.pPrice}>
                      {euro(ponctuel.DUO)} €<span> / personne</span>
                    </div>
                  </div>
                  <div className={styles.pCard}>
                    <div className={styles.pName}>Petit groupe</div>
                    <div className={styles.pDesc}>Jusqu'à 3 personnes</div>
                    <div className={styles.pPrice}>
                      {euro(ponctuel.GROUPE)} €<span> / personne</span>
                    </div>
                  </div>
                </div>

                {/* Abonnements */}
                <div className={styles.sectionTitle}>Abonnements mensuels</div>
                <div className={styles.sectionSub}>
                  Un rythme régulier à tarif dégressif. Choisissez votre format et votre cadence.
                </div>

                {/* Sélecteur type */}
                <div className={styles.typeToggle}>
                  {TYPES.map((t) => (
                    <button
                      key={t.key}
                      className={`${styles.typeOpt} ${type === t.key ? styles.typeOptOn : ""}`}
                      onClick={() => setType(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Toggle fréquence */}
                <div className={styles.freqToggle}>
                  <button
                    className={`${styles.freqOpt} ${freq === "ONCE" ? styles.freqOn : ""}`}
                    onClick={() => setFreq("ONCE")}
                  >
                    1 séance / semaine
                  </button>
                  <button
                    className={`${styles.freqOpt} ${freq === "TWICE" ? styles.freqOn : ""}`}
                    onClick={() => setFreq("TWICE")}
                  >
                    2 séances / semaine
                  </button>
                </div>

                <div className={styles.abos}>
                  {PLANS.map((p) => {
                    const price = plans[`${type}_${p.key}_${freq}`];
                    const perPers = type !== "INDIVIDUEL";
                    return (
                      <div
                        key={p.key}
                        className={`${styles.aboCard} ${p.featured ? styles.aboFeatured : ""}`}
                      >
                        {p.featured && <div className={styles.badge}>Le plus choisi</div>}
                        <div className={styles.aboName}>{p.name}</div>
                        <div className={styles.aboEngage}>{p.engage}</div>
                        <div className={styles.aboPrice}>
                          {euro(price)} €<span> / mois</span>
                        </div>
                        <div className={styles.aboType}>
                          {perPers ? "par personne" : "tout compris"} ·{" "}
                          {freq === "ONCE" ? "1 séance" : "2 séances"} / semaine
                        </div>
                        <ul className={styles.aboList}>
                          <li><Check /> {freq === "ONCE" ? "4 séances" : "8 séances"} par mois</li>
                          <li><Check /> Réservation en ligne flexible</li>
                          <li><Check /> Suivi personnalisé de votre progression</li>
                          {p.key !== "SILVER" && <li><Check /> Tarif bloqué pendant l'engagement</li>}
                          {p.key === "PLATINUM" && <li><Check /> Meilleur tarif garanti</li>}
                        </ul>
                        <Link href="/reservation" className={styles.aboCta}>
                          Choisir {p.name}
                        </Link>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.footnote}>
                  Première fois ? La séance d'essai est offerte.{" "}
                  <Link href="/reservation" style={{ color: "var(--rose)", fontWeight: 600 }}>
                    Réservez-la ici →
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}