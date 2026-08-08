/**
 * Vide toutes les réservations : Booking + Payment + Participant.
 * Ne touche pas aux utilisateurs, abonnements, plans ni disponibilités.
 *
 * Lancer avec : npx tsx prisma/clean-bookings.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 Suppression de toutes les réservations…\n");

  // Participant et Payment référencent Booking (onDelete: Cascade),
  // mais on les supprime explicitement pour être sûr.
  const participants = await prisma.participant.deleteMany({});
  console.log(`   Participants supprimés : ${participants.count}`);

  const payments = await prisma.payment.deleteMany({});
  console.log(`   Paiements supprimés    : ${payments.count}`);

  const bookings = await prisma.booking.deleteMany({});
  console.log(`   Réservations supprimées : ${bookings.count}`);

  console.log("\n✅ Toutes les réservations ont été supprimées.");
}

main()
  .catch((e) => {
    console.error("Erreur pendant le nettoyage :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });