import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Stripe a besoin du corps brut (non parsé) pour vérifier la signature.
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
      // Paiement ponctuel validé
      case "checkout.session.completed": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (!bookingId) break;

        const payment = await prisma.payment.findUnique({
          where: { bookingId },
        });
        if (!payment) break;

        // Comptant → payé intégralement ; acompte → partiel (solde sur place)
        const newStatus = payment.mode === "ACOMPTE" ? "PARTIAL" : "PAID";

        // On confirme la réservation + on marque le paiement, en une transaction
        await prisma.$transaction([
          prisma.booking.update({
            where: { id: bookingId },
            data: { status: "CONFIRMED", expiresAt: null },
          }),
          prisma.payment.update({
            where: { bookingId },
            data: {
              status: newStatus,
              stripePaymentIntentId: session.payment_intent ?? null,
            },
          }),
        ]);
        break;
      }

      // Session expirée sans paiement → on libère le créneau
      case "checkout.session.expired": {
        const session = event.data.object;
        const bookingId = session.metadata?.bookingId;
        if (!bookingId) break;

        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
        });
        // On n'annule que si toujours en attente (pas déjà confirmée)
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

      default:
        // Les autres événements (abonnements, etc.) seront gérés plus tard
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] erreur de traitement :", error);
    return NextResponse.json({ error: "Erreur webhook." }, { status: 500 });
  }
}