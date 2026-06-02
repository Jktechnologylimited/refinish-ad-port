// src/app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session || session.user.role === "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true, name: true, images: true, slug: true } } } },
      customer: true,
    },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: order })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session || session.user.role === "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()

  const allowed = ["fulfilmentStatus", "trackingNumber", "notes", "status"]
  const data: any = {}
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key]
  }
  if (body.fulfilmentStatus === "SHIPPED") data.shippedAt = new Date()
  if (body.fulfilmentStatus === "DELIVERED") data.deliveredAt = new Date()

  const order = await prisma.order.update({ where: { id }, data })
  return NextResponse.json({ success: true, data: order })
}
