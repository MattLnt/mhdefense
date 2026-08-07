import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Grille INDIVIDUEL (image 3) — prix en centimes
const INDIVIDUEL = {
  SILVER:   { ONCE: 20000, TWICE: 36000 },
  GOLD:     { ONCE: 19000, TWICE: 34000 },
  PLATINUM: { ONCE: 18000, TWICE: 32000 },
};
// Grille SMALL GROUP (image 1) — DUO & GROUPE (par personne)
const GROUPE = {
  SILVER:   { ONCE: 16000, TWICE: 28000 },
  GOLD:     { ONCE: 15000, TWICE: 26000 },
  PLATINUM: { ONCE: 14000, TWICE: 24000 },
};
const ENGAGEMENT = { SILVER: 1, GOLD: 3, PLATINUM: 6 };

const PONCTUEL = {
  price_ponctuel_individuel: "6000", // 60 €
  price_ponctuel_duo:        "4500", // 45 €
  price_ponctuel_groupe:     "4500", // 45 €
};

const DISPOS = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: "07:00",
  endTime: "21:00",
}));

async function seedPlans() {
  const keys = ["SILVER", "GOLD", "PLATINUM"];
  const freqs = ["ONCE", "TWICE"];
  const grids = { INDIVIDUEL, DUO: GROUPE, GROUPE };
  let count = 0;
  for (const sessionType of Object.keys(grids)) {
    for (const key of keys) {
      for (const frequency of freqs) {
        const price = grids[sessionType][key][frequency];
        await prisma.plan.upsert({
          where: { key_sessionType_frequency: { key, sessionType, frequency } },
          update: { price, engagementMonths: ENGAGEMENT[key], active: true },
          create: { key, sessionType, frequency, engagementMonths: ENGAGEMENT[key], price, active: true },
        });
        count++;
      }
    }
  }
  console.log(`✓ ${count} plans d'abonnement seedés`);
}

async function seedSettings() {
  for (const [key, value] of Object.entries(PONCTUEL)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log(`✓ ${Object.keys(PONCTUEL).length} prix ponctuels seedés`);
}

async function seedAvailability() {
  const existing = await prisma.availability.count();
  if (existing > 0) {
    console.log(`· ${existing} règles de dispo déjà présentes — ignoré`);
    return;
  }
  await prisma.availability.createMany({ data: DISPOS });
  console.log(`✓ ${DISPOS.length} règles de disponibilité seedées (7h–21h)`);
}

async function main() {
  await seedPlans();
  await seedSettings();
  await seedAvailability();
}

main()
  .then(async () => { await prisma.$disconnect(); console.log("✅ Seed terminé"); })
  .catch(async (e) => { console.error("❌ Erreur de seed :", e); await prisma.$disconnect(); process.exit(1); });