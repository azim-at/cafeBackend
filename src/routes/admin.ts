import { Router } from "express";
import {
  decideOrderHandler,
  getDashboardSummaryHandler,
  listAdminOrdersHandler,
} from "../controllers/adminController";
import { requireAuth } from "../middleware/requireAuth";
import { requireOwner } from "../middleware/requireOwner";

const router = Router({ mergeParams: true });

router.get("/dashboard/summary", requireAuth, requireOwner, getDashboardSummaryHandler);
router.get("/orders", requireAuth, requireOwner, listAdminOrdersHandler);
router.patch("/orders/:id/decision", requireAuth, requireOwner, decideOrderHandler);

export default router;
