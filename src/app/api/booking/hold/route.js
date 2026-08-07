import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Durée de blocage d'un créneau le temps du paiement.
const HOLD_MINUTES = 15;

/**
 * POST /api/booking/hold
 * Body : { startsAt: ISO, type, sessionType, participantsCount, isFreeTrial }
 * Crée une réservation HELD qui expire dans 15 min.
 * Si le créneau est déjà pris → 409 (grâce à l'index unique partiel).
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { startsAt, type, sessionType, participantsCount, isFreeTrial } = body;

    // Validation minimale
    if (!startsAt || !type || !sessionType) {
      return NextResponse.json(
        { error: "Données de réservation incomplètes." },
        { status: 400 }
      );
    }

    const start = new Date(startsAt);
    if (isNaN(start) || start <= new Date()) {
      return NextResponse.json(
        { error: "Créneau invalide ou déjà passé." },
        { status: 400 }
      );
    }

    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    // La création peut échouer si un autre paiement a déjà pris ce créneau :
    // l'index unique partiel sur Booking(startsAt) WHERE status IN
    // ('HELD','CONFIRMED','COMPLETED') lève alors une erreur P2002.
    const booking = await prisma.booking.create({
      data: {
        startsAt: start,
        type, // PONCTUEL | ABONNEMENT
        sessionType, // INDIVIDUEL | DUO | GROUPE
        status: "HELD",
        participantsCount: participantsCount || 1,
        isFreeTrial: Boolean(isFreeTrial),
        expiresAt,
      },
      select: { id: true, startsAt: true, expiresAt: true },
    });

    return NextResponse.json({ booking });
  } catch (error) {
    // P2002 = violation de contrainte unique → créneau déjà réservé
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ce créneau vient d'être réservé. Choisissez-en un autre." },
        { status: 409 }
      );
    }
    console.error("[booking/hold]", error);
    return NextResponse.json(
      { error: "Impossible de bloquer ce créneau." },
      { status: 500 }
    );
  }
}