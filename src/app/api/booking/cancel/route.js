import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { emailNotificationAdmin } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

const FROM = "MH Defense <contact@mh-defense.com>";
const ADMIN_EMAIL = "contact@mh-defense.com";

const LABEL_SESSION = {
  INDIVIDUEL: "Séance individuelle",
  DUO: "Séance duo",
  GROUPE: "Séance petit groupe",
};

/**
 * POST /api/booking/cancel
 * Body : { bookingId }
 * Annule une réservation à venir du membre connecté.
 * Passe le booking en CANCELLED (libère le créneau) et notifie Marie.
 * Conformément aux CGV, aucun remboursement automatique n'est effectué.
 */
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "Réservation manquante." }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }

    // Le membre ne peut annuler que SA réservation
    if (booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
    }

    // Doit être à venir et pas déjà annulée / terminée
    if (!["HELD", "CONFIRMED"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Cette réservation ne peut plus être annulée." },
        { status: 409 }
      );
    }
    if (new Date(booking.startsAt) <= new Date()) {
      return NextResponse.json(
        { error: "Cette séance est déjà passée." },
        { status: 409 }
      );
    }

    // Annulation tardive ? (moins de 48 h avant la séance)
    const heuresAvant = (new Date(booking.startsAt) - new Date()) / (1000 * 60 * 60);
    const tardive = heuresAvant < 48;

    // Annulation : libère le créneau
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", expiresAt: null },
    });

    // Notification à Marie (best-effort)
    try {
      const dateHeure = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(booking.startsAt));

      const nom = booking.guestName || booking.user?.name || "";
      const email = booking.guestEmail || booking.user?.email || "";
      const phone = booking.guestPhone || booking.user?.phone || "";

      const formuleBase = booking.isFreeTrial
        ? "Séance d'essai"
        : LABEL_SESSION[booking.sessionType] || "Séance";
      const formule = tardive ? `${formuleBase} · annulation tardive (< 48 h)` : formuleBase;

      await resend.emails.send({
        from: FROM,
        to: ADMIN_EMAIL,
        subject: tardive
          ? "Annulation tardive d'une réservation — MH Defense"
          : "Annulation d'une réservation — MH Defense",
        html: emailNotificationAdmin({
          kind: "ANNULATION",
          clientName: nom,
          clientEmail: email,
          clientPhone: phone,
          formule,
          dateHeure,
        }),
      });
    } catch (mailErr) {
      console.error("[booking/cancel] notif admin échouée :", mailErr.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[booking/cancel]", error);
    return NextResponse.json(
      { error: "Impossible d'annuler la réservation." },
      { status: 500 }
    );
  }
}