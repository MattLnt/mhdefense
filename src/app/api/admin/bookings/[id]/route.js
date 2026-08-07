import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

/**
 * PATCH /api/admin/bookings/[id]
 * Body : { action: "mark_paid" | "no_show" | "completed" | "cancel" }
 * Actions admin sur une réservation.
 */
export async function PATCH(request, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { action } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payment: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }

    switch (action) {
      // Marquer le solde (acompte) comme réglé sur place
      case "mark_paid": {
        if (!booking.payment) {
          return NextResponse.json({ error: "Aucun paiement associé." }, { status: 400 });
        }
        await prisma.payment.update({
          where: { bookingId: id },
          data: {
            onSitePaid: true,
            status: "PAID",
            amountDueOnSite: 0,
          },
        });
        return NextResponse.json({ ok: true });
      }

      // Marquer comme absence (no-show)
      case "no_show": {
        await prisma.booking.update({
          where: { id },
          data: { status: "NO_SHOW" },
        });
        return NextResponse.json({ ok: true });
      }

      // Marquer comme réalisée
      case "completed": {
        await prisma.booking.update({
          where: { id },
          data: { status: "COMPLETED" },
        });
        return NextResponse.json({ ok: true });
      }

      // Annuler (libère le créneau)
      case "cancel": {
        await prisma.booking.update({
          where: { id },
          data: { status: "CANCELLED" },
        });
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
    }
  } catch (error) {
    console.error("[api/admin/bookings PATCH]", error);
    return NextResponse.json({ error: "Erreur lors de l'action." }, { status: 500 });
  }
}