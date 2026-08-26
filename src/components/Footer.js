import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";

const NAV = [
  { label: "Accueil", href: "/" },
  { label: "Formules", href: "/#formules" },
  { label: "L'instructrice", href: "/instructrice" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

const LEGAL = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "CGV", href: "/cgv" },
  { label: "Confidentialité", href: "/confidentialite" },
];

const IconInstagram = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconPhone = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8 9.6a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z" />
  </svg>
);

const IconPin = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          {/* Marque */}
          <div className={styles.brand}>
            <Image src="/images/logo-white.svg" alt="MH Defense" width={220} height={110} className={styles.logo} />
            <p className={styles.brandText}>
              Cours de self-défense 100 % féminins à Sarrians, encadrés par une
              championne du monde de karaté. Reprenez confiance, révélez votre force.
            </p>
            <div className={styles.socials}>
              <Link href="https://instagram.com/mh_defense" target="_blank" rel="noopener noreferrer" className={styles.social} aria-label="Instagram">
                <IconInstagram />
              </Link>
              <Link href="tel:+33651001401" className={styles.social} aria-label="Téléphone">
                <IconPhone />
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <div className={styles.col}>
            <h4>Navigation</h4>
            <ul>
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Formules */}
          <div className={styles.col}>
            <h4>Formules</h4>
            <ul>
              <li><Link href="/reservation">Séance à l'unité</Link></li>
              <li><Link href="/reservation">Abonnement mensuel</Link></li>
              <li><Link href="/reservation">Séance d'essai offerte</Link></li>
              <li><Link href="/compte">Mon espace</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.col}>
            <h4>Contact</h4>
            <div className={styles.contact}>
              <Link href="tel:+33651001401" className={styles.contactItem}>
                <IconPhone />
                06 51 00 14 01
              </Link>
              <div className={styles.contactItem}>
                <IconPin />
                Sarrians (84260), Vaucluse
              </div>
              <Link href="https://instagram.com/mh_defense" target="_blank" rel="noopener noreferrer" className={styles.contactItem}>
                <IconInstagram />
                @mh_defense
              </Link>
            </div>
          </div>
        </div>

        {/* Barre du bas */}
        <div className={styles.bottom}>
          <div className={styles.copy}>
            © {year} MH Defense. Tous droits réservés.
          </div>
          <div className={styles.legal}>
            {LEGAL.map((item) => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}