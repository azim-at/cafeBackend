import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { badRequest } from "../utils/errors";
import {
  createFavorite,
  listFavorites,
  removeFavorite,
} from "../services/favoritesService";

export const listUserFavorites = asyncHandler(
  async (req: Request, res: Response) => {
    const favorites = await listFavorites(req.user!.id);
    res.status(200).json({ favorites });
  }
);

export const createUserFavorite = asyncHandler(
  async (req: Request, res: Response) => {
    const menuItemId =
      typeof req.body.menuItemId === "string"
        ? req.body.menuItemId.trim()
        : "";

    if (!menuItemId) {
      throw badRequest("menuItemId is required");
    }

    const result = await createFavorite({
      userId: req.user!.id,
      menuItemId,
    });

    if (!result.created) {
      res.status(200).json({ message: "Already favorited" });
      return;
    }

    res.status(201).json({ favorite: result.favorite });
  }
);

export const deleteUserFavorite = asyncHandler(
  async (req: Request, res: Response) => {
    const { menuItemId } = req.params;
    await removeFavorite({ userId: req.user!.id, menuItemId });
    res.status(200).json({ success: true });
  }
);
