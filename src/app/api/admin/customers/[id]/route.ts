// src/app/api/admin/customers/[id]/route.ts
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
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, serviceName: true, servicePrice: true,
          stage: true, scheduledDate: true, createdAt: true,
          depositPaid: true, balancePaid: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true, reference: true, total: true,
          status: true, createdAt: true,
          items: { select: { quantity: true, product: { select: { name: true } } } },
        },
      },
    },
  })
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: customer })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session || session.user.role === "WORKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()
  const allowed = ["notes", "phone", "email", "address", "carMake", "carModel", "carYear", "carColour", "carPlate"]
  const data: any = {}
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key]
  }
  const customer = await prisma.customer.update({ where: { id }, data })
  return NextResponse.json({ success: true, data: customer })
}
