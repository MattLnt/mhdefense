"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Abonnements.module.css";

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

// prix[type][frequence] = [silver, gold, platinum]
const PRIX = {
  indiv: { 1: [200, 190, 180], 2: [360, 340, 320] },
  groupe: { 1: [160, 150, 140], 2: [280, 260, 240] },
};

const PALIERS = [
  { key: "silver", niveau: "Silver", engagement: "Engagement 1 mois", accroche: "Sans engagement long", btn: "Choisir Silver" },
  { key: "gold", niveau: "Gold", engagement: "Engagement 3 mois", accroche: "Le meilleur rapport qualité / prix", btn: "Choisir Gold" },
  { key: "plat", niveau: "Platinum", engagement: "Engagement 6 mois", accroche: "Le tarif le plus avantageux", btn: "Choisir Platinum" },
];

const AVANTAGES = [
  "Séance d'1h chaque semaine",
  "Suivi personnalisé",
  "Résultats durables",
];

export default function Abonnements() {
  const [type, setType] = useState("indiv"); // "indiv" | "groupe"
  const [freq, setFreq] = useState(1); // 1 | 2

  const prix = PRIX[type][freq];

  return (
    <section className={styles.section} id="tarifs">
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.head}>
          <span className={`eyebrow ${styles.eyebrow}`}>Abonnements</span>
          <h2>Un accompagnement régulier, à prix dégressif.</h2>
          <p>
            Choisissez votre format et votre rythme. Plus l'engagement est long,
            plus le tarif baisse.
          </p>
        </div>

        {/* Switchers */}
        <div className={styles.switchers}>
          <div className={`${styles.seg} ${styles.primary}`}>
            <button
              className={type === "indiv" ? styles.on : ""}
              onClick={() => setType("indiv")}
            >
              Individuel
            </button>
            <button
              className={type === "groupe" ? styles.on : ""}
              onClick={() => setType("groupe")}
            >
              En groupe (duo ou 3)
            </button>
          </div>

          <div className={`${styles.seg} ${styles.freq}`}>
            <button
              className={freq === 1 ? styles.on : ""}
              onClick={() => setFreq(1)}
            >
              1 séance / semaine
            </button>
            <button
              className={freq === 2 ? styles.on : ""}
              onClick={() => setFreq(2)}
            >
              2 séances / semaine
            </button>
          </div>
        </div>

        {/* Cartes */}
        <div className={styles.grid}>
          {PALIERS.map((p, i) => (
            <div key={p.key} className={`${styles.card} ${styles[p.key]}`}>
              <div className={styles.lvl}>{p.niveau}</div>
              <div className={styles.eng}>{p.engagement}</div>

              <div className={styles.amt}>
                <span className={styles.cur}>€</span>
                {prix[i]}
                <span className={styles.per}>
                  {" "}
                  /mois{type === "groupe" ? " /pers." : ""}
                </span>
              </div>
              <div className={styles.freqLabel}>{p.accroche}</div>

              <ul className={styles.feats}>
                {AVANTAGES.map((a) => (
                  <li key={a}>
                    <Check />
                    {a}
                  </li>
                ))}
              </ul>

              <Link href="/reservation" className={styles.btn}>
                {p.btn}
              </Link>
            </div>
          ))}
        </div>

        <p className={styles.note}>
          {type === "groupe"
            ? "Tarif par personne · duo (2) ou petit groupe (3 max). Une personne gère l'inscription."
            : "Tarif pour une séance individuelle, cours 100 % personnalisé."}
        </p>
      </div>
    </section>
  );
}