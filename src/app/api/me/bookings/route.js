import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/me/bookings
 * Renvoie toutes les réservations du membre, séparées en à venir / passées.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const now = new Date();

    const all = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"] },
      },
      orderBy: { startsAt: "desc" },
      select: {
        id: true,
        startsAt: true,
        sessionType: true,
        status: true,
        type: true,
        isFreeTrial: true,
      },
    });

    const upcoming = [];
    const past = [];
    for (const b of all) {
      const item = { ...b, startsAt: b.startsAt.toISOString() };
      if (b.startsAt >= now && b.status === "CONFIRMED") upcoming.push(item);
      else past.push(item);
    }
    // À venir : ordre chronologique croissant
    upcoming.reverse();

    return NextResponse.json({ upcoming, past });
  } catch (error) {
    console.error("[api/me/bookings]", error);
    return NextResponse.json(
      { error: "Impossible de charger vos séances." },
      { status: 500 }
    );
  }
}