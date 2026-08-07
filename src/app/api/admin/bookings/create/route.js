import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

/**
 * POST /api/admin/bookings/create
 * Body : { startsAt, sessionType, participantsCount, guestName, guestPhone?, guestEmail?, markPaid }
 * Création manuelle d'une réservation par l'admin (client au téléphone, etc.).
 * Créée directement en CONFIRMED. Le paiement est géré hors ligne.
 */
export async function POST(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const {
      startsAt,
      sessionType,
      participantsCount,
      guestName,
      guestPhone,
      guestEmail,
      markPaid,
    } = await request.json();

    if (!startsAt || !sessionType || !guestName?.trim()) {
      return NextResponse.json(
        { error: "Créneau, type et nom du client sont requis." },
        { status: 400 }
      );
    }

    const start = new Date(startsAt);
    if (isNaN(start)) {
      return NextResponse.json({ error: "Créneau invalide." }, { status: 400 });
    }

    // Prix (depuis les réglages) pour enregistrer un paiement cohérent
    const priceKey = {
      INDIVIDUEL: "price_ponctuel_individuel",
      DUO: "price_ponctuel_duo",
      GROUPE: "price_ponctuel_groupe",
    }[sessionType];
    const setting = await prisma.setting.findUnique({ where: { key: priceKey } });
    const unit = setting ? parseInt(setting.value, 10) : 0;
    const nb = participantsCount || 1;
    const total = unit * nb;

    // Création (protégée par l'index unique → P2002 si créneau pris)
    const booking = await prisma.booking.create({
      data: {
        startsAt: start,
        type: "PONCTUEL",
        sessionType,
        status: "CONFIRMED",
        participantsCount: nb,
        guestName: guestName.trim(),
        guestPhone: guestPhone?.trim() || null,
        guestEmail: guestEmail?.trim()?.toLowerCase() || null,
        notes: "Créée manuellement (admin)",
      },
      select: { id: true },
    });

    // Paiement associé : réglé sur place (marqué payé) ou en attente
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        mode: "COMPTANT",
        status: markPaid ? "PAID" : "PENDING",
        totalAmount: total,
        amountPaidOnline: 0,
        amountDueOnSite: markPaid ? 0 : total,
        onSitePaid: !!markPaid,
      },
    });

    return NextResponse.json({ ok: true, bookingId: booking.id });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ce créneau est déjà réservé." },
        { status: 409 }
      );
    }
    console.error("[api/admin/bookings/create]", error);
    return NextResponse.json({ error: "Erreur de création." }, { status: 500 });
  }
}