import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { emailConfirmationReservation } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

const FROM = "MH Defense <contact@mh-defense.com>";

// Types autorisés et nombre de participants max par type
const SESSION_TYPES = {
  INDIVIDUEL: { label: "Séance d'essai individuelle", maxParticipants: 1 },
  DUO: { label: "Séance d'essai duo", maxParticipants: 2 },
  GROUPE: { label: "Séance d'essai petit groupe", maxParticipants: 3 },
};

/**
 * POST /api/booking/essai
 * Body : { startsAt, name, email, phone, sessionType, participantsCount }
 * Crée une réservation d'essai gratuite (CONFIRMED, sans paiement).
 * Règle : un seul essai gratuit par email.
 */
export async function POST(request) {
  try {
    const { startsAt, name, email, phone, sessionType, participantsCount } = await request.json();

    if (!startsAt || !name || !email || !phone) {
      return NextResponse.json({ error: "Informations incomplètes." }, { status: 400 });
    }

    // Type de séance (défaut Individuel si absent/invalide)
    const typeKey = SESSION_TYPES[sessionType] ? sessionType : "INDIVIDUEL";
    const typeInfo = SESSION_TYPES[typeKey];

    // Nombre de participants borné au max du type
    let nbParticipants = Number(participantsCount) || 1;
    if (nbParticipants < 1) nbParticipants = 1;
    if (nbParticipants > typeInfo.maxParticipants) nbParticipants = typeInfo.maxParticipants;

    const start = new Date(startsAt);
    if (isNaN(start) || start <= new Date()) {
      return NextResponse.json({ error: "Créneau invalide ou déjà passé." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Règle : un seul essai gratuit par email.
    const dejaEssai = await prisma.booking.findFirst({
      where: {
        isFreeTrial: true,
        status: { in: ["HELD", "CONFIRMED", "COMPLETED"] },
        OR: [
          { guestEmail: normalizedEmail },
          { user: { email: normalizedEmail } },
        ],
      },
    });

    if (dejaEssai) {
      return NextResponse.json(
        { error: "Une séance d'essai gratuite a déjà été utilisée avec cet email." },
        { status: 409 }
      );
    }

    // Création directe en CONFIRMED (pas de paiement).
    const booking = await prisma.booking.create({
      data: {
        startsAt: start,
        type: "PONCTUEL",
        sessionType: typeKey,
        status: "CONFIRMED",
        participantsCount: nbParticipants,
        isFreeTrial: true,
        guestName: name.trim(),
        guestEmail: normalizedEmail,
        guestPhone: phone.trim(),
      },
      select: { id: true },
    });

    // Email de confirmation (best-effort)
    try {
      const dateHeure = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(start);

      await resend.emails.send({
        from: FROM,
        to: normalizedEmail,
        subject: "Votre séance d'essai est confirmée — MH Defense",
        html: emailConfirmationReservation({
          name: name.trim(),
          formule: typeInfo.label,
          dateHeure,
          duree: "1 heure",
          lieu: "Sarrians (84)",
          isEssai: true,
        }),
      });
    } catch (mailErr) {
      console.error("[booking/essai] email confirmation échoué :", mailErr);
    }

    return NextResponse.json({ booking });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ce créneau vient d'être réservé. Choisissez-en un autre." },
        { status: 409 }
      );
    }
    console.error("[booking/essai]", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer votre séance d'essai." },
      { status: 500 }
    );
  }
}