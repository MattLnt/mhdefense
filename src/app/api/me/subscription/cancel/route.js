import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * POST /api/me/subscription/cancel
 * Programme la résiliation de l'abonnement à l'échéance de l'engagement.
 * Ne coupe rien immédiatement : le membre garde l'accès jusqu'à la fin.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const sub = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "PAST_DUE"] },
      },
    });

    if (!sub) {
      return NextResponse.json(
        { error: "Aucun abonnement actif à résilier." },
        { status: 404 }
      );
    }

    if (sub.cancelAt) {
      return NextResponse.json(
        { error: "La résiliation est déjà programmée." },
        { status: 409 }
      );
    }

    // La résiliation prend effet à la fin de l'engagement
    const cancelDate = sub.engagementEndsAt;

    // Si l'abonnement existe côté Stripe, on programme l'annulation là-bas.
    // (Les comptes de test créés en base directe n'ont pas de stripeSubId.)
    if (sub.stripeSubId) {
      try {
        await stripe.subscriptions.update(sub.stripeSubId, {
          cancel_at: Math.floor(cancelDate.getTime() / 1000),
        });
      } catch (stripeErr) {
        console.error("[subscription/cancel] Stripe:", stripeErr.message);
        // On continue quand même pour refléter l'intention en base
      }
    }

    // Reflet en base : statut CANCELLED (= résiliation programmée) + date
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "CANCELLED",
        cancelAt: cancelDate,
      },
    });

    return NextResponse.json({ ok: true, cancelAt: cancelDate });
  } catch (error) {
    console.error("[subscription/cancel]", error);
    return NextResponse.json(
      { error: "Impossible de résilier l'abonnement." },
      { status: 500 }
    );
  }
}