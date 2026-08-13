"use client";

import { useReservation, STEPS } from "./ReservationContext";
import { Check } from "./icons";
import styles from "../Reservation.module.css";

export default function Stepper() {
  const { step } = useReservation();

  return (
    <div className={styles.stepper}>
      {STEPS.map((label, i) => {
        const cls =
          i < step ? `${styles.stp} ${styles.stpDone}`
          : i === step ? `${styles.stp} ${styles.stpActive}`
          : styles.stp;
        return (
          <div key={label} className={cls}>
            <div className={styles.stpDot}>{i < step ? <Check /> : i + 1}</div>
            <div className={styles.stpLabel}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}