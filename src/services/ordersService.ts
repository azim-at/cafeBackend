import crypto from "crypto";
import { prisma } from "../config/prisma";
import { ORDER_STATUSES_SET, ORDER_TYPES_SET } from "../constants/orders";
import { badRequest, forbidden, notFound, unauthorized } from "../utils/errors";

type OrderItemInput = {
  menuItemId: string;
  quantity: number;
  notes?: string;
};

const buildOrderItems = async (cafeId: string, items: OrderItemInput[]) => {
  if (!items.length) {
    throw badRequest("Type and items are required");
  }

  const menuItemIds = items.map((item) => item.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds }, isActive: true, cafeId },
    select: { id: true, name: true, price: true },
  });

  const menuItemMap = new Map(menuItems.map((item) => [item.id, item]));
  if (menuItems.length !== menuItemIds.length) {
    throw badRequest("Invalid menu items");
  }

  const orderItemsData = items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId);
    if (!menuItem) {
      throw badRequest("Invalid menu items");
    }
    return {
      cafeId,
      menuItemId: item.menuItemId,
      nameSnapshot: menuItem.name,
      priceSnapshot: menuItem.price,
      quantity: item.quantity,
      notes: item.notes,
    };
  });

  const subtotal = orderItemsData.reduce(
    (sum, item) => sum + item.priceSnapshot * item.quantity,
    0
  );

  return { orderItemsData, subtotal };
};

export const createOrder = async ({
  cafeId,
  userId,
  type,
  deliveryAddress,
  items,
}: {
  cafeId: string;
  userId: string;
  type: string;
  deliveryAddress?: string | null;
  items: OrderItemInput[];
}) => {
  if (!ORDER_TYPES_SET.has(type)) {
    throw badRequest("Invalid order type");
  }

  if (type === "delivery" && !deliveryAddress) {
    throw badRequest("Delivery address is required");
  }

  const { orderItemsData, subtotal } = await buildOrderItems(cafeId, items);
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  return prisma.order.create({
    data: {
      cafeId,
      userId,
      type: type as any,
      deliveryAddress: deliveryAddress ?? undefined,
      subtotal,
      deliveryFee,
      total,
      items: { create: orderItemsData },
    },
    include: { items: true },
  });
};

export const createGuestOrder = async ({
  cafeId,
  type,
  deliveryAddress,
  guestEmail,
  guestPhone,
  items,
}: {
  cafeId: string;
  type: string;
  deliveryAddress?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  items: OrderItemInput[];
}) => {
  if (!ORDER_TYPES_SET.has(type)) {
    throw badRequest("Invalid order type");
  }

  if (!guestEmail && !guestPhone) {
    throw badRequest("Guest email or phone is required");
  }

  if (type === "delivery" && !deliveryAddress) {
    throw badRequest("Delivery address is required");
  }

  const { orderItemsData, subtotal } = await buildOrderItems(cafeId, items);
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const order = await prisma.order.create({
    data: {
      cafeId,
      type: type as any,
      guestEmail: guestEmail ?? undefined,
      guestPhone: guestPhone ?? undefined,
      deliveryAddress: deliveryAddress ?? undefined,
      subtotal,
      deliveryFee,
      total,
      items: { create: orderItemsData },
    },
    include: { items: true },
  });

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.guestOrderToken.create({
    data: { cafeId, orderId: order.id, token, expiresAt },
  });

  return { order, token, expiresAt };
};

export const listOrders = async ({
  cafeId,
  userId,
  role,
  status,
  userIdQuery,
}: {
  cafeId: string;
  userId: string;
  role?: "owner" | "customer" | null;
  status?: string;
  userIdQuery?: string;
}) => {
  if (status && !ORDER_STATUSES_SET.has(status)) {
    throw badRequest("Invalid status");
  }

  const where =
    role === "owner"
      ? {
          cafeId,
          ...(status ? { status: status as any } : {}),
          ...(userIdQuery ? { userId: userIdQuery } : {}),
        }
      : {
          cafeId,
          userId,
          ...(status ? { status: status as any } : {}),
        };

  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
};

export const getOrder = async ({
  cafeId,
  id,
  userId,
  role,
}: {
  cafeId: string;
  id: string;
  userId: string;
  role?: "owner" | "customer" | null;
}) => {
  const order = await prisma.order.findFirst({
    where: { id, cafeId },
    include: { items: true },
  });

  if (!order) {
    throw notFound("Order not found");
  }

  if (role !== "owner" && order.userId !== userId) {
    throw forbidden("Forbidden");
  }

  return order;
};

export const updateOrderStatus = async ({
  cafeId,
  id,
  status,
  estimatedReadyAt,
  cancelledReason,
  deliveryFee,
  role,
}: {
  cafeId: string;
  id: string;
  status: string;
  estimatedReadyAt?: Date;
  cancelledReason?: string;
  deliveryFee?: number | null;
  role?: "owner" | "customer" | null;
}) => {
  if (role !== "owner") {
    throw forbidden("Forbidden");
  }

  if (!ORDER_STATUSES_SET.has(status)) {
    throw badRequest("Invalid status");
  }

  const existing = await prisma.order.findFirst({ where: { id, cafeId } });
  if (!existing) {
    throw notFound("Order not found");
  }

  const total =
    deliveryFee !== null && deliveryFee !== undefined
      ? existing.subtotal + deliveryFee
      : undefined;

  return prisma.order.update({
    where: { id },
    data: {
      status: status as any,
      estimatedReadyAt,
      cancelledReason,
      ...(deliveryFee !== null && deliveryFee !== undefined
        ? { deliveryFee, total }
        : {}),
    },
  });
};

export const createGuestToken = async ({
  cafeId,
  id,
  userId,
  role,
  expiresInHours,
}: {
  cafeId: string;
  id: string;
  userId: string;
  role?: "owner" | "customer" | null;
  expiresInHours: number;
}) => {
  const order = await prisma.order.findFirst({ where: { id, cafeId } });

  if (!order) {
    throw notFound("Order not found");
  }

  if (role !== "owner" && order.userId !== userId) {
    throw forbidden("Forbidden");
  }

  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  const token = crypto.randomBytes(32).toString("hex");

  const guestToken = await prisma.guestOrderToken.upsert({
    where: { orderId: id },
    update: { token, expiresAt, cafeId },
    create: { orderId: id, token, expiresAt, cafeId },
  });

  return { token: guestToken.token, expiresAt };
};

export const getOrderByGuestToken = async (cafeId: string, token: string) => {
  const guestToken = await prisma.guestOrderToken.findFirst({
    where: { token, cafeId },
    include: { order: { include: { items: true } } },
  });

  if (!guestToken) {
    throw notFound("Token not found");
  }

  if (guestToken.expiresAt.getTime() < Date.now()) {
    throw unauthorized("Token expired");
  }

  return guestToken.order;
};
