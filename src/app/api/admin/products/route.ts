// src/app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
  comparePrice: z.number().optional().nullable(),
  stock: z.number().int().min(0),
  lowStockAt: z.number().int().min(0).default(5),
  sku: z.string().optional().nullable(),
  category: z.string(),
  images: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  weight: z.number().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const category = searchParams.get("category")
  const filter = searchParams.get("filter")

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ]
  }
  if (category) where.category = category
  if (filter === "low-stock") where.stock = { lte: 5, gt: 0 }
  if (filter === "out-of-stock") where.stock = 0
  if (filter === "inactive") where.isActive = false

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ success: true, data: products })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug: data.slug } })
    if (existing) {
      return NextResponse.json({ success: false, error: "Slug already exists" }, { status: 400 })
    }

    const product = await prisma.product.create({ data: data as any })
    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Invalid data", details: err.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 })
  }
}
