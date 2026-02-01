import type { Request, Response, NextFunction } from "express";

export const requireOwner = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== "owner") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  next();
};
