"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Image from "next/image";
import styles from "./Dashboard.module.css";

/* ---------- Icônes ---------- */
const IconPlanning = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);
const IconDispo = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);
const IconResa = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);
const IconClients = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3.1-6 7-6s7 2 7 6" /><path d="M17 8a4 4 0 010 8" />
  </svg>
);
const IconTarifs = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 12l-8 8-9-9V3h8z" /><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
  </svg>
);
const IconPromo = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 9V6a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 000 6v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3a2 2 0 000-6z" />
    <path d="M9 9h.01M15 15h.01M15 9l-6 6" />
  </svg>
);
const IconQr = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M20 14v.01M14 20h.01M20 20h.01M17 17h.01M20 17h.01M17 20h.01" />
  </svg>
);
const IconLogout = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
  </svg>
);

const NAV = [
  { section: "Gestion" },
  { href: "/dashboard", label: "Planning", short: "Planning", Icon: IconPlanning },
  { href: "/dashboard/disponibilites", label: "Disponibilités", short: "Dispos", Icon: IconDispo },
  { href: "/dashboard/reservations", label: "Réservations", short: "Résas", Icon: IconResa },
  { section: "Clientèle" },
  { href: "/dashboard/clients", label: "Clients & abonnements", short: "Clients", Icon: IconClients },
  { section: "Configuration" },
  { href: "/dashboard/tarifs", label: "Tarifs", short: "Tarifs", Icon: IconTarifs },
  { href: "/dashboard/promos", label: "Codes promo", short: "Promos", Icon: IconPromo },
  { href: "/dashboard/qrcode", label: "QR Code", short: "QR", Icon: IconQr },
];

const FLAT = NAV.filter((n) => n.href);

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [theme, setTheme] = useState("dark");
  const [collapsed, setCollapsed] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem("mh_admin_theme");
    const c = localStorage.getItem("mh_admin_collapsed");
    if (t) setTheme(t);
    if (c) setCollapsed(c === "1");
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setMe(d.user))
      .catch(() => {});
  }, []);

  function changeTheme(t) {
    setTheme(t);
    localStorage.setItem("mh_admin_theme", t);
  }
  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem("mh_admin_collapsed", !c ? "1" : "0");
      return !c;
    });
  }

  const isActive = (href) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const initial = (me?.name || "A").trim().charAt(0).toUpperCase();

  return (
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ""}`} data-theme={theme}>
      {/* ---------- Sidebar ---------- */}
      <aside className={styles.side}>
        <div className={styles.topSide}>
          <div className={styles.brand}>
            <Image
              src="/images/logo-white.svg"
              alt="MH Defense"
              width={200}
              height={100}
              className={`${styles.logo} ${styles.logoDark}`}
            />
            <Image
              src="/images/logo.svg"
              alt="MH Defense"
              width={200}
              height={100}
              className={`${styles.logo} ${styles.logoLight}`}
            />
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV.map((item, i) =>
            item.section ? (
              <div key={`s-${i}`} className={styles.navSection}>{item.section}</div>
            ) : (
              <button
                key={item.href}
                className={`${styles.navLink} ${isActive(item.href) ? styles.on : ""}`}
                onClick={() => router.push(item.href)}
                title={collapsed ? item.label : undefined}
              >
                <item.Icon />
                <span className={styles.navLabel}>{item.label}</span>
              </button>
            )
          )}
        </nav>

        <div className={styles.foot}>
          <div className={styles.userBox}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.userInfo}>
              <b>{me?.name || "Administration"}</b>
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

      {/* Bouton toggle flottant (sur le bord de la sidebar) */}
      <button
        className={styles.toggleBtn}
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Déployer le menu" : "Réduire le menu"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* ---------- Zone principale ---------- */}
      <main className={styles.main}>
        <div className={styles.headRow}>
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
        {FLAT.map(({ href, short, Icon }) => (
          <button
            key={href}
            className={`${styles.barLink} ${isActive(href) ? styles.on : ""}`}
            onClick={() => router.push(href)}
          >
            <Icon />
            <span>{short}</span>
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