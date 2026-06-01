import express, { Response } from "express";
import { z } from "zod";
import { Role } from "@maquis/shared";
import { prisma } from "../lib/prisma";
import { authenticate, requireRoles, AuthRequest } from "../middleware/auth";
import { zodMessage } from "../lib/zod-error";

const router: express.Router = express.Router();

const submitDailySchema = z.object({
  date: z.string().refine((d) => !isNaN(Date.parse(d)), "Date invalide"),
});

function dayRange(dateStr?: string): { gte: Date; lt: Date } {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setHours(0, 0, 0, 0);
  const next = new Date(d); next.setDate(d.getDate() + 1);
  return { gte: d, lt: next };
}

// ── POST /reports/daily — soumettre le rapport journalier ─────────────
router.post("/daily", authenticate, requireRoles(Role.EMPLOYEE, Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = submitDailySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: zodMessage(parsed.error) }); return; }

  const { date: dateStr } = parsed.data;
  const reportDate = new Date(dateStr);
  reportDate.setHours(0, 0, 0, 0);

  // Vérifier qu'il n'existe pas déjà un rapport pour ce jour/employé
  const existing = await prisma.dailyReport.findFirst({
    where: { date: { equals: reportDate }, employeeId: req.user!.sub },
  });
  if (existing) { res.status(409).json({ error: "Rapport déjà soumis pour ce jour" }); return; }

  // Calcul : ventes du jour
  const nextDay = new Date(reportDate);
  nextDay.setDate(reportDate.getDate() + 1);

  const sales = await prisma.sale.findMany({
    where: { employeeId: req.user!.sub, createdAt: { gte: reportDate, lt: nextDay } },
    include: { items: { include: { product: true } } },
  });

  const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const transactionCount = sales.length;

  // Top produits vendus
  const productMap = new Map<string, { qty: number; name: string; salePrice: number; buyPrice: number }>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const key = item.productId;
      const ex = productMap.get(key);
      if (ex) {
        ex.qty += item.quantity;
      } else {
        productMap.set(key, { qty: item.quantity, name: item.product.name, salePrice: Number(item.product.salePrice), buyPrice: Number(item.product.buyPrice) });
      }
    }
  }

  const topProducts = Array.from(productMap.entries())
    .map(([id, data]) => ({ productId: id, name: data.name, quantity: data.qty, saleAmount: data.salePrice * data.qty, costAmount: data.buyPrice * data.qty }))
    .sort((a, b) => b.saleAmount - a.saleAmount)
    .slice(0, 5);

  const totalCost = topProducts.reduce((sum, p) => sum + p.costAmount, 0);
  const grossProfit = totalSales - totalCost;
  const marginPercent = totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0;

  const report = await prisma.dailyReport.create({
    data: {
      date: reportDate,
      employeeId: req.user!.sub,
      totalSales,
      totalOrders: transactionCount,
      payload: { topProducts, totalCost, grossProfit, marginPercent, submittedAt: new Date().toISOString() },
    },
  });

  res.status(201).json(report);
});

// ── GET /reports/daily — lister les rapports (admin + employé propres) ──
router.get("/daily-list", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { employeeId, fromDate, toDate } = req.query as { employeeId?: string; fromDate?: string; toDate?: string };

  const where: Record<string, unknown> = {};

  if (req.user!.role === Role.EMPLOYEE) {
    where.employeeId = req.user!.sub;
  } else if (employeeId) {
    where.employeeId = employeeId;
  }

  if (fromDate || toDate) {
    where.date = {};
    if (fromDate) (where.date as Record<string, unknown>).gte = new Date(fromDate);
    if (toDate) {
      const to = new Date(toDate);
      to.setDate(to.getDate() + 1);
      (where.date as Record<string, unknown>).lt = to;
    }
  }

  const reports = await prisma.dailyReport.findMany({
    where,
    include: { employee: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });

  res.json(reports);
});

// ── GET /reports/daily?date=YYYY-MM-DD ────────────────────────────────
router.get("/daily", authenticate, requireRoles(Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const range = dayRange(req.query.date as string | undefined);

  const [sales, orders, topProducts] = await Promise.all([
    prisma.sale.aggregate({ where: { createdAt: range }, _sum: { total: true }, _count: true }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: range },
      _count: true,
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { createdAt: range } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  // Enrichir les top produits avec leur nom
  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, salePrice: true },
  });

  const topEnriched = topProducts.map((tp) => {
    const p = products.find((pr) => pr.id === tp.productId)!;
    const qty = Number(tp._sum.quantity ?? 0);
    return { productId: tp.productId, name: p?.name ?? "?", quantity: qty, chiffre: qty * Number(p?.salePrice ?? 0) };
  });

  res.json({
    date: range.gte.toISOString().split("T")[0],
    totalSales: Number(sales._sum.total ?? 0),
    transactions: sales._count,
    ordersByStatus: orders,
    topProducts: topEnriched,
  });
});

// ── GET /reports/summary?period=today|week|month ──────────────────────
router.get("/summary", authenticate, requireRoles(Role.ADMIN), async (req: AuthRequest, res: Response): Promise<void> => {
  const period = (req.query.period as string) ?? "today";
  const now = new Date();
  let gte: Date;

  if (period === "week") {
    gte = new Date(now); gte.setDate(now.getDate() - 7); gte.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    gte = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    gte = new Date(now); gte.setHours(0, 0, 0, 0);
  }

  const sales = await prisma.sale.aggregate({ where: { createdAt: { gte } }, _sum: { total: true }, _count: true });
  const orders = await prisma.order.count({ where: { createdAt: { gte } } });

  // Récupérer TOUS les saleItems avec leurs produits pour calculer le coût
  const saleItems = await prisma.saleItem.findMany({
    where: { sale: { createdAt: { gte } } },
    include: { product: { select: { id: true, name: true, buyPrice: true } } },
  });

  console.log(`[REPORTS DEBUG] Period: ${period}, Sales count: ${sales._count}, SaleItems count: ${saleItems.length}`);
  if (saleItems.length > 0) {
    console.log(`[REPORTS DEBUG] First item:`, { unitPrice: saleItems[0].unitPrice, qty: saleItems[0].quantity, buyPrice: saleItems[0].product?.buyPrice });
  }

  // Grouper les ventes par produit
  const productMap = new Map<string, { qty: number; name: string; saleAmount: number; costAmount: number }>();

  for (const item of saleItems) {
    const salePrice = Number(item.unitPrice ?? 0);
    const buyPrice = item.product?.buyPrice ? Number(item.product.buyPrice) : 0;
    const saleAmount = salePrice * item.quantity;
    const costAmount = buyPrice * item.quantity;

    const existing = productMap.get(item.productId);
    if (existing) {
      existing.qty += item.quantity;
      existing.saleAmount += saleAmount;
      existing.costAmount += costAmount;
    } else {
      productMap.set(item.productId, {
        qty: item.quantity,
        name: item.product?.name ?? "Produit inconnu",
        saleAmount,
        costAmount,
      });
    }
  }

  // Top 5 produits
  const topProducts = Array.from(productMap.entries())
    .map(([id, data]) => ({
      productId: id,
      name: data.name,
      quantity: data.qty,
      saleAmount: data.saleAmount,
      costAmount: data.costAmount,
      profit: data.saleAmount - data.costAmount,
    }))
    .sort((a, b) => b.saleAmount - a.saleAmount)
    .slice(0, 5);

  // Calculer le coût total basé sur TOUS les items
  const costTotal = Array.from(productMap.values()).reduce((sum, p) => sum + p.costAmount, 0);
  const totalSales = Number(sales._sum.total ?? 0);
  const grossProfit = totalSales - costTotal;
  const profitPercent = totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0;
  const transactions = sales._count;
  const avgCart = transactions > 0 ? Math.round(totalSales / transactions) : 0;

  console.log(`[REPORTS DEBUG] CostTotal: ${costTotal}, TotalSales: ${totalSales}, GrossProfit: ${grossProfit}`);
  console.log(`[REPORTS DEBUG] ProductMap size: ${productMap.size}`);

  res.json({ period, totalSales, costTotal, grossProfit, profitPercent, transactions, orders, avgCart, topProducts });
});

export default router;
