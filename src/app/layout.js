import { Inter } from "next/font/google";
import "./globals.css";

// Inter pour tout : titres et corps. Sobre, moderne, premium discret.
const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const SITE_URL = "https://mh-defense.fr";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MH Defense — Self-défense féminine à Sarrians (84)",
    template: "%s · MH Defense",
  },
  description:
    "Cours de self-défense 100 % féminins à Sarrians (Vaucluse), encadrés par une championne du monde de karaté. Femmes, adolescents et enfants. Réservation en ligne.",
  keywords: [
    "self-défense",
    "self défense femme",
    "self-défense Sarrians",
    "self-défense Vaucluse",
    "cours self-défense féminin",
    "karaté Sarrians",
    "MH Defense",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "MH Defense",
    title: "MH Defense — Self-défense féminine à Sarrians (84)",
    description:
      "Apprenez à vous protéger, révélez votre force. Cours 100 % féminins encadrés par une championne du monde de karaté.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Données structurées pour le SEO local
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: "MH Defense",
  description:
    "Cours de self-défense 100 % féminins à Sarrians, encadrés par une championne du monde de karaté.",
  url: SITE_URL,
  telephone: "+33651001401",
  areaServed: "Sarrians, Vaucluse, France",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sarrians",
    postalCode: "84260",
    addressRegion: "Vaucluse",
    addressCountry: "FR",
  },
  sameAs: ["https://www.instagram.com/mh_defense"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}