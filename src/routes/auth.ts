import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { signAuthToken } from "../jwt";
import type { AuthSession, AuthUser } from "../types/auth";

const router = Router();

const toAuthUser = (user: {
  id: string;
  email: string;
  name?: string | null;
  role?: "owner" | "customer" | null;
}): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name ?? null,
  role: user.role ?? null,
});

router.post("/register", async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : null;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters" });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "customer",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    const user = toAuthUser(created);
    const token = signAuthToken(user);
    const session: AuthSession = { user, token };

    res.status(201).json(session);
  } catch (error) {
    console.error("Register failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const userRecord = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!userRecord || !userRecord.passwordHash) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isValid = await bcrypt.compare(password, userRecord.passwordHash);
    if (!isValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const user = toAuthUser(userRecord);
    const token = signAuthToken(user);
    const session: AuthSession = { user, token };

    res.status(200).json(session);
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/logout", (_req, res) => {
  res.status(200).json({ success: true });
});

export default router;
