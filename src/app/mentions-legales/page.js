import Header from "@/components/Header";
import Link from "next/link";
import styles from "@/components/Legal.module.css";

export const metadata = {
  title: "Mentions légales — MH Defense",
  description: "Mentions légales du site MH Defense — cours privés de self-défense à Sarrians.",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.top}>
          <div className={styles.topInner}>
            <div className={styles.tag}>Informations légales</div>
            <h1>Mentions <span>légales</span></h1>
            <p>Informations relatives à l'éditeur et à l'hébergeur du site mh-defense.com.</p>
          </div>
        </section>

        <section className={styles.body}>
          <div className={styles.narrow}>
            <div className={styles.art}>
              <h2 className={styles.artTitle}>
                <span className={styles.artNum}>1.</span>
                Éditeur du site
              </h2>
              <p>Le site mh-defense.com est édité par :</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.row}><span>Éditeur</span><span>Marie Hervas Diaz</span></div>
              <div className={styles.row}><span>Enseigne</span><span>MH Defense</span></div>
              <div className={styles.row}><span>Statut</span><span>Entrepreneur individuel (micro-entreprise)</span></div>
              <div className={styles.row}><span>SIRET</span><span>105 616 775 00018</span></div>
              <div className={styles.row}><span>Adresse</span><span>Sarrians (84260) — France</span></div>
              <div className={styles.row}><span>Téléphone</span><span>06 51 00 14 01</span></div>
              <div className={styles.row}><span>E-mail</span><span>contact@mh-defense.com</span></div>
              <div className={styles.row}><span>TVA</span><span>Non applicable, art. 293 B du CGI</span></div>
            </div>

            <div className={styles.art}>
              <h2 className={styles.artTitle}>
                <span className={styles.artNum}>2.</span>
                Directrice de la publication
              </h2>
              <p>Marie Hervas Diaz, en qualité d'éditrice du site.</p>
            </div>

            <div className={styles.art}>
              <h2 className={styles.artTitle}>
                <span className={styles.artNum}>3.</span>
                Hébergeur
              </h2>
              <p>Le site est hébergé par :</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.row}><span>Hébergeur</span><span>Vercel Inc.</span></div>
              <div className={styles.row}><span>Adresse</span><span>340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</span></div>
              <div className={styles.row}><span>Site</span><span>vercel.com</span></div>
            </div>

            <div className={styles.art}>
              <h2 className={styles.artTitle}>
                <span className={styles.artNum}>4.</span>
                Propriété intellectuelle
              </h2>
              <p>
                L'ensemble des contenus présents sur le site (textes, images, logo, éléments graphiques, structure)
                est la propriété exclusive de MH Defense, sauf mention contraire. Toute reproduction, représentation,
                modification ou exploitation, totale ou partielle, sans autorisation écrite préalable, est interdite
                et constitue une contrefaçon susceptible de poursuites.
              </p>
            </div>

            <div className={styles.art}>
              <h2 className={styles.artTitle}>
                <span className={styles.artNum}>5.</span>
                Données personnelles
              </h2>
              <p>
                Les informations recueillies via le site (formulaire de contact, réservation, création de compte)
                sont utilisées uniquement dans le cadre de la gestion des prestations proposées par MH Defense.
                Elles ne sont ni vendues ni communiquées à des tiers.
              </p>
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès,
                de rectification et de suppression de vos données. Pour l'exercer, contactez-nous à l'adresse
                contact@mh-defense.com. Pour plus de détails, consultez notre{" "}
                <Link href="/confidentialite" style={{ color: "#d64c7f", fontWeight: 700 }}>politique de confidentialité</Link>.
              </p>
            </div>

            <div className={styles.art}>
              <h2 className={styles.artTitle}>
                <span className={styles.artNum}>6.</span>
                Cookies
              </h2>
              <p>
                Le site utilise uniquement des cookies strictement nécessaires à son fonctionnement (session de
                connexion, sécurité). Aucun cookie publicitaire ou de traçage tiers n'est utilisé.
              </p>
            </div>

            <div className={styles.art}>
              <h2 className={styles.artTitle}>
                <span className={styles.artNum}>7.</span>
                Paiements
              </h2>
              <p>
                Les paiements en ligne sont traités de manière sécurisée par Stripe. Aucune donnée bancaire n'est
                stockée sur les serveurs de MH Defense.
              </p>
            </div>

            <div className={styles.backBox}>
              <Link href="/" className={styles.backLink}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M19 12H5M11 6l-6 6 6 6" />
                </svg>
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}