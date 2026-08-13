import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Comptes de test (modifie librement) ──────────────────────
const ADMIN = {
  email: "contact@mh-defense.com",
  password: "!@#123MH!@#456Defense",
  name: "Admin MH",
  phone: "0651001401",
};
const CLIENT = {
  email: "client@test.fr",
  password: "client1234",
  name: "Marie Dupont",
  phone: "0612345678",
};
// Abonnement du client de test
const ABO = {
  sessionType: "INDIVIDUEL" as const,
  planKey: "GOLD" as const,
  frequency: "ONCE" as const,
};
// ──────────────────────────────────────────────────────────────

const QUOTA = { ONCE: 1, TWICE: 2 };
const PERSONNES = { INDIVIDUEL: 1, DUO: 2, GROUPE: 3 };

async function seedAdmin() {
  const passwordHash = await bcrypt.hash(ADMIN.password, 10);
  await prisma.user.upsert({
    where: { email: ADMIN.email },
    update: { role: "ADMIN", name: ADMIN.name, phone: ADMIN.phone, passwordHash },
    create: {
      email: ADMIN.email,
      name: ADMIN.name,
      phone: ADMIN.phone,
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`✓ Admin créé : ${ADMIN.email} / ${ADMIN.password}`);
}

async function seedClient() {
  const passwordHash = await bcrypt.hash(CLIENT.password, 10);

  // Compte client
  const user = await prisma.user.upsert({
    where: { email: CLIENT.email },
    update: { role: "CLIENT", name: CLIENT.name, phone: CLIENT.phone, passwordHash },
    create: {
      email: CLIENT.email,
      name: CLIENT.name,
      phone: CLIENT.phone,
      passwordHash,
      role: "CLIENT",
    },
  });

  // Le plan correspondant (doit exister via le seed principal)
  const plan = await prisma.plan.findUnique({
    where: {
      key_sessionType_frequency: {
        key: ABO.planKey,
        sessionType: ABO.sessionType,
        frequency: ABO.frequency,
      },
    },
  });
  if (!plan) {
    console.error("❌ Plan introuvable — lance d'abord `npx prisma db seed` (seed principal).");
    return;
  }

  // Abonnement actif (sans Stripe — pour tester l'interface)
  const now = new Date();
  const engagementEndsAt = new Date(now);
  engagementEndsAt.setMonth(engagementEndsAt.getMonth() + plan.engagementMonths);

  // On supprime un éventuel abo existant pour ce user (relation 1-1)
  await prisma.subscription.deleteMany({ where: { userId: user.id } });

  await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      sessionType: ABO.sessionType,
      frequency: ABO.frequency,
      weeklyQuota: QUOTA[ABO.frequency],
      participantsCount: PERSONNES[ABO.sessionType],
      status: "ACTIVE",
      engagementEndsAt,
      currentPeriodEnd: engagementEndsAt,
    },
  });

  console.log(`✓ Client créé : ${CLIENT.email} / ${CLIENT.password}`);
  console.log(`  └─ Abonnement ${ABO.planKey} ${ABO.sessionType} (${ABO.frequency}) actif`);
}

async function main() {
  await seedAdmin();
  await seedClient();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✅ Comptes de test créés");
  })
  .catch(async (e) => {
    console.error("❌ Erreur :", e);
    await prisma.$disconnect();
    process.exit(1);
  });