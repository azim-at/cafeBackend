import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { badRequest, forbidden } from "../utils/errors";
import { parseIntValue, parseString } from "../utils/parsers";
import { ORDER_STATUSES_SET, ORDER_TYPES_SET } from "../constants/orders";
import {
  createGuestOrder,
  createGuestToken,
  createOrder,
  getOrder,
  getOrderByGuestToken,
  listOrders,
  updateOrderStatus,
} from "../services/ordersService";

type OrderItemInput = {
  menuItemId: string;
  quantity: number;
  notes?: string;
};

const normalizeItemsInput = (items: unknown): OrderItemInput[] | null => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const normalized: OrderItemInput[] = [];

  for (const item of items) {
    const menuItemId =
      typeof item?.menuItemId === "string" ? item.menuItemId.trim() : "";
    const quantity = parseIntValue(item?.quantity);
    const notes =
      typeof item?.notes === "string" ? item.notes.trim() : undefined;

    if (!menuItemId || quantity === null || quantity <= 0) {
      return null;
    }
    normalized.push({ menuItemId, quantity, ...(notes ? { notes } : {}) });
  }

  return normalized;
};

export const createUserOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const type = parseString(req.body.type);
    const deliveryAddress = parseString(req.body.deliveryAddress);
    const items = normalizeItemsInput(req.body.items);

    if (!type || !items) {
      throw badRequest("Type and items are required");
    }

    if (!ORDER_TYPES_SET.has(type)) {
      throw badRequest("Invalid order type");
    }

    const order = await createOrder({
      userId: req.user!.id,
      type,
      deliveryAddress,
      items,
    });

    res.status(201).json({ order });
  }
);

export const createGuestUserOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const type = parseString(req.body.type);
    const deliveryAddress = parseString(req.body.deliveryAddress);
    const guestEmail = parseString(req.body.guestEmail);
    const guestPhone = parseString(req.body.guestPhone);
    const items = normalizeItemsInput(req.body.items);
    

    if (!type || !items) {
      throw badRequest("Type and items are required");
    }

    if (!ORDER_TYPES_SET.has(type)) {
      throw badRequest("Invalid order type");
    }

    const result = await createGuestOrder({
      type,
      deliveryAddress,
      guestEmail,
      guestPhone,
      items,
    });

    res.status(201).json(result);
  }
);

export const listUserOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const status = parseString(req.query.status) ?? undefined;
    const userIdQuery = parseString(req.query.userId) ?? undefined;

    if (status && !ORDER_STATUSES_SET.has(status)) {
      throw badRequest("Invalid status");
    }

    const orders = await listOrders({
      userId: req.user!.id,
      role: req.user?.role,
      status,
      userIdQuery,
    });

    res.status(200).json({ orders });
  }
);

export const getUserOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const id = parseString(req.params.id);
    if (!id) {
      throw badRequest("Invalid order id");
    }
    const order = await getOrder({
      id,
      userId: req.user!.id,
      role: req.user?.role,
    });

    res.status(200).json({ order });
  }
);

export const updateOrderStatusHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (req.user?.role !== "owner") {
      throw forbidden("Forbidden");
    }

    const id = parseString(req.params.id);
    if (!id) {
      throw badRequest("Invalid order id");
    }
    const status = parseString(req.body.status);
    const estimatedReadyAtRaw = req.body.estimatedReadyAt;
    const estimatedReadyAt =
      estimatedReadyAtRaw !== undefined && estimatedReadyAtRaw !== null
        ? new Date(estimatedReadyAtRaw)
        : undefined;
    const cancelledReason = parseString(req.body.cancelledReason) ?? undefined;
    const deliveryFee = parseIntValue(req.body.deliveryFee);

    if (!status) {
      throw badRequest("Status is required");
    }

    if (!ORDER_STATUSES_SET.has(status)) {
      throw badRequest("Invalid status");
    }

    if (estimatedReadyAt && Number.isNaN(estimatedReadyAt.getTime())) {
      throw badRequest("Invalid estimatedReadyAt");
    }

    const order = await updateOrderStatus({
      id,
      status,
      estimatedReadyAt,
      cancelledReason,
      deliveryFee,
      role: req.user?.role,
    });

    res.status(200).json({ order });
  }
);

export const createGuestTokenHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const id = parseString(req.params.id);
    if (!id) {
      throw badRequest("Invalid order id");
    }
    const expiresInHours = parseIntValue(req.body.expiresInHours) ?? 24;

    const result = await createGuestToken({
      id,
      userId: req.user!.id,
      role: req.user?.role,
      expiresInHours,
    });

    res.status(200).json(result);
  }
);

export const getGuestOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const token = parseString(req.params.token);
    if (!token) {
      throw badRequest("Invalid token");
    }
    const order = await getOrderByGuestToken(token);
    res.status(200).json({ order });
  }
);
