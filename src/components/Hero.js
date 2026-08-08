import Link from "next/link";
import Image from "next/image";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        {/* Colonne texte */}
        <div>
          <span className={styles.badge}>
            <span className={styles.dot} />
            Self-défense féminine · Sarrians (84)
          </span>

          <h1 className={styles.title}>
            Apprenez à vous protéger, révélez{" "}
            <span className={styles.accent}>votre force.</span>
          </h1>

          <p className={styles.lead}>
            Des cours de self-défense 100 % féminins, encadrés par une
            championne du monde de karaté. Des techniques simples et efficaces,
            pour vous sentir en sécurité au quotidien.
          </p>

          <div className={styles.actions}>
            <Link href="/reservation" className="btn btn-rose">
              Réserver une séance
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <Link href="/#formules" className="btn btn-outline">
              Voir les formules
            </Link>
          </div>
        </div>

        {/* Colonne portrait */}
        <div className={styles.stage}>
          <div className={styles.frame}>
            <Image
              src="/images/instructrice.jpg"
              alt="Instructrice de self-défense MH Defense"
              fill
              sizes="(max-width: 900px) 340px, 460px"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}