import { prisma } from "../config/prisma";
import { badRequest } from "../utils/errors";

export const listFavorites = async (userId: string) => {
  return prisma.favorite.findMany({
    where: { userId },
    include: { menuItem: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const createFavorite = async ({
  userId,
  menuItemId,
}: {
  userId: string;
  menuItemId: string;
}) => {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    select: { id: true },
  });

  if (!menuItem) {
    throw badRequest("Invalid menuItemId");
  }

  try {
    const favorite = await prisma.favorite.create({
      data: { userId, menuItemId },
    });
    return { favorite, created: true };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { favorite: null, created: false };
    }
    throw error;
  }
};

export const removeFavorite = async ({
  userId,
  menuItemId,
}: {
  userId: string;
  menuItemId: string;
}) => {
  try {
    await prisma.favorite.delete({
      where: {
        userId_menuItemId: { userId, menuItemId },
      },
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return;
    }
    throw error;
  }
};
