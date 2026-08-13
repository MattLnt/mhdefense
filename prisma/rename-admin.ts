/**
 * Renomme l'email du compte admin.
 * admin@mhdefense.fr → contact@mh-defense.com
 * Ne crée pas de doublon : modifie le compte existant.
 *
 * Lancer avec : npx tsx prisma/rename-admin.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ANCIEN = "admin@mhdefense.fr";
const NOUVEAU = "contact@mh-defense.com";

async function main() {
  console.log(`🔄 Renommage de l'admin : ${ANCIEN} → ${NOUVEAU}\n`);

  // Le nouveau email est-il déjà pris ?
  const dejaExistant = await prisma.user.findUnique({ where: { email: NOUVEAU } });
  if (dejaExistant) {
    console.log(`⚠️  Un compte existe déjà avec ${NOUVEAU} (rôle : ${dejaExistant.role}).`);
    console.log("    Aucune modification effectuée pour éviter un conflit.");
    return;
  }

  // L'ancien admin existe-t-il ?
  const admin = await prisma.user.findUnique({ where: { email: ANCIEN } });
  if (!admin) {
    console.log(`ℹ️  Aucun compte avec ${ANCIEN} — peut-être déjà renommé.`);
    return;
  }

  // Renommage
  await prisma.user.update({
    where: { id: admin.id },
    data: { email: NOUVEAU },
  });

  console.log(`✅ Admin renommé avec succès.`);
  console.log(`   Nouvel email de connexion : ${NOUVEAU}`);
  console.log(`   Mot de passe inchangé.`);
}

main()
  .catch((e) => {
    console.error("Erreur pendant le renommage :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });