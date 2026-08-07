import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

/**
 * GET /api/admin/availability
 * Renvoie les règles récurrentes (Availability) et les blocages (Block) à venir.
 */
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const availability = await prisma.availability.findMany({
      orderBy: { dayOfWeek: "asc" },
    });

    const blocks = await prisma.block.findMany({
      where: { endsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
    });

    return NextResponse.json({
      availability: availability.map((a) => ({
        id: a.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        active: a.active,
      })),
      blocks: blocks.map((b) => ({
        id: b.id,
        startsAt: b.startsAt.toISOString(),
        endsAt: b.endsAt.toISOString(),
        reason: b.reason,
      })),
    });
  } catch (error) {
    console.error("[api/admin/availability GET]", error);
    return NextResponse.json({ error: "Erreur de chargement." }, { status: 500 });
  }
}

/**
 * PUT /api/admin/availability
 * Body : { availability: [{ dayOfWeek, startTime, endTime, active }] }
 * Remplace toutes les règles récurrentes (une par jour de la semaine).
 */
export async function PUT(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { availability } = await request.json();
    if (!Array.isArray(availability)) {
      return NextResponse.json({ error: "Format invalide." }, { status: 400 });
    }

    // Validation simple des heures "HH:MM"
    const isTime = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
    for (const a of availability) {
      if (
        typeof a.dayOfWeek !== "number" ||
        a.dayOfWeek < 0 || a.dayOfWeek > 6 ||
        !isTime(a.startTime) || !isTime(a.endTime) ||
        a.startTime >= a.endTime
      ) {
        return NextResponse.json(
          { error: "Horaires invalides (vérifiez que l'ouverture précède la fermeture)." },
          { status: 400 }
        );
      }
    }

    // On remplace tout : suppression puis recréation
    await prisma.$transaction([
      prisma.availability.deleteMany({}),
      prisma.availability.createMany({
        data: availability.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          active: a.active !== false,
        })),
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/availability PUT]", error);
    return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });
  }
}