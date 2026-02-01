import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import menuRouter from "./routes/menu";
import ordersRouter from "./routes/orders";
import favoritesRouter from "./routes/favorites";
import rewardsRouter from "./routes/rewards";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use("/api/auth", authRouter);
app.use("/api/menu", menuRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/rewards", rewardsRouter);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
