import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/booking/essai
 * Body : { startsAt, name, email, phone }
 * Crée une réservation d'essai gratuite (CONFIRMED, sans paiement).
 * Règle : un seul essai gratuit par email.
 */
export async function POST(request) {
  try {
    const { startsAt, name, email, phone } = await request.json();

    if (!startsAt || !name || !email || !phone) {
      return NextResponse.json(
        { error: "Informations incomplètes." },
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

    const normalizedEmail = email.trim().toLowerCase();

    // Règle : un seul essai gratuit par email.
    // On vérifie côté guest (guestEmail) ET côté compte (user.email).
    const dejaEssai = await prisma.booking.findFirst({
      where: {
        isFreeTrial: true,
        status: { in: ["HELD", "CONFIRMED", "COMPLETED"] },
        OR: [
          { guestEmail: normalizedEmail },
          { user: { email: normalizedEmail } },
        ],
      },
    });

    if (dejaEssai) {
      return NextResponse.json(
        {
          error:
            "Une séance d'essai gratuite a déjà été utilisée avec cet email.",
        },
        { status: 409 }
      );
    }

    // Création directe en CONFIRMED (pas de paiement).
    // Le créneau est protégé par l'index unique partiel : si quelqu'un
    // vient de le prendre, P2002 → 409.
    const booking = await prisma.booking.create({
      data: {
        startsAt: start,
        type: "PONCTUEL",
        sessionType: "INDIVIDUEL",
        status: "CONFIRMED",
        participantsCount: 1,
        isFreeTrial: true,
        guestName: name.trim(),
        guestEmail: normalizedEmail,
        guestPhone: phone.trim(),
      },
      select: { id: true },
    });

    return NextResponse.json({ booking });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ce créneau vient d'être réservé. Choisissez-en un autre." },
        { status: 409 }
      );
    }
    console.error("[booking/essai]", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer votre séance d'essai." },
      { status: 500 }
    );
  }
}