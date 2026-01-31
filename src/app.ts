import express, { Application } from "express";
import cors from "cors";

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_, res) => {
  res.status(200).json({ status: "OK" });
});

export default app;
