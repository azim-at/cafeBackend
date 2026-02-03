require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

const getEnv = (key, fallback) => {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : fallback;
};

const upsertUser = async ({ email, name, role, password }) => {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash },
    create: { email, name, role, passwordHash },
    select: { id: true, email: true, name: true, role: true },
  });
};

const upsertCategory = async ({ name, sortOrder }) => {
  const existing = await prisma.menuCategory.findFirst({ where: { name } });
  if (existing) {
    return prisma.menuCategory.update({
      where: { id: existing.id },
      data: { sortOrder },
    });
  }
  return prisma.menuCategory.create({ data: { name, sortOrder } });
};

const upsertMenuItem = async ({
  name,
  categoryId,
  price,
  description,
  imageUrl,
  popular = false,
  isActive = true,
  rating,
}) => {
  const existing = await prisma.menuItem.findFirst({
    where: { name, categoryId },
  });
  if (existing) {
    return prisma.menuItem.update({
      where: { id: existing.id },
      data: { price, description, imageUrl, popular, isActive, rating },
    });
  }
  return prisma.menuItem.create({
    data: {
      name,
      categoryId,
      price,
      description,
      imageUrl,
      popular,
      isActive,
      rating,
    },
  });
};

async function main() {
  if (process.env.SEED_ALLOW !== "true") {
    console.log(
      "Seed skipped. Set SEED_ALLOW=true to run sample seeding safely."
    );
    return;
  }

  const ownerEmail = getEnv("SEED_OWNER_EMAIL", "owner@cafe.local");
  const ownerPassword = getEnv("SEED_OWNER_PASSWORD", "OwnerPass123!");
  const ownerName = getEnv("SEED_OWNER_NAME", "Cafe Owner");

  const customerEmail = getEnv("SEED_CUSTOMER_EMAIL", "customer@cafe.local");
  const customerPassword = getEnv("SEED_CUSTOMER_PASSWORD", "Customer123!");
  const customerName = getEnv("SEED_CUSTOMER_NAME", "Cafe Customer");

  const owner = await upsertUser({
    email: ownerEmail,
    name: ownerName,
    role: "owner",
    password: ownerPassword,
  });

  const customer = await upsertUser({
    email: customerEmail,
    name: customerName,
    role: "customer",
    password: customerPassword,
  });

  const coffee = await upsertCategory({ name: "Coffee", sortOrder: 1 });
  const tea = await upsertCategory({ name: "Tea", sortOrder: 2 });
  const pastries = await upsertCategory({ name: "Pastries", sortOrder: 3 });

  const espresso = await upsertMenuItem({
    name: "Espresso",
    categoryId: coffee.id,
    price: 300,
    description: "Rich single-shot espresso.",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
    popular: true,
  });

  const latte = await upsertMenuItem({
    name: "Cafe Latte",
    categoryId: coffee.id,
    price: 450,
    description: "Espresso with steamed milk.",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
    popular: true,
  });

  const cappuccino = await upsertMenuItem({
    name: "Cappuccino",
    categoryId: coffee.id,
    price: 425,
    description: "Foamy espresso with milk.",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
  });

  const chai = await upsertMenuItem({
    name: "Chai Latte",
    categoryId: tea.id,
    price: 400,
    description: "Spiced tea with steamed milk.",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
  });

  const croissant = await upsertMenuItem({
    name: "Butter Croissant",
    categoryId: pastries.id,
    price: 350,
    description: "Flaky butter croissant.",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
  });

  const muffin = await upsertMenuItem({
    name: "Blueberry Muffin",
    categoryId: pastries.id,
    price: 325,
    description: "Fresh baked muffin.",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
  });

  await prisma.favorite.upsert({
    where: {
      userId_menuItemId: { userId: customer.id, menuItemId: latte.id },
    },
    update: {},
    create: { userId: customer.id, menuItemId: latte.id },
  });

  await prisma.favorite.upsert({
    where: {
      userId_menuItemId: { userId: customer.id, menuItemId: croissant.id },
    },
    update: {},
    create: { userId: customer.id, menuItemId: croissant.id },
  });

  await prisma.rewardsAccount.upsert({
    where: { userId: customer.id },
    update: {},
    create: { userId: customer.id, pointsBalance: 0, level: "bronze" },
  });

  const welcomeTxn = await prisma.rewardTransaction.findFirst({
    where: { userId: customer.id, reason: "seed:welcome" },
  });

  if (!welcomeTxn) {
    await prisma.$transaction([
      prisma.rewardTransaction.create({
        data: {
          userId: customer.id,
          pointsDelta: 50,
          reason: "seed:welcome",
        },
      }),
      prisma.rewardsAccount.update({
        where: { userId: customer.id },
        data: { pointsBalance: { increment: 50 } },
      }),
    ]);
  }

  const existingOrder = await prisma.order.findFirst({
    where: { userId: customer.id },
  });

  if (!existingOrder) {
    const orderItems = [
      {
        menuItemId: latte.id,
        nameSnapshot: latte.name,
        priceSnapshot: latte.price,
        quantity: 1,
      },
      {
        menuItemId: muffin.id,
        nameSnapshot: muffin.name,
        priceSnapshot: muffin.price,
        quantity: 2,
      },
    ];

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.priceSnapshot * item.quantity,
      0
    );

    await prisma.order.create({
      data: {
        userId: customer.id,
        type: "dine_in",
        subtotal,
        deliveryFee: 0,
        total: subtotal,
        items: { create: orderItems },
      },
    });
  }

  const guestEmail = getEnv("SEED_GUEST_EMAIL", "guest@cafe.local");
  const existingGuestOrder = await prisma.order.findFirst({
    where: { guestEmail },
  });

  if (!existingGuestOrder) {
    const orderItems = [
      {
        menuItemId: espresso.id,
        nameSnapshot: espresso.name,
        priceSnapshot: espresso.price,
        quantity: 1,
      },
      {
        menuItemId: croissant.id,
        nameSnapshot: croissant.name,
        priceSnapshot: croissant.price,
        quantity: 1,
      },
    ];

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.priceSnapshot * item.quantity,
      0
    );

    const guestOrder = await prisma.order.create({
      data: {
        guestEmail,
        guestPhone: "555-0102",
        deliveryAddress: "123 Cafe Street",
        type: "delivery",
        subtotal,
        deliveryFee: 0,
        total: subtotal,
        items: { create: orderItems },
      },
    });

    await prisma.guestOrderToken.create({
      data: {
        orderId: guestOrder.id,
        token: crypto.randomBytes(32).toString("hex"),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Seed complete:");
  console.log(`- Owner: ${owner.email}`);
  console.log(`- Customer: ${customer.email}`);
  console.log("- Categories: Coffee, Tea, Pastries");
  console.log("- Items: Espresso, Cafe Latte, Cappuccino, Chai Latte, Butter Croissant, Blueberry Muffin");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
