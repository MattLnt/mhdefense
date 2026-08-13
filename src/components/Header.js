"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

const NAV = [
  { label: "Accueil", href: "/" },
  { label: "Formules", href: "/#formules" },
  { label: "L'instructrice", href: "/instructrice" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        <Link href="/" aria-label="MH Defense — accueil">
          <Image
            src="/images/logo-white.png"
            alt="MH Defense"
            width={140}
            height={140}
            className={styles.logo}
            priority
          />
        </Link>

        <nav className={styles.links}>
          {NAV.map((item) => (
            <Link key={item.label} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link href="/compte" className={styles.account}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <span>Mon espace</span>
          </Link>

          <Link href="/reservation" className={`btn btn-rose ${styles.headerCta}`}>
            Réserver une séance
          </Link>
        </div>

        <button
          className={styles.burger}
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </button>
      </div>

      <div className={`${styles.mobileMenu} ${open ? styles.mobileOpen : ""}`}>
        {NAV.map((item) => (
          <Link key={item.label} href={item.href} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
        <Link href="/compte" className={styles.mobileAccount} onClick={() => setOpen(false)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          Mon espace
        </Link>
        <Link
          href="/reservation"
          className={`btn btn-rose ${styles.mobileCta}`}
          onClick={() => setOpen(false)}
        >
          Réserver une séance
        </Link>
      </div>
    </header>
  );
}