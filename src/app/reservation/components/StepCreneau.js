"use client";

import SlotPicker from "@/components/SlotPicker";
import { useReservation } from "./ReservationContext";
import styles from "../Reservation.module.css";

export default function StepCreneau() {
  const { isAbo, maxSlots, slots, setSlots } = useReservation();

  return (
    <>
      <div className={styles.qTitle}>
        {isAbo ? "Votre créneau habituel" : "Quand souhaitez-vous venir ?"}
      </div>
      <div className={styles.qSub}>
        {isAbo
          ? maxSlots === 1
            ? "Choisissez votre créneau hebdomadaire habituel. Ajustable chaque semaine depuis votre compte."
            : "Choisissez vos 2 créneaux hebdomadaires habituels. Ajustables chaque semaine depuis votre compte."
          : "Séances d'1 heure, du lundi au dimanche."}
      </div>
      <div className={styles.slotWrap}>
        <SlotPicker max={maxSlots} value={slots} onChange={setSlots} />
      </div>
    </>
  );
}