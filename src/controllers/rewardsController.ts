import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { badRequest } from "../utils/errors";
import { parseIntValue, parseString } from "../utils/parsers";
import {
  createRewardTransaction,
  getRewardsAccount,
  listRewardTransactions,
} from "../services/rewardsService";

export const getAccount = asyncHandler(async (req: Request, res: Response) => {
  const account = await getRewardsAccount(req.user!.id);
  res.status(200).json({ account });
});

export const listTransactions = asyncHandler(
  async (req: Request, res: Response) => {
    const queryUserId =
      typeof req.query.userId === "string" ? req.query.userId : undefined;
    const transactions = await listRewardTransactions({
      userId: req.user!.id,
      role: req.user?.role,
      queryUserId,
    });
    res.status(200).json({ transactions });
  }
);

export const createTransaction = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = parseString(req.body.userId);
    const pointsDelta = parseIntValue(req.body.pointsDelta);
    const reason = parseString(req.body.reason);
    const orderId = parseString(req.body.orderId);

    if (!userId || pointsDelta === null || !reason) {
      throw badRequest("userId, pointsDelta, and reason are required");
    }

    const result = await createRewardTransaction({
      actorRole: req.user?.role,
      userId,
      pointsDelta,
      reason,
      orderId: orderId ?? undefined,
    });

    res.status(201).json(result);
  }
);
