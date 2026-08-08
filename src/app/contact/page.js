"use client";

import { useState } from "react";
import SiteLayout from "@/components/SiteLayout";
import styles from "./Contact.module.css";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // { type, text }

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.error || "Une erreur est survenue." });
        setLoading(false);
        return;
      }
      setMsg({
        type: "success",
        text: "Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.",
      });
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setMsg({ type: "error", text: "Une erreur est survenue. Réessayez." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <main className={styles.page}>
        {/* Bandeau */}
        <section className={styles.top}>
          <div className={`${styles.narrow} ${styles.topInner}`}>
            <div className={styles.tag}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16v12H5.2L4 17.2V4z" />
              </svg>
              Contact
            </div>
            <h1>Parlons de <span>votre sécurité</span></h1>
            <p>Une question, une demande particulière ? Écrivez-nous, on vous répond avec plaisir.</p>
          </div>
        </section>

        <section className={styles.body}>
          <div className={`${styles.narrow} ${styles.grid}`}>
            {/* Formulaire */}
            <form className={styles.formCard} onSubmit={handleSubmit}>
              <h2>Envoyez-nous un message</h2>
              <p className={styles.lead}>Nous vous répondrons dans les plus brefs délais.</p>

              {msg && (
                <div className={`${styles.message} ${styles[msg.type]}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    {msg.type === "success" ? (
                      <path d="M20 6L9 17l-5-5" />
                    ) : (
                      <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>
                    )}
                  </svg>
                  <span>{msg.text}</span>
                </div>
              )}

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label htmlFor="name">Nom et prénom *</label>
                  <input
                    id="name"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Marie Dupont"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="phone">Téléphone</label>
                  <input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="marie@exemple.fr"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="message">Votre message *</label>
                <textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setField("message", e.target.value)}
                  placeholder="Bonjour, je souhaiterais…"
                  required
                />
              </div>

              <button className={styles.submit} disabled={loading}>
                {loading ? "Envoi…" : "Envoyer le message"}
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                )}
              </button>
            </form>

            {/* Coordonnées */}
            <div className={styles.info}>
              <a href="tel:+33651001401" className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8 9.6a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z" />
                  </svg>
                </div>
                <div className={styles.infoText}>
                  <b>Téléphone</b>
                  <span>06 51 00 14 01</span>
                </div>
              </a>

              <a
                href="https://instagram.com/mh_defense"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.infoCard}
              >
                <div className={styles.infoIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <div className={styles.infoText}>
                  <b>Instagram</b>
                  <span>@mh_defense</span>
                </div>
              </a>

              <div className={styles.locationCard}>
                <h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Où nous trouver
                </h3>
                <p>
                  Les cours ont lieu à <strong>Sarrians (84260)</strong>, en Vaucluse.
                  L'adresse exacte du lieu vous est communiquée par email lors de votre
                  réservation.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}