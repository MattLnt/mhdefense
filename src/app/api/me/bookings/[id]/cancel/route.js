import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Délai minimum avant la séance pour pouvoir annuler soi-même (en heures)
const MIN_HOURS_BEFORE = 24;

/**
 * POST /api/me/bookings/[id]/cancel
 * Annule une séance du membre connecté (si elle lui appartient et
 * qu'elle est à plus de 24h). Libère le créneau.
 */
export async function POST(_request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({ where: { id } });

    // Vérifs : existe, appartient au membre, est confirmée
    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });
    }
    if (booking.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Cette séance ne peut pas être annulée." },
        { status: 409 }
      );
    }

    // Délai minimum
    const hoursUntil = (booking.startsAt.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < MIN_HOURS_BEFORE) {
      return NextResponse.json(
        {
          error: `Une séance ne peut être annulée que jusqu'à ${MIN_HOURS_BEFORE}h à l'avance. Contactez-nous pour toute annulation de dernière minute.`,
        },
        { status: 409 }
      );
    }

    // Annulation → libère le créneau (l'index unique ne bloque plus)
    await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[bookings/cancel]", error);
    return NextResponse.json(
      { error: "Impossible d'annuler cette séance." },
      { status: 500 }
    );
  }
}