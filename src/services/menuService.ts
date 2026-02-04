import { prisma } from "../config/prisma";
import { badRequest, conflict, notFound } from "../utils/errors";

export const listCategories = async (cafeId: string, includeItems: boolean) => {
  return prisma.menuCategory.findMany({
    where: { cafeId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: includeItems
      ? {
          items: {
            where: { isActive: true, cafeId },
            orderBy: [{ name: "asc" }],
          },
        }
      : undefined,
  });
};

export const createCategory = async ({
  cafeId,
  name,
  sortOrder,
}: {
  cafeId: string;
  name: string;
  sortOrder: number;
}) => {
  return prisma.menuCategory.create({ data: { cafeId, name, sortOrder } });
};

export const updateCategory = async ({
  cafeId,
  id,
  name,
  sortOrder,
}: {
  cafeId: string;
  id: string;
  name?: string;
  sortOrder?: number;
}) => {
  const existing = await prisma.menuCategory.findFirst({
    where: { id, cafeId },
    select: { id: true },
  });

  if (!existing) {
    throw notFound("Category not found");
  }

  return prisma.menuCategory.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
    },
  });
};

export const deleteCategory = async ({
  id,
  cafeId,
}: {
  id: string;
  cafeId: string;
}) => {
  const existing = await prisma.menuCategory.findFirst({
    where: { id, cafeId },
    select: { id: true },
  });

  if (!existing) {
    throw notFound("Category not found");
  }

  const itemsCount = await prisma.menuItem.count({
    where: { categoryId: id, cafeId },
  });

  if (itemsCount > 0) {
    throw conflict("Category still has items");
  }

  await prisma.menuCategory.delete({ where: { id } });
};

export const listItems = async ({
  cafeId,
  categoryId,
  includeInactive,
  includeCategory,
}: {
  cafeId: string;
  categoryId?: string;
  includeInactive: boolean;
  includeCategory: boolean;
}) => {
  const where = {
    cafeId,
    ...(categoryId ? { categoryId } : {}),
    ...(includeInactive ? {} : { isActive: true }),
  };

  return prisma.menuItem.findMany({
    where,
    orderBy: [{ name: "asc" }],
    include: includeCategory ? { category: true } : undefined,
  });
};

export const getItem = async ({ id, cafeId }: { id: string; cafeId: string }) => {
  const item = await prisma.menuItem.findFirst({
    where: { id, cafeId },
    include: { category: true },
  });

  if (!item) {
    throw notFound("Item not found");
  }

  return item;
};

export const createItem = async ({
  cafeId,
  name,
  description,
  categoryId,
  price,
  rating,
  popular,
  isActive,
  imageUrl,
}: {
  cafeId: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  rating?: number;
  popular: boolean;
  isActive: boolean;
  imageUrl?: string;
}) => {
  const category = await prisma.menuCategory.findFirst({
    where: { id: categoryId, cafeId },
    select: { id: true },
  });

  if (!category) {
    throw badRequest("Invalid categoryId");
  }

  return prisma.menuItem.create({
    data: {
      cafeId,
      name,
      description,
      categoryId,
      price,
      rating,
      popular,
      isActive,
      imageUrl,
    },
  });
};

export const updateItem = async ({
  cafeId,
  id,
  updates,
}: {
  cafeId: string;
  id: string;
  updates: {
    name?: string;
    description?: string;
    categoryId?: string;
    price?: number;
    rating?: number;
    popular?: boolean;
    isActive?: boolean;
    imageUrl?: string;
  };
}) => {
  const existing = await prisma.menuItem.findFirst({
    where: { id, cafeId },
    select: { id: true },
  });

  if (!existing) {
    throw notFound("Item not found");
  }

  if (updates.categoryId) {
    const category = await prisma.menuCategory.findFirst({
      where: { id: updates.categoryId, cafeId },
      select: { id: true },
    });
    if (!category) {
      throw badRequest("Invalid categoryId");
    }
  }

  return prisma.menuItem.update({
    where: { id },
    data: updates,
  });
};

export const deleteItem = async ({ id, cafeId }: { id: string; cafeId: string }) => {
  const existing = await prisma.menuItem.findFirst({
    where: { id, cafeId },
    select: { id: true },
  });

  if (!existing) {
    throw notFound("Item not found");
  }

  const orderItemsCount = await prisma.orderItem.count({
    where: { menuItemId: id, cafeId },
  });

  if (orderItemsCount > 0) {
    throw conflict("Item has order history and cannot be removed");
  }

  await prisma.favorite.deleteMany({ where: { menuItemId: id, cafeId } });
  await prisma.menuItem.delete({ where: { id } });
};
