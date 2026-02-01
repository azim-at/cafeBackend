import { prisma } from "../config/prisma";
import { badRequest, conflict, notFound } from "../utils/errors";

export const listCategories = async (includeItems: boolean) => {
  return prisma.menuCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: includeItems
      ? {
          items: {
            where: { isActive: true },
            orderBy: [{ name: "asc" }],
          },
        }
      : undefined,
  });
};

export const createCategory = async ({
  name,
  sortOrder,
}: {
  name: string;
  sortOrder: number;
}) => {
  return prisma.menuCategory.create({ data: { name, sortOrder } });
};

export const updateCategory = async ({
  id,
  name,
  sortOrder,
}: {
  id: string;
  name?: string;
  sortOrder?: number;
}) => {
  const existing = await prisma.menuCategory.findUnique({
    where: { id },
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

export const deleteCategory = async (id: string) => {
  const existing = await prisma.menuCategory.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw notFound("Category not found");
  }

  const itemsCount = await prisma.menuItem.count({
    where: { categoryId: id },
  });

  if (itemsCount > 0) {
    throw conflict("Category still has items");
  }

  await prisma.menuCategory.delete({ where: { id } });
};

export const listItems = async ({
  categoryId,
  includeInactive,
  includeCategory,
}: {
  categoryId?: string;
  includeInactive: boolean;
  includeCategory: boolean;
}) => {
  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(includeInactive ? {} : { isActive: true }),
  };

  return prisma.menuItem.findMany({
    where,
    orderBy: [{ name: "asc" }],
    include: includeCategory ? { category: true } : undefined,
  });
};

export const getItem = async (id: string) => {
  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!item) {
    throw notFound("Item not found");
  }

  return item;
};

export const createItem = async ({
  name,
  description,
  categoryId,
  price,
  rating,
  popular,
  isActive,
  imageUrl,
}: {
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  rating?: number;
  popular: boolean;
  isActive: boolean;
  imageUrl?: string;
}) => {
  const category = await prisma.menuCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw badRequest("Invalid categoryId");
  }

  return prisma.menuItem.create({
    data: {
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
  id,
  updates,
}: {
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
  const existing = await prisma.menuItem.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw notFound("Item not found");
  }

  if (updates.categoryId) {
    const category = await prisma.menuCategory.findUnique({
      where: { id: updates.categoryId },
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

export const deleteItem = async (id: string) => {
  const existing = await prisma.menuItem.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw notFound("Item not found");
  }

  const orderItemsCount = await prisma.orderItem.count({
    where: { menuItemId: id },
  });

  if (orderItemsCount > 0) {
    throw conflict("Item has order history and cannot be removed");
  }

  await prisma.favorite.deleteMany({ where: { menuItemId: id } });
  await prisma.menuItem.delete({ where: { id } });
};
