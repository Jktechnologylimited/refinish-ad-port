// src/app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { deleteImage } from "@/lib/cloudinary"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session || session.user.role === "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: product })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session || session.user.role === "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()

  try {
    const product = await prisma.product.update({
      where: { id },
      data: body,
    })
    return NextResponse.json({ success: true, data: product })
  } catch (err) {
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const { id } = await params

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Check if product has orders
  const orderCount = await prisma.orderItem.count({ where: { productId: id } })
  if (orderCount > 0) {
    // Soft delete — just deactivate
    await prisma.product.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true, message: "Product deactivated (has existing orders)" })
  }

  // Hard delete — also remove Cloudinary images
  // Images are stored as Cloudinary public IDs or URLs
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
