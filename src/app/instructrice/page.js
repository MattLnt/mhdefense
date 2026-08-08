"use client";

import Link from "next/link";
import SiteLayout from "@/components/SiteLayout";
import styles from "./Instructrice.module.css";

const PALMARES = [
  { year: "Monde", title: "Championne du Monde", detail: "Consécration au plus haut niveau international" },
  { year: "Europe", title: "Médaillée aux Championnats d'Europe", detail: "Podium continental en karaté" },
  { year: "France", title: "~10× Championne de France", detail: "Une dizaine de titres nationaux" },
  { year: "Diplôme", title: "Instructeur Fédéral en arts martiaux", detail: "Diplôme fédéral — enseignement tous niveaux et compétiteurs" },
];

const PILIERS = [
  {
    title: "Concrète",
    text: "Une self-défense pensée pour les situations réelles : des gestes simples, directs et efficaces, loin de toute chorégraphie.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Efficace",
    text: "Fruit de 17 ans de pratique au plus haut niveau : des techniques éprouvées, transmises avec exigence et pédagogie.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
      </svg>
    ),
  },
  {
    title: "Accessible à tous",
    text: "Femmes, adolescents, enfants, débutants ou confirmés : chacun progresse à son rythme, en confiance et en bienveillance.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
      </svg>
    ),
  },
];

export default function InstructricePage() {
  return (
    <SiteLayout>
      <main className={styles.page}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={`${styles.narrow} ${styles.heroGrid}`}>
            <div className={styles.heroPhoto}>
              {/* Remplacer par la vraie photo : /images/instructrice.jpg */}
              <img src="/images/instructrice.jpg" alt="Marie Hervas Diaz — MH Defense" onError={(e) => (e.currentTarget.style.display = "none")} />
              <div className={styles.heroPhotoPlaceholder}>Photo de l'instructrice</div>
            </div>

            <div>
              <div className={styles.tag}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l2.4 6.9H21l-5.3 4 2 6.9-5.7-4.2L6.3 19.8l2-6.9L3 8.9h6.6z" />
                </svg>
                Championne du Monde de karaté
              </div>
              <h1>Marie Hervas Diaz,<br /><span>votre instructrice</span></h1>
              <div className={styles.role}>Fondatrice de MH Defense · Sarrians (84)</div>
              <p className={styles.heroText}>
                Karatéka depuis l'âge de 3 ans, je compte près de 17 années
                d'expérience dans les arts martiaux et un parcours au plus haut
                niveau. Aujourd'hui, je mets cette expérience au service d'une
                self-défense concrète, efficace et accessible à tous.
              </p>
              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <b>17 ans</b>
                  <span>d'expérience</span>
                </div>
                <div className={styles.heroStat}>
                  <b>~10×</b>
                  <span>Championne de France</span>
                </div>
                <div className={styles.heroStat}>
                  <b>Monde</b>
                  <span>titre mondial</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.body}>
          <div className={styles.narrow}>
            {/* Parcours */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Mon parcours</div>
              <div className={styles.sectionText}>
                <p>
                  Karatéka depuis l'âge de 3 ans, j'ai grandi sur les tatamis et
                  consacré près de 17 années aux arts martiaux, avec un parcours
                  au plus haut niveau : une dizaine de fois Championne de France,
                  médaillée aux Championnats d'Europe et Championne du Monde.
                </p>
                <p>
                  Professeure de karaté tous niveaux et auprès de compétiteurs de
                  haut niveau, j'ai également encadré des stages régionaux et
                  interrégionaux. Titulaire du Diplôme d'Instructeur Fédéral en
                  arts martiaux, je mets aujourd'hui toute cette expérience au
                  service d'une self-défense concrète, efficace et accessible à
                  tous.
                </p>
              </div>
            </div>

            {/* Palmarès */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Parcours & distinctions</div>
              <div className={styles.timeline}>
                {PALMARES.map((p) => (
                  <div key={p.title} className={styles.tItem}>
                    <div className={styles.tYear}>{p.year}</div>
                    <div className={styles.tContent}>
                      <b>{p.title}</b>
                      <span>{p.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Piliers */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Ma méthode</div>
              <div className={styles.sectionText}>
                Une self-défense guidée par trois principes.
              </div>
              <div className={styles.pillars}>
                {PILIERS.map((p) => (
                  <div key={p.title} className={styles.pillar}>
                    <div className={styles.pillarIcon}>{p.icon}</div>
                    <h3>{p.title}</h3>
                    <p>{p.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className={styles.cta}>
              <h2>Prête à révéler votre force ?</h2>
              <p>
                Réservez votre séance d'essai offerte et découvrez une approche de la
                self-défense pensée pour vous.
              </p>
              <Link href="/reservation" className={styles.ctaBtn}>
                Réserver ma séance d'essai
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}