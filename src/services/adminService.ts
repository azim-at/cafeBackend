import { prisma } from "../config/prisma";
import { ORDER_STATUSES_SET } from "../constants/orders";
import { badRequest, notFound } from "../utils/errors";

const ACTIVE_STATUSES = ["new", "preparing", "ready", "out_for_delivery"] as const;
const RANGE_VALUES = new Set(["today", "yesterday"]);

const getDayStart = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const buildRangeFilter = (range?: string) => {
  if (!range) return undefined;
  const parts = range
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return undefined;

  for (const part of parts) {
    if (!RANGE_VALUES.has(part)) {
      throw badRequest("Invalid range");
    }
  }

  const now = new Date();
  const startToday = getDayStart(now);
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);

  const includesToday = parts.includes("today");
  const includesYesterday = parts.includes("yesterday");

  if (includesToday && includesYesterday) {
    return { gte: startYesterday, lt: now };
  }

  if (includesYesterday) {
    return { gte: startYesterday, lt: startToday };
  }

  return { gte: startToday, lt: now };
};

const buildStatusFilter = (status?: string) => {
  if (!status) return undefined;

  if (status === "active") {
    return { in: [...ACTIVE_STATUSES] };
  }

  if (!ORDER_STATUSES_SET.has(status)) {
    throw badRequest("Invalid status");
  }

  return status as any;
};

export const getDashboardSummary = async (cafeId: string) => {
  const now = new Date();
  const startToday = getDayStart(now);

  const [activeOrdersCount, todayOrders] = await Promise.all([
    prisma.order.count({
      where: { cafeId, status: { in: [...ACTIVE_STATUSES] } },
    }),
    prisma.order.findMany({
      where: {
        cafeId,
        createdAt: { gte: startToday, lt: now },
        status: { not: "cancelled" },
      },
      include: { items: true },
    }),
  ]);

  const todayOrdersCount = todayOrders.length;
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = todayOrdersCount
    ? Math.round(todayRevenue / todayOrdersCount)
    : 0;

  const itemTotals = new Map<
    string,
    { menuItemId: string; name: string; quantity: number }
  >();

  for (const order of todayOrders) {
    for (const item of order.items) {
      const existing = itemTotals.get(item.menuItemId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemTotals.set(item.menuItemId, {
          menuItemId: item.menuItemId,
          name: item.nameSnapshot,
          quantity: item.quantity,
        });
      }
    }
  }

  let topItem: { menuItemId: string; name: string; quantity: number } | null =
    null;
  for (const item of itemTotals.values()) {
    if (!topItem || item.quantity > topItem.quantity) {
      topItem = item;
    }
  }

  return {
    todayRevenue,
    todayOrders: todayOrdersCount,
    activeOrders: activeOrdersCount,
    avgOrderValue,
    topItem,
  };
};

export const listAdminOrders = async ({
  cafeId,
  status,
  range,
  limit,
}: {
  cafeId: string;
  status?: string;
  range?: string;
  limit?: number;
}) => {
  const safeLimit = Math.min(Math.max(limit ?? 20, 1), 100);
  const statusFilter = buildStatusFilter(status);
  const rangeFilter = buildRangeFilter(range);

  return prisma.order.findMany({
    where: {
      cafeId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(rangeFilter ? { createdAt: rangeFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: safeLimit,
    include: { items: true, user: true },
  });
};

export const decideOrder = async ({
  cafeId,
  orderId,
  action,
  reason,
}: {
  cafeId: string;
  orderId: string;
  action: "accept" | "deny";
  reason?: string;
}) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, cafeId },
  });

  if (!order) {
    throw notFound("Order not found");
  }

  if (order.status !== "new") {
    throw badRequest("Only new orders can be accepted or denied");
  }

  if (action === "accept") {
    return prisma.order.update({
      where: { id: orderId },
      data: { status: "preparing" },
    });
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: "cancelled",
      cancelledReason: reason?.trim() || "Denied by owner",
    },
  });
};
