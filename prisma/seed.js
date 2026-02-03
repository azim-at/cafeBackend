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

const upsertUser = async ({ email, name, role, password, phone }) => {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, passwordHash, phone },
    create: { email, name, role, passwordHash, phone },
    select: { id: true, email: true, name: true, role: true },
  });
};

const upsertCafe = async ({
  name,
  slug,
  ownerUserId,
  status = "active",
  phone,
  email,
  address,
}) => {
  return prisma.cafe.upsert({
    where: { slug },
    update: { name, ownerUserId, status, phone, email, address },
    create: { name, slug, ownerUserId, status, phone, email, address },
  });
};

const backfillCafeId = async (cafeId) => {
  const cafeObjectId = { $oid: cafeId };
  const collections = [
    "menu_categories",
    "menu_items",
    "orders",
    "order_items",
    "favorites",
    "rewards_accounts",
    "reward_transactions",
    "guest_order_tokens",
  ];

  for (const collection of collections) {
    await prisma.$runCommandRaw({
      update: collection,
      updates: [
        {
          q: { $or: [{ cafe_id: { $exists: false } }, { cafe_id: null }] },
          u: { $set: { cafe_id: cafeObjectId } },
          multi: true,
        },
      ],
    });
  }
};

const upsertCategory = async ({ name, sortOrder, cafeId }) => {
  const existing = await prisma.menuCategory.findFirst({
    where: { name, cafeId },
  });
  if (existing) {
    return prisma.menuCategory.update({
      where: { id: existing.id },
      data: { sortOrder },
    });
  }
  return prisma.menuCategory.create({ data: { name, sortOrder, cafeId } });
};

const upsertMenuItem = async ({
  name,
  cafeId,
  categoryId,
  price,
  description,
  imageUrl,
  popular = false,
  isActive = true,
  rating,
}) => {
  const existing = await prisma.menuItem.findFirst({
    where: { name, categoryId, cafeId },
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
      cafeId,
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
  const ownerPhone = getEnv("SEED_OWNER_PHONE", "555-0101");

  const customerEmail = getEnv("SEED_CUSTOMER_EMAIL", "customer@cafe.local");
  const customerPassword = getEnv("SEED_CUSTOMER_PASSWORD", "Customer123!");
  const customerName = getEnv("SEED_CUSTOMER_NAME", "Cafe Customer");
  const customerPhone = getEnv("SEED_CUSTOMER_PHONE", "555-0102");

  const cafeName = getEnv("SEED_CAFE_NAME", "Cafe Central");
  const cafeSlug = getEnv("SEED_CAFE_SLUG", "cafe-central");
  const cafePhone = getEnv("SEED_CAFE_PHONE", "555-0100");
  const cafeEmail = getEnv("SEED_CAFE_EMAIL", "hello@cafe.local");
  const cafeAddress = getEnv("SEED_CAFE_ADDRESS", "123 Cafe Street");

  const owner = await upsertUser({
    email: ownerEmail,
    name: ownerName,
    role: "owner",
    password: ownerPassword,
    phone: ownerPhone,
  });

  const customer = await upsertUser({
    email: customerEmail,
    name: customerName,
    role: "customer",
    password: customerPassword,
    phone: customerPhone,
  });

  const cafe = await upsertCafe({
    name: cafeName,
    slug: cafeSlug,
    ownerUserId: owner.id,
    phone: cafePhone,
    email: cafeEmail,
    address: cafeAddress,
  });

  await backfillCafeId(cafe.id);

  const coffee = await upsertCategory({
    name: "Coffee",
    sortOrder: 1,
    cafeId: cafe.id,
  });
  const tea = await upsertCategory({ name: "Tea", sortOrder: 2, cafeId: cafe.id });
  const pastries = await upsertCategory({
    name: "Pastries",
    sortOrder: 3,
    cafeId: cafe.id,
  });

  const espresso = await upsertMenuItem({
    name: "Espresso",
    cafeId: cafe.id,
    categoryId: coffee.id,
    price: 300,
    description: "Rich single-shot espresso.",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
    popular: true,
  });

  const latte = await upsertMenuItem({
    name: "Cafe Latte",
    cafeId: cafe.id,
    categoryId: coffee.id,
    price: 450,
    description: "Espresso with steamed milk.",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
    popular: true,
  });

  const cappuccino = await upsertMenuItem({
    name: "Cappuccino",
    cafeId: cafe.id,
    categoryId: coffee.id,
    price: 425,
    description: "Foamy espresso with milk.",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
  });

  const chai = await upsertMenuItem({
    name: "Chai Latte",
    cafeId: cafe.id,
    categoryId: tea.id,
    price: 400,
    description: "Spiced tea with steamed milk.",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
  });

  const croissant = await upsertMenuItem({
    name: "Butter Croissant",
    cafeId: cafe.id,
    categoryId: pastries.id,
    price: 350,
    description: "Flaky butter croissant.",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
  });

  const muffin = await upsertMenuItem({
    name: "Blueberry Muffin",
    cafeId: cafe.id,
    categoryId: pastries.id,
    price: 325,
    description: "Fresh baked muffin.",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
  });

  await prisma.favorite.upsert({
    where: {
      userId_cafeId_menuItemId: {
        userId: customer.id,
        cafeId: cafe.id,
        menuItemId: latte.id,
      },
    },
    update: {},
    create: { userId: customer.id, cafeId: cafe.id, menuItemId: latte.id },
  });

  await prisma.favorite.upsert({
    where: {
      userId_cafeId_menuItemId: {
        userId: customer.id,
        cafeId: cafe.id,
        menuItemId: croissant.id,
      },
    },
    update: {},
    create: { userId: customer.id, cafeId: cafe.id, menuItemId: croissant.id },
  });

  await prisma.rewardsAccount.upsert({
    where: { userId_cafeId: { userId: customer.id, cafeId: cafe.id } },
    update: {},
    create: {
      userId: customer.id,
      cafeId: cafe.id,
      pointsBalance: 0,
      level: "bronze",
    },
  });

  const welcomeTxn = await prisma.rewardTransaction.findFirst({
    where: { userId: customer.id, cafeId: cafe.id, reason: "seed:welcome" },
  });

  if (!welcomeTxn) {
    await prisma.$transaction([
      prisma.rewardTransaction.create({
        data: {
          userId: customer.id,
          cafeId: cafe.id,
          pointsDelta: 50,
          reason: "seed:welcome",
        },
      }),
      prisma.rewardsAccount.update({
        where: { userId_cafeId: { userId: customer.id, cafeId: cafe.id } },
        data: { pointsBalance: { increment: 50 } },
      }),
    ]);
  }

  const existingOrder = await prisma.order.findFirst({
    where: { userId: customer.id, cafeId: cafe.id },
  });

  if (!existingOrder) {
    const orderItems = [
      {
        cafeId: cafe.id,
        menuItemId: latte.id,
        nameSnapshot: latte.name,
        priceSnapshot: latte.price,
        quantity: 1,
      },
      {
        cafeId: cafe.id,
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
        cafeId: cafe.id,
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
    where: { guestEmail, cafeId: cafe.id },
  });

  if (!existingGuestOrder) {
    const orderItems = [
      {
        cafeId: cafe.id,
        menuItemId: espresso.id,
        nameSnapshot: espresso.name,
        priceSnapshot: espresso.price,
        quantity: 1,
      },
      {
        cafeId: cafe.id,
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
        cafeId: cafe.id,
        guestEmail,
        guestPhone: "555-0103",
        deliveryAddress: cafeAddress,
        type: "delivery",
        subtotal,
        deliveryFee: 0,
        total: subtotal,
        items: { create: orderItems },
      },
    });

    await prisma.guestOrderToken.create({
      data: {
        cafeId: cafe.id,
        orderId: guestOrder.id,
        token: crypto.randomBytes(32).toString("hex"),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Seed complete:");
  console.log(`- Owner: ${owner.email}`);
  console.log(`- Customer: ${customer.email}`);
  console.log(`- Cafe: ${cafe.name} (${cafe.slug})`);
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
