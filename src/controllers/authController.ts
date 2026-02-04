import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { badRequest } from "../utils/errors";
import { loginUser, registerUser } from "../services/authService";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const name =
    typeof req.body.name === "string" ? req.body.name.trim() : null;
  const phone =
    typeof req.body.phone === "string" ? req.body.phone.trim() : "";

  if (!email || !password || !phone) {
    throw badRequest("Email, password, and phone are required");
  }

  if (password.length < 8) {
    throw badRequest("Password must be at least 8 characters");
  }

  const session = await registerUser({ email, password, name, phone });
  res.status(201).json(session);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !password) {
    throw badRequest("Email and password are required");
  }

  const session = await loginUser({ email, password });
  res.status(200).json(session);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ success: true });
});
