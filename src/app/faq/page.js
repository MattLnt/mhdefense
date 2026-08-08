"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import styles from "./Faq.module.css";

const FAQ = [
  {
    group: "Les séances",
    items: [
      {
        q: "Faut-il un niveau ou une condition physique particulière ?",
        a: "Absolument pas. Les cours sont accessibles à toutes, quel que soit votre âge ou votre condition physique. Chaque exercice est adapté à votre rythme et à vos capacités. L'objectif est de vous rendre autonome, pas de vous épuiser.",
      },
      {
        q: "Combien de temps dure une séance ?",
        a: "Chaque séance dure 1 heure. C'est le format idéal pour travailler efficacement les techniques tout en gardant votre concentration et votre énergie.",
      },
      {
        q: "Les cours sont-ils vraiment réservés aux femmes ?",
        a: "Oui, MH Defense propose un cadre 100 % féminin. C'est un choix assumé pour créer un espace bienveillant, sans jugement, où chacune se sent libre de progresser en confiance.",
      },
      {
        q: "Que dois-je apporter à ma première séance ?",
        a: "Une tenue de sport confortable, une bouteille d'eau et de la motivation ! Aucun équipement spécifique n'est nécessaire pour débuter, tout le matériel est fourni.",
      },
    ],
  },
  {
    group: "Réservation & paiement",
    items: [
      {
        q: "Comment réserver une séance ?",
        a: "Tout se fait en ligne, en quelques clics. Choisissez votre formule (séance à l'unité ou abonnement), sélectionnez un créneau disponible, et réglez en ligne de manière sécurisée. Vous recevez ensuite une confirmation par email avec l'adresse exacte.",
      },
      {
        q: "La séance d'essai est-elle vraiment gratuite ?",
        a: "Oui, la première séance découverte est offerte, sans engagement. C'est l'occasion idéale de rencontrer votre instructrice et de voir si l'approche vous convient. Un essai gratuit par personne.",
      },
      {
        q: "Puis-je payer en plusieurs fois ?",
        a: "Pour les séances ponctuelles, vous pouvez régler la totalité en ligne, ou verser un acompte de 50 % et payer le solde sur place. Pour les abonnements, le paiement se fait mensuellement.",
      },
      {
        q: "Puis-je annuler une réservation ?",
        a: "Oui, vous pouvez annuler une séance jusqu'à 24 heures avant depuis votre espace membre. Pour toute annulation de dernière minute, contactez directement l'instructrice.",
      },
    ],
  },
  {
    group: "Les abonnements",
    items: [
      {
        q: "Quelle est la différence entre les formules Silver, Gold et Platinum ?",
        a: "Elles se distinguent par la durée d'engagement : Silver est sans engagement (1 mois), Gold sur 3 mois et Platinum sur 6 mois. Plus l'engagement est long, plus le tarif mensuel est avantageux.",
      },
      {
        q: "Comment fonctionne la réservation avec un abonnement ?",
        a: "Votre abonnement vous donne droit à un nombre de séances par semaine (1 ou 2 selon la formule). Vous réservez vos créneaux semaine par semaine depuis votre espace membre, en toute flexibilité.",
      },
      {
        q: "Comment résilier mon abonnement ?",
        a: "Vous pouvez demander la résiliation à tout moment depuis votre espace membre. Elle prend effet à la fin de votre période d'engagement : vous conservez l'accès à vos séances jusqu'à cette date.",
      },
    ],
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState("0-0"); // première question ouverte par défaut

  const toggle = (key) => setOpen((o) => (o === key ? null : key));

  return (
    <>
      <Header />
      <main className={styles.page}>
        {/* Bandeau */}
        <section className={styles.top}>
          <div className={`${styles.narrow} ${styles.topInner}`}>
            <div className={styles.tag}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 4M12 17h.01" />
              </svg>
              Questions fréquentes
            </div>
            <h1>Tout ce que vous <span>devez savoir</span></h1>
            <p>Vous ne trouvez pas votre réponse ? Contactez-nous directement, on vous répond avec plaisir.</p>
          </div>
        </section>

        <section className={styles.body}>
          <div className={styles.narrow}>
            {FAQ.map((group, gi) => (
              <div key={group.group} className={styles.group}>
                <div className={styles.groupTitle}>{group.group}</div>
                {group.items.map((item, ii) => {
                  const key = `${gi}-${ii}`;
                  const isOpen = open === key;
                  return (
                    <div key={key} className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}>
                      <button className={styles.question} onClick={() => toggle(key)}>
                        {item.q}
                        <svg className={styles.chevron} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                      <div className={styles.answer}>{item.a}</div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Encart contact */}
            <div className={styles.contactBox}>
              <h3>Une autre question ?</h3>
              <p>L'instructrice se fera un plaisir de vous répondre personnellement.</p>
              <Link href="/contact" className={styles.contactBtn}>
                Nous contacter
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}