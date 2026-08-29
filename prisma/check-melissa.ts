import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Adapte ici l'email ou le nom de Melissa quand tu l'as
  const RECHERCHE = "melissa"; // cherche dans nom/email (insensible à la casse)

  console.log("=== Réservations correspondant à la recherche ===\n");

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { guestName: { contains: RECHERCHE, mode: "insensitive" } },
        { guestEmail: { contains: RECHERCHE, mode: "insensitive" } },
        { user: { name: { contains: RECHERCHE, mode: "insensitive" } } },
        { user: { email: { contains: RECHERCHE, mode: "insensitive" } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { user: true, payment: true },
  });

  if (bookings.length === 0) {
    console.log("Aucune réservation trouvée pour cette recherche.\n");
  } else {
    for (const b of bookings) {
      console.log("-------------------------------------------");
      console.log("Créée le      :", b.createdAt.toLocaleString("fr-FR"));
      console.log("Séance le     :", b.startsAt.toLocaleString("fr-FR"));
      console.log("Type          :", b.type, b.isFreeTrial ? "(ESSAI GRATUIT)" : "");
      console.log("Statut        :", b.status);
      console.log("Nom (guest)   :", b.guestName || "—");
      console.log("Email (guest) :", b.guestEmail || "—");
      console.log("Tél (guest)   :", b.guestPhone || "—");
      console.log("Compte lié    :", b.user ? `${b.user.name} <${b.user.email}>` : "aucun");
      if (b.payment) {
        console.log("Paiement      :", b.payment.status, `${b.payment.totalAmount / 100}€`);
      } else {
        console.log("Paiement      : aucun");
      }
    }
    console.log("-------------------------------------------\n");
  }

  // Aussi : les 5 dernières réservations tous confondus (pour contexte)
  console.log("=== 5 dernières réservations (contexte) ===\n");
  const recent = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: true },
  });
  for (const b of recent) {
    console.log(
      b.createdAt.toLocaleString("fr-FR"),
      "|", b.status,
      "|", b.isFreeTrial ? "ESSAI" : b.type,
      "|", b.guestEmail || b.user?.email || "—"
    );
  }
  console.log();
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());