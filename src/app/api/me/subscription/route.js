import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PLAN_LABELS = { SILVER: "Silver", GOLD: "Gold", PLATINUM: "Platinum" };
const TYPE_LABELS = { INDIVIDUEL: "Individuel", DUO: "Duo", GROUPE: "Petit groupe" };

/**
 * GET /api/me/subscription
 * Détail complet de l'abonnement du membre connecté.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const sub = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["ACTIVE", "PAST_DUE", "CANCELLED"] },
      },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });

    if (!sub) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({
      subscription: {
        id: sub.id,
        planKey: sub.plan.key,
        planLabel: PLAN_LABELS[sub.plan.key],
        sessionType: sub.sessionType,
        sessionLabel: TYPE_LABELS[sub.sessionType],
        frequency: sub.frequency,
        weeklyQuota: sub.weeklyQuota,
        participantsCount: sub.participantsCount,
        monthlyAmount: sub.plan.price * sub.participantsCount,
        engagementMonths: sub.plan.engagementMonths,
        status: sub.status,
        engagementEndsAt: sub.engagementEndsAt,
        cancelAt: sub.cancelAt,
        currentPeriodEnd: sub.currentPeriodEnd,
        createdAt: sub.createdAt,
      },
    });
  } catch (error) {
    console.error("[api/me/subscription]", error);
    return NextResponse.json(
      { error: "Impossible de charger votre abonnement." },
      { status: 500 }
    );
  }
}