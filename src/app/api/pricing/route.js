import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/pricing  (public, lecture seule)
 * Renvoie les prix ponctuels et les abonnements pour la page vitrine.
 */
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ["price_ponctuel_individuel", "price_ponctuel_duo", "price_ponctuel_groupe"],
        },
      },
    });

    const ponctuel = {};
    for (const s of settings) ponctuel[s.key] = parseInt(s.value, 10);

    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: [{ sessionType: "asc" }, { key: "asc" }, { frequency: "asc" }],
      select: {
        key: true,
        sessionType: true,
        frequency: true,
        price: true,
        engagementMonths: true,
      },
    });

    return NextResponse.json({
      ponctuel: {
        INDIVIDUEL: ponctuel.price_ponctuel_individuel || 0,
        DUO: ponctuel.price_ponctuel_duo || 0,
        GROUPE: ponctuel.price_ponctuel_groupe || 0,
      },
      plans,
    });
  } catch (error) {
    console.error("[api/pricing]", error);
    return NextResponse.json({ error: "Erreur de chargement." }, { status: 500 });
  }
}