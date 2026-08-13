"use client";

import PasswordField from "@/components/PasswordField";
import { useReservation } from "./ReservationContext";
import styles from "../Reservation.module.css";

export default function StepInfos() {
  const { isAbo, nbPersonnes, form, setField } = useReservation();

  return (
    <>
      <div className={styles.qTitle}>Vos informations</div>
      <div className={styles.qSub}>
        {isAbo
          ? "Un compte est créé pour gérer votre abonnement et vos réservations."
          : "Pour vous envoyer la confirmation et l'adresse exacte."}
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="name">Nom et prénom</label>
          <input id="name" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="Marie Dupont" />
        </div>
        <div className={styles.field}>
          <label htmlFor="phone">Téléphone</label>
          <input id="phone" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="06 12 34 56 78" />
        </div>
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="marie@exemple.fr" />
        </div>

        {isAbo && (
          <div className={styles.field}>
            <label htmlFor="password">Mot de passe</label>
            <PasswordField id="password" value={form.password} onChange={(v) => setField("password", v)} />
          </div>
        )}

        {nbPersonnes > 1 && (
          <>
            <div className={styles.subhead}>Les autres participants</div>
            <div className={styles.field}>
              <label htmlFor="p2">2ᵉ participant</label>
              <input id="p2" value={form.p2Name} onChange={(e) => setField("p2Name", e.target.value)} placeholder="Nom et prénom" />
            </div>
            {nbPersonnes === 3 && (
              <div className={styles.field}>
                <label htmlFor="p3">3ᵉ participant</label>
                <input id="p3" value={form.p3Name} onChange={(e) => setField("p3Name", e.target.value)} placeholder="Nom et prénom" />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}