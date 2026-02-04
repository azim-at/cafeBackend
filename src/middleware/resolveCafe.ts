import type { RequestHandler } from "express";
import { prisma } from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { badRequest, forbidden, notFound } from "../utils/errors";

export const resolveCafe: RequestHandler = asyncHandler(async (req, _res, next) => {
  const cafeSlug = req.params.cafeSlug;

  if (!cafeSlug) {
    throw badRequest("Cafe slug is required");
  }

  const cafe = await prisma.cafe.findUnique({
    where: { slug: cafeSlug },
  });

  if (!cafe) {
    throw notFound("Cafe not found");
  }

  if (cafe.status !== "active") {
    throw forbidden("Cafe is suspended");
  }

  req.cafe = cafe;
  req.cafeId = cafe.id;
  next();
});
