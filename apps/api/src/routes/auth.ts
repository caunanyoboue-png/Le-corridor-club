import { zodMessage } from "../lib/zod-error";
import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { Role } from "@maquis/shared";
import { prisma } from "../lib/prisma";
import { signAccess, signRefresh, verifyRefresh } from "../lib/jwt";
import { authenticate, AuthRequest } from "../middleware/auth";

const router: express.Router = express.Router();

// ── Schémas Zod ───────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  password: z.string().min(8),
  role: z.nativeEnum(Role).default(Role.CLIENT),
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string(),
});

// ── POST /auth/register ───────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodMessage(parsed.error) });
    return;
  }
  const { name, email, phone, password, role } = parsed.data;

  if (!email && !phone) {
    res.status(400).json({ error: "Email ou téléphone requis" });
    return;
  }

  const exists = await prisma.user.findFirst({
    where: { OR: [email ? { email } : {}, phone ? { phone } : {}] },
  });
  if (exists) {
    res.status(409).json({ error: "Compte déjà existant avec cet email ou téléphone" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  const accessToken = signAccess(user.id, user.role as Role);
  const refreshToken = signRefresh(user.id, user.role as Role);

  res.status(201).json({ user, accessToken, refreshToken });
});

// ── POST /auth/login ──────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: zodMessage(parsed.error) });
    return;
  }
  const { email, phone, password } = parsed.data;

  if (!email && !phone) {
    res.status(400).json({ error: "Email ou téléphone requis" });
    return;
  }

  const user = await prisma.user.findFirst({
    where: { OR: [email ? { email } : {}, phone ? { phone } : {}], deletedAt: null },
  });

  if (!user || !user.active) {
    res.status(401).json({ error: "Identifiants incorrects ou compte désactivé" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Identifiants incorrects" });
    return;
  }

  const accessToken = signAccess(user.id, user.role as Role);
  const refreshToken = signRefresh(user.id, user.role as Role);

  res.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    accessToken,
    refreshToken,
  });
});

// ── POST /auth/refresh ────────────────────────────────────────────────
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ error: "refreshToken requis" });
    return;
  }
  try {
    const payload = verifyRefresh(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, active: true },
    });
    if (!user?.active) {
      res.status(401).json({ error: "Compte désactivé" });
      return;
    }
    const accessToken = signAccess(user.id, user.role as Role);
    const newRefresh = signRefresh(user.id, user.role as Role);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch {
    res.status(401).json({ error: "Refresh token invalide ou expiré" });
  }
});

// ── GET /auth/me ──────────────────────────────────────────────────────
router.get("/me", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true },
  });
  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }
  res.json(user);
});

export default router;
