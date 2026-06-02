// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

// GET /api/bookings — list bookings (admin + manager)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const stage = searchParams.get("stage")
  const workerId = searchParams.get("workerId")
  const search = searchParams.get("search")

  const where: any = {}
  if (stage) where.stage = stage
  if (workerId) where.assignedWorkerId = workerId
  if (search) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search, mode: "insensitive" } },
      { carPlate: { contains: search, mode: "insensitive" } },
      { carMake: { contains: search, mode: "insensitive" } },
    ]
  }

  // Workers only see their own assigned jobs
  if (session.user.role === "WORKER") {
    where.assignedWorkerId = session.user.id
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { scheduledDate: "asc" },
    include: {
      assignedWorker: { select: { id: true, name: true, avatar: true } },
      intake: { select: { id: true, receivedAt: true } },
    },
  })

  return NextResponse.json({ success: true, data: bookings })
}

// POST /api/bookings — create booking (public — from booking widget)
const createSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().min(10),
  carMake: z.string().min(1),
  carModel: z.string().min(1),
  carYear: z.string().optional(),
  carColour: z.string().optional(),
  carPlate: z.string().optional(),
  serviceType: z.string(),
  serviceName: z.string(),
  servicePrice: z.number(),
  scheduledDate: z.string(),
  depositAmount: z.number().optional(),
  customerNotes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    // Find or create customer
    let customer = data.customerEmail
      ? await prisma.customer.findFirst({ where: { email: data.customerEmail } })
      : null

    if (!customer && data.customerPhone) {
      customer = await prisma.customer.findFirst({ where: { phone: data.customerPhone } })
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: data.customerName,
          email: data.customerEmail,
          phone: data.customerPhone,
          carMake: data.carMake,
          carModel: data.carModel,
          carYear: data.carYear,
          carColour: data.carColour,
          carPlate: data.carPlate,
        },
      })
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        carMake: data.carMake,
        carModel: data.carModel,
        carYear: data.carYear,
        carColour: data.carColour,
        carPlate: data.carPlate,
        serviceType: data.serviceType as any,
        serviceName: data.serviceName,
        servicePrice: data.servicePrice,
        scheduledDate: new Date(data.scheduledDate),
        depositAmount: data.depositAmount || 0,
        balanceAmount: data.servicePrice - (data.depositAmount || 0),
        customerNotes: data.customerNotes,
        stage: "BOOKED",
        stageHistory: {
          create: {
            stage: "BOOKED",
            note: "Booking created",
            changedBy: "System",
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: booking }, { status: 201 })
  } catch (err: any) {
    console.error("[BOOKING CREATE]", err)
    if (err.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: "Failed to create booking" }, { status: 500 })
  }
}
