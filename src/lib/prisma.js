import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 : le moteur de connexion interne a été supprimé. Le client
// DOIT recevoir un driver adapter (ici PrismaPg pour PostgreSQL) ;
// new PrismaClient() sans adapter lève une erreur au premier appel.
//
// L'URL de connexion est fournie à l'adapter (côté app), alors que
// prisma.config.ts la fournit séparément pour les migrations (CLI).
//
// Singleton via globalThis : en dev, le hot-reload de Next recrée les
// modules à chaque save. Sans ce garde-fou, on empilerait les pools de
// connexions Railway ("too many connections").

const globalForPrisma = globalThis;

const adapter =
  globalForPrisma.prismaAdapter ??
  new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdapter = adapter;
}