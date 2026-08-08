/**
 * Nettoyage des données de test.
 * Garde uniquement l'admin et le compte client de test.
 * Supprime : tous les autres Users (+ leurs Subscriptions/Bookings liés)
 *            et toutes les PendingSignup.
 *
 * Lancer avec : npx tsx prisma/clean-test-data.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Comptes à conserver
const GARDER = ["admin@mhdefense.fr", "client@test.fr"];

async function main() {
  console.log("🧹 Nettoyage des données de test…\n");

  // 1. Toutes les PendingSignup (demandes en attente = données de test)
  const pending = await prisma.pendingSignup.deleteMany({});
  console.log(`   PendingSignup supprimées : ${pending.count}`);

  // 2. Les utilisateurs à supprimer (tous sauf ceux à garder)
  const usersASupprimer = await prisma.user.findMany({
    where: { email: { notIn: GARDER } },
    select: { id: true, email: true },
  });

  console.log(`   Utilisateurs à supprimer : ${usersASupprimer.length}`);

  for (const u of usersASupprimer) {
    const userId = u.id;

    // Supprime les dépendances d'abord (contraintes de clés étrangères)
    await prisma.booking.deleteMany({ where: { userId } });
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    console.log(`     └─ supprimé : ${u.email}`);
  }

  // 3. Vérif de ce qui reste
  const restants = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log(`\n✅ Utilisateurs restants (${restants.length}) :`);
  restants.forEach((u) => console.log(`     · ${u.email} (${u.role})`));

  console.log("\nTerminé.");
}

main()
  .catch((e) => {
    console.error("Erreur pendant le nettoyage :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });