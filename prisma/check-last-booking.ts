import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: true, payment: true },
  });

  console.log(`\n=== 5 dernières réservations ===\n`);
  for (const b of bookings) {
    console.log(
      `id=${b.id.slice(0, 8)} | type=${b.type} | sessionType=${b.sessionType} | status=${b.status} | isFreeTrial=${b.isFreeTrial}`
    );
    console.log(
      `   guestName=${b.guestName ?? "—"} | guestEmail=${b.guestEmail ?? "—"} | userEmail=${b.user?.email ?? "—"}`
    );
    console.log(
      `   payment=${b.payment ? `${b.payment.status} (intent=${b.payment.stripePaymentIntentId?.slice(0, 12) ?? "—"})` : "aucun"}`
    );
    console.log("");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });