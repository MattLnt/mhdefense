import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

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
      // Paiement carte validé
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const bookingId = intent.metadata?.bookingId;
        if (!bookingId) break;

        const payment = await prisma.payment.findUnique({
          where: { bookingId },
        });
        if (!payment) break;

        // Comptant → payé ; acompte → partiel (solde sur place)
        const newStatus = payment.mode === "ACOMPTE" ? "PARTIAL" : "PAID";

        await prisma.$transaction([
          prisma.booking.update({
            where: { id: bookingId },
            data: { status: "CONFIRMED", expiresAt: null },
          }),
          prisma.payment.update({
            where: { bookingId },
            data: {
              status: newStatus,
              stripePaymentIntentId: intent.id,
            },
          }),
        ]);
        break;
      }

      // Paiement échoué → on libère le créneau
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const bookingId = intent.metadata?.bookingId;
        if (!bookingId) break;

        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
        });
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
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] erreur de traitement :", error);
    return NextResponse.json({ error: "Erreur webhook." }, { status: 500 });
  }
}