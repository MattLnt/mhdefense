import { prisma } from "@/lib/prisma";

// Statuts qui occupent réellement un créneau.
// (CANCELLED et NO_SHOW libèrent le slot.)
const OCCUPYING = ["HELD", "CONFIRMED", "COMPLETED"];

const SLOT_MINUTES = 60;
const TZ = "Europe/Paris";

// "07:00" -> 7 * 60
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Convertit une heure "murale" française (année/mois/jour/heure/minute
 * en Europe/Paris) vers l'instant UTC correct, en tenant compte du
 * changement d'heure (été/hiver) propre à CETTE date.
 */
function parisWallTimeToUtc(y, mo, da, hour, minute) {
  const guess = Date.UTC(y, mo - 1, da, hour, minute, 0);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(guess));
  const map = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  let h = Number(map.hour);
  if (h === 24) h = 0; // certains environnements renvoient "24" pour minuit
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    h,
    Number(map.minute),
    Number(map.second)
  );
  const offset = asUTC - guess; // décalage du fuseau à cet instant
  return new Date(guess - offset);
}

// Clé "YYYY-MM-DD" d'un instant, exprimée en heure française.
function parisDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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

  // On itère jour calendaire français par jour calendaire français.
  const startKey = parisDateKey(from);
  const [sy, sm, sd] = startKey.split("-").map(Number);
  // "porteur de date" en UTC : sert uniquement à l'arithmétique Y/M/J
  const dateHolder = new Date(Date.UTC(sy, sm - 1, sd));

  // Garde-fou : max ~130 jours d'itération
  for (let guard = 0; guard < 130; guard++) {
    const y = dateHolder.getUTCFullYear();
    const mo = dateHolder.getUTCMonth() + 1;
    const da = dateHolder.getUTCDate();
    const weekday = dateHolder.getUTCDay(); // 0 = dimanche … 6 = samedi

    // Début (00:00 Paris) de ce jour, en instant UTC
    const dayStartUtc = parisWallTimeToUtc(y, mo, da, 0, 0);
    if (dayStartUtc >= to) break;

    const dayRules = rules.filter((r) => r.dayOfWeek === weekday);

    for (const rule of dayRules) {
      const start = toMinutes(rule.startTime);
      const end = toMinutes(rule.endTime);

      for (let min = start; min + SLOT_MINUTES <= end; min += SLOT_MINUTES) {
        const hh = Math.floor(min / 60);
        const mm = min % 60;
        const slot = parisWallTimeToUtc(y, mo, da, hh, mm);

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

    dateHolder.setUTCDate(dateHolder.getUTCDate() + 1);
  }

  return slots.sort((a, b) => a - b);
}

/**
 * Regroupe les créneaux par jour (clé "YYYY-MM-DD"), en heure française.
 */
export function groupSlotsByDay(slots) {
  const map = {};
  for (const slot of slots) {
    const key = parisDateKey(slot);
    (map[key] ??= []).push(slot);
  }
  return map;
}