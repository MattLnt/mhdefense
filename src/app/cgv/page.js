import Header from "@/components/Header";
import Link from "next/link";
import styles from "@/components/Legal.module.css";

export const metadata = {
  title: "Conditions Générales de Vente — MH Defense",
  description: "Conditions générales de vente des cours privés de self-défense MH Defense.",
};

const ARTICLES = [
  {
    num: "Article 1",
    titre: "Objet",
    contenu: [
      "Les présentes conditions générales de vente ont pour objet de définir les conditions applicables aux prestations proposées par MH Defense dans le cadre des cours privés de self-défense.",
      "Toute réservation implique l'acceptation sans réserve des présentes conditions générales de vente.",
    ],
  },
  {
    num: "Article 2",
    titre: "Prestations proposées",
    contenu: ["MH Defense propose :"],
    liste: [
      "Des cours particuliers de self-défense.",
      "Des formules d'une séance par semaine.",
      "Des formules de deux séances par semaine.",
      "Des séances en petit groupe (dans la limite du nombre de participantes fixé par MH Defense).",
      "Une séance d'essai gratuite.",
    ],
    apres: [
      "Les cours sont destinés aux femmes, aux adolescentes et aux enfants.",
      "La durée d'une séance est d'une heure, sauf indication contraire.",
    ],
  },
  {
    num: "Article 3",
    titre: "Tarifs",
    contenu: [
      "Les tarifs applicables sont ceux affichés sur le site internet, la plateforme de réservation ou communiqués directement à la cliente au moment de la réservation.",
      "MH Defense se réserve le droit de modifier ses tarifs à tout moment.",
      "Toutefois, les réservations déjà validées conserveront le tarif en vigueur au moment de la commande.",
    ],
  },
  {
    num: "Article 4",
    titre: "Séance d'essai gratuite",
    contenu: [
      "Une seule séance d'essai gratuite est autorisée par cliente.",
      "La séance d'essai est proposée sous réserve des disponibilités.",
      "MH Defense se réserve le droit de refuser une nouvelle demande de séance d'essai en cas d'annulation répétée ou d'absence non justifiée.",
    ],
  },
  {
    num: "Article 5",
    titre: "Réservation",
    contenu: ["Les réservations doivent être effectuées au plus tard 48 heures avant la date du cours.", "Une réservation est considérée comme définitive uniquement après :"],
    liste: ["La validation de la réservation.", "Le paiement de l'acompte ou du montant total de la prestation."],
    apres: ["MH Defense se réserve le droit d'annuler ou de refuser une réservation en cas d'indisponibilité."],
  },
  {
    num: "Article 6",
    titre: "Modalités de paiement",
    contenu: ["Le règlement peut être effectué :"],
    liste: ["Par prélèvement.", "Par tout autre moyen de paiement accepté par MH Defense."],
    apres: [
      "Le paiement peut être réalisé en une seule fois ou selon les modalités convenues entre les deux parties.",
      "Le solde devra être réglé avant le début des cours.",
    ],
  },
  {
    num: "Article 7",
    titre: "Acompte",
    contenu: [
      "Un acompte peut être demandé afin de bloquer un créneau.",
      "L'acompte constitue un engagement ferme et définitif.",
      "En cas d'annulation de la part de la cliente, l'acompte ne sera pas remboursé.",
      "En cas d'annulation par MH Defense, la cliente pourra choisir entre :",
    ],
    liste: ["Le remboursement intégral de l'acompte.", "Le report de la prestation à une autre date."],
  },
  {
    num: "Article 8",
    titre: "Annulation et report",
    contenu: [
      "Toute annulation effectuée plus de 48 heures avant le début du cours pourra donner lieu à un report de la séance.",
      "Toute annulation effectuée moins de 48 heures avant le cours entraînera la perte du cours réservé et aucun remboursement ne sera effectué.",
      "Toute absence non signalée sera considérée comme une annulation tardive.",
      "Un report exceptionnel pourra être accordé en cas de force majeure.",
    ],
  },
  {
    num: "Article 9",
    titre: "Remboursement",
    contenu: [
      "Les prestations déjà réalisées ne sont pas remboursables.",
      "Les forfaits commencés ne pourront faire l'objet d'aucun remboursement.",
      "Les forfaits non utilisés en totalité ne pourront pas être remboursés.",
      "Toute demande de remboursement devra être formulée par écrit.",
    ],
  },
  {
    num: "Article 10",
    titre: "Retard",
    contenu: [
      "En cas de retard de la cliente, la séance se terminera à l'heure initialement prévue.",
      "Le temps perdu ne pourra pas être récupéré, sauf accord exceptionnel.",
    ],
  },
  {
    num: "Article 11",
    titre: "Aptitude physique",
    contenu: [
      "La cliente reconnaît être apte à pratiquer une activité physique.",
      "Elle s'engage à signaler tout problème de santé susceptible d'avoir une incidence sur sa participation.",
      "En cas de doute, la cliente est invitée à consulter un professionnel de santé avant le début des cours.",
    ],
  },
  {
    num: "Article 12",
    titre: "Responsabilité",
    contenu: [
      "La pratique de la self-défense implique une activité physique comportant certains risques.",
      "MH Defense s'engage à mettre en œuvre tous les moyens nécessaires pour assurer la sécurité des participantes.",
      "La responsabilité de MH Defense ne pourra être engagée en cas :",
    ],
    liste: [
      "De non-respect des consignes.",
      "D'informations médicales non communiquées.",
      "D'accident lié à une contre-indication médicale.",
      "De force majeure.",
    ],
  },
  {
    num: "Article 13",
    titre: "Comportement des participantes",
    contenu: [
      "MH Defense se réserve le droit d'interrompre une séance ou d'exclure une participante en cas de comportement inapproprié, irrespectueux ou dangereux.",
      "Cette exclusion ne donnera lieu à aucun remboursement.",
    ],
  },
  {
    num: "Article 14",
    titre: "Protection des données personnelles",
    contenu: [
      "Les informations recueillies lors des réservations sont utilisées uniquement dans le cadre de la gestion des prestations proposées par MH Defense.",
      "Les données personnelles ne seront ni vendues ni communiquées à des tiers.",
    ],
  },
  {
    num: "Article 15",
    titre: "Droit applicable et litiges",
    contenu: [
      "Les présentes conditions générales de vente sont soumises au droit français.",
      "En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action en justice.",
      "À défaut d'accord amiable, les tribunaux compétents seront ceux du ressort du domicile professionnel de MH Defense.",
    ],
  },
];

export default function CGVPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.top}>
          <div className={styles.topInner}>
            <div className={styles.tag}>Informations légales</div>
            <h1>Conditions <span>Générales de Vente</span></h1>
            <p>Les conditions applicables aux cours privés de self-défense MH Defense.</p>
            <div className={styles.maj}>Version en vigueur à compter du 1ᵉʳ septembre 2026</div>
          </div>
        </section>

        <section className={styles.body}>
          <div className={styles.narrow}>
            {ARTICLES.map((art) => (
              <div key={art.num} className={styles.art}>
                <h2 className={styles.artTitle}>
                  <span className={styles.artNum}>{art.num}</span>
                  {art.titre}
                </h2>
                {art.contenu?.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {art.liste && (
                  <ul>
                    {art.liste.map((li, i) => (
                      <li key={i}>{li}</li>
                    ))}
                  </ul>
                )}
                {art.apres?.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ))}

            <div className={styles.sep} />

            <div className={styles.infoCard}>
              <div className={styles.row}><span>Éditeur</span><span>Marie Hervas Diaz — MH Defense</span></div>
              <div className={styles.row}><span>SIRET</span><span>105 616 775 00018</span></div>
              <div className={styles.row}><span>Adresse</span><span>Sarrians (84260) — France</span></div>
              <div className={styles.row}><span>E-mail</span><span>contact@mh-defense.com</span></div>
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