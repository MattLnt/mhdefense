import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PLAN_LABELS = { SILVER: "Silver", GOLD: "Gold", PLATINUM: "Platinum" };
const TYPE_LABELS = { INDIVIDUEL: "Individuel", DUO: "Duo", GROUPE: "Groupe" };

/**
 * GET /api/admin/clients?q=...
 * Liste les clients inscrits (role CLIENT) avec leur abonnement,
 * ainsi que les clients « invités » (réservations essai/ponctuel sans compte),
 * regroupés par email.
 */
export async function GET(request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    /* ---------- 1. Clients inscrits (avec compte) ---------- */
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

    const inscrits = users.map((u) => ({
      id: u.id,
      name: u.name || "—",
      email: u.email,
      phone: u.phone,
      createdAt: u.createdAt.toISOString(),
      totalBookings: u._count.bookings,
      guest: false,
      guestKind: null,
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

    // Emails déjà couverts par un compte (pour ne pas les dédoubler côté invités)
    const emailsInscrits = new Set(
      inscrits.map((u) => (u.email || "").toLowerCase()).filter(Boolean)
    );

    /* ---------- 2. Clients invités (réservations sans compte) ---------- */
    const guestBookings = await prisma.booking.findMany({
      where: {
        userId: null,
        guestEmail: { not: null },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        isFreeTrial: true,
        createdAt: true,
      },
    });

    // Regroupement par email
    const guestMap = new Map();
    for (const b of guestBookings) {
      const email = (b.guestEmail || "").toLowerCase();
      if (!email || emailsInscrits.has(email)) continue; // ignore si déjà un compte

      if (!guestMap.has(email)) {
        guestMap.set(email, {
          id: `guest_${email}`,
          name: b.guestName || "—",
          email: b.guestEmail,
          phone: b.guestPhone,
          createdAt: b.createdAt.toISOString(),
          totalBookings: 0,
          guest: true,
          hasEssai: false,
          hasPonctuel: false,
          subscription: null,
        });
      }
      const g = guestMap.get(email);
      g.totalBookings += 1;
      if (b.isFreeTrial) g.hasEssai = true;
      else g.hasPonctuel = true;
      // garde le nom/téléphone le plus récent si manquant
      if (!g.phone && b.guestPhone) g.phone = b.guestPhone;
      if ((g.name === "—" || !g.name) && b.guestName) g.name = b.guestName;
    }

    // Type affiché : "Essai" si uniquement essai, sinon "Ponctuel"
    const invites = [...guestMap.values()].map((g) => ({
      ...g,
      guestKind: g.hasPonctuel ? "PONCTUEL" : g.hasEssai ? "ESSAI" : "PONCTUEL",
    }));

    /* ---------- 3. Fusion + tri + recherche ---------- */
    let list = [...inscrits, ...invites];

    if (q) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.phone || "").toLowerCase().includes(q)
      );
    }

    // Tri : abonnés actifs d'abord, puis par date de création décroissante
    list.sort((a, b) => {
      const aActif = a.subscription?.status === "ACTIVE" ? 1 : 0;
      const bActif = b.subscription?.status === "ACTIVE" ? 1 : 0;
      if (aActif !== bActif) return bActif - aActif;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return NextResponse.json({ clients: list });
  } catch (error) {
    console.error("[api/admin/clients]", error);
    return NextResponse.json({ error: "Erreur de chargement." }, { status: 500 });
  }
}