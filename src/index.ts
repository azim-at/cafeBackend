import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import menuRouter from "./routes/menu";
import ordersRouter from "./routes/orders";
import favoritesRouter from "./routes/favorites";
import rewardsRouter from "./routes/rewards";
import adminRouter from "./routes/admin";
import { resolveCafe } from "./middleware/resolveCafe";
import { isServiceError } from "./utils/errors";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use("/api/auth", authRouter);
app.use("/api/:cafeSlug/menu", resolveCafe, menuRouter);
app.use("/api/:cafeSlug/orders", resolveCafe, ordersRouter);
app.use("/api/:cafeSlug/favorites", resolveCafe, favoritesRouter);
app.use("/api/:cafeSlug/rewards", resolveCafe, rewardsRouter);
app.use("/api/:cafeSlug/admin", resolveCafe, adminRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (isServiceError(err)) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
