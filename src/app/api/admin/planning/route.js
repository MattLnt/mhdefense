import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/planning
 * Vue d'ensemble pour l'admin : séances du jour, à venir, et quelques stats.
 */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const now = new Date();

    // Bornes du jour
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay); endOfDay.setDate(endOfDay.getDate() + 1);

    // Bornes de la semaine (lundi → dimanche)
    const startOfWeek = new Date(startOfDay);
    const dow = (startOfWeek.getDay() + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - dow);
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(endOfWeek.getDate() + 7);

    const OCCUP = ["CONFIRMED", "COMPLETED"];

    // Séances du jour (confirmées / à venir)
    const today = await prisma.booking.findMany({
      where: {
        startsAt: { gte: startOfDay, lt: endOfDay },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      orderBy: { startsAt: "asc" },
      include: {
        user: { select: { name: true, phone: true } },
        payment: { select: { status: true, amountDueOnSite: true, onSitePaid: true } },
      },
    });

    // Prochaines séances (après aujourd'hui, 10 max)
    const upcoming = await prisma.booking.findMany({
      where: {
        startsAt: { gte: endOfDay },
        status: "CONFIRMED",
      },
      orderBy: { startsAt: "asc" },
      take: 10,
      include: {
        user: { select: { name: true, phone: true } },
        payment: { select: { status: true } },
      },
    });

    // Stats
    const [countToday, countWeek, activeSubs, pendingSolde] = await Promise.all([
      prisma.booking.count({
        where: { startsAt: { gte: startOfDay, lt: endOfDay }, status: { in: OCCUP } },
      }),
      prisma.booking.count({
        where: { startsAt: { gte: startOfWeek, lt: endOfWeek }, status: { in: OCCUP } },
      }),
      prisma.subscription.count({ where: { status: { in: ["ACTIVE", "PAST_DUE"] } } }),
      prisma.payment.count({ where: { status: "PARTIAL", onSitePaid: false } }),
    ]);

    const serialize = (b) => ({
      id: b.id,
      startsAt: b.startsAt.toISOString(),
      sessionType: b.sessionType,
      type: b.type,
      status: b.status,
      isFreeTrial: b.isFreeTrial,
      participantsCount: b.participantsCount,
      clientName: b.user?.name || b.guestName || "Client",
      clientPhone: b.user?.phone || b.guestPhone || null,
      paymentStatus: b.payment?.status || null,
      amountDueOnSite: b.payment?.amountDueOnSite || 0,
      onSitePaid: b.payment?.onSitePaid || false,
    });

    return NextResponse.json({
      today: today.map(serialize),
      upcoming: upcoming.map(serialize),
      stats: {
        today: countToday,
        week: countWeek,
        activeSubs,
        pendingSolde,
      },
    });
  } catch (error) {
    console.error("[api/admin/planning]", error);
    return NextResponse.json(
      { error: "Impossible de charger le planning." },
      { status: 500 }
    );
  }
}