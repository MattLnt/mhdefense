import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const QUOTA = { ONCE: 1, TWICE: 2 };

/**
 * Incrémente le compteur d'utilisation d'un code promo (si présent).
 * Best-effort : n'interrompt jamais le traitement du webhook.
 */
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
 * Crée le vrai compte + l'abonnement à partir d'une PendingSignup,
 * puis supprime la PendingSignup. Idempotent : si le compte existe déjà
 * (webhook rejoué), ne fait rien.
 */
async function creerCompteDepuisPending(pendingSignupId, subId) {
  if (!pendingSignupId) return;

  const pending = await prisma.pendingSignup.findUnique({
    where: { id: pendingSignupId },
  });
  // Déjà traité (webhook rejoué) ou introuvable → rien à faire
  if (!pending) return;

  // Sécurité : si un user existe déjà avec cet email, on nettoie et on sort
  const existing = await prisma.user.findUnique({ where: { email: pending.email } });
  if (existing) {
    await prisma.pendingSignup.delete({ where: { id: pending.id } }).catch(() => {});
    return;
  }

  const now = new Date();
  const engagementEndsAt = new Date(now);
  engagementEndsAt.setMonth(engagementEndsAt.getMonth() + pending.engagementMonths);

  // Création atomique : User + Subscription, puis suppression de la PendingSignup
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

      // Paiement carte ponctuel validé
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const bookingId = intent.metadata?.bookingId;
        if (!bookingId) break; // (les PaymentIntents d'abonnement n'ont pas ce metadata)

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
        break;
      }

      // Paiement ponctuel échoué → libère le créneau
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

      // Facture payée (1re mensualité ET renouvellements mensuels)
      case "invoice.paid": {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (!subId) break;

        // 1re facture → on crée le compte + l'abonnement depuis la PendingSignup
        if (invoice.billing_reason === "subscription_create") {
          // On récupère l'abonnement pour lire ses métadonnées
          let pendingSignupId = null;
          let promoCode = null;
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            pendingSignupId = sub.metadata?.pendingSignupId || null;
            promoCode = sub.metadata?.promoCode || null;
          } catch (e) {
            console.error("[webhook] retrieve subscription échoué :", e.message);
          }

          await creerCompteDepuisPending(pendingSignupId, subId);
          await consommerPromo(promoCode);
        } else {
          // Renouvellement mensuel → on (ré)active l'abonnement existant
          await prisma.subscription.updateMany({
            where: { stripeSubId: subId },
            data: { status: "ACTIVE" },
          });
        }
        break;
      }

      // Échec de prélèvement mensuel
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (!subId) break;

        await prisma.subscription.updateMany({
          where: { stripeSubId: subId },
          data: { status: "PAST_DUE" },
        });
        break;
      }

      // Abonnement résilié (fin d'engagement atteinte, ou annulation)
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await prisma.subscription.updateMany({
          where: { stripeSubId: sub.id },
          data: { status: "ENDED" },
        });
        break;
      }

      // Mise à jour d'abonnement (ex. résiliation programmée en fin d'engagement)
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