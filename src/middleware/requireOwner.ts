import type { Request, Response, NextFunction } from "express";
import { isCafeOwner } from "../utils/tenancy";

export const requireOwner = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!isCafeOwner(req)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  next();
};
