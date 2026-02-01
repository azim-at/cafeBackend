import jwt, { type SignOptions } from "jsonwebtoken";
import type { AuthUser } from "./types/auth";

type JwtPayload = {
  sub: string;
  email: string;
  name?: string | null;
  role?: "owner" | "customer" | null;
};

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
};

const getJwtExpiresIn = (): SignOptions["expiresIn"] => {
  const value = process.env.JWT_EXPIRES_IN;
  return (value ?? "7d") as SignOptions["expiresIn"];
};

export const signAuthToken = (user: AuthUser): string => {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role ?? null,
  };

  return jwt.sign(payload, getJwtSecret(), { expiresIn: getJwtExpiresIn() });
};

export const verifyAuthToken = (token: string): AuthUser => {
  const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name ?? null,
    role: payload.role ?? null,
  };
};
