import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * POST /api/me/subscription/update-card
 * Crée un SetupIntent pour enregistrer une nouvelle carte
 * sur le customer Stripe du membre connecté.
 * Renvoie { clientSecret }.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    // On récupère le customer Stripe (via le user ou son abonnement)
    const sub = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "PAST_DUE", "CANCELLED"] },
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    });

    const customerId = sub?.stripeCustomerId || user?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: "Aucun moyen de paiement à mettre à jour pour ce compte." },
        { status: 404 }
      );
    }

    const intent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session", // pour les prélèvements récurrents à venir
    });

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (error) {
    console.error("[subscription/update-card]", error);
    return NextResponse.json(
      { error: "Impossible de préparer la mise à jour de carte." },
      { status: 500 }
    );
  }
}