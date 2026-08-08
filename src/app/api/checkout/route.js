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
 * Revalide un code promo côté serveur et renvoie la réduction (centimes).
 * Retourne { promo, discount } ou lève une erreur explicite.
 */
async function appliquerPromo(codeRaw, total) {
  if (!codeRaw?.trim()) return { promo: null, discount: 0 };

  const code = codeRaw.trim().toUpperCase();
  const promo = await prisma.promoCode.findUnique({ where: { code } });

  if (!promo || !promo.active) return { promo: null, discount: 0 };

  const now = new Date();
  if (promo.startsAt && now < promo.startsAt) return { promo: null, discount: 0 };
  if (promo.endsAt && now > promo.endsAt) return { promo: null, discount: 0 };
  if (promo.maxRedemptions != null && promo.timesRedeemed >= promo.maxRedemptions)
    return { promo: null, discount: 0 };
  if (promo.scope !== "ALL" && promo.scope !== "PONCTUEL") return { promo: null, discount: 0 };

  let discount =
    promo.discountType === "PERCENT"
      ? Math.round((total * promo.discountValue) / 100)
      : promo.discountValue;
  discount = Math.min(discount, total);

  return { promo, discount };
}

/**
 * POST /api/checkout
 * Body : { bookingId, mode, promoCode? }  (mode = "COMPTANT" | "ACOMPTE")
 * Crée un PaymentIntent (cartes uniquement) et renvoie le clientSecret.
 */
export async function POST(request) {
  try {
    const { bookingId, mode, promoCode } = await request.json();

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

    const totalBrut = unitPrice * booking.participantsCount;

    // Code promo revalidé côté serveur
    const { promo, discount } = await appliquerPromo(promoCode, totalBrut);
    const total = Math.max(0, totalBrut - discount);

    const amountOnline = mode === "ACOMPTE" ? Math.round(total / 2) : total;
    const amountOnSite = total - amountOnline;

    // Métadonnées : bookingId + code promo (pour incrément au webhook)
    const metadata = { bookingId: booking.id };
    if (promo) metadata.promoCode = promo.code;

    // PaymentIntent : cartes uniquement
    const intent = await stripe.paymentIntents.create({
      amount: amountOnline,
      currency: "eur",
      payment_method_types: ["card"],
      description: `${LABEL[booking.sessionType]} — ${mode === "ACOMPTE" ? "acompte 50 %" : "comptant"}${promo ? ` (code ${promo.code})` : ""}`,
      metadata,
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
      total,
      discount,
      promoApplied: promo ? promo.code : null,
    });
  } catch (error) {
    console.error("[checkout]", error);
    return NextResponse.json(
      { error: "Impossible de préparer le paiement." },
      { status: 500 }
    );
  }
}