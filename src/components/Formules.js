import Link from "next/link";
import styles from "./Formules.module.css";

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function Formules() {
  return (
    <section className={styles.section} id="formules">
      <div className="wrap">
        <div className={styles.head}>
          <div>
            <span className={`eyebrow ${styles.eyebrow}`}>Les formules</span>
            <h2>Seule, à deux ou en petit groupe.</h2>
          </div>
          <p className={styles.intro}>
            Chaque séance dure 1&nbsp;heure, dans un lieu privé à Sarrians, dans
            une ambiance bienveillante et sans jugement.
          </p>
        </div>

        <div className={styles.grid}>
          {/* Vedette — Séance individuelle */}
          <div className={styles.hero}>
            <div className={styles.ico}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7">
                <circle cx="12" cy="7" r="4" />
                <path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              </svg>
            </div>
            <div className={styles.body}>
              <span className={styles.badge}>★ La plus demandée · 1 personne</span>
              <h3>Séance individuelle</h3>
              <p className={styles.desc}>
                Cours 100 % personnalisé, adapté à vos besoins, votre niveau et
                votre rythme. L'attention est entièrement sur vous.
              </p>
              <div className={styles.foot}>
                <div className={styles.price}>
                  60 €<span> / la séance</span>
                </div>
                <Link href="/reservation" className={styles.cta}>
                  Réserver <Arrow />
                </Link>
              </div>
            </div>
          </div>

          {/* Groupe — duo & petit groupe réunis */}
          <div className={styles.group}>
            <div className={styles.ico}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7">
                <circle cx="12" cy="8" r="3" />
                <circle cx="5.5" cy="10" r="2.3" />
                <circle cx="18.5" cy="10" r="2.3" />
                <path d="M8 20c0-2.5 1.8-4 4-4s4 1.5 4 4" />
              </svg>
            </div>
            <div className={styles.body}>
              <span className={styles.badge}>2 à 3 personnes</span>
              <h3>Duo ou petit groupe</h3>
              <p className={styles.desc}>
                À deux ou à trois — entre amis, en famille ou en couple. On
                progresse ensemble dans une belle dynamique.
              </p>
              <div className={styles.foot}>
                <div className={styles.price}>
                  45 €<span> / personne</span>
                </div>
                <Link href="/reservation" className={styles.go}>
                  Réserver <Arrow />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}