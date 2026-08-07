import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/subscription/book
 * Body : { startsAt }
 * Réserve une séance de la semaine pour un abonné (consomme son quota).
 * Créée directement en CONFIRMED — couverte par l'abonnement, sans paiement.
 */
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { startsAt } = await request.json();
    if (!startsAt) {
      return NextResponse.json({ error: "Créneau manquant." }, { status: 400 });
    }

    const start = new Date(startsAt);
    if (isNaN(start) || start <= new Date()) {
      return NextResponse.json(
        { error: "Créneau invalide ou déjà passé." },
        { status: 400 }
      );
    }

    // Abonnement actif du membre
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "PAST_DUE"] },
      },
    });
    if (!subscription) {
      return NextResponse.json(
        { error: "Aucun abonnement actif." },
        { status: 403 }
      );
    }

    // Bornes de la semaine du créneau choisi (lundi → dimanche)
    const startOfWeek = new Date(start);
    const day = (startOfWeek.getDay() + 6) % 7; // lundi = 0
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Nombre de séances déjà réservées cette semaine
    const dejaReservees = await prisma.booking.count({
      where: {
        userId: session.user.id,
        startsAt: { gte: startOfWeek, lt: endOfWeek },
        status: { in: ["HELD", "CONFIRMED", "COMPLETED"] },
      },
    });

    if (dejaReservees >= subscription.weeklyQuota) {
      return NextResponse.json(
        {
          error: `Vous avez déjà réservé vos ${subscription.weeklyQuota} séance(s) cette semaine.`,
        },
        { status: 409 }
      );
    }

    // Création de la réservation, couverte par l'abonnement.
    // L'index unique partiel protège du double-booking (P2002 → 409).
    const booking = await prisma.booking.create({
      data: {
        startsAt: start,
        type: "ABONNEMENT",
        sessionType: subscription.sessionType,
        status: "CONFIRMED",
        participantsCount: subscription.participantsCount,
        userId: session.user.id,
        subscriptionId: subscription.id,
      },
      select: { id: true, startsAt: true },
    });

    return NextResponse.json({ booking });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ce créneau vient d'être réservé. Choisissez-en un autre." },
        { status: 409 }
      );
    }
    console.error("[subscription/book]", error);
    return NextResponse.json(
      { error: "Impossible de réserver ce créneau." },
      { status: 500 }
    );
  }
}