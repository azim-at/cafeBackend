import { prisma } from "../config/prisma";
import { badRequest } from "../utils/errors";

export const listFavorites = async (userId: string, cafeId: string) => {
  return prisma.favorite.findMany({
    where: { userId, cafeId },
    include: { menuItem: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const createFavorite = async ({
  userId,
  cafeId,
  menuItemId,
}: {
  userId: string;
  cafeId: string;
  menuItemId: string;
}) => {
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuItemId, cafeId },
    select: { id: true },
  });

  if (!menuItem) {
    throw badRequest("Invalid menuItemId");
  }

  try {
    const favorite = await prisma.favorite.create({
      data: { userId, cafeId, menuItemId },
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
  cafeId,
  menuItemId,
}: {
  userId: string;
  cafeId: string;
  menuItemId: string;
}) => {
  try {
    await prisma.favorite.delete({
      where: {
        userId_cafeId_menuItemId: { userId, cafeId, menuItemId },
      },
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return;
    }
    throw error;
  }
};
