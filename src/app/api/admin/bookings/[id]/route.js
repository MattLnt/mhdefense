import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { emailConfirmationReservation } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

const FROM = "MH Defense <contact@mh-defense.com>";

const LABEL_SESSION = {
  INDIVIDUEL: "Séance individuelle",
  DUO: "Séance duo",
  GROUPE: "Séance petit groupe",
};

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

/**
 * Prévient le client que MH Defense a annulé sa séance.
 * Best-effort : ne lève jamais.
 */
async function notifierClientAnnulation(booking) {
  try {
    const email = booking.guestEmail || booking.user?.email;
    if (!email) return;

    const nom = booking.guestName || booking.user?.name || "";
    const dateHeure = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(booking.startsAt));

    const formule = booking.isFreeTrial
      ? "Séance d'essai"
      : LABEL_SESSION[booking.sessionType] || "Séance";

    // Email HTML simple : on réutilise l'enveloppe néon via un petit corps.
    const html = `
      <div style="margin:0;padding:30px 16px;background:#0a0407;font-family:'Inter',Arial,sans-serif;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="margin:0 auto;max-width:600px;background:#12070D;border-radius:18px;overflow:hidden;border:1.5px solid #D64C7F;box-shadow:0 0 40px rgba(214,76,127,0.25);">
          <tr><td style="padding:40px 40px 30px;text-align:center;">
            <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:0.03em;">MH<span style="color:#F0699A;">·</span>DEFENSE</div>
            <div style="width:40px;height:3px;background:linear-gradient(90deg,#D64C7F,#F0699A);margin:14px auto 0;border-radius:2px;"></div>
          </td></tr>
          <tr><td style="padding:10px 44px 0;text-align:center;">
            <h1 style="margin:0 0 12px;font-size:24px;color:#ffffff;font-weight:800;">Séance <span style="color:#F0699A;">annulée</span></h1>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.6);">
              Bonjour ${nom}, votre séance du <strong style="color:#ffffff;">${dateHeure}</strong> (${formule}) a dû être annulée.
              Nous en sommes sincèrement désolés.
            </p>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.6);">
              Pour convenir d'une nouvelle date ou d'un remboursement, contactez-nous directement :
            </p>
            <p style="margin:0 0 26px;font-size:15px;color:#F0699A;font-weight:700;">06 51 00 14 01 · contact@mh-defense.com</p>
          </td></tr>
          <tr><td style="padding:30px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:13px;color:rgba(255,255,255,0.5);">Marie Hervas Diaz · <span style="color:#F0699A;">MH Defense</span></div>
            <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:6px;">Sarrians (84) · 06 51 00 14 01 · @mh_defense</div>
          </td></tr>
        </table>
      </div>`;

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Votre séance a été annulée — MH Defense",
      html,
    });
  } catch (e) {
    console.error("[admin/bookings] notif client annulation échouée :", e.message);
  }
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
      include: { payment: true, user: true },
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

      // Annuler (libère le créneau) + prévient le client
      case "cancel": {
        await prisma.booking.update({
          where: { id },
          data: { status: "CANCELLED" },
        });
        await notifierClientAnnulation(booking);
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