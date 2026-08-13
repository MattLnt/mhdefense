"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Abonnements.module.css";

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

// prix abo[type][frequence] = [silver, gold, platinum]
const PRIX_ABO = {
  indiv: { 1: [200, 190, 180], 2: [360, 340, 320] },
  groupe: { 1: [160, 150, 140], 2: [280, 260, 240] },
};

// prix ponctuel par type (par personne)
const PRIX_UNITE = { indiv: 60, groupe: 45 };

const PALIERS = [
  { key: "silver", niveau: "Silver", engagement: "Engagement 1 mois", accroche: "Sans engagement long", planKey: "SILVER" },
  { key: "gold", niveau: "Gold", engagement: "Engagement 3 mois", accroche: "Le meilleur rapport qualité / prix", planKey: "GOLD" },
  { key: "plat", niveau: "Platinum", engagement: "Engagement 6 mois", accroche: "Le tarif le plus avantageux", planKey: "PLATINUM" },
];

const AVANTAGES = [
  "Séance d'1h chaque semaine",
  "Suivi personnalisé",
  "Résultats durables",
];

// Correspondance type UI → sessionType du tunnel
const SESSION_TYPE = { indiv: "INDIVIDUEL", groupe: "DUO" };

export default function Abonnements() {
  const [mode, setMode] = useState("abo"); // "abo" | "unite"
  const [type, setType] = useState("indiv"); // abo : "indiv" | "groupe"
  const [freq, setFreq] = useState(1); // 1 | 2
  const [typeUnite, setTypeUnite] = useState("indiv"); // unité : "indiv" | "groupe"

  const prixAbo = PRIX_ABO[type][freq];

  // Lien tunnel pré-rempli — abonnement
  const lienAbo = (planKey) =>
    `/reservation?mode=ABONNEMENT&type=${SESSION_TYPE[type]}&plan=${planKey}&freq=${freq === 1 ? "ONCE" : "TWICE"}`;

  // Lien tunnel pré-rempli — unité (duo/groupe → DUO par défaut, ajustable dans le tunnel)
  const lienUnite = `/reservation?mode=PONCTUEL&type=${SESSION_TYPE[typeUnite]}`;

  return (
    <section className={styles.section} id="tarifs">
      <div className={styles.glow} />
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.head}>
          <span className={`eyebrow ${styles.eyebrow}`}>Nos formules</span>
          <h2>Choisissez votre formule</h2>
          <p>Le meilleur tarif est dans l'abonnement.</p>
        </div>

        {/* Toggle principal */}
        <div className={styles.mainToggle}>
          <div className={styles.mainSwitch}>
            <button
              className={mode === "abo" ? styles.on : ""}
              onClick={() => setMode("abo")}
            >
              Abonnement <span className={styles.tag}>−40%</span>
            </button>
            <button
              className={mode === "unite" ? styles.on : ""}
              onClick={() => setMode("unite")}
            >
              À l'unité
            </button>
          </div>
        </div>

        {/* ---- MODE ABONNEMENT ---- */}
        {mode === "abo" && (
          <>
            <div className={styles.subs}>
              <div className={styles.subSeg}>
                <button className={type === "indiv" ? styles.subOn : ""} onClick={() => setType("indiv")}>
                  Individuel
                </button>
                <button className={type === "groupe" ? styles.subOn : ""} onClick={() => setType("groupe")}>
                  Duo / groupe
                </button>
              </div>
              <div className={styles.subSeg}>
                <button className={freq === 1 ? styles.subOn : ""} onClick={() => setFreq(1)}>
                  1×/sem.
                </button>
                <button className={freq === 2 ? styles.subOn : ""} onClick={() => setFreq(2)}>
                  2×/sem.
                </button>
              </div>
            </div>

            <div className={styles.grid}>
              {PALIERS.map((p, i) => (
                <div key={p.key} className={`${styles.card} ${p.key === "gold" ? styles.feat : ""}`}>
                  {p.key === "gold" && <span className={styles.badge}>Recommandé</span>}
                  <div className={styles.lvl}>{p.niveau}</div>
                  <div className={styles.eng}>{p.engagement}</div>

                  <div className={styles.amt}>
                    {prixAbo[i]}
                    <span className={styles.per}>€ /mois{type === "groupe" ? " /pers." : ""}</span>
                  </div>
                  <div className={styles.acc}>{p.accroche}</div>

                  <ul className={styles.feats}>
                    {AVANTAGES.map((a) => (
                      <li key={a}>
                        <Check />
                        {a}
                      </li>
                    ))}
                  </ul>

                  <Link href={lienAbo(p.planKey)} className={`${styles.btn} ${p.key === "gold" ? styles.btnRose : styles.btnGhost}`}>
                    Choisir {p.niveau}
                  </Link>
                </div>
              ))}
            </div>

            <p className={styles.note}>
              {type === "groupe"
                ? "Tarif par personne · duo (2) ou petit groupe (3 max). Une personne gère l'inscription."
                : "Tarif pour une séance individuelle, cours 100 % personnalisé."}
            </p>
          </>
        )}

        {/* ---- MODE UNITÉ ---- */}
        {mode === "unite" && (
          <>
            <div className={styles.subs}>
              <div className={styles.subSeg}>
                <button className={typeUnite === "indiv" ? styles.subOn : ""} onClick={() => setTypeUnite("indiv")}>
                  Individuel
                </button>
                <button className={typeUnite === "groupe" ? styles.subOn : ""} onClick={() => setTypeUnite("groupe")}>
                  Duo / petit groupe
                </button>
              </div>
            </div>

            <div className={styles.uniteWrap}>
              <div className={styles.uniteCard}>
                <div className={styles.amt}>
                  {PRIX_UNITE[typeUnite]}
                  <span className={styles.per}>€ /séance{typeUnite === "groupe" ? " /pers." : ""}</span>
                </div>
                <div className={styles.uniteDesc}>
                  {typeUnite === "indiv"
                    ? "Séance individuelle d'1h, cours 100 % personnalisé."
                    : "Séance à 2 ou en petit groupe (3 max), tarif par personne."}
                </div>
                <Link href={lienUnite} className={`${styles.btn} ${styles.btnRose}`}>
                  Réserver une séance
                </Link>
              </div>
            </div>

            <p className={styles.note}>
              Sans engagement · première séance d'essai offerte pour découvrir.
            </p>
          </>
        )}
      </div>
    </section>
  );
}