import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * POST /api/me/subscription/set-default-card
 * Body : { paymentMethodId }
 * Définit la carte fraîchement enregistrée comme moyen de paiement par défaut
 * du customer et de l'abonnement Stripe du membre connecté.
 */
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { paymentMethodId } = await request.json();
    if (!paymentMethodId) {
      return NextResponse.json({ error: "Carte manquante." }, { status: 400 });
    }

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
        { error: "Aucun compte de paiement trouvé." },
        { status: 404 }
      );
    }

    // 1. Définir la carte par défaut du customer (pour les futures factures)
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // 2. Définir la carte par défaut de l'abonnement lui-même (s'il existe)
    if (sub?.stripeSubId) {
      try {
        await stripe.subscriptions.update(sub.stripeSubId, {
          default_payment_method: paymentMethodId,
        });
      } catch (e) {
        console.error("[set-default-card] update subscription:", e.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[subscription/set-default-card]", error);
    return NextResponse.json(
      { error: "Impossible d'enregistrer la nouvelle carte." },
      { status: 500 }
    );
  }
}