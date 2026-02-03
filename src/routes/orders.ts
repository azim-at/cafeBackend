import { Router } from "express";
import {
  createGuestTokenHandler,
  createGuestUserOrder,
  createUserOrder,
  getGuestOrder,
  getUserOrder,
  listUserOrders,
  updateOrderStatusHandler,
} from "../controllers/ordersController";
import { requireAuth } from "../middleware/requireAuth";

const router = Router({ mergeParams: true });

router.post("/", requireAuth, createUserOrder);
router.post("/guest", createGuestUserOrder);
router.get("/", requireAuth, listUserOrders);
router.get("/guest/:token", getGuestOrder);
router.get("/:id", requireAuth, getUserOrder);
router.patch("/:id/status", requireAuth, updateOrderStatusHandler);
router.post("/:id/guest-token", requireAuth, createGuestTokenHandler);

export default router;
