import { zodMessage } from "../lib/zod-error";
import express, { Response } from "express";
import { z } from "zod";
import { Role } from "@maquis/shared";
import { prisma } from "../lib/prisma";
import { authenticate, requireRoles, AuthRequest } from "../middleware/auth";

const router: express.Router = express.Router();

const productSchema = z.object({
  name:                z.string().min(1, "Nom requis").max(100),
  categoryId:          z.string().min(1, "Catégorie requise"),
  description:         z.string().optional(),
  salePrice:           z.coerce.number().positive("Prix de vente invalide"),
  buyPrice:            z.coerce.number().positive("Prix d'achat invalide"),
  unit:                z.string().min(1, "Unité requise"),
  imageUrl:            z.string().url().optional().or(z.literal("")),
  visible:             z.boolean().optional().default(true),
  stockAlertThreshold: z.coerce.number().int().min(0).optional().default(10),
  initialStock:        z.coerce.number().min(0).optional(),
});

// ── GET /products ─────────────────────────────────────────────────────
router.get("/", authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: { category: true, stockItem: true },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });
  res.json(products);
});

// ── GET /products/categories ──────────────────────────────────────────
router.get("/categories", authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  const cats = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
  res.json(cats);
});

// ── GET /products/:id ─────────────────────────────────────────────────
router.get("/:id", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const product = await prisma.product.findFirst({
    where: { id: req.params.id, deletedAt: null },
    include: { category: true, stockItem: true },
  });
  if (!product) { res.status(404).json({ error: "Produit introuvable" }); return; }
  res.json(product);
});

// ── POST /products ────────────────────────────────────────────────────
router.post("/", authenticate, requireRoles(Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodMessage(parsed.error) }); return; }

  const { initialStock, ...data } = parsed.data;

  const product = await prisma.product.create({
    data: {
      ...data,
      imageUrl: data.imageUrl || null,
      stockItem: { create: { quantity: initialStock ?? 0 } },
    },
    include: { category: true, stockItem: true },
  });
  res.status(201).json(product);
});

// ── PUT /products/:id ─────────────────────────────────────────────────
router.put("/:id", authenticate, requireRoles(Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodMessage(parsed.error) }); return; }

  const exists = await prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!exists) { res.status(404).json({ error: "Produit introuvable" }); return; }

  const { initialStock, ...data } = parsed.data;
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { ...data, imageUrl: data.imageUrl === "" ? null : data.imageUrl },
    include: { category: true, stockItem: true },
  });
  res.json(product);
});

// ── PATCH /products/:id/visibility ────────────────────────────────────
router.patch("/:id/visibility", authenticate, requireRoles(Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const { visible } = req.body as { visible: boolean };
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { visible },
    include: { category: true, stockItem: true },
  });
  res.json(product);
});

// ── DELETE /products/:id (soft) ───────────────────────────────────────
router.delete("/:id", authenticate, requireRoles(Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const exists = await prisma.product.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!exists) { res.status(404).json({ error: "Produit introuvable" }); return; }

  await prisma.product.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date(), visible: false },
  });
  res.status(204).end();
});

export default router;
