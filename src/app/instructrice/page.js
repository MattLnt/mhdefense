"use client";

import Link from "next/link";
import Header from "@/components/Header";
import styles from "./Instructrice.module.css";

const PALMARES = [
  { year: "2019", title: "Championne du monde de karaté", detail: "Titre mondial en catégorie kumite" },
  { year: "2017", title: "Championne d'Europe", detail: "Médaille d'or, championnats européens" },
  { year: "2015", title: "Championne de France", detail: "Triple championne nationale consécutive" },
  { year: "2012", title: "Ceinture noire 3ᵉ dan", detail: "Obtention du grade et début de l'enseignement" },
];

const PILIERS = [
  {
    title: "Techniques réalistes",
    text: "Des gestes simples, efficaces et adaptés aux situations réelles du quotidien — pas de chorégraphie, du concret.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Bienveillance",
    text: "Un cadre 100 % féminin, sans jugement, où chacune progresse à son rythme et en confiance.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
      </svg>
    ),
  },
  {
    title: "Confiance en soi",
    text: "Au-delà des techniques, on travaille la posture, la voix et le mental pour se sentir forte partout.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2l2.4 6.9H21l-5.3 4 2 6.9-5.7-4.2L6.3 19.8l2-6.9L3 8.9h6.6z" />
      </svg>
    ),
  },
];

export default function InstructricePage() {
  return (
    <>
      <Header />
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
                Championne du monde de karaté
              </div>
              <h1>Marie Hervas Diaz,<br /><span>votre instructrice</span></h1>
              <div className={styles.role}>Fondatrice de MH Defense · Sarrians (84)</div>
              <p className={styles.heroText}>
                Après une carrière au plus haut niveau international, j'ai décidé de
                transmettre mon expérience aux femmes qui veulent se sentir en sécurité
                au quotidien. Mon approche : des techniques simples, efficaces, et un
                accompagnement bienveillant, quel que soit votre niveau de départ.
              </p>
              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <b>15+</b>
                  <span>ans d'expérience</span>
                </div>
                <div className={styles.heroStat}>
                  <b>500+</b>
                  <span>femmes formées</span>
                </div>
                <div className={styles.heroStat}>
                  <b>1</b>
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
                  J'ai commencé le karaté à l'âge de 8 ans, sans imaginer que cette
                  discipline deviendrait toute ma vie. Des tatamis de mon club local
                  jusqu'aux podiums internationaux, j'ai appris que la vraie force ne
                  se mesure pas seulement en compétition, mais dans la confiance qu'on
                  développe en soi.
                </p>
                <p>
                  Aujourd'hui, je mets cette expérience au service des femmes. Trop
                  d'entre nous se sentent vulnérables dans certaines situations. Mon
                  objectif est simple : vous donner les outils concrets pour vous
                  protéger, et surtout la confiance pour ne plus jamais vous sentir
                  démunie.
                </p>
              </div>
            </div>

            {/* Palmarès */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Palmarès</div>
              <div className={styles.timeline}>
                {PALMARES.map((p) => (
                  <div key={p.year} className={styles.tItem}>
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
                Trois principes guident chacun de mes cours.
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
    </>
  );
}