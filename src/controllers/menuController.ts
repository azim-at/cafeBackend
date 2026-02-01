import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { badRequest } from "../utils/errors";
import { parseBoolean, parseIntValue } from "../utils/parsers";
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  getItem,
  listCategories,
  listItems,
  updateCategory,
  updateItem,
} from "../services/menuService";

export const listMenuCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const includeItems = parseBoolean(req.query.includeItems) ?? false;
    const categories = await listCategories(includeItems);
    res.status(200).json({ categories });
  }
);

export const createMenuCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";
    const sortOrderInput = req.body.sortOrder;
    const sortOrderParsed = parseIntValue(sortOrderInput);
    const sortOrder = sortOrderParsed ?? 0;

    if (sortOrderInput !== undefined && sortOrderParsed === null) {
      throw badRequest("sortOrder must be an integer");
    }

    if (!name) {
      throw badRequest("Name is required");
    }

    const category = await createCategory({ name, sortOrder });
    res.status(201).json({ category });
  }
);

export const updateMenuCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : undefined;
    const sortOrderInput = req.body.sortOrder;
    const sortOrder = parseIntValue(sortOrderInput);

    if (sortOrderInput !== undefined && sortOrder === null) {
      throw badRequest("sortOrder must be an integer");
    }

    if (name === undefined && sortOrder === null) {
      throw badRequest("No fields to update");
    }

    const category = await updateCategory({
      id,
      ...(name !== undefined ? { name } : {}),
      ...(sortOrder !== null ? { sortOrder } : {}),
    });

    res.status(200).json({ category });
  }
);

export const deleteMenuCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteCategory(id);
    res.status(200).json({ success: true });
  }
);

export const listMenuItems = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId =
      typeof req.query.categoryId === "string"
        ? req.query.categoryId.trim()
        : undefined;
    const includeInactive = parseBoolean(req.query.includeInactive) ?? false;
    const includeCategory = parseBoolean(req.query.includeCategory) ?? false;

    const items = await listItems({
      categoryId,
      includeInactive,
      includeCategory,
    });

    res.status(200).json({ items });
  }
);

export const getMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const item = await getItem(id);
    res.status(200).json({ item });
  }
);

export const createMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";
    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : undefined;
    const categoryId =
      typeof req.body.categoryId === "string"
        ? req.body.categoryId.trim()
        : "";
    const priceInput = req.body.price;
    const price = parseIntValue(priceInput);
    if (priceInput !== undefined && price === null) {
      throw badRequest("Price must be an integer");
    }
    const rating = typeof req.body.rating === "number" ? req.body.rating : null;
    const popular = parseBoolean(req.body.popular) ?? false;
    const isActive = parseBoolean(req.body.isActive) ?? true;
    const imageUrl =
      typeof req.body.imageUrl === "string" ? req.body.imageUrl.trim() : null;

    if (!name || !categoryId || price === null) {
      throw badRequest("Name, categoryId, and price are required");
    }

    if (price < 0) {
      throw badRequest("Price must be non-negative");
    }

    const item = await createItem({
      name,
      description,
      categoryId,
      price,
      rating: rating ?? undefined,
      popular,
      isActive,
      imageUrl: imageUrl ?? undefined,
    });

    res.status(201).json({ item });
  }
);

export const updateMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates: Record<string, unknown> = {};

    if (typeof req.body.name === "string") {
      const name = req.body.name.trim();
      if (!name) {
        throw badRequest("Name cannot be empty");
      }
      updates.name = name;
    }

    if (typeof req.body.description === "string") {
      updates.description = req.body.description.trim();
    }

    if (typeof req.body.categoryId === "string") {
      const categoryId = req.body.categoryId.trim();
      if (!categoryId) {
        throw badRequest("categoryId cannot be empty");
      }
      updates.categoryId = categoryId;
    }

    const priceInput = req.body.price;
    const price = parseIntValue(priceInput);
    if (priceInput !== undefined && price === null) {
      throw badRequest("Price must be an integer");
    }
    if (price !== null) {
      if (price < 0) {
        throw badRequest("Price must be non-negative");
      }
      updates.price = price;
    }

    if (typeof req.body.rating === "number") {
      updates.rating = req.body.rating;
    }

    const popular = parseBoolean(req.body.popular);
    if (popular !== null) {
      updates.popular = popular;
    }

    const isActive = parseBoolean(req.body.isActive);
    if (isActive !== null) {
      updates.isActive = isActive;
    }

    if (typeof req.body.imageUrl === "string") {
      updates.imageUrl = req.body.imageUrl.trim();
    }

    if (Object.keys(updates).length === 0) {
      throw badRequest("No fields to update");
    }

    const item = await updateItem({
      id,
      updates: updates as {
        name?: string;
        description?: string;
        categoryId?: string;
        price?: number;
        rating?: number;
        popular?: boolean;
        isActive?: boolean;
        imageUrl?: string;
      },
    });

    res.status(200).json({ item });
  }
);

export const deleteMenuItem = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    await deleteItem(id);
    res.status(200).json({ success: true });
  }
);
