import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import saleRoutes from "./routes/sales";
import stockRoutes from "./routes/stock";
import reportRoutes from "./routes/reports";
import adminRoutes from "./routes/admin";

const app = express();

// ── Middlewares globaux ────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Healthcheck ───────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// ── Routes API v1 ─────────────────────────────────────────────────────
const v1 = express.Router();
v1.use("/auth", authRoutes);
v1.use("/products", productRoutes);
v1.use("/orders", orderRoutes);
v1.use("/sales", saleRoutes);
v1.use("/stock", stockRoutes);
v1.use("/reports", reportRoutes);
v1.use("/admin", adminRoutes);

app.use("/api/v1", v1);

// ── 404 ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

export default app;
