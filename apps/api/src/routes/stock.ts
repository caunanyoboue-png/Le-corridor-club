import { zodMessage } from "../lib/zod-error";
import express, { Response } from "express";
import { z } from "zod";
import { Role } from "@maquis/shared";
import { prisma } from "../lib/prisma";
import { authenticate, requireRoles, AuthRequest } from "../middleware/auth";
import { getIo } from "../lib/io";
import { emitStockAlert, emitStockMovement } from "../modules/socket";

const router: express.Router = express.Router();

const movementSchema = z.object({
  productId: z.string(),
  type: z.enum(["IN", "OUT", "LOSS", "ADJUSTMENT"]),
  quantity: z.number().positive(),
  reason: z.string().optional(),
  reference: z.string().optional(),
});

// ── GET /stock — inventaire complet ──────────────────────────────────
router.get("/", authenticate, requireRoles(Role.EMPLOYEE, Role.ADMIN), async (_req: AuthRequest, res: Response): Promise<void> => {
  const items = await prisma.stockItem.findMany({
    include: {
      product: { include: { category: true } },
    },
    orderBy: { product: { name: "asc" } },
  });
  res.json(items);
});

// ── GET /stock/alerts — produits sous le seuil ───────────────────────
router.get("/alerts", authenticate, requireRoles(Role.EMPLOYEE, Role.ADMIN), async (_req: AuthRequest, res: Response): Promise<void> => {
  const items = await prisma.stockItem.findMany({
    include: { product: true },
  });
  const alerts = items.filter(
    (i) => Number(i.quantity) <= i.product.stockAlertThreshold
  );
  res.json(alerts);
});

// ── POST /stock/movement ──────────────────────────────────────────────
router.post("/movement", authenticate, requireRoles(Role.EMPLOYEE, Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = movementSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodMessage(parsed.error) }); return; }

  const { productId, type, quantity, reason, reference } = parsed.data;

  const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
  if (!product) { res.status(404).json({ error: "Produit introuvable" }); return; }

  const movement = await prisma.stockMovement.create({
    data: {
      productId,
      userId: req.user!.sub,
      type,
      quantity,
      reason,
      reference,
    },
    include: {
      product: true,
      user: { select: { id: true, name: true } },
    },
  });

  // Ajuster le stock
  const delta = (type === "IN" || type === "ADJUSTMENT") ? quantity : -quantity;
  const updated = await prisma.stockItem.upsert({
    where: { productId },
    update: { quantity: { increment: delta } },
    create: { productId, quantity: Math.max(0, delta) },
    include: { product: true },
  });

  // Émettre l'événement mouvement de stock
  emitStockMovement(getIo(), {
    id: movement.id,
    type: movement.type,
    quantity: movement.quantity,
    reason: movement.reason,
    productId: movement.product.id,
    productName: movement.product.name,
    productUnit: movement.product.unit,
    userName: movement.user.name,
    newQuantity: Number(updated.quantity),
    createdAt: movement.createdAt,
  });

  // Alerte si sous le seuil après ajustement
  if (Number(updated.quantity) <= updated.product.stockAlertThreshold) {
    emitStockAlert(getIo(), {
      productId,
      productName: product.name,
      quantity: Number(updated.quantity),
    });
  }

  res.status(201).json({ movement, stockItem: updated });
});

// ── GET /stock/movements — historique ────────────────────────────────
router.get("/movements", authenticate, requireRoles(Role.ADMIN), async (_req: AuthRequest, res: Response): Promise<void> => {
  const movements = await prisma.stockMovement.findMany({
    include: {
      product: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json(movements);
});

export default router;
