import { NextResponse } from "next/server";
import { getAvailableSlots, groupSlotsByDay } from "@/lib/slots";

// Pas de cache : les créneaux changent en temps réel.
export const dynamic = "force-dynamic";

/**
 * GET /api/availability?from=...&to=...
 * Retourne les créneaux libres regroupés par jour.
 * Sans paramètres : les 60 prochains jours.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const from = fromParam ? new Date(fromParam) : new Date();
    const to = toParam
      ? new Date(toParam)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    if (isNaN(from) || isNaN(to) || to <= from) {
      return NextResponse.json(
        { error: "Paramètres de dates invalides." },
        { status: 400 }
      );
    }

    const MAX_DAYS = 120;
    const span = (to - from) / (24 * 60 * 60 * 1000);
    if (span > MAX_DAYS) {
      return NextResponse.json(
        { error: `Fenêtre trop large (max ${MAX_DAYS} jours).` },
        { status: 400 }
      );
    }

    const slots = await getAvailableSlots(from, to);
    const grouped = groupSlotsByDay(slots);

    const days = Object.fromEntries(
      Object.entries(grouped).map(([day, list]) => [
        day,
        list.map((d) => d.toISOString()),
      ])
    );

    return NextResponse.json({ days });
  } catch (error) {
    console.error("[availability]", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les disponibilités." },
      { status: 500 }
    );
  }
}