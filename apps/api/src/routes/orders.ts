import { zodMessage } from "../lib/zod-error";
import express, { Response } from "express";
import { z } from "zod";
import { Role } from "@maquis/shared";
import { prisma } from "../lib/prisma";
import { authenticate, requireRoles, AuthRequest } from "../middleware/auth";
import { getIo } from "../lib/io";
import { emitOrderUpdate } from "../modules/socket";

const router: express.Router = express.Router();

// ── Génération numéro commande ────────────────────────────────────────
async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.order.count({
    where: { orderNumber: { startsWith: `ORD-${year}-` } },
  });
  return `ORD-${year}-${String(count + 1).padStart(4, "0")}`;
}

const createSchema = z.object({
  tableLabel: z.string().optional(),
  note: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
    note: z.string().optional(),
  })).min(1),
});

const statusSchema = z.object({
  status: z.enum(["PREPARING", "READY", "DELIVERED", "CANCELLED"]),
});

// ── POST /orders ──────────────────────────────────────────────────────
router.post("/", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodMessage(parsed.error) }); return; }

  const { tableLabel, note, items } = parsed.data;
  const employeeId = req.user!.role !== Role.CLIENT ? req.user!.sub : undefined;
  const customerId  = req.user!.role === Role.CLIENT  ? req.user!.sub : undefined;

  // Vérifier les produits existent
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    res.status(400).json({ error: "Un ou plusieurs produits sont introuvables" }); return;
  }

  const orderNumber = await nextOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId,
      employeeId,
      status: "PENDING",
      note: [tableLabel, note].filter(Boolean).join(" · ") || null,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: products.find((p) => p.id === item.productId)!.salePrice,
          note: item.note,
        })),
      },
    },
    include: { items: { include: { product: true } } },
  });

  emitOrderUpdate(getIo(), order as unknown as Record<string, unknown>);
  res.status(201).json(order);
});

// ── GET /orders ───────────────────────────────────────────────────────
router.get("/", authenticate, requireRoles(Role.EMPLOYEE, Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, date } = req.query as { status?: string; date?: string };

  const where: Record<string, unknown> = { deletedAt: null };
  if (status && status !== "TOUS") where.status = status;
  if (date) {
    const d = new Date(date);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    where.createdAt = { gte: d, lt: next };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { product: { include: { category: true } } } },
      customer: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// ── GET /orders/:id ───────────────────────────────────────────────────
router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: {
      items: { include: { product: true } },
      customer: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true } },
    },
  });
  if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }
  res.json(order);
});

// ── PUT /orders/:id/status ────────────────────────────────────────────
router.put("/:id/status", authenticate, requireRoles(Role.EMPLOYEE, Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodMessage(parsed.error) }); return; }

  const order = await prisma.order.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: { items: true },
  });
  if (!order) { res.status(404).json({ error: "Commande introuvable" }); return; }

  const { status } = parsed.data;
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status, employeeId: req.user!.sub },
    include: { items: { include: { product: true } } },
  });

  // À la livraison → créer une vente + décrémenter le stock
  const existingSale = await prisma.sale.findFirst({ where: { orderId: order.id } });
  if (status === "DELIVERED" && !existingSale) {
    const total = order.items.reduce(
      (s, i) => s + Number(i.unitPrice) * i.quantity, 0
    );
    await prisma.sale.create({
      data: {
        employeeId: req.user!.sub,
        orderId: order.id,
        total,
        items: {
          create: order.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      },
    });

    // Décrémenter le stock
    for (const item of order.items) {
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
          reason: `Livraison commande ${order.orderNumber}`,
          reference: order.orderNumber,
        },
      });
    }
  }

  emitOrderUpdate(getIo(), updated as unknown as Record<string, unknown>);
  res.json(updated);
});

export default router;
