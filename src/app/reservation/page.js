"use client";

import { Suspense } from "react";
import { ReservationProvider } from "./components/ReservationContext";
import ReservationTunnel from "./components/ReservationTunnel";

export default function ReservationPage() {
  return (
    <Suspense fallback={null}>
      <ReservationProvider>
        <ReservationTunnel />
      </ReservationProvider>
    </Suspense>
  );
}