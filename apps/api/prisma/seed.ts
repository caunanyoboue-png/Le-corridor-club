import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Supabase database...");

  // ── Users ──────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin@2025!", 12);
  const empHash   = await bcrypt.hash("Employe@2025!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@corridorclub.ci" },
    update: {},
    create: { name: "Kouassi Admin", email: "admin@corridorclub.ci", passwordHash: adminHash, role: Role.ADMIN },
  });

  await prisma.user.upsert({
    where: { email: "caisse1@corridorclub.ci" },
    update: {},
    create: { name: "Aya Koné",      email: "caisse1@corridorclub.ci", passwordHash: empHash, role: Role.EMPLOYEE },
  });

  await prisma.user.upsert({
    where: { email: "caisse2@corridorclub.ci" },
    update: {},
    create: { name: "Bamba Traoré",  email: "caisse2@corridorclub.ci", passwordHash: empHash, role: Role.EMPLOYEE },
  });

  console.log(`✅ Users créés (admin: ${admin.email})`);

  // ── Catégories ─────────────────────────────────────────────────────
  const catBieres    = await upsertCat("cat-bieres",    "Bières",                  "🍺");
  const catVins      = await upsertCat("cat-vins",      "Vins & Spiritueux",       "🍷");
  const catSofts     = await upsertCat("cat-softs",     "Sucreries & Softs",       "🥤");
  const catGrillades = await upsertCat("cat-grillades", "Porc braisé",             "🐷");
  const catPlats     = await upsertCat("cat-plats",     "Plats & Accompagnements", "🍽️");

  console.log("✅ 5 catégories créées");

  // ── Produits ───────────────────────────────────────────────────────
  const products = [
    { id: "prod-castel-b", catId: catBieres.id,    name: "Castel Bière",         sale: 500,  buy: 300, unit: "bouteille" },
    { id: "prod-flag-b",   catId: catBieres.id,    name: "Flag Spéciale",        sale: 500,  buy: 300, unit: "bouteille" },
    { id: "prod-beaufort", catId: catBieres.id,    name: "Beaufort",             sale: 500,  buy: 280, unit: "bouteille" },
    { id: "prod-bock",     catId: catBieres.id,    name: "Bock 65cl",            sale: 800,  buy: 500, unit: "bouteille" },
    { id: "prod-castel-c", catId: catBieres.id,    name: "Castel Canette",       sale: 600,  buy: 380, unit: "canette" },
    { id: "prod-vin-r",    catId: catVins.id,      name: "Vin Rouge (verre)",    sale: 700,  buy: 350, unit: "verre" },
    { id: "prod-vin-b",    catId: catVins.id,      name: "Vin Blanc (verre)",    sale: 700,  buy: 350, unit: "verre" },
    { id: "prod-whisky",   catId: catVins.id,      name: "Whisky (verre)",       sale: 1500, buy: 800, unit: "verre" },
    { id: "prod-coca",     catId: catSofts.id,     name: "Coca-Cola",            sale: 400,  buy: 200, unit: "bouteille", alert: 20 },
    { id: "prod-fanta",    catId: catSofts.id,     name: "Fanta Orange",         sale: 400,  buy: 200, unit: "bouteille", alert: 20 },
    { id: "prod-eau",      catId: catSofts.id,     name: "Eau minérale 50cl",    sale: 300,  buy: 150, unit: "bouteille", alert: 30 },
    { id: "prod-porc-p",   catId: catGrillades.id, name: "Porc braisé (portion)",sale: 1500, buy: 700, unit: "portion",   alert: 5  },
    { id: "prod-porc-1k",  catId: catGrillades.id, name: "Porc braisé 1 kg",    sale: 5000, buy: 2500,unit: "kg",        alert: 2  },
    { id: "prod-attieke",  catId: catPlats.id,     name: "Attiéké",             sale: 500,  buy: 200, unit: "portion",   alert: 5  },
    { id: "prod-alloco",   catId: catPlats.id,     name: "Alloco",              sale: 500,  buy: 200, unit: "portion",   alert: 5  },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id, categoryId: p.catId, name: p.name,
        salePrice: p.sale, buyPrice: p.buy, unit: p.unit,
        stockAlertThreshold: p.alert ?? 10, visible: true,
      },
    });
    await prisma.stockItem.upsert({
      where: { productId: p.id },
      update: {},
      create: { productId: p.id, quantity: 50 },
    });
  }

  console.log(`✅ ${products.length} produits + stocks initiaux créés`);
  console.log("\n🎉 Seed terminé !");
  console.log("  Admin    → admin@corridorclub.ci      / Admin@2025!");
  console.log("  Employé  → caisse1@corridorclub.ci   / Employe@2025!");
  console.log("  Employé  → caisse2@corridorclub.ci   / Employe@2025!");
}

async function upsertCat(id: string, name: string, icon: string) {
  return prisma.category.upsert({
    where: { id },
    update: {},
    create: { id, name, icon },
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
