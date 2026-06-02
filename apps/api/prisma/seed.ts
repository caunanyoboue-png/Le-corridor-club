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

  console.log("✅ 4 catégories créées");

  // ── Produits (Le Corridor Club - Maquis réel) ───────────────────────────────────────────────────────
  const products = [
    // Bières
    { id: "prod-rhino",      catId: catBieres.id,    name: "Rhino energy 33cl",            sale: 500,  buy: 250, unit: "bouteille" },
    { id: "prod-guinness",   catId: catBieres.id,    name: "Guinness Foreign Extra 33cl",  sale: 1000, buy: 500, unit: "bouteille" },
    { id: "prod-doppel",     catId: catBieres.id,    name: "Doppel Munich 33cl",           sale: 500,  buy: 250, unit: "bouteille" },
    { id: "prod-budweiser",  catId: catBieres.id,    name: "Budweiser 33cl",              sale: 800,  buy: 400, unit: "bouteille" },
    { id: "prod-desperados", catId: catBieres.id,    name: "Desperados 330ml",            sale: 600,  buy: 300, unit: "bouteille" },
    { id: "prod-bock",       catId: catBieres.id,    name: "Bock 65cl",                   sale: 600,  buy: 300, unit: "bouteille" },
    { id: "prod-beaufort",   catId: catBieres.id,    name: "Beaufort lager 33cl",         sale: 600,  buy: 300, unit: "bouteille" },
    { id: "prod-heineken",   catId: catBieres.id,    name: "Heineken 33cl",               sale: 600,  buy: 300, unit: "bouteille" },
    { id: "prod-codys",      catId: catBieres.id,    name: "Cody's blanc bière 500ml",    sale: 600,  buy: 300, unit: "bouteille" },
    // Softs
    { id: "prod-malta",      catId: catSofts.id,     name: "Malta guinness 30cl",         sale: 600,  buy: 300, unit: "bouteille" },
    { id: "prod-orangina",   catId: catSofts.id,     name: "Orangina 30cl",               sale: 500,  buy: 250, unit: "bouteille" },
    // Vins & Spiritueux
    { id: "prod-valpierre",  catId: catVins.id,      name: "Valpierre 50cl",              sale: 1200, buy: 600, unit: "bouteille" },
    // Porc braisé
    { id: "prod-porc-petit", catId: catGrillades.id, name: "Porc braisé (petit)",         sale: 4000, buy: 2000, unit: "portion", alert: 5 },
    { id: "prod-porc-gros",  catId: catGrillades.id, name: "Porc braisé (gros)",          sale: 5000, buy: 2500, unit: "portion", alert: 5 },
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
