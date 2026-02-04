import { prisma } from "../config/prisma";
import { forbidden, notFound } from "../utils/errors";

export const getRewardsAccount = async (userId: string, cafeId: string) => {
  return prisma.rewardsAccount.upsert({
    where: { userId_cafeId: { userId, cafeId } },
    update: {},
    create: { userId, cafeId },
  });
};

export const listRewardTransactions = async ({
  cafeId,
  userId,
  role,
  queryUserId,
}: {
  cafeId: string;
  userId: string;
  role?: "owner" | "customer" | null;
  queryUserId?: string;
}) => {
  const effectiveUserId = role === "owner" && queryUserId ? queryUserId : userId;

  return prisma.rewardTransaction.findMany({
    where: { userId: effectiveUserId, cafeId },
    orderBy: { createdAt: "desc" },
  });
};

export const createRewardTransaction = async ({
  actorRole,
  userId,
  cafeId,
  pointsDelta,
  reason,
  orderId,
}: {
  actorRole?: "owner" | "customer" | null;
  userId: string;
  cafeId: string;
  pointsDelta: number;
  reason: string;
  orderId?: string;
}) => {
  if (actorRole !== "owner") {
    throw forbidden("Forbidden");
  }

  if (orderId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, cafeId },
      select: { id: true },
    });
    if (!order) {
      throw notFound("Order not found");
    }
  }

  const [transaction, account] = await prisma.$transaction([
    prisma.rewardTransaction.create({
      data: { userId, cafeId, pointsDelta, reason, orderId },
    }),
    prisma.rewardsAccount.upsert({
      where: { userId_cafeId: { userId, cafeId } },
      update: { pointsBalance: { increment: pointsDelta } },
      create: { userId, cafeId, pointsBalance: pointsDelta },
    }),
  ]);

  return { transaction, account };
};
