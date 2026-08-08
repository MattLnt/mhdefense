import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const PERSONNES = { INDIVIDUEL: 1, DUO: 2, GROUPE: 3 };
const QUOTA = { ONCE: 1, TWICE: 2 };

const LABEL = {
  INDIVIDUEL: "Abonnement individuel",
  DUO: "Abonnement duo",
  GROUPE: "Abonnement petit groupe",
};

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

  let coupon;
  if (promo.discountType === "PERCENT") {
    coupon = await stripe.coupons.create({
      percent_off: promo.discountValue,
      duration: "once",
      name: `Code ${promo.code}`,
    });
  } else {
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
 * Body : { name, email, phone, password, sessionType, planKey, frequency, promoCode?, preferredSlot? }
 * Enregistre une PendingSignup + l'abonnement Stripe.
 * Le vrai User + Subscription sont créés au 1er paiement confirmé (webhook invoice.paid).
 */
export async function POST(request) {
  try {
    const { name, email, phone, password, sessionType, planKey, frequency, promoCode, preferredSlot } =
      await request.json();

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

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email. Connectez-vous." },
        { status: 409 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: {
        key_sessionType_frequency: { key: planKey, sessionType, frequency },
      },
    });
    if (!plan || !plan.active) {
      return NextResponse.json({ error: "Formule indisponible." }, { status: 400 });
    }

    const nbPersonnes = PERSONNES[sessionType];
    const montantMensuel = plan.price * nbPersonnes;

    const { promo, couponId } = await preparerPromo(promoCode, montantMensuel);

    // 1. Client Stripe (créé avant paiement, mais PAS le compte en base)
    const customer = await stripe.customers.create({
      email: normalizedEmail,
      name: name.trim(),
    });

    // 2. Produit Stripe (l'API récente n'accepte plus product_data inline)
    const product = await stripe.products.create({
      name: LABEL[sessionType],
    });

    // 3. Abonnement Stripe récurrent (prix à la volée référençant le produit)
    const subscriptionParams = {
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: "eur",
            product: product.id,
            unit_amount: montantMensuel,
            recurring: { interval: "month" },
          },
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent", "latest_invoice.confirmation_secret"],
      metadata: {},
    };

    if (couponId) {
      subscriptionParams.discounts = [{ coupon: couponId }];
      subscriptionParams.metadata.promoCode = promo.code;
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    // 4. Récupération du secret de paiement de la 1re facture.
    let clientSecret = null;

    const invoiceId =
      typeof subscription.latest_invoice === "string"
        ? subscription.latest_invoice
        : subscription.latest_invoice?.id;

    if (invoiceId) {
      let invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ["payment_intent", "confirmation_secret"],
      });

      // Si la facture n'est pas finalisée, on la finalise (déclenche le PI)
      if (invoice.status === "draft") {
        invoice = await stripe.invoices.finalizeInvoice(invoiceId, {
          expand: ["payment_intent", "confirmation_secret"],
        });
      }

      // Piste 1 : PaymentIntent classique
      let pi = invoice.payment_intent;
      if (typeof pi === "string") {
        pi = await stripe.paymentIntents.retrieve(pi);
      }
      clientSecret = pi?.client_secret || null;

      // Piste 2 : nouveau champ confirmation_secret (API récente "dahlia")
      if (!clientSecret && invoice.confirmation_secret?.client_secret) {
        clientSecret = invoice.confirmation_secret.client_secret;
      }

      // Debug : structure de l'invoice pour localiser le secret
      console.log("[subscription/create] invoice.status:", invoice.status);
      console.log("[subscription/create] payment_intent:", JSON.stringify(invoice.payment_intent)?.slice(0, 120));
      console.log("[subscription/create] confirmation_secret:", JSON.stringify(invoice.confirmation_secret)?.slice(0, 120));
      console.log("[subscription/create] clientSecret présent ?", !!clientSecret);
    }

    // 5. Demande d'inscription en attente (compte créé au paiement)
    const passwordHash = await bcrypt.hash(password, 10);
    const pending = await prisma.pendingSignup.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        phone: phone.trim(),
        passwordHash,
        planId: plan.id,
        sessionType,
        frequency,
        participantsCount: nbPersonnes,
        engagementMonths: plan.engagementMonths,
        stripeCustomerId: customer.id,
        stripeSubId: subscription.id,
        preferredSlot: preferredSlot || null,
      },
    });

    // 6. On rattache l'id de la PendingSignup à l'abonnement Stripe
    await stripe.subscriptions.update(subscription.id, {
      metadata: {
        ...(subscription.metadata || {}),
        pendingSignupId: pending.id,
      },
    });

    if (!clientSecret) {
      return NextResponse.json(
        { error: "Le paiement n'a pas pu être initialisé. Réessayez." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret,
      amount: montantMensuel,
      promoApplied: promo ? promo.code : null,
    });
  } catch (error) {
    console.error("[subscription/create]", error);
    return NextResponse.json(
      { error: "Impossible de préparer l'abonnement." },
      { status: 500 }
    );
  }
}