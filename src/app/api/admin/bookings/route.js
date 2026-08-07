import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

/**
 * GET /api/admin/bookings?filter=upcoming|past|all&q=...
 * Liste les réservations, filtrable.
 */
export async function GET(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "upcoming";
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    const now = new Date();
    const where = { status: { in: ["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"] } };

    if (filter === "upcoming") {
      where.startsAt = { gte: now };
      where.status = { in: ["CONFIRMED"] };
    } else if (filter === "past") {
      where.startsAt = { lt: now };
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startsAt: filter === "past" ? "desc" : "asc" },
      take: 100,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        payment: {
          select: {
            mode: true,
            status: true,
            totalAmount: true,
            amountPaidOnline: true,
            amountDueOnSite: true,
            onSitePaid: true,
          },
        },
      },
    });

    let list = bookings.map((b) => ({
      id: b.id,
      startsAt: b.startsAt.toISOString(),
      sessionType: b.sessionType,
      type: b.type,
      status: b.status,
      isFreeTrial: b.isFreeTrial,
      participantsCount: b.participantsCount,
      clientName: b.user?.name || b.guestName || "Client",
      clientEmail: b.user?.email || b.guestEmail || null,
      clientPhone: b.user?.phone || b.guestPhone || null,
      payment: b.payment
        ? {
            mode: b.payment.mode,
            status: b.payment.status,
            totalAmount: b.payment.totalAmount,
            amountDueOnSite: b.payment.amountDueOnSite,
            onSitePaid: b.payment.onSitePaid,
          }
        : null,
    }));

    // Recherche texte (nom / email / téléphone)
    if (q) {
      list = list.filter(
        (b) =>
          b.clientName.toLowerCase().includes(q) ||
          (b.clientEmail || "").toLowerCase().includes(q) ||
          (b.clientPhone || "").toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ bookings: list });
  } catch (error) {
    console.error("[api/admin/bookings GET]", error);
    return NextResponse.json({ error: "Erreur de chargement." }, { status: 500 });
  }
}