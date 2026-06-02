// src/app/api/admin/customers/route.ts
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

  const where: any = {}
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { carPlate: { contains: search, mode: "insensitive" } },
    ]
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { totalSpend: "desc" },
    include: {
      _count: { select: { bookings: true, orders: true } },
    },
  })

  return NextResponse.json({ success: true, data: customers })
}
