import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/* ============================================================
   ⚙️  RÉGLAGES — à ajuster avant de lancer
   ============================================================ */

// true  = simulation (liste seulement, ne supprime RIEN)  ← commence par ça
// false = suppression réelle
const DRY_RUN = true;

// Champ de référence : "startsAt" (date de séance) ou "createdAt" (date de création)
const FIELD: "startsAt" | "createdAt" = "createdAt";

// Date seuil : on supprime les résas dont le champ choisi est AVANT cette date.
// Format : "AAAA-MM-JJ" (heure française). Ajuste selon ton besoin.
const THRESHOLD = "2026-08-30";

/* ============================================================ */

function fmt(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(d);
}

async function main() {
  const seuil = new Date(`${THRESHOLD}T00:00:00.000Z`);

  const where = { [FIELD]: { lt: seuil } };

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { [FIELD]: "asc" },
    include: { user: true, payment: true },
  });

  console.log(`\n=== Nettoyage réservations ===`);
  console.log(`Mode        : ${DRY_RUN ? "SIMULATION (rien supprimé)" : "SUPPRESSION RÉELLE"}`);
  console.log(`Critère     : ${FIELD} < ${THRESHOLD}`);
  console.log(`Concernées  : ${bookings.length} réservation(s)\n`);

  if (bookings.length === 0) {
    console.log("Rien à supprimer avec ces critères.\n");
    return;
  }

  for (const b of bookings) {
    const who = b.user
      ? `${b.user.name} <${b.user.email}> [COMPTE]`
      : `${b.guestName || "—"} <${b.guestEmail || "—"}> [invité]`;
    console.log(
      `- créée ${fmt(b.createdAt)} | séance ${fmt(b.startsAt)} | ${b.status} | ${b.isFreeTrial ? "ESSAI" : b.type} | ${who}`
    );
  }
  console.log();

  if (DRY_RUN) {
    console.log("SIMULATION : aucune suppression effectuée.");
    console.log("Pour supprimer réellement : passe DRY_RUN = false puis relance.\n");
    return;
  }

  // Suppression réelle (Payment et Participant sont supprimés en cascade)
  const res = await prisma.booking.deleteMany({ where });
  console.log(`✅ ${res.count} réservation(s) supprimée(s).\n`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());