import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const plans = await prisma.plan.findMany({
    orderBy: [{ sessionType: "asc" }, { key: "asc" }, { frequency: "asc" }],
  });

  console.log(`\n=== ${plans.length} plans en base ===\n`);
  for (const p of plans) {
    console.log(
      `key=${p.key} | sessionType=${p.sessionType} | frequency=${p.frequency} | price=${p.price} | engagementMonths=${p.engagementMonths} | active=${p.active}`
    );
  }

  // Prix ponctuels aussi
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ["price_ponctuel_individuel", "price_ponctuel_duo", "price_ponctuel_groupe"],
      },
    },
  });
  console.log(`\n=== Prix ponctuels ===\n`);
  for (const s of settings) {
    console.log(`${s.key} = ${s.value}`);
  }
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });