import { Router } from "express";
import {
  createUserFavorite,
  deleteUserFavorite,
  listUserFavorites,
} from "../controllers/favoritesController";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, listUserFavorites);
router.post("/", requireAuth, createUserFavorite);
router.delete("/:menuItemId", requireAuth, deleteUserFavorite);

export default router;
