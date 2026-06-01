import { zodMessage } from "../lib/zod-error";
import express, { Response } from "express";
import { z } from "zod";
import { Role } from "@maquis/shared";
import { prisma } from "../lib/prisma";
import { authenticate, requireRoles, AuthRequest } from "../middleware/auth";

const router: express.Router = express.Router();

const createSchema = z.object({
  customerLabel: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
  })).min(1),
});

// ── POST /sales — vente directe (caisse) ─────────────────────────────
router.post("/", authenticate, requireRoles(Role.EMPLOYEE, Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodMessage(parsed.error) }); return; }

  const { customerLabel, items } = parsed.data;
  const productIds = items.map((i) => i.productId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
  });
  if (products.length !== productIds.length) {
    res.status(400).json({ error: "Un ou plusieurs produits introuvables" }); return;
  }

  const total = items.reduce((s, i) => {
    const p = products.find((pr) => pr.id === i.productId)!;
    return s + Number(p.salePrice) * i.quantity;
  }, 0);

  const sale = await prisma.sale.create({
    data: {
      employeeId: req.user!.sub,
      total,
      customerLabel,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: products.find((p) => p.id === i.productId)!.salePrice,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  // Décrémenter le stock
  for (const item of items) {
    await prisma.stockItem.upsert({
      where: { productId: item.productId },
      update: { quantity: { decrement: item.quantity } },
      create: { productId: item.productId, quantity: 0 },
    });
    await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        userId: req.user!.sub,
        type: "OUT",
        quantity: item.quantity,
        reason: `Vente directe #${sale.id.slice(0, 8)}`,
      },
    });
  }

  res.status(201).json(sale);
});

// ── GET /sales ────────────────────────────────────────────────────────
router.get("/", authenticate, requireRoles(Role.EMPLOYEE, Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const { date } = req.query as { date?: string };

  const where: Record<string, unknown> = {};
  if (date) {
    const d = new Date(date);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    where.createdAt = { gte: d, lt: next };
  } else {
    // Par défaut : aujourd'hui
    const today = new Date(); today.setHours(0, 0, 0, 0);
    where.createdAt = { gte: today };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: { items: { include: { product: true } }, employee: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(sales);
});

export default router;
