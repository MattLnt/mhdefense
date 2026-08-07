import { prisma } from "@/lib/prisma";

// Statuts qui occupent réellement un créneau.
// (CANCELLED et NO_SHOW libèrent le slot.)
const OCCUPYING = ["HELD", "CONFIRMED", "COMPLETED"];

const SLOT_MINUTES = 60;

// "07:00" -> 7 * 60
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Retourne les créneaux disponibles entre deux dates.
 * @param {Date} from  début de la fenêtre (inclus)
 * @param {Date} to    fin de la fenêtre (exclu)
 * @returns {Promise<Date[]>} liste des débuts de créneaux libres
 */
export async function getAvailableSlots(from, to) {
  const now = new Date();

  const [rules, blocks, bookings] = await Promise.all([
    prisma.availability.findMany({ where: { active: true } }),
    prisma.block.findMany({
      where: { endsAt: { gt: from }, startsAt: { lt: to } },
    }),
    prisma.booking.findMany({
      where: {
        status: { in: OCCUPYING },
        startsAt: { gte: from, lt: to },
      },
      select: { startsAt: true, status: true, expiresAt: true },
    }),
  ]);

  // Créneaux occupés. Un HELD expiré ne compte plus.
  const taken = new Set(
    bookings
      .filter((b) => b.status !== "HELD" || !b.expiresAt || b.expiresAt > now)
      .map((b) => b.startsAt.getTime())
  );

  const slots = [];

  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  while (cursor < to) {
    const dayRules = rules.filter((r) => r.dayOfWeek === cursor.getDay());

    for (const rule of dayRules) {
      const start = toMinutes(rule.startTime);
      const end = toMinutes(rule.endTime);

      for (let min = start; min + SLOT_MINUTES <= end; min += SLOT_MINUTES) {
        const slot = new Date(cursor);
        slot.setHours(0, min, 0, 0);

        if (slot < from || slot >= to) continue;
        if (slot <= now) continue;
        if (taken.has(slot.getTime())) continue;

        const slotEnd = new Date(slot.getTime() + SLOT_MINUTES * 60000);
        const blocked = blocks.some(
          (b) => b.startsAt < slotEnd && b.endsAt > slot
        );
        if (blocked) continue;

        slots.push(slot);
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return slots.sort((a, b) => a - b);
}

/**
 * Regroupe les créneaux par jour (clé "YYYY-MM-DD").
 */
export function groupSlotsByDay(slots) {
  const map = {};
  for (const slot of slots) {
    const key = [
      slot.getFullYear(),
      String(slot.getMonth() + 1).padStart(2, "0"),
      String(slot.getDate()).padStart(2, "0"),
    ].join("-");
    (map[key] ??= []).push(slot);
  }
  return map;
}