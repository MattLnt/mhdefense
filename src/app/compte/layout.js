"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import styles from "./Compte.module.css";

/* ---------- Icônes ---------- */
const IconDash = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" />
  </svg>
);
const IconSessions = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
const IconAbo = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2l2.4 6.9H21l-5.3 4 2 6.9-5.7-4.2L6.3 19.8l2-6.9L3 8.9h6.6z" />
  </svg>
);
const IconProfil = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const IconLogout = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
  </svg>
);

const NAV = [
  { href: "/compte", label: "Tableau de bord", Icon: IconDash },
  { href: "/compte/seances", label: "Mes séances", Icon: IconSessions },
  { href: "/compte/abonnement", label: "Mon abonnement", Icon: IconAbo },
  { href: "/compte/profil", label: "Mon profil", Icon: IconProfil },
];

export default function CompteLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [theme, setTheme] = useState("dark");
  const [collapsed, setCollapsed] = useState(false);
  const [me, setMe] = useState(null);

  // Restaure les préférences mémorisées
  useEffect(() => {
    const t = localStorage.getItem("mh_theme");
    const c = localStorage.getItem("mh_collapsed");
    if (t) setTheme(t);
    if (c) setCollapsed(c === "1");
  }, []);

  // Charge le profil (nom / email)
  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMe(d.user))
      .catch(() => {});
  }, []);

  function changeTheme(t) {
    setTheme(t);
    localStorage.setItem("mh_theme", t);
  }
  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem("mh_collapsed", !c ? "1" : "0");
      return !c;
    });
  }

  const isActive = (href) =>
    href === "/compte" ? pathname === "/compte" : pathname.startsWith(href);

  const initial = (me?.name || "M").trim().charAt(0).toUpperCase();

  return (
    <div
      className={`${styles.shell} ${collapsed ? styles.collapsed : ""}`}
      data-theme={theme}
    >
      {/* ---------- Sidebar (desktop) ---------- */}
      <aside className={styles.side}>
        <div className={styles.topSide}>
          <div className={styles.brand}>
            <div className={styles.mark}>MH</div>
            <div className={styles.brandName}>MH DEFENSE</div>
          </div>
          <button className={styles.burger} onClick={toggleCollapsed} aria-label="Réduire le menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ href, label, Icon }) => (
            <button
              key={href}
              className={`${styles.navLink} ${isActive(href) ? styles.on : ""}`}
              onClick={() => router.push(href)}
            >
              <Icon />
              <span className={styles.navLabel}>{label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.foot}>
          <div className={styles.userBox}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.userInfo}>
              <b>{me?.name || "Mon compte"}</b>
              <span>{me?.email || ""}</span>
            </div>
            <button
              className={styles.logoutBtn}
              onClick={() => signOut({ callbackUrl: "/" })}
              aria-label="Se déconnecter"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ---------- Zone principale ---------- */}
      <main className={styles.main}>
        <div className={styles.headRow}>
          <div style={{ flex: 1 }} />
          <div className={styles.themeToggle}>
            <button
              className={`${styles.themeOpt} ${theme === "dark" ? styles.act : ""}`}
              onClick={() => changeTheme("dark")}
              aria-label="Mode sombre"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />
              </svg>
            </button>
            <button
              className={`${styles.themeOpt} ${theme === "light" ? styles.act : ""}`}
              onClick={() => changeTheme("light")}
              aria-label="Mode clair"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
              </svg>
            </button>
          </div>
        </div>

        {children}
      </main>

      {/* ---------- Bottom bar (mobile) ---------- */}
      <nav className={styles.bottomBar}>
        {NAV.map(({ href, label, Icon }) => (
          <button
            key={href}
            className={`${styles.barLink} ${isActive(href) ? styles.on : ""}`}
            onClick={() => router.push(href)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
        <button
          className={styles.barLink}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <IconLogout />
          <span>Quitter</span>
        </button>
      </nav>
    </div>
  );
}