import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

/**
 * POST /api/admin/blocks
 * Body : { startsAt, endsAt, reason? }
 * Crée un blocage (vacances, absence, plage indisponible).
 */
export async function POST(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { startsAt, endsAt, reason } = await request.json();

    const start = new Date(startsAt);
    const end = new Date(endsAt);

    if (isNaN(start) || isNaN(end)) {
      return NextResponse.json({ error: "Dates invalides." }, { status: 400 });
    }
    if (end <= start) {
      return NextResponse.json(
        { error: "La date de fin doit être après la date de début." },
        { status: 400 }
      );
    }

    const block = await prisma.block.create({
      data: {
        startsAt: start,
        endsAt: end,
        reason: reason?.trim() || null,
      },
    });

    return NextResponse.json({
      block: {
        id: block.id,
        startsAt: block.startsAt.toISOString(),
        endsAt: block.endsAt.toISOString(),
        reason: block.reason,
      },
    });
  } catch (error) {
    console.error("[api/admin/blocks POST]", error);
    return NextResponse.json({ error: "Erreur de création." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/blocks?id=...
 * Supprime un blocage.
 */
export async function DELETE(request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });
    }

    await prisma.block.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/blocks DELETE]", error);
    return NextResponse.json({ error: "Erreur de suppression." }, { status: 500 });
  }
}