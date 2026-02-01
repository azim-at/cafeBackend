export const ORDER_TYPES = ["dine_in", "takeaway", "delivery"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = [
  "new",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TYPES_SET = new Set<string>(ORDER_TYPES);
export const ORDER_STATUSES_SET = new Set<string>(ORDER_STATUSES);
