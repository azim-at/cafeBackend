import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { badRequest } from "../utils/errors";
import { parseIntValue, parseString } from "../utils/parsers";
import { requireCafeId } from "../utils/tenancy";
import {
  decideOrder,
  getDashboardSummary,
  listAdminOrders,
} from "../services/adminService";

export const getDashboardSummaryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const cafeId = requireCafeId(req);
    const summary = await getDashboardSummary(cafeId);
    res.status(200).json(summary);
  }
);

export const listAdminOrdersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const cafeId = requireCafeId(req);
    const status = parseString(req.query.status) ?? undefined;
    const range = parseString(req.query.range) ?? undefined;
    const limitRaw = parseIntValue(req.query.limit);
    const limit = limitRaw ?? 20;

    if (limitRaw !== null && limitRaw <= 0) {
      throw badRequest("limit must be greater than 0");
    }

    const orders = await listAdminOrders({
      cafeId,
      status,
      range,
      limit,
    });

    res.status(200).json({ orders });
  }
);

export const decideOrderHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const cafeId = requireCafeId(req);
    const orderId = parseString(req.params.id);
    if (!orderId) {
      throw badRequest("Invalid order id");
    }

    const action = parseString(req.body.action);
    const reason = parseString(req.body.reason) ?? undefined;

    if (action !== "accept" && action !== "deny") {
      throw badRequest("action must be accept or deny");
    }

    const order = await decideOrder({
      cafeId,
      orderId,
      action,
      reason,
    });

    res.status(200).json({ order });
  }
);
