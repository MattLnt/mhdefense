import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// Normalise une saisie euros (accepte virgule ou point) → nombre
function parseEuros(v) {
  if (v === undefined || v === null) return NaN;
  return Number(String(v).replace(",", ".").trim());
}

/**
 * GET /api/admin/pricing
 * Renvoie les prix ponctuels (Setting) et les abonnements (Plan).
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["price_ponctuel_individuel", "price_ponctuel_duo", "price_ponctuel_groupe"] } },
    });

    const ponctuel = {};
    for (const s of settings) ponctuel[s.key] = parseInt(s.value, 10);

    const plans = await prisma.plan.findMany({
      orderBy: [{ sessionType: "asc" }, { key: "asc" }, { frequency: "asc" }],
    });

    return NextResponse.json({
      ponctuel: {
        INDIVIDUEL: ponctuel.price_ponctuel_individuel || 0,
        DUO: ponctuel.price_ponctuel_duo || 0,
        GROUPE: ponctuel.price_ponctuel_groupe || 0,
      },
      plans: plans.map((p) => ({
        id: p.id,
        key: p.key,
        sessionType: p.sessionType,
        frequency: p.frequency,
        engagementMonths: p.engagementMonths,
        price: p.price,
      })),
    });
  } catch (error) {
    console.error("[api/admin/pricing GET]", error);
    return NextResponse.json({ error: "Erreur de chargement." }, { status: 500 });
  }
}

/**
 * PUT /api/admin/pricing
 * Body : { ponctuel: {INDIVIDUEL, DUO, GROUPE}, plans: [{id, price}] }
 * Met à jour les prix (en euros, virgule ou point → convertis en centimes).
 */
export async function PUT(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { ponctuel, plans } = await request.json();

    const toCents = (euros) => Math.round(parseEuros(euros) * 100);
    const valid = (v) => {
      const n = parseEuros(v);
      return !isNaN(n) && n >= 0;
    };

    // Validation
    if (ponctuel) {
      for (const k of ["INDIVIDUEL", "DUO", "GROUPE"]) {
        if (ponctuel[k] !== undefined && !valid(ponctuel[k])) {
          return NextResponse.json({ error: "Prix ponctuel invalide." }, { status: 400 });
        }
      }
    }
    if (Array.isArray(plans)) {
      for (const p of plans) {
        if (!valid(p.price)) {
          return NextResponse.json({ error: "Prix d'abonnement invalide." }, { status: 400 });
        }
      }
    }

    const ops = [];

    // Prix ponctuels (Setting, en centimes stockés en string)
    if (ponctuel) {
      const map = {
        INDIVIDUEL: "price_ponctuel_individuel",
        DUO: "price_ponctuel_duo",
        GROUPE: "price_ponctuel_groupe",
      };
      for (const [type, key] of Object.entries(map)) {
        if (ponctuel[type] !== undefined) {
          ops.push(
            prisma.setting.upsert({
              where: { key },
              update: { value: String(toCents(ponctuel[type])) },
              create: { key, value: String(toCents(ponctuel[type])) },
            })
          );
        }
      }
    }

    // Prix abonnements (Plan)
    if (Array.isArray(plans)) {
      for (const p of plans) {
        ops.push(
          prisma.plan.update({
            where: { id: p.id },
            data: { price: toCents(p.price) },
          })
        );
      }
    }

    await prisma.$transaction(ops);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/pricing PUT]", error);
    return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });
  }
}