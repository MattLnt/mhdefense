import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { emailNotificationAdmin } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

// Délai minimum avant la séance pour pouvoir annuler soi-même (en heures)
const MIN_HOURS_BEFORE = 24;

const FROM = "MH Defense <contact@mh-defense.com>";
const ADMIN_EMAIL = "contact@mh-defense.com";

const LABEL_SESSION = {
  INDIVIDUEL: "Séance individuelle",
  DUO: "Séance duo",
  GROUPE: "Séance petit groupe",
};

/**
 * POST /api/me/bookings/[id]/cancel
 * Annule une séance du membre connecté (si elle lui appartient et
 * qu'elle est à plus de 24h). Libère le créneau. Notifie Marie.
 */
export async function POST(_request, { params }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: true },
    });

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

    // Annulation tardive au sens des CGV ? (moins de 48 h avant la séance)
    const tardive = hoursUntil < 48;

    // Annulation → libère le créneau (l'index unique ne bloque plus)
    await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Notification à Marie (best-effort)
    try {
      const dateHeure = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(booking.startsAt);

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
          ? "Annulation tardive d'une séance — MH Defense"
          : "Annulation d'une séance — MH Defense",
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
      console.error("[bookings/cancel] notif admin échouée :", mailErr.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[bookings/cancel]", error);
    return NextResponse.json(
      { error: "Impossible d'annuler cette séance." },
      { status: 500 }
    );
  }
}