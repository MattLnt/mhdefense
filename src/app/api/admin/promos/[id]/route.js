import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

/**
 * PATCH /api/admin/promos/[id]
 * Body : { active }
 * Active ou désactive un code promo.
 */
export async function PATCH(request, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { active } = await request.json();

    await prisma.promoCode.update({
      where: { id },
      data: { active: !!active },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/promos PATCH]", error);
    return NextResponse.json({ error: "Erreur de mise à jour." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/promos/[id]
 * Supprime un code promo.
 */
export async function DELETE(_request, { params }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.promoCode.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/promos DELETE]", error);
    return NextResponse.json({ error: "Erreur de suppression." }, { status: 500 });
  }
}