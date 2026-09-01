import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function fmt(date: Date, tz?: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  }).format(date);
}

async function main() {
  // Dernier essai créé
  const b = await prisma.booking.findFirst({
    where: { isFreeTrial: true },
    orderBy: { createdAt: "desc" },
  });

  if (!b) {
    console.log("Aucun essai trouvé.");
    return;
  }

  const d = new Date(b.startsAt);

  console.log("=== Dernier essai ===\n");
  console.log("Nom              :", b.guestName || "—");
  console.log("Email            :", b.guestEmail || "—");
  console.log();
  console.log("startsAt BRUT (ISO/UTC) :", d.toISOString());
  console.log("---");
  console.log("Affiché en UTC          :", fmt(d, "UTC"));
  console.log("Affiché en Europe/Paris :", fmt(d, "Europe/Paris"), "  <-- ce que l'email envoie maintenant");
  console.log("Affiché sans timeZone   :", fmt(d), "  (heure locale de CETTE machine)");
  console.log();
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());