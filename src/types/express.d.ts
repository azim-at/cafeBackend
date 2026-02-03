import type { Cafe } from "@prisma/client";
import type { AuthUser } from "./auth";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      cafe?: Cafe;
      cafeId?: string;
    }
  }
}

export {};
