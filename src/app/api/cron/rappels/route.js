import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { emailRappelSeance } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

const FROM = "MH Defense <contact@mh-defense.com>";

const TYPE_LABELS = {
  INDIVIDUEL: "Séance individuelle",
  DUO: "Séance duo",
  GROUPE: "Séance petit groupe",
};

/**
 * GET /api/cron/rappels
 * Déclenché chaque jour par Vercel Cron (la veille à 18h locale).
 * Envoie un email de rappel à tous les clients ayant une séance confirmée demain.
 * Protégé par le header Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request) {
  // Sécurité : seul Vercel Cron (avec le secret) peut déclencher
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    // Fenêtre = journée de demain (00:00 → 23:59:59), en heure locale du serveur
    const now = new Date();
    const debutDemain = new Date(now);
    debutDemain.setDate(debutDemain.getDate() + 1);
    debutDemain.setHours(0, 0, 0, 0);

    const finDemain = new Date(debutDemain);
    finDemain.setHours(23, 59, 59, 999);

    const seances = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        startsAt: { gte: debutDemain, lte: finDemain },
      },
      include: { user: true },
    });

    let envoyes = 0;
    let ignores = 0;

    for (const b of seances) {
      const email = b.user?.email || b.guestEmail;
      const name = b.user?.name || b.guestName || "";

      if (!email) {
        ignores++;
        continue;
      }

      const dateHeure = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(b.startsAt);

      const formule = b.isFreeTrial
        ? "Séance d'essai"
        : TYPE_LABELS[b.sessionType] || "Séance";

      try {
        await resend.emails.send({
          from: FROM,
          to: email,
          subject: "Rappel : votre séance est demain — MH Defense",
          html: emailRappelSeance({ name, formule, dateHeure }),
        });
        envoyes++;
      } catch (mailErr) {
        console.error("[cron/rappels] échec envoi à", email, mailErr);
        ignores++;
      }
    }

    console.log(`[cron/rappels] ${envoyes} rappel(s) envoyé(s), ${ignores} ignoré(s).`);
    return NextResponse.json({ ok: true, envoyes, ignores, total: seances.length });
  } catch (error) {
    console.error("[cron/rappels]", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi des rappels." }, { status: 500 });
  }
}