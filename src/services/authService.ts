import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import { signAuthToken } from "../jwt";
import type { AuthSession, AuthUser } from "../types/auth";
import { conflict, unauthorized } from "../utils/errors";

const SALT_ROUNDS = 12;

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

export const registerUser = async ({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string | null;
}): Promise<AuthSession> => {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw conflict("Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
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

  return { user, token };
};

export const loginUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthSession> => {
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
    throw unauthorized("Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, userRecord.passwordHash);
  if (!isValid) {
    throw unauthorized("Invalid credentials");
  }

  const user = toAuthUser(userRecord);
  const token = signAuthToken(user);

  return { user, token };
};
