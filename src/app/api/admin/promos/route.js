import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

/**
 * GET /api/admin/promos
 * Liste tous les codes promo.
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      promos: promos.map((p) => ({
        id: p.id,
        code: p.code,
        discountType: p.discountType,
        discountValue: p.discountValue,
        scope: p.scope,
        active: p.active,
        startsAt: p.startsAt?.toISOString() || null,
        endsAt: p.endsAt?.toISOString() || null,
        maxRedemptions: p.maxRedemptions,
        timesRedeemed: p.timesRedeemed,
      })),
    });
  } catch (error) {
    console.error("[api/admin/promos GET]", error);
    return NextResponse.json({ error: "Erreur de chargement." }, { status: 500 });
  }
}

/**
 * POST /api/admin/promos
 * Body : { code, discountType, discountValue, scope, startsAt?, endsAt?, maxRedemptions? }
 * Crée un code promo. discountValue en euros pour FIXED (converti en centimes).
 */
export async function POST(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const code = (body.code || "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "Le code est requis." }, { status: 400 });
    }
    if (!["PERCENT", "FIXED"].includes(body.discountType)) {
      return NextResponse.json({ error: "Type de réduction invalide." }, { status: 400 });
    }
    if (!["PONCTUEL", "ABONNEMENT", "ALL"].includes(body.scope)) {
      return NextResponse.json({ error: "Périmètre invalide." }, { status: 400 });
    }

    const rawValue = Number(body.discountValue);
    if (isNaN(rawValue) || rawValue <= 0) {
      return NextResponse.json({ error: "Valeur de réduction invalide." }, { status: 400 });
    }
    // PERCENT : 1-100 ; FIXED : euros → centimes
    if (body.discountType === "PERCENT" && (rawValue < 1 || rawValue > 100)) {
      return NextResponse.json({ error: "Le pourcentage doit être entre 1 et 100." }, { status: 400 });
    }
    const discountValue =
      body.discountType === "FIXED" ? Math.round(rawValue * 100) : Math.round(rawValue);

    // Unicité du code
    const existing = await prisma.promoCode.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "Ce code existe déjà." }, { status: 409 });
    }

    const promo = await prisma.promoCode.create({
      data: {
        code,
        discountType: body.discountType,
        discountValue,
        scope: body.scope,
        active: true,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        maxRedemptions: body.maxRedemptions ? parseInt(body.maxRedemptions, 10) : null,
      },
    });

    return NextResponse.json({ ok: true, id: promo.id });
  } catch (error) {
    console.error("[api/admin/promos POST]", error);
    return NextResponse.json({ error: "Erreur de création." }, { status: 500 });
  }
}