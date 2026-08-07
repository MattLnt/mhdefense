import Image from "next/image";
import styles from "./Audience.module.css";

const PUBLICS = [
  {
    titre: "Femmes",
    desc: "Réagir avec calme et précision, reprendre confiance en soi.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="7" r="4" />
        <path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      </svg>
    ),
  },
  {
    titre: "Adolescents",
    desc: "Poser ses limites, se protéger, gagner en assurance.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l8 4v5c0 4.4-3.2 7.4-8 9-4.8-1.6-8-4.6-8-9V7z" />
      </svg>
    ),
  },
  {
    titre: "Enfants",
    desc: "Apprendre à se défendre en s'amusant, en toute bienveillance.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="6" r="3" />
        <path d="M12 9v7M8 21l4-5 4 5M7 13h10" />
      </svg>
    ),
  },
];

export default function Audience() {
  return (
    <section className={styles.section} id="pour-qui">
      <div className="wrap">
        <div className={styles.grid}>
          {/* Texte + liste */}
          <div>
            <span className={`eyebrow ${styles.eyebrow}`}>Pour qui ?</span>
            <h2 className={styles.title}>
              Un accompagnement pour chacune, à chaque âge.
            </h2>
            <p className={styles.intro}>
              Que vous cherchiez à gagner en assurance, à apprendre à réagir ou
              simplement à vous sentir plus libre au quotidien — chaque séance
              s'adapte à vous.
            </p>

            <div className={styles.list}>
              {PUBLICS.map((p) => (
                <div key={p.titre} className={styles.item}>
                  <div className={styles.icon}>{p.icon}</div>
                  <div>
                    <h3>{p.titre}</h3>
                    <p>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photo d'action */}
          <div className={styles.media}>
            <Image
              src="/images/action.jpg"
              alt="Démonstration de self-défense"
              fill
              sizes="(max-width: 900px) 440px, 560px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}