import { prisma } from "../config/prisma";
import { forbidden } from "../utils/errors";

export const getRewardsAccount = async (userId: string) => {
  return prisma.rewardsAccount.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
};

export const listRewardTransactions = async ({
  userId,
  role,
  queryUserId,
}: {
  userId: string;
  role?: "owner" | "customer" | null;
  queryUserId?: string;
}) => {
  const effectiveUserId = role === "owner" && queryUserId ? queryUserId : userId;

  return prisma.rewardTransaction.findMany({
    where: { userId: effectiveUserId },
    orderBy: { createdAt: "desc" },
  });
};

export const createRewardTransaction = async ({
  actorRole,
  userId,
  pointsDelta,
  reason,
  orderId,
}: {
  actorRole?: "owner" | "customer" | null;
  userId: string;
  pointsDelta: number;
  reason: string;
  orderId?: string;
}) => {
  if (actorRole !== "owner") {
    throw forbidden("Forbidden");
  }

  const [transaction, account] = await prisma.$transaction([
    prisma.rewardTransaction.create({
      data: { userId, pointsDelta, reason, orderId },
    }),
    prisma.rewardsAccount.upsert({
      where: { userId },
      update: { pointsBalance: { increment: pointsDelta } },
      create: { userId, pointsBalance: pointsDelta },
    }),
  ]);

  return { transaction, account };
};
