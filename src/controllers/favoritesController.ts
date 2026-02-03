import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { badRequest } from "../utils/errors";
import { parseString } from "../utils/parsers";
import { requireCafeId } from "../utils/tenancy";
import {
  createFavorite,
  listFavorites,
  removeFavorite,
} from "../services/favoritesService";

export const listUserFavorites = asyncHandler(
  async (req: Request, res: Response) => {
    const cafeId = requireCafeId(req);
    const favorites = await listFavorites(req.user!.id, cafeId);
    res.status(200).json({ favorites });
  }
);

export const createUserFavorite = asyncHandler(
  async (req: Request, res: Response) => {
    const cafeId = requireCafeId(req);
    const menuItemId =
      typeof req.body.menuItemId === "string"
        ? req.body.menuItemId.trim()
        : "";

    if (!menuItemId) {
      throw badRequest("menuItemId is required");
    }

    const result = await createFavorite({
      userId: req.user!.id,
      cafeId,
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
    const cafeId = requireCafeId(req);
    const menuItemId = parseString(req.params.menuItemId);
    if (!menuItemId) {
      throw badRequest("menuItemId is required");
    }
    await removeFavorite({ userId: req.user!.id, cafeId, menuItemId });
    res.status(200).json({ success: true });
  }
);
