import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { resend } from "@/lib/resend";
import {
  emailConfirmationReservation,
  emailBienvenueAbonnement,
  emailNotificationAdmin,
} from "@/lib/email-templates";

export const dynamic = "force-dynamic";

const QUOTA = { ONCE: 1, TWICE: 2 };
const FROM = "MH Defense <contact@mh-defense.com>";
const ADMIN_EMAIL = "contact@mh-defense.com";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.mh-defense.com";

const LABEL_SESSION = {
  INDIVIDUEL: "Séance individuelle",
  DUO: "Séance duo",
  GROUPE: "Séance petit groupe",
};

const LABEL_ABO = {
  INDIVIDUEL: "Abonnement individuel",
  DUO: "Abonnement duo",
  GROUPE: "Abonnement petit groupe",
};

async function consommerPromo(code) {
  if (!code) return;
  try {
    await prisma.promoCode.updateMany({
      where: { code: code.toUpperCase() },
      data: { timesRedeemed: { increment: 1 } },
    });
  } catch (e) {
    console.error("[webhook] incrément promo échoué :", e.message);
  }
}

/**
 * Notifie Marie (admin) d'un événement de réservation.
 * Best-effort : ne lève jamais.
 */
async function notifierAdmin(data) {
  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: data.subject,
      html: emailNotificationAdmin(data.payload),
    });
  } catch (e) {
    console.error("[webhook] notification admin échouée :", e.message);
  }
}

/**
 * Envoie l'email de confirmation d'une réservation ponctuelle payée.
 * Best-effort : ne lève jamais.
 */
async function envoyerConfirmationPonctuel(bookingId) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, payment: true },
    });
    if (!booking) return;

    const email = booking.guestEmail || booking.user?.email;
    const nom = booking.guestName || booking.user?.name || "";
    const phone = booking.guestPhone || booking.user?.phone || "";

    const dateHeure = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(booking.startsAt));

    const formule = LABEL_SESSION[booking.sessionType] || "Séance";

    // Email au client (si on a une adresse)
    if (email) {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Votre réservation est confirmée — MH Defense",
        html: emailConfirmationReservation({
          name: nom,
          formule,
          dateHeure,
          duree: "1 heure",
          lieu: "Sarrians (84)",
          isEssai: false,
        }),
      });
    }

    // Notification à Marie
    const montant = booking.payment?.totalAmount
      ? `${(booking.payment.totalAmount / 100).toFixed(2)} €`
      : null;

    await notifierAdmin({
      subject: "Nouvelle réservation — MH Defense",
      payload: {
        kind: "PONCTUEL",
        clientName: nom,
        clientEmail: email,
        clientPhone: phone,
        formule,
        dateHeure,
        montant,
      },
    });
  } catch (e) {
    console.error("[webhook] email confirmation ponctuel échoué :", e.message);
  }
}

/**
 * Envoie l'email de bienvenue après création d'un abonnement.
 * Best-effort : ne lève jamais.
 */
async function envoyerBienvenueAbonnement({ email, name, phone, sessionType, engagementMonths }) {
  try {
    const engagement =
      engagementMonths === 1
        ? "1 mois"
        : `${engagementMonths} mois`;

    const formule = LABEL_ABO[sessionType] || "Abonnement";

    // Email au client
    if (email) {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Bienvenue chez MH Defense 🥋",
        html: emailBienvenueAbonnement({
          name: name || "",
          formule,
          engagement,
          espaceUrl: `${BASE_URL}/compte`,
        }),
      });
    }

    // Notification à Marie
    await notifierAdmin({
      subject: "Nouvel abonnement — MH Defense",
      payload: {
        kind: "ABONNEMENT",
        clientName: name,
        clientEmail: email,
        clientPhone: phone,
        formule,
        engagement,
      },
    });
  } catch (e) {
    console.error("[webhook] email bienvenue échoué :", e.message);
  }
}

/**
 * Crée le vrai compte + l'abonnement à partir d'une PendingSignup,
 * puis supprime la PendingSignup. Idempotent.
 * Envoie l'email de bienvenue après création.
 */
async function creerCompteDepuisPending(pendingSignupId) {
  if (!pendingSignupId) return;

  const pending = await prisma.pendingSignup.findUnique({
    where: { id: pendingSignupId },
  });
  if (!pending) return;

  const existing = await prisma.user.findUnique({ where: { email: pending.email } });
  if (existing) {
    await prisma.pendingSignup.delete({ where: { id: pending.id } }).catch(() => {});
    return;
  }

  const now = new Date();
  const engagementEndsAt = new Date(now);
  engagementEndsAt.setMonth(engagementEndsAt.getMonth() + pending.engagementMonths);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: pending.email,
        name: pending.name,
        phone: pending.phone,
        passwordHash: pending.passwordHash,
        role: "CLIENT",
        stripeCustomerId: pending.stripeCustomerId,
      },
    });

    await tx.subscription.create({
      data: {
        userId: user.id,
        planId: pending.planId,
        sessionType: pending.sessionType,
        frequency: pending.frequency,
        weeklyQuota: QUOTA[pending.frequency],
        participantsCount: pending.participantsCount,
        status: "ACTIVE",
        engagementEndsAt,
        stripeSubId: pending.stripeSubId,
        stripeCustomerId: pending.stripeCustomerId,
      },
    });

    await tx.pendingSignup.delete({ where: { id: pending.id } });
  });

  // Email de bienvenue + notif admin (après la transaction, best-effort)
  await envoyerBienvenueAbonnement({
    email: pending.email,
    name: pending.name,
    phone: pending.phone,
    sessionType: pending.sessionType,
    engagementMonths: pending.engagementMonths,
  });
}

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[webhook] signature invalide :", err.message);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  try {
    switch (event.type) {
      /* ---------- PONCTUEL ---------- */

      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const bookingId = intent.metadata?.bookingId;
        if (!bookingId) break;

        const payment = await prisma.payment.findUnique({ where: { bookingId } });
        if (!payment) break;

        const newStatus = payment.mode === "ACOMPTE" ? "PARTIAL" : "PAID";

        await prisma.$transaction([
          prisma.booking.update({
            where: { id: bookingId },
            data: { status: "CONFIRMED", expiresAt: null },
          }),
          prisma.payment.update({
            where: { bookingId },
            data: { status: newStatus, stripePaymentIntentId: intent.id },
          }),
        ]);

        await consommerPromo(intent.metadata?.promoCode);
        await envoyerConfirmationPonctuel(bookingId);
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const bookingId = intent.metadata?.bookingId;
        if (!bookingId) break;

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (booking && booking.status === "HELD") {
          await prisma.$transaction([
            prisma.booking.update({
              where: { id: bookingId },
              data: { status: "CANCELLED", expiresAt: null },
            }),
            prisma.payment.updateMany({
              where: { bookingId },
              data: { status: "FAILED" },
            }),
          ]);
        }
        break;
      }

      /* ---------- ABONNEMENT ---------- */

      case "invoice.paid": {
        const invoice = event.data.object;

        const subId =
          invoice.subscription ||
          invoice.parent?.subscription_details?.subscription ||
          invoice.lines?.data?.[0]?.parent?.subscription_item_details?.subscription ||
          null;

        if (!subId) break;

        let pendingSignupId = null;
        let promoCode = null;
        try {
          const sub = await stripe.subscriptions.retrieve(subId);
          pendingSignupId = sub.metadata?.pendingSignupId || null;
          promoCode = sub.metadata?.promoCode || null;
        } catch (e) {
          console.error("[webhook] retrieve subscription échoué :", e.message);
        }

        const pendingExists = pendingSignupId
          ? await prisma.pendingSignup.findUnique({ where: { id: pendingSignupId } })
          : null;

        if (pendingExists) {
          await creerCompteDepuisPending(pendingSignupId);
          await consommerPromo(promoCode);
        } else {
          await prisma.subscription.updateMany({
            where: { stripeSubId: subId },
            data: { status: "ACTIVE" },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subId =
          invoice.subscription ||
          invoice.parent?.subscription_details?.subscription ||
          null;
        if (!subId) break;

        await prisma.subscription.updateMany({
          where: { stripeSubId: subId },
          data: { status: "PAST_DUE" },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await prisma.subscription.updateMany({
          where: { stripeSubId: sub.id },
          data: { status: "ENDED" },
        });

        // Notification à Marie : abonnement résilié
        try {
          const dbSub = await prisma.subscription.findFirst({
            where: { stripeSubId: sub.id },
            include: { user: true },
          });
          await notifierAdmin({
            subject: "Abonnement résilié — MH Defense",
            payload: {
              kind: "ANNULATION",
              clientName: dbSub?.user?.name,
              clientEmail: dbSub?.user?.email,
              clientPhone: dbSub?.user?.phone,
              formule: dbSub ? LABEL_ABO[dbSub.sessionType] || "Abonnement" : "Abonnement",
            },
          });
        } catch (e) {
          console.error("[webhook] notif résiliation échouée :", e.message);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000) : null;
        await prisma.subscription.updateMany({
          where: { stripeSubId: sub.id },
          data: {
            cancelAt,
            status: sub.status === "past_due" ? "PAST_DUE" : "ACTIVE",
          },
        });
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] erreur de traitement :", error);
    return NextResponse.json({ error: "Erreur webhook." }, { status: 500 });
  }
}