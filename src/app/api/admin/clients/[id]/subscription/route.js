import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/clients/[id]/subscription
 * Body : { mode: "END_OF_TERM" | "IMMEDIATE" }
 * Résilie l'abonnement d'un client (côté admin) :
 *  - END_OF_TERM : à l'échéance de l'engagement (le client garde l'accès).
 *  - IMMEDIATE   : tout de suite.
 * Aucun remboursement automatique (conforme CGV).
 */
export async function POST(request, { params }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { id } = await params; // id = userId du client
    const { mode } = await request.json();

    if (!["END_OF_TERM", "IMMEDIATE"].includes(mode)) {
      return NextResponse.json({ error: "Mode de résiliation invalide." }, { status: 400 });
    }

    const sub = await prisma.subscription.findFirst({
      where: {
        userId: id,
        status: { in: ["ACTIVE", "PAST_DUE"] },
      },
    });

    if (!sub) {
      return NextResponse.json(
        { error: "Aucun abonnement actif à résilier pour ce client." },
        { status: 404 }
      );
    }

    /* ---------- Résiliation immédiate ---------- */
    if (mode === "IMMEDIATE") {
      if (sub.stripeSubId) {
        try {
          await stripe.subscriptions.cancel(sub.stripeSubId);
        } catch (stripeErr) {
          console.error("[admin subscription/cancel IMMEDIATE] Stripe:", stripeErr.message);
          // On continue pour refléter l'intention en base
        }
      }

      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "ENDED",
          cancelAt: new Date(),
        },
      });

      return NextResponse.json({ ok: true, mode });
    }

    /* ---------- Résiliation à l'échéance ---------- */
    if (sub.cancelAt) {
      return NextResponse.json(
        { error: "La résiliation est déjà programmée." },
        { status: 409 }
      );
    }

    const cancelDate = sub.engagementEndsAt;

    if (sub.stripeSubId) {
      try {
        await stripe.subscriptions.update(sub.stripeSubId, {
          cancel_at: Math.floor(cancelDate.getTime() / 1000),
        });
      } catch (stripeErr) {
        console.error("[admin subscription/cancel END_OF_TERM] Stripe:", stripeErr.message);
      }
    }

    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "CANCELLED",
        cancelAt: cancelDate,
      },
    });

    return NextResponse.json({ ok: true, mode, cancelAt: cancelDate });
  } catch (error) {
    console.error("[admin subscription/cancel]", error);
    return NextResponse.json(
      { error: "Impossible de résilier l'abonnement." },
      { status: 500 }
    );
  }
}