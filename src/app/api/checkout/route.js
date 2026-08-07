import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const PRICE_KEY = {
  INDIVIDUEL: "price_ponctuel_individuel",
  DUO: "price_ponctuel_duo",
  GROUPE: "price_ponctuel_groupe",
};

const LABEL = {
  INDIVIDUEL: "Séance individuelle",
  DUO: "Séance duo",
  GROUPE: "Séance petit groupe",
};

/**
 * POST /api/checkout
 * Body : { bookingId, mode }  (mode = "COMPTANT" | "ACOMPTE")
 * Crée un PaymentIntent (cartes uniquement) et renvoie le clientSecret.
 */
export async function POST(request) {
  try {
    const { bookingId, mode } = await request.json();

    if (!bookingId || !mode) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }
    if (booking.status !== "HELD") {
      return NextResponse.json(
        { error: "Cette réservation n'est plus disponible." },
        { status: 409 }
      );
    }

    // Prix lu depuis les réglages admin (jamais depuis le client)
    const setting = await prisma.setting.findUnique({
      where: { key: PRICE_KEY[booking.sessionType] },
    });
    const unitPrice = setting ? parseInt(setting.value, 10) : null;
    if (!unitPrice) {
      return NextResponse.json({ error: "Tarif indisponible." }, { status: 500 });
    }

    const total = unitPrice * booking.participantsCount;
    const amountOnline = mode === "ACOMPTE" ? Math.round(total / 2) : total;
    const amountOnSite = total - amountOnline;

    // PaymentIntent : cartes uniquement
    const intent = await stripe.paymentIntents.create({
      amount: amountOnline,
      currency: "eur",
      payment_method_types: ["card"],
      description: `${LABEL[booking.sessionType]} — ${mode === "ACOMPTE" ? "acompte 50 %" : "comptant"}`,
      metadata: { bookingId: booking.id },
    });

    // Payment en base (PENDING) rattaché au PaymentIntent
    await prisma.payment.upsert({
      where: { bookingId: booking.id },
      update: {
        mode,
        totalAmount: total,
        amountPaidOnline: amountOnline,
        amountDueOnSite: amountOnSite,
        status: "PENDING",
        stripePaymentIntentId: intent.id,
      },
      create: {
        bookingId: booking.id,
        mode,
        totalAmount: total,
        amountPaidOnline: amountOnline,
        amountDueOnSite: amountOnSite,
        status: "PENDING",
        stripePaymentIntentId: intent.id,
      },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      amount: amountOnline,
    });
  } catch (error) {
    console.error("[checkout]", error);
    return NextResponse.json(
      { error: "Impossible de préparer le paiement." },
      { status: 500 }
    );
  }
}