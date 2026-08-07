import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 : le script de seed a lui aussi besoin du driver adapter.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------
//  DONNÉES TARIFAIRES (100% issues des grilles images 1 & 3)
//  Prix en CENTIMES. Mensuel par personne.
// ---------------------------------------------------------

// Grille INDIVIDUEL (image 3)
const INDIVIDUEL = {
  SILVER:   { ONCE: 20000, TWICE: 36000 }, // 200 / 360
  GOLD:     { ONCE: 19000, TWICE: 34000 }, // 190 / 340
  PLATINUM: { ONCE: 18000, TWICE: 32000 }, // 180 / 320
};

// Grille SMALL GROUP (image 1) — s'applique au DUO et au GROUPE (par personne)
const GROUPE = {
  SILVER:   { ONCE: 16000, TWICE: 28000 }, // 160 / 280
  GOLD:     { ONCE: 15000, TWICE: 26000 }, // 150 / 260
  PLATINUM: { ONCE: 14000, TWICE: 24000 }, // 140 / 240
};

// Engagement en mois selon la formule
const ENGAGEMENT = { SILVER: 1, GOLD: 3, PLATINUM: 6 };

// Prix ponctuels (séance à l'unité), par personne, en centimes
const PONCTUEL = {
  price_ponctuel_individuel: "6000", // 60 €
  price_ponctuel_duo:        "4500", // 45 € / personne
  price_ponctuel_groupe:     "4500", // 45 € / personne
};

// ---------------------------------------------------------
//  SEED
// ---------------------------------------------------------

async function seedPlans() {
  const keys = ["SILVER", "GOLD", "PLATINUM"];
  const freqs = ["ONCE", "TWICE"];

  // Table de correspondance type de séance → grille tarifaire
  const grids = {
    INDIVIDUEL: INDIVIDUEL,
    DUO: GROUPE,
    GROUPE: GROUPE,
  };

  let count = 0;
  for (const sessionType of Object.keys(grids)) {
    for (const key of keys) {
      for (const frequency of freqs) {
        const price = grids[sessionType][key][frequency];
        await prisma.plan.upsert({
          where: {
            // clé composite définie par @@unique([key, sessionType, frequency])
            key_sessionType_frequency: { key, sessionType, frequency },
          },
          update: { price, engagementMonths: ENGAGEMENT[key], active: true },
          create: {
            key,
            sessionType,
            frequency,
            engagementMonths: ENGAGEMENT[key],
            price,
            active: true,
          },
        });
        count++;
      }
    }
  }
  console.log(`✓ ${count} plans d'abonnement seedés`);
}

async function seedSettings() {
  for (const [key, value] of Object.entries(PONCTUEL)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log(`✓ ${Object.keys(PONCTUEL).length} prix ponctuels seedés`);
}

async function main() {
  await seedPlans();
  await seedSettings();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✅ Seed terminé");
  })
  .catch(async (e) => {
    console.error("❌ Erreur de seed :", e);
    await prisma.$disconnect();
    process.exit(1);
  });