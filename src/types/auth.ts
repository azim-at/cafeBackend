export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: "owner" | "customer" | null;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};
