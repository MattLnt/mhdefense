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
 * POST /api/subscription/create
 * Body : { name, email, phone, password, sessionType, planKey, frequency }
 * Crée le compte + l'abonnement Stripe, renvoie le clientSecret
 * pour régler la première mensualité.
 */
export async function POST(request) {
  try {
    const { name, email, phone, password, sessionType, planKey, frequency } =
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
    const subscription = await stripe.subscriptions.create({
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
      payment_behavior: "default_incomplete", // on encaisse via le formulaire carte
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId: user.id },
    });

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

    // On garde l'id Stripe customer sur le user aussi
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });

    return NextResponse.json({
      clientSecret,
      amount: montantMensuel,
    });
  } catch (error) {
    console.error("[subscription/create]", error);
    return NextResponse.json(
      { error: "Impossible de créer l'abonnement." },
      { status: 500 }
    );
  }
}