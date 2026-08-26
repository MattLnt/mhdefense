import Header from "@/components/Header";
import Link from "next/link";
import styles from "@/components/Legal.module.css";

export const metadata = {
  title: "Politique de confidentialité — MH Defense",
  description: "Politique de confidentialité et gestion des données personnelles du site MH Defense.",
};

const SECTIONS = [
  {
    num: "1.",
    titre: "Responsable du traitement",
    contenu: [
      "Le responsable du traitement des données personnelles collectées sur le site mh-defense.com est Marie Hervas Diaz, entrepreneur individuel exerçant sous l'enseigne MH Defense, domiciliée à Sarrians (84260), France.",
      "Pour toute question relative à vos données, vous pouvez la contacter à l'adresse contact@mh-defense.com.",
    ],
  },
  {
    num: "2.",
    titre: "Données collectées",
    contenu: ["Dans le cadre de l'utilisation du site, nous sommes amenés à collecter les données suivantes :"],
    liste: [
      "Identité : nom, prénom.",
      "Coordonnées : adresse e-mail, numéro de téléphone.",
      "Données de compte : mot de passe (stocké de manière chiffrée).",
      "Données de réservation : séances réservées, formule choisie, historique.",
      "Données de paiement : traitées directement par Stripe, jamais stockées par MH Defense.",
    ],
  },
  {
    num: "3.",
    titre: "Finalités du traitement",
    contenu: ["Vos données sont collectées et traitées pour les finalités suivantes :"],
    liste: [
      "La gestion des réservations et des séances.",
      "La création et la gestion de votre espace membre.",
      "Le traitement des paiements et des abonnements.",
      "L'envoi d'e-mails de confirmation et d'informations liées à vos réservations.",
      "La réponse à vos demandes via le formulaire de contact.",
    ],
  },
  {
    num: "4.",
    titre: "Base légale",
    contenu: [
      "Le traitement de vos données repose sur l'exécution du contrat (gestion de vos réservations et de votre abonnement), sur votre consentement (formulaire de contact), et sur nos obligations légales (facturation, comptabilité).",
    ],
  },
  {
    num: "5.",
    titre: "Destinataires des données",
    contenu: [
      "Vos données sont destinées uniquement à MH Defense. Elles ne sont ni vendues, ni louées, ni communiquées à des tiers à des fins commerciales.",
      "Certains prestataires techniques peuvent traiter vos données pour notre compte, strictement dans le cadre du service :",
    ],
    liste: [
      "Stripe — traitement sécurisé des paiements.",
      "Resend — envoi des e-mails transactionnels (confirmations, notifications).",
      "Vercel — hébergement du site.",
      "Railway — hébergement de la base de données.",
    ],
  },
  {
    num: "6.",
    titre: "Durée de conservation",
    contenu: [
      "Vos données de compte et de réservation sont conservées pendant toute la durée de votre relation avec MH Defense, puis archivées ou supprimées conformément aux obligations légales (notamment comptables et fiscales, jusqu'à 10 ans pour les documents de facturation).",
      "Les données du formulaire de contact sont conservées le temps nécessaire au traitement de votre demande.",
    ],
  },
  {
    num: "7.",
    titre: "Vos droits",
    contenu: ["Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :"],
    liste: [
      "Droit d'accès : obtenir une copie des données vous concernant.",
      "Droit de rectification : corriger des données inexactes.",
      "Droit à l'effacement : demander la suppression de vos données.",
      "Droit à la limitation et à l'opposition du traitement.",
      "Droit à la portabilité de vos données.",
    ],
    apres: [
      "Pour exercer ces droits, contactez-nous à contact@mh-defense.com. Nous vous répondrons dans les meilleurs délais.",
      "Vous disposez également du droit d'introduire une réclamation auprès de la CNIL (www.cnil.fr) si vous estimez que vos droits ne sont pas respectés.",
    ],
  },
  {
    num: "8.",
    titre: "Sécurité",
    contenu: [
      "MH Defense met en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès, perte ou divulgation non autorisés. Les mots de passe sont chiffrés et les paiements sont traités via des prestataires certifiés.",
    ],
  },
  {
    num: "9.",
    titre: "Cookies",
    contenu: [
      "Le site utilise uniquement des cookies strictement nécessaires à son fonctionnement (maintien de votre session de connexion, sécurité). Aucun cookie publicitaire ou de traçage tiers n'est déposé sans votre consentement.",
    ],
  },
];

export default function ConfidentialitePage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.top}>
          <div className={styles.topInner}>
            <div className={styles.tag}>Vos données</div>
            <h1>Politique de <span>confidentialité</span></h1>
            <p>Comment MH Defense collecte, utilise et protège vos données personnelles.</p>
          </div>
        </section>

        <section className={styles.body}>
          <div className={styles.narrow}>
            {SECTIONS.map((s) => (
              <div key={s.num} className={styles.art}>
                <h2 className={styles.artTitle}>
                  <span className={styles.artNum}>{s.num}</span>
                  {s.titre}
                </h2>
                {s.contenu?.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {s.liste && (
                  <ul>
                    {s.liste.map((li, i) => (
                      <li key={i}>{li}</li>
                    ))}
                  </ul>
                )}
                {s.apres?.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ))}

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