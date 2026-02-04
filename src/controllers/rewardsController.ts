import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { badRequest, forbidden } from "../utils/errors";
import { parseIntValue, parseString } from "../utils/parsers";
import { getCafeScopedRole, requireCafeId } from "../utils/tenancy";
import {
  createRewardTransaction,
  getRewardsAccount,
  listRewardTransactions,
} from "../services/rewardsService";

export const getAccount = asyncHandler(async (req: Request, res: Response) => {
  const cafeId = requireCafeId(req);
  const account = await getRewardsAccount(req.user!.id, cafeId);
  res.status(200).json({ account });
});

export const listTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const cafeId = requireCafeId(req);
    const queryUserId =
      typeof req.query.userId === "string" ? req.query.userId : undefined;
    const role = getCafeScopedRole(req);
    const transactions = await listRewardTransactions({
      cafeId,
      userId: req.user!.id,
      role,
      queryUserId,
    });
    res.status(200).json({ transactions });
  }
);

export const createTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const cafeId = requireCafeId(req);
    const userId = parseString(req.body.userId);
    const pointsDelta = parseIntValue(req.body.pointsDelta);
    const reason = parseString(req.body.reason);
    const orderId = parseString(req.body.orderId);
    const role = getCafeScopedRole(req);

    if (!userId || pointsDelta === null || !reason) {
      throw badRequest("userId, pointsDelta, and reason are required");
    }

    if (role !== "owner") {
      throw forbidden("Forbidden");
    }

    const result = await createRewardTransaction({
      actorRole: role,
      userId,
      cafeId,
      pointsDelta,
      reason,
      orderId: orderId ?? undefined,
    });

    res.status(201).json(result);
  }
);
