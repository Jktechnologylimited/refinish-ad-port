// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const status = searchParams.get("status")
  const fulfilment = searchParams.get("fulfilment")

  const where: any = {}
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { reference: { contains: search, mode: "insensitive" } },
    ]
  }
  if (status) where.status = status
  if (fulfilment) where.fulfilmentStatus = fulfilment

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, images: true } } },
      },
    },
  })

  return NextResponse.json({ success: true, data: orders })
}
