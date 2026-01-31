require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  if (process.env.SEED_ALLOW !== "true") {
    console.log(
      "Seed skipped. Set SEED_ALLOW=true to run sample seeding safely."
    );
    return;
  }

  const email = process.env.SEED_USER_EMAIL || "admin@example.com";
  const name = process.env.SEED_USER_NAME || "Admin";

  await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });

  console.log(`Seeded user: ${email}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
