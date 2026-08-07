import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PLAN_LABELS = { SILVER: "Silver", GOLD: "Gold", PLATINUM: "Platinum" };
const TYPE_LABELS = { INDIVIDUEL: "Individuel", DUO: "Duo", GROUPE: "Groupe" };

/**
 * GET /api/admin/clients?q=...
 * Liste les clients (role CLIENT) avec leur abonnement et le nombre de séances.
 */
export async function GET(request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    const users = await prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      include: {
        subscription: { include: { plan: true } },
        _count: {
          select: {
            bookings: { where: { status: { in: ["CONFIRMED", "COMPLETED"] } } },
          },
        },
      },
    });

    let list = users.map((u) => ({
      id: u.id,
      name: u.name || "—",
      email: u.email,
      phone: u.phone,
      createdAt: u.createdAt.toISOString(),
      totalBookings: u._count.bookings,
      subscription: u.subscription
        ? {
            planLabel: PLAN_LABELS[u.subscription.plan.key],
            sessionLabel: TYPE_LABELS[u.subscription.sessionType],
            status: u.subscription.status,
            monthlyAmount: u.subscription.plan.price * u.subscription.participantsCount,
            engagementEndsAt: u.subscription.engagementEndsAt,
            cancelAt: u.subscription.cancelAt,
          }
        : null,
    }));

    if (q) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone || "").toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ clients: list });
  } catch (error) {
    console.error("[api/admin/clients]", error);
    return NextResponse.json({ error: "Erreur de chargement." }, { status: 500 });
  }
}