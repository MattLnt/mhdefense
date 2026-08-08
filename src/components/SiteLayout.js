import Header from "./Header";
import Footer from "./Footer";

/**
 * Layout des pages vitrine (site public) : Header en haut, Footer en bas.
 * À utiliser sur : home, tarifs, instructrice, faq, contact.
 * NE PAS utiliser sur /compte, /dashboard, /connexion (layouts dédiés).
 */
export default function SiteLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}