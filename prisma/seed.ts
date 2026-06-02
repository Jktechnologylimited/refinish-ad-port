// prisma/seed.ts
// Run: npm run db:seed
// Seeds the database with initial data for Refinish PHC

import { PrismaClient, Role, ServiceType } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding AutoOps database...")

  // ── Business Settings ──────────────────────────────────────────────
  await prisma.businessSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      businessName: "Refinish PHC",
      email: "info@refinishphc.com",
      phone: "+234 000 000 0000",
      address: "Port Harcourt",
      city: "Port Harcourt",
      state: "Rivers State",
      currency: "NGN",
      currencySymbol: "₦",
    },
  })
  console.log("✅ Business settings created")

  // ── Owner account ──────────────────────────────────────────────────
  const ownerPassword = await bcrypt.hash("RefinishOwner2026!", 12)
  const owner = await prisma.user.upsert({
    where: { email: "owner@refinishphc.com" },
    update: {},
    create: {
      name: "Business Owner",
      email: "owner@refinishphc.com",
      password: ownerPassword,
      role: Role.OWNER,
    },
  })
  console.log("✅ Owner account:", owner.email)

  // ── Manager account ────────────────────────────────────────────────
  const managerPassword = await bcrypt.hash("RefinishManager2026!", 12)
  const manager = await prisma.user.upsert({
    where: { email: "manager@refinishphc.com" },
    update: {},
    create: {
      name: "Shop Manager",
      email: "manager@refinishphc.com",
      password: managerPassword,
      role: Role.MANAGER,
    },
  })
  console.log("✅ Manager account:", manager.email)

  // ── Worker account ─────────────────────────────────────────────────
  const workerPassword = await bcrypt.hash("RefinishWorker2026!", 12)
  const worker = await prisma.user.upsert({
    where: { email: "worker@refinishphc.com" },
    update: {},
    create: {
      name: "Technician One",
      email: "worker@refinishphc.com",
      password: workerPassword,
      role: Role.WORKER,
    },
  })
  console.log("✅ Worker account:", worker.email)

  // ── Services catalogue ─────────────────────────────────────────────
  const services = [
    {
      name: "Interior Deep Clean",
      description: "Full interior vacuum, steam clean, leather treatment, odour removal",
      price: 25000,
      depositPercent: 30,
      duration: 4,
    },
    {
      name: "Exterior Detail & Polish",
      description: "Hand wash, clay bar, machine polish, wax protection",
      price: 35000,
      depositPercent: 30,
      duration: 5,
    },
    {
      name: "Full Detail Package",
      description: "Complete interior + exterior detail — our most popular service",
      price: 55000,
      depositPercent: 30,
      duration: 8,
    },
    {
      name: "Ceramic Coating",
      description: "Professional ceramic coating — 2-year protection, hydrophobic finish",
      price: 150000,
      depositPercent: 50,
      duration: 16,
    },
    {
      name: "Paint Correction",
      description: "Remove swirl marks, scratches, and oxidation — restore factory gloss",
      price: 80000,
      depositPercent: 50,
      duration: 12,
    },
    {
      name: "Chrome Delete",
      description: "Full chrome delete wrap — midnight black modern look",
      price: 120000,
      depositPercent: 50,
      duration: 10,
    },
    {
      name: "Car Painting (Oven-Baked)",
      description: "Full factory-quality oven-baked respray — no traces",
      price: 350000,
      depositPercent: 50,
      duration: 72,
    },
    {
      name: "Body Work",
      description: "Dent removal, panel repair, collision damage restoration",
      price: 0, // custom quote
      depositPercent: 40,
      duration: 24,
    },
  ]

  for (const service of services) {
    await prisma.service.create({ data: service }).catch(() => {})
  }
  console.log("✅ Services catalogue seeded")

  // ── Sample products ────────────────────────────────────────────────
  const products = [
    {
      name: "Refinish Pro Ceramic Wax",
      slug: "refinish-pro-ceramic-wax",
      description: "Professional-grade ceramic wax with 6-month protection. Leaves an incredible deep gloss finish.",
      price: 8500,
      stock: 50,
      category: "WAX_AND_POLISH" as const,
      images: [],
      isFeatured: true,
    },
    {
      name: "Interior Detailing Kit",
      slug: "interior-detailing-kit",
      description: "Everything you need for a professional interior clean — 8-piece kit including brushes, microfibre cloths, and interior cleaner.",
      price: 15000,
      comparePrice: 18000,
      stock: 25,
      category: "KITS_AND_BUNDLES" as const,
      images: [],
      isFeatured: true,
    },
    {
      name: "Premium Microfibre Cloths (Pack of 10)",
      slug: "premium-microfibre-cloths-10pk",
      description: "Ultra-soft 400gsm microfibre cloths — safe on all paint types. The same cloths our technicians use.",
      price: 4500,
      stock: 100,
      category: "MICROFIBRE_AND_TOOLS" as const,
      images: [],
      isFeatured: false,
    },
    {
      name: "Tyre Shine & Protectant",
      slug: "tyre-shine-protectant",
      description: "Long-lasting tyre dressing that gives a deep, natural satin shine while protecting against cracking.",
      price: 3500,
      stock: 75,
      category: "TYRE_CARE" as const,
      images: [],
      isFeatured: false,
    },
    {
      name: "Glass Cleaner Pro",
      slug: "glass-cleaner-pro",
      description: "Streak-free formula for windscreens and windows. Anti-fog coating included.",
      price: 2800,
      stock: 60,
      category: "GLASS_CARE" as const,
      images: [],
      isFeatured: false,
    },
  ]

  for (const product of products) {
    await prisma.product
      .create({ data: product })
      .catch(() => console.log(`  ↳ Product '${product.name}' already exists`))
  }
  console.log("✅ Sample products seeded")

  console.log("\n🎉 Database seeded successfully!")
  console.log("\n📋 Login credentials:")
  console.log("  Owner:   owner@refinishphc.com / RefinishOwner2026!")
  console.log("  Manager: manager@refinishphc.com / RefinishManager2026!")
  console.log("  Worker:  worker@refinishphc.com / RefinishWorker2026!")
  console.log("\n⚠️  Change all passwords before going live!")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
