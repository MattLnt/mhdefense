import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/me
 * Renvoie le profil du membre connecté : son abonnement actif
 * et ses réservations à venir.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    // Abonnement actif (le plus récent non terminé)
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "PAST_DUE"] },
      },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });

    // Réservations à venir
    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        startsAt: { gte: new Date() },
        status: { in: ["HELD", "CONFIRMED"] },
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        sessionType: true,
        status: true,
        isFreeTrial: true,
      },
    });

    // Nombre de séances déjà réservées cette semaine (pour le quota abo)
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = (startOfWeek.getDay() + 6) % 7; // lundi = 0
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const bookingsThisWeek = await prisma.booking.count({
      where: {
        userId: session.user.id,
        startsAt: { gte: startOfWeek, lt: endOfWeek },
        status: { in: ["HELD", "CONFIRMED", "COMPLETED"] },
      },
    });

    return NextResponse.json({
      user,
      subscription: subscription
        ? {
            sessionType: subscription.sessionType,
            frequency: subscription.frequency,
            weeklyQuota: subscription.weeklyQuota,
            status: subscription.status,
            engagementEndsAt: subscription.engagementEndsAt,
            cancelAt: subscription.cancelAt,
            monthlyAmount: subscription.plan.price * subscription.participantsCount,
            planKey: subscription.plan.key,
          }
        : null,
      bookings: bookings.map((b) => ({
        ...b,
        startsAt: b.startsAt.toISOString(),
      })),
      weeklyUsage: {
        used: bookingsThisWeek,
        quota: subscription?.weeklyQuota || 0,
      },
    });
  } catch (error) {
    console.error("[api/me]", error);
    return NextResponse.json(
      { error: "Impossible de charger votre profil." },
      { status: 500 }
    );
  }
}