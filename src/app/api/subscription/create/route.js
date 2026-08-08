import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Nombre de personnes selon le type
const PERSONNES = { INDIVIDUEL: 1, DUO: 2, GROUPE: 3 };
// Quota hebdomadaire selon la fréquence
const QUOTA = { ONCE: 1, TWICE: 2 };

const LABEL = {
  INDIVIDUEL: "Abonnement individuel",
  DUO: "Abonnement duo",
  GROUPE: "Abonnement petit groupe",
};

/**
 * Revalide un code promo (scope ABONNEMENT/ALL) et crée un coupon Stripe
 * one-time (réduction sur la 1re mensualité). Retourne { promo, couponId }.
 */
async function preparerPromo(codeRaw, montantMensuel) {
  if (!codeRaw?.trim()) return { promo: null, couponId: null };

  const code = codeRaw.trim().toUpperCase();
  const promo = await prisma.promoCode.findUnique({ where: { code } });

  if (!promo || !promo.active) return { promo: null, couponId: null };

  const now = new Date();
  if (promo.startsAt && now < promo.startsAt) return { promo: null, couponId: null };
  if (promo.endsAt && now > promo.endsAt) return { promo: null, couponId: null };
  if (promo.maxRedemptions != null && promo.timesRedeemed >= promo.maxRedemptions)
    return { promo: null, couponId: null };
  if (promo.scope !== "ALL" && promo.scope !== "ABONNEMENT") return { promo: null, couponId: null };

  // Création d'un coupon Stripe one-time (1er mois)
  let coupon;
  if (promo.discountType === "PERCENT") {
    coupon = await stripe.coupons.create({
      percent_off: promo.discountValue,
      duration: "once",
      name: `Code ${promo.code}`,
    });
  } else {
    // FIXED : discountValue en centimes, plafonné au montant mensuel
    const amountOff = Math.min(promo.discountValue, montantMensuel);
    coupon = await stripe.coupons.create({
      amount_off: amountOff,
      currency: "eur",
      duration: "once",
      name: `Code ${promo.code}`,
    });
  }

  return { promo, couponId: coupon.id };
}

/**
 * POST /api/subscription/create
 * Body : { name, email, phone, password, sessionType, planKey, frequency, promoCode? }
 * Crée le compte + l'abonnement Stripe, renvoie le clientSecret
 * pour régler la première mensualité.
 */
export async function POST(request) {
  try {
    const { name, email, phone, password, sessionType, planKey, frequency, promoCode } =
      await request.json();

    // Validation
    if (!name || !email || !phone || !password || !sessionType || !planKey || !frequency) {
      return NextResponse.json({ error: "Informations incomplètes." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit faire au moins 8 caractères." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Email déjà utilisé ?
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email. Connectez-vous." },
        { status: 409 }
      );
    }

    // Le plan (tarif) correspondant, lu depuis la base (source de vérité)
    const plan = await prisma.plan.findUnique({
      where: {
        key_sessionType_frequency: {
          key: planKey,
          sessionType,
          frequency,
        },
      },
    });
    if (!plan || !plan.active) {
      return NextResponse.json({ error: "Formule indisponible." }, { status: 400 });
    }

    const nbPersonnes = PERSONNES[sessionType];
    const montantMensuel = plan.price * nbPersonnes; // en centimes

    // Code promo (coupon Stripe one-time) — revalidé côté serveur
    const { promo, couponId } = await preparerPromo(promoCode, montantMensuel);

    // 1. Création du compte client
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        phone: phone.trim(),
        passwordHash,
        role: "CLIENT",
      },
    });

    // 2. Client Stripe
    const customer = await stripe.customers.create({
      email: normalizedEmail,
      name: name.trim(),
      metadata: { userId: user.id },
    });

    // 3. Abonnement Stripe récurrent (prix à la volée)
    const subscriptionParams = {
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: LABEL[sessionType] },
            unit_amount: montantMensuel,
            recurring: { interval: "month" },
          },
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId: user.id },
    };

    // Coupon promo (réduction 1er mois) + métadonnée pour l'incrément au webhook
    if (couponId) {
      subscriptionParams.discounts = [{ coupon: couponId }];
      subscriptionParams.metadata.promoCode = promo.code;
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    const clientSecret =
      subscription.latest_invoice?.payment_intent?.client_secret;

    // 4. Enregistrement de l'abonnement en base
    const now = new Date();
    const engagementEndsAt = new Date(now);
    engagementEndsAt.setMonth(engagementEndsAt.getMonth() + plan.engagementMonths);

    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        sessionType,
        frequency,
        weeklyQuota: QUOTA[frequency],
        participantsCount: nbPersonnes,
        status: "ACTIVE",
        engagementEndsAt,
        stripeSubId: subscription.id,
        stripeCustomerId: customer.id,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });

    return NextResponse.json({
      clientSecret,
      amount: montantMensuel,
      promoApplied: promo ? promo.code : null,
    });
  } catch (error) {
    console.error("[subscription/create]", error);
    return NextResponse.json(
      { error: "Impossible de créer l'abonnement." },
      { status: 500 }
    );
  }
}