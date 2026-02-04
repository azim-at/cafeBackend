import { Router } from "express";
import {
  createTransaction,
  getAccount,
  listTransactions,
  
} from "../controllers/rewardsController";
import { requireAuth } from "../middleware/requireAuth";

const router = Router({ mergeParams: true });

router.get("/account", requireAuth, getAccount);
router.get("/transactions", requireAuth, listTransactions);
router.post("/transactions", requireAuth, createTransaction);

export default router;
