import { Router } from "express";
import {
  createMenuCategory,
  createMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  getMenuItem,
  listMenuCategories,
  listMenuItems,
  updateMenuCategory,
  updateMenuItem,
} from "../controllers/menuController";
import { requireAuth } from "../middleware/requireAuth";
import { requireOwner } from "../middleware/requireOwner";

const router = Router();

router.get("/categories", listMenuCategories);
router.post("/categories", requireAuth, requireOwner, createMenuCategory);
router.put("/categories/:id", requireAuth, requireOwner, updateMenuCategory);
router.delete("/categories/:id", requireAuth, requireOwner, deleteMenuCategory);

router.get("/items", listMenuItems);
router.get("/items/:id", getMenuItem);
router.post("/items", requireAuth, requireOwner, createMenuItem);
router.put("/items/:id", requireAuth, requireOwner, updateMenuItem);
router.delete("/items/:id", requireAuth, requireOwner, deleteMenuItem);

export default router;
