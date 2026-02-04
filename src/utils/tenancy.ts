import type { Request } from "express";
import { badRequest, forbidden } from "./errors";

export const requireCafeId = (req: Request): string => {
  const cafeId = req.cafeId;
  if (!cafeId) {
    throw badRequest("Cafe context missing");
  }
  return cafeId;
};

export const isCafeOwner = (req: Request): boolean => {
  return Boolean(
    req.user &&
      req.user.role === "owner" &&
      req.cafe &&
      req.cafe.ownerUserId === req.user.id
  );
};

export const requireCafeOwner = (req: Request): void => {
  if (!isCafeOwner(req)) {
    throw forbidden("Forbidden");
  }
};

export const getCafeScopedRole = (
  req: Request
): "owner" | "customer" | null => {
  if (!req.user?.role) {
    return null;
  }

  if (req.user.role === "owner") {
    return isCafeOwner(req) ? "owner" : "customer";
  }

  return req.user.role;
};
