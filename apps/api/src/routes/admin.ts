import { zodMessage } from "../lib/zod-error";
import express, { Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Role } from "@maquis/shared";
import { prisma } from "../lib/prisma";
import { authenticate, requireRoles, AuthRequest } from "../middleware/auth";

const router: express.Router = express.Router();

// Tous les endpoints ici exigent ADMIN
router.use(authenticate, requireRoles(Role.ADMIN));

const createUserSchema = z.object({
  name:     z.string().min(2).max(100),
  email:    z.string().email().optional(),
  phone:    z.string().min(8).max(20).optional(),
  password: z.string().min(8),
  role:     z.enum(["EMPLOYEE", "ADMIN", "CLIENT"]).default("EMPLOYEE"),
});

const updateUserSchema = z.object({
  name:  z.string().min(2).max(100).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(8).max(20).optional().nullable(),
  role:  z.enum(["EMPLOYEE", "ADMIN", "CLIENT"]).optional(),
});

// ── GET /admin/users ──────────────────────────────────────────────────
router.get("/users", async (_req: AuthRequest, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

// ── POST /admin/users ─────────────────────────────────────────────────
router.post("/users", async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodMessage(parsed.error) }); return; }

  const { name, email, phone, password, role } = parsed.data;

  if (!email && !phone) { res.status(400).json({ error: "Email ou téléphone requis" }); return; }

  const existing = await prisma.user.findFirst({
    where: { OR: [email ? { email } : {}, phone ? { phone } : {}], deletedAt: null },
  });
  if (existing) { res.status(409).json({ error: "Email ou téléphone déjà utilisé" }); return; }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role, active: true },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
  });
  res.status(201).json(user);
});

// ── PUT /admin/users/:id ──────────────────────────────────────────────
router.put("/users/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodMessage(parsed.error) }); return; }

  const user = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
  });
  res.json(updated);
});

// ── PATCH /admin/users/:id/status ─────────────────────────────────────
router.patch("/users/:id/status", async (req: AuthRequest, res: Response): Promise<void> => {
  const { active } = req.body as { active: boolean };
  const user = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { active },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true },
  });
  res.json(updated);
});

// ── PATCH /admin/users/:id/password ──────────────────────────────────
router.patch("/users/:id/password", async (req: AuthRequest, res: Response): Promise<void> => {
  const { password } = req.body as { password?: string };
  if (!password || password.length < 8) {
    res.status(400).json({ error: "Mot de passe trop court (min 8 chars)" }); return;
  }
  const user = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
  res.json({ message: "Mot de passe mis à jour" });
});

// ── DELETE /admin/users/:id ──────────────────────────────────────────
router.delete("/users/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findFirst({ where: { id: req.params.id, deletedAt: null } });
  if (!user) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }

  await prisma.user.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date() },
  });
  res.json({ message: "Utilisateur supprimé" });
});

// ── GET /admin/stats ──────────────────────────────────────────────────
router.get("/stats", async (_req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [totalSalesToday, ordersToday, activeProducts, activeEmployees, saleItems] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    prisma.product.count({ where: { deletedAt: null, visible: true } }),
    prisma.user.count({ where: { role: "EMPLOYEE", active: true, deletedAt: null } }),
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: today } } },
      include: { product: { select: { buyPrice: true } } },
    }),
  ]);

  const totalSales = Number(totalSalesToday._sum.total ?? 0);
  const costToday = saleItems.reduce((sum, item) => sum + Number(item.product.buyPrice) * item.quantity, 0);
  const profitToday = totalSales - costToday;
  const profitPercent = totalSales > 0 ? Math.round((profitToday / totalSales) * 100) : 0;

  res.json({
    totalSalesToday: totalSales,
    transactionsToday: totalSalesToday._count,
    activeOrders: ordersToday,
    activeProducts,
    activeEmployees,
    costToday,
    profitToday,
    profitPercent,
  });
});

export default router;
